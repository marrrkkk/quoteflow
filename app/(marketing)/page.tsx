import type { Metadata } from "next";

import { MarketingHero } from "@/components/marketing/marketing-hero";

export const metadata: Metadata = {
  title: "Inquiry-to-quote workflow for service businesses",
  description:
    "Requo helps owner-led service businesses capture inquiries, qualify leads, send professional quotes, and follow up from one calm dashboard.",
};

export default function MarketingPage() {
  return <MarketingHero />;
}
