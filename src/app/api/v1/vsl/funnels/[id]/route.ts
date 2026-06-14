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
      .select("*")
      .eq("id", funnelId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Funnel not found" }, { status: 404 });
    }

    const { data: pages } = await client
      .from("vsl_pages")
      .select("*")
      .eq("funnel_id", funnelId)
      .order("page_order", { ascending: true });

    return noStoreJson({
      ...funnel,
      pages: pages || []
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
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
    // Verify ownership
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
    const { title, ai_trigger_threshold, status } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title;
    if (ai_trigger_threshold !== undefined) updates.ai_trigger_threshold = ai_trigger_threshold;
    if (status !== undefined) updates.status = status;

    const { data: updatedFunnel, error: updateError } = await client
      .from("vsl_funnels")
      .update(updates)
      .eq("id", funnelId)
      .select()
      .single();

    if (updateError) {
      return noStoreJson({ message: `Failed to update funnel: ${updateError.message}` }, { status: 400 });
    }

    return noStoreJson(updatedFunnel);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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
    // Soft delete: status='archived'
    const { data: funnel, error: funnelError } = await client
      .from("vsl_funnels")
      .select("id")
      .eq("id", funnelId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (funnelError || !funnel) {
      return noStoreJson({ message: "Funnel not found" }, { status: 404 });
    }

    const { error: deleteError } = await client
      .from("vsl_funnels")
      .update({
        status: "archived",
        updated_at: new Date().toISOString()
      })
      .eq("id", funnelId);

    if (deleteError) {
      return noStoreJson({ message: `Failed to archive funnel: ${deleteError.message}` }, { status: 400 });
    }

    return noStoreJson({ message: "Funnel archived successfully" });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
