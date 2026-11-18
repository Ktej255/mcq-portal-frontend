import { NextRequest, NextResponse } from "next/server";

import { clampText, guardOptionalAiRequest } from "@/lib/auth/optional-ai-guard";

export const runtime = "nodejs";

const PROVIDER_UNAVAILABLE_MESSAGE = "Optional-subject discussion is temporarily unavailable. Please try again.";

function unavailable(reason: string) {
  return NextResponse.json(
    { ok: false, reason, retryable: true, message: PROVIDER_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

// Discussion mentor seam. Uses Gemini when a key is configured; otherwise the
// client service shows an explicit unavailable state.
export async function POST(req: NextRequest) {
  const denied = await guardOptionalAiRequest(req);
  if (denied) return denied;

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return unavailable("provider-unavailable");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const payload = body as { subject?: unknown; context?: unknown; message?: unknown };
  if (typeof payload.message !== "string" || !payload.message.trim()) {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const subject = clampText(payload.subject);
  const context = clampText(payload.context);
  const message = clampText(payload.message.trim());
  const prompt =
    `You are a supportive but rigorous UPSC ${subject} optional mentor. ` +
    `Context the student is working on: ${context}. ` +
    `Student's message: ${message}. ` +
    `Reply in under 120 words with specific, actionable guidance (structure, content, diagrams, examples).`;

  try {
    // Credential transport (audit fix, 2026-10-31): the key
    // goes in the x-goog-api-key header, never in the URL. A `?key=` query
    // string is copied into proxy/access logs, into error text that echoes the
    // request URL, and into browser history for GETs, so it leaks a secret that
    // this route only needs server-side.
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5 } }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!res.ok) return unavailable("provider-error");

    const data = await res.json().catch(() => null) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
    } | null;
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof reply !== "string" || !reply.trim()) return unavailable("invalid-provider-response");

    return NextResponse.json({ ok: true, reply: reply.trim() });
  } catch {
    return unavailable("provider-unavailable");
  }
}
