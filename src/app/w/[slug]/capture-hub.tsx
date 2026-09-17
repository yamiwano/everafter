"use client";

import { useCallback, useEffect, useState } from "react";
import { Countdown } from "@/components/countdown";
import { CameraCapture } from "./camera-capture";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";
import type { WeddingStatus } from "./guest-experience";

interface OwnPhoto {
  id: string;
  thumbUrl: string;
  status?: string;
}

export function CaptureHub({
  status,
  onCountdownComplete,
}: {
  status: WeddingStatus;
  onCountdownComplete: () => void;
}) {
  const [ownPhotos, setOwnPhotos] = useState<OwnPhoto[]>([]);
  const [shotsTotal, setShotsTotal] = useState(status.maxPhotosPerGuest);
  const [toast, setToast] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/w/${status.slug}/photos`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) {
          setOwnPhotos(json.photos);
          setShotsTotal(json.shotsTotal);
        }
      })
      .catch(() => {});
  }, [status.slug]);

  const showToast = useCallback((kind: "ok" | "error", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const shotsUsed = ownPhotos.length;
  const shotsLeft = Math.max(0, shotsTotal - shotsUsed);

  const revealLocal = new Date(status.revealAtUtc).toLocaleString("en-US", {
    timeZone: status.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-dvh bg-film text-film-foreground">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-film/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
          <p className="font-serif text-lg tracking-tight">{status.coupleNames}</p>
          <p className="text-xs text-white/55">
            <span className="font-medium text-white">{shotsLeft}</span>{" "}
            {shotsLeft === 1 ? "shot" : "shots"} left
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-14">
        {toast && (
          <div
            className={`fixed inset-x-5 top-20 z-50 mx-auto max-w-md rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              toast.kind === "ok"
                ? "border-white/15 bg-white/10 text-white"
                : "border-destructive/40 bg-destructive/20 text-red-100"
            }`}
          >
            <span className="flex items-center gap-2">
              {toast.kind === "ok" && <CheckCircle2 className="size-4" />}
              {toast.text}
            </span>
          </div>
        )}

        <div className="mt-5">
          <CameraCapture
            slug={status.slug}
            disabled={shotsLeft === 0}
            shotsUsed={shotsUsed}
            shotsTotal={shotsTotal}
            onUploaded={(photo) => {
              setOwnPhotos((prev) => [photo, ...prev]);
              showToast("ok", "Memory saved — sealed until the reveal.");
            }}
            onError={(message) => showToast("error", message)}
          />
        </div>

        {ownPhotos.length > 0 && (
          <section className="mt-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-white/45">
              Your roll · {shotsUsed}/{shotsTotal}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ownPhotos.map((photo) => (
                <div key={photo.id} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbUrl}
                    alt="Your photo"
                    className="size-[4.5rem] rounded-xl border border-white/10 object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-white/12 bg-white/5">
            <Lock className="size-4 text-snap-magenta" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 font-serif text-2xl tracking-tight">
            The gallery is sealed
          </h2>
          <p className="mt-2 text-sm text-white/55">
            <span className="font-medium text-white/90">
              {status.photoCount} {status.photoCount === 1 ? "memory" : "memories"}
            </span>{" "}
            captured by {status.guestCount}{" "}
            {status.guestCount === 1 ? "guest" : "guests"} so far
          </p>
          <div className="mt-6">
            <Countdown
              revealAtIso={status.revealAtUtc}
              serverNowIso={status.serverTime}
              onComplete={onCountdownComplete}
              tone="dark"
            />
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-white/45">
            <Sparkles className="size-3.5 text-snap-orange" />
            Revealing {revealLocal}
          </p>
        </section>

        <p className="mt-8 text-center text-[11px] tracking-wide text-white/35">
          Powered by <span className="font-semibold text-white/70">SnapTime</span>
        </p>
      </main>
    </div>
  );
}
