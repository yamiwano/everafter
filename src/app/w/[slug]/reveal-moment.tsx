"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

/** Full-screen moment shown once, when the gallery unlocks. */
export function RevealMoment({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Timers run exactly once per mount; parent re-renders must not reset them.
  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 2600),
      setTimeout(() => onDoneRef.current(), 3600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[oklch(0.16_0.01_60)] px-8 text-center transition-opacity duration-1000 ${
        stage === 2 ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`transition-all duration-1000 ${
          stage >= 1 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <Sparkles className="mx-auto size-10 text-amber-100/80" strokeWidth={1} />
        <h1 className="mt-8 font-serif text-4xl font-medium tracking-[0.15em] text-amber-50 uppercase sm:text-5xl">
          The memories
          <br />
          are here
        </h1>
        <p className="mt-6 text-sm tracking-widest text-amber-100/60 uppercase">
          Captured by everyone · Revealed together
        </p>
      </div>
    </div>
  );
}
