const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3011";
const evidencePath = path.join(__dirname, "master-access-flow-evidence.json");
const adminScreenshotPath = path.join(__dirname, "master-access-admin.png");
const talkScreenshotPath = path.join(__dirname, "master-access-talk.png");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/login?master=1&redirect=%2Fadmin%2Ffeature-inventory`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByTestId("admin-feature-inventory-page").waitFor({ timeout: 45000 });

  const adminState = await page.evaluate(() => ({
    url: window.location.href,
    email: window.localStorage.getItem("MOCK_USER_EMAIL"),
    token: window.localStorage.getItem("MOCK_TOKEN"),
    pass: window.localStorage.getItem("sarit-upsc-master-pass-v1"),
    profile: window.localStorage.getItem("sarit-upsc-student-profile-v1"),
    hasOnePassButton: Boolean(document.querySelector('[data-testid="master-one-pass"]')),
    inventoryVisible: Boolean(document.querySelector('[data-testid="admin-feature-inventory-page"]')),
  }));
  checks.push({ label: "admin-master-inventory", adminState });

  if (!adminState.email?.includes("ktej255@gmail.com")) {
    throw new Error(`Master preview did not keep the requested email: ${JSON.stringify(adminState)}`);
  }
  if (!adminState.token?.includes("master")) {
    throw new Error(`Master preview token was not restored as a master token: ${JSON.stringify(adminState)}`);
  }
  if (!adminState.hasOnePassButton || !adminState.inventoryVisible) {
    throw new Error(`Master sidebar/inventory is not visible: ${JSON.stringify(adminState)}`);
  }

  await page.getByTestId("master-one-pass").click();
  await page.getByTestId("admin-feature-inventory-page").waitFor({ timeout: 15000 });
  await page.screenshot({ path: adminScreenshotPath, fullPage: false });

  const passState = await page.evaluate(() => {
    const pass = JSON.parse(window.localStorage.getItem("sarit-upsc-master-pass-v1") || "{}");
    const profile = JSON.parse(window.localStorage.getItem("sarit-upsc-student-profile-v1") || "{}");
    return {
      pass,
      profile,
    };
  });
  checks.push({ label: "master-pass-storage", passState });

  if (passState.pass.email !== "ktej255@gmail.com" || passState.profile.level !== "advanced") {
    throw new Error(`Master pass did not seed the advanced UPSC profile: ${JSON.stringify(passState)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 45000 });
  await page.getByTestId("talk-master-one-pass").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-master-one-pass").click();
  await page.getByText("Master pass filled and checked this answer.", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });

  const talkState = await page.evaluate(() => ({
    url: window.location.href,
    answer: document.querySelector('[data-testid="talk-answer-draft"]')?.value || "",
    routeGateText: document.querySelector('[data-testid="talk-route-gate"]')?.textContent || "",
    hasOnePassButton: Boolean(document.querySelector('[data-testid="talk-master-one-pass"]')),
    hasProfileRequired: Boolean(document.querySelector('[data-testid="upsc-profile-required"]')),
  }));
  checks.push({ label: "geography-talk-master-one-pass", talkState });

  if (!talkState.answer.includes("Master pass flow check")) {
    throw new Error(`Talk one-pass did not fill the answer draft: ${JSON.stringify(talkState)}`);
  }
  if (!talkState.routeGateText || talkState.hasProfileRequired) {
    throw new Error(`Talk route did not bypass profile gate and assess: ${JSON.stringify(talkState)}`);
  }
  await page.screenshot({ path: talkScreenshotPath, fullPage: false });

  const filteredConsoleErrors = consoleErrors.filter(
    (entry) =>
      !entry.includes("AUTH | Firebase auth is not initialized") &&
      !entry.includes("Supabase auth is not initialized")
  );
  if (pageErrors.length || filteredConsoleErrors.length) {
    throw new Error(
      `Browser errors detected: ${JSON.stringify({ pageErrors, filteredConsoleErrors }, null, 2)}`
    );
  }

  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        baseUrl,
        checks,
        screenshots: [adminScreenshotPath, talkScreenshotPath],
      },
      null,
      2
    )
  );

  await browser.close();
  console.log(JSON.stringify({ ok: true, evidencePath, screenshots: [adminScreenshotPath, talkScreenshotPath] }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
