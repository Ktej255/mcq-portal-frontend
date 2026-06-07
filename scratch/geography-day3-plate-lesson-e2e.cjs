const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-day3-plate-lesson-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day3-plate-lesson-final.png");
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
  await page.getByTestId(`day3-plate-stage-${stage}`).first().click();
  const activeStage = await page.getByTestId("day3-plate-visual").first().getAttribute("data-active-stage");
  checks.push({ label: `day3-visual-stage-${stage}`, activeStage });
  if (activeStage !== stage) throw new Error(`Expected active Day 3 stage ${stage}, received ${activeStage}`);
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_day3_plate_lesson");
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

  await page.goto(`${baseUrl}/upsc/geography/watch?day=3`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Interior of Earth and Plate Movement", { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-duration").getByText("12 min topic", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("day3-plate-visual").waitFor({ timeout: 15000 });

  const initialStage = await page.getByTestId("day3-plate-visual").getAttribute("data-active-stage");
  checks.push({ label: "day3-visual-initial-stage", initialStage });
  if (initialStage !== "evidence") throw new Error(`Expected evidence initial stage, received ${initialStage}`);

  await page
    .getByText("Trap: S-waves cannot pass through liquids; P-waves can pass through solids and liquids.", { exact: true })
    .waitFor({ timeout: 15000 });
  await assertStage(page, "layers", checks);
  await assertStage(page, "convection", checks);
  const convectionProgressBeforePlay = await page.getByTestId("day3-continuous-convection-motion").first().getAttribute("data-motion-progress");
  await page.getByTitle("Play animation").first().click();
  await page.waitForTimeout(260);
  const convectionProgressWhilePlaying = await page.getByTestId("day3-continuous-convection-motion").first().getAttribute("data-motion-progress");
  await page.getByTitle("Pause animation").first().click();
  if (convectionProgressBeforePlay === convectionProgressWhilePlaying) {
    throw new Error(`Expected continuous Day 3 convection motion while playing: ${convectionProgressBeforePlay}`);
  }
  checks.push({
    label: "day3-learner-continuous-convection-motion",
    motionProgressBeforePlay: convectionProgressBeforePlay,
    motionProgressWhilePlaying: convectionProgressWhilePlaying,
  });
  await assertStage(page, "boundaries", checks);
  await assertStage(page, "hazards", checks);
  await page
    .getByText("Recall chain: seismic evidence -> layers -> mantle behavior -> boundaries -> landforms and hazards.", {
      exact: true,
    })
    .waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day3-plate-watch-desktop", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(/\/upsc\/geography\/talk\?day=3/, { timeout: 15000 });
  checks.push({ label: "day3-watch-to-talk-handoff", url: page.url() });
  await assertNoOverflow(page, "day3-plate-talk-desktop", checks);

  await page.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    current["3"] = {
      ...(current["3"] || {}),
      day: 3,
      watched: true,
      watchState: "Watched",
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      talkVerdict: "Optional Earth Layers visual review available.",
      confidence: "Command",
      reflection: "Seismic waves reveal layers, mantle behavior supports plate movement, and boundaries organize hazards.",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(current));
  }, progressKey);

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=earth-layers&day=3`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day3-plate-visual").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofDraft = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofDraft.includes("Interior of Earth and Plate Movement") || !proofDraft.includes("Earth Layers Lab")) {
    throw new Error(`Day 3 lab prompt did not preserve the optional visual context: ${proofDraft}`);
  }
  checks.push({ label: "day3-earth-layers-proof-starter", proofDraft });
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=3/, { timeout: 15000 });
  const savedProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["3"], progressKey);
  checks.push({ label: "day3-earth-layers-proof-save", savedProgress });
  if (savedProgress?.labCompleted !== true || savedProgress?.labMode !== "earth-layers") {
    throw new Error(`Day 3 optional Earth Layers proof did not persist: ${JSON.stringify(savedProgress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=earth-layers&day=3`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day3-plate-visual").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day3-earth-layers-lab-mobile", checks);
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
