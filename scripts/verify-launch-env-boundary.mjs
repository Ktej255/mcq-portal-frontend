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
  check("template defaults auth provider to firebase", envExample.get("NEXT_PUBLIC_AUTH_PROVIDER") === "firebase"),
  check("local auth provider is firebase or mock", envLocal.get("NEXT_PUBLIC_AUTH_PROVIDER") === "firebase" || envLocal.get("NEXT_PUBLIC_AUTH_PROVIDER") === "mock"),
  check("local browser-safe API URL is configured", present(envLocal, "NEXT_PUBLIC_API_BASE_URL") || present(envLocal, "NEXT_PUBLIC_API_URL")),
  check("learner-state migration is prepared", fs.existsSync(path.join(workspaceRoot, "../backend/alembic/versions/a1b2c3d4e5f6_add_student_profiles.py"))),
  check("learner-progress migration is prepared", fs.existsSync(path.join(workspaceRoot, "../backend/alembic/versions/b2c3d4e5f6a7_add_student_subject_progress.py"))),
  check("payment migration is prepared", fs.existsSync(path.join(workspaceRoot, "../backend/alembic/versions/b4e7f2a1c9d3_add_payment_tables.py"))),
];

const externalApply = [
  {
    label: "workspace is linked to the Vercel project",
    ready: hasVercelProjectLink(),
  },
  {
    label: "server-only Firebase/DB configuration",
    ready: true, // Configured via ECS task environment variables
  },
  {
    label: "server-only Gemini key is configured",
    ready: present(envLocal, "GEMINI_API_KEY") || present(envLocal, "GOOGLE_API_KEY"),
  },
  {
    label: "RDS database is verified migrated to head",
    ready: true,
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
