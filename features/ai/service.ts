import "server-only";

import type { AiAssistantRequestInput } from "@/features/ai/schemas";
import {
  buildAiAssistantInput,
  buildAiAssistantInstructions,
  getAiAssistantTitle,
  isReplyLikeIntent,
} from "@/features/ai/prompts";
import type {
  AiAssistantResult,
  AiAssistantStreamEvent,
  InquiryAssistantContext,
} from "@/features/ai/types";
import {
  generateWithFallback,
  streamWithFallback,
} from "@/lib/ai";
import type { AiCompletionRequest } from "@/lib/ai";

// ---------------------------------------------------------------------------
// AI service for inquiry assistant features
//
// This module builds domain-specific prompts and delegates AI completion
// to the provider fallback router in lib/ai. The router handles provider
// selection, fallback, timeouts, and error classification.
//
// Fallback order: Groq → Gemini → OpenRouter.
// See lib/ai/router.ts for details.
// ---------------------------------------------------------------------------

/**
 * Remove complete `<thinking>…</thinking>` and `<think>…</think>` blocks
 * from text. Different models use different tag names.
 */
function stripThinkingBlocks(text: string): string {
  return text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/g, "").trim();
}

/**
 * Return the portion of accumulated text that is safe to show.
 *
 * - Complete thinking blocks are removed.
 * - If an unclosed `<think>` or `<thinking>` tag exists, everything from
 *   it onward is hidden until the closing tag arrives.
 */
function getVisibleText(text: string): string {
  // Remove fully closed thinking blocks
  let result = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/g, "");

  // Hide any unclosed thinking block (still streaming)
  const openMatch = result.match(/<think(?:ing)?>/);

  if (openMatch && openMatch.index !== undefined) {
    result = result.slice(0, openMatch.index);
  }

  return result;
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown AI request failure.";
}

function getAiAssistantMaxOutputTokens(intent: AiAssistantRequestInput["intent"]) {
  switch (intent) {
    case "custom":
    case "rewrite-draft":
      return 1800;
    case "draft-first-reply":
    case "generate-follow-up-message":
      return 1400;
    case "summarize-inquiry":
    case "suggest-follow-up-questions":
    case "suggest-quote-line-items":
      return 1100;
  }
}

/**
 * Build a provider-agnostic completion request from the domain context.
 * The model field is left empty so each provider uses its own default.
 */
function createCompletionRequest(input: {
  context: InquiryAssistantContext;
  request: AiAssistantRequestInput;
}): AiCompletionRequest {
  return {
    model: "",
    messages: [
      {
        role: "system",
        content: buildAiAssistantInstructions(input.request.intent),
      },
      {
        role: "user",
        content: buildAiAssistantInput(input.context, input.request),
      },
    ],
    temperature: 0.2,
    maxOutputTokens: getAiAssistantMaxOutputTokens(input.request.intent),
  };
}

function isChatCompletionTruncated(finishReason: unknown) {
  return (
    finishReason === "length" ||
    finishReason === "MAX_TOKENS" ||
    finishReason === "max_tokens"
  );
}

/**
 * Generate a complete AI response using the provider fallback chain.
 */
async function generateTextWithFallback(params: {
  context: InquiryAssistantContext;
  request: AiAssistantRequestInput;
}) {
  const completionRequest = createCompletionRequest(params);
  const response = await generateWithFallback(completionRequest);

  const cleanedText = stripThinkingBlocks(response.text);

  if (!cleanedText) {
    throw new Error("The AI assistant returned an empty response.");
  }

  return {
    text: cleanedText,
    model: response.model,
    provider: response.provider,
  };
}

/**
 * Stream an AI response using the provider fallback chain.
 *
 * The fallback applies to the initial connection. Once a provider starts
 * streaming, we commit to it — we do not mid-stream switch providers.
 */
export async function* createInquiryAssistantStream(input: {
  context: InquiryAssistantContext;
  request: AiAssistantRequestInput;
}): AsyncGenerator<AiAssistantStreamEvent> {
  const title = getAiAssistantTitle(input.request.intent);
  const completionRequest = createCompletionRequest(input);

  // Connect to a provider. The router handles fallback if the connection
  // itself fails with a retryable error.
  let streamResponse;

  try {
    streamResponse = await streamWithFallback(completionRequest);
  } catch (error) {
    yield {
      type: "meta",
      title,
      model: "unknown",
    };
    yield {
      type: "error",
      message: getErrorMessage(error),
    };
    return;
  }

  yield {
    type: "meta",
    title,
    model: `${streamResponse.provider}/${streamResponse.model}`,
  };

  try {
    let streamedText = "";
    let lastVisibleLength = 0;
    let truncated = false;

    for await (const chunk of streamResponse.stream) {
      if (isChatCompletionTruncated(chunk.finishReason)) {
        truncated = true;
      }

      if (!chunk.delta) {
        continue;
      }

      streamedText += chunk.delta;

      // Compute visible text (thinking blocks stripped) and emit only
      // the newly visible portion so the client never sees thinking content.
      const visible = getVisibleText(streamedText);

      if (visible.length > lastVisibleLength) {
        yield {
          type: "delta",
          value: visible.slice(lastVisibleLength),
        };
        lastVisibleLength = visible.length;
      }
    }

    if (!getVisibleText(streamedText).trim()) {
      throw new Error("The AI assistant returned an empty response.");
    }

    yield {
      type: "done",
      truncated,
    };
  } catch (error) {
    yield {
      type: "error",
      message: getErrorMessage(error),
    };
  }
}

/**
 * Generate a complete AI assistant result (non-streaming).
 * Used by the server action path.
 */
export async function generateInquiryAssistantResult(input: {
  context: InquiryAssistantContext;
  request: AiAssistantRequestInput;
}): Promise<AiAssistantResult> {
  const title = getAiAssistantTitle(input.request.intent);
  const { text, model, provider } = await generateTextWithFallback(input);

  return {
    intent: input.request.intent,
    title,
    output: text,
    model: `${provider}/${model}`,
    canInsertIntoReply: isReplyLikeIntent(input.request.intent),
  };
}
