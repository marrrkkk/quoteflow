import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const pillars = [
  {
    title: "Collect every inquiry in one place",
    description:
      "Stop losing details across chat threads, email forwards, and sticky notes.",
  },
  {
    title: "Convert requests into structured quotes",
    description:
      "Move from raw messages to line items, pricing context, and sent quotations.",
  },
  {
    title: "Draft practical replies with AI",
    description:
      "Use your own FAQs and knowledge files without inventing pricing or policy promises.",
  },
];

const roadmap = [
  "Better Auth for email/password, session handling, and password resets.",
  "Workspace bootstrap on first signup with owner membership groundwork.",
  "Public inquiry pages, inbox workflows, quotes, analytics, and settings.",
];

export function MarketingHero() {
  return (
    <div className="page-wrap py-8 sm:py-10">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border bg-background/70 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Start building</Link>
            </Button>
          </div>
        </header>

        <section className="hero-panel surface-grid px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-7">
              <span className="eyebrow">QuoteFlow MVP foundation</span>
              <div className="space-y-5">
                <h1 className="max-w-4xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Turn messy customer inquiries into organized quotes and
                  bookings.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  QuoteFlow is a small-business inquiry inbox and quotation SaaS
                  for print shops, repair shops, tutors, event suppliers, and
                  small agencies. This repository is now structured to build the
                  product in deliberate MVP slices instead of one oversized drop.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">See the auth scaffold</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">Explore dashboard routes</Link>
                </Button>
              </div>
            </div>

            <Card className="border-primary/10 bg-card/95">
              <CardHeader>
                <CardTitle>Prepared in this phase</CardTitle>
                <CardDescription>
                  Architecture, stack integration points, and the first route
                  groups are in place.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {roadmap.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border bg-background/70 px-4 py-3 text-sm leading-7 text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title}>
              <CardHeader>
                <CardTitle>{pillar.title}</CardTitle>
                <CardDescription className="text-sm leading-7">
                  {pillar.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
