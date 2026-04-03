import { ReactNode } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <div className="page-wrap flex min-h-screen items-center py-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="hidden lg:flex lg:flex-col lg:gap-8 lg:pr-8">
          <BrandMark />
          <div className="flex max-w-md flex-col gap-5">
            <span className="eyebrow">{badge}</span>
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-5xl font-medium leading-none tracking-tight text-balance">
                Simple work in. Clear quotes out.
              </h1>
              <p className="text-sm leading-7 text-muted-foreground">
                QuoteFlow keeps inquiries, quotes, and reply drafts in one calm workspace.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Inbox", "Quotes", "AI drafts"].map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border bg-card/75 px-4 py-4"
              >
                <p className="meta-label">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-xl">
            <CardHeader className="gap-4">
              <BrandMark className="lg:hidden" />
              <div className="space-y-2">
                <span className="eyebrow">{badge}</span>
                <CardTitle className="text-4xl">{title}</CardTitle>
                <CardDescription className="max-w-md text-sm leading-7">
                  {description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
