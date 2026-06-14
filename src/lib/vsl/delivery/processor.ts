/**
 * VSL Delivery — Follow-up Job Processor Engine
 *
 * This is the core dispatcher. It queries pending followup_jobs whose
 * scheduled_at has passed and routes each job to the correct delivery
 * function (email, whatsapp, sms).
 *
 * Called by:
 *  - POST /api/v1/vsl/delivery/process (manual trigger / Vercel Cron)
 *  - GET  /api/v1/cron/process-followups (secured cron endpoint)
 *
 * TODO Phase 3:
 * - Dead-letter queue for jobs that have failed > 3 times
 * - Per-channel concurrency limits to avoid rate limiting
 * - Twenty CRM lead sync on first successful delivery
 * - Listmonk bulk campaign integration
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendFollowupEmail } from "./email";
import { sendFollowupWhatsApp } from "./whatsapp";
import { sendFollowupSMS } from "./sms";
import type { FollowupJobRow, LeadRow, WorkspaceRow } from "./types";

const BATCH_LIMIT = 50; // max jobs processed per run to avoid timeouts

export interface ProcessorResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

export async function processFollowupJobs(
  workspaceId?: string
): Promise<ProcessorResult> {
  const client = getSupabaseAdminClient();
  const result: ProcessorResult = { processed: 0, sent: 0, failed: 0, errors: [] };

  if (!client) {
    result.errors.push("Database client not available");
    return result;
  }

  // Build query: pending jobs whose scheduled_at <= now
  let query = client
    .from("followup_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data: jobs, error: fetchError } = await query;

  if (fetchError) {
    result.errors.push(`Failed to fetch jobs: ${fetchError.message}`);
    return result;
  }

  if (!jobs || jobs.length === 0) {
    return result;
  }

  // Cache workspaces and leads to avoid N+1 queries
  const workspaceCache = new Map<string, WorkspaceRow>();
  const leadCache = new Map<string, LeadRow>();

  for (const job of jobs as FollowupJobRow[]) {
    result.processed++;

    try {
      // Fetch lead (with cache)
      let lead = leadCache.get(job.lead_id);
      if (!lead) {
        const { data: leadRow, error: leadErr } = await client
          .from("leads")
          .select("*")
          .eq("id", job.lead_id)
          .single();

        if (leadErr || !leadRow) {
          const errMsg = `Lead ${job.lead_id} not found: ${leadErr?.message}`;
          result.errors.push(errMsg);
          result.failed++;
          await client
            .from("followup_jobs")
            .update({ status: "failed", metadata: { error: errMsg } })
            .eq("id", job.id);
          continue;
        }
        lead = leadRow as LeadRow;
        leadCache.set(job.lead_id, lead);
      }

      // Fetch workspace (with cache)
      let workspace = workspaceCache.get(job.workspace_id);
      if (!workspace) {
        const { data: wsRow, error: wsErr } = await client
          .from("workspaces")
          .select("*")
          .eq("id", job.workspace_id)
          .single();

        if (wsErr || !wsRow) {
          const errMsg = `Workspace ${job.workspace_id} not found: ${wsErr?.message}`;
          result.errors.push(errMsg);
          result.failed++;
          await client
            .from("followup_jobs")
            .update({ status: "failed", metadata: { error: errMsg } })
            .eq("id", job.id);
          continue;
        }
        workspace = wsRow as WorkspaceRow;
        workspaceCache.set(job.workspace_id, workspace);
      }

      // Route to the correct delivery channel
      let deliveryResult: { success: boolean; error?: string };

      switch (job.channel) {
        case "email":
          deliveryResult = await sendFollowupEmail(job, lead, workspace);
          break;
        case "whatsapp":
          deliveryResult = await sendFollowupWhatsApp(job, lead, workspace);
          break;
        case "sms":
          deliveryResult = await sendFollowupSMS(job, lead, workspace);
          break;
        default:
          deliveryResult = { success: false, error: `Unknown channel: ${job.channel}` };
          await client
            .from("followup_jobs")
            .update({ status: "failed", metadata: { error: deliveryResult.error } })
            .eq("id", job.id);
      }

      if (deliveryResult.success) {
        result.sent++;
      } else {
        result.failed++;
        if (deliveryResult.error) {
          result.errors.push(`Job ${job.id} (${job.channel}): ${deliveryResult.error}`);
        }
      }
    } catch (err: any) {
      // Never let one job crash the entire batch
      const errMsg = `Unexpected error on job ${job.id}: ${err?.message || String(err)}`;
      result.errors.push(errMsg);
      result.failed++;
      try {
        await client
          .from("followup_jobs")
          .update({ status: "failed", metadata: { error: errMsg } })
          .eq("id", job.id);
      } catch {
        // Ignore secondary failure
      }
    }
  }

  return result;
}

export async function processSingleJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseAdminClient();
  if (!client) return { success: false, error: "Database client not available" };

  const { data: job, error: jobErr } = await client
    .from("followup_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return { success: false, error: `Job not found: ${jobErr?.message}` };
  }

  const { data: lead, error: leadErr } = await client
    .from("leads")
    .select("*")
    .eq("id", (job as FollowupJobRow).lead_id)
    .single();

  if (leadErr || !lead) {
    return { success: false, error: `Lead not found: ${leadErr?.message}` };
  }

  const { data: workspace, error: wsErr } = await client
    .from("workspaces")
    .select("*")
    .eq("id", (job as FollowupJobRow).workspace_id)
    .single();

  if (wsErr || !workspace) {
    return { success: false, error: `Workspace not found: ${wsErr?.message}` };
  }

  const typedJob = job as FollowupJobRow;
  const typedLead = lead as LeadRow;
  const typedWorkspace = workspace as WorkspaceRow;

  switch (typedJob.channel) {
    case "email":
      return sendFollowupEmail(typedJob, typedLead, typedWorkspace);
    case "whatsapp":
      return sendFollowupWhatsApp(typedJob, typedLead, typedWorkspace);
    case "sms":
      return sendFollowupSMS(typedJob, typedLead, typedWorkspace);
    default:
      return { success: false, error: `Unknown channel: ${typedJob.channel}` };
  }
}
