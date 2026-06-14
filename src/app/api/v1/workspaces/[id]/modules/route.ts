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
    // 1. Verify membership
    const { data: membership, error: memberError } = await client
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError || !membership) {
      return noStoreJson({ message: "Forbidden: Not a member of this workspace" }, { status: 403 });
    }

    // 2. Fetch active module subscriptions
    const { data: subscriptions, error: subError } = await client
      .from("module_subscriptions")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (subError) {
      return noStoreJson({ message: `Failed to retrieve module subscriptions: ${subError.message}` }, { status: 500 });
    }

    return noStoreJson(subscriptions || []);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
