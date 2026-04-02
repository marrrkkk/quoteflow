import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default function KnowledgePage() {
  return (
    <RoutePlaceholder
      eyebrow="Knowledge"
      title="Knowledge base scaffold"
      description="Knowledge files and FAQs are part of the first schema pass so future AI features can use business context without architecture churn."
      bullets={[
        "Knowledge file and FAQ tables are ready for CRUD implementation.",
        "Supabase storage wrappers are ready for file upload workflows.",
        "OpenRouter wrappers provide the future AI integration point.",
      ]}
      nextStep="Implement file uploads, FAQ management, and light retrieval over workspace-owned knowledge content."
    />
  );
}
