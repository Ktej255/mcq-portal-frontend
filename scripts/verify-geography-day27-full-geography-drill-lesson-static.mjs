import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay27PortalLesson.ts",
    patterns: [
      'title: "Full Geography Drill"',
      'id: "physical"',
      'id: "india"',
      'id: "human"',
      'id: "bridges"',
      'id: "repair"',
      "Physical base: process -> location -> consequence.",
      "Recall chain: classify -> connect -> locate -> repair -> retest.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay27FullGeographyDrillVisual.tsx",
    patterns: [
      'data-testid="day27-full-geography-drill-visual"',
      "data-active-stage={activeStage.id}",
      "day27-full-geography-drill-stage-${stage.id}",
      "PHYSICAL BASE",
      "WEAK-AREA HEATMAP",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay27FullGeographyDrillVisual } from "@/components/upsc/GeographyDay27FullGeographyDrillVisual";',
      "activeSession.day === 27 ? <GeographyDay27FullGeographyDrillVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentySevenFullGeographyDrill = activeSession.day === 27 && labSlug === "mcq-engine";',
      "isDayTwentySevenFullGeographyDrill && <GeographyDay27FullGeographyDrillVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 27) return geographyDay27PortalLesson.scenes;",
      "Start with ${geographyDay27PortalLesson.title}: recall the physical base through process, location, and consequence.",
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
