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
  ADAPTIVE_TEACHER_MAX_DOUBT_FIELD_LENGTH,
  ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPT_LENGTH,
  ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPTS,
  ADAPTIVE_TEACHER_MAX_PROVIDER_RESPONSE_BYTES,
  ADAPTIVE_TEACHER_MAX_REQUEST_BYTES,
  ADAPTIVE_TEACHER_PROMPT_VERSION,
  ADAPTIVE_TEACHER_RUBRIC_VERSION,
  getAdaptiveTeacherLevelInstruction,
  parseAdaptiveTeacherCoach,
  parseAdaptiveTeacherRequest,
  resolveAdaptiveTeacherSubject,
} from "@/lib/upsc/adaptiveTeacher";

export const dynamic = "force-dynamic";

const nvidiaBaseUrl = process.env.NVIDIA_API_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1";
const nvidiaTeacherModel = process.env.NVIDIA_TEACHER_MODEL?.trim() || "z-ai/glm-5.1";
const nvidiaChatModel = process.env.NVIDIA_CHAT_MODEL?.trim() || "deepseek-ai/deepseek-v4-flash";
const nvidiaTeacherMaxTokens = Number(process.env.NVIDIA_TEACHER_MAX_TOKENS ?? 2048);
const nvidiaTeacherTemperature = Number(process.env.NVIDIA_TEACHER_TEMPERATURE ?? 0.6);

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
    doubtDiagnosis: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["Recall", "Mechanism", "Applied proof", "UPSC trap", "Expression", "Mastery"],
          description: "The single most important gap category.",
        },
        reason: {
          type: "string",
          maxLength: ADAPTIVE_TEACHER_MAX_DOUBT_FIELD_LENGTH,
          description: "Why this gap is blocking recall or exam performance.",
        },
        repairAction: {
          type: "string",
          maxLength: ADAPTIVE_TEACHER_MAX_DOUBT_FIELD_LENGTH,
          description: "One concrete action the learner should do now.",
        },
        masteryCheck: {
          type: "string",
          maxLength: ADAPTIVE_TEACHER_MAX_DOUBT_FIELD_LENGTH,
          description: "One question that proves the doubt is solved.",
        },
      },
      required: ["category", "reason", "repairAction", "masteryCheck"],
      description: "A structured doubt-solving record for planner and report evidence.",
    },
    providerScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Provider-side estimate of UPSC topic command.",
    },
  },
  required: ["summary", "nextPrompt", "focusConcepts", "doubtDiagnosis", "providerScore"],
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

type NvidiaTeacherCandidate = {
  apiKey: string;
  model: string;
  temperature: number;
  stream: boolean;
};

function tryParseJsonObject(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function parseProviderJsonObject(value: string): unknown | null {
  const direct = tryParseJsonObject(value);
  if (direct) return direct;

  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const parsedFence = tryParseJsonObject(fenced[1].trim());
    if (parsedFence) return parsedFence;
  }

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return tryParseJsonObject(value.slice(firstBrace, lastBrace + 1));
  }

  return null;
}

function extractNvidiaMessageText(providerRawBody: string, stream: boolean) {
  if (!stream) {
    const providerBody = JSON.parse(providerRawBody) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    return providerBody.choices?.[0]?.message?.content?.trim() ?? "";
  }

  return providerRawBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .filter((line) => line && line !== "[DONE]")
    .map((line) => {
      try {
        const chunk = JSON.parse(line) as {
          choices?: Array<{ delta?: { content?: string | null } }>;
        };
        return chunk.choices?.[0]?.delta?.content ?? "";
      } catch {
        return "";
      }
    })
    .join("")
    .trim();
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

  const providerCandidates: NvidiaTeacherCandidate[] = [
    {
      apiKey: process.env.NVIDIA_TEACHER_API_KEY?.trim() || process.env.NVIDIA_API_KEY?.trim() || "",
      model: nvidiaTeacherModel,
      temperature: Number.isFinite(nvidiaTeacherTemperature) ? nvidiaTeacherTemperature : 0.6,
      stream: true,
    },
    {
      apiKey: process.env.NVIDIA_CHAT_API_KEY?.trim() || "",
      model: nvidiaChatModel,
      temperature: 0.5,
      stream: false,
    },
  ].filter((candidate) => candidate.apiKey);
  if (!providerCandidates.length) {
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
    "Return one doubtDiagnosis object: category, reason, repairAction, and masteryCheck. It must name the single biggest blocker.",
    `Learner explanation: ${teacherRequest.answer}`,
    teacherRequest.challengeAnswer ? `Learner repair explanation: ${teacherRequest.challengeAnswer}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const systemPrompt = [
    "You are the Primary AI Teacher and Discussion Room inside UPSC Command.",
    "Diagnose the student's answer like a rigorous one-to-one UPSC mentor, not a generic chatbot.",
    "Your job is to find the single learning gap, repair it briefly, and decide the next prompt.",
    "Return only valid JSON. No markdown, no code fence, no preface, no extra keys.",
    `JSON shape: ${JSON.stringify(teacherCoachSchema)}`,
  ].join("\n");

  for (const providerCandidate of providerCandidates) {
    try {
      const response = await fetch(`${nvidiaBaseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${providerCandidate.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: providerCandidate.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: providerCandidate.temperature,
          top_p: 0.95,
          max_tokens: Number.isFinite(nvidiaTeacherMaxTokens) ? nvidiaTeacherMaxTokens : 2048,
          stream: providerCandidate.stream,
        }),
        signal: AbortSignal.timeout(18_000),
      });

      if (!response.ok) {
        continue;
      }

      const providerRawBody = await response.text();
      if (new TextEncoder().encode(providerRawBody).byteLength > ADAPTIVE_TEACHER_MAX_PROVIDER_RESPONSE_BYTES) {
        continue;
      }

      const providerText = extractNvidiaMessageText(providerRawBody, providerCandidate.stream);
      const coach = providerText ? parseAdaptiveTeacherCoach(parseProviderJsonObject(providerText)) : null;
      if (!coach) {
        continue;
      }

      const localResponse = buildLocalAdaptiveTeacherResponse(teacherRequest, { providerConfigured: true });
      return noStoreJson({
        ...localResponse,
        mode: "nvidia-teacher",
        coach,
      });
    } catch {
      continue;
    }
  }

  return noStoreJson(
    buildLocalAdaptiveTeacherResponse(teacherRequest, {
      providerConfigured: true,
      fallbackReason: "provider-unavailable",
    })
  );
}
