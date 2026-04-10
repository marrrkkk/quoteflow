import {
  createInquiryAssistantStream,
  isInquiryAssistantStreamTruncated,
  buildRawOpenRouterRequest,
} from "@/features/ai/service";
import { aiAssistantRequestSchema } from "@/features/ai/schemas";
import type { AiAssistantStreamEvent } from "@/features/ai/types";
import { getInquiryAssistantContextForBusiness } from "@/features/ai/queries";
import { inquiryRouteParamsSchema } from "@/features/inquiries/schemas";
import { getOwnerBusinessActionContext } from "@/lib/db/business-access";
import { env } from "@/lib/env";

const encoder = new TextEncoder();

function encodeStreamEvent(event: AiAssistantStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function getValidationMessage(error: {
  flatten: () => {
    fieldErrors: Partial<Record<"customPrompt" | "sourceDraft", string[] | undefined>>;
  };
}) {
  const fieldErrors = error.flatten().fieldErrors;

  return (
    fieldErrors.customPrompt?.[0] ??
    fieldErrors.sourceDraft?.[0] ??
    "Check the AI request and try again."
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsedParams = inquiryRouteParamsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const ownerAccess = await getOwnerBusinessActionContext();

  if (!ownerAccess.ok) {
    return Response.json({ error: ownerAccess.error }, { status: 403 });
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
    businessId: ownerAccess.businessContext.business.id,
    inquiryId: parsedParams.data.id,
  });

  if (!assistantContext) {
    return Response.json(
      { error: "That inquiry could not be found." },
      { status: 404 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { model, title } = createInquiryAssistantStream({
          context: assistantContext,
          request: validationResult.data,
        });

        controller.enqueue(
          encodeStreamEvent({
            type: "meta",
            title,
            model,
          }),
        );

        // Use raw OpenRouter streaming API for true streaming
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify(buildRawOpenRouterRequest({
            context: assistantContext,
            request: validationResult.data,
            intent: validationResult.data.intent,
          })),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            typeof errorData.error === "object" && errorData.error?.message
              ? errorData.error.message
              : "OpenRouter API error",
          );
        }

        if (!response.body) {
          throw new Error("No response body from OpenRouter");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let truncated = false;

        while (true) {
          const { value, done } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "[DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmed.slice(6));

                // Check for truncation
                if (
                  data.choices?.[0]?.finish_reason === "length"
                ) {
                  truncated = true;
                }

                // Extract the delta content
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encodeStreamEvent({
                      type: "delta",
                      value: content,
                    }),
                  );
                }
              } catch {
                // Ignore parse errors for streaming chunks
              }
            }
          }
        }

        controller.enqueue(
          encodeStreamEvent({
            type: "done",
            truncated,
          }),
        );
      } catch (error) {
        console.error("Failed to stream inquiry AI output.", error);

        controller.enqueue(
          encodeStreamEvent({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "The assistant could not generate an answer right now. Try again in a moment.",
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "cache-control": "private, no-store",
      "content-type": "application/x-ndjson; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}
