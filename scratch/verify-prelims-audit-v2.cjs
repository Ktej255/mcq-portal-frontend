const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-prelims-audit-v2-evidence.json");
const screenshotPath = path.join(__dirname, "verify-prelims-audit-v2.png");
const archiveScreenshotPath = path.join(__dirname, "verify-prelims-audit-v1-archive.png");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    window.MOCK_TOKEN = "MOCK_TOKEN_MASTER";
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER");
    localStorage.removeItem("prelims-v2-manual-review-v1");
  });

  await page.goto(`${baseUrl}/admin/prelims-audit-v2`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Morning Batch coverage proof", { timeout: 15000 });

  const bodyText = await page.locator("body").innerText();
  const normalizedBodyText = bodyText.toLowerCase();
  const actionBoardVisible = await page.locator('[data-testid="prelims-v2-action-board"]').isVisible();
  const manualQueueVisible = await page.locator('[data-testid="prelims-v2-manual-queue"]').isVisible();
  const sourceLockVisible = await page.locator('[data-testid="prelims-v2-source-lock"]').isVisible();
  const developmentTrackerVisible = await page.locator('[data-testid="prelims-v2-development-tracker"]').isVisible();
  const sourceIndexVisible = await page.locator('[data-testid="prelims-v2-source-index"]').isVisible();
  const sourceLibraryVisible = await page.locator('[data-testid="prelims-v2-source-library"]').isVisible();
  const claimDisciplineVisible = await page.locator('[data-testid="prelims-v2-claim-discipline"]').isVisible();
  const evidenceLedgerVisible = await page.locator('[data-testid="prelims-v2-evidence-ledger"]').isVisible();
  const verifiedClaimZeroVisible = await page.locator('[data-testid="prelims-v2-verified-claim-zero"]').isVisible();
  const verificationBacklogVisible = await page.locator('[data-testid="prelims-v2-verification-backlog"]').isVisible();
  const publicClaimLockVisible = await page.locator('[data-testid="prelims-v2-public-claim-lock"]').isVisible();
  const reviewWorkbenchVisible = await page.locator('[data-testid="prelims-v2-review-workbench"]').isVisible();
  const questionLedgerVisible = await page.locator('[data-testid="prelims-v2-question-ledger"]').isVisible();
  const sourceHintVisible = await page.locator('[data-testid^="prelims-v2-source-hint-"]').first().isVisible();
  await page.locator('button[data-review-decision="ocr-needed"]').first().click();
  const manualReviewDecisionPersisted = await page.evaluate(() => {
    const raw = localStorage.getItem("prelims-v2-manual-review-v1");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Object.values(parsed).some((entry) => entry && entry.decision === "ocr-needed");
  });
  const unauthenticatedApi = await page.request.get(`${baseUrl}/api/admin/prelims-audit-v2`);
  const internalPayload = await page.evaluate(async () => {
    const response = await fetch("/api/admin/prelims-audit-v2", {
      headers: { Authorization: "Bearer MOCK_TOKEN_MASTER" },
    });
    return response.json();
  });
  const forbiddenNames = [
    "IAS Baba",
    "IASBaba",
    "Legacy IAS",
    "Vision IAS",
    "Vajiram",
    "Drishti IAS",
    "Forum IAS",
    "Insights IAS",
    "Next IAS",
  ];
  const leaks = forbiddenNames.filter((name) => normalizedBodyText.includes(name.toLowerCase()));
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const publicContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${baseUrl}/admin/prelims-audit-v2`, { waitUntil: "domcontentloaded" });
  await publicPage.waitForURL(/\/(login|dashboard)/, { timeout: 15000 }).catch(() => {});
  const unauthenticatedUiText = (await publicPage.locator("body").innerText().catch(() => "")).toLowerCase();
  const unauthenticatedUiBlocksEvidence =
    (/\/(login|dashboard)/.test(publicPage.url())) &&
    !unauthenticatedUiText.includes("morning batch coverage proof") &&
    !unauthenticatedUiText.includes("master evidence room");
  await publicContext.close();

  await page.goto(`${baseUrl}/upsc/prelims-2026-audit-v2`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="admin-prelims-audit-v2-page"]', { timeout: 15000 });
  await page.waitForSelector("text=Morning Batch coverage proof", { timeout: 15000 });
  const adminBodyText = await page.locator("body").innerText();
  const normalizedAdminBodyText = adminBodyText.toLowerCase();
  const adminLeaks = forbiddenNames.filter((name) => normalizedAdminBodyText.includes(name.toLowerCase()));

  await page.goto(`${baseUrl}/upsc/prelims-2026-audit`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="prelims-v1-archive-notice"]', { timeout: 15000 });
  const archiveBodyText = await page.locator("body").innerText();
  const normalizedArchiveBodyText = archiveBodyText.toLowerCase();
  await page.screenshot({ path: archiveScreenshotPath, fullPage: true });
  const relevantPageErrors = pageErrors.filter(
    (message) => !message.includes("cannot have a negative time stamp"),
  );

  const checks = {
    pageLoaded: normalizedBodyText.includes("morning batch coverage proof"),
    versionVisible: normalizedBodyText.includes("internal version 2"),
    publicClaimMetricVisible:
      normalizedBodyText.includes("verified public coverage") &&
      normalizedBodyText.includes("not established"),
    paperSourceCaveatVisible:
      normalizedBodyText.includes("official upsc 2026 previous-question-paper upload") &&
      normalizedBodyText.includes("04 jun 2026"),
    subjectMatrixAvoidsVerifiedLeadCopy: !/\d+\/\d+\s+verified/i.test(bodyText),
    internalLeadMetricVisible:
      normalizedBodyText.includes("candidate direct leads") &&
      normalizedBodyText.includes("internal leads only") &&
      normalizedBodyText.includes("not public coverage"),
    masterOnlyVisible: normalizedBodyText.includes("master-only internal report"),
    sourceLockVisible,
    developmentTrackerVisible,
    sourceIndexVisible,
    sourceLibraryVisible,
    claimDisciplineVisible,
    evidenceLedgerVisible,
    verifiedClaimZeroVisible,
    verificationBacklogVisible,
    publicClaimLockVisible,
    reviewWorkbenchVisible,
    questionLedgerVisible,
    sourceHintVisible,
    actionBoardVisible,
    manualQueueVisible,
    manualReviewDecisionPersisted,
    publicClaimLockedVisible:
      normalizedBodyText.includes("public claim locked until manual/ocr pass") &&
      normalizedBodyText.includes("do not publish direct + partial") &&
      normalizedBodyText.includes("verified public coverage is not established"),
    manualReviewScopeVisible:
      normalizedBodyText.includes("manual review required") &&
      normalizedBodyText.includes("100 questions") &&
      normalizedBodyText.includes("all 100 questions are unverified"),
    ocrBacklogVisible:
      normalizedBodyText.includes("ocr and conversion backlog") &&
      bodyText.includes("670") &&
      bodyText.includes("14,671") &&
      bodyText.includes("257"),
    sourceFolderVisible: bodyText.includes("D:\\Graphology\\Paid Students\\Mians ready Dec 2025\\Morning Batch"),
    corpusShapeVisible: normalizedBodyText.includes("corpus shape"),
    topFolderVisible: normalizedBodyText.includes("prelims") && bodyText.includes("925"),
    allDocumentIntakeVisible:
      normalizedBodyText.includes("version 2 all-document intake") &&
      bodyText.includes("1,504") &&
      normalizedBodyText.includes("raw institution names suppressed"),
    developmentTrackerCopyVisible:
      normalizedBodyText.includes("v2 development status") &&
      normalizedBodyText.includes("morning batch intake") &&
      normalizedBodyText.includes("student visibility") &&
      normalizedBodyText.includes("public percentage") &&
      normalizedBodyText.includes("manual/ocr proof"),
    prelimsBucketsVisible:
      normalizedBodyText.includes("prelims subject buckets") &&
      normalizedBodyText.includes("polity") &&
      bodyText.includes("671"),
    apiRejectsUnauthenticated: unauthenticatedApi.status() === 403,
    uiRedirectsUnauthenticated: unauthenticatedUiBlocksEvidence,
    apiUsesAllDocuments: internalPayload?.method?.corpusMode === "all_documents",
    apiSourceIndexLoaded: internalPayload?.sourceIndex?.totals?.allFiles === 1504,
    apiInstitutionNamesSuppressed: internalPayload?.sourceIndex?.visibility?.rawInstitutionNamesSuppressed === true,
    apiQuestionsLoaded: internalPayload?.summary?.totalQuestions === 100,
    apiCandidateDirectLeadCount: internalPayload?.verification?.candidateDirect === 37,
    apiCandidatePartialLeadCount: internalPayload?.verification?.candidatePartial === 63,
    apiVerifiedPublicCoverageLocked:
      internalPayload?.verification?.publicCoveragePercent === null &&
      internalPayload?.verification?.verifiedDirect === 0 &&
      internalPayload?.verification?.manualReviewRequired === 100,
    apiQuestionLedgerUnverified:
      internalPayload?.verification?.questionLedger?.length === 100 &&
      internalPayload.verification.questionLedger.every((item) => item.verifiedStatus === "unverified"),
    apiSourceHintsAvailable: internalPayload?.matches?.some((match) =>
      match?.topMatches?.some((item) => item?.source?.sourceHint),
    ),
    adminPageLoaded: normalizedAdminBodyText.includes("prelims 2026 morning batch v2"),
    adminNavVisible: normalizedAdminBodyText.includes("prelims v2"),
    adminV2Active: normalizedAdminBodyText.includes("v2 is the active evidence view"),
    v1ArchiveVisible:
      normalizedArchiveBodyText.includes("internal version 1 archive") &&
      normalizedArchiveBodyText.includes("version 1 is retained only for master comparison") &&
      normalizedArchiveBodyText.includes("active v2"),
    forbiddenNameLeaks: leaks,
    adminForbiddenNameLeaks: adminLeaks,
    consoleErrors,
    pageErrors: relevantPageErrors,
  };

  await browser.close();

  fs.writeFileSync(evidencePath, JSON.stringify(checks, null, 2));

  const failed = Object.entries(checks).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== true;
  });

  if (failed.length) {
    console.error(JSON.stringify(checks, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(checks, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
