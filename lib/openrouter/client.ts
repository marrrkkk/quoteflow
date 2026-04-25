import "server-only";

import { OpenRouter } from "@openrouter/sdk";

import { env, isOpenRouterConfigured } from "@/lib/env";

export function getOpenRouterClient() {
  if (!isOpenRouterConfigured || !env.OPENROUTER_API_KEY) {
    return null;
  }

  return new OpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
  });
}
