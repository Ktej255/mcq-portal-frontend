const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-syllabus-pyq-trend-library-evidence.json");
const profileKey = "sarit-upsc-student-profile-v1";

async function seedSession(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((profileStorageKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_syllabus_pyq_trend");
    window.localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        level: "intermediate",
        preparationStage: "active",
        studyWindow: "90",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedSession(page);
  await page.goto(`${baseUrl}/upsc/source-library`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-source-library-hero").waitFor({ timeout: 15000 });
  await page.getByText("Trend boards", { exact: true }).waitFor({ timeout: 15000 });

  const libraryState = await page.evaluate(() => {
    const preloadProof = document.querySelector('[data-testid="upsc-syllabus-pyq-preload-proof"]');
    const paperIndexProof = document.querySelector('[data-testid="upsc-official-paper-index-proof"]');
    const packs = [...document.querySelectorAll('[data-testid="upsc-subject-source-pack"]')];
    const geographyPack = document.querySelector('[data-testid="upsc-subject-source-pack"][data-subject-slug="geography"]');
    const trendInsights = [...document.querySelectorAll('[data-testid="upsc-pyq-trend-insight"]')];
    const officialAnchors = [...document.querySelectorAll('[data-testid="upsc-official-source-anchors"] a')];
    const optionalCards = [...document.querySelectorAll('[data-testid="upsc-optional-source-pack-link"]')];
    const paperIndexRows = [...document.querySelectorAll('[data-testid="upsc-official-paper-index-row"]')];

    return {
      subjectPackCount: packs.length,
      preloadProof: {
        proofRule: preloadProof?.getAttribute("data-proof-rule"),
        yearWindow: preloadProof?.getAttribute("data-year-window"),
        coreSubjectCount: preloadProof?.getAttribute("data-core-subject-count"),
        optionalSubjectCount: preloadProof?.getAttribute("data-optional-subject-count"),
        gsPyqRows: preloadProof?.getAttribute("data-gs-pyq-rows"),
        optionalPyqRows: preloadProof?.getAttribute("data-optional-pyq-rows"),
        totalPyqRows: preloadProof?.getAttribute("data-total-pyq-rows"),
        sourceIndexedRows: preloadProof?.getAttribute("data-source-indexed-rows"),
        textImportPendingRows: preloadProof?.getAttribute("data-text-import-pending-rows"),
        officialAnchorCount: preloadProof?.getAttribute("data-official-anchor-count"),
        trendInsightCount: preloadProof?.getAttribute("data-trend-insight-count"),
        text: preloadProof?.textContent || "",
      },
      paperIndexProof: {
        proofRule: paperIndexProof?.getAttribute("data-proof-rule"),
        yearWindow: paperIndexProof?.getAttribute("data-year-window"),
        prelimsPaperRows: paperIndexProof?.getAttribute("data-prelims-paper-rows"),
        gsMainsPaperRows: paperIndexProof?.getAttribute("data-gs-mains-paper-rows"),
        optionalPaperIndexRows: paperIndexProof?.getAttribute("data-optional-paper-index-rows"),
        totalPaperIndexRows: paperIndexProof?.getAttribute("data-total-paper-index-rows"),
        directLinkedPaperRows: paperIndexProof?.getAttribute("data-direct-linked-paper-rows"),
        indexPagePaperRows: paperIndexProof?.getAttribute("data-index-page-paper-rows"),
        exactQuestionTextRows: paperIndexProof?.getAttribute("data-exact-question-text-rows"),
        text: paperIndexProof?.textContent || "",
      },
      paperIndexPreviewCount: paperIndexRows.length,
      paperIndexPreviewRows: paperIndexRows.map((row) => ({
        stage: row.getAttribute("data-stage"),
        year: row.getAttribute("data-year"),
        status: row.getAttribute("data-status"),
      })),
      officialAnchorCount: officialAnchors.length,
      optionalCardCount: optionalCards.length,
      trendInsightCount: trendInsights.length,
      trendEvidenceLevels: trendInsights.map((node) => node.getAttribute("data-evidence-level")),
      subjectPackRows: packs.map((pack) => ({
        slug: pack.getAttribute("data-subject-slug"),
        syllabusNodeCount: pack.getAttribute("data-syllabus-node-count"),
        pyqRowCount: pack.getAttribute("data-pyq-row-count"),
        indexedRowCount: pack.getAttribute("data-indexed-row-count"),
        pendingRowCount: pack.getAttribute("data-pending-row-count"),
        trendInsightCount: pack.getAttribute("data-trend-insight-count"),
        readinessScore: pack.getAttribute("data-readiness-score"),
      })),
      optionalPackRows: optionalCards.map((card) => ({
        slug: card.getAttribute("data-optional-slug"),
        paperRowCount: card.getAttribute("data-paper-row-count"),
        yearCount: card.getAttribute("data-year-count"),
        readinessScore: card.getAttribute("data-readiness-score"),
      })),
      geographyText: geographyPack?.textContent || "",
      bodyText: document.body.textContent || "",
    };
  });

  checks.push({ label: "source-library-trend-state", libraryState });

  const expectedPreloadProof = {
    proofRule: "core-and-optional-official-source-row-preload",
    yearWindow: "2015-2025",
    coreSubjectCount: "8",
    optionalSubjectCount: "48",
    gsPyqRows: "176",
    optionalPyqRows: "1056",
    totalPyqRows: "1232",
    sourceIndexedRows: "216",
    textImportPendingRows: "1016",
    officialAnchorCount: "5",
    trendInsightCount: "13",
  };
  const expectedPaperIndexProof = {
    proofRule: "official-paper-index-before-exact-question-import",
    yearWindow: "2015-2025",
    prelimsPaperRows: "22",
    gsMainsPaperRows: "55",
    optionalPaperIndexRows: "1056",
    totalPaperIndexRows: "1133",
    directLinkedPaperRows: "204",
    indexPagePaperRows: "929",
    exactQuestionTextRows: "0",
  };

  if (libraryState.subjectPackCount !== 8) {
    throw new Error(`Expected 8 GS source packs, got ${libraryState.subjectPackCount}`);
  }
  if (libraryState.officialAnchorCount !== 5) {
    throw new Error(`Expected 5 official source anchors, got ${libraryState.officialAnchorCount}`);
  }
  if (libraryState.optionalCardCount !== 48) {
    throw new Error(`Expected optional source cards, got ${libraryState.optionalCardCount}`);
  }
  if (libraryState.trendInsightCount !== 13) {
    throw new Error(`Expected subject trend insights, got ${libraryState.trendInsightCount}`);
  }
  for (const [key, expected] of Object.entries(expectedPreloadProof)) {
    if (libraryState.preloadProof[key] !== expected) {
      throw new Error(`Preload proof ${key} mismatch: ${JSON.stringify({ expected, actual: libraryState.preloadProof[key], preloadProof: libraryState.preloadProof })}`);
    }
  }
  for (const [key, expected] of Object.entries(expectedPaperIndexProof)) {
    if (libraryState.paperIndexProof[key] !== expected) {
      throw new Error(`Paper index proof ${key} mismatch: ${JSON.stringify({ expected, actual: libraryState.paperIndexProof[key], paperIndexProof: libraryState.paperIndexProof })}`);
    }
  }
  if (
    !libraryState.preloadProof.text.includes("GS and optional source rows are counted from one registry") ||
    !libraryState.preloadProof.text.includes("PDF text extraction and topic mapping")
  ) {
    throw new Error(`Preload proof missing visible audit language: ${libraryState.preloadProof.text}`);
  }
  if (
    libraryState.paperIndexPreviewCount < 6 ||
    !libraryState.paperIndexProof.text.includes("No exact question-text claim") ||
    !libraryState.paperIndexProof.text.includes("Paper sources are loaded before exact question import") ||
    libraryState.paperIndexPreviewRows.some((row) => row.status !== "direct-paper-page-linked")
  ) {
    throw new Error(`Paper index proof missing visible contract: ${JSON.stringify(libraryState.paperIndexProof)}`);
  }
  if (
    libraryState.subjectPackRows.some(
      (pack) =>
        pack.pyqRowCount !== "22" ||
        Number(pack.indexedRowCount) + Number(pack.pendingRowCount) !== 22 ||
        Number(pack.trendInsightCount) < 1 ||
        Number(pack.syllabusNodeCount) < 1
    )
  ) {
    throw new Error(`Subject source-pack row contract failed: ${JSON.stringify(libraryState.subjectPackRows)}`);
  }
  if (
    libraryState.optionalPackRows.some(
      (pack) => pack.paperRowCount !== "22" || pack.yearCount !== "11" || pack.readinessScore !== "18"
    )
  ) {
    throw new Error(`Optional source-pack row contract failed: ${JSON.stringify(libraryState.optionalPackRows)}`);
  }
  if (libraryState.trendEvidenceLevels.some((level) => level !== "topic-pattern-model")) {
    throw new Error(`Unexpected trend evidence levels: ${JSON.stringify(libraryState.trendEvidenceLevels)}`);
  }
  for (const required of [
    "Preload audit proof",
    "Map plus process explanation",
    "Systematic path rule",
    "Basics:",
    "Advanced:",
    "PYQ trend:",
    "Next-year focus:",
    "Current affairs:",
    "Gap:",
    "Revision:",
    "Official paper index",
    "Exact text rows",
    "Use trend signals to choose watch areas",
    "full PDF text extraction and exact topic tagging continue next",
  ]) {
    if (!libraryState.bodyText.includes(required)) {
      throw new Error(`Missing source-library text: ${required}`);
    }
  }
  for (const required of ["monsoon", "atlas proof", "recall prompts", "PYQ-style traps", "not guaranteed predictions"]) {
    if (!libraryState.geographyText.toLowerCase().includes(required.toLowerCase())) {
      throw new Error(`Missing geography trend detail: ${required}`);
    }
  }

  await assertNoOverflow(page, "source-library-desktop", checks);

  await page.goto(`${baseUrl}/upsc/optional-subjects/anthropology`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-optional-detail").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-optional-year-wise-pyqs").waitFor({ timeout: 15000 });
  const optionalState = await page.evaluate(() => ({
    text: document.body.textContent || "",
    rowCount: document.querySelectorAll('[data-testid="upsc-optional-year-wise-pyqs"] a').length,
  }));
  checks.push({ label: "optional-detail-year-wise-rows", optionalState });
  if (optionalState.rowCount < 10 || !optionalState.text.includes("Anthropology Paper I")) {
    throw new Error(`Optional year-wise rows missing: ${JSON.stringify(optionalState)}`);
  }
  await assertNoOverflow(page, "optional-detail-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/source-library`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-source-library-hero").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "source-library-mobile", checks);

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
