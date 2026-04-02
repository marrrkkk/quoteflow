import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  CircleCheckBig,
  ClipboardList,
  FileText,
  FolderOpen,
  Folders,
  MessagesSquare,
  NotebookTabs,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const industries = [
  "Print shops",
  "Repair shops",
  "Tutors",
  "Event suppliers",
  "Small agencies",
];

const heroSignals = [
  "Collect requests from one public page",
  "Move every inquiry through clear statuses",
  "Draft quotes and replies without losing context",
];

const inboxColumns = [
  {
    label: "New",
    items: ["Trade show backdrop", "MacBook repair intake"],
  },
  {
    label: "Quoting",
    items: ["After-school tutoring plan", "Wedding lighting package"],
  },
  {
    label: "Booked",
    items: ["Restaurant menus reprint"],
  },
];

type FeatureCard = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  points: [string, string];
  className?: string;
};

const featureCards: FeatureCard[] = [
  {
    eyebrow: "Public inquiry form",
    title: "Collect requests with a cleaner starting point",
    description:
      "Give customers one structured page for specs, timing, and attachments instead of scattered messages.",
    icon: ClipboardList,
    points: [
      "Capture the details you need up front",
      "Keep public submission separate from dashboard access",
    ],
    className: "lg:col-span-3",
  },
  {
    eyebrow: "Inquiry workflow",
    title: "Organize the inbox by real status, not memory",
    description:
      "Sort incoming work into new, quoting, follow-up, and booked states so nothing stalls invisibly.",
    icon: NotebookTabs,
    points: [
      "Track work at a glance by stage",
      "Keep notes and context tied to the inquiry",
    ],
    className: "lg:col-span-3",
  },
  {
    eyebrow: "Quote drafting",
    title: "Turn raw requests into quotes faster",
    description:
      "Move from inquiry details to line items and totals without rebuilding the same quote every time.",
    icon: FileText,
    points: [
      "Reuse inquiry context while pricing",
      "Create quotes without leaving the workflow",
    ],
    className: "lg:col-span-2",
  },
  {
    eyebrow: "Knowledge base",
    title: "Upload business docs and FAQs once",
    description:
      "Bring your policies, service notes, and common answers into the app so they stay usable.",
    icon: Folders,
    points: [
      "Keep docs and FAQs in one workspace",
      "Ground replies in your real business context",
    ],
    className: "lg:col-span-2",
  },
  {
    eyebrow: "AI-assisted replies",
    title: "Draft practical responses with context",
    description:
      "Use AI to prepare concise replies that reflect the inquiry and your knowledge without inventing promises.",
    icon: MessagesSquare,
    points: [
      "Flag missing details before you send",
      "Avoid made-up pricing and policy claims",
    ],
    className: "lg:col-span-2",
  },
];

