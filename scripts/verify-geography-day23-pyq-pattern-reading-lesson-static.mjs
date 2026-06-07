import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay23PortalLesson.ts",
    patterns: [
      'title: "PYQ Pattern Reading"',
      'id: "classify"',
      'id: "sequence"',
      'id: "pairs"',
      'id: "explain"',
      'id: "repair"',
      "Trap check: right fact + wrong order or location = wrong statement.",
      "Recall chain: classify -> verify -> reject -> rewrite -> retest.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay23PyqPatternReadingVisual.tsx",
    patterns: [
      'data-testid="day23-pyq-pattern-reading-visual"',
      "data-active-stage={activeStage.id}",
      "day23-pyq-pattern-reading-stage-${stage.id}",
      "WHAT IS UPSC TESTING?",
      "REPAIR CARD",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay23PyqPatternReadingVisual } from "@/components/upsc/GeographyDay23PyqPatternReadingVisual";',
      "activeSession.day === 23 ? <GeographyDay23PyqPatternReadingVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentyThreePyqPatternReading = activeSession.day === 23 && labSlug === "mcq-engine";',
      "isDayTwentyThreePyqPatternReading && <GeographyDay23PyqPatternReadingVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 23) return geographyDay23PortalLesson.scenes;",
      "Start with ${geographyDay23PortalLesson.title}: classify whether UPSC is testing a concept, map location, process order, exception, pair match, or current-static link.",
    ],
  },
];

const results = [];

for (const check of checks) {
  const source = read(check.file);
  for (const pattern of check.patterns) {
    results.push({
      file: check.file,
      pattern,
      passed: source.includes(pattern),
    });
  }
}

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ checks: results.length, failed, passed: failed.length === 0 }, null, 2));

if (failed.length) process.exit(1);
