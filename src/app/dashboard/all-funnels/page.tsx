import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUnifiedFunnelList } from "@/lib/funnels/unifiedView";
import UnifiedFunnelList from "@/components/funnels/dashboard/UnifiedFunnelList";

export const dynamic = "force-dynamic";

export default async function AllFunnelsDashboardPage() {
  // 1. Resolve Auth
  let userId: string | null = null;

  try {
    const cookieStore = await cookies();
    const mockToken = cookieStore.get("MOCK_TOKEN")?.value;
    if (mockToken && mockToken.startsWith("MOCK_TOKEN_local_")) {
      userId = mockToken.slice("MOCK_TOKEN_local_".length);
    }
  } catch (err) {
    console.warn("AllFunnelsDashboard | Mock cookie check failed:", err);
  }

  if (!userId) {
    try {
      const authSession = await clerkAuth();
      userId = authSession.userId;
    } catch (err) {
      console.warn("AllFunnelsDashboard | Clerk auth error:", err);
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

  // 2. Fetch workspace membership
  const { data: memberships, error: memberSelectErr } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);

  if (memberSelectErr || !memberships || memberships.length === 0) {
    // If no workspace, they will redirect to specific dashboard, which will auto-scaffold it
    redirect("/dashboard/funnels");
  }

  const workspaceId = memberships[0].workspace_id;

  // 3. Query active modules
  const { data: subscriptions } = await client
    .from("module_subscriptions")
    .select("module_slug, status")
    .eq("workspace_id", workspaceId)
    .in("status", ["active", "trial"]);

  const activeModules = (subscriptions || []).map((s) => s.module_slug);

  const hasVsl = activeModules.includes("vsl");
  const hasFunnels = activeModules.includes("funnels");

  // 4. Handle redirects based on active modules
  if (hasVsl && !hasFunnels) {
    redirect("/dashboard/vsl");
  } else if (!hasVsl && hasFunnels) {
    redirect("/dashboard/funnels");
  } else if (!hasVsl && !hasFunnels) {
    // Scaffold both/funnels dashboard to run subscription check auto-scaffold
    redirect("/dashboard/funnels");
  }

  // Both are active, fetch unified view list
  const unifiedItems = await getUnifiedFunnelList(workspaceId, activeModules);

  // Fetch workspace details for slug
  const { data: ws } = await client
    .from("workspaces")
    .select("slug")
    .eq("id", workspaceId)
    .maybeSingle();
  const workspaceSlug = ws?.slug || "my-workspace";

  return (
    <UnifiedFunnelList
      items={unifiedItems}
      workspaceSlug={workspaceSlug}
    />
  );
}
