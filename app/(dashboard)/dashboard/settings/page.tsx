import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default function SettingsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Settings"
      title="Workspace settings scaffold"
      description="The settings route is reserved for business identity, inquiry page configuration, and foundational workspace preferences."
      bullets={[
        "Workspace and profile tables are included in the base schema.",
        "Owner membership groundwork exists for future team expansion without team UI now.",
        "Settings stays owner-first and intentionally small for the MVP.",
      ]}
      nextStep="Implement workspace profile editing, public inquiry page settings, and owner contact preferences."
    />
  );
}
