import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/auth/requireModule";
import { processFollowupJobs } from "@/lib/vsl/delivery/processor";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/vsl/delivery/process
 * Triggers processing of pending followup_jobs for the authenticated workspace.
 * Body: { workspace_id?: string } — if omitted, uses the authenticated workspace.
 *
 * In production this is called by the Vercel Cron job every 15 minutes.
 * On free Vercel plan, cron fires once daily.
 */
export async function POST(request: NextRequest) {
  const moduleResult = await requireModule(request, "vsl");
  if (!moduleResult.success) {
    return NextResponse.json({ error: moduleResult.error }, { status: moduleResult.status });
  }
  const { workspace } = moduleResult;

  const body = await request.json().catch(() => ({}));
  const targetWorkspaceId: string = body?.workspace_id || workspace.id;

  // Only allow processing own workspace unless user is platform admin
  if (targetWorkspaceId !== workspace.id) {
    return NextResponse.json({ error: "Forbidden: can only process your own workspace jobs" }, { status: 403 });
  }

  const result = await processFollowupJobs(targetWorkspaceId);

  return NextResponse.json({
    success: true,
    ...result,
  });
}

/**
 * GET /api/v1/vsl/delivery/process
 * Returns count of pending jobs for the authenticated workspace.
 */
export async function GET(request: NextRequest) {
  const moduleResult = await requireModule(request, "vsl");
  if (!moduleResult.success) {
    return NextResponse.json({ error: moduleResult.error }, { status: moduleResult.status });
  }
  const { workspace } = moduleResult;

  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { count } = await client
    .from("followup_jobs")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("status", "pending");

  const { data: nextJob } = await client
    .from("followup_jobs")
    .select("scheduled_at")
    .eq("workspace_id", workspace.id)
    .eq("status", "pending")
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  return NextResponse.json({
    pending_count: count ?? 0,
    next_job_scheduled_at: nextJob?.scheduled_at ?? null,
  });
}
