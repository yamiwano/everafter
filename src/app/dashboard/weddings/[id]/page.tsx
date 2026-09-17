import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireWeddingAccess } from "@/lib/auth";
import { env } from "@/lib/env";
import { formatInTimezone } from "@/lib/timezone";
import { isRevealed } from "@/lib/reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/countdown";
import { ShareCard } from "./share-card";
import { Camera, Users, Flag, Download, Lock, Sparkles, Hourglass } from "lucide-react";

export const metadata: Metadata = { title: "Event overview" };

function UploadsChart({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5">
        {buckets.map((b, i) => (
          <div key={i} className="group relative flex-1">
            <div
              className="w-full rounded-t-sm bg-foreground/70 transition-colors group-hover:bg-foreground"
              style={{ height: `${Math.max(3, (b.count / max) * 130)}px` }}
            />
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
              {b.count}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{buckets[0]?.label}</span>
        <span>{buckets[buckets.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export default async function WeddingOverviewPage({
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
  const revealed = isRevealed(wedding);

  const [photoCount, pendingCount, guestCount, contributorCount, openReports, photos] =
    await Promise.all([
      db.photo.count({ where: { weddingId: id, deletedAt: null } }),
      db.photo.count({ where: { weddingId: id, deletedAt: null, status: "PENDING" } }),
      db.guestSession.count({ where: { weddingId: id } }),
      db.photo
        .groupBy({
          by: ["guestSessionId"],
          where: { weddingId: id, deletedAt: null },
        })
        .then((groups) => groups.length),
      db.photoReport.count({
        where: { photo: { weddingId: id }, resolvedAt: null },
      }),
      db.photo.findMany({
        where: { weddingId: id, deletedAt: null },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  // Uploads-over-time: 24 buckets across the activity window.
  let buckets: { label: string; count: number }[] = [];
  if (photos.length > 0) {
    const first = photos[0].createdAt.getTime();
    const last = Math.max(photos[photos.length - 1].createdAt.getTime(), first + 1);
    const span = last - first;
    const n = 24;
    buckets = Array.from({ length: n }, () => ({
      label: "",
      count: 0,
    }));
    for (const p of photos) {
      const idx = Math.min(n - 1, Math.floor(((p.createdAt.getTime() - first) / span) * n));
      buckets[idx].count++;
    }
    const fmt = (t: number) =>
      formatInTimezone(new Date(t), wedding.timezone, {
        dateStyle: undefined,
        timeStyle: undefined,
        month: "short",
        day: "numeric",
        hour: "numeric",
      });
    buckets[0].label = fmt(first);
    buckets[buckets.length - 1].label = fmt(last);
  }

  const joinUrl = `${env.appUrl}/w/${wedding.slug}`;
  const participation = guestCount > 0 ? Math.round((contributorCount / guestCount) * 100) : 0;

  const stats = [
    { icon: Camera, label: "Photos captured", value: photoCount },
    { icon: Users, label: "Guests joined", value: guestCount },
    { icon: Hourglass, label: "Guest participation", value: `${participation}%` },
    { icon: Flag, label: "Open reports", value: openReports },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Reveal status */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-serif text-xl font-medium">
              {revealed ? "The gallery is open" : "Gallery sealed"}
            </CardTitle>
            <Badge variant={revealed ? "default" : "secondary"}>
              {revealed ? (
                <><Sparkles className="size-3" /> Revealed</>
              ) : (
                <><Lock className="size-3" /> Counting down</>
              )}
            </Badge>
          </CardHeader>
          <CardContent>
            {revealed ? (
              <p className="text-sm text-muted-foreground">
                Revealed{" "}
                {formatInTimezone(wedding.revealAt, wedding.timezone)} (
                {wedding.timezone.replaceAll("_", " ")}). Guests can browse,
                favorite, and download the gallery.
              </p>
            ) : (
              <>
                <Countdown
                  revealAtIso={wedding.revealAt.toISOString()}
                  serverNowIso={new Date().toISOString()}
                  className="max-w-md"
                />
                <p className="mt-4 text-sm text-muted-foreground">
                  Reveals {formatInTimezone(wedding.revealAt, wedding.timezone)}{" "}
                  ({wedding.timezone.replaceAll("_", " ")})
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
                <p className="mt-3 font-serif text-3xl">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl font-medium">
              Uploads over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No uploads yet — activity will appear here once guests start
                capturing.
              </p>
            ) : (
              <UploadsChart buckets={buckets} />
            )}
          </CardContent>
        </Card>

        {pendingCount > 0 && (
          <Card className="border-snap-orange/30 bg-snap-orange/10">
            <CardContent className="flex items-center justify-between p-5">
              <p className="text-sm">
                <span className="font-medium">{pendingCount} photo{pendingCount === 1 ? "" : "s"}</span>{" "}
                waiting for moderation approval.
              </p>
              <Button asChild size="sm" variant="outline">
                <a href={`/dashboard/weddings/${id}/gallery`}>Review</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right column: QR + downloads */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl tracking-tight">
              Guest QR code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Print this on every table. Guests scan once — camera opens, no app.
            </p>
            <ShareCard weddingId={wedding.id} joinUrl={joinUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl font-medium">
              Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every original photo, full resolution, in one ZIP archive.
            </p>
            <Button asChild className="mt-4 w-full" disabled={photoCount === 0}>
              <a href={`/api/weddings/${wedding.id}/download`}>
                <Download className="size-4" /> Download gallery
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
