import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default function AnalyticsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Analytics"
      title="Analytics route prepared"
      description="Analytics stays intentionally lightweight for the MVP: query-based overview metrics, status funnel counts, and quote conversion signals."
      bullets={[
        "The route exists in the dashboard shell for later implementation.",
        "Activity logs are included in the first schema pass.",
        "No event pipeline or advanced reporting stack is introduced here.",
      ]}
      nextStep="Add workspace-scoped query summaries for inquiry volume, status movement, and basic quote conversion."
    />
  );
}
