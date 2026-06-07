const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "verify-adaptive-teacher-talk-evidence.json");

const diagnosticAnswer =
  "Geographic thinking and map relationships ask what, where and why. Absolute and relative location, site, situation and scale help read an India map because location creates different effects.";

async function assertNoOverflow(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_adaptive_teacher_talk");
      localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: "advanced",
          preparationStage: "multiple-attempts",
          studyWindow: "90",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "two-plus-attempts",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        }),
      );
      localStorage.removeItem(geographyProgressKey);
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey },
  );

  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByText("Why did this topic still cost marks?", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-level-mode").getByText("Advanced attempt-gap diagnosis", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-answer-draft").fill(diagnosticAnswer);
  await page.getByTestId("talk-assess-answer").click();
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-talk-doubt-diagnosis").getByText("Doubt diagnosis", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-talk-doubt-diagnosis").getByText("Repair action", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-talk-doubt-diagnosis").getByText("Mastery check", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-talk-command-summary").getByText("Teacher command", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-talk-command-summary").getByText("Repair", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-talk-command-summary").getByText("Check", { exact: true }).waitFor({ timeout: 15000 });
  await page.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key) || "{}")["1"]?.teacherMode === "local-fallback",
    progressKey,
    { timeout: 15000 },
  );

  const routeGate = await page.getByTestId("talk-route-gate").evaluate((element) => ({
    learnerLevel: element.getAttribute("data-learner-level"),
    score: Number(element.getAttribute("data-score")),
    target: Number(element.getAttribute("data-recall-target")),
    href: element.getAttribute("data-next-action-route"),
    label: element.getAttribute("data-next-action-label"),
    mcqReady: element.getAttribute("data-mcq-ready"),
  }));
  const commandSummary = await page.getByTestId("geography-talk-command-summary").evaluate((element) => ({
    proofRule: element.getAttribute("data-proof-rule"),
    gapCategory: element.getAttribute("data-gap-category"),
    teacherStatus: element.getAttribute("data-teacher-status"),
    score: Number(element.getAttribute("data-score")),
    target: Number(element.getAttribute("data-recall-target")),
    href: element.getAttribute("data-next-action-route"),
    label: element.getAttribute("data-next-action-label"),
    mcqReady: element.getAttribute("data-mcq-ready"),
    text: element.textContent || "",
  }));
  const masteryPlanVisible = await page.getByTestId("talk-mastery-plan").isVisible().catch(() => false);
  const repeatTo95Visible = await page.getByTestId("talk-repeat-to-95").isVisible().catch(() => false);
  const persistedTeacherTrace = await page.evaluate((key) => {
    const progress = JSON.parse(localStorage.getItem(key) || "{}")["1"];
    return {
      teacherMode: progress?.teacherMode,
      teacherPromptVersion: progress?.teacherPromptVersion,
      teacherRubricVersion: progress?.teacherRubricVersion,
      teacherRecallTarget: progress?.teacherRecallTarget,
      teacherCoachNextPrompt: progress?.teacherCoachNextPrompt,
      teacherCoachSummary: progress?.teacherCoachSummary,
      teacherDoubtCategory: progress?.teacherDoubtCategory,
      teacherDoubtReason: progress?.teacherDoubtReason,
      teacherDoubtRepairAction: progress?.teacherDoubtRepairAction,
      teacherDoubtMasteryCheck: progress?.teacherDoubtMasteryCheck,
    };
  }, progressKey);
  const doubtDiagnosisText = await page.getByTestId("geography-talk-doubt-diagnosis").innerText();
  const metrics = await assertNoOverflow(page);
  const evidence = {
    baseUrl,
    checks: {
      routeGate,
      commandSummary,
      masteryPlanVisible,
      repeatTo95Visible,
      doubtDiagnosisText,
      persistedTeacherTrace,
      metrics,
    },
    consoleErrors,
    pageErrors,
    passed:
      routeGate.learnerLevel === "advanced" &&
      routeGate.score > 0 &&
      routeGate.score < 95 &&
      routeGate.target === 95 &&
      routeGate.href === "/upsc/geography/watch?day=1" &&
      routeGate.label === "Open repair lesson" &&
      routeGate.mcqReady === "false" &&
      commandSummary.proofRule === "ai-teacher-gap-repair-mastery-next" &&
      Boolean(commandSummary.gapCategory) &&
      commandSummary.teacherStatus === "repair-required" &&
      commandSummary.score === routeGate.score &&
      commandSummary.target === 95 &&
      commandSummary.href === "/upsc/geography/watch?day=1" &&
      commandSummary.label === "Open repair lesson" &&
      commandSummary.mcqReady === "false" &&
      /teacher command/i.test(commandSummary.text) &&
      /repair/i.test(commandSummary.text) &&
      /check/i.test(commandSummary.text) &&
      !masteryPlanVisible &&
      !repeatTo95Visible &&
      persistedTeacherTrace.teacherMode === "local-fallback" &&
      persistedTeacherTrace.teacherPromptVersion === "upsc-teacher-2026-06-03.2" &&
      persistedTeacherTrace.teacherRubricVersion === "upsc-recall-rubric-2026-06-03.1" &&
      persistedTeacherTrace.teacherRecallTarget === 95 &&
      Boolean(persistedTeacherTrace.teacherDoubtCategory) &&
      Boolean(persistedTeacherTrace.teacherDoubtReason) &&
      Boolean(persistedTeacherTrace.teacherDoubtRepairAction) &&
      Boolean(persistedTeacherTrace.teacherDoubtMasteryCheck) &&
      /doubt diagnosis/i.test(doubtDiagnosisText) &&
      /attempt-gap|attempt|diagnos/i.test(persistedTeacherTrace.teacherCoachNextPrompt || "") &&
      !metrics.hasHorizontalOverflow &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0,
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
