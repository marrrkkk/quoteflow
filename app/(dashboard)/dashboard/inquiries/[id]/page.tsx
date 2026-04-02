import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RoutePlaceholder
      eyebrow="Inquiry detail"
      title={`Inquiry ${id}`}
      description="The detail route is ready for the full owner workflow: structured context, notes, attachments, AI drafts, and quote handoff."
      bullets={[
        "Dynamic route shape is established for server-side data loading.",
        "Inquiry note and attachment tables are available for the next slice.",
        "AI integration wrappers are available for context-aware reply drafting later.",
      ]}
      nextStep="Load inquiry detail from the workspace-scoped DAL and add note, status, and draft-reply interactions."
    />
  );
}
