/**
 * VSL Delivery — SMS Channel via Fast2SMS
 *
 * Credentials stored in workspace.settings jsonb:
 *   fast2sms_api_key: string
 *
 * Get your API key at: https://www.fast2sms.com
 *
 * TODO Phase 3:
 * - DLT template registration for transactional SMS compliance (TRAI India)
 * - Sender ID configuration per workspace
 * - SMS delivery reports via Fast2SMS callback webhook
 * - Fallback to MSG91 if Fast2SMS fails
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FollowupJobRow, LeadRow, WorkspaceRow } from "./types";

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

function resolveSmS(
  job: FollowupJobRow,
  lead: LeadRow,
  hermesOutput: Record<string, any>
): string | null {
  const smsSeq: Array<{ message: string; send_after_hours: number }> =
    hermesOutput?.followup_sequences?.sms || [];
  if (!smsSeq.length) return null;

  const leadCreatedAt = new Date(lead.created_at).getTime();
  const scheduledAt = new Date(job.scheduled_at).getTime();
  const hoursDiff = (scheduledAt - leadCreatedAt) / (1000 * 60 * 60);

  let closest = smsSeq[0];
  let minDiff = Math.abs(hoursDiff - smsSeq[0].send_after_hours);
  for (const sms of smsSeq) {
    const diff = Math.abs(hoursDiff - sms.send_after_hours);
    if (diff < minDiff) {
      minDiff = diff;
      closest = sms;
    }
  }
  // Enforce 160-char SMS limit
  return closest.message.length > 160 ? closest.message.substring(0, 157) + "..." : closest.message;
}

export async function sendFollowupSMS(
  job: FollowupJobRow,
  lead: LeadRow,
  workspace: WorkspaceRow
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseAdminClient();

  // Check workspace SMS credentials
  const { fast2sms_api_key } = workspace.settings || {};

  if (!fast2sms_api_key) {
    const errMsg = "SMS not configured for this workspace";
    if (client) {
      await client
        .from("followup_jobs")
        .update({ status: "failed", metadata: { error: errMsg } })
        .eq("id", job.id);
    }
    return { success: false, error: errMsg };
  }

  // Check lead has a phone number
  if (!lead.phone) {
    const errMsg = "No phone number for lead";
    if (client) {
      await client
        .from("followup_jobs")
        .update({ status: "failed", metadata: { error: errMsg } })
        .eq("id", job.id);
    }
    return { success: false, error: errMsg };
  }

  try {
    // Resolve message from Hermes output
    let smsMessage = `Hi! You recently expressed interest. Visit us to continue.`;

    if (client) {
      const { data: funnel } = await client
        .from("vsl_funnels")
        .select("hermes_job_id")
        .eq("id", lead.source_id)
        .single();

      if (funnel?.hermes_job_id) {
        const { data: hermesJob } = await client
          .from("hermes_jobs")
          .select("output_data")
          .eq("id", funnel.hermes_job_id)
          .single();

        if (hermesJob?.output_data) {
          const resolved = resolveSmS(job, lead, hermesJob.output_data as any);
          if (resolved) smsMessage = resolved;
        }
      }
    }

    // Personalise and truncate to 160 chars
    smsMessage = smsMessage.replace(/\[name\]/gi, lead.name || "there");
    if (smsMessage.length > 160) smsMessage = smsMessage.substring(0, 157) + "...";

    // Strip non-numeric chars from phone for Fast2SMS
    const phoneNumber = lead.phone.replace(/\D/g, "");

    // Call Fast2SMS API
    const params = new URLSearchParams({
      authorization: fast2sms_api_key,
      message: smsMessage,
      language: "english",
      route: "q", // quick/transactional route
      numbers: phoneNumber,
    });

    const response = await fetch(`${FAST2SMS_URL}?${params.toString()}`, {
      method: "GET",
      headers: { "cache-control": "no-cache" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fast2SMS returned ${response.status}: ${errText}`);
    }

    const body = await response.json();
    if (body?.return === false || body?.status_code === 999) {
      throw new Error(`Fast2SMS error: ${JSON.stringify(body?.message || body)}`);
    }

    if (client) {
      await client
        .from("followup_jobs")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", job.id);
    }

    return { success: true };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (client) {
      await client
        .from("followup_jobs")
        .update({ status: "failed", metadata: { error: errMsg } })
        .eq("id", job.id);
    }
    return { success: false, error: errMsg };
  }
}
