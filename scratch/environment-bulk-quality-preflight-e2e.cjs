const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const weakCsvPath = path.join(__dirname, "environment-bulk-quality-weak.csv");
const strongCsvPath = path.join(__dirname, "environment-bulk-quality-strong.csv");
const evidencePath = path.join(__dirname, "environment-bulk-quality-preflight-e2e-evidence.json");

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(rows) {
  const headers = [
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

  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`;
}

function makeRow(index, overrides = {}) {
  return {
    subject: "Environment",
    day: "5",
    week: "1",
    chapter: "Biodiversity",
    topic: "Protected Areas",
    batch_code: "ENV-D05",
    test_title: "Environment Day 5: Protected Areas",
    difficulty: "MEDIUM",
    question_text_en:
      overrides.question_text_en ||
      `Consider the following statements about protected areas, biodiversity hotspots, and corridors ${index}. Which option is correct?`,
    option_a: "Core and buffer logic can vary by legal category and local rights",
    option_b: "All protected areas remove every human activity in the same way",
    option_c: "Hotspot status only means high animal population",
    option_d: "Corridors are irrelevant for fragmented habitats",
    correct_option: "A",
    explanation_en:
      overrides.explanation_en ||
      "The correct option links protected area category, habitat, species movement, governance mechanism, and impact because corridors and buffer rules shape conservation outcomes. The distractors fail by treating all categories as identical, ignoring endemism, and removing landscape process from the ecosystem.",
    source: "UPSC_MCQ_COMMAND",
    map_or_case_tag: overrides.map_or_case_tag ?? "Great Indian Bustard grassland",
    pyq_linked: "No",
    status: "DRAFT",
  };
}

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

async function run() {
  fs.writeFileSync(
    weakCsvPath,
    buildCsv([
      makeRow(1, { question_text_en: "Protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
      makeRow(2, { question_text_en: "Another protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
      makeRow(3, { question_text_en: "Third protected area basic question", explanation_en: "Short.", map_or_case_tag: "" }),
    ])
  );
  fs.writeFileSync(strongCsvPath, buildCsv([makeRow(1), makeRow(2), makeRow(3)]));

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
  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_environment-bulk-quality");
    window.localStorage.removeItem("sarit-admin-bulk-question-drafts-v1");
    window.localStorage.removeItem("sarit-upsc-mcq-command-v1");
  });
  await page.route("**/api/v1/admin/tests", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/topics", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions/bulk", (route) => route.abort("connectionrefused"));
  await page.route("**/api/v1/admin/questions**", (route) => route.abort("connectionrefused"));

  await page.goto(`${baseUrl}/admin/questions/bulk`, { waitUntil: "domcontentloaded" });
  await page.getByText("Bulk Question Ingestion", { exact: false }).first().waitFor({ timeout: 60000 });
  await assertNoOverflow(page, "bulk-environment-empty", checks);

  await page.locator('input[type="file"]').setInputFiles(weakCsvPath);
  await page.getByTestId("bulk-environment-quality-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-environment-quality-status").getByText("Review required", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-environment-quality-score-env-d05").getByText("79%", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "bulk-environment-weak-preview", checks);

  const weakImportDisabled = await page.getByRole("button", { name: /Start Ingestion/i }).isDisabled();
  if (!weakImportDisabled) {
    throw new Error("Weak Environment CSV should disable Start Ingestion.");
  }

  await page.locator('input[type="file"]').setInputFiles(strongCsvPath);
  await page.getByTestId("bulk-environment-quality-panel").waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-environment-quality-status").getByText("Ready to import", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("bulk-environment-quality-score-env-d05").getByText("100%", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "bulk-environment-strong-preview", checks);

  const importButton = page.getByRole("button", { name: /Start Ingestion/i });
  if (await importButton.isDisabled()) {
    throw new Error("Strong Environment CSV should enable Start Ingestion.");
  }
  await importButton.click();
  await page.getByText("Saved 3 questions to local draft bank", { exact: false }).waitFor({ timeout: 15000 });

  const localDrafts = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), localDraftKey);
  const commandState = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}"), mcqKey);
  const latestDraft = localDrafts.at(-1);
  if (latestDraft?.questions?.length !== 3 || latestDraft?.questions?.[0]?.quality_notes?.batch_code !== "ENV-D05") {
    throw new Error(`Strong Environment CSV was not preserved in local draft bank: ${JSON.stringify(latestDraft)}`);
  }
  if (commandState["ENV-D05"]?.drafted !== 3 || commandState["ENV-D05"]?.status !== "DRAFT") {
    throw new Error(`MCQ command state did not sync Environment import: ${JSON.stringify(commandState["ENV-D05"])}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/admin/questions/bulk`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="file"]').setInputFiles(strongCsvPath);
  await page.getByTestId("bulk-environment-quality-panel").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "bulk-environment-strong-mobile", checks);

  const unexpectedConsoleErrors = consoleErrors.filter((error) => !error.includes("Failed to load resource: net::ERR_"));
  const evidence = {
    baseUrl,
    checks,
    weakImportDisabled,
    localDraftQuestionCount: latestDraft?.questions?.length || 0,
    commandState: commandState["ENV-D05"],
    finalUrl: page.url(),
    consoleErrors,
    unexpectedConsoleErrors,
    pageErrors,
    requestFailures,
    passed: unexpectedConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "environment-bulk-quality-preflight-final.png"), fullPage: true });
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
