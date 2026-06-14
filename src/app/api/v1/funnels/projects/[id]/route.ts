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
  const { id: projectId } = await props.params;
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
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("*")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    const { data: steps } = await client
      .from("funnel_steps")
      .select("*")
      .eq("project_id", projectId)
      .order("step_order", { ascending: true });

    return noStoreJson({
      ...project,
      steps: steps || []
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await props.params;
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
    // Verify ownership
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
    const { name, goal, settings, status } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name;
    if (goal !== undefined) updates.goal = goal;
    if (settings !== undefined) updates.settings = settings;
    if (status !== undefined) updates.status = status;

    const { data: updatedProject, error: updateError } = await client
      .from("funnel_projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      return noStoreJson({ message: `Failed to update project: ${updateError.message}` }, { status: 400 });
    }

    return noStoreJson(updatedProject);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await props.params;
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
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("id")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    // Soft delete: status='archived'
    const { error: deleteError } = await client
      .from("funnel_projects")
      .update({
        status: "archived",
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId);

    if (deleteError) {
      return noStoreJson({ message: `Failed to archive project: ${deleteError.message}` }, { status: 400 });
    }

    return noStoreJson({ message: "Funnel project archived successfully" });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
