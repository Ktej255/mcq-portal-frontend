const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-dual-ledger-explainer").waitFor({ state: "visible", timeout: 15000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="showcase-dual-ledger-explainer"]');
    const cards = Array.from(document.querySelectorAll('[data-testid="showcase-audit-ledger-card"]'));
    const text = document.body.innerText;

    return {
      hasSection: Boolean(section),
      cardCount: cards.length,
      hasAutomatedLabel: text.includes("Automated source-lead status") || text.includes("Automated source-lead ledger"),
      hasDirectTextLeads: text.includes("37 direct text leads, 63 conceptual leads"),
      hasCorrectedAuditCard: text.includes("Corrected final PDF audit"),
      hasCorrectedMetric: text.includes("44 direct / 30 partial / 23 misses"),
      hasPublicUseRule: text.includes("This is the main website number: 74 of 97 scorable questions"),
      oldAmbiguousHeading: text.includes("Candidate evidence status") || text.includes("37 direct leads, 63 conceptual leads"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasSection) throw new Error("Dual-ledger explainer did not render.");
  if (result.cardCount !== 2) throw new Error(`Expected 2 ledger cards, found ${result.cardCount}.`);
  if (!result.hasAutomatedLabel || !result.hasDirectTextLeads || !result.hasCorrectedAuditCard || !result.hasCorrectedMetric) {
    throw new Error(`Dual-ledger copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasPublicUseRule) throw new Error("Corrected public-use rule is missing.");
  if (result.oldAmbiguousHeading) throw new Error("Old ambiguous audit wording is still visible.");
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 4500) throw new Error("Page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("showcase-dual-ledger-explainer").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-showcase-dual-ledger.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-showcase-dual-ledger-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-showcase-dual-ledger.png"),
            path.join(artifactDir, "upsc-showcase-dual-ledger-mobile.png"),
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
