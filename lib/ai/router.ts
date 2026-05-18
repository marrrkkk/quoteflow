import "server-only";

import { generateText, streamText } from "ai";

import { registry, groq, cerebras, google, openrouter } from "@/lib/ai/registry";
import {
  AiProviderError,
  getSanitizedErrorInfo,
  isRetryableError,
  wrapProviderError,
} from "@/lib/ai/errors";
import { getModelsForProvider } from "@/lib/ai/model-options";
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProviderName,
  AiStreamResponse,
  AiStreamChunk,
} from "@/lib/ai/types";

// ---------------------------------------------------------------------------
// AI Provider + Model Fallback Router — Vercel AI SDK
//
// Two-level fallback: providers (Groq → Cerebras → Gemini → OpenRouter),
// then models within each provider. The quality tier selects the model list.
//
// Uses the Vercel AI SDK's `generateText` and `streamText` with models
// accessed through the provider registry.
//
// Fallback rules:
// - Retryable errors (408, 409, 429, 5xx, timeout, network) → next model.
// - Non-retryable errors (400, 401, 403, 404, 422) → stop immediately.
// - Logs which provider/model was used and sanitised error info on failure.
// ---------------------------------------------------------------------------

const MAX_RETRY_AFTER_MS = 5_000;

const PROVIDER_TIMEOUTS: Record<AiProviderName, number> = {
  groq: 15_000,
  cerebras: 20_000,
  gemini: 20_000,
  openrouter: 30_000,
};

/** Ordered list of provider names that are configured. */
function getConfiguredProviderNames(): AiProviderName[] {
  const names: AiProviderName[] = [];
  if (groq) names.push("groq");
  if (cerebras) names.push("cerebras");
  if (google) names.push("gemini");
  if (openrouter) names.push("openrouter");
  return names;
}

function getProviderCandidates(
  requestedProvider: AiProviderName | undefined,
): AiProviderName[] {
  const all = getConfiguredProviderNames();
  return requestedProvider
    ? all.filter((p) => p === requestedProvider)
    : all;
}

function getModelCandidates(
  request: AiCompletionRequest,
  providerName: AiProviderName,
): string[] {
  if (request.provider === providerName && request.model.trim()) {
    return [request.model];
  }
  return getModelsForProvider(providerName, request.qualityTier ?? "balanced");
}

