const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "verify-upsc-profile-gate-evidence.json");
const screenshotPath = path.join(__dirname, "verify-upsc-profile-gate-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate((currentLabel) => {
    return {
      label: currentLabel,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    };
  }, label);
  checks.push(metrics);
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function seedMockSession(page, profile = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ key, value }) => {
      const token = "MOCK_TOKEN_profile_gate";
      window.MOCK_TOKEN = token;
      window.localStorage.setItem("MOCK_TOKEN", token);
      window.localStorage.removeItem(key);
      if (value) window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: profileKey, value: profile }
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

  await seedMockSession(page);
  await page.goto(`${baseUrl}/upsc/geography`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-profile-required").waitFor({ timeout: 15000 });
  const gateActionHref = await page.getByTestId("upsc-profile-required-action").getAttribute("href");
  checks.push({ label: "geography-direct-entry-blocked-without-profile", gateActionHref });
  if (gateActionHref !== "/upsc#upsc-intake") {
    throw new Error(`Profile gate action points to ${gateActionHref}`);
  }
  await assertNoOverflow(page, "profile-gate-desktop", checks);

  await page.getByTestId("upsc-profile-required-action").click();
  await page.waitForURL(/\/upsc#upsc-intake$/, { timeout: 15000 });
  await page.getByTestId("upsc-profile-intake").waitFor({ timeout: 15000 });
  checks.push({ label: "gate-links-to-intake", url: page.url() });

  const profile = {
    level: "advanced",
    studyWindow: "120",
    learningStyle: "mixed",
    weakSignal: "retention",
    studyTime: "morning",
    updatedAt: new Date().toISOString(),
  };
  await seedMockSession(page, profile);
  await page.goto(`${baseUrl}/upsc/geography`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-today-simple-entry").waitFor({ timeout: 15000 });
  const gateCountWithProfile = await page.getByTestId("upsc-profile-required").count();
  checks.push({ label: "profile-opens-geography", gateCountWithProfile, url: page.url() });
  if (gateCountWithProfile !== 0) {
    throw new Error("Profile gate remained visible after profile was saved.");
  }
  await assertNoOverflow(page, "geography-with-profile-desktop", checks);

  await page.evaluate((key) => {
    window.localStorage.removeItem(key);
    window.dispatchEvent(new Event("sarit-upsc-learner-state-cleared"));
  }, profileKey);
  await page.getByTestId("upsc-profile-required").waitFor({ timeout: 15000 });
  const mountedRoomStillVisible = await page.getByTestId("geography-today-simple-entry").isVisible().catch(() => false);
  checks.push({ label: "mounted-profile-gate-rechecks-after-account-cleanup", mountedRoomStillVisible });
  if (mountedRoomStillVisible) {
    throw new Error("Mounted Geography room remained visible after learner-state cleanup.");
  }

  await seedMockSession(page, profile);
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  checks.push({ label: "profile-opens-direct-talk-room", url: page.url() });

  await page.goto(`${baseUrl}/upsc/environment`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForURL(`${baseUrl}/dashboard`, { timeout: 15000 });
  checks.push({ label: "future-environment-subject-remains-operator-only", url: page.url() });

  await page.setViewportSize({ width: 390, height: 844 });
  await seedMockSession(page);
  await page.goto(`${baseUrl}/upsc/geography`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-profile-required").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "profile-gate-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    baseUrl,
    checks,
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
