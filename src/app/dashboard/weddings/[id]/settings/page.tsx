import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, requireWeddingAccess } from "@/lib/auth";
import { listTimezones, utcToZonedParts } from "@/lib/timezone";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Event settings" };

export default async function WeddingSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  let membership;
  try {
    membership = await requireWeddingAccess(id, user.id);
  } catch {
    notFound();
  }
  const wedding = membership.wedding;
  const settings = wedding.settings;
  const reveal = utcToZonedParts(wedding.revealAt, wedding.timezone);

  return (
    <div className="max-w-xl">
      <SettingsForm
        weddingId={wedding.id}
        timezones={listTimezones()}
        values={{
          coupleNames: wedding.coupleNames,
          weddingDate: wedding.weddingDate.toISOString().slice(0, 10),
          location: wedding.location,
          timezone: wedding.timezone,
          revealDate: reveal.date,
          revealTime: reveal.time,
          revealLocked: Boolean(wedding.revealedAt),
          moderationEnabled: settings?.moderationEnabled ?? false,
          showAttribution: settings?.showAttribution ?? true,
          allowGuestDownloads: settings?.allowGuestDownloads ?? true,
          welcomeMessage: settings?.welcomeMessage ?? "",
          maxPhotosPerGuest: settings?.maxPhotosPerGuest ?? 30,
        }}
      />
    </div>
  );
}
