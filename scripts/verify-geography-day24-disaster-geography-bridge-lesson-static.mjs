import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay24PortalLesson.ts",
    patterns: [
      'title: "Disaster Geography Bridge"',
      'id: "hazard"',
      'id: "exposure"',
      'id: "vulnerability"',
      'id: "capacity"',
      'id: "trap"',
      "Hazard is the physical event. Disaster is the human outcome.",
      "Recall chain: hazard -> exposure -> vulnerability -> capacity -> verify.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay24DisasterGeographyBridgeVisual.tsx",
    patterns: [
      'data-testid="day24-disaster-geography-bridge-visual"',
      "data-active-stage={activeStage.id}",
      "day24-disaster-geography-bridge-stage-${stage.id}",
      "PHYSICAL HAZARD",
      "UPSC MISMATCH CHECK",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay24DisasterGeographyBridgeVisual } from "@/components/upsc/GeographyDay24DisasterGeographyBridgeVisual";',
      "activeSession.day === 24 ? <GeographyDay24DisasterGeographyBridgeVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentyFourDisasterGeographyBridge = activeSession.day === 24 && labSlug === "disaster-link";',
      "isDayTwentyFourDisasterGeographyBridge && <GeographyDay24DisasterGeographyBridgeVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 24) return geographyDay24PortalLesson.scenes;",
      "Start with ${geographyDay24PortalLesson.title}: separate hazard from disaster by tracing exposure, vulnerability, and capacity in one region.",
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
