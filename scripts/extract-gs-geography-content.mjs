// @ts-nocheck
/**
 * GS Geography content extractor (Master Plan A3/B3 — no-loss migration, step 1).
 *
 * FRONTEND half of the two-step importer that moves GS Geography content onto
 * the FastAPI/Postgres backend (GATE-1 = standardize the live loop on the
 * backend), mirroring `scripts/extract-geo-optional-content.mjs`.
 *
 * It mechanically reads the authored TypeScript content:
 *   - src/lib/upsc/plan.ts                         -> `geographySessions` (the
 *     20-day curriculum: title/chapter/anchor/watch/talk/test/track/revisit/...)
 *   - src/lib/upsc/geographyDay<N>PortalLesson.ts  -> the 30 Watch-room lesson
 *     modules (scenes + any day-specific drills) — captured EXPORT-FOR-EXPORT
 *     so nothing authored is lost.
 *
 * Each module is transpiled with the installed TypeScript compiler and
 * dynamically imported; the EXACT runtime objects are serialized to JSON. There
 * is no hand transcription. The Python importer (backend) and the no-loss test
 * both read this artifact.
 *
 * Output: backend/app/core/gs/data/gs_geography_content.json
 *
 * Usage (from frontend/):  node scripts/extract-gs-geography-content.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(FRONTEND_ROOT, "..");
const UPSC_DIR = join(FRONTEND_ROOT, "src", "lib", "upsc");

// Tmp files live UNDER frontend so bare imports (e.g. "lucide-react" referenced
// by plan.ts) resolve against frontend/node_modules.
const TMP_DIR = join(FRONTEND_ROOT, ".gs-extract-tmp");

const OUT_PATH = join(
  REPO_ROOT,
  "backend",
  "app",
  "core",
  "gs",
  "data",
  "gs_geography_content.json"
);

const LESSON_COUNT = 30;

/** Transpile a `.ts` module to ESM JS and dynamically import its namespace. */
async function loadTsModule(tsPath, tag) {
  const source = readFileSync(tsPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      verbatimModuleSyntax: false,
      isolatedModules: true,
    },
    fileName: tsPath,
  });
  mkdirSync(TMP_DIR, { recursive: true });
  const tmpFile = join(TMP_DIR, `${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(tmpFile, outputText, "utf8");
  try {
    return await import(pathToFileURL(tmpFile).href);
  } finally {
    rmSync(tmpFile, { force: true });
  }
}

/** Plain-data named exports of a module namespace (drops `default`/functions). */
function serializableExports(ns) {
  const out = {};
  for (const [key, value] of Object.entries(ns)) {
    if (key === "default") continue;
    if (typeof value === "function") continue; // erase any helper exports
    out[key] = value;
  }
  return out;
}

async function main() {
  // --- Curriculum sessions (plan.ts) ------------------------------------
  const planNs = await loadTsModule(join(UPSC_DIR, "plan.ts"), "plan");
  const sessions = planNs.geographySessions;
  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error("plan.ts did not yield a non-empty `geographySessions` array");
  }

  // --- 30 Watch-room lesson modules -------------------------------------
  const lessons = [];
  for (let n = 1; n <= LESSON_COUNT; n += 1) {
    const file = join(UPSC_DIR, `geographyDay${n}PortalLesson.ts`);
    const ns = await loadTsModule(file, `day${n}`);
    const primary = ns[`geographyDay${n}PortalLesson`];
    if (!primary || !Array.isArray(primary.scenes)) {
      throw new Error(`geographyDay${n}PortalLesson.ts missing primary export or scenes`);
    }
    lessons.push({
      lessonNumber: n,
      title: primary.title ?? null,
      promise: primary.promise ?? null,
      sourceSummary: primary.sourceSummary ?? null,
      scenes: primary.scenes,
      // Every authored export of the module (scenes + day-specific drills) —
      // faithful, no-loss.
      exports: serializableExports(ns),
    });
  }

  // Clean up the tmp dir.
  rmSync(TMP_DIR, { recursive: true, force: true });

  const artifact = {
    _meta: {
      generatedBy: "frontend/scripts/extract-gs-geography-content.mjs",
      generatedAt: new Date().toISOString(),
      sourceFiles: [
        "frontend/src/lib/upsc/plan.ts (geographySessions)",
        "frontend/src/lib/upsc/geographyDay1..30PortalLesson.ts",
      ],
      note: "Mechanically transpiled + serialized from the live TS modules. No hand transcription.",
    },
    subjectSlug: "geography",
    subjectName: "Geography",
    sessionCount: sessions.length,
    lessonCount: lessons.length,
    sessions,
    lessons,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(artifact, null, 2) + "\n", "utf8");

  console.log("GS Geography content extracted ->", OUT_PATH);
  console.log(`  sessions=${sessions.length} lessons=${lessons.length}`);
  const totalScenes = lessons.reduce((n, l) => n + l.scenes.length, 0);
  console.log(`  total watch scenes across lessons=${totalScenes}`);
}

main().catch((err) => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  console.error("Extraction failed:", err);
  process.exit(1);
});
