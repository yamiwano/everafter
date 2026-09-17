import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findWeddingBySlug } from "@/lib/wedding-api";
import { getGuestSession } from "@/lib/guest";
import { isRevealed, msUntilReveal, ensureRevealMarked } from "@/lib/reveal";

/**
 * Public wedding status. Server-authoritative: the client's countdown is
 * seeded from `msUntilReveal` computed with the server clock, and the
 * gallery only unlocks when this endpoint (and every photo endpoint)
 * agrees the reveal instant has passed.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const wedding = await findWeddingBySlug(slug);
  if (!wedding) {
    return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
  }

  const revealed = isRevealed(wedding);
  if (revealed) await ensureRevealMarked(wedding);

  const [photoCount, guestCount, guest] = await Promise.all([
    db.photo.count({
      where: { weddingId: wedding.id, deletedAt: null, status: "APPROVED" },
    }),
    db.guestSession.count({ where: { weddingId: wedding.id } }),
    getGuestSession(wedding.id),
  ]);

  return NextResponse.json(
    {
      slug: wedding.slug,
      coupleNames: wedding.coupleNames,
      location: wedding.location,
      weddingDate: wedding.weddingDate.toISOString().slice(0, 10),
      timezone: wedding.timezone,
      revealAtUtc: wedding.revealAt.toISOString(),
      revealed,
      msUntilReveal: msUntilReveal(wedding),
      serverTime: new Date().toISOString(),
      photoCount,
      guestCount,
      welcomeMessage: wedding.settings?.welcomeMessage ?? null,
      showAttribution: wedding.settings?.showAttribution ?? true,
      allowGuestDownloads: wedding.settings?.allowGuestDownloads ?? true,
      maxPhotosPerGuest: wedding.settings?.maxPhotosPerGuest ?? 30,
      guest: guest ? { id: guest.id, displayName: guest.displayName } : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
