import { createAiChatRouteResponse } from "@/features/ai/api-route-handlers";

export const preferredRegion = "syd1";

export async function POST(request: Request) {
  return createAiChatRouteResponse(request);
}
