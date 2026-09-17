import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  href?: string | null;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/icon.png"
        alt=""
        width={40}
        height={40}
        className={cn("size-8 rounded-lg object-cover", markClassName)}
        priority
      />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Snap<span className="snap-text-gradient">Time</span>
        </span>
      )}
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
