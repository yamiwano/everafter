"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Countdown driven by a server-provided reveal instant and server time.
 * The client clock only advances the display; the offset between server
 * and client is applied so a wrong device clock can't skew it, and
 * unlocking is always re-confirmed with the server.
 */
export function Countdown({
  revealAtIso,
  serverNowIso,
  onComplete,
  className,
  size = "md",
  tone = "light",
}: {
  revealAtIso: string;
  serverNowIso: string;
  onComplete?: () => void;
  className?: string;
  size?: "md" | "lg";
  tone?: "light" | "dark";
}) {
  const initialMs = Math.max(
    0,
    new Date(revealAtIso).getTime() - new Date(serverNowIso).getTime(),
  );
  const [remaining, setRemaining] = useState(initialMs);

  useEffect(() => {
    const target = new Date(revealAtIso).getTime();
    const offset = new Date(serverNowIso).getTime() - Date.now();
    let interval: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      const left = Math.max(0, target - (Date.now() + offset));
      setRemaining(left);
      if (left === 0) {
        if (interval) clearInterval(interval);
        onComplete?.();
      }
    };
    // First tick runs async so the effect body stays free of state updates.
    const kickoff = setTimeout(() => {
      tick();
      interval = setInterval(tick, 1000);
    }, 0);
    return () => {
      clearTimeout(kickoff);
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealAtIso, serverNowIso]);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const cells = [
    { value: days, label: "days" },
    { value: hours, label: "hours" },
    { value: minutes, label: "min" },
    { value: seconds, label: "sec" },
  ];

  return (
    <div className={cn("grid grid-cols-4 gap-2 sm:gap-3", className)}>
      {cells.map(({ value, label }) => (
        <div
          key={label}
          className={cn(
            "rounded-xl py-3 text-center backdrop-blur",
            tone === "dark"
              ? "border border-white/10 bg-white/5"
              : "border border-border/70 bg-background/60",
          )}
        >
          <p
            className={cn(
              "font-serif tabular-nums",
              size === "lg" ? "text-4xl sm:text-5xl" : "text-2xl",
              tone === "dark" && "text-white",
            )}
          >
            {String(value).padStart(2, "0")}
          </p>
          <p
            className={cn(
              "mt-0.5 text-[10px] uppercase tracking-widest",
              tone === "dark" ? "text-white/40" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
