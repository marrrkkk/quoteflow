import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FolderUp,
  Mail,
  Package,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { z } from "zod";

import type { WorkspaceBusinessType } from "@/features/inquiries/business-types";

function emptyToUndefined(value: unknown) {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function optionalText(maxLength: number) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength).optional(),
  );
}

export const inquiryPageTemplates = [
  "split",
  "stacked",
  "showcase",
] as const;

export type InquiryPageTemplate = (typeof inquiryPageTemplates)[number];

export const inquiryPageTemplateMeta: Record<
  InquiryPageTemplate,
  {
    label: string;
    description: string;
  }
> = {
  split: {
    label: "Split",
    description: "Story and supporting cards on the left, form on the right.",
  },
  stacked: {
    label: "Stacked",
    description: "Centered intro with supporting cards above a full-width form.",
  },
  showcase: {
    label: "Showcase",
    description: "A branded lead surface with supporting details beside the form.",
  },
};

export const inquiryPageCardIconKeys = [
  "details",
  "upload",
  "owner",
  "schedule",
  "measurements",
  "package",
  "sparkles",
  "contact",
] as const;

export type InquiryPageCardIcon = (typeof inquiryPageCardIconKeys)[number];

export const inquiryPageCardIconMeta: Record<
  InquiryPageCardIcon,
  {
    label: string;
    icon: LucideIcon;
  }
> = {
  details: {
    label: "Details",
    icon: ClipboardList,
  },
  upload: {
    label: "Upload",
    icon: FolderUp,
  },
  owner: {
    label: "Owner",
    icon: ShieldCheck,
  },
  schedule: {
    label: "Schedule",
    icon: CalendarDays,
  },
  measurements: {
    label: "Measurements",
    icon: Ruler,
  },
  package: {
    label: "Package",
    icon: Package,
  },
  sparkles: {
    label: "Sparkles",
    icon: Sparkles,
  },
  contact: {
    label: "Contact",
    icon: Mail,
  },
};

export const inquiryPageCardSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(240),
  icon: z.enum(inquiryPageCardIconKeys),
});

export type InquiryPageCard = z.infer<typeof inquiryPageCardSchema>;

export const inquiryPageConfigSchema = z.object({
  template: z.enum(inquiryPageTemplates),
  eyebrow: optionalText(48),
  headline: z.string().trim().min(1).max(120),
  description: optionalText(280),
  brandTagline: optionalText(120),
  formTitle: z.string().trim().min(1).max(80),
  formDescription: optionalText(200),
  cards: z.array(inquiryPageCardSchema).max(8),
});

export type InquiryPageConfig = z.infer<typeof inquiryPageConfigSchema>;

type InquiryPageConfigDefaultsInput = {
  workspaceName: string;
  workspaceShortDescription?: string | null;
  legacyInquiryHeadline?: string | null;
  businessType?: WorkspaceBusinessType;
  template?: InquiryPageTemplate;
};

function createDefaultInquiryPageCards(
  businessType: WorkspaceBusinessType,
): InquiryPageCard[] {
  switch (businessType) {
    case "print_signage":
      return [
        {
          id: "specs",
          title: "Specs first",
          description: "Share quantity, size, and material.",
          icon: "measurements",
        },
        {
          id: "upload",
          title: "Send artwork",
          description: "Upload files, photos, or reference layouts.",
          icon: "upload",
        },
        {
          id: "schedule",
          title: "Call out timing",
          description: "Flag install dates or production deadlines.",
          icon: "schedule",
        },
      ];
    case "home_services":
      return [
        {
          id: "details",
          title: "Describe the job",
          description: "Tell us what needs to be fixed or installed.",
          icon: "details",
        },
        {
          id: "upload",
          title: "Add photos",
          description: "Photos help before a visit or estimate.",
          icon: "upload",
        },
        {
          id: "schedule",
          title: "Pick a date",
          description: "Share your preferred visit window.",
          icon: "schedule",
        },
      ];
    case "repair_services":
      return [
        {
          id: "details",
          title: "Explain the issue",
          description: "Describe the item, symptoms, and urgency.",
          icon: "details",
        },
        {
          id: "upload",
          title: "Send photos",
          description: "Photos or screenshots help with diagnosis.",
          icon: "upload",
        },
        {
          id: "owner",
          title: "Direct review",
          description: "Your request goes straight to the owner.",
          icon: "owner",
        },
      ];
    case "cleaning_services":
      return [
        {
          id: "details",
          title: "Share the space",
          description: "Tell us the property type and size.",
          icon: "details",
        },
        {
          id: "schedule",
          title: "Pick a schedule",
          description: "Tell us when and how often you need service.",
          icon: "schedule",
        },
        {
          id: "upload",
          title: "Add photos",
          description: "Photos help clarify scope before quoting.",
          icon: "upload",
        },
      ];
    case "landscaping_outdoor":
      return [
        {
          id: "details",
          title: "Describe the site",
          description: "Tell us the outdoor work and area size.",
          icon: "details",
        },
        {
          id: "schedule",
          title: "Share timing",
          description: "Tell us your preferred start window.",
          icon: "schedule",
        },
        {
          id: "upload",
          title: "Upload photos",
          description: "Photos help us see access and conditions.",
          icon: "upload",
        },
      ];
    case "creative_studio_agency":
      return [
        {
          id: "details",
          title: "Share the brief",
          description: "Tell us the goal, scope, and deliverables.",
          icon: "sparkles",
        },
        {
          id: "upload",
          title: "Send references",
          description: "Upload briefs, decks, or brand assets.",
          icon: "upload",
        },
        {
          id: "schedule",
          title: "Call out launch timing",
          description: "Tell us the timeline that matters most.",
          icon: "schedule",
        },
      ];
    case "it_web_services":
      return [
        {
          id: "details",
          title: "Describe the request",
          description: "Tell us the issue, platform, or outcome needed.",
          icon: "details",
        },
        {
          id: "upload",
          title: "Add screenshots",
          description: "Screenshots or files help us review faster.",
          icon: "upload",
        },
        {
          id: "contact",
          title: "We will follow up",
          description: "Share the best contact details for next steps.",
          icon: "contact",
        },
      ];
    case "photo_video_events":
      return [
        {
          id: "schedule",
          title: "Share the date",
          description: "Tell us the event date and location.",
          icon: "schedule",
        },
        {
          id: "details",
          title: "Coverage details",
          description: "Tell us what you need captured or delivered.",
          icon: "details",
        },
        {
          id: "upload",
          title: "Add references",
          description: "Upload a run of show or inspiration.",
          icon: "upload",
        },
      ];
    case "coaching_consulting":
      return [
        {
          id: "details",
          title: "Share the goal",
          description: "Tell us the challenge or outcome you want.",
          icon: "details",
        },
        {
          id: "schedule",
          title: "Pick a start point",
          description: "Tell us when you want to begin.",
          icon: "schedule",
        },
        {
          id: "owner",
          title: "Direct review",
          description: "Your request goes straight to the owner.",
          icon: "owner",
        },
      ];
    case "general_services":
    default:
      return [
        {
          id: "details",
          title: "Clear details",
          description: "Share the service, timing, and scope.",
          icon: "details",
        },
        {
          id: "upload",
          title: "Reference file",
          description: "Upload files, photos, or notes if helpful.",
          icon: "upload",
        },
        {
          id: "owner",
          title: "Direct review",
          description: "Your inquiry goes straight to the owner.",
          icon: "owner",
        },
      ];
  }
}

