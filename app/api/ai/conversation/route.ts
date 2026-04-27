import { getAiConversationRouteResponse } from "@/features/ai/api-route-handlers";

export async function GET(request: Request) {
  return getAiConversationRouteResponse(request);
}
