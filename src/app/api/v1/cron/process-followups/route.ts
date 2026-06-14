import { NextRequest, NextResponse } from "next/server";
import { processFollowupJobs } from "@/lib/vsl/delivery/processor";

export const dynamic = "force-dynamic";
// NOTE: Vercel Hobby plan fires cron at most once daily.
// Vercel Pro plan fires at the schedule defined in vercel.json (*/15 * * * *).
// For sub-minute delivery windows, use a Supabase Edge Function scheduled trigger.

/**
 * GET /api/v1/cron/process-followups
 * Secured production cron endpoint called by Vercel Cron automatically.
 * Processes ALL pending followup_jobs across ALL workspaces.
 *
 * Security: Must include x-cron-secret header matching CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    // If CRON_SECRET is not set, only allow in local dev (no secret validation)
    const isLocalDev = process.env.NODE_ENV === "development";
    if (!isLocalDev) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
  } else {
    const incomingSecret = request.headers.get("x-cron-secret");
    if (incomingSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();

  // Process all pending jobs across all workspaces
  const result = await processFollowupJobs(); // no workspaceId = all workspaces

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    triggered_at: new Date().toISOString(),
    duration_ms: durationMs,
    ...result,
  });
}
