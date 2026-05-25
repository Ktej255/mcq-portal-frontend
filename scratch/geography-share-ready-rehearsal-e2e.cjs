const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const feedbackKey = "sarit-upsc-geography-pilot-feedback-v1";
const releaseKey = "sarit-upsc-geography-pilot-release-v1";
const founderReviewKey = "sarit-upsc-geography-founder-review-v1";
const checkInKey = "sarit-upsc-geography-pilot-check-in-v1";
const rosterKey = "sarit-upsc-geography-pilot-roster-v1";
const inviteCode = "GEO-01-SHARE";
const evidencePath = path.join(__dirname, "geography-share-ready-rehearsal-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-share-ready-rehearsal-final.png");
const day = 1;
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
  await page.evaluate(
    ({ localProgressKey, localFeedbackKey, localReleaseKey, localFounderReviewKey, localCheckInKey, localRosterKey, localInviteCode }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_share_ready_rehearsal");
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
          updatedAt: new Date().toISOString(),
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
          updatedAt: new Date().toISOString(),
        }),
      );
    },
    {
      localProgressKey: progressKey,
      localFeedbackKey: feedbackKey,
      localReleaseKey: releaseKey,
      localFounderReviewKey: founderReviewKey,
      localCheckInKey: checkInKey,
      localRosterKey: rosterKey,
      localInviteCode: inviteCode,
    },
  );
}

async function completeLabProof(page, stageText, expectedCount) {
  await page.getByTestId("geography-lab-proof-stages").getByText(stageText, { exact: false }).click();
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofInput = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofInput.trim()) {
    throw new Error(`Proof suggestion did not load for ${stageText}.`);
  }
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForFunction(
    ({ key, selectedDay, expected }) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || "{}")[String(selectedDay)];
      return (progress?.labProofCompletedIds?.length ?? 0) >= expected;
    },
    { key: progressKey, selectedDay: day, expected: expectedCount },
    { timeout: 15000 },
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
    throw new Error("Share-ready rehearsal exposed the Start Watch link before student check-in.");
  }
  await page.getByLabel("Pilot check-in name").fill("Share Ready Tester");
  await page.getByLabel("Pilot check-in contact").fill("Local Batch A");
  await page.getByLabel("Pilot invite code").fill(inviteCode);
  await page.getByTestId("geography-student-check-in-save").click();
  await page.getByTestId("geography-student-pilot-check-in").getByText("Checked in: Share Ready Tester", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Start Watch room", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-session-guide").getByText("Return here", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-script").getByText("Room 1: Watch", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-pilot-start", checks);

  await page.getByTestId("geography-student-pilot-start").click();
  await page.waitForURL(`**/upsc/geography/watch?day=${day}`, { timeout: 15000 });
  await page.getByTestId("watch-talk-handoff-packet").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-watch").getByText("You are in Watch", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-watch-entry", checks);

  await page.getByTestId("watch-load-handoff").click();
  await page.getByTestId("watch-save-handoff").click();
  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("watch-scene-complete").click();
    await page.waitForFunction(
      ({ key, selectedDay, expected }) => {
        const progress = JSON.parse(window.localStorage.getItem(key) || "{}")[String(selectedDay)];
        return (progress?.watchSceneCompletedIds?.length ?? 0) >= expected;
      },
      { key: progressKey, selectedDay: day, expected: index + 1 },
      { timeout: 15000 },
    );
  }
  await page.getByTestId("watch-route-gate").getByText("AI teacher unlocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-watch").click();

  await page.waitForURL(`**/upsc/geography/talk?day=${day}`, { timeout: 15000 });
  await page.getByTestId("geography-student-handoff-talk").getByText("You are in Talk", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-talk").getByText("Assess explanation first", { exact: false }).waitFor({ timeout: 15000 });
  const handoffDraft = await page.getByTestId("talk-answer-draft").inputValue();
  if (!handoffDraft.includes("Concept:") || !handoffDraft.includes("UPSC trap:")) {
    throw new Error(`Talk did not receive the Watch handoff: ${handoffDraft}`);
  }

  await page.getByTestId("talk-answer-draft").fill(
    [
      "Earth as a system connects lithosphere, atmosphere, hydrosphere and biosphere through energy, matter and feedback.",
      "Solar radiation, rotation, gravity, latitude and longitude create location, time and insolation differences, so map scale and direction matter before explaining climate, relief, rivers and hazards.",
      "India example: the Himalaya, monsoon, coasts, river basins and plateau show that one sphere changes another through relief, drainage, wind and moisture.",
      "Map proof must include latitude, longitude, time, scale and direction because local time, distance, rainfall and hazard conclusions can become wrong.",
      "UPSC trap: never treat one sphere, one coordinate or one scale statement as a universal explanation; exceptions and interactions matter.",
    ].join(" "),
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-stage-peer-challenge").getByText("Active", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-challenge-response").fill(
    [
      "The weak point to defend is map proof.",
      "Latitude, longitude, time, scale and direction must be attached to the Earth system because location changes insolation, climate and distance interpretation.",
      "Himalaya affects atmosphere and hydrosphere, coasts modify rainfall, plateau relief shapes drainage, and river basins connect lithosphere with water flow.",
      "UPSC trap: a statement that isolates one sphere or confuses local time, standard time, scale and map distance can look correct but fail due to exception.",
    ].join(" "),
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-stage-examiner-verdict").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-talk").getByText("Open visual lab", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-talk-verdict", checks);
  await page.getByTestId("geography-student-handoff-next-talk").click();

  await page.waitForURL(`**/upsc/geography/lab?**day=${day}`, { timeout: 15000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-lab").getByText("You are in Visual Lab", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-lab").getByText("Finish lab proof", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-lab-entry", checks);

  const stages = ["1. Concept lock", "2. Map mechanism", "3. India example", "4. UPSC trap", "5. Answer hook"];
  for (let index = 0; index < stages.length; index += 1) {
    await completeLabProof(page, stages[index], index + 1);
  }
  await page.getByTestId("lab-evidence-status").getByText("mcq ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-lab").getByText("Open MCQ readiness", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-lab-proof-complete", checks);

  const labProgress = await getProgress(page);
  if (
    labProgress?.watched !== true ||
    labProgress?.watchHandoffReady !== true ||
    labProgress?.talkClassroomStage !== "examiner-verdict" ||
    labProgress?.labCompleted !== true ||
    labProgress?.labProofCompletedIds?.length !== 5
  ) {
    throw new Error(`Share-ready rehearsal did not persist the expected learning state: ${JSON.stringify(labProgress, null, 2)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Open MCQ readiness", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByLabel("Pilot student name").fill("Share Ready Tester");
  await page.getByRole("button", { name: "Visual Lab" }).click();
  await page.getByRole("button", { name: "Positive" }).click();
  await page
    .getByPlaceholder("Example: I completed Watch and Talk")
    .fill("Share-ready rehearsal completed Watch handoff, Talk verdict, and Visual Lab proof from the public pilot link.");
  await page.getByTestId("geography-student-feedback-save").click();
  await page.getByText("Feedback saved for the pilot review board.", { exact: false }).waitFor({ timeout: 15000 });
  const feedbackAfterSave = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), feedbackKey);
  if (
    feedbackAfterSave[0]?.testerName !== "Share Ready Tester" ||
    feedbackAfterSave[0]?.stage !== "Visual Lab" ||
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
  await page.getByTestId("geography-student-pilot-current-action").getByText("Open MCQ readiness", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-session-guide").getByText("Save feedback", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "share-ready-pilot-mobile-after-lab", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const finalProgress = await getProgress(page);
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    labProgress,
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
