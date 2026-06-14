import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";
import { runFunnelHermesJob } from "@/lib/funnels/hermes/worker";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const authResult = await requireModule(request, "funnels");
  if (!authResult.success) {
    return noStoreJson({ message: authResult.error }, { status: authResult.status });
  }

  const { workspace, userId } = authResult;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { project_id, answers } = body;

    if (!project_id || !answers) {
      return noStoreJson({ message: "project_id and answers are required" }, { status: 400 });
    }

    // 1. Validate project belongs to workspace
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("id")
      .eq("id", project_id)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found in this workspace" }, { status: 404 });
    }

    // 2. Insert hermes_jobs row
    const { data: job, error: jobError } = await client
      .from("hermes_jobs")
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        job_type: "generate_funnel",
        input_data: answers,
        status: "queued"
      })
      .select("id")
      .single();

    if (jobError || !job) {
      return noStoreJson({ message: `Failed to queue Hermes job: ${jobError?.message}` }, { status: 500 });
    }

    // 3. Update funnel_projects
    const { error: updateError } = await client
      .from("funnel_projects")
      .update({
        hermes_job_id: job.id,
        questionnaire_answers: answers,
        updated_at: new Date().toISOString()
      })
      .eq("id", project_id);

    if (updateError) {
      // rollback job
      await client.from("hermes_jobs").delete().eq("id", job.id);
      return noStoreJson({ message: `Failed to update project links: ${updateError.message}` }, { status: 500 });
    }

    // 4. Call runFunnelHermesJob (fire and forget)
    setImmediate(() => {
      runFunnelHermesJob(job.id).catch((err) => {
        console.error("FUNNEL_HERMES_API | Background job execution failed:", err);
      });
    });

    return noStoreJson({ job_id: job.id }, { status: 202 });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
