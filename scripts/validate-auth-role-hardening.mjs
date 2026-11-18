import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(frontendRoot, "src");
const results = [];

function report(status, check, detail = "") {
  results.push({ status, check, detail });
  console.log(`[${status}] ${check}${detail ? ` — ${detail}` : ""}`);
}
const pass = (check, detail) => report("PASS", check, detail);
const missing = (check, detail) => report("MISSING", check, detail);

function read(relativePath) {
  const absolute = path.join(frontendRoot, relativePath);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : null;
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const masterAccessExists = fs.existsSync(path.join(srcRoot, "lib", "auth", "master-access.ts"));
if (!masterAccessExists) {
  pass("client-side master email helper is removed", "src/lib/auth/master-access.ts does not exist");
} else {
  missing("client-side master email helper is removed", "src/lib/auth/master-access.ts still exists");
}

const forbidden = [
  "isMasterEmail",
  "isLocalMockMasterSession",
  "isExplicitLocalMockMasterToken",
  "PRIMARY_MASTER_EMAIL",
  '@admin.com',
];
const offenders = [];
for (const file of walk(srcRoot)) {
  const source = fs.readFileSync(file, "utf8");
  for (const token of forbidden) {
    if (source.includes(token)) {
      offenders.push(`${path.relative(frontendRoot, file)} -> ${token}`);
    }
  }
}
if (offenders.length === 0) {
  pass("no email-domain or local-mock role elevation remains in the client", "no forbidden master-access token appears under src/");
} else {
  missing("no email-domain or local-mock role elevation remains in the client", offenders.join("; "));
}

const authContext = read("src/lib/contexts/AuthContext.tsx") ?? "";
const assignsServerRole =
  /export type ServerRole\s*=\s*"ADMIN"\s*\|\s*"EDUCATOR"\s*\|\s*"STUDENT"\s*\|\s*null/.test(authContext) &&
  /fetch\(profileEndpoint\(\)/.test(authContext) &&
  /\/auth\/me/.test(authContext) &&
  /role === "ADMIN" \|\| role === "EDUCATOR" \|\| role === "STUDENT"/.test(authContext) &&
  /roleLoading/.test(authContext) &&
  !/role\s*=\s*[^;\n]*email/i.test(authContext);
if (assignsServerRole) {
  pass("AuthContext resolves the role from /api/v1/auth/me", "role is fetched from the backend and never derived from email");
} else {
  missing("AuthContext resolves the role from /api/v1/auth/me", "server role fetch/typing/roleLoading wiring was not recognized");
}

const protectedRoute = read("src/components/shared/ProtectedRoute.tsx") ?? "";
const protectedRouteUsesRole =
  /useAuth\(\)/.test(protectedRoute) &&
  /const \{ user, loading, role, roleLoading \} = useAuth\(\)/.test(protectedRoute) &&
  /rolePending/.test(protectedRoute) &&
  /role !== requiredRole/.test(protectedRoute) &&
  !/email/.test(protectedRoute) &&
  !/master/i.test(protectedRoute);
if (protectedRouteUsesRole) {
  pass("ProtectedRoute authorizes from the server role", "the guard waits for role resolution and never inspects email");
} else {
  missing("ProtectedRoute authorizes from the server role", "role-based guard wiring was not recognized");
}

const internalAccess = read("src/lib/auth/internal-api-access.ts") ?? "";
const serverVerified =
  /fetch\(`\$\{baseUrl\}\/auth\/me`/.test(internalAccess) &&
  /payload\?\.data\?\.role === "ADMIN"/.test(internalAccess) &&
  !/isMasterEmail|currentUser|supabase/.test(internalAccess);
if (serverVerified) {
  pass("Next server routes verify operator access with the backend role", "internal API access calls /auth/me and requires ADMIN");
} else {
  missing("Next server routes verify operator access with the backend role", "backend role verification was not recognized");
}

const sidebar = read("src/components/layout/DashboardSidebar.tsx") ?? "";
if (/const hasMasterAccess = isAdmin;/.test(sidebar) && !/master-access|isMasterEmail|isLocalMockMasterSession/.test(sidebar)) {
  pass("sidebar operator tools depend only on the server-derived isAdmin prop", "the sidebar no longer reads the user email");
} else {
  missing("sidebar operator tools depend only on the server-derived isAdmin prop", "email-based or local-mock master access remains");
}

const dashboardLayout = read("src/app/(dashboard)/layout.tsx") ?? "";
if (/const isAdminShell = role === "ADMIN";/.test(dashboardLayout)) {
  pass("dashboard shell derives operator mode from the server role", "isOperatorRoute no longer elevates the navigation");
} else {
  missing("dashboard shell derives operator mode from the server role", "role-driven shell wiring was not recognized");
}

const proofFeed = read("src/components/upsc/UpscPrelims2027StrategyCommand.tsx") ?? "";
if (/const token = await resolveToken\(\);/.test(proofFeed)) {
  pass("operator write callers send the provider token", "proof-feed publishing uses resolveToken instead of reading localStorage directly");
} else {
  missing("operator write callers send the provider token", "the proof-feed caller still reads MOCK_TOKEN from storage");
}

const passed = results.filter(({ status }) => status === "PASS").length;
const missingCount = results.filter(({ status }) => status === "MISSING").length;
console.log(`\nAuth role hardening summary: ${passed} passed, ${missingCount} missing`);
console.log("Source-only limitations: this validator cannot prove runtime behavior, backend availability, or Clerk/Supabase session state; only definite source violations fail.");
if (missingCount > 0) process.exitCode = 1;
