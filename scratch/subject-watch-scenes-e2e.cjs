const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-watch-scenes-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-watch-scenes-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];
const profileKey = "sarit-upsc-student-profile-v1";
const profile = {
  level: "advanced",
  studyWindow: "120",
  learningStyle: "mixed",
  weakSignal: "retention",
  studyTime: "morning",
  updatedAt: new Date().toISOString(),
};

function storageKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  async function verifyEnvironmentScenes(viewportName, viewport) {
    const page = await browser.newPage({ viewport });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${viewportName}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${viewportName}] ${error.message}`));
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_watch_scenes");
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key: profileKey, value: profile }
    );

    await page.goto(`${baseUrl}/upsc/environment/watch?day=4`, { waitUntil: "domcontentloaded" });
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey("environment"));
    await page.evaluate(
      ({ key }) =>
        window.localStorage.setItem(
          key,
          JSON.stringify({
            "4": {
              day: 4,
              reflection:
                "Climate change links forcing, feedback, monsoon impact, adaptation, mitigation and one UPSC statement trap.",
              talkScore: 76,
              talkBand: "Practice",
              talkUnlockStage: "lab",
            },
          })
        ),
      { key: storageKey("environment") }
    );
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByTestId("subject-watch-simple-repair").getByText("Repair class", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-watch-simple-repair").getByText("Your recall is saved at 76%", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("subject-watch-topic-player").waitFor({ timeout: 15000 });
    await page.getByTestId("subject-watch-scene-engine").waitFor({ timeout: 15000 });
    const simpleState = await page.evaluate(() => ({
      baselineOpen: Boolean(document.querySelector('[data-testid="subject-baseline-check"]')?.open),
      baselineDraftVisible:
        (document.querySelector('[data-testid="subject-baseline-draft"]')?.getClientRects().length ?? 0) > 0,
      baselineDraftCount: document.querySelectorAll('[data-testid="subject-baseline-draft"]').length,
      baselineSaveCount: document.querySelectorAll('[data-testid="subject-save-baseline"]').length,
      baselineReadonlyPresent: Boolean(document.querySelector('[data-testid="subject-baseline-readonly"]')),
      classPlayerPresent: Boolean(document.querySelector('[data-testid="subject-watch-visual-surface"]')),
      topicPlayerHeight: document.querySelector('[data-testid="subject-watch-topic-player"]')?.getBoundingClientRect().height ?? 0,
      playerFlowText: document.querySelector('[data-testid="subject-watch-player-flow"]')?.textContent || "",
      playerNextStepText: document.querySelector('[data-testid="subject-watch-player-next-step"]')?.textContent || "",
      primaryBeforeOptional:
        (document.querySelector('[data-testid="subject-watch-visual-surface"]')?.getBoundingClientRect().top ?? 9999) <
          (document.querySelector('[data-testid="subject-baseline-check"]')?.getBoundingClientRect().top ?? -1) &&
        (document.querySelector('[data-testid="subject-watch-visual-surface"]')?.getBoundingClientRect().top ?? 9999) <
          (document.querySelector('[data-testid="subject-watch-scene-engine"]')?.getBoundingClientRect().top ?? -1) &&
        (document.querySelector('[data-testid="subject-watch-visual-surface"]')?.getBoundingClientRect().top ?? 9999) <
          (document.querySelector('[data-testid="subject-watch-details"]')?.getBoundingClientRect().top ?? -1),
      playerCompletionActions: document.querySelectorAll('[data-testid="watch-complete-and-discuss"][data-action-location="player"]').length,
      playDemoVisible: Array.from(document.querySelector('[data-testid="subject-watch-visual-surface"]')?.querySelectorAll("button") ?? []).some(
        (button) => /Play demo/i.test(button.textContent || "") && button.getClientRects().length > 0
      ),
      sceneEngineOpen: Boolean(document.querySelector('[data-testid="subject-watch-scene-engine"]')?.open),
      sceneListOpen: Boolean(document.querySelector('[data-testid="subject-watch-scene-list"]')?.open),
      advancedOpen: Boolean(document.querySelector('[data-testid="subject-watch-details"]')?.open),
    }));
    if (
      simpleState.baselineOpen ||
      simpleState.baselineDraftVisible ||
      simpleState.baselineDraftCount !== 0 ||
      simpleState.baselineSaveCount !== 0 ||
      !simpleState.baselineReadonlyPresent ||
      simpleState.sceneEngineOpen ||
      simpleState.sceneListOpen ||
      simpleState.advancedOpen ||
      !simpleState.classPlayerPresent ||
      simpleState.topicPlayerHeight < 520 ||
      !/10-15 min lesson/i.test(simpleState.playerFlowText) ||
      !/AI discussion/i.test(simpleState.playerFlowText) ||
      !/95% recall/i.test(simpleState.playerFlowText) ||
      !/Next opens automatically/i.test(simpleState.playerNextStepText) ||
      !simpleState.primaryBeforeOptional ||
      simpleState.playerCompletionActions !== 1 ||
      !simpleState.playDemoVisible
    ) {
      throw new Error(`${viewportName} Watch player should be primary while optional controls stay folded: ${JSON.stringify(simpleState)}`);
    }
    const sceneEngine = page.getByTestId("subject-watch-scene-engine");
    await page.locator('[data-testid="subject-watch-scene-engine"] > summary').click();
    await page.getByTestId("subject-watch-scene-list").waitFor({ timeout: 15000 });
    await sceneEngine.getByText("1. Environment frame", { exact: false }).waitFor({ timeout: 15000 });

    await page.getByTestId("subject-watch-scene-complete").click();
    await sceneEngine.getByText("2. Cause chain", { exact: false }).waitFor({ timeout: 15000 });

    for (let i = 0; i < 4; i += 1) {
      await page.getByTestId("subject-watch-scene-complete").click();
    }

    await sceneEngine.getByText("5/5 complete", { exact: false }).waitFor({ timeout: 15000 });
    const progress = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)["4"] : null;
    }, storageKey("environment"));
    const pageMetrics = await metrics(page);
    if (viewportName === "desktop") await page.screenshot({ path: screenshotPath, fullPage: true });

    checks.push({ viewport: viewportName, route: "environment-watch", progress, metrics: pageMetrics });

    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Environment Watch has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }
    if (!progress?.watched || progress?.watchState !== "Watched" || progress?.watchSceneCompletedIds?.length !== 5) {
      throw new Error(`Environment Watch scene progress did not persist correctly: ${JSON.stringify(progress)}`);
    }

    await page.close();
  }

  async function verifySecondSubject() {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[economy] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[economy] ${error.message}`));
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_watch_scenes");
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key: profileKey, value: profile }
    );

    await page.goto(`${baseUrl}/upsc/economy/watch?day=2`, { waitUntil: "domcontentloaded" });
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey("economy"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("subject-watch-flow-gate").getByText("Explain before watching", { exact: false }).waitFor({ timeout: 15000 });
    const simpleState = await page.evaluate(() => ({
      baselineOpen: Boolean(document.querySelector('[data-testid="subject-baseline-check"]')?.open),
      baselineDraftVisible:
        (document.querySelector('[data-testid="subject-baseline-draft"]')?.getClientRects().length ?? 0) > 0,
      baselineDraftCount: document.querySelectorAll('[data-testid="subject-baseline-draft"]').length,
      baselineSaveCount: document.querySelectorAll('[data-testid="subject-save-baseline"]').length,
      classPlayerPresent: Boolean(document.querySelector('[data-testid="subject-watch-visual-surface"]')),
      sceneEnginePresent: Boolean(document.querySelector('[data-testid="subject-watch-scene-engine"]')),
      advancedPresent: Boolean(document.querySelector('[data-testid="subject-watch-details"]')),
    }));
    if (
      simpleState.baselineOpen ||
      simpleState.baselineDraftVisible ||
      simpleState.baselineDraftCount !== 0 ||
      simpleState.baselineSaveCount !== 0 ||
      simpleState.classPlayerPresent ||
      simpleState.sceneEnginePresent ||
      simpleState.advancedPresent
    ) {
      throw new Error(`Economy Watch should gate repair content until recall exists: ${JSON.stringify(simpleState)}`);
    }
    const recallHref = await page.getByTestId("subject-watch-flow-gate-action").getAttribute("href");
    if (recallHref !== "/upsc/economy/talk?day=2") {
      throw new Error(`Economy Watch should route to recall first, got ${recallHref}`);
    }
    const pageMetrics = await metrics(page);
    checks.push({ viewport: "desktop", route: "economy-watch-recall-gate", simpleState, recallHref, metrics: pageMetrics });
    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Economy Watch has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }

    await page.close();
  }

  await verifyEnvironmentScenes("desktop", { width: 1366, height: 900 });
  await verifyEnvironmentScenes("mobile", { width: 390, height: 844 });
  await verifySecondSubject();

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
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

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
