import "server-only";

import { buildInquiryAssistantUserMessage } from "@/features/ai/chat";
import {
  createInquiryAssistantMessageForBusiness,
  createInquiryUserMessageForBusiness,
  getRecentCompletedInquiryMessagesForBusiness,
  toAiChatHistory,
  updateInquiryAssistantMessageForBusiness,
} from "@/features/ai/messages";
import { getAiAssistantTitle } from "@/features/ai/prompts";
import { getInquiryAssistantContextForBusiness } from "@/features/ai/queries";
import { aiAssistantRequestSchema } from "@/features/ai/schemas";
import { createInquiryAssistantStream } from "@/features/ai/service";
import type { AiAssistantStreamEvent } from "@/features/ai/types";
import type { AiProviderName } from "@/lib/ai";
import { assertPublicActionRateLimit } from "@/lib/public-action-rate-limit";

const encoder = new TextEncoder();
const ssePaddingComment = `:${" ".repeat(2048)}\n\n`;

function encodeStreamEvent(event: AiAssistantStreamEvent) {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function encodeSseComment(comment: string) {
  return encoder.encode(comment);
}

function getValidationMessage(error: {
  flatten: () => {
    fieldErrors: Partial<
      Record<"customPrompt" | "sourceDraft", string[] | undefined>
    >;
  };
}) {
  const fieldErrors = error.flatten().fieldErrors;

  return (
    fieldErrors.customPrompt?.[0] ??
    fieldErrors.sourceDraft?.[0] ??
    "Check the AI request and try again."
  );
}

export async function createInquiryAssistantRouteResponse({
  request,
  businessId,
  userId,
  inquiryId,
}: {
  request: Request;
  businessId: string;
  userId: string;
  inquiryId: string;
}) {
  const isAllowed = await assertPublicActionRateLimit({
    action: "business-inquiry-ai",
    limit: 10,
    scope: `${businessId}:${userId}:${inquiryId}`,
    windowMs: 60_000,
  });

  if (!isAllowed) {
    return Response.json(
      { error: "Too many AI requests. Wait a minute and try again." },
      { status: 429 },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return Response.json(
      { error: "Check the AI request and try again." },
      { status: 400 },
    );
  }

  const validationResult = aiAssistantRequestSchema.safeParse(requestBody);

  if (!validationResult.success) {
    return Response.json(
      { error: getValidationMessage(validationResult.error) },
      { status: 400 },
    );
  }

  const assistantContext = await getInquiryAssistantContextForBusiness({
    businessId,
    inquiryId,
  });

  if (!assistantContext) {
    return Response.json(
      { error: "That inquiry could not be found." },
      { status: 404 },
    );
  }

  const title = getAiAssistantTitle(validationResult.data.intent);
  const userMessage = await createInquiryUserMessageForBusiness({
    businessId,
    inquiryId,
    content: buildInquiryAssistantUserMessage(validationResult.data),
    metadata: {
      intent: validationResult.data.intent,
    },
  });

  if (!userMessage) {
    return Response.json(
      { error: "That inquiry could not be found." },
      { status: 404 },
    );
  }

  const assistantMessage = await createInquiryAssistantMessageForBusiness({
    businessId,
    inquiryId,
    status: "generating",
    metadata: {
      intent: validationResult.data.intent,
      title,
      userMessageId: userMessage.id,
    },
  });

  if (!assistantMessage) {
    return Response.json(
      { error: "That inquiry could not be found." },
      { status: 404 },
    );
  }

  const savedAssistantMessage = assistantMessage;
  const historyMessages = await getRecentCompletedInquiryMessagesForBusiness({
    businessId,
    inquiryId,
    limit: 20,
  });
  const history = toAiChatHistory(historyMessages, userMessage.id);
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encodeSseComment(ssePaddingComment));
      controller.enqueue(
        encodeStreamEvent({
          type: "messages",
          userMessage,
          assistantMessage: savedAssistantMessage,
        }),
      );

      let assistantContent = "";
      let provider: AiProviderName | null = null;
      let model: string | null = null;
      let terminalEvent: Extract<
        AiAssistantStreamEvent,
        { type: "done" | "error" }
      > | null = null;

      async function markAssistantFailed(errorReason: string) {
        await updateInquiryAssistantMessageForBusiness({
          businessId,
          inquiryId,
          messageId: savedAssistantMessage.id,
          content: assistantContent,
          provider,
          model,
          status: "failed",
          metadata: {
            errorReason,
            latencyMs: Date.now() - startedAt,
          },
        });
      }

      try {
        for await (const event of createInquiryAssistantStream({
          context: assistantContext,
          request: validationResult.data,
          history,
        })) {
          if (event.type === "meta") {
            provider = event.provider ?? null;
            model = event.providerModel ?? null;
          }

          if (event.type === "delta") {
            assistantContent += event.value;
          }

          if (event.type === "done" || event.type === "error") {
            terminalEvent = event;
          }

          controller.enqueue(encodeStreamEvent(event));
        }

        if (terminalEvent?.type === "done") {
          await updateInquiryAssistantMessageForBusiness({
            businessId,
            inquiryId,
            messageId: savedAssistantMessage.id,
            content: assistantContent,
            provider,
            model,
            status: assistantContent.trim() ? "completed" : "failed",
            metadata: {
              truncated: terminalEvent.truncated,
              latencyMs: Date.now() - startedAt,
            },
          });
        } else if (terminalEvent?.type === "error") {
          await markAssistantFailed(terminalEvent.message);
        } else {
          const message =
            "The stream ended unexpectedly. Try again if you need a fresh reply.";

          await markAssistantFailed(message);
          controller.enqueue(
            encodeStreamEvent({
              type: "error",
              message,
            }),
          );
        }
      } catch (error) {
        console.error("Failed to stream inquiry AI output.", error);

        const message =
          "The assistant could not generate an answer right now. Try again in a moment.";

        await markAssistantFailed(message);
        controller.enqueue(
          encodeStreamEvent({
            type: "error",
            message,
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "cache-control": "private, no-cache, no-transform",
      "content-type": "text/event-stream; charset=utf-8",
      "x-content-type-options": "nosniff",
      "x-accel-buffering": "no",
    },
  });
}
