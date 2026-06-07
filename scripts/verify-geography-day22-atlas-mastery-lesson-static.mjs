import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay22PortalLesson.ts",
    patterns: [
      'title: "Atlas Mastery"',
      'id: "orient"',
      'id: "neighbors"',
      'id: "layers"',
      'id: "recall"',
      'id: "trap"',
      "Map chain: location -> neighbor -> physical feature -> regional context.",
      "Recall chain: direction -> neighbor -> layer -> link -> reject the regional swap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay22AtlasMasteryVisual.tsx",
    patterns: [
      'data-testid="day22-atlas-mastery-visual"',
      "data-active-stage={activeStage.id}",
      "day22-atlas-mastery-stage-${stage.id}",
      "ORIENTATION FIRST",
      "QUICK RECALL",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay22AtlasMasteryVisual } from "@/components/upsc/GeographyDay22AtlasMasteryVisual";',
      "activeSession.day === 22 ? <GeographyDay22AtlasMasteryVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentyTwoAtlasMastery = activeSession.day === 22 && labSlug === "india-map";',
      "isDayTwentyTwoAtlasMastery && <GeographyDay22AtlasMasteryVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 22) return geographyDay22PortalLesson.scenes;",
      "Start with ${geographyDay22PortalLesson.title}: locate one recurring place through direction, region, and neighboring areas before adding detail.",
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
