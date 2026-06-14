import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUserId } from "@/lib/auth/requireModule";

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
  const { id: workspaceId } = await props.params;
  const userId = await getRequestUserId(request);
  if (!userId) {
    return noStoreJson({ message: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    // Check membership
    const { data: membership, error: memberError } = await client
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError || !membership) {
      return noStoreJson({ message: "Forbidden: Not a member of this workspace" }, { status: 403 });
    }

    // Retrieve workspace
    const { data: workspace, error: wsError } = await client
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .maybeSingle();

    if (wsError || !workspace) {
      return noStoreJson({ message: "Workspace not found" }, { status: 404 });
    }

    return noStoreJson(workspace);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/workspaces/[id]
 * Updates workspace name and/or merges settings fields.
 * Only workspace owners can call this.
 * Body: { name?: string, settings?: object }
 * Settings are merged (not overwritten) — only provided keys are updated.
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await props.params;
  const userId = await getRequestUserId(request);
  if (!userId) {
    return noStoreJson({ message: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    // Must be owner to update workspace settings
    const { data: membership, error: memberError } = await client
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError || !membership) {
      return noStoreJson({ message: "Forbidden: Not a member of this workspace" }, { status: 403 });
    }

    if (membership.role !== "owner") {
      return noStoreJson({ message: "Forbidden: Only workspace owners can update settings" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, settings } = body;

    if (!name && !settings) {
      return noStoreJson({ message: "No update fields provided (name or settings required)" }, { status: 400 });
    }

    // Build update object — merge settings, not overwrite
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name) {
      updatePayload.name = name;
    }

    if (settings && typeof settings === "object") {
      // Fetch existing settings first, then merge
      const { data: current } = await client
        .from("workspaces")
        .select("settings")
        .eq("id", workspaceId)
        .single();

      const existingSettings = (current?.settings as Record<string, unknown>) || {};
      updatePayload.settings = { ...existingSettings, ...settings };
    }

    const { data: updated, error: updateError } = await client
      .from("workspaces")
      .update(updatePayload)
      .eq("id", workspaceId)
      .select()
      .single();

    if (updateError || !updated) {
      return noStoreJson({ message: updateError?.message || "Update failed" }, { status: 500 });
    }

    return noStoreJson(updated);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

