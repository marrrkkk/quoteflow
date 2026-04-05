import { z } from "zod";

import { businessTypes } from "@/features/inquiries/business-types";

export const createBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter a business name.")
    .max(80, "Use 80 characters or fewer."),
  businessType: z.enum(businessTypes),
});
