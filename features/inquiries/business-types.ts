export const workspaceBusinessTypes = [
  "general_services",
  "print_signage",
  "home_services",
  "repair_services",
  "cleaning_services",
  "landscaping_outdoor",
  "creative_studio_agency",
  "it_web_services",
  "photo_video_events",
  "coaching_consulting",
] as const;

export type WorkspaceBusinessType = (typeof workspaceBusinessTypes)[number];

export const workspaceBusinessTypeMeta: Record<
  WorkspaceBusinessType,
  {
    label: string;
    description: string;
  }
> = {
  general_services: {
    label: "General services",
    description: "A flexible setup for service businesses with mixed requests.",
  },
  print_signage: {
    label: "Print & signage",
    description: "Printing, signage, installs, and branded production work.",
  },
  home_services: {
    label: "Home services",
    description: "Repairs, installs, and on-site work for homes or properties.",
  },
  repair_services: {
    label: "Repair services",
    description: "Device, equipment, and technical repair requests.",
  },
  cleaning_services: {
    label: "Cleaning services",
    description: "Residential or commercial cleaning requests and schedules.",
  },
  landscaping_outdoor: {
    label: "Landscaping & outdoor",
    description: "Outdoor maintenance, upgrades, and recurring site work.",
  },
  creative_studio_agency: {
    label: "Creative studio / agency",
    description: "Brand, design, marketing, and creative production work.",
  },
  it_web_services: {
    label: "IT / web services",
    description: "Web, systems, support, and digital service requests.",
  },
  photo_video_events: {
    label: "Photo / video / events",
    description: "Event coverage, shoots, and media production requests.",
  },
  coaching_consulting: {
    label: "Coaching / consulting",
    description: "Consulting, advisory, and session-based client work.",
  },
};

