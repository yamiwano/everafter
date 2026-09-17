import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireWeddingAccess } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { resolveReportAction } from "@/app/dashboard/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhotoAdminCard } from "./photo-admin-card";
import { Camera } from "lucide-react";

export const metadata: Metadata = { title: "Gallery & moderation" };

export default async function HostGalleryPage({
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
  const moderationEnabled =
    membership.wedding.settings?.moderationEnabled ?? false;

  const [photos, reports] = await Promise.all([
    db.photo.findMany({
      where: { weddingId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { reports: { where: { resolvedAt: null } } } },
      },
    }),
    db.photoReport.findMany({
      where: { photo: { weddingId: id }, resolvedAt: null },
      include: { photo: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      thumbUrl: await storage.getSignedUrl(p.thumbKey, 3600),
      contributorName: p.contributorName,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      reportCount: p._count.reports,
    })),
  );

  const pending = items.filter((p) => p.status === "PENDING");
  const rest = items.filter((p) => p.status !== "PENDING");

  return (
    <div className="space-y-8">
      {reports.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="font-serif text-xl font-medium">
              Open reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{report.reason}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Photo by {report.photo.contributorName} ·{" "}
                    {report.createdAt.toLocaleString()}
                  </p>
                </div>
                <form
                  action={resolveReportAction.bind(null, id, report.id)}
                >
                  <Button size="sm" variant="outline" type="submit">
                    Mark resolved
                  </Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-xl font-medium">
            Awaiting approval ({pending.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pending.map((photo) => (
              <PhotoAdminCard
                key={photo.id}
                weddingId={id}
                photo={photo}
                moderationEnabled={moderationEnabled}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-serif text-xl font-medium">
          All photos ({rest.length})
        </h2>
        {rest.length === 0 && pending.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Camera className="size-7 text-muted-foreground" strokeWidth={1.25} />
              <p className="mt-4 text-sm text-muted-foreground">
                No photos yet. Share the QR code and the memories will start
                arriving.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {rest.map((photo) => (
              <PhotoAdminCard
                key={photo.id}
                weddingId={id}
                photo={photo}
                moderationEnabled={moderationEnabled}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
