import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/auth/requireModule";
import { processSingleJob } from "@/lib/vsl/delivery/processor";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/vsl/delivery/retry
 * Resets a failed job to pending and immediately re-processes it.
 * Body: { job_id: string }
 */
export async function POST(request: NextRequest) {
  const moduleResult = await requireModule(request, "vsl");
  if (!moduleResult.success) {
    return NextResponse.json({ error: moduleResult.error }, { status: moduleResult.status });
  }
  const { workspace } = moduleResult;

  const body = await request.json().catch(() => ({}));
  const { job_id } = body;

  if (!job_id) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Verify job belongs to this workspace
  const { data: job, error: jobErr } = await client
    .from("followup_jobs")
    .select("id, workspace_id, status")
    .eq("id", job_id)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.workspace_id !== workspace.id) {
    return NextResponse.json({ error: "Forbidden: job does not belong to your workspace" }, { status: 403 });
  }

  // Reset job to pending with scheduled_at = now
  const { error: resetErr } = await client
    .from("followup_jobs")
    .update({
      status: "pending",
      scheduled_at: new Date().toISOString(),
      sent_at: null,
      metadata: {},
    })
    .eq("id", job_id);

  if (resetErr) {
    return NextResponse.json({ error: `Failed to reset job: ${resetErr.message}` }, { status: 500 });
  }

  // Immediately process the job
  const result = await processSingleJob(job_id);

  return NextResponse.json({
    success: result.success,
    job_id,
    error: result.error ?? null,
  });
}
