import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface FunnelProjectRow {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  funnel_type: string;
  status: 'draft' | 'published' | 'archived';
  goal: string | null;
  hermes_job_id: string | null;
  questionnaire_answers: any;
  settings: {
    custom_domain?: string | null;
    ab_test_enabled?: boolean;
    pixel_ids?: Record<string, string>;
    thank_you_redirect_url?: string | null;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface FunnelStepRow {
  id: string;
  project_id: string;
  step_order: number;
  step_type: string;
  title: string;
  content: any;
  published_content: any;
  settings: {
    show_progress_bar?: boolean;
    timer_minutes?: number;
    skip_allowed?: boolean;
    redirect_url_on_skip?: string | null;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Fetches the next step in sequence for a project.
 * Returns null if the current step is the last one.
 */
export async function getNextStep(
  projectId: string,
  currentStepOrder: number
): Promise<FunnelStepRow | null> {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error("getNextStep | Database client not configured");
    return null;
  }

  try {
    const { data: step, error } = await client
      .from("funnel_steps")
      .select("*")
      .eq("project_id", projectId)
      .eq("step_order", currentStepOrder + 1)
      .maybeSingle();

    if (error) {
      console.error("getNextStep | Error fetching next step:", error);
      return null;
    }

    return step as FunnelStepRow | null;
  } catch (err) {
    console.error("getNextStep | Unexpected error:", err);
    return null;
  }
}

/**
 * Fetches the published funnel along with its steps and workspace context.
 */
export async function getPublicFunnelData(
  workspaceSlug: string,
  funnelSlug: string
): Promise<{
  project: FunnelProjectRow;
  steps: FunnelStepRow[];
  workspace: WorkspaceRow;
} | null> {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error("getPublicFunnelData | Database client not configured");
    return null;
  }

  try {
    // 1. Fetch workspace first
    const { data: workspace, error: wsError } = await client
      .from("workspaces")
      .select("*")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (wsError || !workspace) {
      return null;
    }

    // 2. Fetch project
    const { data: project, error: projError } = await client
      .from("funnel_projects")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("slug", funnelSlug)
      .eq("status", "published")
      .maybeSingle();

    if (projError || !project) {
      return null;
    }

    // 3. Fetch steps
    const { data: steps, error: stepsError } = await client
      .from("funnel_steps")
      .select("*")
      .eq("project_id", project.id)
      .order("step_order", { ascending: true });

    if (stepsError || !steps || steps.length === 0) {
      return null;
    }

    return {
      project: project as FunnelProjectRow,
      steps: steps as FunnelStepRow[],
      workspace: workspace as WorkspaceRow
    };
  } catch (err) {
    console.error("getPublicFunnelData | Unexpected error:", err);
    return null;
  }
}

/**
 * Tracks a funnel analytics event asynchronously (non-blocking, fire and forget).
 */
export function trackFunnelEvent(
  projectId: string,
  stepId: string,
  visitorToken: string,
  eventType: string,
  metadata: object = {}
): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error("trackFunnelEvent | Database client not configured");
    return Promise.resolve();
  }

  // Fire and forget using an async function
  (async () => {
    try {
      const { error } = await client
        .from("funnel_analytics")
        .insert({
          project_id: projectId,
          step_id: stepId,
          visitor_token: visitorToken,
          event_type: eventType,
          metadata
        });
      if (error) {
        console.error(`trackFunnelEvent | Failed to save event ${eventType}:`, error.message);
      }
    } catch (err: any) {
      console.error(`trackFunnelEvent | Unexpected error saving event ${eventType}:`, err?.message || String(err));
    }
  })();

  return Promise.resolve();
}
