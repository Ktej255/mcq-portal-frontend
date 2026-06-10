const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const draftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "geography-mcq-simple-practice-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-mcq-simple-practice-final.png");
const day1CsvHeader = [
  "subject",
  "day",
  "week",
  "chapter",
  "topic",
  "batch_code",
  "test_title",
  "difficulty",
  "question_text_en",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
  "explanation_en",
  "source",
  "map_or_case_tag",
  "pyq_linked",
  "status",
];

function csvEscape(value) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildDay1IntakeCsv(questionCount) {
  const rows = Array.from({ length: questionCount }, (_, index) => {
    const number = index + 1;
    return [
      "Geography",
      1,
      1,
      "Physical Geography Foundation",
      "Geographic Thinking and Map Relationships",
      "GEO-D01",
      "Geography Day 1: Geographic Thinking and Map Relationships",
      number % 5 === 0 ? "HARD" : number % 3 === 0 ? "PYQ_STYLE" : "MEDIUM",
      `Consider the following statements about geographic thinking for UPSC map reasoning question ${number}: which option correctly connects location, scale, relationship proof and the common trap?`,
      `Location, scale, site and situation interact, so an India map relationship changes the final explanation for question ${number}.`,
      "Latitude alone explains every regional outcome without relief, water, access or seasonal movement.",
      "Map scale and direction are irrelevant once a place name is memorized.",
      "Every Indian region has an identical spatial relationship and the same exception pattern.",
      "A",
      `The correct option is A because UPSC Geography requires a relationship chain linking location, scale, site, situation and one India map proof. The trap is to isolate one fact and ignore mechanism, regional exception and map evidence for question ${number}.`,
      "FRESH_AUTHORING",
      "India map relationship: river, pass, strait, national park",
      number % 4 === 0 ? "Yes" : "No",
      "DRAFT",
    ];
  });
  return `${day1CsvHeader.join(",")}\n${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}

function buildQuestion(index, correctOption) {
  return {
    test_id: 9600 + index,
    topic_id: 9600 + index,
    text_en: `Fresh Geography Day 8 practice question ${index}: choose the strongest map-linked explanation.`,
    options_en: {
      A: "Relief, location, and mechanism must be connected",
      B: "Every feature has identical climate impact",
      C: "Longitude alone explains all Geography outcomes",
      D: "Map location never matters in UPSC traps",
    },
    correct_option: correctOption,
    explanation_en: `Question ${index} tests concept, map logic, and a UPSC trap.`,
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: "GEO-D08",
      subject: "Geography",
      day: "8",
      chapter: "Physical Geography Foundation",
      topic: "Relief and Structure",
      map_or_case_tag: "Map-linked relief explanation",
    },
  };
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
}

async function assertStudentCopy(page, label, checks) {
  const bodyText = await page.locator("body").innerText();
  const forbidden = ["GEO-D08", "DRAFT", "UPSC_MCQ_COMMAND", "Not uploaded", "Questions are attached", "uploaded MCQs", "batch"];
  const leaked = forbidden.filter((term) => bodyText.toLowerCase().includes(term.toLowerCase()));
  checks.push({ label, leaked });
  if (leaked.length > 0) throw new Error(`${label} leaked operator language: ${JSON.stringify(leaked)}`);
}

async function assertMcqFourSignalContract(page, expected, checks) {
  const shell = page.getByTestId("geography-mcq-level-shell");
  const grid = page.getByTestId("mcq-four-signal-grid");
  await grid.waitFor({ timeout: 15000 });

  const shellContract = await shell.evaluate((node) => ({
    signalModel: node.getAttribute("data-signal-model"),
    signalCount: node.getAttribute("data-essential-signal-count"),
    signals: node.getAttribute("data-essential-signals"),
    freshSetState: node.getAttribute("data-fresh-set-state"),
    nextActionRoute: node.getAttribute("data-next-action-route"),
    nextActionLabel: node.getAttribute("data-next-action-label"),
  }));

  const gridContract = await grid.evaluate((node) => ({
    signalCount: node.getAttribute("data-signal-count"),
    freshSetState: node.getAttribute("data-fresh-set-state"),
    talkScore: node.getAttribute("data-visible-talk-score"),
    outcome: node.getAttribute("data-outcome"),
    scorePercent: node.getAttribute("data-score-percent"),
    nextActionRoute: node.getAttribute("data-next-action-route"),
    nextActionLabel: node.getAttribute("data-next-action-label"),
    text: node.textContent || "",
  }));

  const signals = await grid.locator("[data-testid^='mcq-signal-']").evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.getAttribute("data-testid"),
      signal: node.getAttribute("data-signal"),
      href: node.getAttribute("href"),
      ready: node.getAttribute("data-ready"),
      freshSetState: node.getAttribute("data-fresh-set-state"),
      outcome: node.getAttribute("data-outcome"),
      scorePercent: node.getAttribute("data-score-percent"),
      nextRoute: node.getAttribute("data-next-action-route"),
      nextLabel: node.getAttribute("data-next-action-label"),
      text: node.textContent || "",
    }))
  );

  checks.push({ label: expected.label, shellContract, gridContract, signals });

  const signalIds = signals.map((signal) => signal.id);
  const requiredSignals = [
    "mcq-signal-recall-cleared",
    "mcq-signal-fresh-set",
    "mcq-signal-score-outcome",
    "mcq-signal-next-route",
  ];
  const freshSetSignal = signals.find((signal) => signal.id === "mcq-signal-fresh-set");
  const scoreSignal = signals.find((signal) => signal.id === "mcq-signal-score-outcome");
  const nextRouteSignal = signals.find((signal) => signal.id === "mcq-signal-next-route");

  if (
    shellContract.signalModel !== "mcq-four-signal-one-action" ||
    shellContract.signalCount !== "4" ||
    shellContract.signals !== "recall-cleared|fresh-set|score-outcome|next-route" ||
    gridContract.signalCount !== "4" ||
    signals.length !== 4 ||
    !requiredSignals.every((id) => signalIds.includes(id)) ||
    !gridContract.text.includes("Recall cleared") ||
    !gridContract.text.includes("Fresh set") ||
    !gridContract.text.includes("Score outcome") ||
    !gridContract.text.includes("Next route") ||
    gridContract.freshSetState !== expected.freshSetState ||
    shellContract.freshSetState !== expected.freshSetState ||
    gridContract.nextActionRoute !== expected.nextRoute ||
    shellContract.nextActionRoute !== expected.nextRoute ||
    gridContract.nextActionLabel !== expected.nextLabel ||
    shellContract.nextActionLabel !== expected.nextLabel ||
    freshSetSignal?.freshSetState !== expected.freshSetState ||
    (expected.freshReady && freshSetSignal?.ready !== "true") ||
    (expected.outcome && scoreSignal?.outcome !== expected.outcome) ||
    (expected.scorePercent && scoreSignal?.scorePercent !== expected.scorePercent) ||
    nextRouteSignal?.nextRoute !== expected.nextRoute ||
    nextRouteSignal?.nextLabel !== expected.nextLabel ||
    (expected.nextRoute.startsWith("/") && nextRouteSignal?.href !== expected.nextRoute)
  ) {
    throw new Error(`MCQ four-signal contract failed: ${JSON.stringify({ expected, shellContract, gridContract, signals }, null, 2)}`);
  }
}

async function seed(page) {
  const questions = [buildQuestion(1, "A"), buildQuestion(2, "B")];
  await page.addInitScript(
    ({ profileKey: studentProfileKey, progressKey: pk, mcqKey: mk, draftKey: dk, questions: seededQuestions }) => {
      if (localStorage.getItem("sarit-upsc-geography-mcq-simple-seeded") === "true") return;
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER");
      localStorage.setItem(
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
      localStorage.setItem(
        pk,
        JSON.stringify({
          ...Object.fromEntries(
            Array.from({ length: 7 }, (_, index) => {
              const day = index + 1;
              return [
                String(day),
                {
                  day,
                  watched: true,
                  talkScore: 96,
                  talkBand: "Command",
                  talkUnlockStage: "mcq",
                  mcqCompleted: true,
                  mcqOutcome: "Command",
                  mcqScorePercent: 90,
                  confidence: "Command",
                  updatedAt: new Date().toISOString(),
                },
              ];
            })
          ),
          "8": {
            day: 8,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["8-briefing", "8-mechanism", "8-map", "8-trap", "8-recap"],
            baselineKnowledge: "I know relief, drainage, and map location affect UPSC Geography traps.",
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            reflection: "Relief and structure must be explained through mechanism and map proof.",
            confidence: "Command",
            labCompleted: true,
            labMode: "india-map",
            labProofCompletedIds: ["concept", "map", "case", "trap", "answer"],
            labInsight: "Map proof saved for relief and structure.",
          },
        })
      );
      localStorage.setItem(
        mk,
        JSON.stringify({
          "GEO-D08": {
            planned: 2,
            drafted: 2,
            difficulty: "MEDIUM",
            status: "DRAFT",
            updatedAt: new Date().toISOString(),
          },
        })
      );
      localStorage.setItem(
        dk,
        JSON.stringify([
          {
            id: "local-geography-simple-practice",
            createdAt: new Date().toISOString(),
            importMode: "UPSC_MCQ_COMMAND",
            questions: seededQuestions,
          },
        ])
      );
      localStorage.setItem("sarit-upsc-geography-mcq-simple-seeded", "true");
    },
    { profileKey, progressKey, mcqKey, draftKey, questions }
  );
}

async function setBatchStatus(page, status) {
  await page.evaluate(
    ({ mcqKey: mk, status: nextStatus }) => {
      const command = JSON.parse(localStorage.getItem(mk) || "{}");
      command["GEO-D08"] = {
        ...(command["GEO-D08"] || {}),
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(mk, JSON.stringify(command));
    },
    { mcqKey, status }
  );
}

async function restoreTalkClearance(page) {
  await page.evaluate((key) => {
    const progress = JSON.parse(localStorage.getItem(key) || "{}");
    const day = { ...(progress["8"] || {}) };
    Object.keys(day).forEach((field) => {
      if (field.startsWith("mcq")) delete day[field];
      if (field.startsWith("recovery")) delete day[field];
    });
    day.revisitQueued = false;
    day.confidence = "Command";
    day.talkScore = 96;
    day.talkBand = "Command";
    day.talkUnlockStage = "mcq";
    progress["8"] = day;
    localStorage.setItem(key, JSON.stringify(progress));
  }, progressKey);
}

async function answerPractice(page, secondOption, checks, captureScreenshot = false) {
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  const activeTopPanelCount = await page.getByTestId("mcq-student-next-action-panel").count();
  const nextDisabledBeforeAnswer = await page.getByTestId("mcq-next-question").isDisabled();
  await page.getByTestId("mcq-practice-option-A").click();
  await page.getByTestId("mcq-practice-feedback").getByText("Correct answer", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-local-practice-score").getByText("Progress 1/2 answered", { exact: false }).waitFor({ timeout: 15000 });
  const optionLockedAfterAnswer = await page.getByTestId("mcq-practice-option-B").isDisabled();
  const nextEnabledAfterAnswer = !(await page.getByTestId("mcq-next-question").isDisabled());
  if (captureScreenshot) {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }
  await page.getByTestId("mcq-next-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-previous-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-question").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 2 of 2", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId(`mcq-practice-option-${secondOption}`).click();
  checks.push({
    label: "geography-mcq-one-action-runner",
    activeTopPanelCount,
    nextDisabledBeforeAnswer,
    optionLockedAfterAnswer,
    nextEnabledAfterAnswer,
    backwardReviewPreserved: true,
  });
  if (activeTopPanelCount !== 0 || !nextDisabledBeforeAnswer || !optionLockedAfterAnswer || !nextEnabledAfterAnswer) {
    throw new Error("MCQ runner did not preserve one-action first-attempt behavior.");
  }
}

async function proveDay1FreshIntake(page, checks) {
  await page.evaluate(
    ({ draftKey: dk, mcqKey: mk, progressKey: pk, profileKey: studentProfileKey }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER");
      localStorage.removeItem(dk);
      localStorage.removeItem(mk);
      localStorage.setItem(
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
      localStorage.setItem(
        pk,
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            reflection: "Geographic thinking connects what, where, why, map relationships and one UPSC trap.",
            confidence: "Command",
          },
        })
      );
    },
    { draftKey, mcqKey, progressKey, profileKey }
  );

  const contextUrl = `${baseUrl}/admin/questions/bulk?mode=UPSC_MCQ_COMMAND&subject=geography&day=1&batch=GEO-D01&return=%2Fupsc%2Fgeography%2Fmcq-readiness%3Fday%3D1`;
  await page.goto(contextUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("bulk-upsc-context-panel").waitFor({ timeout: 15000 });

  await page.locator('input[type="file"]').setInputFiles({
    name: "geography-day1-weak.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(buildDay1IntakeCsv(1)),
  });
  await page.getByTestId("bulk-geography-quality-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-status").getByText("Review required", { exact: false }).waitFor({ timeout: 15000 });
  const weakIntakeBlocked = await page.getByRole("button", { name: /Start Ingestion/i }).isDisabled();
  if (!weakIntakeBlocked) throw new Error("A one-question Day 1 launch set should remain blocked.");

  await page.locator('input[type="file"]').setInputFiles({
    name: "geography-day1-reviewed.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(buildDay1IntakeCsv(25)),
  });
  await page.getByTestId("bulk-geography-quality-status").getByText("Ready to import", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-score-geo-d01").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Start Ingestion/i }).click();
  await page.getByText("Saved 25 questions to local draft bank", { exact: false }).waitFor({ timeout: 15000 });

  const day1CommandState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["GEO-D01"], mcqKey);
  if (day1CommandState?.drafted !== 25 || day1CommandState?.status !== "READY") {
    throw new Error(`Day 1 audited intake did not become READY: ${JSON.stringify(day1CommandState)}`);
  }

  await page.getByTestId("bulk-return-to-mcq").click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=1/, { timeout: 15000 });
  await page.getByRole("heading", { name: "Start practice", exact: true }).waitFor({ timeout: 15000 });
  const learnerText = await page.locator("body").innerText();
  const leakedOperatorTerms = ["GEO-D01", "DRAFT", "batch", "uploaded", "local draft bank", "UPSC MCQ Command"].filter((term) =>
    learnerText.toLowerCase().includes(term.toLowerCase())
  );
  if (leakedOperatorTerms.length > 0) {
    throw new Error(`Day 1 learner handoff leaked operator language: ${JSON.stringify({ leakedOperatorTerms, learnerText })}`);
  }
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 25", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-day1-reviewed-intake-learner-handoff", checks);
  checks.push({ label: "geography-day1-fresh-intake-boundary", weakIntakeBlocked, day1CommandState, leakedOperatorTerms });

  return { weakIntakeBlocked, day1CommandState, leakedOperatorTerms };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seed(page);
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=8`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByText("Practice is being prepared", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-mcq-advanced-tools").waitFor({ timeout: 15000 });
  await assertMcqFourSignalContract(
    page,
    {
      label: "geography-mcq-four-signal-preparing",
      freshSetState: "preparing",
      nextRoute: "",
      nextLabel: "Wait for reviewed set",
      outcome: "Pending",
      scorePercent: "0",
    },
    checks
  );
  await assertStudentCopy(page, "geography-mcq-preparing-copy", checks);
  await assertNoOverflow(page, "geography-mcq-preparing-desktop", checks);

  await setBatchStatus(page, "READY");
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("heading", { name: "Start practice", exact: true }).waitFor({ timeout: 15000 });
  const readyFlowStrip = await page.getByTestId("mcq-simple-flow-strip").evaluate((element) => ({
    text: element.textContent || "",
    open: element.open,
  }));
  const readyClearanceProofText = await page.getByTestId("mcq-talk-clearance-proof").innerText();
  const levelShell = await page.getByTestId("geography-mcq-level-shell").evaluate((element) => ({
    learnerLevel: element.getAttribute("data-learner-level"),
    visibleMode: element.getAttribute("data-visible-mode"),
    studentSurface: element.getAttribute("data-student-surface"),
  }));
  const nextActionPanel = await page.getByTestId("mcq-student-next-action-panel").evaluate((element) => ({
    studentSurface: element.getAttribute("data-student-surface"),
  }));
  const levelBadgeText = await page.getByTestId("geography-mcq-level-badge").innerText();
  const levelCopyText = await page.getByTestId("geography-mcq-level-copy").innerText();
  await assertMcqFourSignalContract(
    page,
    {
      label: "geography-mcq-four-signal-ready",
      freshSetState: "ready",
      freshReady: true,
      nextRoute: "#practice",
      nextLabel: "Start practice",
      outcome: "Pending",
      scorePercent: "0",
    },
    checks
  );
  checks.push({
    label: "geography-mcq-visible-funnel-ready",
    readyFlowStrip,
    readyClearanceProofText,
    levelShell,
    nextActionPanel,
    levelBadgeText,
    levelCopyText,
  });
  for (const expected of ["Talk 95%", "Fresh MCQ", "Next topic"]) {
    if (!readyFlowStrip.text.includes(expected)) {
      throw new Error(`MCQ folded funnel missing ${expected}: ${readyFlowStrip.text}`);
    }
  }
  if (
    readyFlowStrip.open !== false ||
    levelShell.visibleMode !== "single-action-practice" ||
    levelShell.studentSurface !== "compact-one-action" ||
    nextActionPanel.studentSurface !== "primary-action"
  ) {
    throw new Error(`MCQ ready surface should be single-action with folded support detail: ${JSON.stringify({ readyFlowStrip, levelShell, nextActionPanel })}`);
  }
  if (!readyClearanceProofText.toLowerCase().includes("96% recall")) {
    throw new Error(`MCQ clearance proof should show 96% recall: ${readyClearanceProofText}`);
  }
  if (
    levelShell.learnerLevel !== "advanced" ||
    !levelBadgeText.includes("Advanced practice") ||
    !levelCopyText.includes("short fresh set") ||
    levelCopyText.length > 140
  ) {
    throw new Error(`MCQ level-aware copy mismatch: ${JSON.stringify({ levelShell, levelBadgeText, levelCopyText })}`);
  }
  await assertStudentCopy(page, "geography-mcq-ready-copy", checks);
  await assertNoOverflow(page, "geography-mcq-simple-desktop", checks);

  await answerPractice(page, "A", checks, true);
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Short revision required", { exact: false }).waitFor({ timeout: 15000 });
  const revisitRouteHref = await page.getByTestId("mcq-student-next-action").getAttribute("href");
  const revisitVisibleActionCount = await page.locator('[data-testid="mcq-student-next-action"], [data-testid="mcq-practice-outcome-route"]').count();
  checks.push({ label: "geography-mcq-revisit-single-action", revisitVisibleActionCount });
  if (revisitVisibleActionCount !== 1) {
    throw new Error(`Completed weak practice should expose one next action, got ${revisitVisibleActionCount}.`);
  }
  await assertMcqFourSignalContract(
    page,
    {
      label: "geography-mcq-four-signal-revisit",
      freshSetState: "ready",
      freshReady: true,
      nextRoute: "/upsc/geography/revisit?day=8",
      nextLabel: "Open short revision",
      outcome: "Revisit",
      scorePercent: "50",
    },
    checks
  );
  if (!revisitRouteHref || !revisitRouteHref.includes("/upsc/geography/revisit?day=8")) {
    throw new Error(`Expected revisit route, got ${revisitRouteHref}`);
  }

  const revisitProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["8"], progressKey);
  if (!revisitProgress?.mcqCompleted || revisitProgress.mcqCorrectCount !== 1 || revisitProgress.mcqTotal !== 2 || revisitProgress.mcqScorePercent !== 50 || revisitProgress.revisitQueued !== true) {
    throw new Error(`MCQ revisit result did not persist correctly: ${JSON.stringify(revisitProgress)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByText("Repair this topic", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-next-action").getByText("Open short revision", { exact: false }).waitFor({ timeout: 15000 });
  if ((await page.getByTestId("mcq-start-local-practice").count()) !== 0) {
    throw new Error("Completed weak practice reopened the runner after reload.");
  }
  await assertStudentCopy(page, "geography-mcq-revisit-copy", checks);
  await assertNoOverflow(page, "geography-mcq-revisit-mobile", checks);

  await page.getByTestId("mcq-student-next-action").click();
  await page.waitForURL("**/upsc/geography/revisit?day=8", { timeout: 15000 });
  await page.getByRole("heading", { name: "Write one repair note", exact: true }).waitFor({ timeout: 15000 });
  const revisitButtonDisabledBeforeNote = await page.getByTestId("revisit-complete-and-talk").isDisabled();
  if (!revisitButtonDisabledBeforeNote) {
    throw new Error("Short revision should require one correction note before returning to discussion.");
  }
  const checklistHiddenByDefault = !(await page.getByTestId("revisit-proof-recall").isVisible());
  if (!checklistHiddenByDefault) {
    throw new Error("Short revision checklist should stay folded until requested.");
  }
  await page.getByTestId("revisit-repair-note").fill(
    "I corrected the relief explanation by connecting mechanism, map location, one India example, and the UPSC trap."
  );
  await page.getByTestId("revisit-repair-note").blur();
  await page.getByText("Repair note saved.", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-complete-and-talk").click();
  await page.waitForURL("**/upsc/geography/talk?day=8", { timeout: 15000 });

  const repairedProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["8"], progressKey);
  const requiredRecoveryIds = ["recall", "explain", "map", "trap", "retest"].map((stage) => `8-recovery-${stage}`);
  const missingRecoveryIds = requiredRecoveryIds.filter((id) => !repairedProgress?.recoveryProofCompletedIds?.includes(id));
  if (
    repairedProgress?.recoveryCompleted !== true ||
    repairedProgress?.revisitQueued !== false ||
    repairedProgress?.recoveryStatus !== "talk-ready" ||
    repairedProgress?.mcqNextRoute !== "/upsc/geography/talk?day=8" ||
    repairedProgress?.mcqNextActionLabel !== "Explain corrected answer" ||
    !repairedProgress?.recoverySummary?.includes("mechanism") ||
    missingRecoveryIds.length > 0 ||
    Object.prototype.hasOwnProperty.call(repairedProgress, "talkScore") ||
    Object.prototype.hasOwnProperty.call(repairedProgress, "talkBand")
  ) {
    throw new Error(`Short revision did not persist cleanly: ${JSON.stringify({ repairedProgress, missingRecoveryIds })}`);
  }
  checks.push({
    label: "geography-short-revision-continuity",
    revisitButtonDisabledBeforeNote,
    checklistHiddenByDefault,
    returnUrl: page.url(),
    mcqNextRoute: repairedProgress?.mcqNextRoute,
    mcqNextActionLabel: repairedProgress?.mcqNextActionLabel,
    missingRecoveryIds,
  });
  await assertNoOverflow(page, "geography-short-revision-return-mobile", checks);

  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("daily-learning-dashboard").waitFor({ timeout: 15000 });
  const postRecoveryStartHref = await page.getByTestId("daily-today-task").getAttribute("href");
  const postRecoveryGapText = (await page.getByTestId("daily-learning-gap").innerText()).trim();
  if (
    postRecoveryStartHref !== "/upsc/geography/talk?day=8" ||
    !postRecoveryGapText.includes("Explain corrected answer") ||
    postRecoveryGapText.includes("MCQ trap repair")
  ) {
    throw new Error(
      `Post-recovery dashboard should point to corrected Talk, not active MCQ repair: ${JSON.stringify({
        postRecoveryStartHref,
        postRecoveryGapText,
      })}`
    );
  }
  checks.push({ label: "geography-post-recovery-dashboard-next-action", postRecoveryStartHref, postRecoveryGapText });
  await assertNoOverflow(page, "geography-post-recovery-dashboard-mobile", checks);

  await restoreTalkClearance(page);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=8`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("heading", { name: "Start practice", exact: true }).waitFor({ timeout: 15000 });
  await answerPractice(page, "B", checks);
  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command cleared", { exact: true }).waitFor({ timeout: 15000 });
  const commandRouteHref = await page.getByTestId("mcq-student-next-action").getAttribute("href");
  const commandNextTopicProof = await page.getByTestId("mcq-next-topic-proof").innerText();
  const commandFlowStrip = await page.getByTestId("mcq-simple-flow-strip").evaluate((element) => ({
    text: element.textContent || "",
    open: element.open,
  }));
  const commandVisibleActionCount = await page.locator('[data-testid="mcq-student-next-action"], [data-testid="mcq-practice-outcome-route"]').count();
  await assertMcqFourSignalContract(
    page,
    {
      label: "geography-mcq-four-signal-command",
      freshSetState: "ready",
      freshReady: true,
      nextRoute: "/upsc/geography/talk?day=9",
      nextLabel: "Continue to next topic",
      outcome: "Command",
      scorePercent: "100",
    },
    checks
  );
  checks.push({ label: "geography-mcq-command-single-action", commandVisibleActionCount, commandNextTopicProof, commandFlowStrip });
  if (commandVisibleActionCount !== 1) {
    throw new Error(`Completed command practice should expose one next action, got ${commandVisibleActionCount}.`);
  }
  if (!commandRouteHref || !commandRouteHref.includes("/upsc/geography/talk?day=9")) {
    throw new Error(`Expected next-topic Talk route for advanced learner, got ${commandRouteHref}`);
  }
  if (
    !commandNextTopicProof.includes("/upsc/geography/talk?day=9") ||
    !commandFlowStrip.text.toLowerCase().includes("day 9 opens automatically")
  ) {
    throw new Error(`Command result did not expose the automatic next-topic route: ${JSON.stringify({ commandNextTopicProof, commandFlowStrip })}`);
  }
  if (commandFlowStrip.open !== false) {
    throw new Error(`Command result should keep MCQ support flow folded: ${JSON.stringify(commandFlowStrip)}`);
  }

  const commandProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["8"], progressKey);
  if (!commandProgress?.mcqCompleted || commandProgress.mcqCorrectCount !== 2 || commandProgress.mcqTotal !== 2 || commandProgress.mcqScorePercent !== 100 || commandProgress.revisitQueued !== false) {
    throw new Error(`MCQ command result did not persist correctly: ${JSON.stringify(commandProgress)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("heading", { name: "Continue to next topic", exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-student-next-action").getByText("Continue to next topic", { exact: false }).waitFor({ timeout: 15000 });
  if ((await page.getByTestId("mcq-start-local-practice").count()) !== 0) {
    throw new Error("Completed command practice reopened the runner after reload.");
  }
  await assertStudentCopy(page, "geography-mcq-command-copy", checks);
  await assertNoOverflow(page, "geography-mcq-command-mobile", checks);

  await page.setViewportSize({ width: 1366, height: 900 });
  const day1FreshIntake = await proveDay1FreshIntake(page, checks);

  await browser.close();

  const evidence = {
    baseUrl,
    checks,
    revisitRouteHref,
    revisitProgress,
    repairedProgress,
    commandRouteHref,
    commandProgress,
    day1FreshIntake,
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
