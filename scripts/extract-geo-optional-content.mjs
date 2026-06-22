// @ts-nocheck
/**
 * Geography Optional content extractor (Task 4.1 — no-loss migration pipeline, step 1).
 *
 * HISTORICAL / ONE-TIME TOOL (as of task 6.4): the legacy bespoke source modules
 * this script reads (geomorphology.ts, climatology.ts, geographyOptionalTypes.ts,
 * GeoOptionalDiagrams.tsx) were DELETED in gated task 6.4 once the committed
 * artifact `backend/app/core/optional/data/geo_optional_content.json` became the
 * source of truth and the no-content-loss gate (Property 1) passed. This script
 * is retained for provenance/reproducibility only and will throw if re-run,
 * because its inputs no longer exist. To regenerate the artifact, the source
 * modules would first need to be restored from version control. This file is a
 * standalone Node `.mjs` (carrying `@ts-nocheck`) and is NOT part of the Next
 * build or `tsc --noEmit`, so the removal of its inputs does not affect the build.
 *
 * This is the FRONTEND half of the two-step importer. It mechanically reads the
 * authored TypeScript content modules:
 *   - src/lib/upsc/optional/geomorphology.ts
 *   - src/lib/upsc/optional/climatology.ts
 *   - src/lib/upsc/optional/geographyOptionalTypes.ts   (DiagramId union)
 *   - src/components/upsc/optional/GeoOptionalDiagrams.tsx (diagram registry)
 *
 * It transpiles the two topic modules with the installed TypeScript compiler
 * (which erases the `import type` statements, leaving a self-contained module
 * that exports a plain object), evaluates them, and serializes the EXACT object
 * to JSON. There is no hand transcription: the artifact is a faithful, lossless
 * serialization of the live TS content. The Python importer (backend) and the
 * no-loss assertion test (Task 4.2) both read this artifact.
 *
 * It additionally extracts the canonical 11 DiagramId union members and the 11
 * diagram-registry keys, and asserts they agree with each other and with the
 * diagram ids actually referenced inside the content. This guarantees the "11
 * diagram ids" requirement is anchored to the source of truth, not guessed.
 *
 * Output: backend/app/core/optional/data/geo_optional_content.json
 *
 * Usage (from frontend/):  node scripts/extract-geo-optional-content.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(FRONTEND_ROOT, "..");

const OPTIONAL_DIR = join(FRONTEND_ROOT, "src", "lib", "upsc", "optional");
const GEOMORPH_TS = join(OPTIONAL_DIR, "geomorphology.ts");
const CLIMATOLOGY_TS = join(OPTIONAL_DIR, "climatology.ts");
const TYPES_TS = join(OPTIONAL_DIR, "geographyOptionalTypes.ts");
const DIAGRAMS_TSX = join(
  FRONTEND_ROOT,
  "src",
  "components",
  "upsc",
  "optional",
  "GeoOptionalDiagrams.tsx"
);

const OUT_PATH = join(
  REPO_ROOT,
  "backend",
  "app",
  "core",
  "optional",
  "data",
  "geo_optional_content.json"
);

/** Transpile a `.ts` content module to ESM JS and dynamically import it. */
async function loadTsModule(tsPath, exportName) {
  const source = readFileSync(tsPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      // `import type {...}` is fully erased; the module body has no runtime imports.
      verbatimModuleSyntax: false,
      isolatedModules: true,
    },
    fileName: tsPath,
  });
  const tmpDir = join(tmpdir(), "geo-optional-extract");
  mkdirSync(tmpDir, { recursive: true });
  const tmpFile = join(tmpDir, `${exportName}-${Date.now()}.mjs`);
  writeFileSync(tmpFile, outputText, "utf8");
  try {
    const mod = await import(pathToFileURL(tmpFile).href);
    return mod[exportName];
  } finally {
    rmSync(tmpFile, { force: true });
  }
}

