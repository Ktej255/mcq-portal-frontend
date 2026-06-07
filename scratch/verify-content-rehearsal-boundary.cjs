const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "content-rehearsal-boundary-evidence.json");

async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    text: document.body.innerText,
  }));
  const hasHorizontalOverflow =
    metrics.scrollWidth > metrics.clientWidth + 2 || metrics.bodyScrollWidth > metrics.clientWidth + 2;
  if (hasHorizontalOverflow || /ANTIGRAVITY|ANTI\s*GRAVITY/i.test(metrics.text)) {
    throw new Error(`${label} failed visual boundary: ${JSON.stringify({ ...metrics, text: undefined, hasHorizontalOverflow })}`);
  }

  return {
    label,
    url: metrics.url,
    clientWidth: metrics.clientWidth,
    scrollWidth: metrics.scrollWidth,
    bodyScrollWidth: metrics.bodyScrollWidth,
    hasHorizontalOverflow,
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const masterPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const learnerPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  for (const [label, page] of [
    ["master", masterPage],
    ["learner", learnerPage],
  ]) {
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${label}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${label}] ${error.message}`));
  }

  await masterPage.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_content_rehearsal_boundary");
  });
  await learnerPage.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_STUDENT_content_rehearsal_boundary");
  });

  await masterPage.goto(`${baseUrl}/upsc/content-command?subject=geography&day=1`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  const boundary = masterPage.getByTestId("content-rehearsal-boundary");
  await boundary.waitFor({ timeout: 15000 });
  await boundary.getByText("Local rehearsal state only.", { exact: false }).waitFor();
  await masterPage.getByText("29 of 201 class days staged locally", { exact: true }).waitFor();
  await masterPage.getByText("Geography: 29/30 classes staged locally", { exact: true }).waitFor();
  await masterPage.getByText("IN PROGRESS", { exact: true }).waitFor();
  await masterPage
    .getByTestId("content-pack-preview")
    .getByText("Geographic Thinking and Map Relationships", { exact: true })
    .waitFor();
  const text = await masterPage.locator("body").innerText();
  if (text.includes("30/30 classes ready") || text.includes("class days content-ready")) {
    throw new Error("Content Command still exposes an ambiguous live-ready label.");
  }
  checks.push(await assertNoOverflow(masterPage, "content-command-desktop"));

  await masterPage.setViewportSize({ width: 390, height: 844 });
  await masterPage.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await masterPage.getByTestId("content-rehearsal-boundary").waitFor({ timeout: 15000 });
  checks.push(await assertNoOverflow(masterPage, "content-command-mobile"));

  await learnerPage.goto(`${baseUrl}/upsc/content-command`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await learnerPage.waitForURL(`${baseUrl}/dashboard`, { timeout: 15000 });
  checks.push({ label: "content-command-learner-redirect", finalUrl: learnerPage.url() });

  await browser.close();

  const unexpectedConsoleErrors = consoleErrors.filter(
    (error) => !error.includes("AUTH | Firebase auth is not initialized"),
  );
  const evidence = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    checks,
    consoleErrors,
    unexpectedConsoleErrors,
    pageErrors,
    passed: unexpectedConsoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
