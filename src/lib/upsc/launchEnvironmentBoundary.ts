import fs from "node:fs";
import path from "node:path";

export type LaunchEnvironmentCheckStatus = "pass" | "pending" | "fail";
export type LaunchEnvironmentCheckGroup = "local-config" | "server-secret" | "migration" | "live-receipt";

export type LaunchEnvironmentCheck = {
  id: string;
  title: string;
  group: LaunchEnvironmentCheckGroup;
  status: LaunchEnvironmentCheckStatus;
  proof: string;
  nextAction: string;
  publicSafe: boolean;
};

export type LaunchEnvironmentBoundary = {
  proofRule: string;
  totalChecks: number;
  passCount: number;
  pendingCount: number;
  failCount: number;
  localReady: boolean;
  publicSecretExposure: boolean;
  launchDecision: string;
  checks: LaunchEnvironmentCheck[];
};

const workspaceRoot = process.cwd();

function exists(relativePath: string) {
  return fs.existsSync(path.join(workspaceRoot, relativePath));
}

function envValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function hasEnv(name: string) {
  return Boolean(envValue(name));
}

function isPublicSecretLeak() {
  return Boolean(
    envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY").startsWith("sb_secret_") ||
      hasEnv("NEXT_PUBLIC_SUPABASE_SECRET_KEY") ||
      hasEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY") ||
      hasEnv("NEXT_PUBLIC_GEMINI_API_KEY")
  );
}

function hasVercelProjectLink() {
  if (exists(".vercel/project.json")) return true;

  const repoLinkPath = path.join(workspaceRoot, ".vercel/repo.json");
  if (!fs.existsSync(repoLinkPath)) return false;

  try {
    const repoLink = JSON.parse(fs.readFileSync(repoLinkPath, "utf8")) as {
      projects?: Array<{ id?: string; orgId?: string }>;
    };
    return Array.isArray(repoLink.projects) && repoLink.projects.some(({ id, orgId }) => id && orgId);
  } catch {
    return false;
  }
}

function check(input: LaunchEnvironmentCheck): LaunchEnvironmentCheck {
  return input;
}

