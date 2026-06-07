const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-day1-map-relationship-lab-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day1-map-relationship-lab-mobile.png");

async function openVisualBoard(page) {
  const visualBoard = page.getByTestId("geography-lab-visual-board");
  await visualBoard.waitFor({ timeout: 15000 });
  const openBefore = await visualBoard.evaluate((element) => element.open);
  if (!openBefore) {
    await visualBoard.locator("summary").click();
  }
  return openBefore;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(({ geographyProgressKey, studentProfileKey }) => {
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_day1_map_relationship_lab");
    localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "guided",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
    localStorage.setItem(
      geographyProgressKey,
      JSON.stringify({
        "1": {
          day: 1,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
          talkScore: 96,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          talkVerdict: "Map proof optional.",
          confidence: "Command",
          reflection: "Geographic thinking and map relationships are clear.",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, { geographyProgressKey: progressKey, studentProfileKey: profileKey });

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=1`, { waitUntil: "networkidle", timeout: 45000 });
  const desktopVisualOpenBefore = await openVisualBoard(page);
  await page.getByTestId("day1-map-relationship-drill").waitFor({ timeout: 15000 }).catch(async (error) => {
    throw new Error(`${error.message}\nURL: ${page.url()}\nBODY:\n${await page.locator("body").innerText()}`);
  });
  await page.getByTestId("day1-map-drill-shipki-sutlej").click();
  const proofDraft = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofDraft.includes("Shipki La") || !proofDraft.includes("Sutlej enters India") || !proofDraft.includes("Sikkim pass")) {
    throw new Error(`Day 1 relationship prompt mismatch: ${proofDraft}`);
  }

  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForURL("**/upsc/geography/mcq-readiness?day=1", { timeout: 15000 });
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["1"], progressKey);
  if (
    progress?.labCompleted !== true ||
    progress?.labMode !== "india-map" ||
    progress?.labAtlasLayer !== "Pass to state to river" ||
    progress?.labAtlasPoint !== "Shipki La -> Himachal Pradesh -> Sutlej enters India" ||
    progress?.labProofCompletedIds?.length !== 5 ||
    progress?.labNextRoute !== "/upsc/geography/mcq-readiness?day=1"
  ) {
    throw new Error(`Day 1 relationship proof did not persist: ${JSON.stringify(progress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=1`, { waitUntil: "networkidle", timeout: 45000 });
  const mobileVisualOpenBefore = await openVisualBoard(page);
  await page.getByTestId("day1-map-relationship-drill").waitFor({ timeout: 15000 });
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  if (metrics.hasHorizontalOverflow) throw new Error(`Day 1 map lab mobile overflow: ${JSON.stringify(metrics)}`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const evidence = {
    baseUrl,
    checks: { desktopVisualOpenBefore, mobileVisualOpenBefore, proofDraft, progress, metrics },
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
