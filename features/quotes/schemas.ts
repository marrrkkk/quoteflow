import { z } from "zod";

export const quoteItemSchema = z.object({
  description: z.string().min(1).max(400).trim(),
  quantity: z.number().int().min(1),
  unitPriceInCents: z.number().int().min(0),
});

export const quoteDraftSchema = z.object({
  customerName: z.string().min(2).max(120).trim(),
  customerEmail: z.email().trim(),
  currency: z.string().length(3).default("USD"),
  message: z.string().max(2000).trim().optional(),
  items: z.array(quoteItemSchema).min(1),
});
