const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase#requirement-tracker`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const expectedRequirementIds = [
  "standalone-public-page",
  "main-site-safe-copy",
  "portal-ready-route",
  "final-pdf-analysis",
  "archive-scan",
  "what-we-built",
  "what-appeared",
  "surprise-elements",
  "question-patterns",
  "complete-mcq-highlight",
  "untapped-domains",
  "software-execution-path",
];

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-requirement-tracker").waitFor({ state: "visible", timeout: 20000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="showcase-requirement-tracker"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="showcase-requirement-row"]'));
    const text = document.body.innerText;
    const sectionText = section?.textContent || "";

    return {
      url: window.location.pathname,
      hasSection: Boolean(section),
      proofRule: section?.getAttribute("data-proof-rule"),
      requirementCount: Number(section?.getAttribute("data-requirement-count")),
      completeCount: Number(section?.getAttribute("data-complete-count")),
      proofLockedCount: Number(section?.getAttribute("data-proof-locked-count")),
      portalOwnedCount: Number(section?.getAttribute("data-portal-owned-count")),
      rowCount: rows.length,
      ids: rows.map((row) => row.getAttribute("data-requirement-id")),
      categories: Array.from(new Set(rows.map((row) => row.getAttribute("data-category")))).sort(),
      statuses: rows.map((row) => row.getAttribute("data-status")),
      owners: rows.map((row) => row.getAttribute("data-owner")),
      hasOriginalBuildBriefTitle: sectionText.includes("The original build brief is now visible on the page."),
      hasOldTenPointTitle: sectionText.includes("original 10-point brief"),
      hasStandaloneCopy: sectionText.includes("/upsc-prelims-2026-showcase"),
      hasMainSiteSafeCopy: sectionText.includes("Website copy blocks keep internal planning language out"),
      hasPdfCopy: sectionText.includes("2026 pattern shift, coverage audit, gaps and next build"),
      hasArchiveCopy: sectionText.includes("Source Library scan") && sectionText.includes("2027 decision tracks"),
      hasSurpriseMatrixCopy: sectionText.includes("surprise-to-software matrix") && sectionText.includes("2027 operating decisions"),
      hasCompleteMcqCopy: sectionText.includes("complete stem, statements, options, answer, highlighted match signals"),
      hasUntappedMatrixCopy: sectionText.includes("underbuilt domain") && sectionText.includes("linked portal route"),
      hasSoftwarePathCopy: sectionText.includes("Review Command starts the software handoff"),
      hasPortalOwner: sectionText.includes("/upsc/prelims-review-command"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (result.url !== "/upsc-prelims-2026-showcase") {
    throw new Error(`Unexpected route after navigation: ${result.url}`);
  }
  if (!result.hasSection) throw new Error("Requirement tracker did not render.");
  if (result.proofRule !== "original-brief-to-public-page-and-portal-handoff") {
    throw new Error(`Wrong proof rule: ${JSON.stringify(result)}`);
  }
  if (result.requirementCount !== 12 || result.rowCount !== 12) {
    throw new Error(`Expected 12 requirement rows: ${JSON.stringify(result)}`);
  }
  if (result.completeCount !== 10 || result.proofLockedCount !== 1 || result.portalOwnedCount !== 1) {
    throw new Error(`Requirement status counts are wrong: ${JSON.stringify(result)}`);
  }
  for (const id of expectedRequirementIds) {
    if (!result.ids.includes(id)) throw new Error(`Missing requirement id ${id}: ${JSON.stringify(result)}`);
  }
  for (const category of ["2027", "Archive", "Evidence", "MCQ proof", "Page", "Pattern", "Portal", "Research", "Trend", "Website"]) {
    if (!result.categories.includes(category)) throw new Error(`Missing category ${category}: ${JSON.stringify(result)}`);
  }
  for (const owner of [
    "/upsc-prelims-2026-showcase",
    "#website-copy-kit",
    "#surprise-action-matrix",
    "/upsc/prelims-2026-showcase",
    "/upsc/source-library#upsc-morning-batch-archive-intake",
    "/upsc/prelims-review-command",
  ]) {
    if (!result.owners.includes(owner)) throw new Error(`Missing owner ${owner}: ${JSON.stringify(result)}`);
  }
  if (
    !result.hasOriginalBuildBriefTitle ||
    result.hasOldTenPointTitle ||
    !result.hasStandaloneCopy ||
    !result.hasMainSiteSafeCopy ||
    !result.hasPdfCopy ||
    !result.hasArchiveCopy ||
    !result.hasSurpriseMatrixCopy ||
    !result.hasCompleteMcqCopy ||
    !result.hasUntappedMatrixCopy ||
    !result.hasSoftwarePathCopy ||
    !result.hasPortalOwner
  ) {
    throw new Error(`Requirement tracker copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 12000) throw new Error(`Showcase appears under-rendered: ${JSON.stringify(result)}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("showcase-requirement-tracker").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-showcase-requirement-tracker.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-showcase-requirement-tracker-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-showcase-requirement-tracker.png"),
            path.join(artifactDir, "upsc-showcase-requirement-tracker-mobile.png"),
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
