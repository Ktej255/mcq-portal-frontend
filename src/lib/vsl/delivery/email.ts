/**
 * VSL Delivery — Email Channel via Resend
 *
 * TODO Phase 3:
 * - Listmonk bulk campaign integration (vs transactional)
 * - Per-workspace custom sender domain verification flow
 * - Unsubscribe token generation + one-click unsubscribe links
 * - HTML email template system (drag-and-drop builder)
 */

import { Resend } from "resend";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FollowupJobRow, LeadRow, WorkspaceRow } from "./types";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function wrapInHtml(subject: string, body: string, funnelUrl?: string): string {
  const safeBody = body.replace(/\n/g, "<br/>");
  const ctaBlock = funnelUrl
    ? `<p style="margin-top:24px;"><a href="${funnelUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Continue Here →</a></p>`
    : "";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>${subject}</title></head>
<body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 16px;color:#1f2937;">
  <p style="font-size:16px;line-height:1.6;">${safeBody}</p>
  ${ctaBlock}
  <hr style="margin-top:40px;border:none;border-top:1px solid #e5e7eb;"/>
  <p style="font-size:12px;color:#9ca3af;margin-top:16px;">You're receiving this because you expressed interest. Reply to unsubscribe.</p>
</body>
</html>`;
}

function resolveEmailSequence(
  job: FollowupJobRow,
  lead: LeadRow,
  hermesOutput: NonNullable<NonNullable<{ output_data?: { followup_sequences?: { email?: Array<{ subject: string; body: string; send_after_hours: number }> } } }>["output_data"]>
): { subject: string; body: string } | null {
  const emailSeq = hermesOutput?.followup_sequences?.email;
  if (!emailSeq?.length) return null;

  const leadCreatedAt = new Date(lead.created_at).getTime();
  const scheduledAt = new Date(job.scheduled_at).getTime();
  const hoursDiff = (scheduledAt - leadCreatedAt) / (1000 * 60 * 60);

  // Find the closest matching email by send_after_hours
  let closest = emailSeq[0];
  let minDiff = Math.abs(hoursDiff - emailSeq[0].send_after_hours);
  for (const email of emailSeq) {
    const diff = Math.abs(hoursDiff - email.send_after_hours);
    if (diff < minDiff) {
      minDiff = diff;
      closest = email;
    }
  }
  return closest;
}

export async function sendFollowupEmail(
  job: FollowupJobRow,
  lead: LeadRow,
  workspace: WorkspaceRow
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseAdminClient();
  const resend = getResendClient();

  if (!resend) {
    const errMsg = "RESEND_API_KEY not configured";
    if (client) {
      await client
        .from("followup_jobs")
        .update({ status: "failed", metadata: { error: errMsg } })
        .eq("id", job.id);
    }
    return { success: false, error: errMsg };
  }

  try {
    // Fetch the Hermes output for this lead's source funnel
    let resolvedSubject = `Following up on your enquiry`;
    let resolvedBody = `Hi ${lead.name || "there"},\n\nJust checking in about your recent interest. Click below to continue.`;
    const funnelUrl = `https://${workspace.slug}.saritplatform.com`;

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
          const resolved = resolveEmailSequence(job, lead, hermesJob.output_data as any);
          if (resolved) {
            resolvedSubject = resolved.subject;
            resolvedBody = resolved.body;
          }
        }
      }
    }

    // Personalise
    const personalName = lead.name || "there";
    resolvedBody = resolvedBody.replace(/\[name\]/gi, personalName);
    resolvedSubject = resolvedSubject.replace(/\[name\]/gi, personalName);

    const fromAddress =
      process.env.RESEND_API_KEY
        ? `Sarit Platform <onboarding@resend.dev>` // Use resend.dev for testing; custom domain in production
        : `noreply@${workspace.slug}.saritplatform.com`;

    const replyTo = workspace.settings?.reply_to_email || undefined;

    const { error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: [lead.email],
      subject: resolvedSubject,
      html: wrapInHtml(resolvedSubject, resolvedBody, funnelUrl),
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if (sendError) {
      throw new Error(sendError.message);
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
