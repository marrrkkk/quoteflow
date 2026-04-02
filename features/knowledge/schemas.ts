import { z } from "zod";

export const knowledgeFaqSchema = z.object({
  question: z.string().min(4).max(240).trim(),
  answer: z.string().min(8).max(4000).trim(),
});
