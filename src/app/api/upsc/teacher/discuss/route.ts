import { NextRequest, NextResponse } from "next/server";

import { hasLearnerApiAccess } from "@/lib/auth/learner-api-access";
import {
  consumeDurableAdaptiveTeacherRateLimit,
  requiresDurableAdaptiveTeacherRateLimit,
} from "@/lib/auth/durable-request-rate-limit";
import { consumeAdaptiveTeacherRateLimit } from "@/lib/auth/request-rate-limit";
import {
  buildLocalAdaptiveTeacherResponse,
  ADAPTIVE_TEACHER_MAX_COACH_PROMPT_LENGTH,
  ADAPTIVE_TEACHER_MAX_COACH_SUMMARY_LENGTH,
  ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPT_LENGTH,
  ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPTS,
  ADAPTIVE_TEACHER_MAX_PROVIDER_RESPONSE_BYTES,
  ADAPTIVE_TEACHER_MAX_REQUEST_BYTES,
  ADAPTIVE_TEACHER_PROMPT_VERSION,
  ADAPTIVE_TEACHER_RUBRIC_VERSION,
  getAdaptiveTeacherLevelInstruction,
  parseAdaptiveTeacherRequest,
  parseGeminiCoach,
  resolveAdaptiveTeacherSubject,
} from "@/lib/upsc/adaptiveTeacher";

export const dynamic = "force-dynamic";

const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

const teacherCoachSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      maxLength: ADAPTIVE_TEACHER_MAX_COACH_SUMMARY_LENGTH,
      description: "A concise teacher verdict written for the learner.",
    },
    nextPrompt: {
      type: "string",
      maxLength: ADAPTIVE_TEACHER_MAX_COACH_PROMPT_LENGTH,
      description: "One precise follow-up prompt or forward action.",
    },
    focusConcepts: {
      type: "array",
      maxItems: ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPTS,
      items: { type: "string", maxLength: ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPT_LENGTH },
      description: "Up to five concepts that need attention.",
    },
    providerScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Provider-side estimate of UPSC topic command.",
    },
  },
  required: ["summary", "nextPrompt", "focusConcepts", "providerScore"],
};

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
  if (Number.isFinite(declaredLength) && declaredLength > ADAPTIVE_TEACHER_MAX_REQUEST_BYTES) {
    return { status: "too-large" as const };
  }

  const rawBody = await request.text().catch(() => null);
  if (rawBody === null) return { status: "invalid" as const };
  if (new TextEncoder().encode(rawBody).byteLength > ADAPTIVE_TEACHER_MAX_REQUEST_BYTES) {
    return { status: "too-large" as const };
  }

  try {
    return { status: "ready" as const, body: JSON.parse(rawBody) as unknown };
  } catch {
    return { status: "invalid" as const };
  }
}

