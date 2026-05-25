const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-lab-proof-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-lab-proof-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function storageKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  async function verifyEnvironmentLab(viewportName, viewport) {
    const page = await browser.newPage({ viewport });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${viewportName}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${viewportName}] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/environment/lab?mode=biodiversity-map&day=5`, {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey("environment"));
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByTestId("subject-lab-proof-engine").waitFor({ timeout: 15000 });
    await page.getByTestId("subject-lab-proof-list").waitFor({ timeout: 15000 });
    await page.getByText("1. Concept proof", { exact: false }).waitFor({ timeout: 15000 });

    await page.getByTestId("subject-lab-proof-complete").click();
    await page.getByText("2. Applied case", { exact: false }).waitFor({ timeout: 15000 });

    for (let i = 0; i < 4; i += 1) {
      await page.getByTestId("subject-lab-proof-complete").click();
    }

    await page.getByText("5/5 proof stages", { exact: false }).waitFor({ timeout: 15000 });
    await page
      .getByPlaceholder("Write the concept, case, map point, or UPSC trap", { exact: false })
      .fill(
        "Biodiversity proof: classify protected area category, link the map region, species, threat, legal rule and institution. UPSC can create traps by mixing national park, sanctuary, biosphere reserve and conservation reserve permissions."
      );
    await page.getByRole("button", { name: /Mark lab complete/i }).click();
    await page.getByText("Lab saved locally", { exact: false }).waitFor({ timeout: 15000 });

    const progress = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)["5"] : null;
    }, storageKey("environment"));
    const pageMetrics = await metrics(page);
    if (viewportName === "desktop") await page.screenshot({ path: screenshotPath, fullPage: true });
    checks.push({ viewport: viewportName, route: "environment-lab", progress, metrics: pageMetrics });

    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Environment Lab has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }
    if (
      !progress?.labCompleted ||
      progress?.labMode !== "biodiversity-map" ||
      progress?.labProofCompletedIds?.length !== 5 ||
      progress?.labProofIndex !== 4 ||
      !progress?.labProofSummary
    ) {
      throw new Error(`Environment Lab proof state did not persist correctly: ${JSON.stringify(progress)}`);
    }

    await page.close();
  }

  async function verifyEconomyLab() {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[economy] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[economy] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/economy/lab?mode=inflation-dashboard&day=3`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("subject-lab-proof-engine").waitFor({ timeout: 15000 });
    await page.getByTestId("subject-lab-proof-list").waitFor({ timeout: 15000 });
    await page.getByText("Student proof prompt", { exact: false }).waitFor({ timeout: 15000 });

    const pageMetrics = await metrics(page);
    checks.push({ viewport: "desktop", route: "economy-lab", metrics: pageMetrics });
    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Economy Lab has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }

    await page.close();
  }

  await verifyEnvironmentLab("desktop", { width: 1366, height: 900 });
  await verifyEnvironmentLab("mobile", { width: 390, height: 844 });
  await verifyEconomyLab();

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

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
