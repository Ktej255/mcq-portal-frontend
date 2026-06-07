const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-track-diagnostics-e2e-evidence.json");
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

async function seedTrackState(page) {
  await page.evaluate(
    ({ progressKey: pKey, mcqKey: mKey }) => {
      window.localStorage.setItem(
        pKey,
        JSON.stringify({
          "2": {
            day: 2,
            watched: true,
            watchState: "Watched",
            watchMinutes: 90,
            confidence: "Working",
            updatedAt: new Date().toISOString(),
          },
          "3": {
            day: 3,
            watched: true,
            watchState: "Watched",
            watchMinutes: 90,
            confidence: "Shaky",
            reflection: "Weak explanation that needs repair.",
            revisitQueued: true,
            talkBand: "Revisit",
            talkScore: 25,
            activePromptLabel: "Explain",
            updatedAt: new Date().toISOString(),
          },
          "4": {
            day: 4,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            confidence: "Command",
            reflection: "Strong command explanation.",
            revisitQueued: false,
            talkBand: "Command",
            talkScore: 96,
            labCompleted: true,
            labMode: "india-map",
            labInsight: "Map logic saved for MCQ practice.",
            updatedAt: new Date().toISOString(),
          },
          "5": {
            day: 5,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            confidence: "Working",
            reflection: "Practice-level explanation.",
            revisitQueued: false,
            talkBand: "Practice",
            talkScore: 97,
            labCompleted: true,
            labMode: "india-map",
            labInsight: "Relief and drainage lab saved.",
            updatedAt: new Date().toISOString(),
          },
          "6": {
            day: 6,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            confidence: "Working",
            reflection: "Practice-level ocean explanation.",
            revisitQueued: false,
            talkBand: "Practice",
            talkScore: 98,
            labCompleted: true,
            labMode: "monsoon",
            labInsight: "Current and climate lab saved.",
            updatedAt: new Date().toISOString(),
          },
          "7": {
            day: 7,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            confidence: "Working",
            reflection: "Practice-level geomorphology explanation.",
            revisitQueued: false,
            talkBand: "Practice",
            talkScore: 96,
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        mKey,
        JSON.stringify({
          "GEO-D04": {
            planned: 25,
            drafted: 25,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
          "GEO-D05": {
            planned: 25,
            drafted: 5,
            difficulty: "MEDIUM",
            status: "DRAFT",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    { progressKey, mcqKey }
  );
}

async function seedCompletedDay(page) {
  await page.evaluate(
    ({ progressKey: pKey, mcqKey: mKey }) => {
      window.localStorage.setItem(
        pKey,
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["earth-system", "coordinates", "scale", "india-map", "upsc-trap"],
            confidence: "Command",
            reflection: "Earth as a system connects map proof, process, India example and UPSC traps.",
            revisitQueued: false,
            talkBand: "Command",
            talkScore: 96,
            labCompleted: true,
            labMode: "earth-layers",
            labProofCompletedIds: ["concept-lock", "map-mechanism", "india-example", "upsc-trap", "answer-hook"],
            labEvidenceAnchor: "Earth system proof",
            mcqAttempted: true,
            mcqCompleted: true,
            mcqCorrectCount: 3,
            mcqTotal: 3,
            mcqScorePercent: 100,
            mcqOutcome: "Command",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        mKey,
        JSON.stringify({
          "GEO-D01": {
            planned: 3,
            drafted: 3,
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

async function expectDay(page, day, expectedText, expectedHref) {
  const card = page.getByTestId(`track-day-${day}`);
  await card.getByText(expectedText, { exact: false }).first().waitFor({ timeout: 15000 });
  const href = await card.getAttribute("href");
  if (href !== expectedHref) {
    throw new Error(`Day ${day} expected href ${expectedHref}, got ${href}`);
  }
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_track_diagnostics");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);

  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await seedTrackState(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-focused-day").getByText("Today's task", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-learning-gap").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-next-revision").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-trend").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-one-action-rule").getByText("Use this button first", { exact: false }).waitFor({ timeout: 15000 });
  const fourSignalSurfaceVisible = await page.getByTestId("geography-track-four-signal-surface").isVisible();
  const focusedPriority = await page.getByTestId("geography-track-focused-day").getAttribute("data-signal-priority");
  const simpleSignalLinkCount = await page
    .locator(
      '[data-testid="geography-track-learning-gap"], [data-testid="geography-track-next-revision"], [data-testid="geography-track-trend"]'
    )
    .evaluateAll((elements) => elements.filter((element) => element.tagName === "A").length);
  const focusedRouteCount = await page.getByTestId("geography-track-focused-route").count();
  checks.push({ label: "track-signals-read-only", fourSignalSurfaceVisible, focusedPriority, simpleSignalLinkCount, focusedRouteCount });
  if (!fourSignalSurfaceVisible || focusedPriority !== "primary" || simpleSignalLinkCount !== 0 || focusedRouteCount !== 1) {
    throw new Error("Track first viewport should expose read-only signals and one focused route.");
  }

  const dayMapVisibleBeforeOpen = await page.getByTestId("track-day-1").isVisible();
  checks.push({ label: "track-day-map-hidden-before-open", dayMapVisibleBeforeOpen });
  if (dayMapVisibleBeforeOpen) {
    throw new Error("30-day track map should be folded on first load.");
  }

  await page.getByTestId("geography-track-path-map").locator("summary").click();
  await page.getByText("Geography sprint state", { exact: false }).first().waitFor({ timeout: 15000 });

  await expectDay(page, 1, "Talk pending", "/upsc/geography/talk?day=1");
  await expectDay(page, 2, "Talk pending", "/upsc/geography/talk?day=2");
  await expectDay(page, 3, "Revisit required", "/upsc/geography/revisit?day=3");
  await expectDay(page, 4, "Practice ready", "/upsc/geography/mcq-readiness?day=4");
  await expectDay(page, 5, "Practice is being prepared", "/upsc/geography/mcq-readiness?day=5");
  await expectDay(page, 6, "Practice is being prepared", "/upsc/geography/mcq-readiness?day=6");
  await expectDay(page, 7, "Practice is being prepared", "/upsc/geography/mcq-readiness?day=7");
  const futureDayCard = page.getByTestId("track-day-8");
  const futureDayState = await futureDayCard.getAttribute("data-day-state");
  const futureDayHref = await futureDayCard.getAttribute("href");
  checks.push({ label: "track-future-day-card-locked", futureDayState, futureDayHref });
  if (futureDayState !== "locked" || futureDayHref !== null) {
    throw new Error(`Untouched future Track day should stay locked, got state ${futureDayState} and href ${futureDayHref}.`);
  }
  await page.getByText("Talk passed", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Lab completed", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Blocked days", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-diagnostics-desktop", checks);

  await page.getByTestId("geography-track-advanced-tools").locator("summary").click();
  const futureDetailCard = page.getByTestId("track-day-detail-8");
  const futureDetailState = await futureDetailCard.getAttribute("data-day-state");
  const futureDetailHref = await futureDetailCard.getAttribute("href");
  const redundantDaySwitcherCount = await page.getByTestId("loop-day-controls").count();
  checks.push({
    label: "track-advanced-future-day-card-locked",
    futureDetailState,
    futureDetailHref,
    redundantDaySwitcherCount,
  });
  if (futureDetailState !== "locked" || futureDetailHref !== null || redundantDaySwitcherCount !== 0) {
    throw new Error("Advanced Track diagnostics should lock untouched future days and omit the redundant day switcher.");
  }
  await assertNoOverflow(page, "track-advanced-diagnostics-desktop", checks);

  await page.getByTestId("track-day-3").click();
  await page.waitForURL("**/upsc/geography/revisit?day=3", { timeout: 15000 });
  await page.getByText("Write one repair note", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-day-3-routes-revisit", checks);

  await seedCompletedDay(page);
  await page.goto(`${baseUrl}/upsc/geography/track?day=1`, { waitUntil: "networkidle" });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-focused-day").getByText("Day 1", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-focused-day").getByText("Start Day 2", { exact: false }).waitFor({ timeout: 15000 });
  const revisitActionCount = await page.getByTestId("geography-track-recovery-route").count();
  if (revisitActionCount !== 0) {
    throw new Error(`Completed command day should not show recovery action, got ${revisitActionCount}.`);
  }
  await assertNoOverflow(page, "track-completed-day-closeout", checks);
  const pilotHref = await page.getByTestId("geography-track-focused-route").getAttribute("href");
  checks.push({ label: "track-completed-day-next-href", pilotHref });
  if (pilotHref !== "/upsc/geography/talk?day=2") {
    throw new Error(`Expected completed day next-topic href, got ${pilotHref}`);
  }
  await page.getByTestId("geography-track-focused-route").click();
  await page.waitForURL("**/upsc/geography/talk?day=2", { timeout: 45000, waitUntil: "domcontentloaded" });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-focused-day").getByText("Today's task", { exact: false }).waitFor({ timeout: 15000 });
  const dayMapVisibleMobileBeforeOpen = await page.getByTestId("track-day-1").isVisible();
  checks.push({ label: "track-day-map-hidden-before-open-mobile", dayMapVisibleMobileBeforeOpen });
  if (dayMapVisibleMobileBeforeOpen) {
    throw new Error("30-day track map should stay folded on mobile first load.");
  }
  await assertNoOverflow(page, "track-diagnostics-mobile", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-track-diagnostics-final.png"), fullPage: true });

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
