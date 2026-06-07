import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay14PortalLesson.ts",
    patterns: [
      'title: "India Map Drill"',
      'id: "relief"',
      'id: "drainage"',
      'id: "climate"',
      'id: "production"',
      'id: "repair"',
      "Map chain: relief -> slope -> river path -> basin -> outlet -> use or risk.",
      "Recall chain: locate -> layer -> cause -> linked effect -> reject the mixed-region trap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay14IndiaMapDrillVisual.tsx",
    patterns: [
      'data-testid="day14-india-map-drill-visual"',
      "data-active-stage={activeStage.id}",
      "day14-india-map-drill-stage-${stage.id}",
      "1. RELIEF BASE",
      "5. REPAIR CARDS",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay14IndiaMapDrillVisual } from "@/components/upsc/GeographyDay14IndiaMapDrillVisual";',
      "activeSession.day === 14 ? <GeographyDay14IndiaMapDrillVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayFourteenIndiaMapDrill = activeSession.day === 14 && labSlug === "india-map";',
      "isDayFourteenIndiaMapDrill && <GeographyDay14IndiaMapDrillVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 14) return geographyDay14PortalLesson.scenes;",
      "Start with ${geographyDay14PortalLesson.title}: lay down relief before adding the connected India map layers.",
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
