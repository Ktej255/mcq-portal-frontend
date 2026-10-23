import { NextRequest, NextResponse } from "next/server";

import { getLearnerId } from "@/lib/auth/learner-api-access";
import { consumeAdaptiveTeacherRateLimit } from "@/lib/auth/request-rate-limit";

// Longest text we forward to Gemini per field; anything longer is cut, not rejected.
export const OPTIONAL_AI_MAX_TEXT_CHARS = 8_000;
// ~6 MB image once base64-decoded.
export const OPTIONAL_AI_MAX_IMAGE_BASE64_CHARS = 8_000_000;

/**
 * Gate for the Gemini-backed optional routes: signed-in learners only, and the
 * same limit as the adaptive teacher, counted per learner account, so nobody can
 * run up the AI bill. Returns the response to send back, or null when the
 * request may go on.
 */
export async function guardOptionalAiRequest(request: NextRequest): Promise<NextResponse | null> {
  const learnerId = await getLearnerId(request);
  if (!learnerId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const rate = consumeAdaptiveTeacherRateLimit(request, Date.now(), learnerId);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, reason: "rate-limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  return null;
}

export function clampText(value: unknown) {
  return String(value ?? "").slice(0, OPTIONAL_AI_MAX_TEXT_CHARS);
}
