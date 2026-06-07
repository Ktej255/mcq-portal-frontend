import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay18PortalLesson.ts",
    patterns: [
      'title: "Transport and Trade"',
      'id: "network"',
      'id: "modes"',
      'id: "ports"',
      'id: "change"',
      'id: "trap"',
      "Map chain: port -> hinterland -> corridor -> cargo flow -> regional transformation.",
      "Recall chain: node -> route -> mode -> hinterland -> effect -> reject the mismatch.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay18TransportTradeVisual.tsx",
    patterns: [
      'data-testid="day18-transport-trade-visual"',
      "data-active-stage={activeStage.id}",
      "day18-transport-trade-stage-${stage.id}",
      "NETWORK LOGIC",
      "PORT GATEWAY",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay18TransportTradeVisual } from "@/components/upsc/GeographyDay18TransportTradeVisual";',
      "activeSession.day === 18 ? <GeographyDay18TransportTradeVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayEighteenTransportTrade = activeSession.day === 18 && labSlug === "india-map";',
      "isDayEighteenTransportTrade && <GeographyDay18TransportTradeVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 18) return geographyDay18PortalLesson.scenes;",
      "Start with ${geographyDay18PortalLesson.title}: trace nodes, routes, corridors, and terminals as one connectivity system.",
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
