import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";
import { triggerTranscription } from "@/lib/vsl/video/transcribe";

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

    const body = await request.json();
    const { path: filePath } = body;

    if (!filePath) {
      return noStoreJson({ message: "path is required" }, { status: 400 });
    }

    // 2. Get public URL
    const { data: publicUrlData } = client.storage
      .from("vsl-videos")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return noStoreJson({ message: "Failed to retrieve public URL of the uploaded video" }, { status: 500 });
    }

    const publicUrl = publicUrlData.publicUrl;

    // 3. Update vsl_funnels.video_url
    const { error: updateError } = await client
      .from("vsl_funnels")
      .update({
        video_url: publicUrl,
        transcription_status: "processing",
        updated_at: new Date().toISOString()
      })
      .eq("id", funnelId);

    if (updateError) {
      return noStoreJson({ message: `Failed to update funnel video URL: ${updateError.message}` }, { status: 500 });
    }

    // 4. Trigger transcription (fire and forget)
    setImmediate(() => {
      triggerTranscription(funnelId, publicUrl).catch((err) => {
        console.error("TRANSCRIBE_API | Background transcription job failed:", err);
      });
    });

    return noStoreJson({
      video_url: publicUrl,
      transcription_status: "processing"
    }, { status: 200 });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
