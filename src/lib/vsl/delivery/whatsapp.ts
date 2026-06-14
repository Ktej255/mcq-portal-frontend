/**
 * VSL Delivery — WhatsApp Channel via WhatsApp Business Cloud API
 *
 * Credentials stored in workspace.settings jsonb:
 *   whatsapp_phone_number_id: string
 *   whatsapp_access_token: string
 *   whatsapp_from_number: string
 *
 * TODO Phase 3:
 * - Evolution API self-hosted WhatsApp (full session management)
 * - WhatsApp template message support (for Business API compliance)
 * - Media messages (PDF, image attachments)
 * - Read receipts and reply webhook handling
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FollowupJobRow, LeadRow, WorkspaceRow } from "./types";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

function resolveWhatsAppMessage(
  job: FollowupJobRow,
  lead: LeadRow,
  hermesOutput: Record<string, any>
): string | null {
  const waSeq: Array<{ message: string; send_after_hours: number }> =
    hermesOutput?.followup_sequences?.whatsapp || [];
  if (!waSeq.length) return null;

  const leadCreatedAt = new Date(lead.created_at).getTime();
  const scheduledAt = new Date(job.scheduled_at).getTime();
  const hoursDiff = (scheduledAt - leadCreatedAt) / (1000 * 60 * 60);

  let closest = waSeq[0];
  let minDiff = Math.abs(hoursDiff - waSeq[0].send_after_hours);
  for (const wa of waSeq) {
    const diff = Math.abs(hoursDiff - wa.send_after_hours);
    if (diff < minDiff) {
      minDiff = diff;
      closest = wa;
    }
  }
  return closest.message;
}

export async function sendFollowupWhatsApp(
  job: FollowupJobRow,
  lead: LeadRow,
  workspace: WorkspaceRow
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseAdminClient();

  // Check workspace WhatsApp credentials
  const { whatsapp_phone_number_id, whatsapp_access_token } = workspace.settings || {};

  if (!whatsapp_phone_number_id || !whatsapp_access_token) {
    const errMsg = "WhatsApp not configured for this workspace";
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
    // Resolve message content from Hermes output
    let messageBody = `Hi ${lead.name || "there"}! Just checking in. Visit us here to continue your journey.`;

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
          const resolved = resolveWhatsAppMessage(job, lead, hermesJob.output_data as any);
          if (resolved) messageBody = resolved;
        }
      }
    }

    // Personalise
    messageBody = messageBody.replace(/\[name\]/gi, lead.name || "there");

    // Call WhatsApp Cloud API
    const apiUrl = `${GRAPH_API_BASE}/${whatsapp_phone_number_id}/messages`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsapp_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: lead.phone,
        type: "text",
        text: { body: messageBody },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`WhatsApp API returned ${response.status}: ${errText}`);
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
