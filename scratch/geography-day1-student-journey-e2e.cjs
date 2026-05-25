const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
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
    ({ progressKey, localMcqKey, localDraftStorageKey, localFeedbackKey, localReleaseKey, localFounderReviewKey, localRosterKey, localCheckInKey, localInviteCode }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_day1_student_journey");
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
            "watch-room",
            "talk-room",
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

  await page.goto(`${baseUrl}/upsc/geography/watch?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-demo-player").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-talk-handoff-packet").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-watch").getByText("You are in Watch", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-watch").getByText("Talk with AI teacher", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-initial", checks);

  await page.getByTestId("watch-load-handoff").click();
  await page.getByTestId("watch-save-handoff").click();
  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("watch-scene-complete").click();
    await page.waitForFunction(
      ({ key, selectedDay, expected }) => {
        const progress = JSON.parse(window.localStorage.getItem(key) || "{}")[String(selectedDay)];
        return (progress?.watchSceneCompletedIds?.length ?? 0) >= expected;
      },
      { key: storageKey, selectedDay: day, expected: index + 1 },
      { timeout: 15000 }
    );
  }
  await page.getByTestId("watch-route-gate").getByText("AI teacher unlocked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-watch").getByText("Next", { exact: false }).waitFor({ timeout: 15000 });
  const watchProgress = await getProgress(page);
  if (watchProgress?.watched !== true || watchProgress?.watchHandoffReady !== true) {
    throw new Error(`Watch proof did not persist: ${JSON.stringify(watchProgress, null, 2)}`);
  }

  await page.getByTestId("watch-primary-route").click();
  await page.waitForURL(`**/upsc/geography/talk?day=${day}`, { timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Awaiting MAIC oral check", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-talk").getByText("You are in Talk", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-talk").getByText("Assess explanation first", { exact: false }).waitFor({ timeout: 15000 });
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
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-stage-peer-challenge").getByText("Active", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-challenge-response").fill(
    [
      "The weak point to defend is map proof.",
      "Latitude, longitude, time, scale and direction must be attached to the Earth system because location changes insolation, climate and distance interpretation.",
      "Himalaya affects atmosphere and hydrosphere, coasts modify rainfall, plateau relief shapes drainage, and river basins connect lithosphere with water flow.",
      "UPSC trap: a statement that isolates one sphere or confuses local time, standard time, scale and map distance can look correct but fail due to exception.",
    ].join(" ")
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-stage-examiner-verdict").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-next-handoff").getByText("Open visual lab", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-talk").getByText("Open visual lab", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-verdict", checks);
  const talkProgress = await getProgress(page);
  if (
    talkProgress?.talkClassroomStage !== "examiner-verdict" ||
    !["Practice", "Command"].includes(talkProgress?.talkBand) ||
    !["lab", "mcq"].includes(talkProgress?.talkUnlockStage)
  ) {
    throw new Error(`Talk verdict did not persist the lab gate: ${JSON.stringify(talkProgress, null, 2)}`);
  }

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL(`**/upsc/geography/lab?**day=${day}`, { timeout: 15000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("lab-direct-mcq-route").getByText("MCQ locked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-lab").getByText("You are in Visual Lab", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-lab").getByText("Finish lab proof", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-locked", checks);

  const stages = ["1. Concept lock", "2. Map mechanism", "3. India example", "4. UPSC trap", "5. Answer hook"];
  for (let index = 0; index < stages.length; index += 1) {
    await completeLabProof(page, stages[index], index + 1);
  }
  await page.getByTestId("lab-evidence-status").getByText("mcq ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("lab-direct-mcq-route").getByText("MCQ readiness", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-lab").getByText("Open MCQ readiness", { exact: false }).waitFor({ timeout: 15000 });
  const labProgress = await getProgress(page);
  if (labProgress?.labCompleted !== true || labProgress?.labProofCompletedIds?.length !== 5) {
    throw new Error(`Lab proof did not persist the MCQ gate: ${JSON.stringify(labProgress, null, 2)}`);
  }

  await page.getByTestId("lab-direct-mcq-route").click();
  await page.waitForURL(`**/upsc/geography/mcq-readiness?day=${day}`, { timeout: 15000 });
  await page.getByTestId("mcq-talk-gate").getByText("Learning gate passed", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-lab-gate").getByText("Lab proof 5/5", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-batch-gate").getByText("Fresh batch ready", { exact: false }).waitFor({ timeout: 15000 });
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
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command retained", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-outcome-route").getByText("Review track", { exact: false }).waitFor({ timeout: 15000 });
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
  await page.waitForURL(`**/upsc/geography/track?day=${day}`, { timeout: 15000 });
  await page.getByTestId("geography-readiness-snapshot").waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-1").getByText("MCQ practice done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-day-1").getByText("MCQ 3/3", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-closeout-panel").getByText("Day 1 complete", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-closeout-panel").getByText("Return to pilot feedback", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-closeout-panel").getByText("Open Revisit recovery", { exact: false }).waitFor({ timeout: 15000 });
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
    .fill("Completed Day 1 Watch, Talk, Visual Lab, MCQ command, Track review and returned to pilot feedback.");
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
  await page.getByTestId("revisit-diagnosis-board").waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-recovery-ledger").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-route", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("mcq-practice-launcher").getByText("Student practice ready", { exact: false }).waitFor({ timeout: 15000 });
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
