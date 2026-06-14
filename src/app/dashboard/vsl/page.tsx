import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { FunnelList } from "@/components/vsl/dashboard/FunnelList";

export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage() {
  // 1. Resolve Auth
  let userId: string | null = null;
  
  try {
    const cookieStore = await cookies();
    const mockToken = cookieStore.get("MOCK_TOKEN")?.value;
    if (mockToken && mockToken.startsWith("MOCK_TOKEN_local_")) {
      userId = mockToken.slice("MOCK_TOKEN_local_".length);
    }
  } catch (err) {
    console.warn("DASHBOARD | Mock cookie check failed:", err);
  }

  if (!userId) {
    try {
      const authSession = await clerkAuth();
      userId = authSession.userId;
    } catch (err) {
      console.warn("DASHBOARD | Clerk auth error:", err);
    }
  }

  console.log("DASHBOARD_VSL | Resolved userId:", userId);

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
    // Auto-create workspace for seamless onboarding
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

      // Add owner role
      await client.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: "owner",
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      });

      // Auto-subscribe to VSL so creator doesn't hit the module access guard block
      await client.from("module_subscriptions").insert({
        workspace_id: workspaceId,
        module_slug: "vsl",
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
  }

  // 3. Fetch all funnels in workspace
  const { data: funnels } = await client
    .from("vsl_funnels")
    .select("id, title, slug, status, created_at, video_url, transcription_status")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  // 4. Fetch session metrics per funnel
  const list = funnels || [];
  const funnelIds = list.map((f) => f.id);
  
  const statsMap: Record<string, { session_count: number; lead_count: number }> = {};
  funnelIds.forEach((id) => {
    statsMap[id] = { session_count: 0, lead_count: 0 };
  });

  if (funnelIds.length > 0) {
    const { data: sessions } = await client
      .from("vsl_sessions")
      .select("funnel_id, converted")
      .in("funnel_id", funnelIds);

    if (sessions) {
      sessions.forEach((s) => {
        if (statsMap[s.funnel_id]) {
          statsMap[s.funnel_id].session_count++;
          if (s.converted) {
            statsMap[s.funnel_id].lead_count++;
          }
        }
      });
    }
  }

  const funnelsWithStats = list.map((f) => ({
    ...f,
    session_count: statsMap[f.id].session_count,
    lead_count: statsMap[f.id].lead_count,
  }));

  return (
    <FunnelList
      funnels={funnelsWithStats}
      workspaceSlug={workspaceSlug}
      workspaceId={workspaceId}
    />
  );
}
