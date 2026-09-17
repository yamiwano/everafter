import Link from "next/link";
import Image from "next/image";
import {
  QrCode,
  Camera,
  Sparkles,
  Lock,
  Timer,
  Users,
  Download,
  ShieldCheck,
  Smartphone,
  PartyPopper,
  Cake,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import {
  CameraProductMock,
  EventDashboardMock,
  QrProductMock,
  SealedProductMock,
} from "@/components/marketing/product-mocks";

const faqs = [
  {
    q: "Do guests need to install an app?",
    a: "No. Guests scan the QR code at your event, type their name, and the camera opens right in the browser. It works on iPhone and Android with nothing to download.",
  },
  {
    q: "When can everyone see the photos?",
    a: "You choose the exact reveal date and time — right after the party, the next morning, or days later. Until that moment, every photo stays sealed. Guests only see a countdown.",
  },
  {
    q: "Can we review photos before they go public?",
    a: "Yes. Turn on moderation and every photo waits for your approval before it appears in the revealed gallery. You can remove any photo at any time.",
  },
  {
    q: "How many photos can guests take?",
    a: "Each guest gets a roll of shots, just like a disposable camera. You control the number per guest in your event settings — typically 10 to 30.",
  },
  {
    q: "Who owns the photos?",
    a: "You do. Download the complete gallery in full resolution anytime after the reveal. We never use your photos for anything else.",
  },
  {
    q: "Is our gallery private?",
    a: "Completely. Your event lives at an unguessable link, photos are stored in private storage, and every image is delivered through expiring signed URLs. Only your guests can ever see it.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#occasions" className="transition-colors hover:text-foreground">
              Occasions
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button asChild className="snap-gradient border-0 text-primary-foreground hover:opacity-90">
                  <Link href="/signup">Create your event</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden film-grain">
        <div aria-hidden className="atmosphere absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-20 lg:pb-28">
          <div className="animate-fade-up text-center lg:text-left">
            <div className="mb-6 flex justify-center lg:justify-start">
              <Image
                src="/logo.png"
                alt="SnapTime"
                width={280}
                height={186}
                className="h-auto w-[min(100%,280px)] drop-shadow-[0_20px_60px_rgba(240,0,132,0.25)]"
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Disposable camera for every occasion
            </p>
            <h1 className="mt-5 font-serif text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[3.35rem]">
              Every angle of your event.
              <span className="mt-1 block italic text-foreground/55">
                Revealed together.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-muted-foreground lg:mx-0 lg:text-lg">
              Guests scan a QR and open an instant disposable camera — no app.
              Perfect for weddings, parties, birthdays, and everything in between.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-12 snap-gradient border-0 px-8 text-base text-primary-foreground hover:opacity-90"
              >
                <Link href="/signup">Create your event</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No app for guests · Private by design · Full-resolution downloads
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-sm animate-fade-in [animation-delay:120ms]">
            <div
              aria-hidden
              className="absolute -inset-8 rounded-[3rem] bg-[radial-gradient(circle_at_50%_40%,oklch(0.55_0.2_350/0.35),transparent_65%)]"
            />
            <CameraProductMock />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border/50 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl tracking-tight sm:text-5xl">
            Scan. Snap. Reveal.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Set up in minutes. Guests start shooting the moment they scan — like a
            disposable camera on every table.
          </p>

          <div className="mt-16 grid items-end gap-10 md:grid-cols-3">
            {[
              {
                mock: <QrProductMock />,
                step: "01",
                title: (
                  <>
                    Guests scan a QR to open an{" "}
                    <span className="snap-text-gradient italic">instant camera</span>
                  </>
                ),
                body: "Print your code on invites, table cards, or a welcome sign. No app download — the camera opens in their browser.",
              },
              {
                mock: <CameraProductMock float={false} />,
                step: "02",
                title: "A limited film roll",
                body: "Each guest gets a set number of shots. They capture candid moments with intention — then keep celebrating.",
              },
              {
                mock: <SealedProductMock />,
                step: "03",
                title: "One shared unlock",
                body: "Photos stay sealed until your reveal. When the countdown hits zero, everyone sees the full story at once.",
              },
            ].map(({ mock, step, title, body }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-8 scale-[0.92]">{mock}</div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                  {step}
                </p>
                <h3 className="mt-3 font-serif text-2xl">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/50 bg-card">
        <div aria-hidden className="atmosphere absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Your event, your rules
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-balance sm:text-5xl">
              Customize every detail
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              Name, welcome message, reveal time, moderation, and how many shots
              each guest gets on their roll — tuned for your celebration.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                { icon: Camera, text: "Set the film roll size per guest" },
                { icon: Timer, text: "Pick the exact reveal date and timezone" },
                { icon: ShieldCheck, text: "Approve photos before they go public" },
                { icon: QrCode, text: "Share one QR that never changes" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-foreground/85">
                  <Icon className="size-4 shrink-0 text-snap-magenta" strokeWidth={1.5} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-xs">
            <EventDashboardMock float />
          </div>
        </div>
      </section>

      <section id="occasions" className="border-t border-border/50 bg-secondary/35">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            For every celebration
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl tracking-tight sm:text-5xl">
            Weddings, parties, and beyond
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "Weddings",
                body: "Guest perspectives of the day — sealed until you unlock them together.",
              },
              {
                icon: PartyPopper,
                title: "Parties",
                body: "Birthdays, engagements, reunions — candid shots from everyone who showed up.",
              },
              {
                icon: Cake,
                title: "Milestones",
                body: "Graduations, anniversaries, baby showers — memories from every angle.",
              },
              {
                icon: Briefcase,
                title: "Corporate & brands",
                body: "Launches, retreats, and brand nights with one shared album.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card/80 p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-full border border-border bg-secondary">
                  <Icon className="size-5 text-snap-orange" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 font-serif text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reveal" className="border-t border-border/50 bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-sm">
              <SealedProductMock float />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              The moment that matters
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-balance sm:text-5xl">
              Anticipation is half the magic
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Photos disappear into the vault the moment they&apos;re captured.
              Guests see only a countdown — until your reveal arrives and the
              gallery opens for everyone at once.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                { icon: Lock, text: "Sealed gallery — no peeking, not even by accident" },
                { icon: Timer, text: "You choose the reveal date, time, and timezone" },
                { icon: Users, text: "Everyone relives the night together, hours or days later" },
                { icon: Download, text: "Download every original photo, full resolution" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-foreground/85">
                  <Icon className="size-4 shrink-0 text-snap-violet" strokeWidth={1.5} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Why SnapTime
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl tracking-tight sm:text-5xl">
            Everything guests need. Nothing they don&apos;t.
          </h2>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Smartphone,
                title: "No app downloads",
                body: "Scan, name, shoot. The disposable camera opens in the browser on any phone.",
              },
              {
                icon: Camera,
                title: "Intentional shots",
                body: "Limited rolls keep photos thoughtful — the best kind of event candids.",
              },
              {
                icon: Sparkles,
                title: "Delayed reveal",
                body: "The surprise unlock turns a gallery into a shared moment worth waiting for.",
              },
              {
                icon: ShieldCheck,
                title: "Private by default",
                body: "Unguessable links, signed image URLs, and moderation when you want it.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <div className="flex size-11 items-center justify-center rounded-full border border-border bg-card">
                  <Icon className="size-5 text-foreground/70" strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 font-serif text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border/50 bg-card">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl tracking-tight sm:text-5xl">
            One night. Kept forever.
          </h2>
          <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              {
                name: "Intimate",
                price: "Free",
                blurb: "For small gatherings",
                features: [
                  "Up to 10 guests",
                  "5 shots per guest",
                  "30-day gallery",
                  "Standard reveal",
                ],
                cta: "Start free",
                highlight: false,
              },
              {
                name: "Celebration",
                price: "$79",
                blurb: "Most loved for events",
                features: [
                  "Unlimited guests",
                  "30 shots per guest",
                  "1-year gallery",
                  "Moderation tools",
                  "Full-resolution ZIP download",
                ],
                cta: "Create your event",
                highlight: true,
              },
              {
                name: "Legacy",
                price: "$149",
                blurb: "For the whole story",
                features: [
                  "Everything in Celebration",
                  "Unlimited shots",
                  "Forever gallery",
                  "Priority support",
                  "Multiple events",
                ],
                cta: "Go Legacy",
                highlight: false,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-8 ${
                  tier.highlight
                    ? "border-snap-magenta/40 bg-secondary shadow-[0_28px_70px_-28px_rgba(0,0,0,0.75)]"
                    : "border-border bg-background/40"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                  {tier.name}
                </p>
                <p className="mt-4 font-serif text-4xl">{tier.price}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
                <ul className="mt-6 space-y-2.5 text-sm text-foreground/80">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-snap-orange" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={tier.highlight ? "default" : "outline"}
                  className={
                    tier.highlight
                      ? "mt-8 w-full snap-gradient border-0 text-primary-foreground hover:opacity-90"
                      : "mt-8 w-full"
                  }
                >
                  <Link href="/signup">{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Launch pricing — billing opens soon. Every plan starts free while
            we&apos;re in early access.
          </p>
        </div>
      </section>

      <section id="faq" className="border-t border-border/50 bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Questions
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl tracking-tight">
            Everything hosts ask
          </h2>
          <div className="mt-12 divide-y divide-border/70">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium">
                  {q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/50">
        <div aria-hidden className="atmosphere absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
          <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
            Give your guests a camera.
            <br />
            <span className="italic text-foreground/55">Give yourselves a surprise.</span>
          </h2>
          <Button
            asChild
            size="lg"
            className="mt-10 h-12 snap-gradient border-0 px-8 text-base text-primary-foreground hover:opacity-90"
          >
            <Link href="/signup">Create your event</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-film">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <Logo className="text-base" markClassName="size-7" />
          <p>Capture now. Reveal later.</p>
          <p>© {new Date().getFullYear()} SnapTime</p>
        </div>
      </footer>
    </div>
  );
}
