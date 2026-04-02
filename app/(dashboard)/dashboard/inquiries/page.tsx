import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default function InquiriesPage() {
  return (
    <RoutePlaceholder
      eyebrow="Inquiries"
      title="Inquiry inbox foundation"
      description="This page will become the business owner's main inbox. The schema, route, and workspace-aware architecture are in place."
      bullets={[
        "Inquiry status, notes, and attachments are modeled in the initial Drizzle schema.",
        "The dashboard route is reserved for list, filters, and owner workflow states.",
        "Feature folders now separate schemas, types, queries, and actions.",
      ]}
      nextStep="Implement list queries, status transitions, note creation, and activity logging for inquiry events."
    />
  );
}
