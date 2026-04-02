import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardInquiryListItem } from "@/features/inquiries/types";
import {
  formatInquiryBudget,
  formatInquiryDate,
} from "@/features/inquiries/utils";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";

type InquiryListCardsProps = {
  inquiries: DashboardInquiryListItem[];
};

export function InquiryListCards({ inquiries }: InquiryListCardsProps) {
  return (
    <div className="grid gap-4 lg:hidden">
      {inquiries.map((inquiry) => (
        <Card key={inquiry.id} className="bg-background/75">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex flex-col gap-1">
                <CardTitle className="truncate text-lg">
                  {inquiry.customerName}
                </CardTitle>
                <CardDescription className="truncate">
                  {inquiry.customerEmail}
                </CardDescription>
              </div>
              <InquiryStatusBadge status={inquiry.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Category
              </span>
              <p className="text-sm text-foreground">{inquiry.serviceCategory}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Budget
              </span>
              <p className="text-sm text-foreground">
                {formatInquiryBudget(inquiry.budgetText)}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Created
              </span>
              <p className="text-sm text-foreground">
                {formatInquiryDate(inquiry.submittedAt)}
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild variant="outline">
              <Link href={`/dashboard/inquiries/${inquiry.id}`} prefetch={false}>
                Open inquiry
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
