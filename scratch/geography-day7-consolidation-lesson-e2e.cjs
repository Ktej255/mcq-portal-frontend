const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-day7-consolidation-lesson-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day7-consolidation-lesson-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function assertStage(page, stage, checks) {
  await page.getByTestId(`day7-consolidation-stage-${stage}`).first().click();
  const activeStage = await page.getByTestId("day7-consolidation-visual").first().getAttribute("data-active-stage");
  checks.push({ label: `day7-visual-stage-${stage}`, activeStage });
  if (activeStage !== stage) throw new Error(`Expected active Day 7 stage ${stage}, received ${activeStage}`);
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

  await page.addInitScript(({ studentProfileKey }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_day7_consolidation_lesson");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "60",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      }),
    );
  }, { studentProfileKey: profileKey });

  await page.goto(`${baseUrl}/upsc/geography/watch?day=7`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Physical Geography Consolidation", { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-duration").getByText("12 min topic", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("day7-consolidation-visual").waitFor({ timeout: 15000 });

  const initialStage = await page.getByTestId("day7-consolidation-visual").getAttribute("data-active-stage");
  checks.push({ label: "day7-visual-initial-stage", initialStage });
  if (initialStage !== "location") throw new Error(`Expected location initial stage, received ${initialStage}`);

  await page
    .getByText("Start with place: every physical-geography answer needs a location or map relationship.", { exact: true })
    .waitFor({ timeout: 15000 });
  await assertStage(page, "tectonics", checks);
  await assertStage(page, "surface", checks);
  await assertStage(page, "circulation", checks);
  await assertStage(page, "synthesis", checks);
  await page
    .getByText("Recall chain: locate -> explain the driver -> trace the process -> map the effect -> reject the trap.", {
      exact: true,
    })
    .waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day7-consolidation-watch-desktop", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(/\/upsc\/geography\/talk\?day=7/, { timeout: 15000 });
  checks.push({ label: "day7-watch-to-talk-handoff", url: page.url() });
  await assertNoOverflow(page, "day7-consolidation-talk-desktop", checks);

  await page.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    current["7"] = {
      ...(current["7"] || {}),
      day: 7,
      watched: true,
      watchState: "Watched",
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      talkVerdict: "Optional Earth Layers visual review available.",
      confidence: "Command",
      reflection: "Location, tectonics, landforms, climate, and ocean systems are connected.",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(current));
  }, progressKey);

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=earth-layers&day=7`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day7-consolidation-visual").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofDraft = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofDraft.includes("Physical Geography Consolidation") || !proofDraft.includes("Earth Layers Lab")) {
    throw new Error(`Day 7 lab prompt did not preserve the optional visual context: ${proofDraft}`);
  }
  checks.push({ label: "day7-earth-layers-proof-starter", proofDraft });
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=7/, { timeout: 15000 });
  const savedProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["7"], progressKey);
  checks.push({ label: "day7-earth-layers-proof-save", savedProgress });
  if (savedProgress?.labCompleted !== true || savedProgress?.labMode !== "earth-layers") {
    throw new Error(`Day 7 optional Earth Layers proof did not persist: ${JSON.stringify(savedProgress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=earth-layers&day=7`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day7-consolidation-visual").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day7-earth-layers-lab-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
