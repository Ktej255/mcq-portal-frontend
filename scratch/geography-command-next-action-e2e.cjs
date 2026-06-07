const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-command-next-action-e2e-evidence.json");
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

async function seedCommandMemory(page) {
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey }) => {
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify({
          "2": {
            day: 2,
            watched: true,
            watchState: "Watched",
            confidence: "Working",
            updatedAt: new Date().toISOString(),
          },
          "3": {
            day: 3,
            watched: true,
            watchState: "Watched",
            confidence: "Shaky",
            talkBand: "Revisit",
            talkScore: 18,
            revisitQueued: true,
            updatedAt: new Date().toISOString(),
          },
          "4": {
            day: 4,
            confidence: "Working",
            talkBand: "Practice",
            talkScore: 76,
            revisitQueued: false,
            updatedAt: new Date().toISOString(),
          },
          "5": {
            day: 5,
            watched: true,
            watchState: "Watched",
            confidence: "Command",
            talkBand: "Command",
            talkScore: 96,
            revisitQueued: false,
            labCompleted: true,
            labMode: "monsoon",
            labInsight: "Pressure belts, Coriolis and ITCZ explain monsoon logic.",
            updatedAt: new Date().toISOString(),
          },
          "6": {
            day: 6,
            watched: true,
            watchState: "Watched",
            confidence: "Command",
            talkBand: "Command",
            talkScore: 97,
            revisitQueued: false,
            labCompleted: true,
            labMode: "monsoon",
            labInsight: "Currents explain climate, fog, deserts and fisheries.",
            updatedAt: new Date().toISOString(),
          },
          "7": {
            day: 7,
            watched: true,
            watchState: "Watched",
            confidence: "Command",
            talkBand: "Command",
            talkScore: 98,
            revisitQueued: false,
            labCompleted: true,
            labMode: "earth-layers",
            labInsight: "Physical geography recap connects tectonics, climate and ocean systems.",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D06": {
            planned: 25,
            drafted: 12,
            difficulty: "MEDIUM",
            status: "DRAFT",
            updatedAt: new Date().toISOString(),
          },
          "GEO-D07": {
            planned: 25,
            drafted: 25,
            difficulty: "HARD",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    { progressKey, mcqKey }
  );
}

async function expectActiveAction(page, label, expectedHref, checks) {
  const panel = page.getByTestId("command-next-action");
  await panel.getByText(label, { exact: false }).waitFor({ timeout: 15000 });
  const href = await panel.getByRole("link").getAttribute("href");
  checks.push({ label: `active-${label}`, href });
  if (href !== expectedHref) {
    throw new Error(`Expected ${label} link ${expectedHref}, got ${href}`);
  }
}

async function seedCompletedDay(page) {
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey }) => {
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
            reflection: "Geographic thinking connects location, scale, map proof and one UPSC trap.",
            confidence: "Command",
            talkBand: "Command",
            talkScore: 96,
            talkUnlockStage: "mcq",
            revisitQueued: false,
            mcqAttempted: true,
            mcqCompleted: true,
            mcqCorrectCount: 2,
            mcqTotal: 2,
            mcqScorePercent: 100,
            mcqOutcome: "Command",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D01": {
            planned: 2,
            drafted: 2,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
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
  await page.addInitScript((studentProfileKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_command_next_action");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "advanced",
        preparationStage: "multiple-attempts",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);

  await page.goto(`${baseUrl}/upsc/geography?day=1`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ progressKey: localProgressKey, mcqKey: localMcqKey }) => {
      window.localStorage.removeItem(localProgressKey);
      window.localStorage.removeItem(localMcqKey);
    },
    { progressKey, mcqKey }
  );
  await seedCommandMemory(page);
  await page.reload({ waitUntil: "networkidle" });

  await expectActiveAction(page, "Talk pending", "/upsc/geography/talk?day=1", checks);
  await page.getByTestId("geography-command-advanced-controls").locator("summary").click();
  await page.getByTestId("command-day-state-2").getByText("Talk pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("command-day-state-3").getByText("Revisit next", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("command-day-state-4").getByText("Repair next", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("command-day-state-5").getByText("MCQ next", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("command-day-state-6").getByText("MCQ next", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("command-day-state-7").getByText("MCQ next", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "command-next-action-desktop", checks);

  await page.getByTestId("command-day-4").click();
  await expectActiveAction(page, "Watch pending", "/upsc/geography/watch?day=4", checks);

  await page.getByTestId("command-day-5").click();
  await expectActiveAction(page, "Practice is being prepared", "/upsc/geography/mcq-readiness?day=5", checks);

  await page.getByTestId("command-day-6").click();
  await expectActiveAction(page, "Practice is being prepared", "/upsc/geography/mcq-readiness?day=6", checks);

  await page.getByTestId("command-day-7").click();
  await expectActiveAction(page, "Practice ready", "/upsc/geography/mcq-readiness?day=7", checks);

  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await page.getByTestId("geography-track-path-map").locator("summary").click();
  await page.getByTestId("track-day-1").getByText("Talk pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-2").getByText("Talk pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-3").getByText("Revisit required", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-4").getByText("Watch pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-5").getByText("Practice is being prepared", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-6").getByText("Practice is being prepared", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-7").getByText("Practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-shared-loop-state-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography?day=7`, { waitUntil: "networkidle" });
  await expectActiveAction(page, "Practice ready", "/upsc/geography/mcq-readiness?day=7", checks);
  await assertNoOverflow(page, "command-next-action-mobile", checks);

  await seedCompletedDay(page);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${baseUrl}/upsc/geography/track?day=1`, { waitUntil: "networkidle" });
  await page.getByTestId("geography-track-focused-day").getByText("Start Day 2", { exact: false }).waitFor({ timeout: 15000 });
  const nextTopicHref = await page.getByTestId("geography-track-focused-route").getAttribute("href");
  const duplicateCloseoutCount = await page.getByTestId("geography-track-closeout-panel").count();
  const dayMapVisibleBeforeOpen = await page.getByTestId("track-day-1").isVisible();
  const advancedToolsOpen = await page.getByTestId("geography-track-advanced-tools").evaluate((element) => element.open);
  checks.push({ label: "track-single-next-topic-action", nextTopicHref, duplicateCloseoutCount, dayMapVisibleBeforeOpen, advancedToolsOpen });
  if (nextTopicHref !== "/upsc/geography/talk?day=2" || duplicateCloseoutCount !== 0 || dayMapVisibleBeforeOpen || advancedToolsOpen) {
    throw new Error(`Track should expose one folded, next-topic handoff: ${JSON.stringify({ nextTopicHref, duplicateCloseoutCount, dayMapVisibleBeforeOpen, advancedToolsOpen })}`);
  }
  await assertNoOverflow(page, "track-single-action-desktop", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-command-next-action-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
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
