import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay11PortalLesson.ts",
    patterns: [
      'title: "Climate Regions of India"',
      'id: "controls"',
      'id: "rainfall"',
      'id: "shadow"',
      'id: "winter"',
      'id: "regions"',
      "Trap: proximity alone does not guarantee similar rainfall when relief changes the wind path.",
      "Recall chain: control factors -> rainfall season -> temperature range -> map example -> regional trap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay11ClimateRegionsVisual.tsx",
    patterns: [
      'data-testid="day11-climate-regions-visual"',
      "data-active-stage={activeStage.id}",
      "day11-climate-regions-stage-${stage.id}",
      "CLIMATE CONTROLS",
      "WESTERN DISTURBANCES",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay11ClimateRegionsVisual } from "@/components/upsc/GeographyDay11ClimateRegionsVisual";',
      "activeSession.day === 11 ? <GeographyDay11ClimateRegionsVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayElevenClimateRegions = activeSession.day === 11 && labSlug === "monsoon";',
      "isDayElevenClimateRegions && <GeographyDay11ClimateRegionsVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 11) return geographyDay11PortalLesson.scenes;",
      "Start with ${geographyDay11PortalLesson.title}: read latitude, altitude, relief, distance from sea, pressure systems, and winds as interacting controls.",
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
