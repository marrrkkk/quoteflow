import type { AiAssistantRequestInput } from "@/features/ai/schemas";
import type { AiAssistantIntent } from "@/features/ai/types";

const assistantUserMessages: Record<Exclude<AiAssistantIntent, "custom">, string> = {
  "draft-first-reply": "Draft the first reply for this inquiry.",
  "summarize-inquiry": "Summarize this inquiry and tell me what matters most.",
  "suggest-follow-up-questions":
    "Suggest the follow-up questions I should ask for this inquiry.",
  "suggest-quote-line-items":
    "Suggest quote line items for this inquiry without pricing them.",
  "rewrite-draft": "Rewrite this draft into a clearer, more professional reply.",
  "generate-follow-up-message":
    "Generate a follow-up message for this inquiry.",
};

export function truncateMessagePreview(value: string, limit = 420) {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= limit) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, limit).trimEnd()}...`;
}

export function buildInquiryAssistantUserMessage(
  request: AiAssistantRequestInput,
) {
  if (request.intent === "custom") {
    return truncateMessagePreview(request.customPrompt ?? "", 600);
  }

  if (request.intent === "rewrite-draft") {
    return `${assistantUserMessages["rewrite-draft"]}\n\n${truncateMessagePreview(
      request.sourceDraft ?? "",
      520,
    )}`;
  }

  return assistantUserMessages[request.intent];
}
