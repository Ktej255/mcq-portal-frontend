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
const inviteCode = "GEO-01-COCKPIT";
const evidencePath = path.join(__dirname, "geography-testing-cockpit-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-testing-cockpit-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
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

async function seedDayOneCommand(page) {
  await page.evaluate(
    ({ localProfileKey, localProgressKey, localFeedbackKey, localReleaseKey, localFounderReviewKey, localCheckInKey, localRosterKey, localInviteCode }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_testing_cockpit");
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
          updatedAt: new Date().toISOString(),
        }),
      );
      window.localStorage.removeItem(localFeedbackKey);
      window.localStorage.removeItem(localReleaseKey);
      window.localStorage.removeItem(localFounderReviewKey);
      window.localStorage.removeItem(localCheckInKey);
      window.localStorage.setItem(
        localRosterKey,
        JSON.stringify([
          {
            id: "testing-cockpit-roster",
            name: "Pilot Tester B",
            contact: "Testing cockpit rehearsal",
            inviteCode: localInviteCode,
            status: "planned",
            note: "Testing cockpit student route proof.",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
      );
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
            watchHandoffReady: true,
            watchHandoffSummary: "Concept, mechanism, map/example, and UPSC trap saved for testing.",
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            talkClassroomStage: "examiner-verdict",
            talkNextRoute: "/upsc/geography/mcq-readiness?day=1",
            talkNextActionLabel: "Open MCQ practice",
            reflection: "Testing seed: Earth system answer passed Talk with map and trap proof.",
            confidence: "Command",
            revisitQueued: false,
            labCompleted: true,
            labMode: "india-map",
            labProofCompletedIds: [
              "1-earth-layers-concept",
              "1-earth-layers-map",
              "1-earth-layers-example",
              "1-earth-layers-trap",
              "1-earth-layers-answer",
            ],
            labEvidenceStatus: "mcq-ready",
            labNextRoute: "/upsc/geography/mcq-readiness?day=1",
            labNextActionLabel: "Open MCQ readiness",
            mcqAttempted: true,
            mcqCompleted: true,
            mcqAnsweredCount: 3,
            mcqCorrectCount: 3,
            mcqTotal: 3,
            mcqScorePercent: 100,
            mcqOutcome: "Command",
            mcqRecommendedRoute: "/upsc/geography/track?day=1",
            mcqReviewSummary: "3/3 correct (100%). Command gate cleared for testing.",
            updatedAt: new Date().toISOString(),
          },
        })
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
      localInviteCode: inviteCode,
    }
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
  await seedDayOneCommand(page);

  await page.goto(`${baseUrl}/upsc/geography/testing`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-testing-link-card").getByText("/upsc/geography/pilot", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-pilot-release-state").getByText("Operator sign-off required", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-pilot-sharing-rules").getByText("Maximum testers: 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-pilot-script").getByText("Use the optional India-map visual", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("testing-gate-learn-proof").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("testing-gate-discuss-verdict").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("testing-gate-mcq-command").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "testing-cockpit-desktop", checks);

  await page.getByLabel("Tester name").fill("Pilot Tester A");
  await page.getByRole("button", { name: "Talk" }).click();
  await page.getByRole("button", { name: "Confusing" }).click();
  await page
    .getByPlaceholder("Write what confused the student")
    .fill("The Talk room transition is clear, but the tester wants the peer challenge instruction to stay visible while typing.");
  await page.getByTestId("testing-feedback-save").click();
  await page.getByTestId("testing-feedback-list").getByText("peer challenge instruction", { exact: false }).waitFor({ timeout: 15000 });

  const feedbackAfterSave = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), feedbackKey);
  if (feedbackAfterSave.length !== 1 || feedbackAfterSave[0].stage !== "Talk" || feedbackAfterSave[0].severity !== "Confusing") {
    throw new Error(`Feedback did not persist correctly: ${JSON.stringify(feedbackAfterSave, null, 2)}`);
  }

  await page.goto(`${baseUrl}/admin/launch-plan`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-geography-testing-observation").waitFor({ timeout: 15000 });
  await page.getByTestId("admin-geography-feedback-list").getByText("peer challenge instruction", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pilot-release-status").getByText("Paused before sharing", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "admin-observation-desktop", checks);

  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await page.waitForFunction(
    (key) => {
      const entries = JSON.parse(window.localStorage.getItem(key) || "[]");
      return entries[0]?.status === "reviewed";
    },
    feedbackKey,
    { timeout: 15000 }
  );
  await page.getByLabel("Release reviewer").fill("Founder QA");
  await page.getByLabel("Release note").fill("Approved after local Day 1 proof and feedback review.");
  await page.getByTestId("admin-pilot-approve").click();
  await page.getByTestId("admin-pilot-release-status").getByText("Paused before sharing", { exact: false }).waitFor({ timeout: 15000 });

  await page.getByTestId("admin-founder-review-runner").waitFor({ timeout: 15000 });
  for (let founderStep = 0; founderStep < 7; founderStep += 1) {
    await page.getByTestId("admin-founder-review-mark-next").click();
  }
  await page.getByTestId("admin-founder-review-count").getByText("7/7 checked", { exact: false }).waitFor({ timeout: 15000 });
  const founderReviewAfterChecks = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "null"), founderReviewKey);
  if (founderReviewAfterChecks?.checkedIds?.length !== 7) {
    throw new Error(`Founder review checklist did not persist: ${JSON.stringify(founderReviewAfterChecks, null, 2)}`);
  }

  await page.getByTestId("admin-pilot-approve").click();
  await page.getByTestId("admin-pilot-release-status").getByText("Approved for controlled testing", { exact: false }).waitFor({ timeout: 15000 });
  const releaseAfterApproval = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "null"), releaseKey);
  if (releaseAfterApproval?.status !== "approved" || releaseAfterApproval?.reviewerName !== "Founder QA") {
    throw new Error(`Release approval did not persist correctly: ${JSON.stringify(releaseAfterApproval, null, 2)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-room").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-release-state").getByText("Ready for controlled testing", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Check in before starting", { exact: false }).waitFor({ timeout: 15000 });
  const startLinksBeforeCheckIn = await page.getByTestId("geography-student-pilot-start").count();
  if (startLinksBeforeCheckIn !== 0) {
    throw new Error("Student pilot route exposed a start link before check-in.");
  }
  await page.getByLabel("Pilot check-in name").fill("Pilot Tester B");
  await page.getByLabel("Pilot check-in contact").fill("Testing cockpit rehearsal");
  await page.getByLabel("Pilot invite code").fill(inviteCode);
  await page.getByTestId("geography-student-check-in-save").click();
  await page.getByTestId("geography-student-pilot-check-in").getByText("Checked in: Pilot Tester B", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-start").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Save final feedback", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-script").getByText("Step 1: Learn", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-script").getByText("Step 3: MCQ", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-stuck-rule").getByText("Do not skip ahead", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-gates").getByText("Step 1: Learn", { exact: false }).waitFor({ timeout: 15000 });
  const pilotJumpLinks = await page.getByTestId("geography-student-pilot-gates").getByRole("link").count();
  if (pilotJumpLinks !== 0) {
    throw new Error(`Student pilot exposed ${pilotJumpLinks} skip-ahead links.`);
  }
  const studentRouteText = await page.locator("body").innerText();
  if (/Admin view|Open Testing Cockpit|Operator sign-off required/i.test(studentRouteText)) {
    throw new Error("Student pilot route leaked operator/admin language.");
  }
  await page.getByLabel("Pilot student name").fill("Pilot Tester B");
  await page.getByRole("button", { name: "Visual Lab" }).click();
  await page.getByRole("button", { name: "Positive" }).click();
  await page
    .getByPlaceholder("Example: I completed the lesson and discussion")
    .fill("The Day 1 student path is clear and the Visual Lab instruction tells me where to go next.");
  await page.getByTestId("geography-student-feedback-save").click();
  await page.getByText("Feedback saved for the pilot review board.", { exact: false }).waitFor({ timeout: 15000 });
  const studentFeedbackAfterSave = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), feedbackKey);
  if (
    studentFeedbackAfterSave.length !== 2 ||
    studentFeedbackAfterSave[0].currentRoute !== "/upsc/geography/pilot" ||
    studentFeedbackAfterSave[0].stage !== "Visual Lab" ||
    studentFeedbackAfterSave[0].inviteCode !== inviteCode
  ) {
    throw new Error(`Student pilot feedback did not persist correctly: ${JSON.stringify(studentFeedbackAfterSave, null, 2)}`);
  }
  const rosterAfterStudentFeedback = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), rosterKey);
  if (rosterAfterStudentFeedback[0]?.status !== "completed") {
    throw new Error(`Student pilot feedback did not complete the tester roster entry: ${JSON.stringify(rosterAfterStudentFeedback, null, 2)}`);
  }
  await assertNoOverflow(page, "student-pilot-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-gates").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-release-state").getByText("Ready for controlled testing", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "student-pilot-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const finalFeedback = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), feedbackKey);
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    feedbackAfterSave,
    finalFeedback,
    studentFeedbackAfterSave,
    rosterAfterStudentFeedback,
    founderReviewAfterChecks,
    releaseAfterApproval,
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
