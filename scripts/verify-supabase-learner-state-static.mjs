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
  if (!passed) throw new Error(`Supabase learner-state preflight failed: ${label}`);
}

const migration = read("supabase/migrations/20260531_upsc_learner_state.sql");
const envSource = read("src/env.ts");
const authContext = read("src/lib/contexts/AuthContext.tsx");
const persistence = read("src/lib/upsc/learnerPersistence.ts");
const studentProfile = read("src/lib/upsc/studentProfile.ts");
const profileGate = read("src/components/upsc/UpscProfileGate.tsx");
const geographyProgress = read("src/lib/upsc/useGeographyProgress.ts");
const sharedSubjectProgress = read("src/lib/upsc/useSubjectProgress.ts");
const envLocal = parseEnv(read(".env.local"));
const checks = [];

assert(checks, "profile table migration exists", migration.includes("create table if not exists public.upsc_student_profiles"));
assert(checks, "subject progress table migration exists", migration.includes("create table if not exists public.upsc_subject_progress"));
assert(checks, "profile RLS is enabled", migration.includes("alter table public.upsc_student_profiles enable row level security"));
assert(checks, "subject progress RLS is enabled", migration.includes("alter table public.upsc_subject_progress enable row level security"));
assert(checks, "profile policy binds rows to auth.uid()", migration.includes("auth.uid() = user_id"));
assert(checks, "browser env exposes Supabase URL", envSource.includes("NEXT_PUBLIC_SUPABASE_URL"));
assert(checks, "browser env exposes public Supabase key", envSource.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
assert(checks, "auth context subscribes to Supabase sessions", authContext.includes("supabase.auth.onAuthStateChange"));
assert(checks, "auth context starts Google OAuth through Supabase", authContext.includes("supabase.auth.signInWithOAuth"));
assert(checks, "profile persistence uses learner table", persistence.includes('.from("upsc_student_profiles")'));
assert(checks, "progress persistence uses learner table", persistence.includes('.from("upsc_subject_progress")'));
assert(checks, "remote learner writes serialize latest payload", persistence.includes("queueLatestRemoteWrite"));
assert(checks, "local learner-state clear helper exists", persistence.includes("clearLocalUpscLearnerState"));
assert(checks, "auth context reconciles account switches", authContext.includes("reconcileLocalUpscLearnerIdentity"));
assert(checks, "logout clears local learner state", authContext.includes("clearLocalUpscLearnerState"));
assert(checks, "logout clears local preview token", authContext.includes("clearLocalMockToken"));
assert(checks, "local profile retries sync after reconnect", studentProfile.includes("syncLocalStudentProfile"));
assert(checks, "profile gate reconciles a saved local profile", profileGate.includes("void readSyncedStudentProfile()"));
assert(checks, "profile gate rechecks after learner cleanup", profileGate.includes("upscLearnerStateClearedEvent"));
assert(checks, "Geography progress pushes newer local state", geographyProgress.includes('saveRemoteSubjectProgress("geography", localProgress)'));
assert(checks, "shared progress pushes newer local state", sharedSubjectProgress.includes("saveRemoteSubjectProgress(subjectSlug, localProgress)"));
assert(checks, "Geography progress retries after reconnect", geographyProgress.includes('window.addEventListener("online", syncLocalProgress)'));
assert(checks, "learner cleanup resets in-memory progress", geographyProgress.includes("upscLearnerStateClearedEvent"));
assert(checks, "local auth provider is Supabase", envLocal.get("NEXT_PUBLIC_AUTH_PROVIDER") === "supabase");
assert(checks, "local Supabase URL is configured", Boolean(envLocal.get("NEXT_PUBLIC_SUPABASE_URL")));
assert(checks, "local browser key is configured", Boolean(envLocal.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")));
assert(
  checks,
  "local browser key is not a Supabase secret key",
  !envLocal.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")?.startsWith("sb_secret_"),
);

console.log(JSON.stringify({ checks, passed: true }, null, 2));
