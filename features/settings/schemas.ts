import { z } from "zod";

export const workspaceSettingsSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  publicInquiryEnabled: z.boolean(),
  inquiryHeadline: z.string().max(240).trim().optional(),
  defaultCurrency: z.string().length(3).default("USD"),
});
