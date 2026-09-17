"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Download,
  Flag,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Camera,
} from "lucide-react";
import type { WeddingStatus } from "./guest-experience";

interface GalleryPhoto {
  id: string;
  thumbUrl: string;
  mediumUrl: string;
  width: number;
  height: number;
  contributorName: string | null;
  mine: boolean;
  favorited: boolean;
  favoriteCount: number;
  createdAt: string;
}

export function RevealedGallery({ status }: { status: WeddingStatus }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowDownloads, setAllowDownloads] = useState(status.allowGuestDownloads);
  const [filter, setFilter] = useState<"all" | "mine" | "favorites">("all");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [reportTarget, setReportTarget] = useState<GalleryPhoto | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);

  const loadPage = useCallback(
    async (cursor: string | null) => {
      if (loadingMore.current) return;
      loadingMore.current = true;
      try {
        const url = new URL(`/api/w/${status.slug}/gallery`, location.origin);
        if (cursor) url.searchParams.set("cursor", cursor);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        setPhotos((prev) => (cursor ? [...prev, ...json.photos] : json.photos));
        setNextCursor(json.nextCursor);
        setAllowDownloads(json.allowDownloads);
      } finally {
        loadingMore.current = false;
        setLoading(false);
      }
    },
    [status.slug],
  );

  useEffect(() => {
    loadPage(null);
  }, [loadPage]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadPage(nextCursor);
      },
      { rootMargin: "600px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadPage]);

  const visible = photos.filter((p) =>
    filter === "mine" ? p.mine : filter === "favorites" ? p.favorited : true,
  );

  const toggleFavorite = async (photo: GalleryPhoto) => {
    // optimistic
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photo.id
          ? {
              ...p,
              favorited: !p.favorited,
              favoriteCount: p.favoriteCount + (p.favorited ? -1 : 1),
            }
          : p,
      ),
    );
    const res = await fetch(
      `/api/w/${status.slug}/photos/${photo.id}/favorite`,
      { method: "POST" },
    );
    if (!res.ok) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? photo : p)),
      );
    }
  };

  // Viewer keyboard + swipe
  const closeViewer = () => setViewerIndex(null);
  const step = useCallback(
    (dir: 1 | -1) => {
      setViewerIndex((i) => {
        if (i === null) return i;
        const next = i + dir;
        return next < 0 || next >= visible.length ? i : next;
      });
    },
    [visible.length],
  );

  useEffect(() => {
    if (viewerIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerIndex, step]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      step(dx < 0 ? 1 : -1);
    } else if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      closeViewer();
    }
  };

  const current = viewerIndex !== null ? visible[viewerIndex] : null;

  const submitReport = async (reason: string) => {
    if (!reportTarget) return;
    await fetch(`/api/w/${status.slug}/photos/${reportTarget.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setReportTarget(null);
  };

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 py-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            The memories are here
          </p>
          <h1 className="mt-1 font-serif text-3xl font-medium">
            {status.coupleNames}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {photos.length}+ memories · captured by {status.guestCount} guests
          </p>
          <div className="mt-4 flex justify-center gap-1.5">
            {(
              [
                ["all", "Everyone"],
                ["mine", "My photos"],
                ["favorites", "Favorites"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                  filter === key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 pt-3 sm:px-5 sm:pt-5">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-24 text-center">
            <Camera className="mx-auto size-7 text-muted-foreground" strokeWidth={1.25} />
            <p className="mt-4 text-sm text-muted-foreground">
              {filter === "mine"
                ? "You didn't capture any photos at this wedding."
                : filter === "favorites"
                  ? "No favorites yet — tap the heart on photos you love."
                  : "No photos in the gallery."}
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
            {visible.map((photo, index) => (
              <button
                key={photo.id}
                className="group relative block w-full overflow-hidden rounded-xl border border-border/60 bg-muted"
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                onClick={() => setViewerIndex(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbUrl}
                  alt={photo.contributorName ? `Photo by ${photo.contributorName}` : "Wedding photo"}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {photo.contributorName && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    {photo.contributorName}
                  </span>
                )}
                {photo.favorited && (
                  <Heart className="absolute top-2 right-2 size-4 fill-rose-400 text-rose-400 drop-shadow" />
                )}
              </button>
            ))}
          </div>
        )}
        <div ref={sentinelRef} className="h-px" />
        {nextCursor && (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>

      {/* Fullscreen viewer */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex items-center justify-between p-4">
            <p className="text-sm text-white/70">
              {current.contributorName ? `By ${current.contributorName}` : ""}
              {current.mine && " (you)"}
            </p>
            <button
              onClick={closeViewer}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.mediumUrl}
              alt="Wedding photo"
              className="max-h-full max-w-full object-contain"
            />
            {viewerIndex !== null && viewerIndex > 0 && (
              <button
                onClick={() => step(-1)}
                className="absolute left-3 hidden size-11 items-center justify-center rounded-full bg-white/10 text-white sm:flex"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
            {viewerIndex !== null && viewerIndex < visible.length - 1 && (
              <button
                onClick={() => step(1)}
                className="absolute right-3 hidden size-11 items-center justify-center rounded-full bg-white/10 text-white sm:flex"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Button
              variant="secondary"
              className="rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => toggleFavorite(current)}
            >
              <Heart
                className={`size-4 ${current.favorited ? "fill-rose-400 text-rose-400" : ""}`}
              />
              {current.favoriteCount > 0 ? current.favoriteCount : "Favorite"}
            </Button>
            {allowDownloads && (
              <Button
                variant="secondary"
                className="rounded-full bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <a href={`/api/w/${status.slug}/photos/${current.id}/download`}>
                  <Download className="size-4" /> Save
                </a>
              </Button>
            )}
            <Button
              variant="secondary"
              className="rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setReportTarget(current)}
            >
              <Flag className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Report dialog */}
      <Dialog open={Boolean(reportTarget)} onOpenChange={(o) => !o && setReportTarget(null)}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const reason = new FormData(e.currentTarget).get("reason");
              if (typeof reason === "string" && reason.trim()) {
                submitReport(reason.trim());
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Report this photo</DialogTitle>
              <DialogDescription>
                The couple will review it privately. Thanks for helping keep
                the gallery lovely.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              name="reason"
              placeholder="What's wrong with this photo?"
              className="mt-4"
              maxLength={500}
              required
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setReportTarget(null)}>
                Cancel
              </Button>
              <Button type="submit">Send report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <footer className="mt-4 text-center text-[11px] tracking-wide text-muted-foreground">
        Powered by <span className="font-semibold">SnapTime</span>
      </footer>
    </div>
  );
}
