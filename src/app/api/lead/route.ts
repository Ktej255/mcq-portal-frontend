import { NextResponse } from "next/server";

export const runtime = "nodejs";

type LeadPayload = {
  name?: string;
  email?: string;
  phone?: string;
  year?: string;
  stage?: string;
  hours?: string;
  optional?: string;
  subjects?: string[];
  source?: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Marketing lead capture (lead magnet).
 * Accepts a lead from the diagnostic and, when RESEND_API_KEY + LEADS_NOTIFY_EMAIL
 * are configured, emails the team via Resend (consistent with the existing
 * delivery layer). Without those env vars it still accepts gracefully so the
 * user flow never breaks; the lead is also persisted client-side.
 */
export async function POST(request: Request) {
  let data: LeadPayload;
  try {
    data = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (data.email ?? "").trim();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required" }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const notify = process.env.LEADS_NOTIFY_EMAIL?.trim();

  if (apiKey && notify) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const summary = [
        `Name: ${data.name || "-"}`,
        `Email: ${email}`,
        `WhatsApp: ${data.phone || "-"}`,
        `Attempt: ${data.year || "-"}`,
        `Stage: ${data.stage || "-"}`,
        `Hours/day: ${data.hours || "-"}`,
        `Optional: ${data.optional || "-"}`,
        `Focus areas: ${(data.subjects ?? []).join(", ") || "-"}`,
        `Source: ${data.source || "diagnostic"}`,
      ].join("\n");

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Sarit Classes <leads@upsccommand.com>",
        to: [notify],
        subject: `New UPSC lead: ${data.name || email}`,
        text: summary,
      });
    } catch {
      // Never fail the user flow on a delivery error.
    }
  }

  return NextResponse.json({ ok: true });
}
