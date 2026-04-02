import { z } from "zod";

export const publicInquirySchema = z.object({
  customerName: z.string().min(2).max(120).trim(),
  customerEmail: z.email().trim(),
  customerPhone: z.string().max(40).trim().optional(),
  companyName: z.string().max(120).trim().optional(),
  subject: z.string().max(160).trim().optional(),
  details: z.string().min(10).max(4000).trim(),
});