export function MarketingHero() {
  return (
    <div className="page-wrap py-8 sm:py-10 lg:py-12">
      <div className="flex flex-col gap-6 lg:gap-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border bg-background/75 p-5 shadow-[0_20px_60px_-50px_rgba(37,54,106,0.35)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Start free
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="hero-panel surface-grid border-primary/10 px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="flex flex-col gap-7 lg:gap-8">
              <div className="flex flex-col gap-5">
                <span className="eyebrow">Owner-first inquiry inbox</span>
                <div className="flex flex-col gap-5">
                  <h1 className="max-w-4xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                    Turn messy customer inquiries into organized quotes and
                    bookings.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                    QuoteFlow gives small service businesses one clean place to
                    collect requests, track inquiry status, build quotes,
                    organize business knowledge, and draft practical replies
                    with AI.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Create your workspace
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <span
                    key={industry}
                    className="rounded-full border bg-background/85 px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    {industry}
                  </span>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroSignals.map((signal) => (
                  <Card key={signal} size="sm" className="bg-card/90">
                    <CardHeader className="gap-3">
                      <div className="flex size-9 items-center justify-center rounded-2xl border bg-accent/60 text-accent-foreground">
                        <CircleCheckBig className="size-4" />
                      </div>
                      <CardDescription className="leading-6 text-foreground">
                        {signal}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="border-primary/10 bg-card/95 shadow-[0_28px_80px_-52px_rgba(37,54,106,0.45)]">
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle>One workflow instead of five inboxes</CardTitle>
                    <CardDescription className="leading-7">
                      Public intake, status tracking, quote drafting, knowledge,
                      and AI replies all stay in one place.
                    </CardDescription>
                  </div>
                  <div className="rounded-full border bg-background px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                    QuoteFlow
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="rounded-[1.4rem] border bg-background/80 p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl border bg-secondary">
                          <ClipboardList className="size-4 text-foreground" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">Public inquiry page</p>
                          <p className="text-sm text-muted-foreground">
                            Customers send scope, files, dates, and questions in
                            one clean form.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full border bg-accent/70 px-3 py-1 text-xs font-medium text-accent-foreground">
                        Live intake
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        "Booth backdrop, 8x8 feet",
                        "Needed by May 14",
                        "Artwork file attached",
                      ].map((detail) => (
                        <div
                          key={detail}
                          className="rounded-2xl border bg-card px-3 py-2 text-sm text-muted-foreground"
                        >
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3 lg:grid-cols-3">
                  {inboxColumns.map((column) => (
                    <div
                      key={column.label}
                      className="rounded-[1.4rem] border bg-background/80 p-4"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{column.label}</p>
                          <span className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                            {column.items.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {column.items.map((item) => (
                            <div
                              key={item}
                              className="rounded-2xl border bg-card px-3 py-2.5 text-sm leading-6 text-foreground"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="rounded-[1.4rem] border bg-background/80 p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl border bg-secondary">
                          <FileText className="size-4 text-foreground" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">Quote draft</p>
                          <p className="text-sm text-muted-foreground">
                            Turn inquiry details into line items without
                            restarting from scratch.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3">
                        {[
                          "Backdrop print and finishing",
                          "Rush production window",
                          "Delivery and setup",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span className="text-foreground">{item}</span>
                            <span className="font-mono text-muted-foreground">
                              Item
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border bg-background/80 p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl border bg-secondary">
                          <Sparkles className="size-4 text-foreground" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">AI draft with business context</p>
                          <p className="text-sm text-muted-foreground">
                            Pull from your FAQ and knowledge files before
                            sending a reply.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3">
                        <p className="text-sm leading-7 text-foreground">
                          We can prepare a rush quote for the backdrop. Before
                          confirming price, we still need the final print specs
                          and delivery address.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {["FAQ matched", "Artwork note found", "Missing size check"].map(
                            (item) => (
                              <span
                                key={item}
                                className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground"
                              >
                                {item}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div className="flex flex-col gap-4">
              <span className="eyebrow">Built for the owner workflow</span>
              <h2 className="max-w-xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Everything needed to move from incoming request to sent quote.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              QuoteFlow is not a generic CRM. It is a focused workspace for
              small service businesses that need cleaner inquiry intake,
              clearer status handling, faster quotes, and practical reply
              drafting with the right context.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-6">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className={feature.className}
                >
                  <CardHeader className="gap-4">
                    <div className="flex size-11 items-center justify-center rounded-[1.2rem] border bg-accent/60 text-accent-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {feature.eyebrow}
                      </span>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="leading-7">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {feature.points.map((point) => (
                        <div
                          key={point}
                          className="flex items-start gap-3 rounded-2xl border bg-background/70 px-3 py-3"
                        >
                          <BadgeCheck className="mt-0.5 size-4 text-primary" />
                          <p className="text-sm leading-6 text-muted-foreground">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="hero-panel border-primary/10 bg-card/95 px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-5">
              <span className="eyebrow">Start with a cleaner front door</span>
              <div className="flex flex-col gap-3">
                <h2 className="max-w-3xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Give your business one place to collect inquiries, draft
                  quotes, and respond with context.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                  Create your workspace, publish your inquiry page, and move
                  away from ad hoc threads and manual follow-up.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FolderOpen className="size-4 text-foreground" />
                  Public inquiry page
                </div>
                <div className="flex items-center gap-2">
                  <NotebookTabs className="size-4 text-foreground" />
                  Status-based inbox
                </div>
                <div className="flex items-center gap-2">
                  <MessagesSquare className="size-4 text-foreground" />
                  Context-aware drafts
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start free
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
