const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const ledgerKey = "sarit-upsc-pyq-import-ledger-v1";
const evidencePath = path.join(__dirname, "verify-pyq-import-command-evidence.json");

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

function csvRow(values) {
  return values
    .map((value) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    })
    .join(",");
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript((localLedgerKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_admin_pyq_import");
    window.localStorage.removeItem(localLedgerKey);
  }, ledgerKey);

  await page.goto(`${baseUrl}/admin/pyq-import`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-pyq-import-command").waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: "PYQ Import Command" }).waitFor({ timeout: 15000 });
  await page.getByText("Operator-only exact PYQ staging", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pyq-seed-pack").waitFor({ timeout: 15000 });
  await page.getByText("Built-in PYQ pattern seed pack", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pyq-import-persistence").waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const mode = document.querySelector('[data-testid="admin-pyq-import-persistence"]')?.getAttribute("data-sync-mode");
    return mode && mode !== "checking";
  }, null, { timeout: 15000 }).catch(() => {});
  await page.getByRole("link", { name: /PYQ Import/i }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "pyq-import-empty-desktop", checks);

  const headers = [
    "year",
    "stage",
    "subject_slug",
    "paper",
    "question_number",
    "question_text",
    "syllabus_area",
    "syllabus_node_id",
    "topic_tags",
    "trend_insight_id",
    "source_href",
    "official_source_title",
    "answer_demand",
  ];
  const csv = [
    headers.join(","),
    csvRow([
      2024,
      "Prelims",
      "geography",
      "General Studies Paper I",
      "Q1",
      "Which statement best explains a map-linked monsoon variability pattern tested through location and process logic?",
      "Indian geography and mapping",
      "geo-india",
      "monsoon|map|process",
      "geo-map-process",
      "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
      "Civil Services Preliminary Examination 2024 Question Papers",
      "Prelims elimination and map logic",
    ]),
    csvRow([
      2025,
      "Optional",
      "anthropology",
      "Anthropology Paper I",
      "Q1(a)",
      "Discuss how a verified optional question should be attached to syllabus area, paper, source and answer demand.",
      "Paper I syllabus unit",
      "",
      "optional|paper-i|syllabus",
      "",
      "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202025",
      "Civil Services Main Examination 2025 Question Papers",
      "Mains discussion",
    ]),
    csvRow([
      2024,
      "Prelims",
      "unknown-subject",
      "General Studies Paper I",
      "Q2",
      "This row should fail because the subject slug is not in the catalog.",
      "Unknown",
      "",
      "bad",
      "",
      "https://upsc.gov.in/examinations/previous-question-papers?field_exam_name_value=civil+services",
      "UPSC Previous Question Papers Index",
      "Reject",
    ]),
  ].join("\n");

  await page.getByTestId("admin-pyq-import-textarea").fill(csv);
  await page.getByTestId("admin-pyq-import-run").click();
  await page.getByTestId("admin-pyq-import-result").waitFor({ timeout: 15000 });
  await page.getByText("Accepted rows: 2", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Rejected rows: 1", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Subject slug is not present", { exact: false }).waitFor({ timeout: 15000 });

  const importState = await page.evaluate((localLedgerKey) => {
    const records = JSON.parse(window.localStorage.getItem(localLedgerKey) || "[]");
    const geographyRow = document.querySelector('[data-testid="admin-pyq-coverage-row"][data-subject-slug="geography"]');
    return {
      recordCount: records.length,
      mappedCount: records.filter((record) => record.importStatus === "MAPPED").length,
      optionalCount: records.filter((record) => record.kind === "OPTIONAL_MAINS").length,
      exactCount: records.filter((record) => record.textStatus === "EXACT_VERIFIED").length,
      seedPackText: document.querySelector('[data-testid="admin-pyq-seed-pack"]')?.textContent || "",
      persistenceMode: document.querySelector('[data-testid="admin-pyq-import-persistence"]')?.getAttribute("data-sync-mode") || "",
      persistenceText: document.querySelector('[data-testid="admin-pyq-import-persistence"]')?.textContent || "",
      geographyCoverageText: geographyRow?.textContent || "",
      recentText: document.querySelector('[data-testid="admin-pyq-recent-records"]')?.textContent || "",
      summaryText: document.querySelector('[data-testid="admin-pyq-import-summary"]')?.textContent || "",
    };
  }, ledgerKey);
  checks.push({ label: "pyq-import-state", importState });

  if (
    importState.recordCount !== 2 ||
    importState.mappedCount !== 2 ||
    importState.optionalCount !== 1 ||
    importState.exactCount !== 2
  ) {
    throw new Error(`Unexpected staged ledger: ${JSON.stringify(importState)}`);
  }
  if (
    !importState.seedPackText.includes("9") ||
    !importState.seedPackText.includes("Pattern seeds") ||
    !importState.seedPackText.includes("not exact question text")
  ) {
    throw new Error(`Seed pack evidence missing: ${importState.seedPackText}`);
  }
  if (
    !["supabase", "local-only", "unavailable"].includes(importState.persistenceMode) ||
    !importState.persistenceText.includes("exact rows visible")
  ) {
    throw new Error(`Persistence evidence missing: ${JSON.stringify(importState)}`);
  }
  if (
    !importState.geographyCoverageText.includes("Geography") ||
    !importState.geographyCoverageText.includes("2") ||
    !importState.geographyCoverageText.includes("1")
  ) {
    throw new Error(`Geography coverage did not update: ${importState.geographyCoverageText}`);
  }
  if (
    !importState.recentText.includes("Anthropology") ||
    !importState.recentText.includes("EXACT VERIFIED") ||
    !importState.summaryText.includes("Seed patterns") ||
    !importState.summaryText.includes("Optional rows")
  ) {
    throw new Error(`Recent/summary import evidence missing: ${JSON.stringify(importState)}`);
  }

  await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-operator-dashboard").waitFor({ timeout: 15000 });
  await page.getByRole("link", { name: /Exact PYQ Import/i }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "admin-dashboard-pyq-import-link-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/admin/pyq-import`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-pyq-import-command").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "pyq-import-mobile", checks);

  const actionableConsoleErrors = consoleErrors.filter(
    (error) => !error.includes("AUTH | Firebase auth is not initialized")
  );
  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: actionableConsoleErrors.length === 0 && pageErrors.length === 0,
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
