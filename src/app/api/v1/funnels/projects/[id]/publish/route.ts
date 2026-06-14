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
    // 1. Verify project ownership and fetch project info
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("*")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    // 2. Fetch steps
    const { data: steps, error: stepsError } = await client
      .from("funnel_steps")
      .select("*")
      .eq("project_id", projectId);

    if (stepsError || !steps || steps.length === 0) {
      return noStoreJson({ message: "Project must have at least 1 step to publish" }, { status: 400 });
    }

    // 3. Snapshot each step's content into published_content
    for (const step of steps) {
      const { error: updateStepError } = await client
        .from("funnel_steps")
        .update({
          published_content: step.content,
          updated_at: new Date().toISOString()
        })
        .eq("id", step.id);

      if (updateStepError) {
        return noStoreJson({ message: `Failed to snapshot step ${step.title}: ${updateStepError.message}` }, { status: 500 });
      }
    }

    // 4. Set status to 'published'
    const { error: updateProjectError } = await client
      .from("funnel_projects")
      .update({
        status: "published",
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId);

    if (updateProjectError) {
      return noStoreJson({ message: `Failed to update project status to published: ${updateProjectError.message}` }, { status: 500 });
    }

    return noStoreJson({
      public_url: `/f/${workspace.slug}/${project.slug}`,
      step_count: steps.length
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
