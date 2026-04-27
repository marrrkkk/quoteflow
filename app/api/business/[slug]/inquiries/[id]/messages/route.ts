import { z } from "zod";

import {
  decodeInquiryMessageCursor,
  getPaginatedInquiryMessagesForBusiness,
  inquiryBelongsToBusiness,
} from "@/features/ai/messages";
import { inquiryMessagePaginationSchema } from "@/features/ai/schemas";
import { getBusinessRequestContextForSlug } from "@/lib/db/business-access";

const routeParamsSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  id: z.string().trim().min(1).max(128),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string; id: string }> },
) {
  const parsedParams = routeParamsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const requestContext = await getBusinessRequestContextForSlug(
    parsedParams.data.slug,
  );

  if (!requestContext) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;
  const parsedQuery = inquiryMessagePaginationSchema.parse({
    before: searchParams.get("before"),
    limit: searchParams.get("limit"),
  });
  const decodedCursor = parsedQuery.before
    ? decodeInquiryMessageCursor(parsedQuery.before)
    : null;

  if (decodedCursor && !decodedCursor.ok) {
    return Response.json({ error: "Invalid message cursor." }, { status: 400 });
  }

  const businessId = requestContext.businessContext.business.id;
  const hasAccess = await inquiryBelongsToBusiness({
    businessId,
    inquiryId: parsedParams.data.id,
  });

  if (!hasAccess) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const page = await getPaginatedInquiryMessagesForBusiness({
    businessId,
    inquiryId: parsedParams.data.id,
    limit: parsedQuery.limit,
    before: decodedCursor?.ok ? decodedCursor.cursor : null,
  });

  return Response.json(page, {
    headers: {
      "cache-control": "private, no-store",
    },
  });
}
