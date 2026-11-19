import { NextRequest, NextResponse } from "next/server";

import { hasLearnerApiAccess } from "@/lib/auth/learner-api-access";
import {
  consumeDurableAdaptiveTeacherRateLimit,
  requiresDurableAdaptiveTeacherRateLimit,
} from "@/lib/auth/durable-request-rate-limit";
import { consumeAdaptiveTeacherRateLimit } from "@/lib/auth/request-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 16_384;
const PROVIDER_UNAVAILABLE_MESSAGE = "Optional-subject discussion is temporarily unavailable. Please try again.";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function rateLimitHeaders(limit: number, remaining: number, retryAfterSeconds: number, scope: string) {
  return {
    "Retry-After": String(retryAfterSeconds),
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Scope": scope,
  };
}

function hasJsonContentType(request: NextRequest) {
  return request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() === "application/json";
}

async function readBoundedJsonBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return { status: "too-large" as const };
  }

  const rawBody = await request.text().catch(() => null);
  if (rawBody === null) return { status: "invalid" as const };
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return { status: "too-large" as const };
  }

  try {
    return { status: "ready" as const, body: JSON.parse(rawBody) as unknown };
  } catch {
    return { status: "invalid" as const };
  }
}

function unavailable(reason: string) {
  return noStoreJson(
    { ok: false, reason, retryable: true, message: PROVIDER_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

// Discussion mentor seam. Uses Gemini when a key is configured; otherwise the
// client service shows an explicit unavailable state.
export async function POST(req: NextRequest) {
  if (!(await hasLearnerApiAccess(req))) {
    return noStoreJson({ ok: false, reason: "unauthorized", message: "Learner access required" }, { status: 403 });
  }

  const rateLimit = consumeAdaptiveTeacherRateLimit(req);
  if (!rateLimit.allowed) {
    return noStoreJson(
      { ok: false, reason: "rate-limited", retryable: true, message: "Too many discussion requests. Continue after a short pause." },
      {
        status: 429,
        headers: rateLimitHeaders(
          rateLimit.limit,
          rateLimit.remaining,
          rateLimit.retryAfterSeconds,
          "local-process",
        ),
      },
    );
  }

  const durableRateLimit = await consumeDurableAdaptiveTeacherRateLimit(req);
  if (durableRateLimit.status === "enforced" && !durableRateLimit.allowed) {
    return noStoreJson(
      { ok: false, reason: "rate-limited", retryable: true, message: "Too many discussion requests. Continue after a short pause." },
      {
        status: 429,
        headers: rateLimitHeaders(
          durableRateLimit.limit,
          durableRateLimit.remaining,
          durableRateLimit.retryAfterSeconds,
          "supabase-distributed",
        ),
      },
    );
  }

  if (
    durableRateLimit.status !== "enforced" &&
    requiresDurableAdaptiveTeacherRateLimit(req)
  ) {
    return noStoreJson(
      { ok: false, reason: "rate-limit-unavailable", retryable: true, message: PROVIDER_UNAVAILABLE_MESSAGE },
      {
        status: 503,
        headers: rateLimitHeaders(
          durableRateLimit.limit,
          durableRateLimit.remaining,
          durableRateLimit.retryAfterSeconds,
          "supabase-required",
        ),
      },
    );
  }

  if (!hasJsonContentType(req)) {
    return noStoreJson({ ok: false, reason: "unsupported-media-type", message: "JSON discussion request required" }, { status: 415 });
  }

  const parsedBody = await readBoundedJsonBody(req);
  if (parsedBody.status === "too-large") {
    return noStoreJson({ ok: false, reason: "payload-too-large", message: "Discussion request is too large" }, { status: 413 });
  }
  if (parsedBody.status !== "ready") {
    return noStoreJson({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const body = parsedBody.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return noStoreJson({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const payload = body as { subject?: unknown; context?: unknown; message?: unknown };
  if (typeof payload.message !== "string" || !payload.message.trim()) {
    return noStoreJson({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!key) return unavailable("provider-unavailable");

  const model = process.env.GEMINI_MODEL_ID?.trim() || "gemini-2.5-flash";
  const subject = typeof payload.subject === "string" ? payload.subject.slice(0, 120) : "";
  const context = typeof payload.context === "string" ? payload.context.slice(0, 2000) : "";
  const message = payload.message.trim().slice(0, 4000);
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
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
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

    return noStoreJson({ ok: true, reply: reply.trim() });
  } catch {
    return unavailable("provider-unavailable");
  }
}
