import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay15PortalLesson.ts",
    patterns: [
      'title: "Population Geography"',
      'id: "concepts"',
      'id: "controls"',
      'id: "migration"',
      'id: "transition"',
      'id: "trap"',
      "Map chain: physical base + access + livelihood + safety shape population distribution.",
      "Recall chain: indicator -> factor -> map pattern -> migration or transition -> reject the swap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay15PopulationVisual.tsx",
    patterns: [
      'data-testid="day15-population-visual"',
      "data-active-stage={activeStage.id}",
      "day15-population-stage-${stage.id}",
      "INDICATORS",
      "DEMOGRAPHIC TRANSITION",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay15PopulationVisual } from "@/components/upsc/GeographyDay15PopulationVisual";',
      "activeSession.day === 15 ? <GeographyDay15PopulationVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayFifteenPopulationGeography = activeSession.day === 15 && labSlug === "india-map";',
      "isDayFifteenPopulationGeography && <GeographyDay15PopulationVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 15) return geographyDay15PortalLesson.scenes;",
      "Start with ${geographyDay15PortalLesson.title}: separate density as a ratio from distribution as a spatial pattern.",
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
