"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createWeddingAction, type FormState } from "../actions";

export function CreateWeddingForm({ timezones }: { timezones: string[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createWeddingAction,
    null,
  );
  const guessedTz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/New_York";
  const defaultTz = timezones.includes(guessedTz) ? guessedTz : "America/New_York";

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-5">
        <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
          The celebration
        </h2>
        <div className="space-y-2">
          <Label htmlFor="coupleNames">Event name</Label>
          <Input
            id="coupleNames"
            name="coupleNames"
            placeholder="Summer rooftop · Ava & Noah · Jordan's 30th"
            required
            maxLength={120}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weddingDate">Event date</Label>
            <Input id="weddingDate" name="weddingDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="Brooklyn, New York"
              required
              maxLength={160}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            The reveal moment
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Photos stay sealed until this exact moment. Many hosts choose the
            morning after — or a few days later when everyone is ready to relive it.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="revealDate">Reveal date</Label>
            <Input id="revealDate" name="revealDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revealTime">Reveal time</Label>
            <Input
              id="revealTime"
              name="revealTime"
              type="time"
              defaultValue="10:00"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select name="timezone" defaultValue={defaultTz}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The reveal happens at this local time, no matter where guests are.
          </p>
        </div>
      </section>

      <Button type="submit" size="lg" className="w-full snap-gradient border-0 text-primary-foreground hover:opacity-90" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create event
      </Button>
    </form>
  );
}
