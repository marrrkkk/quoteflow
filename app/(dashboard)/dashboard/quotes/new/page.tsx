import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default function NewQuotePage() {
  return (
    <RoutePlaceholder
      eyebrow="New quote"
      title="Quote builder entry point"
      description="This route will host the owner-first quote builder. The schema groundwork exists now so the actual builder can be implemented cleanly."
      bullets={[
        "Quote item persistence is modeled separately from quote headers.",
        "Workspace ownership and inquiry linkage can be enforced at the DAL layer.",
        "This page is intentionally a scaffold until the quote slice starts.",
      ]}
      nextStep="Add a quote creation form with line items, totals, inquiry linkage, and draft vs sent states."
    />
  );
}
