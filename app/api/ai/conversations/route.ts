import {
  createAiConversationRouteResponse,
  listAiConversationsRouteResponse,
} from "@/features/ai/api-route-handlers";

export async function GET(request: Request) {
  return listAiConversationsRouteResponse(request);
}

export async function POST(request: Request) {
  return createAiConversationRouteResponse(request);
}
