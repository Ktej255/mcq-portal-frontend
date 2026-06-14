import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import FunnelProjectList from "@/components/funnels/dashboard/FunnelProjectList";

export const dynamic = "force-dynamic";

export default async function FunnelsDashboardPage() {
  // 1. Resolve Auth
  let userId: string | null = null;

  try {
    const cookieStore = await cookies();
    const mockToken = cookieStore.get("MOCK_TOKEN")?.value;
    if (mockToken && mockToken.startsWith("MOCK_TOKEN_local_")) {
      userId = mockToken.slice("MOCK_TOKEN_local_".length);
    }
  } catch (err) {
    console.warn("FunnelsDashboard | Mock cookie check failed:", err);
  }

  if (!userId) {
    try {
      const authSession = await clerkAuth();
      userId = authSession.userId;
    } catch (err) {
      console.warn("FunnelsDashboard | Clerk auth error:", err);
    }
  }

  // Fallback for local testing/dev bypass
  if (!userId && process.env.NODE_ENV === "development") {
    userId = "dev-student-id";
  }

  if (!userId) {
    redirect("/login");
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400">
        <p>Database client not available. Confirm SUPABASE_SECRET_KEY is configured.</p>
      </div>
    );
  }

  // 2. Fetch or create workspace membership
  let { data: memberships, error: memberSelectErr } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);

  let workspaceId = "";
  let workspaceSlug = "";

  if (memberSelectErr || !memberships || memberships.length === 0) {
    const tempSlug = `workspace-${Math.random().toString(36).substring(2, 7)}`;
    const { data: newWorkspace } = await client
      .from("workspaces")
      .insert({
        name: "My Workspace",
        slug: tempSlug,
        plan: "free",
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (newWorkspace) {
      workspaceId = newWorkspace.id;
      workspaceSlug = newWorkspace.slug;

      await client.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: "owner",
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      });

      // Auto-subscribe to funnels
      await client.from("module_subscriptions").insert({
        workspace_id: workspaceId,
        module_slug: "funnels",
        status: "active",
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    } else {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400">
          <p>Failed to initialize user workspace. Please reload.</p>
        </div>
      );
    }
  } else {
    workspaceId = memberships[0].workspace_id;
    const { data: ws } = await client
      .from("workspaces")
      .select("slug")
      .eq("id", workspaceId)
      .maybeSingle();
    workspaceSlug = ws?.slug || "my-workspace";

    // Double check module subscription for funnels module
    const { data: sub } = await client
      .from("module_subscriptions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("module_slug", "funnels")
      .maybeSingle();

    if (!sub) {
      await client.from("module_subscriptions").insert({
        workspace_id: workspaceId,
        module_slug: "funnels",
        status: "active",
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }
  }

  // 3. Fetch all funnel projects in workspace (exclude archived)
  const { data: projects } = await client
    .from("funnel_projects")
    .select("id, name, slug, funnel_type, status, goal, settings, created_at")
    .eq("workspace_id", workspaceId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  const projectList = projects || [];
  const projectIds = projectList.map((p) => p.id);

  // 4. Fetch step counts
  const stepCounts: Record<string, number> = {};
  projectIds.forEach((id) => (stepCounts[id] = 0));
  if (projectIds.length > 0) {
    const { data: steps } = await client
      .from("funnel_steps")
      .select("id, project_id")
      .in("project_id", projectIds);
    if (steps) {
      steps.forEach((s) => {
        if (stepCounts[s.project_id] !== undefined) {
          stepCounts[s.project_id]++;
        }
      });
    }
  }

  // 5. Fetch lead counts
  const leadCounts: Record<string, number> = {};
  projectIds.forEach((id) => (leadCounts[id] = 0));
  if (projectIds.length > 0) {
    const { data: leads } = await client
      .from("leads")
      .select("id, source_id")
      .eq("source_module", "funnels")
      .in("source_id", projectIds);
    if (leads) {
      leads.forEach((l) => {
        if (leadCounts[l.source_id] !== undefined) {
          leadCounts[l.source_id]++;
        }
      });
    }
  }

  // 6. Fetch conversion rates (from views)
  const viewsCounts: Record<string, number> = {};
  projectIds.forEach((id) => (viewsCounts[id] = 0));
  if (projectIds.length > 0) {
    const { data: views } = await client
      .from("funnel_analytics")
      .select("project_id")
      .eq("event_type", "page_view")
      .in("project_id", projectIds);
    if (views) {
      views.forEach((v) => {
        if (viewsCounts[v.project_id] !== undefined) {
          viewsCounts[v.project_id]++;
        }
      });
    }
  }

  const projectsWithMetrics = projectList.map((p) => {
    const totalViews = viewsCounts[p.id] || 0;
    const leadsCount = leadCounts[p.id] || 0;
    const rate = totalViews > 0 ? Math.round((leadsCount / totalViews) * 100 * 10) / 10 : 0;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      funnel_type: p.funnel_type,
      status: p.status,
      created_at: p.created_at,
      step_count: stepCounts[p.id] || 0,
      lead_count: leadsCount,
      conversion_rate: rate
    };
  });

  return (
    <FunnelProjectList
      projects={projectsWithMetrics}
      workspaceSlug={workspaceSlug}
      workspaceId={workspaceId}
    />
  );
}
