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

    const { data: steps, error: stepsError } = await client
      .from("funnel_steps")
      .select("*")
      .eq("project_id", projectId)
      .order("step_order", { ascending: true });

    if (stepsError) {
      return noStoreJson({ message: `Failed to fetch steps: ${stepsError.message}` }, { status: 500 });
    }

    return noStoreJson(steps || []);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
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
    const { step_type, title, step_order } = body;

    if (!step_type || !title) {
      return noStoreJson({ message: "step_type and title are required" }, { status: 400 });
    }

    // Determine order if not specified: append to end
    let order = step_order;
    if (order === undefined) {
      const { data: maxStep } = await client
        .from("funnel_steps")
        .select("step_order")
        .eq("project_id", projectId)
        .order("step_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      order = maxStep ? maxStep.step_order + 1 : 0;
    }

    const { data: step, error: stepError } = await client
      .from("funnel_steps")
      .insert({
        project_id: projectId,
        step_type,
        title,
        step_order: order,
        content: {},
        settings: {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (stepError || !step) {
      return noStoreJson({ message: `Failed to create step: ${stepError?.message}` }, { status: 500 });
    }

    return noStoreJson(step, { status: 201 });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
