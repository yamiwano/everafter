import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireGuestContext } from "@/lib/wedding-api";
import { isRevealed } from "@/lib/reveal";

/** Toggle a favorite on a photo (post-reveal only). */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string; photoId: string }> },
) {
  const { slug, photoId } = await params;
  const ctx = await requireGuestContext(slug);
  if (!ctx.ok) return ctx.response;
  const { wedding, guest } = ctx;

  if (!isRevealed(wedding)) {
    return NextResponse.json({ error: "The gallery is still sealed." }, { status: 403 });
  }

  // Tenant isolation: the photo must belong to THIS wedding.
  const photo = await db.photo.findFirst({
    where: { id: photoId, weddingId: wedding.id, deletedAt: null, status: "APPROVED" },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const existing = await db.photoFavorite.findFirst({
    where: { photoId: photo.id, guestSessionId: guest.id },
  });

  if (existing) {
    await db.photoFavorite.delete({ where: { id: existing.id } });
  } else {
    await db.photoFavorite.create({
      data: { photoId: photo.id, guestSessionId: guest.id },
    });
  }

  const favoriteCount = await db.photoFavorite.count({
    where: { photoId: photo.id },
  });
  return NextResponse.json({ favorited: !existing, favoriteCount });
}
