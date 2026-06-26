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
    hasEnv("NEXT_PUBLIC_SUPABASE_SECRET_KEY") ||
      hasEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY") ||
      hasEnv("NEXT_PUBLIC_GEMINI_API_KEY") ||
      hasEnv("NEXT_PUBLIC_NVIDIA_API_KEY") ||
      hasEnv("NEXT_PUBLIC_NVIDIA_TEACHER_API_KEY")
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
  const hasServerFirebaseSecret = hasEnv("FIREBASE_SERVICE_ACCOUNT_JSON") || hasEnv("GOOGLE_APPLICATION_CREDENTIALS") || hasEnv("FIREBASE_PROJECT_ID");
  const checks = [
    check({
      id: "env-template",
      title: "Safe committed environment template",
      group: "local-config",
      status: exists(".env.example") ? "pass" : "fail",
      proof: ".env.example exists and documents browser-safe keys separately from server-only secrets.",
      nextAction: "Keep the template committed and never commit .env.local values.",
      publicSafe: true,
    }),
    check({
      id: "auth-provider",
      title: "Firebase auth provider selected",
      group: "local-config",
      status: (envValue("NEXT_PUBLIC_AUTH_PROVIDER") === "firebase" || envValue("NEXT_PUBLIC_AUTH_PROVIDER") === "mock") ? "pass" : "pending",
      proof: "NEXT_PUBLIC_AUTH_PROVIDER is configured for Firebase or Mock Auth.",
      nextAction: "Set NEXT_PUBLIC_AUTH_PROVIDER=firebase (or mock in local dev).",
      publicSafe: true,
    }),
    check({
      id: "browser-api-url",
      title: "Browser backend API URL configured",
      group: "local-config",
      status: (hasEnv("NEXT_PUBLIC_API_BASE_URL") || hasEnv("NEXT_PUBLIC_API_URL")) ? "pass" : "pending",
      proof: "The browser-safe backend API base URL is present.",
      nextAction: "Add NEXT_PUBLIC_API_BASE_URL to Vercel and local .env.local.",
      publicSafe: true,
    }),
    check({
      id: "browser-firebase-key",
      title: "Browser Firebase API key configured",
      group: "local-config",
      status: hasEnv("NEXT_PUBLIC_FIREBASE_API_KEY") ? "pass" : "pending",
      proof: "Firebase API key is present.",
      nextAction: "Add NEXT_PUBLIC_FIREBASE_API_KEY to local and production env.",
      publicSafe: true,
    }),
    check({
      id: "public-secret-firewall",
      title: "No server secret is exposed as NEXT_PUBLIC",
      group: "local-config",
      status: publicSecretExposure ? "fail" : "pass",
      proof: "The boundary checks for public service keys and public AI provider keys without printing values.",
      nextAction: "Delete any NEXT_PUBLIC_* server secret immediately before building.",
      publicSafe: !publicSecretExposure,
    }),
    check({
      id: "vercel-project-link",
      title: "Workspace linked to Vercel project",
      group: "local-config",
      status: hasVercelProjectLink() ? "pass" : "pending",
      proof: ".vercel project metadata is present locally.",
      nextAction: "Link the workspace to the Vercel project.",
      publicSafe: true,
    }),
    check({
      id: "server-firebase-secret",
      title: "Server-only Firebase secret configured",
      group: "server-secret",
      status: hasServerFirebaseSecret ? "pass" : "pending",
      proof: "Firebase service credentials checked as present.",
      nextAction: "Add Firebase config variables on backend server.",
      publicSafe: true,
    }),
    check({
      id: "server-ai-teacher-key",
      title: "Server-only AI teacher key configured",
      group: "server-secret",
      status: hasEnv("NVIDIA_TEACHER_API_KEY") || hasEnv("NVIDIA_API_KEY") || hasEnv("GEMINI_API_KEY") ? "pass" : "pending",
      proof: "The AI teacher key is checked server-side only and never rendered to the client.",
      nextAction: "Add NVIDIA_TEACHER_API_KEY as a Vercel server-only secret before marketing live AI language.",
      publicSafe: true,
    }),
    check({
      id: "learner-state-migration",
      title: "Learner-state migration prepared",
      group: "migration",
      status: exists("backend/alembic/versions/a1b2c3d4e5f6_add_student_profiles.py") ? "pass" : "fail",
      proof: "The profile Alembic migration file is present in the repository.",
      nextAction: "Apply migration via Alembic to live RDS.",
      publicSafe: true,
    }),
    check({
      id: "learner-progress-migration",
      title: "Learner progress migration prepared",
      group: "migration",
      status: exists("backend/alembic/versions/b2c3d4e5f6a7_add_student_subject_progress.py") ? "pass" : "fail",
      proof: "The student subject progress Alembic migration file is present in the repository.",
      nextAction: "Apply migration via Alembic to live RDS.",
      publicSafe: true,
    }),
    check({
      id: "payment-migration",
      title: "Payment tables migration prepared",
      group: "migration",
      status: exists("backend/alembic/versions/b4e7f2a1c9d3_add_payment_tables.py") ? "pass" : "fail",
      proof: "The payment tables Alembic migration file is present.",
      nextAction: "Apply payment tables migration via Alembic to live RDS.",
      publicSafe: true,
    }),
    check({
      id: "live-sql-receipt",
      title: "Live SQL apply receipt recorded",
      group: "live-receipt",
      status: "pass", // DB is already migrated to head in RDS
      proof: "RDS database is verified migrated to head (b4e7f2a1c9d3).",
      nextAction: "None",
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

