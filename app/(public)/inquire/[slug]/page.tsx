import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default async function PublicInquiryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="page-wrap py-10">
      <RoutePlaceholder
        eyebrow="Public inquiry"
        title={`Public intake page for ${slug}`}
        description="The route exists and the data model is prepared. The actual public-facing inquiry form, attachment handling, and workspace scoping are intentionally left for the next phase."
        bullets={[
          "Workspace-specific slug-based public route is now reserved.",
          "Inquiry, attachment, and note tables are part of the initial schema.",
          "Supabase storage client wrappers are ready for scoped file uploads.",
        ]}
        nextStep="Implement the public inquiry form with Zod validation, workspace lookup by slug, and tightly scoped attachment uploads."
      />
    </div>
  );
}
