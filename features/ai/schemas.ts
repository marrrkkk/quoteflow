import { z } from "zod";

import {
  aiAssistantIntents,
  aiSurfaces,
} from "@/features/ai/types";

export const aiSurfaceSchema = z.enum(aiSurfaces);

export const aiQualityTierSchema = z.enum([
  "best",
  "balanced",
  "cheap",
  "coding",
]);

export const aiConversationQuerySchema = z.object({
  businessSlug: z.preprocess(
    (value) => emptyToUndefined(firstString(value)),
    z.string().trim().min(1).max(120),
  ),
  surface: z.preprocess(
    (value) => firstString(value),
    aiSurfaceSchema,
  ),
  entityId: z.preprocess(
    (value) => emptyToUndefined(firstString(value)),
    z.string().trim().min(1).max(128),
  ),
});

export const aiConversationListQuerySchema = aiConversationQuerySchema.extend({
  limit: z
    .preprocess((value) => {
      const rawValue = firstString(value);

      if (typeof rawValue !== "string" || rawValue.trim() === "") {
        return 20;
      }

      return Number(rawValue);
    }, z.number().int().min(1).max(50))
    .catch(20),
});

export const aiCreateConversationSchema = z.object({
  businessSlug: z.string().trim().min(1).max(120),
  surface: aiSurfaceSchema,
  entityId: z.string().trim().min(1).max(128),
});

export const aiConversationMessagesQuerySchema = z.object({
  before: z.preprocess(
    (value) => emptyToUndefined(firstString(value)),
    z.string().trim().max(500).optional(),
  ),
  limit: z
    .preprocess((value) => {
      const rawValue = firstString(value);

      if (typeof rawValue !== "string" || rawValue.trim() === "") {
        return 30;
      }

      return Number(rawValue);
    }, z.number().int().min(1).max(50))
    .catch(30),
});

export const aiChatRequestSchema = z.object({
  businessSlug: z.string().trim().min(1).max(120).optional(),
  conversationId: z.string().trim().min(1).max(128),
  surface: aiSurfaceSchema,
  entityId: z.string().trim().min(1).max(128),
  message: z.string().trim().min(1).max(6000),
  qualityTier: aiQualityTierSchema.optional(),
});

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value ?? undefined;
}

function firstString(value: unknown) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function optionalTrimmedText(maxLength: number) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(maxLength, `Use ${maxLength} characters or fewer.`)
      .optional(),
  );
}

export const aiAssistantIntentSchema = z.enum(aiAssistantIntents);

export const aiAssistantRequestSchema = z
  .object({
    intent: aiAssistantIntentSchema,
    customPrompt: optionalTrimmedText(1200),
    sourceDraft: optionalTrimmedText(6000),
  })
  .superRefine((value, ctx) => {
    if (value.intent === "custom" && !value.customPrompt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a custom prompt before running a custom request.",
        path: ["customPrompt"],
      });
    }

    if (value.intent === "rewrite-draft" && !value.sourceDraft) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Paste the draft you want rewritten.",
        path: ["sourceDraft"],
      });
    }
  });

export type AiAssistantRequestInput = z.infer<typeof aiAssistantRequestSchema>;

export const inquiryMessagePaginationSchema = z.object({
  before: z.preprocess(
    (value) => emptyToUndefined(firstString(value)),
    z.string().trim().max(500).optional(),
  ),
  limit: z
    .preprocess((value) => {
      const rawValue = firstString(value);

      if (typeof rawValue !== "string" || rawValue.trim() === "") {
        return 30;
      }

      return Number(rawValue);
    }, z.number().int().min(1).max(50))
    .catch(30),
});