/** Get the registry model ID string for a provider + model combination. */
function getRegistryModelId(providerName: AiProviderName, model: string): `${string}:${string}` {
  // The registry uses the provider key we registered:
  // groq, cerebras, google (for gemini), openrouter
  const registryPrefix = providerName === "gemini" ? "google" : providerName;
  return `${registryPrefix}:${model}` as `${string}:${string}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildMessages(request: AiCompletionRequest) {
  return {
    system: request.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n") || undefined,
    messages: request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
  };
}

// ---------------------------------------------------------------------------
// generateWithFallback
// ---------------------------------------------------------------------------

/**
 * Generate a completion using the provider + model fallback chain.
 * Uses the Vercel AI SDK's `generateText` with the provider registry.
 */
export async function generateWithFallback(
  request: AiCompletionRequest,
): Promise<AiCompletionResponse> {
  const providers = getProviderCandidates(request.provider);

  if (providers.length === 0) {
    throw new Error(
      request.provider
        ? `The selected AI provider "${request.provider}" is not configured.`
        : "No AI providers are configured. Add at least one API key (GROQ_API_KEY, CEREBRAS_API_KEY, or GEMINI_API_KEY) to enable the assistant.",
    );
  }

  let lastError: unknown;
  const { system, messages } = buildMessages(request);

  for (const providerName of providers) {
    const models = getModelCandidates(request, providerName);
    const timeout = PROVIDER_TIMEOUTS[providerName];

    for (let m = 0; m < models.length; m += 1) {
      const model = models[m];
      const modelId = getRegistryModelId(providerName, model);

      try {
        const result = await generateText({
          model: registry.languageModel(modelId),
          system,
          messages,
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          abortSignal: AbortSignal.timeout(timeout),
        });

        console.info(
          `[ai-router] Completion succeeded: provider="${providerName}" model="${model}"`,
        );

        return {
          provider: providerName,
          model,
          text: result.text,
          usage: {
            promptTokens: result.usage?.inputTokens ?? undefined,
            completionTokens: result.usage?.outputTokens ?? undefined,
            totalTokens: result.usage
              ? (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0)
              : undefined,
          },
          raw: result,
        };
      } catch (error) {
        lastError = error;
        const errorInfo = getSanitizedErrorInfo(error);

        console.warn(
          `[ai-router] Failed: provider="${providerName}" model="${model}" status=${errorInfo.statusCode ?? "N/A"} retryable=${errorInfo.retryable} message="${errorInfo.message}"`,
        );

        if (!isRetryableError(error)) {
          console.warn(`[ai-router] Non-retryable error, stopping fallback chain.`);
          throw error instanceof AiProviderError
            ? error
            : wrapProviderError(providerName, error);
        }

        if (error instanceof AiProviderError && error.retryAfterMs) {
          const waitMs = Math.min(error.retryAfterMs, MAX_RETRY_AFTER_MS);
          console.info(`[ai-router] Waiting ${waitMs}ms (Retry-After) before next attempt.`);
          await sleep(waitMs);
        }
      }
    }
  }

  if (lastError instanceof AiProviderError) {
    throw lastError;
  }

  throw new Error(
    lastError instanceof Error ? lastError.message : "All AI providers failed.",
  );
}

// ---------------------------------------------------------------------------
// streamWithFallback
// ---------------------------------------------------------------------------

/**
 * Start a streaming completion using the provider + model fallback chain.
 * Uses the Vercel AI SDK's `streamText` with the provider registry.
 */
export async function streamWithFallback(
  request: AiCompletionRequest,
  options?: { onFallback?: () => void },
): Promise<AiStreamResponse> {
  const providers = getProviderCandidates(request.provider);

  if (providers.length === 0) {
    throw new Error(
      request.provider
        ? `The selected AI provider "${request.provider}" is not configured.`
        : "No AI providers are configured. Add at least one API key (GROQ_API_KEY, CEREBRAS_API_KEY, or GEMINI_API_KEY) to enable the assistant.",
    );
  }

  let lastError: unknown;
  let attemptCount = 0;
  const { system, messages } = buildMessages(request);

  for (const providerName of providers) {
    const models = getModelCandidates(request, providerName);
    const timeout = PROVIDER_TIMEOUTS[providerName];

    for (let m = 0; m < models.length; m += 1) {
      const model = models[m];
      const modelId = getRegistryModelId(providerName, model);

      try {
        const result = streamText({
          model: registry.languageModel(modelId),
          system,
          messages,
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          abortSignal: AbortSignal.timeout(timeout),
        });

        // Verify the stream starts successfully by getting the first chunk
        // (streamText doesn't throw on connection — it throws during iteration)
        const textStream = result.textStream;

        console.info(
          `[ai-router] Stream started: provider="${providerName}" model="${model}"`,
        );

        // Wrap the textStream into our AiStreamChunk format
        async function* chunks(): AsyncGenerator<AiStreamChunk> {
          for await (const chunk of textStream) {
            if (chunk) {
              yield { delta: chunk, finishReason: null };
            }
          }
          yield { delta: "", finishReason: "stop" };
        }

        return {
          provider: providerName,
          model,
          stream: chunks(),
        };
      } catch (error) {
        lastError = error;
        attemptCount += 1;

        const errorInfo = getSanitizedErrorInfo(error);

        console.warn(
          `[ai-router] Stream failed: provider="${providerName}" model="${model}" status=${errorInfo.statusCode ?? "N/A"} retryable=${errorInfo.retryable} message="${errorInfo.message}"`,
        );

        if (!isRetryableError(error)) {
          console.warn(`[ai-router] Non-retryable stream error, stopping fallback chain.`);
          throw error instanceof AiProviderError
            ? error
            : wrapProviderError(providerName, error);
        }

        if (attemptCount === 1 && options?.onFallback) {
          options.onFallback();
        }

        if (error instanceof AiProviderError && error.retryAfterMs) {
          const waitMs = Math.min(error.retryAfterMs, MAX_RETRY_AFTER_MS);
          console.info(`[ai-router] Waiting ${waitMs}ms (Retry-After) before next attempt.`);
          await sleep(waitMs);
        }
      }
    }
  }

  if (lastError instanceof AiProviderError) {
    throw lastError;
  }

  throw new Error(
    lastError instanceof Error ? lastError.message : "All AI providers failed.",
  );
}
