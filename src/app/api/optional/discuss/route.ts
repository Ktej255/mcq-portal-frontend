import { NextRequest, NextResponse } from "next/server";

import { generateGeminiText, geminiApiKey } from "@/lib/ai/gemini";
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

  if (!geminiApiKey()) return unavailable("provider-unavailable");

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

  const reply = await generateGeminiText([{ text: prompt }], { temperature: 0.5 });
  if (!reply) return unavailable("provider-error");
  return NextResponse.json({ ok: true, reply });
}
