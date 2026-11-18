import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
const INVALID_LEAD = { ok: false, delivered: false, error: "Invalid lead payload" } as const;
const UNAVAILABLE = { ok: false, delivered: false, error: "Lead delivery is temporarily unavailable" } as const;

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function isLeadPayload(value: unknown): value is LeadPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const payload = value as Record<string, unknown>;
  const stringFields = ["name", "email", "phone", "year", "stage", "hours", "optional", "source"];
  if (stringFields.some((field) => payload[field] !== undefined && typeof payload[field] !== "string")) {
    return false;
  }

  return payload.subjects === undefined ||
    (Array.isArray(payload.subjects) && payload.subjects.every((subject) => typeof subject === "string"));
}

// Server-side address of the FastAPI backend (same env var as the /api/v1 rewrite).
function backendLeadsUrl() {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000")
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "");
  return `${base}/api/v1/leads`;
}

/**
 * Marketing lead capture (lead magnet).
 * Saves the lead in the backend database first, so no lead is lost, then emails
 * the team via Resend when RESEND_API_KEY + LEADS_NOTIFY_EMAIL are configured.
 * Delivery problems never break the visitor's flow.
 */
export async function POST(request: Request) {
  let data: LeadPayload;
  try {
    const parsed: unknown = await request.json();
    if (!isLeadPayload(parsed)) return noStoreJson(INVALID_LEAD, { status: 400 });
    data = parsed;
  } catch {
    return noStoreJson({ ok: false, delivered: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = data.email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(email)) {
    return noStoreJson(
      { ok: false, delivered: false, error: "A valid email is required" },
      { status: 422 },
    );
  }

  let stored = false;
  try {
    const res = await fetch(backendLeadsUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Lets the backend rate-limit by the visitor's IP rather than Vercel's.
        "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify({
        name: data.name || null,
        email,
        phone: data.phone || null,
        source: data.source || "diagnostic",
        answers: {
          year: data.year,
          stage: data.stage,
          hours: data.hours,
          optional: data.optional,
          subjects: data.subjects ?? [],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    stored = res.ok;
    if (!res.ok) console.error(`[lead] backend returned ${res.status}`);
  } catch (error) {
    console.error("[lead] could not reach backend", error);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const notify = process.env.LEADS_NOTIFY_EMAIL?.trim();
  if (!apiKey || !notify) return noStoreJson(UNAVAILABLE, { status: 503 });

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const summary = [
      `Name: ${data.name?.trim() || "-"}`,
      `Email: ${email}`,
      `WhatsApp: ${data.phone?.trim() || "-"}`,
      `Attempt: ${data.year?.trim() || "-"}`,
      `Stage: ${data.stage?.trim() || "-"}`,
      `Hours/day: ${data.hours?.trim() || "-"}`,
      `Optional: ${data.optional?.trim() || "-"}`,
      `Focus areas: ${(data.subjects ?? []).join(", ") || "-"}`,
      `Source: ${data.source?.trim() || "diagnostic"}`,
    ].join("\n");

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Sarit Classes <leads@upsccommand.com>",
      to: [notify],
      subject: `New UPSC lead: ${data.name?.trim() || email}`,
      text: summary,
    });
    if (error) throw new Error("Lead delivery failed");
  } catch {
    return noStoreJson(UNAVAILABLE, { status: 503 });
  }

  return NextResponse.json({ ok: true, stored });
}
