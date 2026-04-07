import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardInquiryListItem } from "@/features/inquiries/types";
import {
  formatInquiryBudget,
  formatInquiryDate,
} from "@/features/inquiries/utils";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { getBusinessInquiryPath } from "@/features/businesses/routes";

type InquiryListCardsProps = {
  inquiries: DashboardInquiryListItem[];
  businessSlug: string;
};

export function InquiryListCards({
  inquiries,
  businessSlug,
}: InquiryListCardsProps) {
  return (
    <div className="data-list-mobile-grid">
      {inquiries.map((inquiry) => (
        <Link
          className="block"
          href={getBusinessInquiryPath(businessSlug, inquiry.id)}
          key={inquiry.id}
          prefetch={true}
        >
          <Card className="data-list-card transition-colors hover:bg-accent/20">
          <CardHeader className="data-list-card-header">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex flex-col gap-1">
                <CardTitle className="text-lg leading-tight">
                  <span className="block truncate">{inquiry.customerName}</span>
                </CardTitle>
                <CardDescription className="truncate text-sm">
                  {inquiry.customerEmail}
                </CardDescription>
              </div>
              <InquiryStatusBadge status={inquiry.status} />
            </div>
          </CardHeader>
          <CardContent className="data-list-card-meta pt-0">
            <div className="info-tile h-full px-3.5 py-3 shadow-none">
              <span className="meta-label">
                Form
              </span>
              <p className="mt-2 line-clamp-2 text-sm text-foreground">
                {inquiry.inquiryFormName}
              </p>
            </div>
            <div className="info-tile h-full px-3.5 py-3 shadow-none">
              <span className="meta-label">
                Category
              </span>
              <p className="mt-2 line-clamp-2 text-sm text-foreground">
                {inquiry.serviceCategory}
              </p>
            </div>
            <div className="info-tile h-full px-3.5 py-3 shadow-none">
              <span className="meta-label">
                Budget
              </span>
              <p className="mt-2 text-sm text-foreground">
                {formatInquiryBudget(inquiry.budgetText)}
              </p>
            </div>
            <div className="info-tile h-full px-3.5 py-3 shadow-none">
              <span className="meta-label">
                Created
              </span>
              <p className="mt-2 text-sm text-foreground">
                {formatInquiryDate(inquiry.submittedAt)}
              </p>
            </div>
          </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
