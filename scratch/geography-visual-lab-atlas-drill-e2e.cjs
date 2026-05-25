const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-visual-lab-atlas-drill-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-visual-lab-atlas-drill-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

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

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day }
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

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=12`, { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "12": {
          day: 12,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["12-briefing", "12-mechanism", "12-map", "12-trap", "12-recap"],
          talkScore: 88,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          confidence: "Command",
          reflection: "Seeded talk pass for atlas drill verification.",
          revisitQueued: false,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, progressKey);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("india-layered-atlas").waitFor({ timeout: 15000 });
  await page.getByTestId("india-layer-wildlife-sanctuaries").click();
  await page.getByTestId("india-atlas-drill-list").getByText("Wayanad WLS", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("india-atlas-point-wayanad-wls").click();
  await page.getByTestId("india-atlas-command-chain").getByText("Corridor geography", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "atlas-drill-selected-desktop", checks);

  await page.getByTestId("geography-lab-proof-stages").getByText("2. Map mechanism", { exact: false }).click();
  await page.getByTestId("geography-lab-proof-suggestion").getByText("Wayanad WLS", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofInput = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofInput.includes("Wayanad WLS") || !proofInput.includes("Corridor geography")) {
    throw new Error(`Proof helper did not load selected atlas point: ${proofInput}`);
  }

  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForFunction(
    ({ key }) => {
      const day = JSON.parse(window.localStorage.getItem(key) || "{}")["12"];
      return day?.labProofCompletedIds?.some((proofId) => proofId === "12-india-map-map");
    },
    { key: progressKey },
    { timeout: 15000 }
  );

  const stored = await getProgress(page, 12);
  if (
    stored?.labMode !== "india-map" ||
    stored?.labAtlasLayer !== "wildlife-sanctuaries" ||
    stored?.labAtlasPoint !== "Wayanad WLS" ||
    !stored?.labProofCompletedIds?.includes("12-india-map-map") ||
    stored?.labCompleted === true
  ) {
    throw new Error(`Atlas drill proof was not persisted correctly: ${JSON.stringify(stored, null, 2)}`);
  }

  await page.getByRole("button", { name: /Monsoon Simulator/i }).click();
  await page.getByTestId("lab-completion-panel").getByText("0/5 proof stages saved", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "proof-mode-isolated-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=12`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("india-layered-atlas").waitFor({ timeout: 15000 });
  await page.getByTestId("india-atlas-drill-list").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "atlas-drill-mobile", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    stored,
    finalUrl: page.url(),
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
