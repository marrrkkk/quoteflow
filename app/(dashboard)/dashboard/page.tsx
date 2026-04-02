import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export default function DashboardOverviewPage() {
  return (
    <RoutePlaceholder
      eyebrow="Dashboard"
      title="Overview workspace shell"
      description="The dashboard surface is scaffolded so later feature work lands inside a consistent owner-first shell."
      bullets={[
        "App route groups separate marketing, auth, public intake, and dashboard areas.",
        "A reusable dashboard shell and navigation are established.",
        "Session helpers are ready to become the auth gate in the next slice.",
      ]}
      nextStep="Connect Better Auth session checks here, then render first-run workspace and inquiry overview metrics."
    />
  );
}
