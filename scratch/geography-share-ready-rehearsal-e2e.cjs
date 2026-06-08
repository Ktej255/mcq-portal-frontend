const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const feedbackKey = "sarit-upsc-geography-pilot-feedback-v1";
const releaseKey = "sarit-upsc-geography-pilot-release-v1";
const founderReviewKey = "sarit-upsc-geography-founder-review-v1";
const checkInKey = "sarit-upsc-geography-pilot-check-in-v1";
const rosterKey = "sarit-upsc-geography-pilot-roster-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const draftKey = "sarit-admin-bulk-question-drafts-v1";
const inviteCode = "GEO-01-SHARE";
const evidencePath = path.join(__dirname, "geography-share-ready-rehearsal-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-share-ready-rehearsal-final.png");
const day = 1;
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function buildQuestion(index) {
  return {
    test_id: 9800 + index,
    topic_id: 9800 + index,
    text_en: `Fresh Geography Day 1 question ${index}: choose the strongest geographic-thinking statement.`,
    options_en: {
      A: "Use location, scale, relationship, and one India map cue before accepting the explanation.",
      B: "Memorize one isolated location and ignore its relationship with other places.",
      C: "Assume every map scale produces the same conclusion.",
      D: "Treat site and situation as interchangeable in every statement.",
    },
    correct_option: "A",
    explanation_en: `Question ${index} checks relationship, scale, India-map proof, and an almost-correct UPSC trap.`,
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: "GEO-D01",
      subject: "Geography",
      day: "1",
      chapter: "Geography Foundation",
      topic: "Geographic Thinking and Map Relationships",
      map_or_case_tag: "India map relationship drill",
    },
  };
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
        document.body.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still contains old protected branding.`);
  }
}

async function getProgress(page) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day },
  );
}

async function seedApprovedFreshStudent(page) {
  const questions = Array.from({ length: 25 }, (_, index) => buildQuestion(index + 1));
  await page.evaluate(
    ({
      localProfileKey,
      localProgressKey,
      localFeedbackKey,
      localReleaseKey,
      localFounderReviewKey,
      localCheckInKey,
      localRosterKey,
      localMcqKey,
      localDraftKey,
      localInviteCode,
      questions: seededQuestions,
    }) => {
      const now = new Date().toISOString();
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_share_ready_rehearsal");
      window.localStorage.setItem(
        localProfileKey,
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
      window.localStorage.removeItem(localProgressKey);
      window.localStorage.removeItem(localFeedbackKey);
      window.localStorage.removeItem(localCheckInKey);
      window.localStorage.setItem(
        localRosterKey,
        JSON.stringify([
          {
            id: "share-ready-roster",
            name: "Share Ready Tester",
            contact: "Local Batch A",
            inviteCode: localInviteCode,
            status: "planned",
            note: "Share-ready rehearsal tester.",
            createdAt: now,
            updatedAt: now,
          },
        ]),
      );
      window.localStorage.setItem(
        localReleaseKey,
        JSON.stringify({
          status: "approved",
          reviewerName: "Founder QA",
          note: "Approved for share-ready public-link rehearsal.",
          maxTesters: 3,
          testWindow: "25-35 minutes",
          updatedAt: now,
        }),
      );
      window.localStorage.setItem(
        localFounderReviewKey,
        JSON.stringify({
          checkedIds: [
            "geography-home",
            "watch-room",
            "talk-room",
            "visual-lab",
            "mcq-intake",
            "track-revisit",
            "mobile-fit",
          ],
          reviewerName: "Founder QA",
          updatedAt: now,
        }),
      );
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "GEO-D01": {
            planned: 25,
            drafted: seededQuestions.length,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: now,
          },
        }),
      );
      window.localStorage.setItem(
        localDraftKey,
        JSON.stringify([
          {
            id: "share-ready-geography-day-1",
            createdAt: now,
            importMode: "UPSC_MCQ_COMMAND",
            questions: seededQuestions,
          },
        ]),
      );
    },
    {
      localProfileKey: profileKey,
      localProgressKey: progressKey,
      localFeedbackKey: feedbackKey,
      localReleaseKey: releaseKey,
      localFounderReviewKey: founderReviewKey,
      localCheckInKey: checkInKey,
      localRosterKey: rosterKey,
      localMcqKey: mcqKey,
      localDraftKey: draftKey,
      localInviteCode: inviteCode,
      questions,
    },
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

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await seedApprovedFreshStudent(page);

  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-room").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Check in before starting", { exact: false }).waitFor({ timeout: 15000 });
  const startLinksBeforeCheckIn = await page.getByTestId("geography-student-pilot-start").count();
  if (startLinksBeforeCheckIn !== 0) {
    throw new Error("Share-ready rehearsal exposed Start lesson before student check-in.");
  }
  await page.getByLabel("Pilot check-in name").fill("Share Ready Tester");
  await page.getByLabel("Pilot check-in contact").fill("Local Batch A");
  await page.getByLabel("Pilot invite code").fill(inviteCode);
  await page.getByTestId("geography-student-check-in-save").click();
  await page.getByTestId("geography-student-pilot-check-in").getByText("Checked in: Share Ready Tester", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Start lesson", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-script").getByText("Step 1: Learn", { exact: false }).waitFor({ timeout: 15000 });
  const pilotJumpLinks = await page.getByTestId("geography-student-pilot-gates").getByRole("link").count();
  if (pilotJumpLinks !== 0) {
    throw new Error(`Share-ready pilot exposed ${pilotJumpLinks} skip-ahead links.`);
  }
  await assertNoOverflow(page, "share-ready-pilot-start", checks);

  await page.getByTestId("geography-student-pilot-start").click();
  await page.waitForURL(`**/upsc/geography/watch?day=${day}`, { timeout: 15000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-player").getByText("Finish lesson and discuss", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-lesson-entry", checks);
  await page.getByTestId("watch-complete-and-discuss").click();

  await page.waitForURL(`**/upsc/geography/talk?day=${day}`, { timeout: 15000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-answer-draft").fill(
    [
      "Geographic thinking asks what, where, why, and why here rather than memorizing an isolated location.",
      "The concept uses absolute and relative location, site and situation, scale, and map relationships to read India spatially.",
      "Because location and scale change the relationship, the effect also changes across a region.",
      "For example, an India map relationship between a river, coast, plateau, pass, or neighboring state explains why the place matters.",
      "UPSC trap: never assume every statement is identical or that only one isolated location proves the answer; check the exception, site, situation, and scale.",
    ].join(" "),
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-primary-route").getByText("Open MCQ", { exact: false }).waitFor({ timeout: 15000 });
  const talkRouteHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (talkRouteHref !== "/upsc/geography/mcq-readiness?day=1") {
    throw new Error(`Discussion did not route directly to MCQ readiness: ${talkRouteHref}`);
  }
  const talkProgress = await getProgress(page);
  if (talkProgress?.talkScore < 95 || talkProgress?.talkBand !== "Command" || talkProgress?.talkUnlockStage !== "mcq") {
    throw new Error(`Discussion did not persist 95% clearance: ${JSON.stringify(talkProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "share-ready-discussion-clear", checks);
  await page.getByTestId("talk-primary-route").click();

  await page.waitForURL(`**/upsc/geography/mcq-readiness?day=${day}`, { timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-start-local-practice").click();
  for (let questionNumber = 1; questionNumber <= 25; questionNumber += 1) {
    await page
      .getByTestId("mcq-local-practice-runner")
      .getByText(`Question ${questionNumber} of 25`, { exact: false })
      .waitFor({ timeout: 15000 });
    await page.getByTestId("mcq-practice-option-A").click();
    if (questionNumber < 25) {
      await page.getByRole("button", { name: "Next question" }).click();
    }
  }
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command cleared", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-mcq-command", checks);

  const mcqProgress = await getProgress(page);
  if (
    mcqProgress?.mcqCompleted !== true ||
    mcqProgress?.mcqCorrectCount !== 25 ||
    mcqProgress?.mcqTotal !== 25 ||
    mcqProgress?.mcqOutcome !== "Command"
  ) {
    throw new Error(`Fresh MCQ command did not persist: ${JSON.stringify(mcqProgress, null, 2)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Save final feedback", { exact: false }).waitFor({ timeout: 15000 });
  const optionalVisualHref = await page.getByTestId("geography-student-pilot-optional-visual").getAttribute("href");
  if (optionalVisualHref !== "/upsc/geography/lab?mode=india-map&day=1") {
    throw new Error(`Optional India-map helper points to ${optionalVisualHref}`);
  }
  await page.getByLabel("Pilot student name").fill("Share Ready Tester");
  await page.getByRole("button", { name: "MCQ" }).click();
  await page.getByRole("button", { name: "Positive" }).click();
  await page
    .getByPlaceholder("Example: I completed the lesson and discussion")
    .fill("Share-ready rehearsal completed the lesson, 95 percent discussion clearance, and fresh MCQ practice from the public pilot link.");
  await page.getByTestId("geography-student-feedback-save").click();
  await page.getByText("Feedback saved for the pilot review board.", { exact: false }).waitFor({ timeout: 15000 });

  const feedbackAfterSave = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), feedbackKey);
  if (
    feedbackAfterSave[0]?.testerName !== "Share Ready Tester" ||
    feedbackAfterSave[0]?.stage !== "MCQ" ||
    feedbackAfterSave[0]?.inviteCode !== inviteCode
  ) {
    throw new Error(`Share-ready feedback did not persist correctly: ${JSON.stringify(feedbackAfterSave, null, 2)}`);
  }
  const rosterAfterFeedback = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), rosterKey);
  if (rosterAfterFeedback[0]?.status !== "completed") {
    throw new Error(`Share-ready feedback did not complete the roster entry: ${JSON.stringify(rosterAfterFeedback, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Save final feedback", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-session-guide").getByText("Save feedback", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-pilot-mobile-after-mcq", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const finalProgress = await getProgress(page);
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    talkRouteHref,
    optionalVisualHref,
    finalProgress,
    feedbackAfterSave,
    rosterAfterFeedback,
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
