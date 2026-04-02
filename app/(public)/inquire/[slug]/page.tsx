import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  FolderUp,
  ShieldCheck,
} from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { PublicInquiryForm } from "@/features/inquiries/components/public-inquiry-form";
import { submitPublicInquiryAction } from "@/features/inquiries/actions";
import { getPublicInquiryWorkspaceBySlug } from "@/features/inquiries/queries";
import { publicInquiryAttachmentLabel } from "@/features/inquiries/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const intakeSignals = [
  {
    title: "Clear details",
    description:
      "Share the service needed, timing, and message in one place instead of a scattered thread.",
    icon: ClipboardList,
  },
  {
    title: "Optional file upload",
    description: `Attach ${publicInquiryAttachmentLabel} when visuals or reference material help.`,
    icon: FolderUp,
  },
  {
    title: "Direct to owner",
    description:
      "Your inquiry goes into the business owner's QuoteFlow inbox without exposing private workspace data.",
    icon: ShieldCheck,
  },
];

export default async function PublicInquiryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspace = await getPublicInquiryWorkspaceBySlug(slug);

  if (!workspace) {
    notFound();
  }

  const submitPublicInquiry = submitPublicInquiryAction.bind(null, workspace.slug);
  const pageHeadline =
    workspace.inquiryHeadline?.trim() ||
    `Tell ${workspace.name} what you need and they can review it in QuoteFlow.`;

  return (
    <div className="page-wrap py-8 sm:py-10 lg:py-12">
      <div className="flex flex-col gap-6 lg:gap-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border bg-background/75 p-5 shadow-[0_20px_60px_-50px_rgba(37,54,106,0.35)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <Button asChild variant="ghost">
            <Link href="/">
              Back to QuoteFlow
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </header>

        <section className="hero-panel surface-grid border-primary/10 px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <span className="eyebrow">Public inquiry page</span>
                <div className="flex flex-col gap-4">
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {workspace.name}
                  </p>
                  <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                    Start an inquiry with {workspace.name}.
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                    {pageHeadline}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {intakeSignals.map((signal) => {
                  const Icon = signal.icon;

                  return (
                    <Card key={signal.title} size="sm" className="bg-card/95">
                      <CardHeader className="gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl border bg-accent/60 text-accent-foreground">
                          <Icon className="size-4" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <CardTitle>{signal.title}</CardTitle>
                          <CardDescription className="leading-7">
                            {signal.description}
                          </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-primary/10 bg-background/75">
                <CardHeader>
                  <CardTitle>What to include</CardTitle>
                  <CardDescription className="leading-7">
                    Useful requests usually mention the service needed, timing,
                    quantities, measurements, location, and any files or
                    references the business should review.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-primary/10 bg-card/95 shadow-[0_28px_80px_-52px_rgba(37,54,106,0.4)]">
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-2xl">Send your inquiry</CardTitle>
                  <CardDescription className="max-w-2xl leading-7">
                    Fill out the form below and {workspace.name} will receive it
                    in their QuoteFlow inbox.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <PublicInquiryForm
                  workspace={workspace}
                  action={submitPublicInquiry}
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
