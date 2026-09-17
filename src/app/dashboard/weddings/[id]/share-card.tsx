"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download, ExternalLink, Printer } from "lucide-react";

export function ShareCard({
  weddingId,
  joinUrl,
}: {
  weddingId: string;
  joinUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="rounded-2xl border border-border bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/weddings/${weddingId}/qr?size=512`}
          alt="Event QR code"
          className="mx-auto size-48"
        />
      </div>
      <p className="mt-4 break-all rounded-xl border border-border bg-muted/70 px-3 py-2.5 text-center font-mono text-xs text-muted-foreground">
        {joinUrl}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/weddings/${weddingId}/qr?size=2048&download=1`}>
            <Download className="size-3.5" /> QR PNG
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={joinUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3.5" /> Open
          </a>
        </Button>
      </div>
      <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <Printer className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium">Print for every table</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Download the QR PNG and place it on menus, place cards, or a welcome
              sign. Guests scan once and the camera opens — no app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
