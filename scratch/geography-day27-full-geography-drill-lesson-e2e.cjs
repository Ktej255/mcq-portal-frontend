const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-day27-full-geography-drill-lesson-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day27-full-geography-drill-lesson-final.png");
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
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
}

async function assertStage(page, stage, checks) {
  await page.getByTestId(`day27-full-geography-drill-stage-${stage}`).first().click();
  const activeStage = await page.getByTestId("day27-full-geography-drill-visual").first().getAttribute("data-active-stage");
  checks.push({ label: `day27-visual-stage-${stage}`, activeStage });
  if (activeStage !== stage) throw new Error(`Expected active Day 27 stage ${stage}, received ${activeStage}`);
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_day27_full_geography_drill");
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

  await page.goto(`${baseUrl}/upsc/geography/watch?day=27`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Full Geography Drill", { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-duration").getByText("12 min topic", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("day27-full-geography-drill-visual").waitFor({ timeout: 15000 });

  const initialStage = await page.getByTestId("day27-full-geography-drill-visual").getAttribute("data-active-stage");
  checks.push({ label: "day27-visual-initial-stage", initialStage });
  if (initialStage !== "physical") throw new Error(`Expected physical initial stage, received ${initialStage}`);

  await page.getByText("Physical base: process -> location -> consequence.", { exact: true }).waitFor({ timeout: 15000 });
  await assertStage(page, "india", checks);
  await assertStage(page, "human", checks);
  await assertStage(page, "bridges", checks);
  await assertStage(page, "repair", checks);
  await page.getByText("Recall chain: classify -> connect -> locate -> repair -> retest.", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day27-full-geography-drill-watch-desktop", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(/\/upsc\/geography\/talk\?day=27/, { timeout: 15000 });
  checks.push({ label: "day27-watch-to-talk-handoff", url: page.url() });
  await assertNoOverflow(page, "day27-full-geography-drill-talk-desktop", checks);

  await page.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    current["27"] = {
      ...(current["27"] || {}),
      day: 27,
      watched: true,
      watchState: "Watched",
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      talkVerdict: "Optional MCQ Engine review available.",
      confidence: "Command",
      reflection: "Physical, India, human, environment, disaster, and weak-area repair logic are connected.",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(current));
  }, progressKey);

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=mcq-engine&day=27`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day27-full-geography-drill-visual").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofDraft = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofDraft.includes("Full Geography Drill") || !proofDraft.includes("MCQ Engine")) {
    throw new Error(`Day 27 lab prompt did not preserve the optional visual context: ${proofDraft}`);
  }
  checks.push({ label: "day27-mcq-engine-proof-starter", proofDraft });
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=27/, { timeout: 15000 });
  const savedProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["27"], progressKey);
  checks.push({ label: "day27-mcq-engine-proof-save", savedProgress });
  if (savedProgress?.labCompleted !== true || savedProgress?.labMode !== "mcq-engine") {
    throw new Error(`Day 27 optional MCQ Engine proof did not persist: ${JSON.stringify(savedProgress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=mcq-engine&day=27`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day27-full-geography-drill-visual").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day27-mcq-engine-lab-mobile", checks);
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
