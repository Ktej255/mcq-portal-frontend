import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Honest-failure validator for the optional-subject learner surfaces.
 *
 * The rule this enforces (founder decision, 2026-10-31): a learner surface may
 * only ever show content the backend has stored and reviewed. When a request
 * fails the surface reports the failure and offers a retry — it must not render
 * frontend-assembled data as loaded, and it must not render a computed default
 * (0% coverage, a hidden completeness line) as if it were a measurement.
 *
 * Checks are deliberately static so they run on a host that cannot build:
 * 1. the deleted Next.js optional-API route mirrors stay deleted;
 * 2. no learner surface (src/app, src/components) imports the offline resolver;
 * 3. every `.catch()` body in the five fetching surfaces marks the surface as
 *    failed and never as loaded;
 * 4. each failure panel carries a retry path that re-runs the real request;
 * 5. the PYQ explorer still enforces the REVIEWED contract on responses;
 * 6. the gap panel distinguishes "not measured" from a percentage;
 * 7. the subject completeness line states "Not verified" instead of vanishing.
 */

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, "..");
const sourceRoot = path.join(frontendRoot, "src");

const surfaces = {
  ReadView: path.join(sourceRoot, "components", "upsc", "ReadView.tsx"),
  SyllabusView: path.join(sourceRoot, "components", "upsc", "SyllabusView.tsx"),
  PyqExplorer: path.join(sourceRoot, "components", "upsc", "PyqExplorer.tsx"),
  PracticeBoard: path.join(sourceRoot, "components", "upsc", "PracticeBoard.tsx"),
  GapPanel: path.join(sourceRoot, "components", "upsc", "GapPanel.tsx"),
  SubjectShell: path.join(sourceRoot, "components", "upsc", "SubjectShell.tsx"),
};

const mirrorDirectory = path.join(sourceRoot, "app", "api", "v1", "optional");
const resolverModuleName = "optionalDataResolver";

const failures = [];
const skips = [];
const checked = [];

function displayPath(filePath) {
  return path.relative(frontendRoot, filePath).split(path.sep).join("/");
}

function addFailure(message) {
  failures.push(message);
}

function addChecked(message) {
  checked.push(message);
}

function addSkip(message) {
  skips.push(message);
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    addFailure(`required source file is missing: ${displayPath(filePath)}`);
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

/** Return the `{ ... }` body that follows `openingBraceIndex`, comment/string aware. */
function braceBody(source, openingBraceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") {
      depth += 1;
      continue;
    }
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openingBraceIndex + 1, index);
    }
  }
  return null;
}

/** Every `.catch(` handler body in the file, with its line number. */
function catchBodies(source) {
  const bodies = [];
  const pattern = /\.catch\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const braceIndex = source.indexOf("{", match.index + match[0].length - 1);
    if (braceIndex === -1) continue;
    const body = braceBody(source, braceIndex);
    if (body === null) {
      addSkip(
        `unterminated .catch() body near line ${source.slice(0, match.index).split("\n").length}`,
      );
      continue;
    }
    bodies.push({ body, line: source.slice(0, match.index).split("\n").length });
  }
  return bodies;
}

function walkSourceFiles(directory, collected = []) {
  if (!fs.existsSync(directory)) return collected;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(fullPath, collected);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      collected.push(fullPath);
    }
  }
  return collected;
}

function validateMirrorsStayDeleted() {
  if (fs.existsSync(mirrorDirectory)) {
    const leaked = walkSourceFiles(mirrorDirectory);
    addFailure(
      `optional-API route mirrors are back (${leaked.length} file(s)) under ${displayPath(mirrorDirectory)}: ` +
        `${leaked.slice(0, 5).map(displayPath).join(", ")}${leaked.length > 5 ? ", ..." : ""}`,
    );
    return;
  }
  addChecked(`${displayPath(mirrorDirectory)} does not exist — optionals are backend-only`);
}

function validateNoResolverImports() {
  const scannedRoots = [path.join(sourceRoot, "app"), path.join(sourceRoot, "components")];
  const offenders = [];
  let fileCount = 0;

  for (const root of scannedRoots) {
    for (const filePath of walkSourceFiles(root)) {
      fileCount += 1;
      const source = fs.readFileSync(filePath, "utf8");
      const importPattern = new RegExp(`from\\s+"[^"]*${resolverModuleName}"`);
      if (importPattern.test(source)) offenders.push(displayPath(filePath));
    }
  }

  if (offenders.length > 0) {
    addFailure(
      `learner surfaces import the offline ${resolverModuleName} module: ${offenders.join(", ")}`,
    );
    return;
  }
  addChecked(
    `no learner surface under src/app or src/components imports ${resolverModuleName} (${fileCount} files scanned)`,
  );
}

