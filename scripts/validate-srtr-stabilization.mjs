#!/usr/bin/env node
/**
 * Static regression gate for SRTR stabilization, mobile-first UX,
 * Next.js security headers, and API route hardening.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(HERE, "..");
const SRC_ROOT = path.join(FRONTEND_ROOT, "src");

// Retired dead-code files pending founder decision D3 (do not delete or enforce SRTR on them).
const RETIRED_D3_FILES = new Set([
  "GeographyReadContent.tsx",
]);

const DASHBOARD_COMPONENT_DIRS = [
  "admin",
  "current-affairs",
  "dashboard",
  "exam",
  "gs-lms",
  "upsc",
];

function walkTsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function relPath(filePath) {
  return path.relative(FRONTEND_ROOT, filePath).split(path.sep).join("/");
}

function isRetiredD3(filePath) {
  return RETIRED_D3_FILES.has(path.basename(filePath));
}

function stripComments(source) {
  return source.replace(
    /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (m) => {
      if (m.startsWith("/*")) return m.replace(/[^\n]/g, " ");
      if (m.startsWith("//")) return " ".repeat(m.length);
      return m;
    },
  );
}

function extractJsxOpeningTags(source, tagPattern) {
  const matches = [];
  const regex = new RegExp(`<(${tagPattern})(?=[\\s>/])`, "g");
  let match;
  while ((match = regex.exec(source)) !== null) {
    let pos = match.index + match[0].length;
    let depth = 0;
    let quote = null;
    let escaped = false;
    while (pos < source.length) {
      const ch = source[pos];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === quote) quote = null;
      } else {
        if (ch === '"' || ch === "'" || ch === "`") quote = ch;
        else if (ch === "{") depth += 1;
        else if (ch === "}") depth = Math.max(0, depth - 1);
        else if (ch === ">" && depth === 0) break;
      }
      pos += 1;
    }
    const line = source.slice(0, match.index).split("\n").length;
    matches.push({
      tagName: match[1],
      line,
      tagText: source.slice(match.index, pos + 1),
    });
  }
  return matches;
}

const checks = [];
function check(name, fn) {
  try {
    const detail = fn();
    checks.push({ name, ok: true, detail: detail ?? "" });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

// Check 1: Zero nested <main> elements in active src/app/(dashboard)/** and active dashboard components.
check("no nested <main> in active (dashboard) pages or dashboard components", () => {
  const targets = [
    ...walkTsFiles(path.join(SRC_ROOT, "app", "(dashboard)")),
    ...DASHBOARD_COMPONENT_DIRS.flatMap((d) => walkTsFiles(path.join(SRC_ROOT, "components", d))),
  ];
  const offenders = [];
  for (const file of targets) {
    const rel = relPath(file);
    if (rel === "src/app/(dashboard)/layout.tsx") continue;
    if (isRetiredD3(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const cleaned = stripComments(raw);
    const re = /<main(?=[\s>])/g;
    let m;
    while ((m = re.exec(cleaned)) !== null) {
      const line = cleaned.slice(0, m.index).split("\n").length;
      offenders.push(`${rel}:${line}`);
    }
  }
  if (offenders.length > 0) {
    throw new Error(`${offenders.length} nested <main> landmark(s): ${offenders.join(", ")}`);
  }
  return `0 nested <main> tags across ${targets.length} scanned dashboard files`;
});

// Check 2: Zero non-checkbox/radio/hidden/file/range <input>/<textarea>/<select> with text-xs or text-sm without text-base.
check("no sub-16px (<input>/<textarea>/<select>) controls missing text-base", () => {
  const targets = [
    ...walkTsFiles(path.join(SRC_ROOT, "app")),
    ...walkTsFiles(path.join(SRC_ROOT, "components")),
  ];
  const offenders = [];
  for (const file of targets) {
    const rel = relPath(file);
    if (isRetiredD3(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const cleaned = stripComments(raw);
    for (const tag of extractJsxOpeningTags(cleaned, "input|textarea|select|Input|Textarea|Select")) {
      if (/\btype\s*=\s*["']?(?:checkbox|radio|hidden|file|range)["']?/i.test(tag.tagText)) {
        continue;
      }
      if (/\btext-(?:xs|sm)\b/.test(tag.tagText) && !/\btext-base\b/.test(tag.tagText)) {
        offenders.push(`${rel}:${tag.line} (<${tag.tagName}>)`);
      }
    }
  }
  if (offenders.length > 0) {
    throw new Error(`${offenders.length} control(s) with text-xs/text-sm without text-base: ${offenders.join(", ")}`);
  }
  return "all active form controls include text-base (no iOS zoom regression)";
});

// Check 3: src/app/api/optional/discuss/route.ts hardening.
check("optional/discuss enforces learner auth, dual rate limits, x-goog-api-key, and no gemini-1.5-flash", () => {
  const file = path.join(SRC_ROOT, "app", "api", "optional", "discuss", "route.ts");
  if (!fs.existsSync(file)) throw new Error("route file missing");
  const raw = fs.readFileSync(file, "utf8");
  const cleaned = stripComments(raw);

  const required = [
    "hasLearnerApiAccess",
    "consumeAdaptiveTeacherRateLimit",
    "consumeDurableAdaptiveTeacherRateLimit",
    "requiresDurableAdaptiveTeacherRateLimit",
    "x-goog-api-key",
  ];
  for (const token of required) {
    if (!cleaned.includes(token)) {
      throw new Error(`missing required security control: ${token}`);
    }
  }
  if (/\?key=/.test(cleaned)) {
    throw new Error("forbidden ?key= query parameter found");
  }
  if (/gemini-1\.5-flash/i.test(raw)) {
    throw new Error("retired gemini-1.5-flash model still referenced");
  }
  return "learner auth, local + durable rate limiting, header-only key, and updated model verified";
});

// Check 4: src/app/api/upsc/source-archive/route.ts enforces hasInternalApiAccess.
check("upsc/source-archive enforces hasInternalApiAccess", () => {
  const file = path.join(SRC_ROOT, "app", "api", "upsc", "source-archive", "route.ts");
  if (!fs.existsSync(file)) throw new Error("route file missing");
  const cleaned = stripComments(fs.readFileSync(file, "utf8"));
  if (!/hasInternalApiAccess\s*\(/.test(cleaned)) {
    throw new Error("hasInternalApiAccess guard missing");
  }
  return "internal ADMIN access guard verified";
});

// Check 5: next.config.ts defines headers() with required security headers and redirects().
check("next.config.ts defines security headers()", () => {
  const file = path.join(FRONTEND_ROOT, "next.config.ts");
  if (!fs.existsSync(file)) throw new Error("next.config.ts missing");
  const cleaned = stripComments(fs.readFileSync(file, "utf8"));
  if (!/async\s+headers\s*\(/.test(cleaned)) {
    throw new Error("async headers() missing in next.config.ts");
  }
  if (!/async\s+redirects\s*\(/.test(cleaned)) {
    throw new Error("async redirects() missing in next.config.ts");
  }
  for (const header of [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    if (!cleaned.includes(header)) {
      throw new Error(`missing security header in next.config.ts: ${header}`);
    }
  }
  return "X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, and redirects() present";
});

// Check 6: Zero hardcoded localhost:8000 or 127.0.0.1:8000 inside src/app or src/components.
check("zero hardcoded localhost:8000 or 127.0.0.1:8000 in src/app or src/components", () => {
  const targets = [
    ...walkTsFiles(path.join(SRC_ROOT, "app")),
    ...walkTsFiles(path.join(SRC_ROOT, "components")),
  ];
  const offenders = [];
  for (const file of targets) {
    const raw = fs.readFileSync(file, "utf8");
    raw.split(/\r?\n/).forEach((line, idx) => {
      if (/(?:localhost|127\.0\.0\.1):8000/.test(line)) {
        offenders.push(`${relPath(file)}:${idx + 1}`);
      }
    });
  }
  if (offenders.length > 0) {
    throw new Error(`hardcoded backend host found: ${offenders.join(", ")}`);
  }
  return `0 hardcoded :8000 URLs across ${targets.length} scanned files`;
});

let failed = 0;
for (const result of checks) {
  if (!result.ok) failed += 1;
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name}${result.detail ? ` — ${result.detail}` : ""}`);
}

if (failed > 0) {
  console.error(`\n[validate-srtr-stabilization] FAIL: ${failed}/${checks.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\n[validate-srtr-stabilization] PASS: ${checks.length}/${checks.length} SRTR stabilization checks passed.`);
