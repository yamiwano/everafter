import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { findWeddingBySlug } from "@/lib/wedding-api";
import { getGuestSession } from "@/lib/guest";
import { isRevealed, msUntilReveal } from "@/lib/reveal";
import { GuestExperience, type WeddingStatus } from "./guest-experience";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await findWeddingBySlug(slug);
  return {
    title: wedding ? `${wedding.coupleNames} — Wedding camera` : "Wedding",
    description: wedding
      ? `Capture memories at ${wedding.coupleNames}'s wedding. Photos reveal together after the celebration.`
      : undefined,
  };
}

export default async function GuestWeddingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const wedding = await findWeddingBySlug(slug);
  if (!wedding) notFound();

  const [photoCount, guestCount, guest] = await Promise.all([
    db.photo.count({
      where: { weddingId: wedding.id, deletedAt: null, status: "APPROVED" },
    }),
    db.guestSession.count({ where: { weddingId: wedding.id } }),
    getGuestSession(wedding.id),
  ]);

  const initialStatus: WeddingStatus = {
    slug: wedding.slug,
    coupleNames: wedding.coupleNames,
    location: wedding.location,
    weddingDate: wedding.weddingDate.toISOString().slice(0, 10),
    timezone: wedding.timezone,
    revealAtUtc: wedding.revealAt.toISOString(),
    revealed: isRevealed(wedding),
    msUntilReveal: msUntilReveal(wedding),
    serverTime: new Date().toISOString(),
    photoCount,
    guestCount,
    welcomeMessage: wedding.settings?.welcomeMessage ?? null,
    showAttribution: wedding.settings?.showAttribution ?? true,
    allowGuestDownloads: wedding.settings?.allowGuestDownloads ?? true,
    maxPhotosPerGuest: wedding.settings?.maxPhotosPerGuest ?? 30,
    guest: guest ? { id: guest.id, displayName: guest.displayName } : null,
  };

  return <GuestExperience initialStatus={initialStatus} />;
}
