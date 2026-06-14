const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/readiness-audit`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const expectedRows = [
  "public-showcase",
  "proof-feed",
  "strategy-command",
  "content-build",
  "current-bridge",
  "practice-delivery",
  "revision-repair",
  "reports-feedback",
];
const expectedStatuses = [
  "Public safe",
  "Proof locked",
  "Build queue",
  "Teacher build orders",
  "Syllabus tagged",
  "Student evidence",
  "Format rebuild",
  "Measured",
];

async function seedLocalState(context) {
  await context.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_launch_readiness_matrix");
  });
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await seedLocalState(context);
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("upsc-2026-2027-launch-readiness-matrix").waitFor({
    state: "visible",
    timeout: 20000,
  });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="upsc-2026-2027-launch-readiness-matrix"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="upsc-2026-2027-launch-readiness-row"]'));
    const rowLinks = rows.map((row) => row.getAttribute("href"));
    const text = document.body.innerText;
    const sectionText = section?.textContent || "";

    return {
      url: window.location.pathname,
      hasSection: Boolean(section),
      rowCountAttr: Number(section?.getAttribute("data-row-count")),
      publicSafeCount: Number(section?.getAttribute("data-public-safe-count")),
      proofLockedCount: Number(section?.getAttribute("data-proof-locked-count")),
      measuredCount: Number(section?.getAttribute("data-measured-count")),
      proofRule: section?.getAttribute("data-proof-rule"),
      renderedRows: rows.length,
      rowIds: rows.map((row) => row.getAttribute("data-launch-id")),
      statuses: rows.map((row) => row.getAttribute("data-status")),
      rowLinks,
      hasPublicShowcaseLink: rowLinks.includes("/upsc-prelims-2026-showcase"),
      hasStrategyLink: rowLinks.includes("/upsc/prelims-2027-strategy"),
      hasStrategyProofFeedLink: rowLinks.includes("/upsc/prelims-2027-strategy#prelims-2026-public-proof-feed"),
      hasContentLink: rowLinks.includes("/upsc/content-command"),
      hasCurrentLink: rowLinks.includes("/upsc/current-affairs"),
      hasQuestionBankLink: rowLinks.includes("/upsc/question-bank"),
      hasRevisionLink: rowLinks.includes("/upsc/revision-command"),
      hasReportsLink: rowLinks.includes("/reports"),
      hasPublicShowcaseCopy: /public showcase/i.test(sectionText),
      hasProofFeedCopy: /proof feed/i.test(sectionText),
      hasMainSiteCopy: /main-site copy/i.test(sectionText),
      hasStudentEvidenceCopy: /student evidence/i.test(sectionText),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (result.url !== "/upsc/readiness-audit") {
    throw new Error(`Unexpected route after navigation: ${result.url}`);
  }
  if (!result.hasSection) throw new Error("Launch readiness matrix did not render.");
  if (result.proofRule !== "public-page-proof-feed-strategy-student-evidence-chain") {
    throw new Error(`Wrong proof rule: ${JSON.stringify(result)}`);
  }
  if (result.rowCountAttr !== expectedRows.length || result.renderedRows !== expectedRows.length) {
    throw new Error(`Expected eight launch rows: ${JSON.stringify(result)}`);
  }
  if (result.publicSafeCount !== 1 || result.proofLockedCount !== 1 || result.measuredCount !== 2) {
    throw new Error(`Matrix counters are wrong: ${JSON.stringify(result)}`);
  }
  for (const id of expectedRows) {
    if (!result.rowIds.includes(id)) throw new Error(`Missing launch row ${id}: ${JSON.stringify(result)}`);
  }
  for (const status of expectedStatuses) {
    if (!result.statuses.includes(status)) throw new Error(`Missing launch status ${status}: ${JSON.stringify(result)}`);
  }
  if (
    !result.hasPublicShowcaseLink ||
    !result.hasStrategyLink ||
    !result.hasStrategyProofFeedLink ||
    !result.hasContentLink ||
    !result.hasCurrentLink ||
    !result.hasQuestionBankLink ||
    !result.hasRevisionLink ||
    !result.hasReportsLink
  ) {
    throw new Error(`One or more launch handoff links are missing: ${JSON.stringify(result)}`);
  }
  if (!result.hasPublicShowcaseCopy || !result.hasProofFeedCopy || !result.hasMainSiteCopy || !result.hasStudentEvidenceCopy) {
    throw new Error(`Launch chain copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 6500) throw new Error(`Readiness audit page appears under-rendered: ${JSON.stringify(result)}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("upsc-2026-2027-launch-readiness-matrix").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-launch-readiness-matrix.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-launch-readiness-matrix-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-launch-readiness-matrix.png"),
            path.join(artifactDir, "upsc-launch-readiness-matrix-mobile.png"),
          ],
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
