const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-visual-lab-e2e-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  async function checkMode(page, viewportName, mode, selector, expectedText) {
    const url = `${baseUrl}/upsc/geography/lab?mode=${mode}&day=10`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByText(expectedText, { exact: false }).first().waitFor({ timeout: 15000 });
    await page.locator(selector).first().waitFor({ timeout: 15000 });
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    const box = await page.locator(selector).first().boundingBox();
    await page.screenshot({ path: path.join(__dirname, `visual-lab-${viewportName}-${mode}.png`), fullPage: true });
    checks.push({ viewport: viewportName, mode, selector, expectedText, metrics, box });
  }

  async function checkIndiaAtlasLayers(page, viewportName) {
    await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=10`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByTestId("india-layered-atlas").waitFor({ timeout: 15000 });

    const layerChecks = [
      { testId: "india-layer-rivers", text: "Ganga Basin" },
      { testId: "india-layer-national-parks", text: "Kaziranga NP" },
      { testId: "india-layer-wildlife-sanctuaries", text: "Chilika-Nalabana" },
      { testId: "india-layer-soils-climate", text: "Black Soil Belt" },
    ];

    for (const layer of layerChecks) {
      await page.getByTestId(layer.testId).click();
      await page.getByText(layer.text, { exact: false }).first().waitFor({ timeout: 15000 });
    }

    await page.getByText("UPSC trap", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByText("Map proof", { exact: false }).first().waitFor({ timeout: 15000 });

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    const box = await page.getByTestId("india-layered-atlas").boundingBox();
    await page.screenshot({ path: path.join(__dirname, `visual-lab-${viewportName}-india-layered-atlas.png`), fullPage: true });
    checks.push({ viewport: viewportName, mode: "india-layered-atlas", selector: "[data-testid=india-layered-atlas]", metrics, box });

    if (metrics.hasHorizontalOverflow) {
      throw new Error(`Layered India atlas has horizontal overflow: ${JSON.stringify(metrics)}`);
    }
  }

  async function saveLabProofs(page, day, proofLines) {
    for (let index = 0; index < proofLines.length; index += 1) {
      await page.getByTestId("geography-lab-proof-input").fill(proofLines[index]);
      await page.getByTestId("geography-lab-save-proof").click();
      await page.waitForFunction(
        ({ key, selectedDay, expected }) => {
          const dayProgress = JSON.parse(window.localStorage.getItem(key) || "{}")[String(selectedDay)];
          return (dayProgress?.labProofCompletedIds?.length ?? 0) >= expected;
        },
        { key: storageKey, selectedDay: day, expected: index + 1 },
        { timeout: 15000 }
      );
    }
  }

  async function checkCompletion(page) {
    await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=8`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByText("India Interactive Map", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByTestId("lab-completion-panel").waitFor({ timeout: 15000 });
    await saveLabProofs(page, 8, [
      "Concept lock: relief explains drainage, rainfall, soil and disaster risk in one map-first frame.",
      "Map mechanism: Himalaya, plateau and coast change slope, rainfall and river behavior.",
      "India example: Western Ghats, Deccan plateau and Indo-Gangetic plains show the same relief logic.",
      "UPSC trap: relief is not only height; slope, aspect, rain shadow and drainage also matter.",
      "Answer hook: start with relief, place it on the map, then connect climate, soil and risk.",
    ]);
    await page.getByText("Lab saved locally", { exact: false }).waitFor({ timeout: 15000 });

    const progress = await page.evaluate(
      ({ key, day }) => {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw)[String(day)] : null;
      },
      { key: storageKey, day: 8 }
    );
    const talkHref = await page.getByTestId("lab-primary-route").getAttribute("href");
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));

    checks.push({ viewport: "desktop", mode: "completion", selector: "[data-testid=lab-completion-panel]", metrics, progress, talkHref });

    if (
      !progress?.labCompleted ||
      progress?.labMode !== "india-map" ||
      progress?.labProofCompletedIds?.length !== 5 ||
      !progress?.labProofSummary?.includes("Answer hook")
    ) {
      throw new Error(`Visual lab completion did not persist correctly: ${JSON.stringify(progress)}`);
    }

    if (talkHref !== "/upsc/geography/talk?day=8") {
      throw new Error(`Expected lab primary route to Talk day 8, got ${talkHref}`);
    }

    if (metrics.hasHorizontalOverflow) {
      throw new Error(`Visual lab completion has horizontal overflow: ${JSON.stringify(metrics)}`);
    }

    await page.goto(`${baseUrl}/upsc/geography?day=8`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByTestId("command-lab-status").getByText("Lab completed", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("command-lab-status").getByText("1/30 saved", { exact: false }).waitFor({ timeout: 15000 });
    const commandMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    checks.push({ viewport: "desktop", mode: "command-lab-status", selector: "[data-testid=command-lab-status]", metrics: commandMetrics });

    if (commandMetrics.hasHorizontalOverflow) {
      throw new Error(`Command lab status has horizontal overflow: ${JSON.stringify(commandMetrics)}`);
    }

    await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=9`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.evaluate(
      ({ key, day }) => {
        const raw = window.localStorage.getItem(key);
        const current = raw ? JSON.parse(raw) : {};
        current[String(day)] = {
          day,
          watched: true,
          watchState: "Watched",
          confidence: "Working",
          reflection: "Strong India physiography explanation.",
          revisitQueued: false,
          talkBand: "Practice",
          talkScore: 76,
          assessmentSummary: "Talk proof saved.",
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(key, JSON.stringify(current));
      },
      { key: storageKey, day: 9 }
    );
    await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByText("India Interactive Map", { exact: false }).first().waitFor({ timeout: 15000 });
    await saveLabProofs(page, 9, [
      "Concept lock: India map proof must connect relief, drainage, climate, soils, crops and disaster risk.",
      "Map mechanism: Himalaya, plains, plateau and coasts shape river flow, rainfall and settlement.",
      "India example: Ganga plain, Western Ghats and Deccan plateau show relief-climate-soil links.",
      "UPSC trap: do not memorize a location alone; state, river, relief and climate can be mixed.",
      "Answer hook: map the region first, then connect physical geography to agriculture and risk.",
    ]);
    await page.getByText("Lab saved locally", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("lab-next-route-status").getByText("fresh MCQ readiness", { exact: false }).waitFor({ timeout: 15000 });
    const mcqHref = await page.getByTestId("lab-primary-route").getAttribute("href");
    if (mcqHref !== "/upsc/geography/mcq-readiness?day=9") {
      throw new Error(`Expected lab primary route to MCQ readiness day 9 after Talk proof, got ${mcqHref}`);
    }
    await page.getByTestId("lab-primary-route").click();
    await page.waitForURL("**/upsc/geography/mcq-readiness?day=9", { timeout: 15000 });
    await page.getByTestId("mcq-talk-gate").getByText("Learning gate passed", { exact: false }).waitFor({ timeout: 15000 });
    await page.getByTestId("mcq-lab-gate").getByText("Lab proof 5/5", { exact: false }).waitFor({ timeout: 15000 });
    const mcqMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    checks.push({ viewport: "desktop", mode: "lab-to-mcq-route", selector: "[data-testid=mcq-talk-gate]", metrics: mcqMetrics, mcqHref });

    if (mcqMetrics.hasHorizontalOverflow) {
      throw new Error(`Lab to MCQ route has horizontal overflow: ${JSON.stringify(mcqMetrics)}`);
    }
  }

  for (const viewport of [
    { name: "desktop", width: 1366, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${viewport.name}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${viewport.name}] ${error.message}`));

    await checkMode(page, viewport.name, "earth-layers", ".geo-earth-sphere", "Earth Layers Lab");
    await checkMode(page, viewport.name, "monsoon", ".geo-flow", "Monsoon Simulator");
    await checkMode(page, viewport.name, "india-map", ".geo-map-marker", "India Interactive Map");
    await checkIndiaAtlasLayers(page, viewport.name);
    if (viewport.name === "desktop") {
      await checkCompletion(page);
    }
    await page.close();
  }

  const failedOverflow = checks.filter((check) => check.metrics.hasHorizontalOverflow);
  const missingBoxes = checks.filter((check) => "box" in check && (!check.box || check.box.width <= 0 || check.box.height <= 0));
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
    passed: failedOverflow.length === 0 && missingBoxes.length === 0 && blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
