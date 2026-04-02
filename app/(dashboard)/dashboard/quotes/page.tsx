import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default function QuotesPage() {
  return (
    <RoutePlaceholder
      eyebrow="Quotes"
      title="Quotes index scaffold"
      description="Quote routes are present and the table structure is ready, but the actual quote builder and delivery workflows are intentionally deferred."
      bullets={[
        "Quote and quote item tables are included in the initial schema.",
        "Resend wrappers are prepared for transactional quote delivery.",
        "Route shells are ready for list and status views.",
      ]}
      nextStep="Build the quote list, quote status model, and outbound email flow with idempotent send behavior."
    />
  );
}
