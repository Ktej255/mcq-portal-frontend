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
    // 1. Verify project ownership
    const { data: project, error: projectError } = await client
      .from("funnel_projects")
      .select("id")
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (projectError || !project) {
      return noStoreJson({ message: "Funnel project not found" }, { status: 404 });
    }

    // 2. Fetch steps
    const { data: steps, error: stepsError } = await client
      .from("funnel_steps")
      .select("id, title, step_order")
      .eq("project_id", projectId)
      .order("step_order", { ascending: true });

    if (stepsError || !steps) {
      return noStoreJson({ message: `Failed to fetch steps: ${stepsError?.message}` }, { status: 500 });
    }

    // 3. Fetch analytics events
    const { data: events, error: eventsError } = await client
      .from("funnel_analytics")
      .select("*")
      .eq("project_id", projectId);

    const eventList = events || [];

    // 4. Fetch lead count
    const { count: totalLeads, error: leadsError } = await client
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("source_module", "funnels")
      .eq("source_id", projectId);

    const leadCount = totalLeads || 0;

    // Calculate total visitors (unique visitor tokens)
    const uniqueVisitors = new Set(eventList.map((e) => e.visitor_token));
    const totalVisitors = uniqueVisitors.size;

    // Calculate step metrics
    const stepMetrics = steps.map((step) => {
      const stepViews = eventList.filter(
        (e) => e.step_id === step.id && e.event_type === "page_view"
      ).length;

      const stepCompletions = eventList.filter(
        (e) => e.step_id === step.id && (e.event_type === "step_complete" || e.event_type === "form_submit")
      ).length;

      // Ensure completions doesn't exceed views for metric sanity
      const sanitizedCompletions = Math.min(stepCompletions, stepViews);

      const dropOffRate = stepViews > 0 
        ? Math.round((1 - sanitizedCompletions / stepViews) * 100 * 10) / 10 
        : 0;

      return {
        step_id: step.id,
        step_title: step.title,
        step_order: step.step_order,
        views: stepViews,
        completions: sanitizedCompletions,
        drop_off_rate: dropOffRate
      };
    });

    // Calculate top exit steps
    // Exit step: for each visitor, find their last event chronologically
    const visitorLastEvent: Record<string, typeof eventList[0]> = {};
    eventList.forEach((event) => {
      const existing = visitorLastEvent[event.visitor_token];
      if (!existing || new Date(event.created_at || "") > new Date(existing.created_at || "")) {
        visitorLastEvent[event.visitor_token] = event;
      }
    });

    const exitCountsByStepId: Record<string, number> = {};
    steps.forEach((s) => (exitCountsByStepId[s.id] = 0));

    Object.values(visitorLastEvent).forEach((event) => {
      if (exitCountsByStepId[event.step_id] !== undefined) {
        exitCountsByStepId[event.step_id]++;
      }
    });

    // Map step IDs to titles and sort by exits descending
    const exitSteps = steps
      .map((s) => ({
        title: s.title,
        exits: exitCountsByStepId[s.id] || 0
      }))
      .filter((s) => s.exits > 0)
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 2)
      .map((s) => s.title);

    const overallConversionRate = totalVisitors > 0 
      ? Math.round((leadCount / totalVisitors) * 100 * 10) / 10 
      : 0;

    return noStoreJson({
      total_visitors: totalVisitors,
      step_metrics: stepMetrics,
      total_leads: leadCount,
      overall_conversion_rate: overallConversionRate,
      top_exit_steps: exitSteps
    });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
