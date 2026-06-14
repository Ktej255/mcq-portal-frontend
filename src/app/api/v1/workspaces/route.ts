import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUserId } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return noStoreJson({ message: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, slug, plan = "free" } = body;

    if (!name || !slug) {
      return noStoreJson({ message: "Workspace name and slug are required" }, { status: 400 });
    }

    // 1. Create the workspace
    const { data: workspace, error: wsError } = await client
      .from("workspaces")
      .insert({
        name,
        slug,
        plan,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (wsError) {
      return noStoreJson({ message: `Failed to create workspace: ${wsError.message}` }, { status: 400 });
    }

    // 2. Add the creator as the 'owner'
    const { error: memberError } = await client
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: "owner",
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      // Rollback workspace if member registration fails
      await client.from("workspaces").delete().eq("id", workspace.id);
      return noStoreJson({ message: `Failed to add owner member: ${memberError.message}` }, { status: 500 });
    }

    return noStoreJson(workspace, { status: 201 });
  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
