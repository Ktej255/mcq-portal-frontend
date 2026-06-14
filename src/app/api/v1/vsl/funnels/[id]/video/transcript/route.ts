import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(
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
    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .select("transcription_status, video_transcript")
      .eq("id", funnelId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Funnel not found in workspace" }, { status: 404 });
    }

    return noStoreJson({
      transcription_status: funnel.transcription_status,
      transcript: funnel.video_transcript || null
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
