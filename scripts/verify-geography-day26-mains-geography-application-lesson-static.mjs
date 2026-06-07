import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay26PortalLesson.ts",
    patterns: [
      'title: "Mains Geography Application"',
      'id: "structure"',
      'id: "mechanism"',
      'id: "diagram"',
      'id: "example"',
      'id: "trap"',
      "Answer frame: context -> mechanism -> spatial proof -> example -> conclusion.",
      "Recall chain: frame -> explain -> visualize -> anchor -> conclude.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay26MainsGeographyApplicationVisual.tsx",
    patterns: [
      'data-testid="day26-mains-geography-application-visual"',
      "data-active-stage={activeStage.id}",
      "day26-mains-geography-application-stage-${stage.id}",
      "10-MARKER FRAME",
      "FACT-DUMP TRAP",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay26MainsGeographyApplicationVisual } from "@/components/upsc/GeographyDay26MainsGeographyApplicationVisual";',
      "activeSession.day === 26 ? <GeographyDay26MainsGeographyApplicationVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentySixMainsGeographyApplication = activeSession.day === 26 && labSlug === "india-map";',
      "isDayTwentySixMainsGeographyApplication && <GeographyDay26MainsGeographyApplicationVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 26) return geographyDay26PortalLesson.scenes;",
      "Start with ${geographyDay26PortalLesson.title}: frame the 10-marker through context, mechanism, spatial proof, example, and balanced conclusion.",
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
