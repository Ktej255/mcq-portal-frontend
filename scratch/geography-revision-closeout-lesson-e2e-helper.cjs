const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
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

async function runCloseoutLesson(config) {
  const evidencePath = path.join(__dirname, `${config.fileSlug}-e2e-evidence.json`);
  const screenshotPath = path.join(__dirname, `${config.fileSlug}-final.png`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(({ studentProfileKey, mockToken }) => {
    window.localStorage.setItem("MOCK_TOKEN", mockToken);
    window.localStorage.setItem(studentProfileKey, JSON.stringify({
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
    }));
  }, { studentProfileKey: profileKey, mockToken: `MOCK_TOKEN_MASTER_geography_day${config.day}_${config.fileSlug}` });

  await page.goto(`${baseUrl}/upsc/geography/watch?day=${config.day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText(config.title, { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-duration").getByText("12 min topic", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId(config.visualTestId).waitFor({ timeout: 15000 });
  const initialStage = await page.getByTestId(config.visualTestId).getAttribute("data-active-stage");
  checks.push({ label: `day${config.day}-visual-initial-stage`, initialStage });
  if (initialStage !== config.initialStage) throw new Error(`Expected ${config.initialStage} initial stage, received ${initialStage}`);

  await page.getByText(config.initialProof, { exact: true }).waitFor({ timeout: 15000 });
  for (const stage of config.clickStages) {
    await page.getByTestId(`${config.stagePrefix}-${stage}`).click();
    const activeStage = await page.getByTestId(config.visualTestId).getAttribute("data-active-stage");
    checks.push({ label: `day${config.day}-visual-stage-${stage}`, activeStage });
    if (activeStage !== stage) throw new Error(`Expected active Day ${config.day} stage ${stage}, received ${activeStage}`);
  }
  await page.getByText(config.recapProof, { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, `day${config.day}-${config.fileSlug}-watch-desktop`, checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(new RegExp(`/upsc/geography/talk\\?day=${config.day}`), { timeout: 15000 });
  checks.push({ label: `day${config.day}-watch-to-talk-handoff`, url: page.url() });
  await assertNoOverflow(page, `day${config.day}-${config.fileSlug}-talk-desktop`, checks);

  await page.evaluate(({ key, day, labTitle, reflection }) => {
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    current[String(day)] = {
      ...(current[String(day)] || {}),
      day,
      watched: true,
      watchState: "Watched",
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      talkVerdict: `Optional ${labTitle} review available.`,
      confidence: "Command",
      reflection,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(current));
  }, { key: progressKey, day: config.day, labTitle: config.labTitle, reflection: config.reflection });

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=${config.labMode}&day=${config.day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId(config.visualTestId).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofDraft = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofDraft.includes(config.title) || !proofDraft.includes(config.labTitle)) throw new Error(`Day ${config.day} lab prompt lost visual context: ${proofDraft}`);
  checks.push({ label: `day${config.day}-${config.labMode}-proof-starter`, proofDraft });
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForURL(new RegExp(`/upsc/geography/mcq-readiness\\?day=${config.day}`), { timeout: 15000 });
  const savedProgress = await page.evaluate(({ key, day }) => JSON.parse(localStorage.getItem(key) || "{}")[String(day)], { key: progressKey, day: config.day });
  checks.push({ label: `day${config.day}-${config.labMode}-proof-save`, savedProgress });
  if (savedProgress?.labCompleted !== true || savedProgress?.labMode !== config.labMode) throw new Error(`Day ${config.day} optional proof did not persist: ${JSON.stringify(savedProgress, null, 2)}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=${config.labMode}&day=${config.day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId(config.visualTestId).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, `day${config.day}-${config.labMode}-lab-mobile`, checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter((message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)));
  const evidence = { allowedConsoleErrorFragments, baseUrl, checks, consoleErrors, blockingConsoleErrors, pageErrors, passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0 };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

module.exports = { runCloseoutLesson };
