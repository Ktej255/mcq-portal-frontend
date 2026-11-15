import { NextRequest, NextResponse } from "next/server";

import { auth as clerkAuth } from "@clerk/nextjs/server";

import { activeAuthProvider } from "@/env";
import { backendBaseUrl } from "@/lib/auth/internal-api-access";
import { hasLearnerApiAccess } from "@/lib/auth/learner-api-access";
import { consumeAdaptiveTeacherRateLimit } from "@/lib/auth/request-rate-limit";

// Longest text we forward to Gemini per field; anything longer is cut, not rejected.
export const OPTIONAL_AI_MAX_TEXT_CHARS = 8_000;
// ~6 MB image once base64-decoded.
export const OPTIONAL_AI_MAX_IMAGE_BASE64_CHARS = 8_000_000;

async function learnerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice("Bearer ".length).trim();
  if (activeAuthProvider !== "clerk") return "";
  try {
    return (await (await clerkAuth()).getToken()) ?? "";
  } catch {
    return "";
  }
}

type Allowance = { status: "allowed" } | { status: "used-up"; retryAfter: string } | { status: "unknown" };

/**
 * Count this request against the learner's daily AI allowance, which the
 * backend keeps in the database. Memory on this server cannot do that job on
 * serverless hosting, where every instance would start its own count.
 */
async function consumeDailyAiAllowance(request: NextRequest): Promise<Allowance> {
  const baseUrl = backendBaseUrl();
  const token = await learnerToken(request);
  if (!baseUrl || !token) return { status: "unknown" };

  try {
    const response = await fetch(`${baseUrl}/auth/ai-usage`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 429) {
      return { status: "used-up", retryAfter: response.headers.get("retry-after") ?? "3600" };
    }
    return response.ok ? { status: "allowed" } : { status: "unknown" };
  } catch {
    return { status: "unknown" };
  }
}

/**
 * Gate for the Gemini-backed optional routes: signed-in learners only, a short
 * burst limit, and the learner's daily AI allowance so nobody can run up the AI
 * bill. If the allowance cannot be checked the request is refused rather than
 * let through uncounted. Returns the response to send back, or null when the
 * request may go on.
 */
export async function guardOptionalAiRequest(request: NextRequest): Promise<NextResponse | null> {
  if (!(await hasLearnerApiAccess(request))) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const rate = consumeAdaptiveTeacherRateLimit(request);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, reason: "rate-limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const allowance = await consumeDailyAiAllowance(request);
  if (allowance.status === "used-up") {
    return NextResponse.json(
      { ok: false, reason: "daily-limit" },
      { status: 429, headers: { "Retry-After": allowance.retryAfter } },
    );
  }
  if (allowance.status === "unknown") {
    return NextResponse.json({ ok: false, reason: "allowance-unavailable" }, { status: 503 });
  }

  return null;
}

export function clampText(value: unknown) {
  return String(value ?? "").slice(0, OPTIONAL_AI_MAX_TEXT_CHARS);
}
