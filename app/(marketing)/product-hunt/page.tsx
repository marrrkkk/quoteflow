import type { Metadata } from "next";

import { ProductHuntShowcase } from "@/components/marketing/product-hunt-showcase";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Requo — Product Hunt Launch",
  description:
    "Requo is quote software for owner-led service businesses. Capture inquiries, send professional quotes, follow up, and close more jobs.",
  pathname: "/product-hunt",
});

export default function ProductHuntPage() {
  return <ProductHuntShowcase />;
}
