const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-upsc-intake-self-study-evidence.json");
const screenshotPath = path.join(__dirname, "verify-upsc-intake-self-study.png");
const profileKey = "sarit-upsc-student-profile-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
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
  await page.evaluate((key) => {
    sessionStorage.clear();
    Object.keys(localStorage).forEach((storageKey) => {
      if (storageKey.startsWith("sarit-upsc-") || storageKey === "MOCK_TOKEN") localStorage.removeItem(storageKey);
    });
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_UPSC_INTAKE_SELF_STUDY");
    localStorage.removeItem(key);
  }, profileKey);
  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });

  await page.getByTestId("upsc-profile-intake").waitFor({ timeout: 15000 });
  const setupOpen = await page.getByTestId("upsc-profile-intake").evaluate((node) => node.open);
  const optionalOpen = await page.getByTestId("upsc-intake-optional-preferences").evaluate((node) => node.open);
  const autoGenerateHintVisible = await page.getByTestId("upsc-auto-classification-flow").isVisible();
  const dailySittingVisible = await page.getByText("Daily sitting", { exact: true }).isVisible();
  checks.push({
    label: "simple-intake-progressive-disclosure",
    setupOpen,
    optionalOpen,
    autoGenerateHintVisible,
    dailySittingVisible,
  });
  if (!setupOpen || optionalOpen || !autoGenerateHintVisible || dailySittingVisible) {
    throw new Error(
      `Initial setup should require one core answer and fold tuning: ${JSON.stringify({
        setupOpen,
        optionalOpen,
        autoGenerateHintVisible,
        dailySittingVisible,
      })}`
    );
  }

  await page.getByRole("button", { name: "I completed coaching and want a self-study path" }).click();
  await page.waitForURL(
    (url) => url.pathname === "/upsc/geography/talk" && url.searchParams.get("day") === "1",
    { timeout: 15000 }
  );
  await page.getByTestId("geography-talk-simple-panel").waitFor({ timeout: 15000 });

  const savedProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), profileKey);
  const talkLevel = await page.getByTestId("geography-talk-simple-panel").getAttribute("data-learner-level");
  const talkState = await page.getByTestId("geography-talk-simple-panel").getAttribute("data-flow-state");
  checks.push({ label: "intermediate-self-study-auto-talk", savedProfile, talkLevel, talkState, url: page.url() });
  if (
    savedProfile?.level !== "intermediate" ||
    savedProfile?.preparationStage !== "coaching-complete" ||
    savedProfile?.attemptHistory !== "no-attempt" ||
    savedProfile?.studyWindow !== "120" ||
    talkLevel !== "intermediate" ||
    talkState !== "answer-required"
  ) {
    throw new Error(`Intermediate self-study direct Talk mismatch: ${JSON.stringify(checks.at(-1))}`);
  }
  await assertNoOverflow(page, "intermediate-talk-desktop", checks);

  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  const startHref = await page.getByTestId("upsc-start-today").getAttribute("href");
  const signalCount = await page.locator('[data-testid^="upsc-signal-"]').count();
  const planningDrawerOpen = await page.getByTestId("upsc-planning-drawer").evaluate((node) => node.open);
  checks.push({ label: "intermediate-dashboard-after-return", startHref, signalCount, planningDrawerOpen });
  if (startHref !== "/upsc/geography/talk?day=1" || signalCount !== 4 || planningDrawerOpen) {
    throw new Error(`Intermediate dashboard after return mismatch: ${JSON.stringify(checks.at(-1))}`);
  }
  await assertNoOverflow(page, "intermediate-dashboard-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-simple-dashboard").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "intermediate-dashboard-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
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
