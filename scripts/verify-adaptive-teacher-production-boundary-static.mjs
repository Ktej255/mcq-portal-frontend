import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function parseEnv(content) {
  const values = new Map();
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (match) values.set(match[1], match[2]);
  });
  return values;
}

function assert(checks, label, passed) {
  checks.push({ label, passed });
  if (!passed) throw new Error(`Adaptive teacher production-boundary preflight failed: ${label}`);
}

const migration = read("supabase/migrations/20260531_upsc_adaptive_teacher_rate_limit.sql");
const verifySql = read("supabase/verify/20260531_upsc_adaptive_teacher_rate_limit_checks.sql");
const durableAdapter = read("src/lib/auth/durable-request-rate-limit.ts");
const route = read("src/app/api/upsc/teacher/discuss/route.ts");
const adaptiveTeacher = read("src/lib/upsc/adaptiveTeacher.ts");
const teacherService = read("src/services/upscTeacherService.ts");
const checklist = read("docs/GEMINI_LIVE_APPLY_CHECKLIST_2026-05-31.md");
const envLocal = parseEnv(read(".env.local"));
const checks = [];

assert(checks, "durable rate-limit table migration exists", migration.includes("create table if not exists public.upsc_adaptive_teacher_rate_limits"));
assert(checks, "durable rate-limit table enables RLS", migration.includes("alter table public.upsc_adaptive_teacher_rate_limits enable row level security"));
assert(checks, "RPC is security definer", migration.includes("security definer"));
assert(checks, "RPC execute is revoked from public learners", migration.includes("from public, anon, authenticated"));
assert(checks, "RPC execute is granted only to service role", migration.includes("to service_role"));
assert(checks, "post-migration SQL verifies RPC privileges", verifySql.includes("service_role_can_execute"));
assert(checks, "server adapter hashes request identity", durableAdapter.includes('createHash("sha256")'));
assert(checks, "server adapter accepts new Supabase secret key", durableAdapter.includes("process.env.SUPABASE_SECRET_KEY"));
assert(checks, "server adapter keeps legacy service-role compatibility", durableAdapter.includes("process.env.SUPABASE_SERVICE_ROLE_KEY"));
assert(checks, "route consumes durable rate limit", route.includes("await consumeDurableAdaptiveTeacherRateLimit(request)"));
assert(checks, "non-local requests fail closed without durable boundary", route.includes('durableRateLimit.status !== "enforced"') && route.includes("requiresDurableAdaptiveTeacherRateLimit(request)"));
assert(checks, "local fallback still retains process limiter", route.includes("consumeAdaptiveTeacherRateLimit(request)"));
assert(checks, "route requires JSON requests", route.includes("hasJsonContentType(request)") && route.includes("status: 415"));
assert(checks, "route limits learner request bytes before JSON parsing", route.includes("ADAPTIVE_TEACHER_MAX_REQUEST_BYTES") && route.includes("request.text()") && route.includes("status: 413"));
assert(checks, "route limits provider response bytes before JSON parsing", route.includes("ADAPTIVE_TEACHER_MAX_PROVIDER_RESPONSE_BYTES") && route.includes("providerRawBody") && route.includes("response.text()"));
assert(checks, "structured provider schema carries concise output limits", route.includes("maxLength: ADAPTIVE_TEACHER_MAX_COACH_SUMMARY_LENGTH") && route.includes("maxLength: ADAPTIVE_TEACHER_MAX_COACH_PROMPT_LENGTH") && route.includes("maxItems: ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPTS"));
assert(checks, "provider coach parser rejects oversized output", adaptiveTeacher.includes("summary.length > ADAPTIVE_TEACHER_MAX_COACH_SUMMARY_LENGTH") && adaptiveTeacher.includes("nextPrompt.length > ADAPTIVE_TEACHER_MAX_COACH_PROMPT_LENGTH") && adaptiveTeacher.includes("focusConcepts.length > ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPTS"));
assert(checks, "browser teacher service validates successful response JSON", teacherService.includes("parseAdaptiveTeacherResponse") && teacherService.includes('throw new Error("Teacher discussion response invalid")'));
assert(checks, "client response parser requires versioned trace and bounded learner fields", adaptiveTeacher.includes("parseAdaptiveTeacherResponse") && adaptiveTeacher.includes("trace.promptVersion !== ADAPTIVE_TEACHER_PROMPT_VERSION") && adaptiveTeacher.includes("isBoundedStringArray(assessment.repairHints, 5, 240)"));
assert(checks, "checklist requires server-only Supabase secret", checklist.includes("SUPABASE_SECRET_KEY"));
assert(checks, "local env does not expose Gemini key publicly", !envLocal.has("NEXT_PUBLIC_GEMINI_API_KEY"));
assert(checks, "local env does not expose Supabase secret publicly", !envLocal.has("NEXT_PUBLIC_SUPABASE_SECRET_KEY"));

console.log(JSON.stringify({ checks, passed: true }, null, 2));
