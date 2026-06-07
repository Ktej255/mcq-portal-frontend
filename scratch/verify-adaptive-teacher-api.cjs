const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-adaptive-teacher-api-evidence.json");

async function post(body, token, options = {}) {
  const response = await fetch(`${baseUrl}/api/upsc/teacher/discuss`, {
    method: "POST",
    headers: {
      "Content-Type": options.contentType || "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.rawBody || JSON.stringify(body),
  });
  const payload = await response.json();
  return {
    status: response.status,
    cacheControl: response.headers.get("cache-control"),
    retryAfter: response.headers.get("retry-after"),
    rateLimit: response.headers.get("x-ratelimit-limit"),
    rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
    rateLimitScope: response.headers.get("x-ratelimit-scope"),
    payload,
  };
}

async function run() {
  const validRequest = {
    day: 1,
    learnerLevel: "beginner",
    answer:
      "Earth works as a connected system. The lithosphere, atmosphere, hydrosphere and biosphere interact through energy and matter. India map examples and UPSC statement traps need careful explanation.",
  };
  const unauthorized = await post(validRequest);
  const invalid = await post({ day: 0, learnerLevel: "beginner", answer: "thin" }, "MOCK_TOKEN_adaptive_teacher_api");
  const wrongContentType = await post(validRequest, "MOCK_TOKEN_adaptive_teacher_media", { contentType: "text/plain" });
  const oversized = await post(validRequest, "MOCK_TOKEN_adaptive_teacher_oversized", {
    rawBody: JSON.stringify({ ...validRequest, padding: "x".repeat(13_000) }),
  });
  const fallback = await post(validRequest, "MOCK_TOKEN_adaptive_teacher_api");
  const rateLimitToken = `MOCK_TOKEN_adaptive_teacher_rate_${Date.now()}`;
  const burst = [];
  for (let index = 0; index < 13; index += 1) {
    burst.push(await post(validRequest, rateLimitToken));
  }
  const rateLimited = burst.at(-1);
  const checks = {
    unauthorized,
    invalid,
    wrongContentType,
    oversized,
    fallback,
    rateLimit: {
      acceptedCount: burst.filter((response) => response.status === 200).length,
      rateLimited,
    },
  };

  if (unauthorized.status !== 403) throw new Error(`Unauthorized request should return 403: ${JSON.stringify(unauthorized)}`);
  if (invalid.status !== 400) throw new Error(`Invalid request should return 400: ${JSON.stringify(invalid)}`);
  if (wrongContentType.status !== 415 || wrongContentType.cacheControl !== "no-store") {
    throw new Error(`Non-JSON request should return a no-store 415: ${JSON.stringify(wrongContentType)}`);
  }
  if (oversized.status !== 413 || oversized.cacheControl !== "no-store") {
    throw new Error(`Oversized request should return a no-store 413: ${JSON.stringify(oversized)}`);
  }
  if (fallback.status !== 200 || fallback.cacheControl !== "no-store") {
    throw new Error(`Fallback response should be a no-store 200: ${JSON.stringify(fallback)}`);
  }
  if (
    !["local-fallback", "gemini"].includes(fallback.payload.mode) ||
    fallback.payload.trace?.promptVersion !== "upsc-teacher-2026-06-03.2" ||
    fallback.payload.trace?.rubricVersion !== "upsc-recall-rubric-2026-06-03.1" ||
    fallback.payload.trace?.recallTarget !== 95 ||
    typeof fallback.payload.assessment?.score !== "number" ||
    !fallback.payload.coach?.nextPrompt ||
    !Array.isArray(fallback.payload.coach?.focusConcepts) ||
    !fallback.payload.coach?.doubtDiagnosis?.category ||
    !fallback.payload.coach?.doubtDiagnosis?.reason ||
    !fallback.payload.coach?.doubtDiagnosis?.repairAction ||
    !fallback.payload.coach?.doubtDiagnosis?.masteryCheck
  ) {
    throw new Error(`Teacher response contract mismatch: ${JSON.stringify(fallback)}`);
  }
  if (
    burst.slice(0, 12).some((response) => response.status !== 200) ||
    rateLimited?.status !== 429 ||
    rateLimited.cacheControl !== "no-store" ||
    rateLimited.rateLimit !== "12" ||
    rateLimited.rateLimitRemaining !== "0" ||
    rateLimited.rateLimitScope !== "local-process" ||
    !rateLimited.retryAfter
  ) {
    throw new Error(`Teacher rate limit contract mismatch: ${JSON.stringify(burst)}`);
  }

  const evidence = { baseUrl, checks, passed: true };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
