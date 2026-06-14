import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: funnelId } = await props.params;
  const authResult = await requireModule(request, "vsl");
  if (!authResult.success) {
    return noStoreJson({ message: authResult.error }, { status: authResult.status });
  }

  const { workspace } = authResult;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    // 1. Validate funnel belongs to workspace
    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .select("id")
      .eq("id", funnelId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Funnel not found in workspace" }, { status: 404 });
    }

    const bucketName = "vsl-videos";

    // 2. Ensure bucket exists
    const { data: buckets, error: listBucketsError } = await client.storage.listBuckets();
    if (!listBucketsError && buckets) {
      const bucketExists = buckets.some((b) => b.name === bucketName);
      if (!bucketExists) {
        await client.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 50000000, // 50MB limit
        });
      }
    }

    // 3. Generate signed upload URL
    const filePath = `${workspace.id}/${funnelId}/video.mp4`;
    const { data: signedData, error: uploadUrlError } = await client.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (uploadUrlError || !signedData) {
      return noStoreJson({ message: `Failed to create signed upload URL: ${uploadUrlError?.message}` }, { status: 500 });
    }

    return noStoreJson({
      upload_url: signedData.signedUrl,
      path: filePath
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
