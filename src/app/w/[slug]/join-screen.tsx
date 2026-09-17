"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";
import type { WeddingStatus } from "./guest-experience";

export function JoinScreen({
  status,
  onJoined,
}: {
  status: WeddingStatus;
  onJoined: (displayName: string) => void;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async (displayName: string) => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/w/${status.slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong — try again.");
        return;
      }
      onJoined(json.guest.displayName);
    } catch {
      setError("Couldn't reach the server. Check your connection and retry.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div aria-hidden className="atmosphere pointer-events-none absolute inset-0" />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="animate-fade-up text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            You&apos;re invited to snap
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight tracking-tight text-balance">
            {status.coupleNames}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {new Date(`${status.weddingDate}T12:00:00Z`).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            })}{" "}
            · {status.location}
          </p>
          {status.welcomeMessage && (
            <p className="mx-auto mt-6 max-w-xs font-serif text-lg italic leading-relaxed text-foreground/80">
              “{status.welcomeMessage}”
            </p>
          )}
        </div>

        <div className="mt-12 animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.65)] [animation-delay:80ms]">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-film text-film-foreground">
              <Camera className="size-4.5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium">Your disposable camera</p>
              <p className="text-xs text-muted-foreground">
                {status.maxPhotosPerGuest} shots · sealed until the reveal
              </p>
            </div>
          </div>

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              join(name.trim());
            }}
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (shown with your photos)"
              maxLength={60}
              autoComplete="name"
              className="h-12 text-center"
            />
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Open camera
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              disabled={pending}
              onClick={() => join("")}
            >
              Continue as a guest
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {status.photoCount} memories captured so far by {status.guestCount}{" "}
          {status.guestCount === 1 ? "guest" : "guests"}
        </p>
      </main>
      <footer className="relative pb-6 text-center text-[11px] tracking-wide text-muted-foreground">
        Powered by <span className="font-semibold text-foreground/80">SnapTime</span>
      </footer>
    </div>
  );
}
