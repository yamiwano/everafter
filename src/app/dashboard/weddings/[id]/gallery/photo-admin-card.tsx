"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import {
  setPhotoStatusAction,
  deletePhotoAction,
} from "@/app/dashboard/actions";

export function PhotoAdminCard({
  weddingId,
  photo,
  moderationEnabled,
}: {
  weddingId: string;
  photo: {
    id: string;
    thumbUrl: string;
    contributorName: string;
    status: string;
    createdAt: string;
    reportCount: number;
  };
  moderationEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.thumbUrl}
        alt={`Photo by ${photo.contributorName}`}
        loading="lazy"
        className="aspect-square w-full object-cover"
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
        {photo.status === "PENDING" && (
          <Badge className="bg-amber-500 text-white">Pending</Badge>
        )}
        {photo.status === "REJECTED" && (
          <Badge variant="destructive">Rejected</Badge>
        )}
        {photo.reportCount > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {photo.reportCount} report{photo.reportCount === 1 ? "" : "s"}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-2.5">
        <p className="truncate text-xs text-muted-foreground">
          {photo.contributorName}
        </p>
        <div className="flex gap-1">
          {moderationEnabled && photo.status !== "APPROVED" && (
            <Button
              size="icon"
              variant="outline"
              className="size-7"
              title="Approve"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  setPhotoStatusAction(weddingId, photo.id, "APPROVED"),
                )
              }
            >
              <Check className="size-3.5" />
            </Button>
          )}
          {moderationEnabled && photo.status !== "REJECTED" && (
            <Button
              size="icon"
              variant="outline"
              className="size-7"
              title="Reject"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  setPhotoStatusAction(weddingId, photo.id, "REJECTED"),
                )
              }
            >
              <X className="size-3.5" />
            </Button>
          )}
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="size-7 text-destructive hover:text-destructive"
                title="Delete"
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this photo?</DialogTitle>
                <DialogDescription>
                  The photo will be removed from the gallery and its files
                  deleted from storage. This can&apos;t be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={pending}
                  onClick={() => {
                    setConfirmOpen(false);
                    startTransition(() =>
                      deletePhotoAction(weddingId, photo.id),
                    );
                  }}
                >
                  Delete photo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
