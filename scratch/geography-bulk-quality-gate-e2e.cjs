const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-bulk-quality-gate-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-bulk-quality-gate-final.png");
const weakCsvPath = path.join(__dirname, "geography-quality-weak-GEO-D03.csv");
const strongCsvPath = path.join(__dirname, "geography-quality-strong-GEO-D03.csv");
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
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still contains old branding.`);
  }
}

async function run() {
  writeCsv(weakCsvPath, [
    "Geography",
    3,
    1,
    "Geomorphology",
    "Plate Tectonics",
    "GEO-D03",
    "Geography Day 3: Plate Tectonics",
    "MEDIUM",
    "What is plate?",
    "A",
    "B",
    "C",
    "D",
    "A",
    "It moves.",
    "FRESH_AUTHORING",
    "",
    "No",
    "DRAFT",
  ]);

  writeCsv(strongCsvPath, [
    "Geography",
    3,
    1,
    "Geomorphology",
    "Plate Tectonics",
    "GEO-D03",
    "Geography Day 3: Plate Tectonics",
    "MEDIUM",
    "Which statement most accurately explains why convergent plate margins create trenches, volcanic arcs, and earthquake belts on a UPSC physical map?",
    "Subduction forces one plate beneath another, causing melting, trench formation, volcanic arcs, and shallow-to-deep earthquake zones.",
    "Divergent boundaries form trenches because oceanic plates collide and sink below continental crust.",
    "Transform margins create volcanic arcs because plates move away from each other and expose magma everywhere.",
    "Passive continental margins are the main source of deep-focus earthquakes and volcanic island arcs.",
    "A",
    "The correct answer links plate convergence with subduction, Benioff-zone earthquakes, trench formation, and arc volcanism; the trap is mixing divergent, transform, and passive-margin patterns.",
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_bulk_quality_gate");
    window.localStorage.removeItem(draftKey);
    window.localStorage.removeItem("sarit-upsc-mcq-command-v1");
  }, localDraftKey);

  await page.route("**/api/v1/admin/tests", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/topics", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions**", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions/bulk", (route) => route.abort("connectionrefused"));

  const contextUrl = `${baseUrl}/admin/questions/bulk?mode=UPSC_MCQ_COMMAND&subject=geography&day=3&batch=GEO-D03&return=%2Fupsc%2Fgeography%2Fmcq-readiness%3Fday%3D3`;
  await page.goto(contextUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("bulk-upsc-context-panel").waitFor({ timeout: 15000 });
  await page.locator('input[type="file"]').setInputFiles(weakCsvPath);
  const geographyPanel = page.getByTestId("bulk-geography-quality-panel");
  await geographyPanel.waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-status").getByText("Review required", { exact: false }).waitFor({ timeout: 15000 });
  await geographyPanel.getByText("UPSC-style stem", { exact: true }).waitFor({ timeout: 15000 });
  await geographyPanel.getByText("Mechanism explanation", { exact: true }).waitFor({ timeout: 15000 });
  await geographyPanel.getByText("Map or atlas anchor", { exact: true }).waitFor({ timeout: 15000 });
  const weakButtonDisabled = await page.getByRole("button", { name: /Start Ingestion/i }).isDisabled();
  if (!weakButtonDisabled) throw new Error("Weak Geography MCQ CSV was not blocked by the quality gate.");
  await assertNoOverflow(page, "geography-quality-weak-blocked", checks);

  await page.locator('input[type="file"]').setInputFiles(strongCsvPath);
  await page.getByText("convergent plate margins", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-status").getByText("Ready to import", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-geography-quality-score-geo-d03").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const importButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Start Ingestion"));
    return importButton && !importButton.hasAttribute("disabled");
  }, null, { timeout: 15000 });
  await assertNoOverflow(page, "geography-quality-strong-ready", checks);

  await page.getByRole("button", { name: /Start Ingestion/i }).click();
  await page.getByText("Saved 1 questions to local draft bank", { exact: false }).waitFor({ timeout: 15000 });
  const localDrafts = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), localDraftKey);
  const latestDraft = localDrafts.at(-1);
  const latestQuestion = latestDraft?.questions?.[0];
  if (latestQuestion?.quality_notes?.batch_code !== "GEO-D03" || latestQuestion?.quality_notes?.map_or_case_tag !== "Earth Layers Lab") {
    throw new Error(`Strong Geography question was not saved with quality metadata: ${JSON.stringify(latestDraft)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(contextUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.locator('input[type="file"]').setInputFiles(strongCsvPath);
  await page.getByTestId("bulk-geography-quality-panel").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-quality-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const unexpectedConsoleErrors = consoleErrors.filter((error) => !error.includes("Failed to load resource: net::ERR_"));
  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    latestBatch: latestQuestion?.quality_notes?.batch_code,
    localDraftQuestionCount: latestDraft?.questions?.length || 0,
    consoleErrors,
    unexpectedConsoleErrors,
    pageErrors,
    requestFailures,
    passed: unexpectedConsoleErrors.length === 0 && pageErrors.length === 0,
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
