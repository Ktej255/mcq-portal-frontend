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
    // 1. Verify caller has admin/owner role in workspace to change subscriptions
    const { data: callerMembership, error: callerError } = await client
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (callerError || !callerMembership || (callerMembership.role !== "owner" && callerMembership.role !== "admin")) {
      return noStoreJson({ message: "Forbidden: Only owners and admins can manage subscriptions" }, { status: 403 });
    }

    const body = await request.json();
    const { module_slug, status = "active", cashfree_subscription_id } = body;

    if (!module_slug) {
      return noStoreJson({ message: "Module slug is required" }, { status: 400 });
    }

    // 2. Upsert the module subscription
    const { data: subscription, error: subError } = await client
      .from("module_subscriptions")
      .upsert(
        {
          workspace_id: workspaceId,
          module_slug,
          status,
          cashfree_subscription_id,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,module_slug" }
      )
      .select()
      .single();

    if (subError) {
      return noStoreJson({ message: `Failed to subscribe: ${subError.message}` }, { status: 400 });
    }

    return noStoreJson(subscription);
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