export function getLaunchEnvironmentBoundary(): LaunchEnvironmentBoundary {
  const publicSecretExposure = isPublicSecretLeak();
  const hasServerSupabaseSecret = hasEnv("SUPABASE_SECRET_KEY") || hasEnv("SUPABASE_SERVICE_ROLE_KEY");
  const checks = [
    check({
      id: "env-template",
      title: "Safe committed environment template",
      group: "local-config",
      status: exists(".env.example") ? "pass" : "fail",
      proof: ".env.example exists and documents browser-safe Supabase keys separately from server-only secrets.",
      nextAction: "Keep the template committed and never commit .env.local values.",
      publicSafe: true,
    }),
    check({
      id: "auth-provider",
      title: "Supabase auth provider selected",
      group: "local-config",
      status: envValue("NEXT_PUBLIC_AUTH_PROVIDER") === "supabase" ? "pass" : "pending",
      proof: "NEXT_PUBLIC_AUTH_PROVIDER is checked as a name/value boundary only.",
      nextAction: "Set NEXT_PUBLIC_AUTH_PROVIDER=supabase in local, preview, and production.",
      publicSafe: true,
    }),
    check({
      id: "browser-supabase-url",
      title: "Browser Supabase URL configured",
      group: "local-config",
      status: hasEnv("NEXT_PUBLIC_SUPABASE_URL") ? "pass" : "pending",
      proof: "The browser-safe Supabase project URL is present without printing it.",
      nextAction: "Add NEXT_PUBLIC_SUPABASE_URL to Vercel and local .env.local.",
      publicSafe: true,
    }),
    check({
      id: "browser-supabase-key",
      title: "Browser Supabase publishable key configured",
      group: "local-config",
      status: hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        ? envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY").startsWith("sb_secret_")
          ? "fail"
          : "pass"
        : "pending",
      proof: "The public key is present and checked so an sb_secret_ backend key cannot be used in the browser.",
      nextAction: "Use a publishable or anon browser key only; never use an sb_secret_ key here.",
      publicSafe: !envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY").startsWith("sb_secret_"),
    }),
    check({
      id: "public-secret-firewall",
      title: "No server secret is exposed as NEXT_PUBLIC",
      group: "local-config",
      status: publicSecretExposure ? "fail" : "pass",
      proof: "The boundary checks for public Supabase service keys and public Gemini keys without printing values.",
      nextAction: "Delete any NEXT_PUBLIC_* server secret immediately before building.",
      publicSafe: !publicSecretExposure,
    }),
    check({
      id: "vercel-project-link",
      title: "Workspace linked to Vercel project",
      group: "local-config",
      status: hasVercelProjectLink() ? "pass" : "pending",
      proof: ".vercel project metadata is present locally.",
      nextAction: "Link the workspace to the intended upsc-command Vercel project before env or deployment work.",
      publicSafe: true,
    }),
    check({
      id: "server-supabase-secret",
      title: "Server-only Supabase secret configured",
      group: "server-secret",
      status: hasServerSupabaseSecret ? "pass" : "pending",
      proof: "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is checked as present without printing the value.",
      nextAction: "Add the sb_secret_ key only as a server-side Vercel variable.",
      publicSafe: true,
    }),
    check({
      id: "server-gemini-key",
      title: "Server-only Gemini key configured",
      group: "server-secret",
      status: hasEnv("GEMINI_API_KEY") ? "pass" : "pending",
      proof: "GEMINI_API_KEY is checked server-side only and never rendered to the client.",
      nextAction: "Add GEMINI_API_KEY as a Vercel server-only secret before marketing live AI language.",
      publicSafe: true,
    }),
    check({
      id: "learner-state-migration",
      title: "Learner-state migration prepared",
      group: "migration",
      status: exists("supabase/migrations/20260531_upsc_learner_state.sql") ? "pass" : "fail",
      proof: "The profile and subject-progress RLS migration file is present in the repository.",
      nextAction: "Apply the SQL in live Supabase, then run the matching verification query.",
      publicSafe: true,
    }),
    check({
      id: "learner-state-verify-sql",
      title: "Learner-state verification SQL prepared",
      group: "migration",
      status: exists("supabase/verify/20260531_upsc_learner_state_checks.sql") ? "pass" : "fail",
      proof: "The read-only RLS verification query is present.",
      nextAction: "Run it after the migration and store the result in the live continuity receipt panel.",
      publicSafe: true,
    }),
    check({
      id: "teacher-limiter-migration",
      title: "Adaptive-teacher limiter migration prepared",
      group: "migration",
      status: exists("supabase/migrations/20260531_upsc_adaptive_teacher_rate_limit.sql") ? "pass" : "fail",
      proof: "The distributed Talk limiter migration file is present.",
      nextAction: "Apply it before deployed Talk can use provider-backed AI.",
      publicSafe: true,
    }),
    check({
      id: "teacher-limiter-verify-sql",
      title: "Adaptive-teacher limiter verification SQL prepared",
      group: "migration",
      status: exists("supabase/verify/20260531_upsc_adaptive_teacher_rate_limit_checks.sql") ? "pass" : "fail",
      proof: "The restricted RPC and privilege verification query is present.",
      nextAction: "Run it after limiter SQL apply and record the proof receipt.",
      publicSafe: true,
    }),
    check({
      id: "live-sql-receipt",
      title: "Live SQL apply receipt recorded",
      group: "live-receipt",
      status: "pending",
      proof: "This cannot be proven by local files; it must come from the Supabase dashboard result.",
      nextAction: "Apply both SQL migrations live and record the proof in Live Continuity Rehearsal.",
      publicSafe: true,
    }),
    check({
      id: "oauth-continuity-receipt",
      title: "Google OAuth continuity receipt recorded",
      group: "live-receipt",
      status: "pending",
      proof: "This requires two real browser profiles on the deployed URL.",
      nextAction: "Verify same-account recovery and different-account isolation on the deployed portal.",
      publicSafe: true,
    }),
  ];

  const passCount = checks.filter((item) => item.status === "pass").length;
  const pendingCount = checks.filter((item) => item.status === "pending").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const localChecks = checks.filter((item) => item.group !== "live-receipt");
  const localReady = localChecks.every((item) => item.status === "pass");
  const launchDecision = publicSecretExposure
    ? "Fix public secret exposure before any build or invite."
    : localReady
      ? "Local environment boundary is clean; live SQL and OAuth receipts still decide public launch."
      : "Local environment boundary is not fully ready; finish pending server/local gates first.";

  return {
    proofRule: "no-secret-launch-env-boundary-with-live-receipts",
    totalChecks: checks.length,
    passCount,
    pendingCount,
    failCount,
    localReady,
    publicSecretExposure,
    launchDecision,
    checks,
  };
}
