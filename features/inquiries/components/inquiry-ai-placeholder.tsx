import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InquiryAiPlaceholder() {
  return (
    <Card className="bg-muted/20">
      <CardHeader className="gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border bg-background/80">
          <Sparkles />
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle>AI reply assistant</CardTitle>
          <CardDescription className="leading-6">
            This panel is reserved for inquiry-specific reply drafts once the
            knowledge base and assistant workflow are connected.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
        <div className="rounded-2xl border bg-background/70 px-4 py-3">
          Future drafts will combine inquiry details, workspace FAQs, and
          uploaded business files.
        </div>
        <div className="rounded-2xl border bg-background/70 px-4 py-3">
          Pricing and policy gaps will still stay explicit instead of being
          invented.
        </div>
      </CardContent>
    </Card>
  );
}
