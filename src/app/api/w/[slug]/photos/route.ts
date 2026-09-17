import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requireGuestContext } from "@/lib/wedding-api";
import { processUpload } from "@/lib/images";
import { storage } from "@/lib/storage";
import { env } from "@/lib/env";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

/** Upload a photo (multipart/form-data, field "photo"). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ctx = await requireGuestContext(slug);
  if (!ctx.ok) return ctx.response;
  const { wedding, guest } = ctx;

  const ip = clientIp(req);
  if (!rateLimit(`upload:${guest.id}`, 12, 60_000).ok) {
    return NextResponse.json(
      { error: "You're uploading very fast — give it a few seconds." },
      { status: 429 },
    );
  }

  // Enforce declared size before reading the body.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > env.uploadMaxBytes + 64 * 1024) {
    return NextResponse.json(
      { error: "Photo is too large (max 10 MB)." },
      { status: 413 },
    );
  }

  const maxPerGuest = wedding.settings?.maxPhotosPerGuest ?? 30;
  const taken = await db.photo.count({
    where: { guestSessionId: guest.id, deletedAt: null },
  });
  if (taken >= maxPerGuest) {
    return NextResponse.json(
      { error: `You've used all ${maxPerGuest} shots on this camera.`, code: "LIMIT" },
      { status: 403 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo attached." }, { status: 400 });
  }
  if (file.size > env.uploadMaxBytes) {
    return NextResponse.json(
      { error: "Photo is too large (max 10 MB)." },
      { status: 413 },
    );
  }

  let processed;
  try {
    processed = await processUpload(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json(
      { error: "That file doesn't look like a supported photo (JPEG, PNG, WebP, HEIC)." },
      { status: 422 },
    );
  }

  const photoId = randomUUID();
  const prefix = `weddings/${wedding.id}/photos/${photoId}`;
  const storageKey = `${prefix}/original.${processed.original.ext}`;
  const mediumKey = `${prefix}/medium.webp`;
  const thumbKey = `${prefix}/thumb.webp`;

  await Promise.all([
    storage.put(storageKey, processed.original.data, processed.original.contentType),
    storage.put(mediumKey, processed.medium.data, "image/webp"),
    storage.put(thumbKey, processed.thumb.data, "image/webp"),
  ]);

  const moderation = wedding.settings?.moderationEnabled ?? false;
  const photo = await db.photo.create({
    data: {
      id: photoId,
      weddingId: wedding.id,
      guestSessionId: guest.id,
      contributorName: guest.displayName,
      storageKey,
      mediumKey,
      thumbKey,
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.original.data.length,
      mimeType: processed.original.contentType,
      status: moderation ? "PENDING" : "APPROVED",
    },
  });

  await audit({
    actorType: "GUEST",
    actorId: guest.id,
    weddingId: wedding.id,
    action: "photo.upload",
    targetType: "photo",
    targetId: photo.id,
    ip,
  });

  const thumbUrl = await storage.getSignedUrl(thumbKey, 3600);
  return NextResponse.json({
    photo: {
      id: photo.id,
      thumbUrl,
      status: photo.status,
      createdAt: photo.createdAt.toISOString(),
    },
    shotsUsed: taken + 1,
    shotsTotal: maxPerGuest,
  });
}

/**
 * The guest's OWN photos (film-strip under the camera). Pre-reveal this is
 * the only photo listing a guest can access, and it is strictly limited to
 * photos captured by their own session.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ctx = await requireGuestContext(slug);
  if (!ctx.ok) return ctx.response;
  const { wedding, guest } = ctx;

  const photos = await db.photo.findMany({
    where: { weddingId: wedding.id, guestSessionId: guest.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const items = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      thumbUrl: await storage.getSignedUrl(p.thumbKey, 3600),
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
  );

  return NextResponse.json(
    {
      photos: items,
      shotsUsed: photos.length,
      shotsTotal: wedding.settings?.maxPhotosPerGuest ?? 30,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
