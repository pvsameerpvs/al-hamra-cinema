import { NowShowingBadge } from "@/components/home/NowShowingBadge";
import { QuickSteps } from "@/components/home/QuickSteps";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative pt-28 md:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 h-[360px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/12 via-emerald-500/8 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.02),transparent_35%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 md:grid-cols-12 md:px-8">
        <div className="md:col-span-7">
          <NowShowingBadge />

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
            Immersive Cinema
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              Experience Awaits
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Book your tickets in seconds. Select a section, choose your seat, and
            confirm your booking.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-border bg-background/70 px-3 py-1">
              Auto-refresh seat map
            </span>
            <span className="rounded-full border border-border bg-background/70 px-3 py-1">
              Balcony: 35 AED
            </span>
            <span className="rounded-full border border-border bg-background/70 px-3 py-1">
              Orchestra: 30 AED
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-full">
              <a href="#seats">Choose Seats</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="md:col-span-5">
          <QuickSteps />
        </div>
      </div>
    </section>
  );
}
