import { NextRequest } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { activeAuthProvider } from "@/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getRequestUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";

  // 1. Local mock check (useful for tests)
  const hostname = request.nextUrl.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (token && isLocal && token.startsWith("MOCK_TOKEN")) {
    if (token.startsWith("MOCK_TOKEN_local_")) {
      return token.slice("MOCK_TOKEN_local_".length);
    }
    return token;
  }

  // 2. Clerk Auth
  if (activeAuthProvider === "clerk") {
    try {
      const { userId } = await clerkAuth();
      return userId || null;
    } catch {
      return null;
    }
  }

  // 3. Supabase Auth
  if (!token) return null;
  const client = getSupabaseAdminClient();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export interface WorkspaceContext {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'agency';
  created_at: string;
  updated_at: string;
}

export type RequireModuleResult = 
  | { success: true; workspace: WorkspaceContext; userId: string }
  | { success: false; error: string; code?: string; status: number };

export async function requireModule(
  request: NextRequest,
  moduleSlug: string
): Promise<RequireModuleResult> {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return { success: false, error: "Unauthorized", status: 401 };
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return { success: false, error: "Database client is not configured", status: 500 };
  }

  // Check custom header for workspace ID
  let workspaceId = request.headers.get("x-workspace-id");

  if (!workspaceId) {
    // Check if passed as query param as fallback
    workspaceId = request.nextUrl.searchParams.get("workspaceId");
  }

  if (!workspaceId) {
    // Lookup first workspace they belong to
    const { data: memberships, error: memberError } = await client
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId);

    if (memberError || !memberships || memberships.length === 0) {
      // Self-healing: Automatically create a default workspace, owner membership, and VSL subscription
      try {
        const { data: workspace, error: wsErr } = await client
          .from("workspaces")
          .insert({
            name: "My Workspace",
            slug: `workspace-${Math.random().toString(36).substring(2, 7)}`,
            plan: "free"
          })
          .select()
          .single();

        if (wsErr || !workspace) {
          return { success: false, error: `User is not associated with any workspace (auto-creation failed: ${wsErr?.message})`, status: 403 };
        }

        const { error: memErr } = await client
          .from("workspace_members")
          .insert({
            workspace_id: workspace.id,
            user_id: userId,
            role: "owner"
          });

        if (memErr) {
          await client.from("workspaces").delete().eq("id", workspace.id);
          return { success: false, error: `User is not associated with any workspace (auto-membership failed: ${memErr.message})`, status: 403 };
        }

        // Seed VSL subscription for the new workspace
        await client
          .from("module_subscriptions")
          .insert({
            workspace_id: workspace.id,
            module_slug: "vsl",
            status: "active"
          });

        workspaceId = workspace.id;
      } catch (err) {
        return { success: false, error: "User is not associated with any workspace", status: 403 };
      }
    } else {
      workspaceId = memberships[0].workspace_id;
    }
  } else {
    // Validate workspace membership
    const { data: membership, error: memberError } = await client
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError || !membership) {
      return { success: false, error: "Forbidden: You are not a member of this workspace", status: 403 };
    }
  }

  // Verify module subscription is active or trial
  const { data: subscription, error: subError } = await client
    .from("module_subscriptions")
    .select("status")
    .eq("workspace_id", workspaceId)
    .eq("module_slug", moduleSlug)
    .maybeSingle();

  if (subError || !subscription || (subscription.status !== "active" && subscription.status !== "trial")) {
    return {
      success: false,
      error: `Workspace does not have an active subscription for module '${moduleSlug}'`,
      code: "MODULE_NOT_SUBSCRIBED",
      status: 403
    };
  }

  // Get full workspace context
  const { data: workspace, error: wsError } = await client
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (wsError || !workspace) {
    return { success: false, error: "Workspace details not found", status: 404 };
  }

  return {
    success: true,
    workspace: workspace as WorkspaceContext,
    userId
  };
}
