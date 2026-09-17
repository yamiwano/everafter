"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import { updateWeddingAction, type FormState } from "@/app/dashboard/actions";

interface SettingsValues {
  coupleNames: string;
  weddingDate: string;
  location: string;
  timezone: string;
  revealDate: string;
  revealTime: string;
  revealLocked: boolean;
  moderationEnabled: boolean;
  showAttribution: boolean;
  allowGuestDownloads: boolean;
  welcomeMessage: string;
  maxPhotosPerGuest: number;
}

export function SettingsForm({
  weddingId,
  timezones,
  values,
}: {
  weddingId: string;
  timezones: string[];
  values: SettingsValues;
}) {
  const boundAction = updateWeddingAction.bind(null, weddingId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    boundAction,
    null,
  );
  const saved = !pending && Boolean(state?.success);

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-5">
        <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Event details
        </h2>
        <div className="space-y-2">
          <Label htmlFor="coupleNames">Event name</Label>
          <Input
            id="coupleNames"
            name="coupleNames"
            defaultValue={values.coupleNames}
            maxLength={120}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weddingDate">Event date</Label>
            <Input
              id="weddingDate"
              name="weddingDate"
              type="date"
              defaultValue={values.weddingDate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={values.location}
              maxLength={160}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Welcome message for guests</Label>
          <Textarea
            id="welcomeMessage"
            name="welcomeMessage"
            defaultValue={values.welcomeMessage}
            placeholder="We're so glad you're here — capture everything!"
            maxLength={300}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPhotosPerGuest">Shots per guest</Label>
          <Input
            id="maxPhotosPerGuest"
            name="maxPhotosPerGuest"
            type="number"
            min={1}
            max={100}
            defaultValue={values.maxPhotosPerGuest}
          />
          <p className="text-xs text-muted-foreground">
            Like a disposable camera roll. Most events use 10–30 shots.
          </p>
        </div>
      </section>

      <Separator />

      <section className="space-y-5">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Reveal moment
          </h2>
          {values.revealLocked && (
            <p className="mt-2 text-sm text-muted-foreground">
              The gallery has already been revealed — the reveal time can no
              longer be changed.
            </p>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="revealDate">Reveal date</Label>
            <Input
              id="revealDate"
              name="revealDate"
              type="date"
              defaultValue={values.revealDate}
              disabled={values.revealLocked}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revealTime">Reveal time</Label>
            <Input
              id="revealTime"
              name="revealTime"
              type="time"
              defaultValue={values.revealTime}
              disabled={values.revealLocked}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select name="timezone" defaultValue={values.timezone} disabled={values.revealLocked}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Separator />

      <section className="space-y-5">
        <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Guest experience
        </h2>
        {[
          {
            name: "moderationEnabled",
            label: "Moderation mode",
            description: "New photos wait for your approval before appearing in the revealed gallery.",
            checked: values.moderationEnabled,
          },
          {
            name: "showAttribution",
            label: "Show photographer names",
            description: "Display which guest captured each photo in the gallery.",
            checked: values.showAttribution,
          },
          {
            name: "allowGuestDownloads",
            label: "Guest downloads",
            description: "Allow guests to download full-resolution photos after the reveal.",
            checked: values.allowGuestDownloads,
          },
        ].map((toggle) => (
          <div
            key={toggle.name}
            className="flex items-center justify-between gap-6 rounded-lg border border-border p-4"
          >
            <div>
              <Label htmlFor={toggle.name}>{toggle.label}</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {toggle.description}
              </p>
            </div>
            <Switch
              id={toggle.name}
              name={toggle.name}
              defaultChecked={toggle.checked}
            />
          </div>
        ))}
      </section>

      <Button type="submit" size="lg" disabled={pending} className="min-w-40">
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : saved ? (
          <Check className="size-4" />
        ) : null}
        {saved ? "Saved" : "Save changes"}
      </Button>
    </form>
  );
}
