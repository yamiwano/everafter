import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireGuestContext } from "@/lib/wedding-api";
import { reportSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; photoId: string }> },
) {
  const { slug, photoId } = await params;
  const ctx = await requireGuestContext(slug);
  if (!ctx.ok) return ctx.response;
  const { wedding, guest } = ctx;

  if (!rateLimit(`report:${guest.id}`, 10, 60 * 60_000).ok) {
    return NextResponse.json({ error: "Too many reports" }, { status: 429 });
  }

  const photo = await db.photo.findFirst({
    where: { id: photoId, weddingId: wedding.id, deletedAt: null },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = reportSchema.safeParse({ reason: body.reason });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await db.photoReport.create({
    data: {
      photoId: photo.id,
      guestSessionId: guest.id,
      reason: parsed.data.reason,
    },
  });
  await audit({
    actorType: "GUEST",
    actorId: guest.id,
    weddingId: wedding.id,
    action: "photo.report",
    targetType: "photo",
    targetId: photo.id,
  });

  return NextResponse.json({ ok: true });
}
