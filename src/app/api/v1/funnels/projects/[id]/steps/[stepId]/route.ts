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
  props: { params: Promise<{ id: string; stepId: string }> }
) {
  const { id: projectId, stepId } = await props.params;
  const authResult = await requireModule(request, "funnels");
  if (!authResult.success) {
    return noStoreJson({ message: authResult.error }, { status: authResult.status });
  }

  const { workspace } = authResult;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    // Verify project ownership
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("id")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    const { data: step, error: stepError } = await client
      .from("funnel_steps")
      .select("*")
      .eq("id", stepId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (stepError || !step) {
      return noStoreJson({ message: "Step not found" }, { status: 404 });
    }

    return noStoreJson(step);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string; stepId: string }> }
) {
  const { id: projectId, stepId } = await props.params;
  const authResult = await requireModule(request, "funnels");
  if (!authResult.success) {
    return noStoreJson({ message: authResult.error }, { status: authResult.status });
  }

  const { workspace } = authResult;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    // Verify project ownership
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("id")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, settings, title, step_type } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (content !== undefined) updates.content = content;
    if (settings !== undefined) updates.settings = settings;
    if (title !== undefined) updates.title = title;
    if (step_type !== undefined) updates.step_type = step_type;

    const { data: updatedStep, error: updateError } = await client
      .from("funnel_steps")
      .update(updates)
      .eq("id", stepId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (updateError || !updatedStep) {
      return noStoreJson({ message: `Failed to update step: ${updateError?.message}` }, { status: 400 });
    }

    return noStoreJson(updatedStep);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; stepId: string }> }
) {
  const { id: projectId, stepId } = await props.params;
  const authResult = await requireModule(request, "funnels");
  if (!authResult.success) {
    return noStoreJson({ message: authResult.error }, { status: authResult.status });
  }

  const { workspace } = authResult;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    // Verify project ownership
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("id")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    const { error: deleteError } = await client
      .from("funnel_steps")
      .delete()
      .eq("id", stepId)
      .eq("project_id", projectId);

    if (deleteError) {
      return noStoreJson({ message: `Failed to delete step: ${deleteError.message}` }, { status: 400 });
    }

    return noStoreJson({ message: "Step deleted successfully" });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
