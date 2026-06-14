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
    // 1. Fetch original project
    const { data: originalProject, error: projectError } = await client
      .from("funnel_projects")
      .select("*")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !originalProject) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    // 2. Generate slug for duplicate
    let newSlug = `${originalProject.slug}-copy`;
    const { data: existingProject } = await client
      .from("funnel_projects")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("slug", newSlug)
      .maybeSingle();

    if (existingProject) {
      newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 5)}`;
    }

    // 3. Create cloned project
    const { data: clonedProject, error: cloneError } = await client
      .from("funnel_projects")
      .insert({
        workspace_id: workspace.id,
        name: `${originalProject.name} (Copy)`,
        slug: newSlug,
        description: originalProject.description,
        funnel_type: originalProject.funnel_type,
        status: "draft",
        goal: originalProject.goal,
        questionnaire_answers: originalProject.questionnaire_answers || {},
        settings: originalProject.settings || {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (cloneError || !clonedProject) {
      return noStoreJson({ message: `Failed to duplicate project: ${cloneError?.message}` }, { status: 500 });
    }

    // 4. Copy steps
    const { data: originalSteps, error: stepsError } = await client
      .from("funnel_steps")
      .select("*")
      .eq("project_id", projectId)
      .order("step_order", { ascending: true });

    const clonedSteps = [];
    if (!stepsError && originalSteps) {
      for (const step of originalSteps) {
        const { data: clonedStep } = await client
          .from("funnel_steps")
          .insert({
            project_id: clonedProject.id,
            step_order: step.step_order,
            step_type: step.step_type,
            title: step.title,
            content: step.content,
            settings: step.settings,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (clonedStep) {
          clonedSteps.push(clonedStep);
        }
      }
    }

    return noStoreJson({
      ...clonedProject,
      steps: clonedSteps
    }, { status: 201 });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
