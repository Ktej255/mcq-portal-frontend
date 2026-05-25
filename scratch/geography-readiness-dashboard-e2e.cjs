const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const evidencePath = path.join(__dirname, "geography-readiness-dashboard-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function seedReadinessState(page) {
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey }) => {
      const now = new Date().toISOString();
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify({
          "2": {
            day: 2,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["2-briefing", "2-mechanism", "2-map", "2-trap", "2-recap"],
            confidence: "Working",
            updatedAt: now,
          },
          "3": {
            day: 3,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["3-briefing", "3-mechanism", "3-map", "3-trap", "3-recap"],
            confidence: "Shaky",
            reflection: "Plate tectonics answer missed the map proof and exception.",
            talkBand: "Revisit",
            talkScore: 25,
            revisitQueued: true,
            recoveryDiagnosisSummary: "Map proof: 4/20 Weak. Add one plate boundary example.",
            updatedAt: now,
          },
          "4": {
            day: 4,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["4-briefing", "4-mechanism", "4-map", "4-trap", "4-recap"],
            confidence: "Working",
            reflection: "Geomorphic processes explanation crossed the oral floor.",
            talkBand: "Practice",
            talkScore: 78,
            labProofCompletedIds: ["4-lab-concept", "4-lab-map"],
            updatedAt: now,
          },
          "5": {
            day: 5,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-map", "5-trap", "5-recap"],
            confidence: "Command",
            reflection: "Climatology has a clear mechanism and example.",
            talkBand: "Command",
            talkScore: 86,
            labCompleted: true,
            labMode: "monsoon",
            labProofCompletedIds: ["5-lab-concept", "5-lab-map", "5-lab-example", "5-lab-trap", "5-lab-answer"],
            updatedAt: now,
          },
          "6": {
            day: 6,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["6-briefing", "6-mechanism", "6-map", "6-trap", "6-recap"],
            confidence: "Command",
            reflection: "Ocean currents are ready for MCQ practice.",
            talkBand: "Command",
            talkScore: 84,
            labCompleted: true,
            labMode: "monsoon",
            labProofCompletedIds: ["6-lab-concept", "6-lab-map", "6-lab-example", "6-lab-trap", "6-lab-answer"],
            updatedAt: now,
          },
          "7": {
            day: 7,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["7-briefing", "7-mechanism", "7-map", "7-trap", "7-recap"],
            confidence: "Command",
            reflection: "Physical geography integration is command-ready.",
            talkBand: "Command",
            talkScore: 92,
            labCompleted: true,
            labMode: "earth-layers",
            labProofCompletedIds: ["7-lab-concept", "7-lab-map", "7-lab-example", "7-lab-trap", "7-lab-answer"],
            mcqAttempted: true,
            mcqCompleted: true,
            mcqAnsweredCount: 25,
            mcqCorrectCount: 22,
            mcqTotal: 25,
            mcqScorePercent: 88,
            mcqOutcome: "Command",
            updatedAt: now,
          },
        })
      );
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D05": { planned: 25, drafted: 12, difficulty: "MEDIUM", status: "DRAFT", updatedAt: now },
          "GEO-D06": { planned: 25, drafted: 25, difficulty: "HARD", status: "READY", updatedAt: now },
          "GEO-D07": { planned: 25, drafted: 25, difficulty: "HARD", status: "READY", updatedAt: now },
        })
      );
    },
    { progressKey, mcqKey }
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/upsc/geography/track?day=3`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey }) => {
      window.localStorage.removeItem(localProgressKey);
      window.localStorage.removeItem(localMcqKey);
    },
    { progressKey, mcqKey }
  );
  await seedReadinessState(page);
  await page.reload({ waitUntil: "networkidle" });

  await page.getByTestId("geography-readiness-snapshot").getByText("Command readiness", { exact: false }).waitFor({
    timeout: 15000,
  });
  await page.getByTestId("geography-next-action-3").getByText("Revisit required", { exact: false }).waitFor({
    timeout: 15000,
  });
  const nextActionHref = await page.getByTestId("geography-next-action-3").getAttribute("href");
  if (nextActionHref !== "/upsc/geography/revisit?day=3") {
    throw new Error(`Expected Day 3 next action to route to Revisit, got ${nextActionHref}`);
  }

  const checklist = page.getByTestId("geography-focused-stage-checklist");
  await checklist.getByText("Watch", { exact: true }).waitFor({ timeout: 15000 });
  await checklist.getByText("complete", { exact: true }).first().waitFor({ timeout: 15000 });
  await checklist.getByText("Revisit", { exact: true }).waitFor({ timeout: 15000 });
  await checklist.getByText("active", { exact: true }).first().waitFor({ timeout: 15000 });
  await checklist.getByText("Map proof: 4/20 Weak", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "readiness-track-desktop", checks);

  await page.goto(`${baseUrl}/upsc/geography?day=7`, { waitUntil: "networkidle" });
  await page.getByTestId("command-readiness-score").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("command-readiness-score").getByText("Command ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("command-subject-readiness").getByText("/30 command", { exact: false }).waitFor({
    timeout: 15000,
  });
  await assertNoOverflow(page, "readiness-command-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/track?day=3`, { waitUntil: "networkidle" });
  await page.getByTestId("geography-readiness-snapshot").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "readiness-track-mobile", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-readiness-dashboard-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    nextActionHref,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
