const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-upsc-intake-classification-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "verify-upsc-intake-classification-final.png");
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const scenarios = [
  {
    id: "not-started",
    level: "beginner",
    expectedStage: "not-started",
    expectedAttempt: "no-attempt",
    expectedPathname: "/upsc/geography/watch",
    expectedRoomTestId: "geography-watch-simple-repair",
    expectedFlowState: "lesson-open",
  },
  {
    id: "coaching-complete",
    level: "intermediate",
    expectedStage: "coaching-complete",
    expectedAttempt: "no-attempt",
    expectedPathname: "/upsc/geography/talk",
    expectedRoomTestId: "geography-talk-simple-panel",
    expectedFlowState: "answer-required",
  },
  {
    id: "multiple-attempts",
    level: "advanced",
    expectedStage: "multiple-attempts",
    expectedAttempt: "two-plus-attempts",
    expectedPathname: "/upsc/geography/talk",
    expectedRoomTestId: "geography-talk-simple-panel",
    expectedFlowState: "answer-required",
  },
];

async function reset(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey, mcqStorageKey }) => {
      sessionStorage.clear();
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sarit-upsc-") || key === "MOCK_TOKEN") localStorage.removeItem(key);
      });
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_UPSC_INTAKE_CLASSIFICATION");
      localStorage.removeItem(studentProfileKey);
      localStorage.removeItem(geographyProgressKey);
      localStorage.removeItem(mcqStorageKey);
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey, mcqStorageKey: mcqKey }
  );
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsRetiredBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsRetiredBranding) throw new Error(`${label} contains retired branding.`);
}

async function inspectScenario(page, scenario, checks) {
  await reset(page);
  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-profile-intake").waitFor({ timeout: 15000 });

  const autoGenerateHintVisible = await page.getByTestId("upsc-auto-classification-flow").isVisible();
  const optionalOpen = await page.getByTestId("upsc-intake-optional-preferences").evaluate((node) => node.open);
  if (!autoGenerateHintVisible || optionalOpen) {
    throw new Error(
      `${scenario.id} intake should be one required choice with optional preferences hidden: ${JSON.stringify({
        autoGenerateHintVisible,
        optionalOpen,
      })}`
    );
  }

  await page.getByTestId(`upsc-intake-${scenario.id}`).click();
  await page.waitForURL(
    (url) => url.pathname === scenario.expectedPathname && url.searchParams.get("day") === "1",
    { timeout: 15000 }
  );
  const room = page.getByTestId(scenario.expectedRoomTestId);
  await room.waitFor({ timeout: 15000 });

  const savedProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), profileKey);
  const roomLevel = await room.getAttribute("data-learner-level");
  const flowState = await room.getAttribute("data-flow-state");
  const finalUrl = page.url();
  const result = {
    id: scenario.id,
    savedProfile,
    finalUrl,
    roomLevel,
    flowState,
  };
  checks.push({ label: `${scenario.id}-auto-route-result`, result });

  if (
    savedProfile?.level !== scenario.level ||
    savedProfile?.preparationStage !== scenario.expectedStage ||
    savedProfile?.attemptHistory !== scenario.expectedAttempt ||
    roomLevel !== scenario.level ||
    flowState !== scenario.expectedFlowState
  ) {
    throw new Error(`${scenario.id} auto-route mismatch: ${JSON.stringify(result, null, 2)}`);
  }

  await assertNoOverflow(page, `${scenario.id}-auto-routed-room`, checks);
  return result;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const inspected = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const scenario of scenarios) {
    inspected.push(await inspectScenario(page, scenario, checks));
  }

  await page.setViewportSize({ width: 390, height: 844 });
  inspected.push(await inspectScenario(page, scenarios[0], checks));
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    inspected,
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
  console.error(error);
  process.exit(1);
});