export async function POST(request: NextRequest) {
  if (!(await hasLearnerApiAccess(request))) {
    return noStoreJson({ message: "Learner access required" }, { status: 403 });
  }

  const rateLimit = consumeAdaptiveTeacherRateLimit(request);
  if (!rateLimit.allowed) {
    return noStoreJson(
      { message: "Too many teacher requests. Continue after a short pause." },
      {
        status: 429,
        headers: rateLimitHeaders(
          rateLimit.limit,
          rateLimit.remaining,
          rateLimit.retryAfterSeconds,
          "local-process"
        ),
      }
    );
  }

  const durableRateLimit = await consumeDurableAdaptiveTeacherRateLimit(request);
  if (durableRateLimit.status === "enforced" && !durableRateLimit.allowed) {
    return noStoreJson(
      { message: "Too many teacher requests. Continue after a short pause." },
      {
        status: 429,
        headers: rateLimitHeaders(
          durableRateLimit.limit,
          durableRateLimit.remaining,
          durableRateLimit.retryAfterSeconds,
          "supabase-distributed"
        ),
      }
    );
  }

  if (
    durableRateLimit.status !== "enforced" &&
    requiresDurableAdaptiveTeacherRateLimit(request)
  ) {
    return noStoreJson(
      { message: "Teacher service is temporarily unavailable. Continue after a short pause." },
      {
        status: 503,
        headers: rateLimitHeaders(
          durableRateLimit.limit,
          durableRateLimit.remaining,
          durableRateLimit.retryAfterSeconds,
          "supabase-required"
        ),
      }
    );
  }

  if (!hasJsonContentType(request)) {
    return noStoreJson({ message: "JSON teacher discussion request required" }, { status: 415 });
  }

  const parsedBody = await readBoundedJsonBody(request);
  if (parsedBody.status === "too-large") {
    return noStoreJson({ message: "Teacher discussion request is too large" }, { status: 413 });
  }

  const teacherRequest = parseAdaptiveTeacherRequest(parsedBody.status === "ready" ? parsedBody.body : null);
  if (!teacherRequest) {
    return noStoreJson({ message: "Invalid teacher discussion request" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return noStoreJson(buildLocalAdaptiveTeacherResponse(teacherRequest));
  }

  const subject = resolveAdaptiveTeacherSubject(teacherRequest.subjectSlug);
  if (!subject) {
    return noStoreJson({ message: "Invalid teacher discussion request" }, { status: 400 });
  }

  const session = subject.sessions[teacherRequest.day - 1];
  const levelInstruction = getAdaptiveTeacherLevelInstruction(teacherRequest.learnerLevel);
  const prompt = [
    `You are an expert UPSC ${subject.title} teacher.`,
    `The learner is ${teacherRequest.learnerLevel}; act as a ${levelInstruction.role}.`,
    `Topic: ${session.title}.`,
    `Syllabus anchor: ${session.anchor}.`,
    `Target recall: ${subject.recallTarget}%.`,
    `Prompt version: ${ADAPTIVE_TEACHER_PROMPT_VERSION}.`,
    `Rubric version: ${ADAPTIVE_TEACHER_RUBRIC_VERSION}.`,
    `Level-specific diagnosis: ${levelInstruction.diagnosisFrame}`,
    `Level-specific repair: ${levelInstruction.repairFrame}`,
    "Evaluate the explanation for concept recall, mechanism, applied proof, syllabus relevance, and UPSC statement trap.",
    "Do not invent facts. Keep the summary concise. Ask exactly one useful next question or provide one forward action.",
    `Learner explanation: ${teacherRequest.answer}`,
    teacherRequest.challengeAnswer ? `Learner repair explanation: ${teacherRequest.challengeAnswer}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: teacherCoachSchema,
          },
        }),
        signal: AbortSignal.timeout(12_000),
      }
    );

    if (!response.ok) {
      return noStoreJson(
        buildLocalAdaptiveTeacherResponse(teacherRequest, {
          providerConfigured: true,
          fallbackReason: "provider-unavailable",
        })
      );
    }

    const providerRawBody = await response.text();
    if (new TextEncoder().encode(providerRawBody).byteLength > ADAPTIVE_TEACHER_MAX_PROVIDER_RESPONSE_BYTES) {
      return noStoreJson(
        buildLocalAdaptiveTeacherResponse(teacherRequest, {
          providerConfigured: true,
          fallbackReason: "invalid-provider-response",
        })
      );
    }

    const providerBody = JSON.parse(providerRawBody) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const providerText = providerBody.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    const coach = providerText ? parseGeminiCoach(JSON.parse(providerText)) : null;
    if (!coach) {
      return noStoreJson(
        buildLocalAdaptiveTeacherResponse(teacherRequest, {
          providerConfigured: true,
          fallbackReason: "invalid-provider-response",
        })
      );
    }

    const localResponse = buildLocalAdaptiveTeacherResponse(teacherRequest, { providerConfigured: true });
    return noStoreJson({
      ...localResponse,
      mode: "gemini",
      coach,
    });
  } catch {
    return noStoreJson(
      buildLocalAdaptiveTeacherResponse(teacherRequest, {
        providerConfigured: true,
        fallbackReason: "provider-unavailable",
      })
    );
  }
}
