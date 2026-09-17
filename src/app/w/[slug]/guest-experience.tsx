"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { JoinScreen } from "./join-screen";
import { CaptureHub } from "./capture-hub";
import { RevealMoment } from "./reveal-moment";
import { RevealedGallery } from "./revealed-gallery";

export interface WeddingStatus {
  slug: string;
  coupleNames: string;
  location: string;
  weddingDate: string;
  timezone: string;
  revealAtUtc: string;
  revealed: boolean;
  msUntilReveal: number;
  serverTime: string;
  photoCount: number;
  guestCount: number;
  welcomeMessage: string | null;
  showAttribution: boolean;
  allowGuestDownloads: boolean;
  maxPhotosPerGuest: number;
  guest: { id: string; displayName: string } | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Guest state machine:
 *   join → capture hub (camera + sealed-gallery countdown) → reveal moment → gallery
 *
 * The reveal is confirmed with the SERVER before anything unlocks: when the
 * local countdown reaches zero we poll /status until the server agrees.
 */
export function GuestExperience({
  initialStatus,
}: {
  initialStatus: WeddingStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [joined, setJoined] = useState(Boolean(initialStatus.guest));
  const [showRevealMoment, setShowRevealMoment] = useState(false);
  const wasRevealed = useRef(initialStatus.revealed);
  const confirming = useRef(false);
  const statusRef = useRef(initialStatus);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const refreshStatus = useCallback(async (): Promise<WeddingStatus | null> => {
    try {
      const res = await fetch(`/api/w/${initialStatus.slug}/status`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const next: WeddingStatus = await res.json();
      setStatus(next);
      if (next.revealed && !wasRevealed.current) {
        wasRevealed.current = true;
        setShowRevealMoment(true);
      }
      return next;
    } catch {
      return null;
    }
  }, [initialStatus.slug]);

  // Background polling keeps counts fresh and catches the reveal even if
  // the tab sits idle: every 25s while locked, faster near the moment.
  // A cancellation flag guarantees exactly one active loop.
  useEffect(() => {
    if (status.revealed) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        const current = statusRef.current;
        const msLeft =
          new Date(current.revealAtUtc).getTime() -
          new Date(current.serverTime).getTime();
        await sleep(msLeft < 60_000 ? 3_000 : 25_000);
        if (cancelled) return;
        const next = await refreshStatus();
        if (next?.revealed) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status.revealed, refreshStatus]);

  // Countdown finished on the client — confirm with the server before
  // unlocking anything. Guarded so overlapping countdowns can't stack.
  const handleCountdownComplete = useCallback(() => {
    if (confirming.current || wasRevealed.current) return;
    confirming.current = true;
    (async () => {
      for (let attempt = 0; attempt < 40; attempt++) {
        const next = await refreshStatus();
        if (next?.revealed) break;
        await sleep(2000);
      }
      confirming.current = false;
    })();
  }, [refreshStatus]);

  if (!joined) {
    return (
      <JoinScreen
        status={status}
        onJoined={(displayName) => {
          setStatus((s) => ({ ...s, guest: { id: "self", displayName } }));
          setJoined(true);
        }}
      />
    );
  }

  if (showRevealMoment) {
    return <RevealMoment onDone={() => setShowRevealMoment(false)} />;
  }

  if (status.revealed) {
    return <RevealedGallery status={status} />;
  }

  return (
    <CaptureHub status={status} onCountdownComplete={handleCountdownComplete} />
  );
}
