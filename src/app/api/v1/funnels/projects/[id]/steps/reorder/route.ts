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
    const { step_ids } = body;

    if (!Array.isArray(step_ids)) {
      return noStoreJson({ message: "step_ids must be an array of strings" }, { status: 400 });
    }

    // Perform sequential updates of step_order
    for (let index = 0; index < step_ids.length; index++) {
      const stepId = step_ids[index];
      const { error: updateError } = await client
        .from("funnel_steps")
        .update({
          step_order: index,
          updated_at: new Date().toISOString()
        })
        .eq("id", stepId)
        .eq("project_id", projectId);

      if (updateError) {
        return noStoreJson({ message: `Failed to update step order for step ID ${stepId}: ${updateError.message}` }, { status: 500 });
      }
    }

    return noStoreJson({ message: "Steps reordered successfully" });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
