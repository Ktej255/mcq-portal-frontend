import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay12PortalLesson.ts",
    patterns: [
      'title: "Soils and Vegetation"',
      'id: "formation"',
      'id: "soils"',
      'id: "vegetation"',
      'id: "pressure"',
      'id: "conserve"',
      "Map chain: rainfall + temperature + altitude + soil shape vegetation pattern.",
      "Recall chain: factor -> region -> soil or forest -> use -> limitation -> conservation response.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay12SoilsVegetationVisual.tsx",
    patterns: [
      'data-testid="day12-soils-vegetation-visual"',
      "data-active-stage={activeStage.id}",
      "day12-soils-vegetation-stage-${stage.id}",
      "FORMATION FACTORS",
      "CONSERVE WITH LOGIC",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay12SoilsVegetationVisual } from "@/components/upsc/GeographyDay12SoilsVegetationVisual";',
      "activeSession.day === 12 ? <GeographyDay12SoilsVegetationVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwelveSoilsVegetation = activeSession.day === 12 && labSlug === "environment-bridge";',
      "isDayTwelveSoilsVegetation && <GeographyDay12SoilsVegetationVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 12) return geographyDay12PortalLesson.scenes;",
      "Start with ${geographyDay12PortalLesson.title}: build soil from parent material, climate, relief, drainage, organisms, and time.",
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
