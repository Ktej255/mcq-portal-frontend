const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "verify-source-library-optional-pyq-evidence.json");

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

async function seedLocalSession(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((studentProfileKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_source_library_optional_pyq");
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
  }, profileKey);
}

function readNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be numeric, got ${value}`);
  return parsed;
}

async function readSourceLibraryState(page) {
  await page.goto(`${baseUrl}/upsc/source-library`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-source-library-hero").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-source-readiness-matrix").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-official-paper-index-proof").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-optional-source-packs").waitFor({ timeout: 15000 });

  return page.evaluate(() => {
    const preload = document.querySelector('[data-testid="upsc-syllabus-pyq-preload-proof"]');
    const paperIndex = document.querySelector('[data-testid="upsc-official-paper-index-proof"]');
    const matrix = document.querySelector('[data-testid="upsc-source-readiness-matrix"]');
    const readinessRows = [...document.querySelectorAll('[data-testid="upsc-source-readiness-row"]')].map((row) => ({
      id: row.getAttribute("data-readiness-id"),
      status: row.getAttribute("data-status"),
      studentReady: row.getAttribute("data-student-ready"),
      countLabel: row.getAttribute("data-count-label"),
      countValue: row.getAttribute("data-count-value"),
      text: row.textContent || "",
    }));
    const subjectPacks = [...document.querySelectorAll('[data-testid="upsc-subject-source-pack"]')].map((pack) => ({
      slug: pack.getAttribute("data-subject-slug"),
      syllabusNodeCount: pack.getAttribute("data-syllabus-node-count"),
      pyqRowCount: pack.getAttribute("data-pyq-row-count"),
      indexedRowCount: pack.getAttribute("data-indexed-row-count"),
      pendingRowCount: pack.getAttribute("data-pending-row-count"),
      trendInsightCount: pack.getAttribute("data-trend-insight-count"),
      readinessScore: pack.getAttribute("data-readiness-score"),
    }));
    const optionalLinks = [...document.querySelectorAll('[data-testid="upsc-optional-source-pack-link"]')].map((link) => ({
      slug: link.getAttribute("data-optional-slug"),
      paperRowCount: link.getAttribute("data-paper-row-count"),
      yearCount: link.getAttribute("data-year-count"),
      readinessScore: link.getAttribute("data-readiness-score"),
      href: link.getAttribute("href"),
      text: link.textContent || "",
    }));

    return {
      preload: {
        proofRule: preload?.getAttribute("data-proof-rule"),
        yearWindow: preload?.getAttribute("data-year-window"),
        coreSubjectCount: preload?.getAttribute("data-core-subject-count"),
        optionalSubjectCount: preload?.getAttribute("data-optional-subject-count"),
        gsPyqRows: preload?.getAttribute("data-gs-pyq-rows"),
        optionalPyqRows: preload?.getAttribute("data-optional-pyq-rows"),
        totalPyqRows: preload?.getAttribute("data-total-pyq-rows"),
        sourceIndexedRows: preload?.getAttribute("data-source-indexed-rows"),
        textImportPendingRows: preload?.getAttribute("data-text-import-pending-rows"),
        officialAnchorCount: preload?.getAttribute("data-official-anchor-count"),
        trendInsightCount: preload?.getAttribute("data-trend-insight-count"),
      },
      paperIndex: {
        proofRule: paperIndex?.getAttribute("data-proof-rule"),
        prelimsPaperRows: paperIndex?.getAttribute("data-prelims-paper-rows"),
        gsMainsPaperRows: paperIndex?.getAttribute("data-gs-mains-paper-rows"),
        optionalPaperIndexRows: paperIndex?.getAttribute("data-optional-paper-index-rows"),
        totalPaperIndexRows: paperIndex?.getAttribute("data-total-paper-index-rows"),
        directLinkedPaperRows: paperIndex?.getAttribute("data-direct-linked-paper-rows"),
        indexPagePaperRows: paperIndex?.getAttribute("data-index-page-paper-rows"),
        exactQuestionTextRows: paperIndex?.getAttribute("data-exact-question-text-rows"),
        text: paperIndex?.textContent || "",
      },
      matrix: {
        totalRows: matrix?.getAttribute("data-total-rows"),
        studentReadyRows: matrix?.getAttribute("data-student-ready-rows"),
        importPendingRows: matrix?.getAttribute("data-import-pending-rows"),
        rows: readinessRows,
      },
      subjectPacks,
      optionalLinks,
      officialAnchors: document.querySelectorAll('[data-testid="upsc-official-source-anchors"] a').length,
      bodyText: document.body.textContent || "",
    };
  });
}

async function readOptionalDetailState(page, slug) {
  await page.goto(`${baseUrl}/upsc/optional-subjects/${slug}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-optional-detail").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-optional-assembly-proof").waitFor({ timeout: 15000 });
  await page.getByTestId("upsc-optional-year-wise-pyqs").waitFor({ timeout: 15000 });

  return page.evaluate(() => {
    const readiness = document.querySelector('[data-testid="upsc-optional-readiness"]');
    const assembly = document.querySelector('[data-testid="upsc-optional-assembly-proof"]');
    const yearRows = [...document.querySelectorAll('[data-testid="upsc-optional-year-row"]')].map((row) => ({
      year: row.getAttribute("data-year"),
      indexedCount: row.getAttribute("data-indexed-count"),
      paperLinks: row.querySelectorAll("a").length,
      text: row.textContent || "",
    }));

    return {
      title: document.querySelector('[data-testid="upsc-optional-detail"] h1')?.textContent || "",
      yearCount: readiness?.getAttribute("data-year-count"),
      paperRowCount: readiness?.getAttribute("data-paper-row-count"),
      assembly: {
        yearWindow: assembly?.getAttribute("data-year-window"),
        totalYears: assembly?.getAttribute("data-total-years"),
        totalPaperRows: assembly?.getAttribute("data-total-paper-rows"),
        paperRowsPerYear: assembly?.getAttribute("data-paper-rows-per-year"),
        sourceIndexedYears: assembly?.getAttribute("data-source-indexed-years"),
        pendingTextYears: assembly?.getAttribute("data-pending-text-years"),
        text: assembly?.textContent || "",
      },
      yearRows,
      themeCount: document.querySelectorAll('[data-testid="upsc-optional-syllabus-themes"] article').length,
      paperSummaryCount: document.querySelectorAll('[data-testid="upsc-optional-paper-summary"] article').length,
    };
  });
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

  await seedLocalSession(page);

  const sourceState = await readSourceLibraryState(page);
  checks.push({ label: "source-library-state", sourceState });

  if (
    sourceState.preload.proofRule !== "core-and-optional-official-source-row-preload" ||
    sourceState.preload.yearWindow !== "2015-2025" ||
    readNumber(sourceState.preload.coreSubjectCount, "core subjects") !== 8 ||
    readNumber(sourceState.preload.optionalSubjectCount, "optional subjects") !== 48 ||
    readNumber(sourceState.preload.gsPyqRows, "GS PYQ rows") < 160 ||
    readNumber(sourceState.preload.optionalPyqRows, "optional PYQ rows") < 1000 ||
    readNumber(sourceState.preload.totalPyqRows, "total PYQ rows") < 1200 ||
    readNumber(sourceState.preload.officialAnchorCount, "official anchors") < 5
  ) {
    throw new Error(`Source preload proof failed: ${JSON.stringify(sourceState.preload)}`);
  }

  if (
    sourceState.paperIndex.proofRule !== "official-paper-index-before-exact-question-import" ||
    readNumber(sourceState.paperIndex.prelimsPaperRows, "prelims paper rows") !== 22 ||
    readNumber(sourceState.paperIndex.gsMainsPaperRows, "GS mains paper rows") !== 55 ||
    readNumber(sourceState.paperIndex.optionalPaperIndexRows, "optional paper rows") < 1000 ||
    readNumber(sourceState.paperIndex.totalPaperIndexRows, "total paper index rows") < 1100 ||
    readNumber(sourceState.paperIndex.directLinkedPaperRows, "direct linked paper rows") < 200 ||
    readNumber(sourceState.paperIndex.exactQuestionTextRows, "exact question text rows") !== 0 ||
    !sourceState.paperIndex.text.includes("No exact question-text claim")
  ) {
    throw new Error(`Official paper index proof failed: ${JSON.stringify(sourceState.paperIndex)}`);
  }

  const exactTextRow = sourceState.matrix.rows.find((row) => row.id === "exact-pyq-question-text");
  const officialSourceRow = sourceState.matrix.rows.find((row) => row.id === "official-paper-source-index");
  if (
    readNumber(sourceState.matrix.totalRows, "readiness matrix rows") !== 5 ||
    readNumber(sourceState.matrix.studentReadyRows, "student-ready rows") !== 3 ||
    readNumber(sourceState.matrix.importPendingRows, "import-pending rows") !== 1 ||
    !exactTextRow ||
    exactTextRow.status !== "import-pending" ||
    exactTextRow.studentReady !== "false" ||
    readNumber(exactTextRow.countValue, "exact text row count") !== 0 ||
    !exactTextRow.text.includes("Run the PDF extraction") ||
    !officialSourceRow ||
    officialSourceRow.status !== "source-index-ready" ||
    readNumber(officialSourceRow.countValue, "official source row count") < 1100
  ) {
    throw new Error(`Source readiness matrix failed: ${JSON.stringify(sourceState.matrix)}`);
  }

  if (
    sourceState.subjectPacks.length !== 8 ||
    sourceState.subjectPacks.some(
      (pack) =>
        readNumber(pack.pyqRowCount, `${pack.slug} PYQ rows`) !== 22 ||
        readNumber(pack.syllabusNodeCount, `${pack.slug} syllabus nodes`) < 3 ||
        readNumber(pack.trendInsightCount, `${pack.slug} trend insights`) < 2
    )
  ) {
    throw new Error(`Subject source packs failed: ${JSON.stringify(sourceState.subjectPacks)}`);
  }

  if (
    sourceState.optionalLinks.length !== 48 ||
    sourceState.optionalLinks.some(
      (link) =>
        readNumber(link.paperRowCount, `${link.slug} paper rows`) !== 22 ||
        readNumber(link.yearCount, `${link.slug} year count`) !== 11 ||
        !link.href?.startsWith("/upsc/optional-subjects/")
    )
  ) {
    throw new Error(`Optional source links failed: ${JSON.stringify(sourceState.optionalLinks)}`);
  }

  await assertNoOverflow(page, "source-library-desktop", checks);

  const geographyOptional = await readOptionalDetailState(page, "geography");
  checks.push({ label: "geography-optional-state", geographyOptional });
  if (
    geographyOptional.title !== "Geography" ||
    geographyOptional.yearCount !== "11" ||
    geographyOptional.paperRowCount !== "22" ||
    geographyOptional.assembly.yearWindow !== "2015-2025" ||
    geographyOptional.assembly.paperRowsPerYear !== "2" ||
    geographyOptional.yearRows.length !== 11 ||
    geographyOptional.yearRows.some((row) => row.paperLinks !== 2) ||
    geographyOptional.themeCount < 2 ||
    geographyOptional.paperSummaryCount !== 2 ||
    !geographyOptional.assembly.text.includes("Paper I/II rows are assembled")
  ) {
    throw new Error(`Geography optional detail failed: ${JSON.stringify(geographyOptional)}`);
  }
  await assertNoOverflow(page, "geography-optional-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/source-library`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-source-readiness-matrix").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "source-library-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
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
