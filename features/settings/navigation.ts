import type { LucideIcon } from "lucide-react";
import {
  BookCopy,
  FileText,
  FormInput,
  Settings2,
  Tags,
} from "lucide-react";

import { getBusinessSettingsPath } from "@/features/businesses/routes";

export type BusinessSectionNavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export function getBusinessSectionNavigation(
  slug: string,
): BusinessSectionNavigationItem[] {
  return [
    {
      href: getBusinessSettingsPath(slug, "general"),
      label: "General",
      description: "Brand, contact, notifications",
      icon: Settings2,
    },
    {
      href: getBusinessSettingsPath(slug, "inquiry"),
      label: "Inquiry",
      description: "Forms, URLs, reply snippets",
      icon: FormInput,
    },
    {
      href: getBusinessSettingsPath(slug, "quote"),
      label: "Quote",
      description: "Defaults, template, validity",
      icon: FileText,
    },
    {
      href: getBusinessSettingsPath(slug, "pricing"),
      label: "Pricing",
      description: "Saved blocks and packages",
      icon: Tags,
    },
    {
      href: getBusinessSettingsPath(slug, "knowledge"),
      label: "Knowledge",
      description: "Files and FAQs",
      icon: BookCopy,
    },
  ];
}
