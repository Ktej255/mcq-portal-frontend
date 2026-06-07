const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const storageKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const feedbackKey = "sarit-upsc-geography-pilot-feedback-v1";
const releaseKey = "sarit-upsc-geography-pilot-release-v1";
const founderReviewKey = "sarit-upsc-geography-founder-review-v1";
const rosterKey = "sarit-upsc-geography-pilot-roster-v1";
const checkInKey = "sarit-upsc-geography-pilot-check-in-v1";
const inviteCode = "GEO-01-JOURNEY";
const day = 1;
const batchCode = "GEO-D01";
const evidencePath = path.join(__dirname, "geography-day1-student-journey-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day1-student-journey-final.png");
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
    { key: storageKey, selectedDay: day }
  );
}

async function seedFreshMcqs(page) {
  await page.evaluate(
    ({ localMcqKey, localDraftStorageKey, activeBatchCode }) => {
      const now = new Date().toISOString();
      const buildQuestion = (id, correctOption, text, options, explanation) => ({
        test_id: id,
        topic_id: id,
        text_en: text,
        options_en: options,
        correct_option: correctOption,
        explanation_en: explanation,
        difficulty: "MEDIUM",
        source: "UPSC_MCQ_COMMAND",
        status: "DRAFT",
        quality_notes: {
          batch_code: activeBatchCode,
          subject: "Geography",
          day: "1",
          chapter: "Physical Geography Foundation",
          topic: "Earth as a System",
          map_or_case_tag: "Earth Layers Lab latitude longitude time zones India map",
          quality_gate: "local_day1_student_journey",
        },
      });

      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          [activeBatchCode]: {
            planned: 3,
            drafted: 3,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: now,
          },
        })
      );
      window.localStorage.setItem(
        localDraftStorageKey,
        JSON.stringify([
          {
            id: "geography-day1-student-journey-batch",
            createdAt: now,
            importMode: "UPSC_MCQ_COMMAND",
            questions: [
              buildQuestion(
                100101,
                "A",
                "Consider the following statements about Earth as a system: which option correctly links spheres, energy flow, map location and the UPSC trap?",
                {
                  A: "Lithosphere, atmosphere, hydrosphere and biosphere interact through energy, matter and feedback",
                  B: "Latitude alone explains every climate and relief pattern on Earth",
                  C: "Map scale is irrelevant once the physical process is understood",
                  D: "Every location receives the same insolation across seasons",
                },
                "Earth as a system is explained because lithosphere, atmosphere, hydrosphere and biosphere exchange energy and matter through feedback processes. The map trap is to isolate one factor such as latitude, scale or relief and ignore location-based interactions."
              ),
              buildQuestion(
                100102,
                "B",
                "Consider the following statements about latitude, longitude, time and map scale: which option gives the correct UPSC location logic?",
                {
                  A: "They replace physical geography and make relief unnecessary",
                  B: "They locate processes and prevent wrong map, distance, time-zone and insolation conclusions",
                  C: "They prove that all meridians have the same local time",
                  D: "They show that map distance never needs conversion to ground distance",
                },
                "Location tools matter because latitude, longitude, time and scale link a process to its actual map position, distance and insolation pattern. The UPSC trap is to treat coordinates as trivia or to convert time, direction and ground distance incorrectly."
              ),
              buildQuestion(
                100103,
                "C",
                "Consider the following UPSC-style traps after the Day 1 Earth system lesson: which option is the incorrect one-dimensional explanation?",
                {
                  A: "Always connecting relief, climate and drainage with examples",
                  B: "Using scale before converting map distance into ground distance",
                  C: "Treating one sphere or one location factor as if it alone explains every outcome",
                  D: "Checking latitude and longitude before comparing two regions",
                },
                "The core trap is overgeneralization because Earth system questions require interaction, exceptions, location proof and process logic. A single sphere, coordinate or map-scale statement rarely explains climate, relief, drainage or hazard patterns by itself."
              ),
            ],
          },
        ])
      );
    },
    { localMcqKey: mcqKey, localDraftStorageKey: localDraftKey, activeBatchCode: batchCode }
  );
}

