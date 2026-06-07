import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay21PortalLesson.ts",
    patterns: [
      'title: "Human Geography Consolidation"',
      'id: "people"',
      'id: "settlements"',
      'id: "economy"',
      'id: "networks"',
      'id: "repair"',
      "Map chain: network -> industry or service -> regional gain -> pressure or disparity.",
      "Recall chain: people -> settlement -> economy -> network -> region -> repair the weak link.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay21HumanGeographyConsolidationVisual.tsx",
    patterns: [
      'data-testid="day21-human-geography-consolidation-visual"',
      "data-active-stage={activeStage.id}",
      "day21-human-geography-consolidation-stage-${stage.id}",
      "HUMAN GEOGRAPHY CHAIN",
      "REPAIR THE WEAKEST LINK",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay21HumanGeographyConsolidationVisual } from "@/components/upsc/GeographyDay21HumanGeographyConsolidationVisual";',
      "activeSession.day === 21 ? <GeographyDay21HumanGeographyConsolidationVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentyOneHumanGeographyConsolidation = activeSession.day === 21 && labSlug === "india-map";',
      "isDayTwentyOneHumanGeographyConsolidation && <GeographyDay21HumanGeographyConsolidationVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 21) return geographyDay21PortalLesson.scenes;",
      "Start with ${geographyDay21PortalLesson.title}: trace one people-to-region chain through population, settlement, activity, connectivity, industry, and development outcome.",
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
