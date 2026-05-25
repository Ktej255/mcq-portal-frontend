const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-bulk-context-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-bulk-context-final.png");
const goodCsvPath = path.join(__dirname, "geography-bulk-context-GEO-D03.csv");
const badCsvPath = path.join(__dirname, "geography-bulk-context-GEO-D04.csv");
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";

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

function writeCsv(filePath, values) {
  fs.writeFileSync(filePath, `${header.join(",")}\n${values.map(csvEscape).join(",")}\n`);
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    hasOldBranding: /anti\s*gravity|antigravity/i.test(document.body.innerText),
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.hasOldBranding) {
    throw new Error(`${label} still contains old branding.`);
  }
}

async function run() {
  writeCsv(badCsvPath, [
    "Geography",
    4,
    1,
    "Geomorphology",
    "Volcanism and Earthquakes",
    "GEO-D04",
    "Geography Day 4: Volcanism and Earthquakes",
    "MEDIUM",
    "Which statement best explains why convergent plate margins generate both deep-focus earthquakes and volcanic arcs?",
    "Subduction carries hydrated crust downward, causing partial melting and stress accumulation along the slab.",
    "Divergent margins always create deep-focus earthquakes below newly formed oceanic ridges.",
    "Transform faults melt the mantle because plates separate at very high speed.",
    "Continental shields generate volcanic arcs only through wind erosion and denudation.",
    "A",
    "The explanation connects subduction, slab dehydration, mantle melting, and earthquake depth, which is the UPSC trap in this topic.",
    "FRESH_AUTHORING",
    "Earth Layers Lab",
    "No",
    "DRAFT",
  ]);

  writeCsv(goodCsvPath, [
    "Geography",
    3,
    1,
    "Geomorphology",
    "Plate Tectonics",
    "GEO-D03",
    "Geography Day 3: Plate Tectonics",
    "MEDIUM",
    "Which statement most accurately links plate boundary type with the expected landform and seismic pattern for UPSC map reasoning?",
    "Convergent margins can form trenches, volcanic arcs, and shallow-to-deep earthquake zones.",
    "Divergent margins form ocean trenches and only deep-focus earthquakes below continental crust.",
    "Transform boundaries create fold mountains because plates collide head-on along the boundary.",
    "Passive margins are the main global belts of volcanic arcs and frequent earthquakes.",
    "A",
    "Convergent boundaries are identified through trench and arc patterns, plus the Benioff earthquake zone; other options mix boundary signals.",
    "FRESH_AUTHORING",
    "Earth Layers Lab",
    "No",
    "DRAFT",
  ]);

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

  await page.addInitScript((draftKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography-bulk-context-e2e");
    window.localStorage.removeItem(draftKey);
    window.localStorage.removeItem("sarit-upsc-mcq-command-v1");
  }, localDraftKey);

  await page.route("**/api/v1/admin/tests", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/topics", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions**", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions/bulk", (route) => route.abort("connectionrefused"));

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=3`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("mcq-bulk-upload-route").waitFor({ timeout: 60000 });
  const bulkHref = await page.getByTestId("mcq-bulk-upload-route").getAttribute("href");
  if (!bulkHref || !bulkHref.includes("mode=UPSC_MCQ_COMMAND") || !bulkHref.includes("batch=GEO-D03")) {
    throw new Error(`Geography MCQ upload link did not carry day/batch context: ${bulkHref}`);
  }
  await assertNoOverflow(page, "geography-mcq-day3-context-link", checks);

  await page.getByTestId("mcq-bulk-upload-route").click();
  await page.waitForURL(/\/admin\/questions\/bulk.*batch=GEO-D03/, { timeout: 15000 });
  await page.getByTestId("bulk-upsc-context-panel").waitFor({ timeout: 15000 });
  await page.getByText("GEO-D03", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Geography day 3", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "bulk-context-empty", checks);

  await page.locator('input[type="file"]').setInputFiles(badCsvPath);
  await page.getByText("UPSC MCQ Command", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-upsc-context-warnings").waitFor({ timeout: 15000 });
  const warningText = await page.getByTestId("bulk-upsc-context-warnings").innerText();
  if (!warningText.includes("GEO-D03") || !warningText.includes("day 3")) {
    throw new Error(`Context warning did not explain the selected Geography target: ${warningText}`);
  }
  const blocked = await page.getByRole("button", { name: /Start Ingestion/i }).isDisabled();
  if (!blocked) throw new Error("Mismatched Geography CSV was not blocked before import.");
  await assertNoOverflow(page, "bulk-context-mismatch-blocked", checks);

  await page.locator('input[type="file"]').setInputFiles(goodCsvPath);
  await page.getByText("expected landform and seismic pattern", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const warning = document.querySelector('[data-testid="bulk-upsc-context-warnings"]');
    const importButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Start Ingestion"));
    return !warning && importButton && !importButton.hasAttribute("disabled");
  }, null, { timeout: 15000 });
  await assertNoOverflow(page, "bulk-context-match-ready", checks);

  await page.getByRole("button", { name: /Start Ingestion/i }).click();
  await page.getByText("Saved 1 questions to local draft bank", { exact: false }).waitFor({ timeout: 15000 });

  const localDrafts = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), localDraftKey);
  const latestDraft = localDrafts.at(-1);
  const latestQuestion = latestDraft?.questions?.[0];
  if (latestQuestion?.quality_notes?.batch_code !== "GEO-D03" || latestQuestion?.quality_notes?.day !== "3") {
    throw new Error(`Local draft metadata did not preserve GEO-D03 context: ${JSON.stringify(latestDraft)}`);
  }

  const commandState = await page.evaluate(() => JSON.parse(window.localStorage.getItem("sarit-upsc-mcq-command-v1") || "{}"));
  if (commandState["GEO-D03"]?.drafted !== 1 || commandState["GEO-D03"]?.status !== "DRAFT") {
    throw new Error(`MCQ command state did not sync for GEO-D03: ${JSON.stringify(commandState["GEO-D03"])}`);
  }

  await page.getByTestId("bulk-return-to-mcq").click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=3/, { timeout: 15000 });
  await page.getByTestId("mcq-local-question-preview").waitFor({ timeout: 15000 });
  await page.getByText("expected landform and seismic pattern", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("GEO-D03", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-mcq-return-hydrated", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}${bulkHref}`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("bulk-upsc-context-panel").waitFor({ timeout: 15000 });
  await page.locator('input[type="file"]').setInputFiles(goodCsvPath);
  await page.getByText("UPSC MCQ Command", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "bulk-context-mobile", checks);

  const unexpectedConsoleErrors = consoleErrors.filter((error) => !error.includes("Failed to load resource: net::ERR_"));
  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    bulkHref,
    latestBatch: latestQuestion?.quality_notes?.batch_code,
    localDraftQuestionCount: latestDraft?.questions?.length || 0,
    commandDrafted: commandState["GEO-D03"]?.drafted,
    consoleErrors,
    unexpectedConsoleErrors,
    pageErrors,
    requestFailures,
    passed: unexpectedConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: screenshotPath, fullPage: true });
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