export function createInquiryPageConfigDefaults({
  workspaceName,
  workspaceShortDescription,
  legacyInquiryHeadline,
  businessType = "general_services",
  template,
}: InquiryPageConfigDefaultsInput): InquiryPageConfig {
  const resolvedTemplate =
    template ??
    (businessType === "creative_studio_agency" ||
    businessType === "photo_video_events"
      ? "showcase"
      : businessType === "coaching_consulting"
        ? "stacked"
        : "split");

  let eyebrow = "Inquiry";
  let headline = `Tell ${workspaceName} what you need.`;
  let description =
    legacyInquiryHeadline?.trim() ||
    `Send a request directly to ${workspaceName}.`;
  let formTitle = "Send inquiry";
  const formDescription = `Your request goes straight to ${workspaceName}.`;

  switch (businessType) {
    case "print_signage":
      eyebrow = "Project request";
      headline = `Start your print or signage request with ${workspaceName}.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share specs, timing, and files so ${workspaceName} can quote accurately.`;
      formTitle = "Send project request";
      break;
    case "home_services":
      eyebrow = "Service request";
      headline = `Book a service request with ${workspaceName}.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share the job, location, and preferred timing.`;
      break;
    case "repair_services":
      eyebrow = "Repair request";
      headline = `Tell ${workspaceName} what needs repair.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share the item, issue, and any photos that help.`;
      break;
    case "cleaning_services":
      eyebrow = "Cleaning request";
      headline = `Request cleaning service from ${workspaceName}.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share the space, schedule, and service needs.`;
      break;
    case "landscaping_outdoor":
      eyebrow = "Outdoor project";
      headline = `Start your outdoor project with ${workspaceName}.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share the property, work needed, and preferred timing.`;
      break;
    case "creative_studio_agency":
      eyebrow = "Project brief";
      headline = `Send your project brief to ${workspaceName}.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share the goal, deliverables, and launch timing.`;
      formTitle = "Send brief";
      break;
    case "it_web_services":
      eyebrow = "Project request";
      headline = `Tell ${workspaceName} what you need help with.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share the issue, system, and desired outcome.`;
      break;
    case "photo_video_events":
      eyebrow = "Booking request";
      headline = `Start your booking request with ${workspaceName}.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share the event, date, location, and coverage needed.`;
      formTitle = "Send booking request";
      break;
    case "coaching_consulting":
      eyebrow = "Discovery request";
      headline = `Start your request with ${workspaceName}.`;
      description =
        legacyInquiryHeadline?.trim() ||
        `Share the goal, context, and preferred start date.`;
      break;
    case "general_services":
    default:
      break;
  }

  return {
    template: resolvedTemplate,
    eyebrow,
    headline,
    description,
    brandTagline: workspaceShortDescription?.trim() || undefined,
    formTitle,
    formDescription,
    cards: createDefaultInquiryPageCards(businessType),
  };
}

export function getNormalizedInquiryPageConfig(
  value: unknown,
  defaults: InquiryPageConfigDefaultsInput,
) {
  const fallback = createInquiryPageConfigDefaults(defaults);
  const parsed = inquiryPageConfigSchema.safeParse(value);

  if (!parsed.success) {
    return fallback;
  }

  return parsed.data;
}
