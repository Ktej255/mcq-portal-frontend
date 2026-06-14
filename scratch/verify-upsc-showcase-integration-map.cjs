const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const requiredDashboardAnchors = [
  "/upsc/prelims-2027-strategy#prelims-2027-publish-gate",
  "/upsc/prelims-2027-strategy#prelims-2026-public-claim-release-board",
  "/upsc/prelims-2027-strategy#prelims-2027-build-queue",
  "/upsc/prelims-2027-strategy#prelims-2026-website-publish-packet",
  "/upsc/prelims-review-command",
  "/upsc/prelims-2027-strategy#prelims-2027-delivery-dashboard",
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
  await page.locator('[data-testid="showcase-integration-map"]').waitFor({ state: "visible", timeout: 15000 });

  const result = await page.evaluate((expectedDashboardAnchors) => {
    const section = document.querySelector('[data-testid="showcase-integration-map"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="showcase-integration-row"]'));
    const rowData = rows.map((row) => ({
      publicAnchor: row.getAttribute("data-public-anchor"),
      dashboardRoute: row.getAttribute("data-dashboard-route"),
      proofStatus: row.getAttribute("data-proof-status"),
      linkTargets: Array.from(row.querySelectorAll("a")).map((link) => link.getAttribute("href")),
    }));
    const statuses = rowData.map((row) => row.proofStatus);
    const dashboardRoutes = rowData.map((row) => row.dashboardRoute);
    const text = document.body.innerText;

    return {
      hasSection: Boolean(section),
      rowCount: rows.length,
      rowData,
      statuses,
      hasPublicSafe: statuses.includes("Public safe"),
      hasProofLocked: statuses.includes("Proof locked"),
      hasPortalOwned: statuses.includes("Portal owned"),
      hasBuildQueue: statuses.includes("Build queue"),
      hasQuestionLedger: rowData.some((row) => row.publicAnchor === "/upsc-prelims-2026-showcase#question-ledger"),
      hasPortalPlan: rowData.some((row) => row.publicAnchor === "/upsc-prelims-2026-showcase#portal-plan"),
      hasAllDashboardAnchors: expectedDashboardAnchors.every((anchor) => dashboardRoutes.includes(anchor)),
      everyRowHasTwoLinks: rowData.every((row) => row.linkTargets.length === 2),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  }, requiredDashboardAnchors);

  if (!result.hasSection) throw new Error("Main website integration map did not render.");
  if (result.rowCount !== 6) throw new Error(`Expected 6 integration rows, found ${result.rowCount}.`);
  if (!result.hasPublicSafe || !result.hasProofLocked || !result.hasPortalOwned || !result.hasBuildQueue) {
    throw new Error(`Missing expected proof statuses: ${JSON.stringify(result.statuses)}`);
  }
  if (!result.hasQuestionLedger || !result.hasPortalPlan) {
    throw new Error(`Missing key public anchors: ${JSON.stringify(result.rowData)}`);
  }
  if (!result.hasAllDashboardAnchors) {
    throw new Error(`Missing dashboard anchors: ${JSON.stringify(result.rowData)}`);
  }
  if (!result.everyRowHasTwoLinks) throw new Error("Each integration row should expose public and portal links.");
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.locator('[data-testid="showcase-integration-map"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-showcase-integration-map.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-showcase-integration-map-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-showcase-integration-map.png"),
            path.join(artifactDir, "upsc-showcase-integration-map-mobile.png"),
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