async function completeLabProof(page, stageId, expectedCount) {
  const proofStage = page.getByTestId(`lab-proof-${stageId}`).first();
  if (!(await proofStage.isVisible().catch(() => false))) {
    const advancedTools = page.getByTestId("geography-lab-advanced-tools");
    if (!(await advancedTools.evaluate((element) => Boolean(element.open)).catch(() => false))) {
      await advancedTools.locator("summary").click();
    }
  }
  await page.getByTestId(`lab-proof-${stageId}`).first().click();
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofInput = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofInput.trim()) {
    throw new Error(`Proof suggestion did not load for ${stageId}.`);
  }
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForFunction(
    ({ key, selectedDay, expected }) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || "{}")[String(selectedDay)];
      return (progress?.labProofCompletedIds?.length ?? 0) >= expected;
    },
    { key: storageKey, selectedDay: day, expected: expectedCount },
    { timeout: 15000 }
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
  await page.evaluate(
    ({ progressKey, studentProfileKey, localMcqKey, localDraftStorageKey, localFeedbackKey, localReleaseKey, localFounderReviewKey, localRosterKey, localCheckInKey, localInviteCode }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_day1_student_journey");
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
      window.localStorage.removeItem(progressKey);
      window.localStorage.removeItem(localMcqKey);
      window.localStorage.removeItem(localDraftStorageKey);
      window.localStorage.removeItem(localFeedbackKey);
      window.localStorage.removeItem(localCheckInKey);
      window.localStorage.setItem(
        localRosterKey,
        JSON.stringify([
          {
            id: "day1-journey-roster",
            name: "Day 1 Journey Tester",
            contact: "Full Day 1 journey",
            inviteCode: localInviteCode,
            status: "planned",
            note: "Full Day 1 journey proof tester.",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
      );
      window.localStorage.setItem(
        localReleaseKey,
        JSON.stringify({
          status: "approved",
          reviewerName: "Founder QA",
          note: "Approved for Day 1 full student journey proof.",
          maxTesters: 3,
          testWindow: "25-35 minutes",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        localFounderReviewKey,
        JSON.stringify({
          checkedIds: [
            "geography-home",
            "talk-room",
            "watch-room",
            "visual-lab",
            "mcq-intake",
            "track-revisit",
            "mobile-fit",
          ],
          reviewerName: "Founder QA",
          updatedAt: new Date().toISOString(),
        })
      );
    },
    {
      progressKey: storageKey,
      studentProfileKey: profileKey,
      localMcqKey: mcqKey,
      localDraftStorageKey: localDraftKey,
      localFeedbackKey: feedbackKey,
      localReleaseKey: releaseKey,
      localFounderReviewKey: founderReviewKey,
      localRosterKey: rosterKey,
      localCheckInKey: checkInKey,
      localInviteCode: inviteCode,
    }
  );
  await seedFreshMcqs(page);

  await page.goto(`${baseUrl}/upsc/geography?day=${day}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-today-simple-entry").waitFor({ timeout: 15000 });
  const firstCommandHref = await page.getByTestId("command-next-action").getByRole("link").getAttribute("href");
  checks.push({ label: "day1-command-starts-with-talk", href: firstCommandHref });
  if (firstCommandHref !== `/upsc/geography/talk?day=${day}`) {
    throw new Error(`Day 1 command should start with Talk, got ${firstCommandHref}`);
  }
  await assertNoOverflow(page, "command-talk-first", checks);

  await page.getByTestId("command-next-action").getByRole("link").click();
  await page.waitForURL(`**/upsc/geography/talk?day=${day}`, { timeout: 15000 });
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-teacher-question").getByText("What did you understand?", { exact: false }).waitFor({ timeout: 15000 });
  const routeGateVisibleBeforeAnswer = await page.getByTestId("talk-route-gate").count().then((count) => count > 0);
  checks.push({ label: "talk-route-hidden-before-answer", routeGateVisibleBeforeAnswer });
  if (routeGateVisibleBeforeAnswer) {
    throw new Error("Talk route gate should stay hidden until the student answers.");
  }
  await page.getByTestId("talk-answer-draft").fill(
    [
      "Earth as a system means lithosphere, atmosphere, hydrosphere and biosphere interact through energy and matter.",
      "I know latitude, longitude, rotation and revolution affect location, time, seasons and map reading.",
      "India examples include Himalaya, monsoon, river basins and coastal hazards where one sphere affects another.",
      "My gap is exact map scale, time-zone logic and UPSC statement traps.",
    ].join(" ")
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-primary-route").getByText("Open class", { exact: false }).waitFor({ timeout: 15000 });
  const firstTalkHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  checks.push({ label: "initial-talk-routes-to-watch", href: firstTalkHref });
  if (firstTalkHref !== `/upsc/geography/watch?day=${day}`) {
    throw new Error(`Initial Talk should route to Watch repair class, got ${firstTalkHref}`);
  }
  const firstTalkProgress = await getProgress(page);
  if (
    typeof firstTalkProgress?.talkScore !== "number" ||
    firstTalkProgress?.talkNextRoute !== `/upsc/geography/watch?day=${day}` ||
    firstTalkProgress?.watched === true ||
    firstTalkProgress?.revisitQueued === true
  ) {
    throw new Error(`Initial Talk did not persist a recall-first Watch gate: ${JSON.stringify(firstTalkProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "talk-first-recall", checks);

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL(`**/upsc/geography/watch?day=${day}`, { timeout: 15000 });
  await page.getByTestId("watch-complete-and-discuss").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-watch-checkpoints").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-watch-details").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-repair-class", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(`**/upsc/geography/talk?day=${day}`, { timeout: 15000 });
  const watchProgress = await getProgress(page);
  if (
    watchProgress?.watched !== true ||
    watchProgress?.watchHandoffReady !== true ||
    watchProgress?.watchSceneCompletedIds?.length !== 5
  ) {
    throw new Error(`Watch proof did not persist: ${JSON.stringify(watchProgress, null, 2)}`);
  }

  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-teacher-question").getByText("What did you understand?", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-talk-details").locator("summary").first().click();
  await page.getByTestId("talk-use-watch-recap").click();
  const handoffDraft = await page.getByTestId("talk-answer-draft").inputValue();
  if (!handoffDraft.includes("Concept:") || !handoffDraft.includes("UPSC trap:")) {
    throw new Error(`Talk room did not receive Watch handoff: ${handoffDraft}`);
  }

  await page.getByTestId("talk-answer-draft").fill(
    [
      "Earth as a system connects lithosphere, atmosphere, hydrosphere and biosphere through energy, matter and feedback.",
      "Because solar radiation, rotation, gravity, latitude and longitude create location, time and insolation differences, map scale and direction are needed before explaining climate, relief, rivers and hazards.",
      "India example: the Himalaya, monsoon, coasts, river basins and plateau show that one sphere changes another through relief, drainage, wind and moisture.",
      "Map proof must include latitude, longitude, time, scale and direction, otherwise local time, distance, rainfall and hazard conclusions become wrong.",
      "UPSC trap: do not treat one sphere, one coordinate or one scale statement as a universal explanation; exceptions and interactions matter.",
    ].join(" ")
  );
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-score-card").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-primary-route").getByText("Open visual proof", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-verdict", checks);
  const talkProgress = await getProgress(page);
  if (
    typeof talkProgress?.talkScore !== "number" ||
    talkProgress.talkScore < 70 ||
    !["Practice", "Command"].includes(talkProgress?.talkBand) ||
    !["lab", "mcq"].includes(talkProgress?.talkUnlockStage) ||
    !talkProgress?.talkNextRoute?.includes("/upsc/geography/lab")
  ) {
    throw new Error(`Talk verdict did not persist the lab gate: ${JSON.stringify(talkProgress, null, 2)}`);
  }

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL(`**/upsc/geography/lab?**day=${day}`, { timeout: 15000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("lab-evidence-status").getByText("proof pending", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-locked", checks);

  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofInput = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofInput.trim()) {
    throw new Error("Geography visual proof suggestion did not load.");
  }
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForURL(`**/upsc/geography/mcq-readiness?day=${day}`, { timeout: 15000 });
  const labProgress = await getProgress(page);
  if (labProgress?.labCompleted !== true || labProgress?.labProofCompletedIds?.length !== 5) {
    throw new Error(`Lab proof did not persist the MCQ gate: ${JSON.stringify(labProgress, null, 2)}`);
  }
  await page.getByTestId("mcq-start-local-practice").waitFor({ timeout: 15000 });
  await page.getByText("Start practice", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-ready", checks);

  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Next question/i }).click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-B").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Next question/i }).click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 3 of 3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-option-C").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command cleared", { exact: false }).waitFor({ timeout: 15000 });
  const mcqOutcomeHref = await page.getByTestId("mcq-practice-outcome-route").getAttribute("href");
  if (mcqOutcomeHref !== `/upsc/geography?day=${day + 1}`) {
    throw new Error(`Command outcome should open Day ${day + 1}, got ${mcqOutcomeHref}`);
  }
  await assertNoOverflow(page, "mcq-complete", checks);

  const mcqProgress = await getProgress(page);
  if (
    mcqProgress?.mcqAttempted !== true ||
    mcqProgress?.mcqCompleted !== true ||
    mcqProgress?.mcqCorrectCount !== 3 ||
    mcqProgress?.mcqTotal !== 3 ||
    mcqProgress?.mcqScorePercent !== 100 ||
    mcqProgress?.mcqOutcome !== "Command" ||
    mcqProgress?.revisitQueued !== false
  ) {
    throw new Error(`MCQ practice did not persist command outcome: ${JSON.stringify(mcqProgress, null, 2)}`);
  }

  await page.getByTestId("mcq-practice-outcome-route").click();
  await page.waitForURL(`**/upsc/geography?day=2`, { timeout: 15000 });
  await page.goto(`${baseUrl}/upsc/geography/track?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-closeout-panel").getByText("Day 1 complete", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-closeout-panel").getByText("Return to pilot feedback", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-closeout-panel").getByText("Revisit weak point", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-path-map").locator("summary").click();
  await page.getByTestId("track-day-1").getByText("MCQ practice done", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-command", checks);

  await page.getByTestId("geography-track-pilot-feedback-route").click();
  await page.waitForURL(`**/upsc/geography/pilot`, { timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Check in before starting", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByLabel("Pilot check-in name").fill("Day 1 Journey Tester");
  await page.getByLabel("Pilot check-in contact").fill("Full Day 1 journey");
  await page.getByLabel("Pilot invite code").fill(inviteCode);
  await page.getByTestId("geography-student-check-in-save").click();
  await page.getByTestId("geography-student-pilot-check-in").getByText("Checked in: Day 1 Journey Tester", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Review Track and save final feedback", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByLabel("Pilot student name").fill("Day 1 Journey Tester");
  await page.getByRole("button", { name: "Track" }).click();
  await page.getByRole("button", { name: "Positive" }).click();
  await page
    .getByPlaceholder("Example: I completed Watch and Talk")
    .fill("Completed Day 1 Talk, Watch, Visual Lab, MCQ command, Track review and returned to pilot feedback.");
  await page.getByTestId("geography-student-feedback-save").click();
  await page.getByText("Feedback saved for the pilot review board.", { exact: false }).waitFor({ timeout: 15000 });
  const pilotFeedback = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), feedbackKey);
  if (
    pilotFeedback[0]?.testerName !== "Day 1 Journey Tester" ||
    pilotFeedback[0]?.stage !== "Track" ||
    pilotFeedback[0]?.inviteCode !== inviteCode
  ) {
    throw new Error(`Pilot feedback closeout did not persist correctly: ${JSON.stringify(pilotFeedback, null, 2)}`);
  }
  const rosterAfterPilotFeedback = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), rosterKey);
  if (rosterAfterPilotFeedback[0]?.status !== "completed") {
    throw new Error(`Pilot feedback did not complete the Day 1 tester roster entry: ${JSON.stringify(rosterAfterPilotFeedback, null, 2)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/revisit?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Recovery checklist", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-complete-and-talk").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-route", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.locator("main").first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mobile-mcq-ready", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const finalProgress = await getProgress(page);
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    firstTalkProgress,
    watchProgress,
    talkProgress,
    labProgress,
    mcqProgress,
    pilotFeedback,
    rosterAfterPilotFeedback,
    finalProgress,
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
