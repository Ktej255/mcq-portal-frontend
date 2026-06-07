const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-talk-recall-meter-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-talk-recall-meter-mobile.png");
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

async function seedBeginnerWithWatchedLesson(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey }) => {
      const token = "MOCK_TOKEN_geography_talk_recall_meter";
      window.MOCK_TOKEN = token;
      window.localStorage.setItem("MOCK_TOKEN", token);
      window.localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "no-attempt",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        }),
      );
      window.localStorage.setItem(
        geographyProgressKey,
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchMinutes: 12,
            watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
            watchHandoffReady: true,
            watchHandoffSummary:
              "Concept: Geographic thinking and map relationships. Mechanism: location, site, situation, and scale explain India spatially. UPSC trap: avoid isolated-location memorization.",
            updatedAt: new Date().toISOString(),
          },
        }),
      );
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey },
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

  await seedBeginnerWithWatchedLesson(page);
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });

  const loopStripText = await page.getByTestId("talk-recall-loop-strip").innerText();
  const initialMeterText = await page.getByTestId("talk-recall-target-meter").innerText();
  const initialActionText = await page.getByTestId("talk-assess-answer").innerText();
  checks.push({ label: "initial-recall-loop", loopStripText, initialMeterText, initialActionText });
  for (const expected of ["Explain lesson", "AI check", "Repair", "MCQ"]) {
    if (!loopStripText.includes(expected)) throw new Error(`Recall loop is missing ${expected}: ${loopStripText}`);
  }
  if (!initialMeterText.includes("95%") || !initialMeterText.includes("Answer once to measure recall.")) {
    throw new Error(`Initial recall meter mismatch: ${initialMeterText}`);
  }
  if (!initialActionText.includes("Send to AI teacher")) {
    throw new Error(`Talk action should be simple teacher handoff: ${initialActionText}`);
  }
  await assertNoOverflow(page, "talk-initial-desktop", checks);

  await page.getByTestId("talk-answer-draft").fill(
    [
      "Geographic thinking uses location, scale, site and situation.",
      "Because location affects relationships across India, a map example such as a coast matters.",
      "UPSC trap: not every isolated statement is identical.",
    ].join(" "),
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-teacher-follow-up").waitFor({ timeout: 15000 });
  const repairMeterText = await page.getByTestId("talk-recall-target-meter").innerText();
  const routeVisibleDuringRepair = await page.getByTestId("talk-route-gate").isVisible().catch(() => false);
  const repairProgress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["1"], progressKey);
  checks.push({ label: "repair-state", repairMeterText, routeVisibleDuringRepair, repairProgress });
  if (!/more recall needed/i.test(repairMeterText)) {
    throw new Error(`Recall meter should show the remaining gap after weak answer: ${repairMeterText}`);
  }
  if (routeVisibleDuringRepair) {
    throw new Error("MCQ route should stay hidden while the teacher repair answer is pending.");
  }
  if (
    repairProgress?.revisitQueued === true ||
    repairProgress?.talkDiscussionStep !== "challenge" ||
    repairProgress?.talkTeacherStatus !== "answer-required"
  ) {
    throw new Error(`Repairable Talk answer should stay in the 95% discussion loop: ${JSON.stringify(repairProgress, null, 2)}`);
  }

  await page.getByTestId("talk-challenge-response").fill(
    [
      "Geographic thinking asks what, where, why, and why here rather than memorizing an isolated location.",
      "Absolute and relative location, site and situation, scale, and map relationships explain India spatially.",
      "Because location and scale change the relationship, the effect changes across a region.",
      "For example, an India map relationship between a river, coast, plateau, pass, or neighboring state proves why the place matters.",
      "UPSC trap: never assume every statement is identical or that only one isolated location proves the answer; check the exception.",
    ].join(" "),
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-primary-route").getByText("Open MCQ", { exact: false }).waitFor({ timeout: 15000 });
  const finalMeterText = await page.getByTestId("talk-recall-target-meter").innerText();
  const finalRouteHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  const progress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["1"], progressKey);
  checks.push({ label: "mcq-unlock-state", finalMeterText, finalRouteHref, progress });
  if (!finalMeterText.includes("MCQ can open now.")) {
    throw new Error(`Recall meter should show MCQ unlock after repair: ${finalMeterText}`);
  }
  if (finalRouteHref !== "/upsc/geography/mcq-readiness?day=1") {
    throw new Error(`Final Talk route mismatch: ${finalRouteHref}`);
  }
  if (
    typeof progress?.talkScore !== "number" ||
    progress.talkScore < 95 ||
    progress?.talkTeacherStatus !== "mcq-ready" ||
    progress?.talkNextRoute !== "/upsc/geography/mcq-readiness?day=1"
  ) {
    throw new Error(`Talk progress did not persist MCQ readiness: ${JSON.stringify(progress, null, 2)}`);
  }
  await assertNoOverflow(page, "talk-mcq-ready-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-primary-route").getByText("Open MCQ", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-recall-target-meter").getByText("MCQ can open now.", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-mcq-ready-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
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
  console.error(error.stack || error.message);
  process.exit(1);
});
