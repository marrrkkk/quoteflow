import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Inbox,
  LayoutDashboard,
  Settings2,
} from "lucide-react";

import {
  getBusinessAnalyticsPath,
  getBusinessDashboardPath,
  getBusinessDashboardSlugFromPathname,
  getBusinessInquiriesPath,
  getBusinessKnowledgeCompatibilityPath,
  getBusinessQuotesPath,
  getBusinessSettingsPath,
} from "@/features/businesses/routes";

export type DashboardNavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type DashboardBreadcrumbItem = {
  label: string;
  href?: string;
};

export function getDashboardNavigation(slug: string): DashboardNavigationItem[] {
  return [
    {
      href: getBusinessDashboardPath(slug),
      label: "Overview",
      description: "Action queues, momentum, and the next owner actions.",
      icon: LayoutDashboard,
    },
    {
      href: getBusinessInquiriesPath(slug),
      label: "Requests",
      description: "Capture, review, and move customer requests forward.",
      icon: Inbox,
    },
    {
      href: getBusinessQuotesPath(slug),
      label: "Quotes",
      description: "Draft, send, and track quotes from one place.",
      icon: FileText,
    },
    {
      href: getBusinessSettingsPath(slug),
      label: "Settings",
      description: "Manage business, inquiry, quote, pricing, and knowledge settings.",
      icon: Settings2,
    },
  ];
}

function resolveDashboardActivePathname(pathname: string) {
  const slug = getBusinessDashboardSlugFromPathname(pathname);

  if (!slug) {
    return pathname;
  }

  const analyticsPath = getBusinessAnalyticsPath(slug);
  const knowledgeCompatibilityPath = getBusinessKnowledgeCompatibilityPath(slug);

  if (pathname === analyticsPath || pathname.startsWith(`${analyticsPath}/`)) {
    return getBusinessDashboardPath(slug);
  }

  if (
    pathname === knowledgeCompatibilityPath ||
    pathname.startsWith(`${knowledgeCompatibilityPath}/`)
  ) {
    return getBusinessSettingsPath(slug, "knowledge");
  }

  return pathname;
}

export function isDashboardNavigationItemActive(
  pathname: string,
  href: string,
) {
  const activePathname = resolveDashboardActivePathname(pathname);

  if (href.endsWith("/dashboard")) {
    return activePathname === href;
  }

  return activePathname === href || activePathname.startsWith(`${href}/`);
}

export function getActiveDashboardNavigationItem(pathname: string) {
  const activePathname = resolveDashboardActivePathname(pathname);
  const slug = getBusinessDashboardSlugFromPathname(activePathname);

  if (!slug) {
    return null;
  }

  const dashboardNavigation = getDashboardNavigation(slug);

  return (
    dashboardNavigation.find((item) =>
      isDashboardNavigationItemActive(activePathname, item.href),
    ) ?? dashboardNavigation[0]
  );
}

function formatBreadcrumbLabel(value: string) {
  const normalized = decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getDashboardBreadcrumbs(pathname: string): DashboardBreadcrumbItem[] {
  const slug = getBusinessDashboardSlugFromPathname(pathname);

  if (!slug) {
    return [];
  }

  const dashboardPath = getBusinessDashboardPath(slug);
  const analyticsPath = getBusinessAnalyticsPath(slug);
  const inquiriesPath = getBusinessInquiriesPath(slug);
  const quotesPath = getBusinessQuotesPath(slug);
  const settingsPath = getBusinessSettingsPath(slug);

  if (pathname === dashboardPath) {
    return [{ label: "Dashboard" }];
  }

  if (pathname === analyticsPath || pathname.startsWith(`${analyticsPath}/`)) {
    return [{ label: "Analytics" }];
  }

  if (pathname === inquiriesPath) {
    return [{ label: "Requests" }];
  }

  if (pathname.startsWith(`${inquiriesPath}/`)) {
    return [
      {
        label: "Requests",
        href: inquiriesPath,
      },
      {
        label: "Request",
      },
    ];
  }

  if (pathname === quotesPath) {
    return [{ label: "Quotes" }];
  }

  if (pathname === `${quotesPath}/new`) {
    return [
      {
        label: "Quotes",
        href: quotesPath,
      },
      {
        label: "New quote",
      },
    ];
  }

  if (pathname.startsWith(`${quotesPath}/`)) {
    return [
      {
        label: "Quotes",
        href: quotesPath,
      },
      {
        label: "Quote",
      },
    ];
  }

  if (pathname === settingsPath) {
    return [{ label: "Settings" }];
  }

  if (pathname.startsWith(`${settingsPath}/`)) {
    const relativePath = pathname.slice(`${settingsPath}/`.length);
    const segments = relativePath.split("/").filter(Boolean);
    const section = segments[0];
    const sectionLabels: Record<string, string> = {
      general: "General",
      inquiry: "Inquiry",
      quote: "Quote",
      pricing: "Pricing",
      knowledge: "Knowledge",
    };
    const sectionLabel = sectionLabels[section] ?? formatBreadcrumbLabel(section);

    if (section === "inquiry" && segments[1]) {
      return [
        {
          label: "Settings",
          href: settingsPath,
        },
        {
          label: sectionLabel,
          href: getBusinessSettingsPath(slug, "inquiry"),
        },
        {
          label: formatBreadcrumbLabel(segments[1]),
        },
      ];
    }

    return [
      {
        label: "Settings",
        href: settingsPath,
      },
      {
        label: sectionLabel,
      },
    ];
  }

  return [{ label: "Dashboard" }];
}
