import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUserId } from "@/lib/auth/requireModule";

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
    // 1. Verify caller has admin/owner role in workspace
    const { data: callerMembership, error: callerError } = await client
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (callerError || !callerMembership || (callerMembership.role !== "owner" && callerMembership.role !== "admin")) {
      return noStoreJson({ message: "Forbidden: Only owners and admins can invite members" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id: targetUserId, role = "member" } = body;

    if (!targetUserId) {
      return noStoreJson({ message: "User ID to invite is required" }, { status: 400 });
    }

    // 2. Add the member
    const { data: newMember, error: inviteError } = await client
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: targetUserId,
        role,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(), // auto-accepted for simulation/simplicity in testing
      })
      .select()
      .single();

    if (inviteError) {
      return noStoreJson({ message: `Failed to invite member: ${inviteError.message}` }, { status: 400 });
    }

    return noStoreJson(newMember, { status: 201 });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
