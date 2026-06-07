import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay3PortalLesson.ts",
    patterns: [
      'title: "Interior of Earth and Plate Movement"',
      'id: "evidence"',
      'id: "layers"',
      'id: "convection"',
      'id: "boundaries"',
      'id: "hazards"',
      "Trap: S-waves cannot pass through liquids; P-waves can pass through solids and liquids.",
      "Recall chain: seismic evidence -> layers -> mantle behavior -> boundaries -> landforms and hazards.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay3PlateVisual.tsx",
    patterns: [
      'data-testid="day3-plate-visual"',
      "data-active-stage={activeStage.id}",
      "day3-plate-stage-${stage.id}",
      'data-testid="day3-continuous-convection-motion"',
      "Divergent: ridge and new crust",
      "Transform: earthquake fault",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay3PlateVisual } from "@/components/upsc/GeographyDay3PlateVisual";',
      "activeSession.day === 3 ? <GeographyDay3PlateVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      "const isDayThreeEarthLayers = activeSession.day === 3 && labSlug === \"earth-layers\";",
      "isDayThreeEarthLayers && <GeographyDay3PlateVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 3) return geographyDay3PortalLesson.scenes;",
      "Start with ${geographyDay3PortalLesson.title}: seismic behavior reveals the layered Earth.",
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