function validateCatchFailHonestly(name, source) {
  if (!source) return;
  const bodies = catchBodies(source);
  if (bodies.length === 0) {
    addFailure(`${name}: no .catch() handler found, so a failed request cannot be reported`);
    return;
  }

  let honest = 0;
  for (const { body, line } of bodies) {
    const marksLoaded = /setState\(\s*"loaded"\s*\)|setStatus\(\s*"loaded"\s*\)|status:\s*"loaded"/.test(
      body,
    );
    // Any `set…State("error")`-style call or an explicit `status: "error"`
    // counts as recording the failure; the point is the surface keeps an error
    // fact rather than dropping it.
    const marksFailed =
      /"error"/.test(body) &&
      (/set[A-Za-z0-9_$]*\(\s*"error"\s*\)/.test(body) || /status:\s*"error"/.test(body));

    if (marksLoaded) {
      addFailure(
        `${name}: the .catch() at line ${line} marks the surface "loaded" — a failed request must not render as data`,
      );
      continue;
    }
    if (!marksFailed) {
      addFailure(
        `${name}: the .catch() at line ${line} neither clears the loaded flag nor records an error state`,
      );
      continue;
    }
    honest += 1;
  }

  if (honest > 0 && failures.every((f) => !f.startsWith(`${name}:`))) {
    addChecked(`${name}: ${honest} .catch() handler(s) fail honestly (no "loaded", error recorded)`);
  }
}

function validateRetryRerunsRequest(name, source) {
  if (!source) return;
  const hasRetryWiring = /onRetry=\{\s*\(\)\s*=>/.test(source);
  const bumpsNonce = /(setReloadNonce|setTopicReloadNonce|setNonce)\(\s*\(n\)\s*=>\s*n\s*\+\s*1\s*\)/.test(
    source,
  );

  if (!hasRetryWiring) {
    addFailure(`${name}: the failure panel offers no retry control`);
    return;
  }
  if (!bumpsNonce) {
    addFailure(
      `${name}: retry does not bump a request nonce, so the real request is not re-issued`,
    );
    return;
  }
  addChecked(`${name}: failure panel retries by re-issuing the backend request`);
}

function validateReviewedGuard(source) {
  if (!source) return;
  if (!/review_status\s*===\s*"REVIEWED"/.test(source)) {
    addFailure('PyqExplorer: no client-side "REVIEWED" contract check on PYQ rows');
    return;
  }
  if (!/hasOnlyReviewedPyqs/.test(source)) {
    addFailure("PyqExplorer: the REVIEWED check is not applied to the response it renders");
    return;
  }
  addChecked("PyqExplorer: responses are refused unless every PYQ row is marked REVIEWED");
}

function validateGapMeasurement(source) {
  if (!source) return;
  if (!/function isMeasuredCoverage/.test(source)) {
    addFailure("GapPanel: coverage percentage is printed without a measured/not-measured decision");
    return;
  }
  const measuredBranches = (source.match(/data-measured="(true|false)"/g) || []).length;
  if (measuredBranches < 2) {
    addFailure(
      'GapPanel: the rendered coverage block does not expose a measured / "Not measured yet" state',
    );
    return;
  }
  if (!/Not measured yet/.test(source)) {
    addFailure('GapPanel: no "Not measured yet" wording for untracked coverage');
    return;
  }
  addChecked(
    'GapPanel: coverage renders "Not measured yet" instead of a 0.0% placeholder until activity is tracked',
  );
}

function validateCompletenessStatesFailure(source) {
  if (!source) return;
  if (!/data-status-label="Not verified"/.test(source)) {
    addFailure(
      "SubjectShell: the completeness line still disappears when the backend read fails",
    );
    return;
  }
  if (/graceful: no completeness line/.test(source)) {
    addFailure("SubjectShell: the silent-failure completeness path is still present");
    return;
  }
  addChecked('SubjectShell: a failed completeness read states "Not verified"');
}

function main() {
  validateMirrorsStayDeleted();
  validateNoResolverImports();

  const readView = readRequired(surfaces.ReadView);
  const syllabusView = readRequired(surfaces.SyllabusView);
  const pyqExplorer = readRequired(surfaces.PyqExplorer);
  const practiceBoard = readRequired(surfaces.PracticeBoard);
  const gapPanel = readRequired(surfaces.GapPanel);
  const subjectShell = readRequired(surfaces.SubjectShell);

  validateCatchFailHonestly("ReadView", readView);
  validateCatchFailHonestly("SyllabusView", syllabusView);
  validateCatchFailHonestly("PyqExplorer", pyqExplorer);
  validateCatchFailHonestly("PracticeBoard", practiceBoard);
  validateCatchFailHonestly("GapPanel", gapPanel);
  validateCatchFailHonestly("SubjectShell", subjectShell);

  validateRetryRerunsRequest("ReadView", readView);
  validateRetryRerunsRequest("SyllabusView", syllabusView);
  validateRetryRerunsRequest("PyqExplorer", pyqExplorer);
  validateRetryRerunsRequest("PracticeBoard", practiceBoard);
  validateRetryRerunsRequest("GapPanel", gapPanel);

  validateReviewedGuard(pyqExplorer);
  validateGapMeasurement(gapPanel);
  validateCompletenessStatesFailure(subjectShell);

  if (failures.length > 0) {
    console.error(
      `[validate-optional-honest-failure] FAIL (${failures.length} violation${failures.length === 1 ? "" : "s"})`,
    );
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(
      `[validate-optional-honest-failure] PASS: ${checked.length} honest-failure checks passed across the optional learner surfaces.`,
    );
  }
  if (skips.length > 0) {
    console.log(`[validate-optional-honest-failure] SKIPPED (${skips.length}):`);
    for (const skip of skips) console.log(`- ${skip}`);
  }
}

try {
  main();
} catch (error) {
  console.error(
    `[validate-optional-honest-failure] ERROR: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
