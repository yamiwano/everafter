import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  float = false,
}: {
  children: React.ReactNode;
  className?: string;
  float?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[min(100%,280px)]",
        float && "animate-float",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[2.4rem] border-[5px] border-white/18 bg-film shadow-[0_40px_80px_-20px_rgba(0,0,0,0.75)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-2.5">
          <div className="h-5 w-22 rounded-full bg-black/90" />
        </div>
        <div className="relative aspect-[9/19.2] overflow-hidden bg-film text-film-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
