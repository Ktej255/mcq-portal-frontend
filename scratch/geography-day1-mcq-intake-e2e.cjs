const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-day1-mcq-intake-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day1-mcq-intake-final.png");
const weakCsvPath = path.join(__dirname, "geography-day1-intake-weak.csv");
const strongCsvPath = path.join(__dirname, "geography-day1-intake-strong.csv");
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const commandStateKey = "sarit-upsc-mcq-command-v1";

const header = [
  "subject",
  "day",
  "week",
  "chapter",
  "topic",
  "batch_code",
  "test_title",
  "difficulty",
  "question_text_en",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
  "explanation_en",
  "source",
  "map_or_case_tag",
  "pyq_linked",
  "status",
];

function csvEscape(value) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(filePath, rows) {
  const body = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  fs.writeFileSync(filePath, `${header.join(",")}\n${body}\n`);
}

function buildStrongRow(index) {
  const number = index + 1;
  return [
    "Geography",
    1,
    1,
    "Physical Geography Foundation",
    "Earth as a System",
    "GEO-D01",
    "Geography Day 1: Earth as a System",
    number % 5 === 0 ? "HARD" : number % 3 === 0 ? "PYQ_STYLE" : "MEDIUM",
    `Consider the following statements about Earth as a system for UPSC map reasoning question ${number}: which option correctly links spheres, energy flow, location proof and the common trap?`,
    `Lithosphere, atmosphere, hydrosphere and biosphere interact through energy and matter feedback, so map location changes the final climate, relief and hazard pattern ${number}.`,
    `Latitude alone explains every Earth system outcome without relief, water, atmosphere or seasonal movement.`,
    `Map scale, direction and time zones are irrelevant once the student knows the definition of a sphere.`,
    `Every Indian region receives the same insolation and has the same drainage response across seasons.`,
    "A",
    `The correct option is A because Earth system questions require a process chain linking energy, matter, relief, climate, water and location. The UPSC trap is to isolate one sphere, latitude, scale or time-zone fact and ignore map proof, regional exception and interaction logic for question ${number}.`,
    "FRESH_AUTHORING",
    "Earth Layers Lab latitude longitude time zones India map",
    number % 4 === 0 ? "Yes" : "No",
    "DRAFT",
  ];
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
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsOldBranding) throw new Error(`${label} still contains old branding.`);
}

async function run() {
  writeCsv(weakCsvPath, [buildStrongRow(0)]);
  writeCsv(strongCsvPath, Array.from({ length: 25 }, (_, index) => buildStrongRow(index)));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    requestFailures.push({ url: request.url(), failure: request.failure()?.errorText || "unknown" });
  });

  await page.addInitScript(({ draftKey, stateKey }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_day1_mcq_intake");
    window.localStorage.removeItem(draftKey);
    window.localStorage.removeItem(stateKey);
  }, { draftKey: localDraftKey, stateKey: commandStateKey });

  await page.route("**/api/v1/admin/tests", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/topics", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions**", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions/bulk", (route) => route.abort("connectionrefused"));

  const contextUrl = `${baseUrl}/admin/questions/bulk?mode=UPSC_MCQ_COMMAND&subject=geography&day=1&batch=GEO-D01&return=%2Fupsc%2Fgeography%2Fmcq-readiness%3Fday%3D1`;
  await page.goto(contextUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("bulk-upsc-context-panel").waitFor({ timeout: 15000 });
  await page.getByText("GEO-D01", { exact: false }).first().waitFor({ timeout: 15000 });

  await page.locator('input[type="file"]').setInputFiles(weakCsvPath);
  await page.getByTestId("bulk-geography-quality-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-status").getByText("Review required", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-geo-d01").getByText("1/25 drafted", { exact: false }).waitFor({ timeout: 15000 });
  const weakDisabled = await page.getByRole("button", { name: /Start Ingestion/i }).isDisabled();
  if (!weakDisabled) throw new Error("A one-question GEO-D01 launch bank was not blocked.");
  await assertNoOverflow(page, "day1-intake-weak-blocked", checks);

  await page.locator('input[type="file"]').setInputFiles(strongCsvPath);
  await page.getByText("question 25", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-status").getByText("Ready to import", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-score-geo-d01").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const importButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Start Ingestion"));
    return importButton && !importButton.hasAttribute("disabled");
  }, null, { timeout: 15000 });
  await assertNoOverflow(page, "day1-intake-strong-ready", checks);

  await page.getByRole("button", { name: /Start Ingestion/i }).click();
  await page.getByText("Saved 25 questions to local draft bank", { exact: false }).waitFor({ timeout: 15000 });

  const localDrafts = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), localDraftKey);
  const latestDraft = localDrafts.at(-1);
  const commandState = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}"), commandStateKey);
  if (latestDraft?.questions?.length !== 25) {
    throw new Error(`Expected 25 Day 1 questions in local draft bank: ${JSON.stringify(latestDraft)}`);
  }
  if (commandState["GEO-D01"]?.drafted !== 25 || commandState["GEO-D01"]?.status !== "READY") {
    throw new Error(`GEO-D01 command state did not become READY after 25 audited rows: ${JSON.stringify(commandState["GEO-D01"])}`);
  }

  await page.getByTestId("bulk-return-to-mcq").click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=1/, { timeout: 15000 });
  await page.getByTestId("mcq-batch-gate").getByText("Fresh batch ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-mcq-quality-score").getByText("Passed 100%", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day1-intake-return-ready", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(contextUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.locator('input[type="file"]').setInputFiles(strongCsvPath);
  await page.getByTestId("bulk-geography-quality-panel").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day1-intake-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const unexpectedConsoleErrors = consoleErrors.filter((error) => !error.includes("Failed to load resource: net::ERR_"));
  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    localDraftQuestionCount: latestDraft.questions.length,
    commandState: commandState["GEO-D01"],
    consoleErrors,
    unexpectedConsoleErrors,
    pageErrors,
    requestFailures,
    passed: unexpectedConsoleErrors.length === 0 && pageErrors.length === 0,
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
