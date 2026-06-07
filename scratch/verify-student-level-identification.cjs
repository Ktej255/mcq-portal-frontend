const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "verify-student-level-identification-evidence.json");
const screenshotPath = path.join(__dirname, "verify-student-level-identification-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const cases = [
  {
    stage: "not-started",
    expectedLevel: "beginner",
    expectedHref: "/upsc/geography/watch?day=1",
    expectedRoom: "watch",
    expectedProof: "Identified as Beginner",
    expectedRoute: "Lesson -> Talk 95% -> MCQ -> next topic",
    expectedPathWords: ["Learn", "Discuss", "MCQ", "Next"],
  },
  {
    stage: "coaching-complete",
    expectedLevel: "intermediate",
    expectedHref: "/upsc/geography/talk?day=1",
    expectedRoom: "talk",
    expectedProof: "Identified as Intermediate",
    expectedRoute: "Diagnosis -> repair only if needed -> MCQ",
    expectedPathWords: ["Diagnose", "Repair", "MCQ", "Next"],
  },
  {
    stage: "multiple-attempts",
    expectedLevel: "advanced",
    expectedHref: "/upsc/geography/talk?day=1",
    expectedRoom: "talk",
    expectedProof: "Identified as Advanced",
    expectedRoute: "Attempt-gap diagnosis -> precision repair -> MCQ",
    expectedPathWords: ["Diagnose", "Repair", "MCQ", "Next"],
  },
];

async function seedCleanSession(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_level_identification");
      window.localStorage.removeItem(studentProfileKey);
      window.localStorage.removeItem(geographyProgressKey);
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey },
  );
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate((currentLabel) => ({
    label: currentLabel,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  }), label);
  checks.push(metrics);
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
}

async function runCase(page, scenario, checks) {
  await seedCleanSession(page);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-profile-intake").waitFor({ timeout: 15000 });
  await page.getByTestId(`upsc-intake-${scenario.stage}`).click();
  await page.waitForURL(`**${scenario.expectedHref}`, { timeout: 15000 });
  if (scenario.expectedRoom === "watch") {
    await page.getByTestId("geography-watch-simple-repair").waitFor({ timeout: 15000 });
  } else {
    await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });
  }
  const directEntryUrl = new URL(page.url()).pathname + new URL(page.url()).search;

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });

  const dashboard = page.getByTestId("upsc-simple-dashboard");
  const startToday = page.getByTestId("upsc-start-today");
  const classificationProofText = ((await page.getByTestId("upsc-classification-proof").textContent()) || "").trim();
  const mainPathStrip = await page.getByTestId("upsc-main-path-strip").evaluate((node) => ({
    text: (node.textContent || "").trim(),
    open: node.open,
  }));
  const oneActionRuleText = ((await page.getByTestId("upsc-one-action-rule").textContent()) || "").trim();
  const savedProfile = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "null"), profileKey);
  const result = {
    label: `identify-${scenario.expectedLevel}`,
    directEntryUrl,
    dashboardLevel: await dashboard.getAttribute("data-student-level"),
    dashboardStage: await dashboard.getAttribute("data-preparation-stage"),
    dashboardRoom: await dashboard.getAttribute("data-next-action-room"),
    dashboardHref: await dashboard.getAttribute("data-next-action-href"),
    startHref: await startToday.getAttribute("href"),
    startRoom: await startToday.getAttribute("data-next-action-room"),
    startLevel: await startToday.getAttribute("data-student-level"),
    classificationProofText,
    mainPathStrip,
    dashboardVisibleMode: await dashboard.getAttribute("data-visible-mode"),
    oneActionRuleText,
    savedProfile,
  };
  checks.push(result);

  if (result.dashboardLevel !== scenario.expectedLevel || result.startLevel !== scenario.expectedLevel) {
    throw new Error(`${result.label}: expected level ${scenario.expectedLevel}, got ${JSON.stringify(result)}`);
  }
  if (result.directEntryUrl !== scenario.expectedHref) {
    throw new Error(`${result.label}: intake should open ${scenario.expectedHref}, got ${JSON.stringify(result)}`);
  }
  if (result.dashboardStage !== scenario.stage || result.savedProfile?.preparationStage !== scenario.stage) {
    throw new Error(`${result.label}: expected preparation stage ${scenario.stage}, got ${JSON.stringify(result)}`);
  }
  if (result.savedProfile?.level !== scenario.expectedLevel) {
    throw new Error(`${result.label}: saved profile did not normalize level: ${JSON.stringify(result.savedProfile)}`);
  }
  if (result.dashboardRoom !== scenario.expectedRoom || result.startRoom !== scenario.expectedRoom) {
    throw new Error(`${result.label}: expected room ${scenario.expectedRoom}, got ${JSON.stringify(result)}`);
  }
  if (result.dashboardHref !== scenario.expectedHref || result.startHref !== scenario.expectedHref) {
    throw new Error(`${result.label}: expected href ${scenario.expectedHref}, got ${JSON.stringify(result)}`);
  }
  if (!result.classificationProofText.includes(scenario.expectedProof) || !result.classificationProofText.includes(scenario.expectedRoute)) {
    throw new Error(`${result.label}: classification proof is wrong: ${result.classificationProofText}`);
  }
  for (const word of scenario.expectedPathWords) {
    if (!result.mainPathStrip.text.includes(word)) {
      throw new Error(`${result.label}: expected path word ${word}, got ${result.mainPathStrip.text}`);
    }
  }
  if (result.mainPathStrip.open !== false || result.dashboardVisibleMode !== "four-signal-one-action") {
    throw new Error(`${result.label}: expected folded one-action dashboard path support, got ${JSON.stringify(result)}`);
  }
  if (!result.oneActionRuleText.includes("Use the main button only")) {
    throw new Error(`${result.label}: one-action rule missing: ${result.oneActionRuleText}`);
  }
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

  for (const scenario of cases) {
    await runCase(page, scenario, checks);
    await assertNoOverflow(page, `dashboard-${scenario.expectedLevel}-desktop`, checks);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await runCase(page, cases[0], checks);
  await assertNoOverflow(page, "dashboard-beginner-mobile", checks);
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
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
