import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay7PortalLesson.ts",
    patterns: [
      'title: "Physical Geography Consolidation"',
      'id: "location"',
      'id: "tectonics"',
      'id: "surface"',
      'id: "circulation"',
      'id: "synthesis"',
      "Trap: tectonics creates relief; weathering and erosion reshape it.",
      "Recall chain: locate -> explain the driver -> trace the process -> map the effect -> reject the trap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay7ConsolidationVisual.tsx",
    patterns: [
      'data-testid="day7-consolidation-visual"',
      "data-active-stage={activeStage.id}",
      "day7-consolidation-stage-${stage.id}",
      "physical geography works as one connected map system",
      'locate {"->"} explain driver {"->"} trace process {"->"} map effect {"->"} reject trap',
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay7ConsolidationVisual } from "@/components/upsc/GeographyDay7ConsolidationVisual";',
      "activeSession.day === 7 ? <GeographyDay7ConsolidationVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDaySevenPhysicalConsolidation = activeSession.day === 7 && labSlug === "earth-layers";',
      "isDaySevenPhysicalConsolidation && <GeographyDay7ConsolidationVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 7) return geographyDay7PortalLesson.scenes;",
      "Start with ${geographyDay7PortalLesson.title}: locate the pattern before joining the physical systems.",
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