/** Extract the string-literal members of the `DiagramId` union from the types file. */
function extractDiagramUnion() {
  const src = readFileSync(TYPES_TS, "utf8");
  const m = src.match(/export type DiagramId\s*=([\s\S]*?);/);
  if (!m) throw new Error("Could not locate the DiagramId union in types file");
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

/** Extract the registry keys from GeoOptionalDiagrams.tsx (the REGISTRY object). */
function extractRegistryKeys() {
  const src = readFileSync(DIAGRAMS_TSX, "utf8");
  const m = src.match(/const REGISTRY[\s\S]*?=\s*\{([\s\S]*?)\};/);
  if (!m) throw new Error("Could not locate the diagram REGISTRY in diagrams file");
  return [...m[1].matchAll(/"([^"]+)"\s*:/g)].map((x) => x[1]);
}

/** Collect every diagram id referenced by a `diagram` block across both topics. */
function diagramIdsReferenced(topics) {
  const ids = [];
  for (const topic of topics) {
    for (const st of topic.subtopics) {
      for (const block of st.blocks) {
        if (block.type === "diagram") ids.push(block.id);
      }
    }
  }
  return ids;
}

function assertSameSet(label, a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  const missing = [...sa].filter((x) => !sb.has(x));
  const extra = [...sb].filter((x) => !sa.has(x));
  if (missing.length || extra.length) {
    throw new Error(
      `Diagram id set mismatch (${label}). missing=${JSON.stringify(
        missing
      )} extra=${JSON.stringify(extra)}`
    );
  }
}

async function main() {
  const geomorphology = await loadTsModule(GEOMORPH_TS, "geomorphology");
  const climatology = await loadTsModule(CLIMATOLOGY_TS, "climatology");
  const topics = [geomorphology, climatology];

  const unionIds = extractDiagramUnion();
  const registryIds = extractRegistryKeys();
  const referencedIds = [...new Set(diagramIdsReferenced(topics))];

  // The DiagramId union is the canonical source of truth for the 11 ids.
  if (unionIds.length !== 11) {
    throw new Error(`Expected 11 DiagramId union members, found ${unionIds.length}`);
  }
  assertSameSet("union vs registry", unionIds, registryIds);
  assertSameSet("union vs referenced-in-content", unionIds, referencedIds);

  // Per-topic, per-subtopic deterministic counts (used by reporting + Task 4.2).
  const topicSummaries = topics.map((t) => ({
    slug: t.slug,
    title: t.title,
    subtopics: t.subtopics.length,
    officialLines: t.syllabus.official.length,
    trends: t.syllabus.trendSays.length,
    hiddenTopics: t.syllabus.hiddenTopics.length,
    examKeywords: t.subtopics.reduce((n, s) => n + s.examKeywords.length, 0),
    answerLanguageLines: t.subtopics.reduce((n, s) => n + s.answerLanguage.length, 0),
    pyqs: t.subtopics.reduce((n, s) => n + s.pyq.length, 0),
    diagramBlocks: t.subtopics.reduce(
      (n, s) => n + s.blocks.filter((b) => b.type === "diagram").length,
      0
    ),
  }));

  const artifact = {
    _meta: {
      generatedBy: "frontend/scripts/extract-geo-optional-content.mjs",
      generatedAt: new Date().toISOString(),
      sourceFiles: [
        "frontend/src/lib/upsc/optional/geomorphology.ts",
        "frontend/src/lib/upsc/optional/climatology.ts",
        "frontend/src/lib/upsc/optional/geographyOptionalTypes.ts",
        "frontend/src/components/upsc/optional/GeoOptionalDiagrams.tsx",
      ],
      note: "Mechanically transpiled + serialized from the live TS modules. No hand transcription.",
    },
    subjectSlug: "geography",
    subjectName: "Geography (Optional)",
    diagramIds: unionIds,
    topics: [geomorphology, climatology],
    summaries: topicSummaries,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(artifact, null, 2) + "\n", "utf8");

  console.log("Geography Optional content extracted ->", OUT_PATH);
  console.log("Canonical DiagramIds (", unionIds.length, "):", unionIds.join(", "));
  for (const s of topicSummaries) {
    console.log(
      `  ${s.slug}: subtopics=${s.subtopics} official=${s.officialLines} trends=${s.trends} ` +
        `hidden=${s.hiddenTopics} keywords=${s.examKeywords} answerLang=${s.answerLanguageLines} ` +
        `pyqs=${s.pyqs} diagramBlocks=${s.diagramBlocks}`
    );
  }
}

main().catch((err) => {
  console.error("Extraction failed:", err);
  process.exit(1);
});
