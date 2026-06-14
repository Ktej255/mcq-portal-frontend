import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { name, funnel_type = "general", goal = null, template_id } = body;

    if (!name) {
      return noStoreJson({ message: "name is required" }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(name);
    if (!slug) {
      slug = `funnel-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Check slug conflict
    const { data: existingProject } = await client
      .from("funnel_projects")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("slug", slug)
      .maybeSingle();

    if (existingProject) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
    }

    // 1. Create project
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .insert({
        workspace_id: workspace.id,
        name,
        slug,
        funnel_type,
        status: "draft",
        goal,
        questionnaire_answers: {},
        settings: {
          custom_domain: null,
          ab_test_enabled: false,
          pixel_ids: {},
          thank_you_redirect_url: null
        },
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (projectError || !project) {
      return noStoreJson({ message: `Failed to create project: ${projectError?.message}` }, { status: 500 });
    }

    const createdSteps = [];

    // 2. Set steps based on template
    if (template_id) {
      const { data: template } = await client
        .from("funnel_templates")
        .select("steps_template, funnel_type")
        .eq("id", template_id)
        .maybeSingle();

      if (template) {
        const templateSteps = Array.isArray(template.steps_template) ? template.steps_template : [];
        if (templateSteps.length > 0) {
          // copy steps_template array
          for (let i = 0; i < templateSteps.length; i++) {
            const stepDef = templateSteps[i];
            const { data: step } = await client
              .from("funnel_steps")
              .insert({
                project_id: project.id,
                step_order: stepDef.step_order ?? i,
                step_type: stepDef.step_type ?? "optin",
                title: stepDef.title ?? `Step ${i + 1}`,
                content: stepDef.content ?? {},
                settings: stepDef.settings ?? {},
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            if (step) createdSteps.push(step);
          }
        } else {
          // fallback if template steps are empty: populate based on template funnel_type
          const type = template.funnel_type || funnel_type;
          const defaultSteps = [];
          if (type === "webinar") {
            defaultSteps.push({ step_order: 0, step_type: "webinar_reg", title: "Webinar Registration" });
            defaultSteps.push({ step_order: 1, step_type: "thankyou", title: "Thank You" });
          } else if (type === "sales") {
            defaultSteps.push({ step_order: 0, step_type: "optin", title: "Opt-in Page" });
            defaultSteps.push({ step_order: 1, step_type: "sales", title: "Sales Page" });
            defaultSteps.push({ step_order: 2, step_type: "upsell", title: "Upsell Page" });
            defaultSteps.push({ step_order: 3, step_type: "thankyou", title: "Thank You" });
          } else if (type === "application") {
            defaultSteps.push({ step_order: 0, step_type: "optin", title: "Opt-in Page" });
            defaultSteps.push({ step_order: 1, step_type: "application", title: "Application Form" });
            defaultSteps.push({ step_order: 2, step_type: "thankyou", title: "Thank You" });
          } else if (type === "challenge") {
            defaultSteps.push({ step_order: 0, step_type: "optin", title: "Challenge Registration" });
            defaultSteps.push({ step_order: 1, step_type: "countdown", title: "Countdown Page" });
            defaultSteps.push({ step_order: 2, step_type: "thankyou", title: "Thank You" });
          } else {
            defaultSteps.push({ step_order: 0, step_type: "optin", title: "Opt-in Page" });
            defaultSteps.push({ step_order: 1, step_type: "thankyou", title: "Thank You" });
          }

          for (const stepDef of defaultSteps) {
            const { data: step } = await client
              .from("funnel_steps")
              .insert({
                project_id: project.id,
                step_order: stepDef.step_order,
                step_type: stepDef.step_type,
                title: stepDef.title,
                content: {},
                settings: {},
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            if (step) createdSteps.push(step);
          }
        }
      }
    }

    // 3. Fallback if no template was supplied or successfully created steps
    if (createdSteps.length === 0) {
      const { data: optinStep } = await client
        .from("funnel_steps")
        .insert({
          project_id: project.id,
          step_order: 0,
          step_type: "optin",
          title: "Opt-in Page",
          content: {},
          settings: {},
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      const { data: thankYouStep } = await client
        .from("funnel_steps")
        .insert({
          project_id: project.id,
          step_order: 1,
          step_type: "thankyou",
          title: "Thank You Page",
          content: {},
          settings: {},
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (optinStep) createdSteps.push(optinStep);
      if (thankYouStep) createdSteps.push(thankYouStep);
    }

    return noStoreJson({
      ...project,
      steps: createdSteps
    }, { status: 201 });

  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
    const { data: projects, error: projectError } = await client
      .from("funnel_projects")
      .select("id, name, slug, funnel_type, status, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (projectError || !projects) {
      return noStoreJson({ message: `Failed to retrieve projects: ${projectError?.message}` }, { status: 500 });
    }

    if (projects.length === 0) {
      return noStoreJson([]);
    }

    const projectIds = projects.map((p) => p.id);

    // Get step counts
    const { data: steps, error: stepsError } = await client
      .from("funnel_steps")
      .select("id, project_id")
      .in("project_id", projectIds);

    const stepCounts: Record<string, number> = {};
    projectIds.forEach((id) => (stepCounts[id] = 0));
    if (!stepsError && steps) {
      steps.forEach((s) => {
        if (stepCounts[s.project_id] !== undefined) {
          stepCounts[s.project_id]++;
        }
      });
    }

    // Get lead counts
    const { data: leads, error: leadsError } = await client
      .from("leads")
      .select("id, source_id")
      .eq("source_module", "funnels")
      .in("source_id", projectIds);

    const leadCounts: Record<string, number> = {};
    projectIds.forEach((id) => (leadCounts[id] = 0));
    if (!leadsError && leads) {
      leads.forEach((l) => {
        if (leadCounts[l.source_id] !== undefined) {
          leadCounts[l.source_id]++;
        }
      });
    }

    const response = projects.map((p) => ({
      ...p,
      step_count: stepCounts[p.id],
      lead_count: leadCounts[p.id]
    }));

    return noStoreJson(response);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
