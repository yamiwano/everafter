"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function WeddingNav({ weddingId }: { weddingId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/weddings/${weddingId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/gallery`, label: "Gallery" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <nav className="flex gap-1 rounded-lg border border-border bg-card p-1">
      {tabs.map((tab) => {
        const active =
          tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
