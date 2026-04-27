import { z } from "zod";

import { getAiMessagesRouteResponse } from "@/features/ai/api-route-handlers";

const routeParamsSchema = z.object({
  conversationId: z.string().trim().min(1).max(128),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const parsedParams = routeParamsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  return getAiMessagesRouteResponse({
    request,
    conversationId: parsedParams.data.conversationId,
  });
}
