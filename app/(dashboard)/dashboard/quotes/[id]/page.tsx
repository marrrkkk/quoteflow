import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RoutePlaceholder
      eyebrow="Quote detail"
      title={`Quote ${id}`}
      description="The detail route is ready for review, edit, send, and follow-up history once the quote workflow is implemented."
      bullets={[
        "Dynamic route and shared dashboard shell are established.",
        "Activity logs can record quote lifecycle changes.",
        "Resend integration is already wrapped server-side.",
      ]}
      nextStep="Render quote details, sent state, delivery history, and follow-up actions."
    />
  );
}
