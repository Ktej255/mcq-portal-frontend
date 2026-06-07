const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const environmentProgressKey = "sarit-upsc-environment-progress-v1";
const dailyCommandKey = "sarit-upsc-daily-command-v1";
const evidencePath = path.join(__dirname, "verify-student-report-system-evidence.json");

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

async function seedProfileAndProgress(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, envProgressStorageKey, dailyStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_report_system");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: "advanced",
          preparationStage: "multiple-attempts",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        dailyStorageKey,
        JSON.stringify({
          subjectSlug: "geography",
          day: 1,
          note: "Report should show the same repair lock as Daily Mission.",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        progressStorageKey,
        JSON.stringify({
          1: {
            day: 1,
            watched: true,
            talkScore: 62,
            talkBand: "Revisit",
            revisitQueued: true,
            teacherDoubtCategory: "Mechanism",
            teacherDoubtReason: "The answer names location but misses the cause-effect chain.",
            teacherDoubtRepairAction: "Build one because-chain for location, relief, rainfall, and consequence.",
            teacherDoubtMasteryCheck: "Can the learner explain the sequence without skipping the middle cause?",
            meTimeCompletedAt: new Date().toISOString(),
            meTimeMood: "focused",
            updatedAt: new Date().toISOString(),
          },
          5: {
            day: 5,
            watched: true,
            talkScore: 96,
            talkBand: "Command",
            confidence: "Command",
            mcqCompleted: true,
            mcqScorePercent: 80,
            meTimeCompletedAt: new Date().toISOString(),
            meTimeMood: "calm",
            updatedAt: new Date().toISOString(),
          },
          6: {
            day: 6,
            reflection: "Ocean currents and marine heatwaves are linked.",
            talkScore: 88,
            talkBand: "Practice",
            mcqCompleted: true,
            mcqScorePercent: 60,
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        envProgressStorageKey,
        JSON.stringify({
          1: {
            day: 1,
            watched: true,
            reflection: "Ecology foundation is connected with habitat and niche.",
            talkScore: 97,
            talkBand: "Command",
            confidence: "Command",
            mcqCompleted: true,
            mcqScorePercent: 84,
            meTimeCompletedAt: new Date().toISOString(),
            meTimeMood: "exam-stress",
            meTimeResetPlan: "Two-minute breathing and one diagram before class.",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    {
      profileStorageKey: profileKey,
      progressStorageKey: progressKey,
      envProgressStorageKey: environmentProgressKey,
      dailyStorageKey: dailyCommandKey,
    }
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedProfileAndProgress(page);
  await page.goto(`${baseUrl}/reports`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("student-gap-primary-action").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-current-readiness-report").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-all-subject-report").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-auto-report-proof").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-all-subject-report-windows").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-report-evidence-streams").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-growth-scale").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-monthly-report").waitFor({ timeout: 15000 });

  const href = await page.getByTestId("student-gap-primary-action").getAttribute("href");
  const readinessReport = await page.getByTestId("upsc-current-readiness-report").evaluate((node) => ({
    subject: node.getAttribute("data-readiness-subject"),
    day: node.getAttribute("data-readiness-day"),
    status: node.getAttribute("data-readiness-status"),
    score: node.getAttribute("data-readiness-score"),
    text: node.textContent || "",
  }));
  const readinessHref = await page.getByTestId("upsc-current-readiness-action").getAttribute("href");
  const allSubjectText = await page.getByTestId("upsc-all-subject-report").innerText();
  const autoReportProof = await page.getByTestId("upsc-auto-report-proof").evaluate((node) => ({
    weeklyReportId: node.getAttribute("data-weekly-report-id"),
    monthlyReportId: node.getAttribute("data-monthly-report-id"),
    text: node.textContent || "",
  }));
  const allSubjectWindowText = await page.getByTestId("upsc-all-subject-report-windows").innerText();
  const allSubjectWeeklyCount = await page.getByTestId("upsc-all-subject-weekly-report").count();
  const allSubjectMonthlyText = await page.getByTestId("upsc-all-subject-monthly-report").innerText();
  const subjectCardCount = await page.getByTestId("upsc-subject-report-card").count();
  const weeklyCount = await page.getByTestId("upsc-weekly-report").count();
  const evidenceText = await page.getByTestId("upsc-report-evidence-streams").innerText();
  const monthlyText = await page.getByTestId("upsc-monthly-report").innerText();
  const growthText = await page.getByTestId("upsc-growth-scale").innerText();
  const environmentCardText = await page
    .locator('[data-testid="upsc-subject-report-card"][data-subject-slug="environment"]')
    .innerText();
  const geographyCardText = await page
    .locator('[data-testid="upsc-subject-report-card"][data-subject-slug="geography"]')
    .innerText();

  checks.push({
    label: "report-system-content",
    href,
    readinessReport,
    readinessHref,
    subjectCardCount,
    weeklyCount,
    allSubjectWeeklyCount,
    allSubjectText,
    autoReportProof,
    allSubjectWindowText,
    allSubjectMonthlyText,
    geographyCardText,
    environmentCardText,
    evidenceText,
    monthlyText,
    growthText,
  });

  if (href !== "/upsc/geography/revisit?day=1") {
    throw new Error(`Gap CTA should still open recovery day 1, got ${href}`);
  }
  if (
    readinessReport.subject !== "geography" ||
    readinessReport.day !== "1" ||
    readinessReport.status !== "Repair lock" ||
    readinessReport.score !== "60" ||
    readinessHref !== "/upsc/geography/talk?day=1" ||
    !/current session readiness/i.test(readinessReport.text) ||
    !/because-chain/i.test(readinessReport.text)
  ) {
    throw new Error(`Current readiness report is not synced with Daily Mission: ${JSON.stringify({ readinessReport, readinessHref })}`);
  }
  if (weeklyCount !== 4) {
    throw new Error(`Expected 4 weekly report cards, got ${weeklyCount}`);
  }
  if (allSubjectWeeklyCount !== 4) {
    throw new Error(`Expected 4 all-subject weekly report cards, got ${allSubjectWeeklyCount}`);
  }
  const normalizedAllSubjectText = allSubjectText.toLowerCase();
  if (subjectCardCount !== 8 || !normalizedAllSubjectText.includes("environment") || !normalizedAllSubjectText.includes("weekly reports")) {
    throw new Error(`All-subject report missing expected evidence: ${JSON.stringify({ subjectCardCount, allSubjectText })}`);
  }
  const compactAllSubjectText = allSubjectText.replace(/\s+/g, " ");
  if (!/current affairs\s+3/i.test(compactAllSubjectText) || !/me-time\s+3/i.test(compactAllSubjectText) || !/ai gaps\s+1/i.test(compactAllSubjectText)) {
    throw new Error(`All-subject report should count Geography and Environment evidence: ${allSubjectText}`);
  }
  const compactWindowText = allSubjectWindowText.replace(/\s+/g, " ");
  if (
    !/All-subject monthly report/i.test(allSubjectMonthlyText) ||
    !/AI repair active/i.test(allSubjectMonthlyText) ||
    !/AI gaps\s+1/i.test(compactWindowText) ||
    !/Me-time\s+3/i.test(compactWindowText) ||
    !/News\s+3/i.test(compactWindowText)
  ) {
    throw new Error(`All-subject report windows missing generated evidence: ${allSubjectWindowText}`);
  }
  if (!/latest ai gap:\s*mechanism/i.test(geographyCardText) || !/because-chain/i.test(geographyCardText)) {
    throw new Error(`Geography report card missing AI teacher gap evidence: ${geographyCardText}`);
  }
  if (!/exam stress: grounding needed/i.test(environmentCardText) || !/covered news\s+1 hook/i.test(environmentCardText.replace(/\s+/g, " "))) {
    throw new Error(`Environment report card missing readiness or covered-news evidence: ${environmentCardText}`);
  }
  const compactAutoReportProof = autoReportProof.text.replace(/\s+/g, " ");
  if (
    autoReportProof.weeklyReportId !== "all-subject-week-1" ||
    autoReportProof.monthlyReportId !== "all-subject-month" ||
    !/Auto-generated report proof/i.test(compactAutoReportProof) ||
    !/Weekly and monthly reports rebuild from evidence/i.test(compactAutoReportProof) ||
    !/No manual spreadsheet/i.test(compactAutoReportProof) ||
    !/Only saved learning evidence is counted/i.test(compactAutoReportProof) ||
    !/Growth start\s*Geography: 3\/30 days started/i.test(compactAutoReportProof) ||
    !/Growth now\s*1 AI teacher gap active/i.test(compactAutoReportProof) ||
    !/Clear the latest AI teacher gap/i.test(compactAutoReportProof)
  ) {
    throw new Error(`Auto-report proof missing cadence, IDs, or growth evidence: ${JSON.stringify(autoReportProof)}`);
  }
  const normalizedEvidence = `${evidenceText}\n${monthlyText}`.toLowerCase();
  for (const expectedText of ["recall", "mcq", "revision", "me-time", "current affairs", "2 unlocked"]) {
    if (!normalizedEvidence.includes(expectedText)) {
      throw new Error(`Report missing expected text: ${expectedText}`);
    }
  }
  if (!growthText.includes("Geography movement")) {
    throw new Error(`Growth scale missing movement label: ${growthText}`);
  }

  await assertNoOverflow(page, "reports-desktop", checks);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/reports`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-readiness-report").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-all-subject-report").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-auto-report-proof").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-all-subject-report-windows").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-report-evidence-streams").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "reports-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
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
