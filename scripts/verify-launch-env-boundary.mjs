import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

function parseEnv(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

function present(values, name) {
  return Boolean(values.get(name)?.trim());
}

function check(label, passed) {
  return { label, passed };
}

function hasVercelProjectLink() {
  if (fs.existsSync(path.join(workspaceRoot, ".vercel/project.json"))) return true;

  const repoLinkPath = path.join(workspaceRoot, ".vercel/repo.json");
  if (!fs.existsSync(repoLinkPath)) return false;

  try {
    const repoLink = JSON.parse(fs.readFileSync(repoLinkPath, "utf8"));
    return Array.isArray(repoLink.projects) && repoLink.projects.some(({ id, orgId }) => id && orgId);
  } catch {
    return false;
  }
}

const envLocal = fs.existsSync(path.join(workspaceRoot, ".env.local"))
  ? parseEnv(read(".env.local"))
  : new Map();
const envExample = parseEnv(read(".env.example"));

const localChecks = [
  check("safe environment template exists", fs.existsSync(path.join(workspaceRoot, ".env.example"))),
  check("template defaults auth provider to Supabase", envExample.get("NEXT_PUBLIC_AUTH_PROVIDER") === "supabase"),
  check("local auth provider is Supabase", envLocal.get("NEXT_PUBLIC_AUTH_PROVIDER") === "supabase"),
  check("local Supabase URL is configured", present(envLocal, "NEXT_PUBLIC_SUPABASE_URL")),
  check("local browser-safe Supabase key is configured", present(envLocal, "NEXT_PUBLIC_SUPABASE_ANON_KEY")),
  check(
    "browser-safe Supabase key is not a secret key",
    !envLocal.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")?.startsWith("sb_secret_"),
  ),
  check("learner-state migration is prepared", fs.existsSync(path.join(workspaceRoot, "supabase/migrations/20260531_upsc_learner_state.sql"))),
  check(
    "adaptive-teacher limiter migration is prepared",
    fs.existsSync(path.join(workspaceRoot, "supabase/migrations/20260531_upsc_adaptive_teacher_rate_limit.sql")),
  ),
];

const externalApply = [
  {
    label: "workspace is linked to the intended Vercel project",
    ready: hasVercelProjectLink(),
  },
  {
    label: "server-only Supabase secret is configured",
    ready: present(envLocal, "SUPABASE_SECRET_KEY") || present(envLocal, "SUPABASE_SERVICE_ROLE_KEY"),
  },
  {
    label: "server-only Gemini key is configured",
    ready: present(envLocal, "GEMINI_API_KEY"),
  },
  {
    label: "learner-state SQL is applied and verified in live Supabase",
    ready: false,
  },
  {
    label: "adaptive-teacher limiter SQL is applied and verified in live Supabase",
    ready: false,
  },
  {
    label: "deployed Google OAuth and two-profile continuity rehearsal pass",
    ready: false,
  },
];

const result = {
  localChecks,
  localReady: localChecks.every(({ passed }) => passed),
  externalApply,
  externalApplyReady: externalApply.every(({ ready }) => ready),
};

console.log(JSON.stringify(result, null, 2));

if (!result.localReady) process.exit(1);
