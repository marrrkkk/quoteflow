import { RoutePlaceholder } from "@/components/shared/route-placeholder";
import { inquiryRouteParamsSchema } from "@/features/inquiries/schemas";

type NewQuotePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewQuotePage({
  searchParams,
}: NewQuotePageProps) {
  const rawSearchParams = await searchParams;
  const rawInquiryId = Array.isArray(rawSearchParams.inquiryId)
    ? rawSearchParams.inquiryId[0]
    : rawSearchParams.inquiryId;
  const inquiryId = inquiryRouteParamsSchema.safeParse({
    id: rawInquiryId,
  }).success
    ? rawInquiryId
    : undefined;

  return (
    <RoutePlaceholder
      eyebrow="New quote"
      title="Quote builder entry point"
      description={
        inquiryId
          ? `This quote entry point was opened from inquiry ${inquiryId}. The route contract is ready to prefill inquiry context once the quote builder is implemented.`
          : "This route will host the owner-first quote builder. The schema groundwork exists now so the actual builder can be implemented cleanly."
      }
      bullets={[
        "Quote item persistence is modeled separately from quote headers.",
        "Workspace ownership and inquiry linkage can be enforced at the DAL layer.",
        inquiryId
          ? "The inquiry-to-quote handoff is now wired through search params."
          : "This page is intentionally a scaffold until the quote slice starts.",
      ]}
      nextStep="Add a quote creation form with line items, totals, inquiry linkage, and draft vs sent states."
    />
  );
}
