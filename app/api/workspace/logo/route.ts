import { getWorkspaceLogoAssetForWorkspace } from "@/features/settings/queries";
import { buildContentDisposition } from "@/lib/files";
import { getCurrentWorkspaceRequestContext } from "@/lib/db/workspace-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { workspaceLogoBucket } from "@/features/settings/utils";

export async function GET() {
  const requestContext = await getCurrentWorkspaceRequestContext();

  if (!requestContext) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
      },
    });
  }

  const asset = await getWorkspaceLogoAssetForWorkspace(
    requestContext.workspaceContext.workspace.id,
  );

  if (!asset?.logoStoragePath) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
      },
    });
  }

  const storageClient = createSupabaseAdminClient();
  const { data, error } = await storageClient.storage
    .from(workspaceLogoBucket)
    .download(asset.logoStoragePath);

  if (error || !data) {
    console.error("Failed to download workspace logo from storage.", error);

    return new Response("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
      },
    });
  }

  return new Response(data, {
    headers: {
      "cache-control": "private, max-age=300, stale-while-revalidate=60",
      "content-disposition": buildContentDisposition(
        asset.logoStoragePath.split("/").pop() ?? "workspace-logo",
        "inline",
      ),
      "content-type": asset.logoContentType ?? "application/octet-stream",
      "x-content-type-options": "nosniff",
    },
  });
}
