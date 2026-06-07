import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay5PortalLesson.ts",
    patterns: [
      'title: "Climatology Base"',
      'id: "insolation"',
      'id: "pressure"',
      'id: "circulation"',
      'id: "coriolis"',
      'id: "belts"',
      "UPSC trap: Coriolis changes direction; it does not create the original pressure-gradient force.",
      "Recall chain: unequal heating -> pressure gradient -> circulation -> Coriolis deflection -> planetary wind belts.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay5ClimatologyVisual.tsx",
    patterns: [
      'data-testid="day5-climatology-visual"',
      "data-active-stage={activeStage.id}",
      "day5-climatology-stage-${stage.id}",
      "pressure gradient moves air high to low",
      "Coriolis curves moving air on a rotating Earth",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay5ClimatologyVisual } from "@/components/upsc/GeographyDay5ClimatologyVisual";',
      "activeSession.day === 5 ? <GeographyDay5ClimatologyVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayFiveMonsoonBase = activeSession.day === 5 && labSlug === "monsoon";',
      "isDayFiveMonsoonBase && <GeographyDay5ClimatologyVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 5) return geographyDay5PortalLesson.scenes;",
      "Start with ${geographyDay5PortalLesson.title}: unequal solar heating creates the atmospheric energy imbalance.",
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
