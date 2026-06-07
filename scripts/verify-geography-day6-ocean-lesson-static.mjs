import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay6PortalLesson.ts",
    patterns: [
      'title: "Ocean System"',
      'id: "relief"',
      'id: "properties"',
      'id: "circulation"',
      'id: "effects"',
      'id: "map"',
      "UPSC trap: salinity alone does not explain fisheries; upwelling and nutrient supply matter.",
      "Recall chain: relief -> properties -> circulation -> coastal effects -> current-location map pair.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay6OceanVisual.tsx",
    patterns: [
      'data-testid="day6-ocean-visual"',
      "data-active-stage={activeStage.id}",
      "day6-ocean-stage-${stage.id}",
      "warm current redistributes heat",
      "cold current supports upwelling logic",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay6OceanVisual } from "@/components/upsc/GeographyDay6OceanVisual";',
      "activeSession.day === 6 ? <GeographyDay6OceanVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDaySixOceanSystem = activeSession.day === 6 && labSlug === "monsoon";',
      "isDaySixOceanSystem && <GeographyDay6OceanVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 6) return geographyDay6PortalLesson.scenes;",
      "Start with ${geographyDay6PortalLesson.title}: connect shelf, slope, abyssal plain, ridge, and trench before naming current effects.",
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
