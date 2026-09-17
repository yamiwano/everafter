import type { Metadata } from "next";
import { listTimezones } from "@/lib/timezone";
import { CreateWeddingForm } from "./wedding-form";

export const metadata: Metadata = { title: "New event" };

export default function NewWeddingPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-3xl font-medium">Create your event</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You&apos;ll get a private page and QR code the moment you save.
      </p>
      <div className="mt-8">
        <CreateWeddingForm timezones={listTimezones()} />
      </div>
    </div>
  );
}
