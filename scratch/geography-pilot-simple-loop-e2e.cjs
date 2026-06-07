const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const feedbackKey = "sarit-upsc-geography-pilot-feedback-v1";
const releaseKey = "sarit-upsc-geography-pilot-release-v1";
const checkInKey = "sarit-upsc-geography-pilot-check-in-v1";
const rosterKey = "sarit-upsc-geography-pilot-roster-v1";
const evidencePath = path.join(__dirname, "geography-pilot-simple-loop-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-pilot-simple-loop-mobile.png");
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

async function seedPilot(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileKey, progressKey, feedbackKey, releaseKey, checkInKey, rosterKey }) => {
      const now = new Date().toISOString();
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_simple_loop");
      window.localStorage.setItem(
        profileKey,
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
          updatedAt: now,
        }),
      );
      window.localStorage.removeItem(progressKey);
      window.localStorage.removeItem(feedbackKey);
      window.localStorage.setItem(
        releaseKey,
        JSON.stringify({
          status: "approved",
          reviewerName: "Founder QA",
          note: "Approved for simple-loop browser proof.",
          maxTesters: 3,
          testWindow: "25-35 minutes",
          updatedAt: now,
        }),
      );
      window.localStorage.setItem(
        rosterKey,
        JSON.stringify([
          {
            id: "simple-loop-tester",
            name: "Simple Loop Tester",
            contact: "Local Batch A",
            inviteCode: "GEO-SIMPLE-01",
            status: "invited",
            note: "Simple learner-loop proof.",
            createdAt: now,
            updatedAt: now,
          },
        ]),
      );
      window.localStorage.setItem(
        checkInKey,
        JSON.stringify({
          testerName: "Simple Loop Tester",
          contact: "Local Batch A",
          inviteCode: "GEO-SIMPLE-01",
          checkedInAt: now,
        }),
      );
    },
    { profileKey, progressKey, feedbackKey, releaseKey, checkInKey, rosterKey },
  );
}

async function assertSimplePath(page, checks, label) {
  await page.getByTestId("geography-student-pilot-room").waitFor({ timeout: 15000 });
  const path = page.getByTestId("geography-student-pilot-gates");
  const stepCount = await path.locator('[data-testid^="geography-student-pilot-step-"]').count();
  const jumpLinkCount = await path.getByRole("link").count();
  const bodyText = await path.innerText();
  const optionalVisualHref = await page.getByTestId("geography-student-pilot-optional-visual").getAttribute("href");
  checks.push({ label, stepCount, jumpLinkCount, bodyText, optionalVisualHref });
  if (stepCount !== 3) throw new Error(`${label}: expected 3 orientation steps, got ${stepCount}`);
  if (jumpLinkCount !== 0) throw new Error(`${label}: primary path exposed ${jumpLinkCount} jump links`);
  if (!bodyText.includes("Step 1: Learn") || !bodyText.includes("Step 2: Discuss") || !bodyText.includes("Step 3: MCQ")) {
    throw new Error(`${label}: primary path is not Learn -> Discuss -> MCQ: ${bodyText}`);
  }
  if (/Visual Lab|Track|Revisit/.test(bodyText)) {
    throw new Error(`${label}: optional surfaces leaked into the primary path: ${bodyText}`);
  }
  if (optionalVisualHref !== "/upsc/geography/lab?mode=india-map&day=1") {
    throw new Error(`${label}: optional visual support points to ${optionalVisualHref}`);
  }
}

async function setProgress(page, progress) {
  await page.evaluate(
    ({ progressKey, progress }) => window.localStorage.setItem(progressKey, JSON.stringify(progress)),
    { progressKey, progress },
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

  await seedPilot(page);
  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await assertSimplePath(page, checks, "zero-progress-simple-path");
  await page.getByTestId("geography-student-pilot-current-action").getByText("Start lesson", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "zero-progress-desktop", checks);

  await setProgress(page, {
    1: {
      day: 1,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["scene-1", "scene-2", "scene-3", "scene-4", "scene-5"],
      watchHandoffReady: true,
      updatedAt: new Date().toISOString(),
    },
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Continue discussion", { exact: false }).waitFor({ timeout: 15000 });

  await setProgress(page, {
    1: {
      day: 1,
      watched: true,
      watchState: "Watched",
      watchSceneCompletedIds: ["scene-1", "scene-2", "scene-3", "scene-4", "scene-5"],
      watchHandoffReady: true,
      talkScore: 96,
      talkBand: "Command",
      talkNextRoute: "/upsc/geography/mcq-readiness?day=1",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Open MCQ practice", { exact: false }).waitFor({ timeout: 15000 });
  const mcqHref = await page.getByTestId("geography-student-pilot-start").getAttribute("href");
  checks.push({ label: "discussion-clears-direct-to-mcq", mcqHref });
  if (mcqHref !== "/upsc/geography/mcq-readiness?day=1") {
    throw new Error(`Discussion did not clear directly to MCQ: ${mcqHref}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await assertSimplePath(page, checks, "mobile-simple-path");
  await assertNoOverflow(page, "simple-path-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  const evidence = {
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
