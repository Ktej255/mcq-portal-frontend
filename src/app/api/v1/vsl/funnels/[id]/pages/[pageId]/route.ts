import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id: funnelId, pageId } = await props.params;
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
    // 1. Verify funnel ownership
    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .select("id")
      .eq("id", funnelId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Funnel not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "object") {
      return noStoreJson({ message: "content object is required" }, { status: 400 });
    }

    // 2. Save Puck page JSON
    const { data: page, error: pageError } = await client
      .from("vsl_pages")
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq("id", pageId)
      .eq("funnel_id", funnelId)
      .select()
      .single();

    if (pageError) {
      return noStoreJson({ message: `Failed to save page contents: ${pageError.message}` }, { status: 400 });
    }

    return noStoreJson(page);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
