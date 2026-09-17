import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireGuestContext } from "@/lib/wedding-api";
import { isRevealed, ensureRevealMarked } from "@/lib/reveal";
import { storage } from "@/lib/storage";

const PAGE_SIZE = 40;

/**
 * The full wedding gallery. HARD-LOCKED until the reveal instant has
 * passed on the SERVER clock — before that this endpoint returns 403 no
 * matter what the client claims.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ctx = await requireGuestContext(slug);
  if (!ctx.ok) return ctx.response;
  const { wedding, guest } = ctx;

  if (!isRevealed(wedding)) {
    return NextResponse.json(
      { error: "The gallery is still sealed.", code: "LOCKED" },
      { status: 403 },
    );
  }
  await ensureRevealMarked(wedding);

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const photos = await db.photo.findMany({
    where: { weddingId: wedding.id, deletedAt: null, status: "APPROVED" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      favorites: { where: { guestSessionId: guest.id }, select: { id: true } },
      _count: { select: { favorites: true } },
    },
  });

  const hasMore = photos.length > PAGE_SIZE;
  const page = hasMore ? photos.slice(0, PAGE_SIZE) : photos;
  const showAttribution = wedding.settings?.showAttribution ?? true;

  const items = await Promise.all(
    page.map(async (p) => ({
      id: p.id,
      thumbUrl: await storage.getSignedUrl(p.thumbKey, 3600),
      mediumUrl: await storage.getSignedUrl(p.mediumKey, 3600),
      width: p.width,
      height: p.height,
      contributorName: showAttribution ? p.contributorName : null,
      mine: p.guestSessionId === guest.id,
      favorited: p.favorites.length > 0,
      favoriteCount: p._count.favorites,
      createdAt: p.createdAt.toISOString(),
    })),
  );

  return NextResponse.json(
    {
      photos: items,
      nextCursor: hasMore ? page[page.length - 1].id : null,
      allowDownloads: wedding.settings?.allowGuestDownloads ?? true,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
