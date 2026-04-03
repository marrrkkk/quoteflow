import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
  {
    icon: ClipboardList,
    title: "Clean intake",
    description: "One form for scope, timing, and files.",
  },
  {
    icon: FileText,
    title: "Fast quotes",
    description: "Move from inquiry to draft without retyping.",
  },
  {
    icon: Sparkles,
    title: "Practical AI",
    description: "Draft replies with your real business context.",
  },
];

const workflow = [
  "Customer sends request",
  "Owner reviews and sorts",
  "Quote goes out",
];

export function MarketingHero() {
  return (
    <div className="page-wrap py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col gap-6">
        <header className="section-panel flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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

        <section className="section-panel overflow-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="flex flex-col gap-6">
              <span className="eyebrow">Owner-first workflow</span>
              <div className="flex flex-col gap-4">
                <h1 className="max-w-4xl font-heading text-5xl font-medium leading-none tracking-tight text-balance sm:text-6xl">
                  Quote work without the clutter.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  QuoteFlow gives small service businesses one calm place for inquiries,
                  quotes, knowledge, and reply drafts.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Create workspace
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[1.7rem] border bg-background/75 p-5">
              <div className="flex flex-col gap-4">
                <p className="meta-label">Workflow</p>
                <div className="grid gap-3">
                  {workflow.map((step, index) => (
                    <div
                      key={step}
                      className="flex items-center justify-between gap-4 rounded-[1.25rem] border bg-card px-4 py-4"
                    >
                      <p className="text-sm font-medium text-foreground">{step}</p>
                      <span className="meta-label">{`0${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <Card key={benefit.title}>
                <CardHeader className="gap-4">
                  <div className="flex size-11 items-center justify-center rounded-full border bg-secondary">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <CardTitle>{benefit.title}</CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="section-panel flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Ready to start</span>
            <h2 className="font-heading text-3xl font-medium leading-none tracking-tight text-balance sm:text-4xl">
              Open one workspace for the whole flow.
            </h2>
          </div>

          <Button asChild size="lg">
            <Link href="/signup">
              Start free
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
