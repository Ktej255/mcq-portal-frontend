import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay2PortalLesson.ts",
    patterns: [
      'title: "Origin and Evolution of Earth"',
      'id: "expansion"',
      'id: "accretion"',
      'id: "differentiation"',
      'id: "surface"',
      "Trap: do not imagine a central blast moving through pre-existing empty space.",
      "Recall chain: expansion -> gravity -> accretion -> differentiation -> atmosphere and hydrosphere.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay2UniverseVisual.tsx",
    patterns: [
      'data-testid="day2-universe-visual"',
      "data-active-stage={activeStage.id}",
      "day2-universe-stage-${stage.id}",
      'title="Restart animation"',
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay2UniverseVisual } from "@/components/upsc/GeographyDay2UniverseVisual";',
      "activeSession.day === 2 ? <GeographyDay2UniverseVisual /> : null",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 2) return geographyDay2PortalLesson.scenes;",
      'if (labTitle === "Universe Foundation Visual") return "universe";',
    ],
  },
  {
    file: "src/lib/upsc/plan.ts",
    patterns: [
      'title: "Origin and Evolution of Earth"',
      'title: "Interior of Earth and Plate Movement"',
      'lab: "Universe Foundation Visual"',
    ],
  },
  {
    file: "src/lib/upsc/contentCommand.ts",
    patterns: [
      'lessonTitle: "Origin and Evolution of Earth: Expansion, Accretion, and Differentiation"',
      'lessonTitle: "Interior of Earth and Plate Movement: Seismic Evidence, Layers, and Boundaries"',
      "Day 2 portal-native visual lesson is source-backed",
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
