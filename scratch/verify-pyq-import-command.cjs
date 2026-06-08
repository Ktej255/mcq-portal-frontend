const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const ledgerKey = "sarit-upsc-pyq-import-ledger-v1";
const profileKey = "sarit-upsc-student-profile-v1";
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

function readNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be numeric, got ${value}`);
  return parsed;
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

  await page.addInitScript(({ localLedgerKey, studentProfileKey }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_admin_pyq_import");
    if (!window.localStorage.getItem("verify-pyq-import-seeded")) {
      window.localStorage.removeItem(localLedgerKey);
      window.localStorage.setItem("verify-pyq-import-seeded", "true");
    }
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "intermediate",
        preparationStage: "active",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
  }, { localLedgerKey: ledgerKey, studentProfileKey: profileKey });

  await page.goto(`${baseUrl}/admin/pyq-import`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("admin-pyq-import-command").waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: "PYQ Import Command" }).waitFor({ timeout: 15000 });
  await page.getByText("Operator-only exact PYQ staging", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pyq-seed-pack").waitFor({ timeout: 15000 });
  await page.getByText("Built-in PYQ pattern seed pack", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pyq-import-persistence").waitFor({ timeout: 15000 });
  await page.getByTestId("admin-pyq-import-readiness-contract").waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const mode = document.querySelector('[data-testid="admin-pyq-import-persistence"]')?.getAttribute("data-sync-mode");
    return mode && mode !== "checking";
  }, null, { timeout: 15000 }).catch(() => {});

  const emptyReadinessState = await page.evaluate(() => {
    const contract = document.querySelector('[data-testid="admin-pyq-import-readiness-contract"]');
    const stages = [...document.querySelectorAll('[data-testid="admin-pyq-import-stage-row"]')].map((row) => ({
      id: row.getAttribute("data-stage-id"),
      status: row.getAttribute("data-stage-status"),
      rowCount: row.getAttribute("data-row-count"),
      text: row.textContent || "",
    }));

    return {
      proofRule: contract?.getAttribute("data-proof-rule"),
      officialPaperIndexRows: contract?.getAttribute("data-official-paper-index-rows"),
      directLinkedOfficialPapers: contract?.getAttribute("data-direct-linked-official-papers"),
      highPriorityPaperRows: contract?.getAttribute("data-high-priority-paper-rows"),
      exactQuestionTextRows: contract?.getAttribute("data-exact-question-text-rows"),
      mappedExactQuestionRows: contract?.getAttribute("data-mapped-exact-question-rows"),
      needsReviewRows: contract?.getAttribute("data-needs-review-rows"),
      strictCoveragePercent: contract?.getAttribute("data-strict-coverage-percent"),
      studentReady: contract?.getAttribute("data-student-ready"),
      text: contract?.textContent || "",
      stages,
    };
  });
  checks.push({ label: "pyq-import-empty-readiness", emptyReadinessState });

  const sourceIndexedStage = emptyReadinessState.stages.find((stage) => stage.id === "source-indexed");
  const textExtractionStage = emptyReadinessState.stages.find((stage) => stage.id === "text-extraction");
  const reviewStage = emptyReadinessState.stages.find((stage) => stage.id === "review-verification");
  const topicTaggingStage = emptyReadinessState.stages.find((stage) => stage.id === "topic-tagging");
  const plannerStage = emptyReadinessState.stages.find((stage) => stage.id === "planner-bank-connection");

  if (
    emptyReadinessState.proofRule !== "admin-exact-pyq-import-before-student-drills" ||
    readNumber(emptyReadinessState.officialPaperIndexRows, "official paper index rows") < 1100 ||
    readNumber(emptyReadinessState.directLinkedOfficialPapers, "direct-linked paper rows") < 200 ||
    readNumber(emptyReadinessState.highPriorityPaperRows, "high-priority paper rows") < 50 ||
    readNumber(emptyReadinessState.exactQuestionTextRows, "empty exact text rows") !== 0 ||
    readNumber(emptyReadinessState.mappedExactQuestionRows, "empty mapped exact rows") !== 0 ||
    readNumber(emptyReadinessState.needsReviewRows, "empty review rows") !== 0 ||
    readNumber(emptyReadinessState.strictCoveragePercent, "empty strict coverage") !== 0 ||
    emptyReadinessState.studentReady !== "false" ||
    emptyReadinessState.stages.length !== 5 ||
    sourceIndexedStage?.status !== "complete" ||
    textExtractionStage?.status !== "pending" ||
    reviewStage?.status !== "pending" ||
    topicTaggingStage?.status !== "pending" ||
    plannerStage?.status !== "pending" ||
    !emptyReadinessState.text.includes("Not student-ready")
  ) {
    throw new Error(`Empty PYQ readiness contract failed: ${JSON.stringify(emptyReadinessState)}`);
  }

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
    csvRow([
      2024,
      "Prelims",
      "geography",
      "General Studies Paper I",
      "Q3",
      "This row should fail because the source URL is not an official UPSC domain.",
      "Indian geography and mapping",
      "geo-india",
      "map|source",
      "geo-map-process",
      "https://example.com/non-official-upsc-paper.pdf",
      "Non-official mirror",
      "Reject",
    ]),
  ].join("\n");

  await page.getByTestId("admin-pyq-import-textarea").fill(csv);
  await page.getByTestId("admin-pyq-import-run").click();
  await page.getByTestId("admin-pyq-import-result").waitFor({ timeout: 15000 });
  await page.getByText("Accepted rows: 2", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Rejected rows: 2", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Subject slug is not present", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Official source URL must use the upsc.gov.in domain", { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const contract = document.querySelector('[data-testid="admin-pyq-import-readiness-contract"]');
    return contract?.getAttribute("data-exact-question-text-rows") === "2";
  }, null, { timeout: 15000 });

  const importState = await page.evaluate((localLedgerKey) => {
    const records = JSON.parse(window.localStorage.getItem(localLedgerKey) || "[]");
    const geographyRow = document.querySelector('[data-testid="admin-pyq-coverage-row"][data-subject-slug="geography"]');
    const readiness = document.querySelector('[data-testid="admin-pyq-import-readiness-contract"]');
    const stages = [...document.querySelectorAll('[data-testid="admin-pyq-import-stage-row"]')].map((row) => ({
      id: row.getAttribute("data-stage-id"),
      status: row.getAttribute("data-stage-status"),
      rowCount: row.getAttribute("data-row-count"),
      text: row.textContent || "",
    }));

    return {
      recordCount: records.length,
      mappedCount: records.filter((record) => record.importStatus === "MAPPED").length,
      optionalCount: records.filter((record) => record.kind === "OPTIONAL_MAINS").length,
      exactCount: records.filter((record) => record.textStatus === "EXACT_VERIFIED").length,
      readiness: {
        officialPaperIndexRows: readiness?.getAttribute("data-official-paper-index-rows"),
        exactQuestionTextRows: readiness?.getAttribute("data-exact-question-text-rows"),
        mappedExactQuestionRows: readiness?.getAttribute("data-mapped-exact-question-rows"),
        needsReviewRows: readiness?.getAttribute("data-needs-review-rows"),
        studentReady: readiness?.getAttribute("data-student-ready"),
        text: readiness?.textContent || "",
        stages,
      },
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
    importState.exactCount !== 2 ||
    readNumber(importState.readiness.exactQuestionTextRows, "imported readiness exact rows") !== 2 ||
    readNumber(importState.readiness.mappedExactQuestionRows, "imported readiness mapped rows") !== 2 ||
    readNumber(importState.readiness.needsReviewRows, "imported readiness review rows") !== 0 ||
    importState.readiness.studentReady !== "false"
  ) {
    throw new Error(`Unexpected staged ledger: ${JSON.stringify(importState)}`);
  }

  const importedTextStage = importState.readiness.stages.find((stage) => stage.id === "text-extraction");
  const importedReviewStage = importState.readiness.stages.find((stage) => stage.id === "review-verification");
  const importedTopicStage = importState.readiness.stages.find((stage) => stage.id === "topic-tagging");
  const importedPlannerStage = importState.readiness.stages.find((stage) => stage.id === "planner-bank-connection");
  if (
    importedTextStage?.status !== "active" ||
    importedReviewStage?.status !== "complete" ||
    importedTopicStage?.status !== "active" ||
    importedPlannerStage?.status !== "active" ||
    !importState.readiness.text.includes("Admin staging is active")
  ) {
    throw new Error(`Imported PYQ readiness stages failed: ${JSON.stringify(importState.readiness)}`);
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
  await page.waitForFunction(
    (localLedgerKey) => {
      const records = JSON.parse(window.localStorage.getItem(localLedgerKey) || "[]");
      const persistence = document.querySelector('[data-testid="admin-pyq-import-persistence"]');
      return (
        records.length === 2 &&
        persistence?.getAttribute("data-sync-mode") !== "checking" &&
        (persistence?.textContent || "").includes("2 exact rows visible")
      );
    },
    ledgerKey,
    { timeout: 15000 }
  );
  await page.waitForTimeout(1000);

  await page.goto(`${baseUrl}/upsc/source-library`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-official-paper-index-proof").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-exact-pyq-import-preview").waitFor({ timeout: 15000 });
  await page.waitForTimeout(1000);
  try {
    await page.waitForFunction((localLedgerKey) => {
      const records = JSON.parse(window.localStorage.getItem(localLedgerKey) || "[]");
      const paperIndex = document.querySelector('[data-testid="upsc-official-paper-index-proof"]');
      const preview = document.querySelector('[data-testid="upsc-exact-pyq-import-preview"]');
      return (
        records.length === 2 &&
        paperIndex?.getAttribute("data-exact-question-text-rows") === "2" &&
        preview?.getAttribute("data-exact-record-count") === "2"
      );
    }, ledgerKey, { timeout: 30000 });
  } catch (error) {
    const debugState = await page.evaluate((localLedgerKey) => {
      const records = JSON.parse(window.localStorage.getItem(localLedgerKey) || "[]");
      const paperIndex = document.querySelector('[data-testid="upsc-official-paper-index-proof"]');
      const preview = document.querySelector('[data-testid="upsc-exact-pyq-import-preview"]');
      return {
        localLedgerRows: records.length,
        localLedgerSubjects: records.map((record) => record.subjectSlug),
        paperExactRows: paperIndex?.getAttribute("data-exact-question-text-rows"),
        previewExactRows: preview?.getAttribute("data-exact-record-count"),
        previewImportedRows: preview?.getAttribute("data-imported-record-count"),
        previewText: preview?.textContent || "",
      };
    }, ledgerKey);
    throw new Error(`Source library import reflection did not settle: ${JSON.stringify(debugState)}`);
  }
  const sourceTruthState = await page.evaluate((localLedgerKey) => {
    const paperIndex = document.querySelector('[data-testid="upsc-official-paper-index-proof"]');
    const exactRow = [...document.querySelectorAll('[data-testid="upsc-source-readiness-row"]')].find(
      (row) => row.getAttribute("data-readiness-id") === "exact-pyq-question-text"
    );
    const preview = document.querySelector('[data-testid="upsc-exact-pyq-import-preview"]');
    const previewRows = [...document.querySelectorAll('[data-testid="upsc-exact-pyq-preview-row"]')].map((row) => ({
      id: row.getAttribute("data-record-id"),
      subjectSlug: row.getAttribute("data-subject-slug"),
      stage: row.getAttribute("data-stage"),
      kind: row.getAttribute("data-kind"),
      textStatus: row.getAttribute("data-text-status"),
      importStatus: row.getAttribute("data-import-status"),
      text: row.textContent || "",
    }));

    return {
      localLedgerRows: JSON.parse(window.localStorage.getItem(localLedgerKey) || "[]").length,
      exactQuestionTextRows: paperIndex?.getAttribute("data-exact-question-text-rows"),
      proofText: paperIndex?.textContent || "",
      exactRowStatus: exactRow?.getAttribute("data-status"),
      exactRowStudentReady: exactRow?.getAttribute("data-student-ready"),
      exactRowCount: exactRow?.getAttribute("data-count-value"),
      exactRowText: exactRow?.textContent || "",
      preview: {
        proofRule: preview?.getAttribute("data-proof-rule"),
        importedRecordCount: preview?.getAttribute("data-imported-record-count"),
        exactRecordCount: preview?.getAttribute("data-exact-record-count"),
        mappedRecordCount: preview?.getAttribute("data-mapped-record-count"),
        needsReviewCount: preview?.getAttribute("data-needs-review-count"),
        studentReady: preview?.getAttribute("data-student-ready"),
        text: preview?.textContent || "",
        rows: previewRows,
      },
    };
  }, ledgerKey);
  checks.push({ label: "source-library-reflects-admin-import", sourceTruthState });

  if (
    readNumber(sourceTruthState.exactQuestionTextRows, "source library exact rows") !== 2 ||
    sourceTruthState.exactRowStatus !== "partial-mapping" ||
    sourceTruthState.exactRowStudentReady !== "false" ||
    readNumber(sourceTruthState.exactRowCount, "source readiness exact row count") !== 2 ||
    !sourceTruthState.proofText.includes("2 exact verified question rows") ||
    sourceTruthState.preview.proofRule !== "local-exact-pyq-ledger-to-source-library" ||
    readNumber(sourceTruthState.preview.importedRecordCount, "source preview imported count") !== 2 ||
    readNumber(sourceTruthState.preview.exactRecordCount, "source preview exact count") !== 2 ||
    readNumber(sourceTruthState.preview.mappedRecordCount, "source preview mapped count") !== 2 ||
    readNumber(sourceTruthState.preview.needsReviewCount, "source preview review count") !== 0 ||
    sourceTruthState.preview.studentReady !== "false" ||
    sourceTruthState.preview.rows.length !== 2 ||
    !sourceTruthState.preview.text.includes("Verified rows now travel") ||
    !sourceTruthState.preview.text.includes("Anthropology") ||
    !sourceTruthState.preview.text.includes("EXACT VERIFIED")
  ) {
    throw new Error(`Source library exact-PYQ import bridge failed: ${JSON.stringify(sourceTruthState)}`);
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
