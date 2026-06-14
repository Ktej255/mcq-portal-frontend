import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ success: false, error: "Database client not available" }, { status: 500 });
  }

  const testId = `test-${Math.random().toString(36).substring(2, 7)}`;
  const testWorkspaceSlug = `vsl-test-slug-${testId}`;
  const testUserId = `test-user-id-${testId}`;

  const results: string[] = [];
  let success = true;

  try {
    // 1. Create Workspace
    const { data: ws, error: wsErr } = await client
      .from("workspaces")
      .insert({
        name: `VSL Test Workspace ${testId}`,
        slug: testWorkspaceSlug,
        plan: "pro",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (wsErr) throw new Error(`Workspace creation failed: ${wsErr.message}`);
    results.push(`Workspace created successfully: ID=${ws.id}`);

    // 2. Add Member as Owner
    const { data: member, error: memErr } = await client
      .from("workspace_members")
      .insert({
        workspace_id: ws.id,
        user_id: testUserId,
        role: "owner",
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (memErr) throw new Error(`Member creation failed: ${memErr.message}`);
    results.push(`Workspace member (owner) created: ID=${member.id}`);

    // 3. Test requireModule before subscription (should fail)
    const reqHeaders = new Headers();
    reqHeaders.set("Authorization", `Bearer MOCK_TOKEN_local_${testUserId}`);
    reqHeaders.set("x-workspace-id", ws.id);
    
    const testReq1 = new NextRequest(new URL("http://localhost/api/v1/test-require-module"), {
      headers: reqHeaders,
    });

    const guardResult1 = await requireModule(testReq1, "vsl");
    if (guardResult1.success === false && guardResult1.code === "MODULE_NOT_SUBSCRIBED") {
      results.push(`Verification PASS: requireModule successfully blocked access with MODULE_NOT_SUBSCRIBED`);
    } else {
      throw new Error(`Verification FAIL: requireModule did not block access or returned unexpected result: ${JSON.stringify(guardResult1)}`);
    }

    // 4. Subscribe workspace to 'vsl' module
    const { data: sub, error: subErr } = await client
      .from("module_subscriptions")
      .insert({
        workspace_id: ws.id,
        module_slug: "vsl",
        status: "active",
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subErr) throw new Error(`Subscription creation failed: ${subErr.message}`);
    results.push(`Module subscription created: ID=${sub.id}`);

    // 5. Test requireModule after subscription (should pass)
    const testReq2 = new NextRequest(new URL("http://localhost/api/v1/test-require-module"), {
      headers: reqHeaders,
    });

    const guardResult2 = await requireModule(testReq2, "vsl");
    if (guardResult2.success === true && guardResult2.workspace.id === ws.id) {
      results.push(`Verification PASS: requireModule successfully allowed access and returned workspace context`);
    } else {
      throw new Error(`Verification FAIL: requireModule failed to authorize or returned unexpected result: ${JSON.stringify(guardResult2)}`);
    }

    // Cleanup
    await client.from("workspaces").delete().eq("id", ws.id);
    results.push(`Cleanup: Test workspace deleted successfully`);

  } catch (err) {
    success = false;
    results.push(`Error encountered: ${err instanceof Error ? err.message : String(err)}`);
  }

  return noStoreJson({
    success,
    results,
  });
}
