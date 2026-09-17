import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireGuestContext } from "@/lib/wedding-api";
import { isRevealed } from "@/lib/reveal";
import { storage } from "@/lib/storage";

/** Download the original file for one photo (post-reveal, when enabled). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; photoId: string }> },
) {
  const { slug, photoId } = await params;
  const ctx = await requireGuestContext(slug);
  if (!ctx.ok) return ctx.response;
  const { wedding, guest } = ctx;

  const photo = await db.photo.findFirst({
    where: { id: photoId, weddingId: wedding.id, deletedAt: null, status: "APPROVED" },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const isOwnPhoto = photo.guestSessionId === guest.id;
  if (!isRevealed(wedding) && !isOwnPhoto) {
    return NextResponse.json({ error: "The gallery is still sealed." }, { status: 403 });
  }
  if (!(wedding.settings?.allowGuestDownloads ?? true) && !isOwnPhoto) {
    return NextResponse.json({ error: "Downloads are disabled for this wedding." }, { status: 403 });
  }

  const data = await storage.get(photo.storageKey);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Disposition": `attachment; filename="everafter-${wedding.slug}-${photo.id.slice(0, 8)}.jpg"`,
      "Cache-Control": "private, no-store",
    },
  });
}
