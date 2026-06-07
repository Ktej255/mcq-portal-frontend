const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-visual-lab-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];
const allowedPageErrorFragments = ["Invalid or unexpected token"];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  async function seedTalkClearance(page, day) {
    await page.addInitScript(
      ({ key, studentProfileKey, selectedDay }) => {
        window.MOCK_TOKEN = "MOCK_TOKEN_MASTER";
        window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER");
        window.localStorage.setItem(
          studentProfileKey,
          JSON.stringify({
            level: "advanced",
            preparationStage: "attempted-prelims",
            studyWindow: "120",
            learningStyle: "mixed",
            weakSignal: "retention",
            studyTime: "morning",
            attemptHistory: "multiple-attempts",
            learningPattern: "deep-work",
            mindState: "calm",
            updatedAt: new Date().toISOString(),
          })
        );
        const current = JSON.parse(window.localStorage.getItem(key) || "{}");
        current[String(selectedDay)] = {
          day: selectedDay,
          watched: true,
          watchState: "Watched",
          confidence: "Command",
          reflection: "The topic is clear enough for a map or mechanism proof.",
          revisitQueued: false,
          talkBand: "Command",
          talkScore: 96,
          talkUnlockStage: "mcq",
          assessmentSummary: "Talk proof saved.",
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(key, JSON.stringify(current));
      },
      { key: storageKey, studentProfileKey: profileKey, selectedDay: day }
    );
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.evaluate(
      ({ key, studentProfileKey, selectedDay }) => {
        window.MOCK_TOKEN = "MOCK_TOKEN_MASTER";
        window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER");
        window.localStorage.setItem(
          studentProfileKey,
          JSON.stringify({
            level: "advanced",
            preparationStage: "attempted-prelims",
            studyWindow: "120",
            learningStyle: "mixed",
            weakSignal: "retention",
            studyTime: "morning",
            attemptHistory: "multiple-attempts",
            learningPattern: "deep-work",
            mindState: "calm",
            updatedAt: new Date().toISOString(),
          })
        );
        const current = JSON.parse(window.localStorage.getItem(key) || "{}");
        current[String(selectedDay)] = {
          day: selectedDay,
          watched: true,
          watchState: "Watched",
          confidence: "Command",
          reflection: "The topic is clear enough for a map or mechanism proof.",
          revisitQueued: false,
          talkBand: "Command",
          talkScore: 96,
          talkUnlockStage: "mcq",
          assessmentSummary: "Talk proof saved.",
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(key, JSON.stringify(current));
      },
      { key: storageKey, studentProfileKey: profileKey, selectedDay: day }
    );
  }

  async function reseedCurrentPage(page, day) {
    await page.evaluate(
      ({ key, studentProfileKey, selectedDay }) => {
        window.MOCK_TOKEN = "MOCK_TOKEN_MASTER";
        window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER");
        window.localStorage.setItem(
          studentProfileKey,
          JSON.stringify({
            level: "advanced",
            preparationStage: "attempted-prelims",
            studyWindow: "120",
            learningStyle: "mixed",
            weakSignal: "retention",
            studyTime: "morning",
            attemptHistory: "multiple-attempts",
            learningPattern: "deep-work",
            mindState: "calm",
            updatedAt: new Date().toISOString(),
          })
        );
        const current = JSON.parse(window.localStorage.getItem(key) || "{}");
        current[String(selectedDay)] = {
          day: selectedDay,
          watched: true,
          watchState: "Watched",
          confidence: "Command",
          reflection: "The topic is clear enough for a map or mechanism proof.",
          revisitQueued: false,
          talkBand: "Command",
          talkScore: 96,
          talkUnlockStage: "mcq",
          assessmentSummary: "Talk proof saved.",
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(key, JSON.stringify(current));
      },
      { key: storageKey, studentProfileKey: profileKey, selectedDay: day }
    );
  }

  async function openVisualBoard(page, viewportName, mode, day) {
    try {
      await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 30000 });
    } catch (error) {
      await reseedCurrentPage(page, day);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
      try {
        await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 30000 });
      } catch {
      const snapshot = {
        viewportName,
        mode,
        url: page.url(),
        boardCount: await page.getByTestId("lab-proof-command-board").count(),
        simpleCount: await page.getByTestId("geography-lab-simple-surface").count(),
        lockCount: await page.getByText("Visual locked", { exact: false }).count(),
        body: (await page.locator("body").innerText()).slice(0, 900),
      };
      throw new Error(`Visual Lab proof board did not mount: ${JSON.stringify(snapshot, null, 2)}\n${error.message}`);
      }
    }
    await page.getByTestId("geography-lab-visual-board").waitFor({ timeout: 15000 });
    const visualOpenBefore = await page.getByTestId("geography-lab-visual-board").evaluate((element) => element.open);
    checks.push({ viewport: viewportName, mode, selector: "[data-testid=geography-lab-visual-board]", visualOpenBefore });
    if (visualOpenBefore) {
      throw new Error("Visual board should be folded before the student chooses to open it.");
    }
    await page.getByTestId("geography-lab-visual-board").locator("summary").click();
  }

  async function checkMode(page, viewportName, day, mode, selector, expectedText) {
    const url = `${baseUrl}/upsc/geography/lab?mode=${mode}&day=${day}`;
    await seedTalkClearance(page, day);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await openVisualBoard(page, viewportName, mode, day);
    await page.getByText(expectedText, { exact: false }).first().waitFor({ timeout: 15000 });
    await page.locator(selector).first().waitFor({ timeout: 15000 });
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    const box = await page.locator(selector).first().boundingBox();
    await page.screenshot({ path: path.join(__dirname, `visual-lab-${viewportName}-${mode}.png`), fullPage: true });
    checks.push({ viewport: viewportName, mode, selector, expectedText, metrics, box });
  }

  async function saveOneLabProof(page, day, proofLine) {
    await page.getByTestId("geography-lab-proof-input").fill(proofLine);
    await page.getByTestId("geography-lab-save-proof").click();
    await page.waitForFunction(
      ({ key, selectedDay }) => {
        const dayProgress = JSON.parse(window.localStorage.getItem(key) || "{}")[String(selectedDay)];
        return Boolean(dayProgress?.labCompleted) && (dayProgress?.labProofCompletedIds?.length ?? 0) >= 5;
      },
      { key: storageKey, selectedDay: day },
      { timeout: 15000 }
    );
  }

  async function checkCompletion(page) {
    await seedTalkClearance(page, 8);
    await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=8`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByTestId("geography-lab-simple-surface").waitFor({ timeout: 15000 });
    await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
    await page.getByTestId("geography-lab-flow-strip").getByText("Optional proof", { exact: false }).waitFor({ timeout: 15000 });
    const visualOpenBefore = await page.getByTestId("geography-lab-visual-board").evaluate((element) => element.open);
    const advancedOpenBefore = await page.getByTestId("geography-lab-advanced-tools").evaluate((element) => element.open);
    checks.push({ viewport: "desktop", mode: "completion-folded-first", visualOpenBefore, advancedOpenBefore });
    if (visualOpenBefore || advancedOpenBefore) {
      throw new Error("Visual Lab should open with visual and advanced details folded.");
    }
    await saveOneLabProof(
      page,
      8,
      "India relief proof: connect region, river or relief, example, and one UPSC trap before solving MCQs."
    );
    await page.waitForURL("**/upsc/geography/mcq-readiness?day=8", { timeout: 15000 });

    const progress = await page.evaluate(
      ({ key, day }) => {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw)[String(day)] : null;
      },
      { key: storageKey, day: 8 }
    );
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));

    checks.push({ viewport: "desktop", mode: "completion", selector: "[data-testid=lab-proof-command-board]", metrics, progress });

    if (
      !progress?.labCompleted ||
      progress?.labMode !== "india-map" ||
      progress?.labProofCompletedIds?.length !== 5 ||
      progress?.labEvidenceStatus !== "mcq-ready" ||
      progress?.labNextRoute !== "/upsc/geography/mcq-readiness?day=8"
    ) {
      throw new Error(`Visual lab completion did not persist correctly: ${JSON.stringify(progress)}`);
    }

    if (metrics.hasHorizontalOverflow) {
      throw new Error(`Visual lab completion has horizontal overflow: ${JSON.stringify(metrics)}`);
    }

    await page.goto(`${baseUrl}/upsc/geography?day=8`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByText("Do this now", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText("Practice", { exact: false }).first().waitFor({ timeout: 15000 });
    const commandMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    checks.push({ viewport: "desktop", mode: "command-after-lab-proof", selector: "command-current-surface", metrics: commandMetrics });

    if (commandMetrics.hasHorizontalOverflow) {
      throw new Error(`Command page after lab proof has horizontal overflow: ${JSON.stringify(commandMetrics)}`);
    }
  }

  for (const viewport of [
    { name: "desktop", width: 1366, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const visualChecks = [
      { day: 3, mode: "earth-layers", selector: "[data-testid=day3-plate-visual]", expectedText: "Earth Layers Lab" },
      { day: 10, mode: "monsoon", selector: "[data-testid=day10-monsoon-visual]", expectedText: "Monsoon Simulator" },
      { day: 8, mode: "india-map", selector: "[data-testid=day8-india-relief-visual]", expectedText: "India Interactive Map" },
    ];

    for (const visualCheck of visualChecks) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(`[${viewport.name}] ${message.text()}`);
      });
      page.on("pageerror", (error) => pageErrors.push(`[${viewport.name}] ${error.stack || error.message}`));
      await checkMode(
        page,
        viewport.name,
        visualCheck.day,
        visualCheck.mode,
        visualCheck.selector,
        visualCheck.expectedText
      );
      await page.close();
    }

    if (viewport.name === "desktop") {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(`[${viewport.name}] ${message.text()}`);
      });
      page.on("pageerror", (error) => pageErrors.push(`[${viewport.name}] ${error.stack || error.message}`));
      await checkCompletion(page);
      await page.close();
    }
  }

  const failedOverflow = checks.filter((check) => check.metrics?.hasHorizontalOverflow);
  const missingBoxes = checks.filter((check) => "box" in check && (!check.box || check.box.width <= 0 || check.box.height <= 0));
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const blockingPageErrors = pageErrors.filter(
    (message) => !allowedPageErrorFragments.some((fragment) => message.includes(fragment))
  );

  const evidence = {
    allowedConsoleErrorFragments,
    allowedPageErrorFragments,
    baseUrl,
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    blockingPageErrors,
    passed: failedOverflow.length === 0 && missingBoxes.length === 0 && blockingConsoleErrors.length === 0 && blockingPageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
