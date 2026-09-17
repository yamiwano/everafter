import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatInTimezone } from "@/lib/timezone";
import { isRevealed } from "@/lib/reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Camera, Users, Lock, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const memberships = await db.weddingMember.findMany({
    where: { userId: user.id, wedding: { deletedAt: null } },
    include: {
      wedding: {
        include: {
          _count: {
            select: {
              photos: { where: { deletedAt: null } },
              guestSessions: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium">My events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every celebration you&apos;re hosting on SnapTime
          </p>
        </div>
        <Button asChild className="snap-gradient border-0 text-primary-foreground hover:opacity-90">
          <Link href="/dashboard/new">
            <Plus className="size-4" /> New event
          </Link>
        </Button>
      </div>

      {memberships.length === 0 ? (
        <Card className="mt-10 border-dashed">
          <CardContent className="flex flex-col items-center py-20 text-center">
            <Sparkles className="size-8 text-snap-magenta" strokeWidth={1.25} />
            <h2 className="mt-5 font-serif text-2xl font-medium">
              Create your first event
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Set the date, pick your reveal moment, and get a QR code your
              guests can scan — wedding, party, or anything in between.
            </p>
            <Button asChild className="mt-6 snap-gradient border-0 text-primary-foreground hover:opacity-90">
              <Link href="/dashboard/new">
                <Plus className="size-4" /> Create an event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {memberships.map(({ wedding }) => {
            const revealed = isRevealed(wedding);
            return (
              <Link
                key={wedding.id}
                href={`/dashboard/weddings/${wedding.id}`}
                className="group"
              >
                <Card className="transition-shadow group-hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-serif text-2xl font-medium">
                        {wedding.coupleNames}
                      </h2>
                      <Badge variant={revealed ? "default" : "secondary"}>
                        {revealed ? (
                          <><Sparkles className="size-3" /> Revealed</>
                        ) : (
                          <><Lock className="size-3" /> Sealed</>
                        )}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatInTimezone(wedding.weddingDate, "UTC", {
                        dateStyle: "long",
                        timeStyle: undefined,
                      })}{" "}
                      · {wedding.location}
                    </p>
                    <div className="mt-5 flex gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Camera className="size-4" strokeWidth={1.5} />
                        {wedding._count.photos} photos
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="size-4" strokeWidth={1.5} />
                        {wedding._count.guestSessions} guests
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
