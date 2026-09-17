import { Camera, ImageIcon, Lock, SwitchCamera, Zap } from "lucide-react";
import { PhoneFrame } from "./phone-frame";

export function CameraProductMock({ float = true }: { float?: boolean }) {
  return (
    <PhoneFrame float={float}>
      <div className="flex h-full flex-col bg-gradient-to-b from-[#1a1628] via-[#12101a] to-[#0a090f] px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/10">
            <div className="size-3.5 rounded-full border border-white/50" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90">
            <Camera className="size-3" strokeWidth={1.75} />
            4 / 15
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-white/10">
            <ImageIcon className="size-3.5 text-white/80" strokeWidth={1.5} />
          </div>
        </div>

        <div className="relative mt-5 flex-1 overflow-hidden rounded-[1.35rem]">
          <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_40%_30%,#ff8a3d_0%,#f00084_42%,#4b2588_78%,#1a1630_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,transparent_40%,rgba(0,0,0,0.4))]" />
          <div className="absolute inset-x-6 top-[28%] text-center">
            <p className="font-serif text-2xl italic text-white/95">Summer Rooftop</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
              Just snapped
            </p>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-white/50">
            <span>Guest roll</span>
            <span>Just now</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between px-3">
          <Zap className="size-5 text-white/70" strokeWidth={1.5} />
          <div className="flex size-16 items-center justify-center rounded-full border-[3px] border-snap-orange/80 bg-white/15">
            <div className="size-12 rounded-full bg-white" />
          </div>
          <SwitchCamera className="size-5 text-white/70" strokeWidth={1.5} />
        </div>
      </div>
    </PhoneFrame>
  );
}

export function QrProductMock({ float = false }: { float?: boolean }) {
  return (
    <PhoneFrame float={float}>
      <div className="flex h-full flex-col bg-[#0f0d16] px-5 pt-12 pb-8 text-white">
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
          Scan to capture
        </p>
        <h3 className="mt-3 text-center font-serif text-3xl leading-none">
          Capture the night
        </h3>
        <p className="mt-2 text-center text-xs text-white/55">
          Disposable camera · no app
        </p>
        <div className="mx-auto mt-8 grid size-40 place-items-center rounded-2xl border border-white/10 bg-white p-4 shadow-sm">
          <div
            className="size-full rounded-md"
            style={{
              backgroundImage:
                "linear-gradient(#12101a 2px, transparent 2px), linear-gradient(90deg, #12101a 2px, transparent 2px)",
              backgroundSize: "18% 18%",
              backgroundPosition: "center",
            }}
          />
        </div>
        <p className="mt-auto text-center font-serif text-lg italic text-white/70">
          Jordan&apos;s 30th · Sat night
        </p>
      </div>
    </PhoneFrame>
  );
}

export function SealedProductMock({ float = false }: { float?: boolean }) {
  return (
    <PhoneFrame float={float}>
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#1a1628] to-[#0a090f] px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-white/15 bg-white/5">
          <Lock className="size-5 text-snap-orange" strokeWidth={1.4} />
        </div>
        <p className="mt-6 font-serif text-3xl italic text-white">Summer Rooftop</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-white/45">
          Gallery sealed
        </p>
        <div className="mt-8 grid w-full grid-cols-4 gap-2">
          {[
            ["06", "days"],
            ["14", "hrs"],
            ["32", "min"],
            ["09", "sec"],
          ].map(([v, l]) => (
            <div
              key={l}
              className="rounded-xl border border-white/10 bg-white/5 py-3"
            >
              <p className="font-serif text-xl text-white">{v}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/40">
                {l}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-white/55">
          <span className="text-white/90">342</span> memories waiting
        </p>
      </div>
    </PhoneFrame>
  );
}

export function EventDashboardMock({ float = false }: { float?: boolean }) {
  return (
    <PhoneFrame float={float}>
      <div className="flex h-full flex-col bg-[#12101a] px-4 pt-11 pb-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-2xl leading-tight">Summer Rooftop</p>
            <span className="mt-2 inline-block rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
              16 June · 9:00 PM
            </span>
          </div>
          <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#4b2588,#f00084,#ff6d00)]" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ["Guests", "48"],
            ["Photos", "213"],
            ["Left", "31h"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl bg-white/8 px-2 py-3 text-center"
            >
              <p className="text-[10px] text-white/45">{label}</p>
              <p className="mt-1 text-lg font-medium">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/10 py-3 text-center text-xs">
            Open camera
          </div>
          <div className="rounded-xl bg-snap-orange py-3 text-center text-xs text-primary-foreground">
            Share event
          </div>
        </div>
        <div className="mt-4 flex-1 space-y-3 rounded-2xl bg-white/6 p-4 text-xs text-white/70">
          <div className="flex justify-between">
            <span>Reveal photos at</span>
            <span className="text-white/90">Sun 10:00</span>
          </div>
          <div className="flex justify-between">
            <span>Shots per guest</span>
            <span className="text-white/90">15</span>
          </div>
          <div className="flex justify-between">
            <span>Moderation</span>
            <span className="text-white/90">On</span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
