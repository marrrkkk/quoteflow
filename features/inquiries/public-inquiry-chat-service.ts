import "server-only";

import { streamWithFallback } from "@/lib/ai/router";
import type { AiChatMessage } from "@/lib/ai/types";
import { buildConversationalSystemPrompt } from "@/features/inquiries/public-inquiry-chat-prompt";
import { extractFieldsFromMessage } from "@/features/inquiries/public-inquiry-chat-extractor";
import type {
  PublicInquiryChatMessage,
  PublicInquiryChatStreamEvent,
  PublicInquiryChatExtractedFields,
} from "@/features/inquiries/public-inquiry-chat-schemas";
import type { PublicInquiryBusiness } from "@/features/inquiries/types";

// ---------------------------------------------------------------------------
// Public Inquiry Chat — Service
//
// Orchestrates the conversational inquiry flow. Takes the full message history
// from the client, builds the AI context, and streams the response back.
// The service is stateless — no server-side conversation storage.
// ---------------------------------------------------------------------------

type CreatePublicInquiryChatStreamInput = {
  business: PublicInquiryBusiness;
  messages: PublicInquiryChatMessage[];
};

/**
 * Creates an async generator that yields SSE events for the conversational
 * inquiry chat. The caller should encode these as `data: {...}\n\n` lines.
 */
export async function* createPublicInquiryChatStream({
  business,
  messages,
}: CreatePublicInquiryChatStreamInput): AsyncGenerator<PublicInquiryChatStreamEvent> {
  const systemPrompt = buildConversationalSystemPrompt({
    businessName: business.name,
    businessDescription: business.shortDescription,
    formConfig: business.inquiryFormConfig,
    openingMessage:
      business.inquiryFormConfig.conversationalMode?.openingMessage,
    assistantName:
      business.inquiryFormConfig.conversationalMode?.assistantName ||
      `${business.name} Assistant`,
  });

  // Build the AI message array: system + conversation history
  const aiMessages: AiChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map(
      (msg): AiChatMessage => ({
        role: msg.role,
        content: msg.content,
      }),
    ),
  ];

  let fullContent = "";
  let extracted: PublicInquiryChatExtractedFields | null = null;

  try {
    const streamResponse = await streamWithFallback({
      model: "",
      messages: aiMessages,
      temperature: 0.6,
      maxOutputTokens: 1024,
      qualityTier: "cheap",
    });

    for await (const chunk of streamResponse.stream) {
      if (chunk.delta) {
        fullContent += chunk.delta;
        yield { type: "delta", value: chunk.delta };
      }
    }

    // After streaming completes, check if the AI included an extraction
    extracted = extractFieldsFromMessage(fullContent);

    yield { type: "done", extracted };
  } catch (error) {
    console.error("[inquiry-chat-service] Stream error:", error);

    yield {
      type: "error",
      message:
        "The assistant could not respond right now. Please try again in a moment.",
    };
  }
}
