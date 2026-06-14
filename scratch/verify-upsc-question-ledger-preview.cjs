const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase#main-website-question-ledger-preview`;
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
  await page.getByTestId("showcase-question-ledger-api-preview").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(
    () => document.querySelector('[data-testid="showcase-question-ledger-api-preview"]')?.getAttribute("data-api-status") === "ready",
    null,
    { timeout: 20000 }
  );

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="showcase-question-ledger-api-preview"]');
    const cards = Array.from(document.querySelectorAll('[data-testid="showcase-question-ledger-api-card"]'));
    const statements = Array.from(document.querySelectorAll('[data-testid="showcase-question-ledger-api-statement"]'));
    const options = Array.from(document.querySelectorAll('[data-testid="showcase-question-ledger-api-option"]'));
    const firstCard = cards[0];
    const text = document.body.innerText;

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      questionCount: Number(section?.getAttribute("data-question-count")),
      optionSetCount: Number(section?.getAttribute("data-option-set-count")),
      statementCoverageRows: Number(section?.getAttribute("data-statement-coverage-rows")),
      sourceSignalRows: Number(section?.getAttribute("data-source-signal-rows")),
      conceptSignalRows: Number(section?.getAttribute("data-concept-signal-rows")),
      manualCheckRows: Number(section?.getAttribute("data-manual-check-rows")),
      multiStatementCount: Number(section?.getAttribute("data-multi-statement-count")),
      directTextLeads: Number(section?.getAttribute("data-direct-text-leads")),
      conceptualLeads: Number(section?.getAttribute("data-conceptual-leads")),
      previewCardCount: Number(section?.getAttribute("data-preview-card-count")),
      renderedCards: cards.length,
      renderedStatements: statements.length,
      renderedOptions: options.length,
      firstQuestionNumber: firstCard?.getAttribute("data-question-number"),
      firstOptionCount: Number(firstCard?.getAttribute("data-option-count")),
      firstStatementCount: Number(firstCard?.getAttribute("data-statement-count")),
      firstCoverageCount: Number(firstCard?.getAttribute("data-coverage-count")),
      firstProofLocked: firstCard?.getAttribute("data-proof-locked"),
      firstAnswer: firstCard?.getAttribute("data-answer"),
      hasEndpointCopy: text.includes("/api/upsc/prelims-2026/question-ledger"),
      hasLiveCopy: text.includes("Question ledger endpoint is live with complete MCQ evidence cards."),
      hasCompleteCardCopy: (firstCard?.textContent || "").includes("Answer:") && (firstCard?.textContent || "").includes("Proof locked"),
      hasFullLedgerLink: Array.from(section?.querySelectorAll("a") || []).some(
        (link) => link.getAttribute("href") === "/upsc-prelims-2026-showcase#question-ledger"
      ),
      markCount: section?.querySelectorAll("mark").length || 0,
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasSection) throw new Error("Question ledger API preview did not render.");
  if (result.apiStatus !== "ready") throw new Error(`Question ledger API preview did not load: ${JSON.stringify(result)}`);
  if (result.version !== "upsc-prelims-2026-question-ledger-v1") {
    throw new Error(`Wrong ledger preview version: ${JSON.stringify(result)}`);
  }
  if (
    result.questionCount !== 100 ||
    result.optionSetCount !== 100 ||
    result.statementCoverageRows !== 275 ||
    result.multiStatementCount !== 75 ||
    result.directTextLeads !== 37 ||
    result.conceptualLeads !== 63
  ) {
    throw new Error(`Question ledger preview counts are wrong: ${JSON.stringify(result)}`);
  }
  if (result.sourceSignalRows !== 50 || result.conceptSignalRows !== 155 || result.manualCheckRows !== 70) {
    throw new Error(`Statement signal counts drifted: ${JSON.stringify(result)}`);
  }
  if (result.previewCardCount !== 3 || result.renderedCards !== 3) {
    throw new Error(`Expected 3 preview cards: ${JSON.stringify(result)}`);
  }
  if (
    result.firstQuestionNumber !== "1" ||
    result.firstOptionCount !== 4 ||
    result.firstStatementCount !== 3 ||
    result.firstCoverageCount !== 3 ||
    result.firstProofLocked !== "true" ||
    !result.firstAnswer
  ) {
    throw new Error(`First preview card is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.renderedStatements < 3 || result.renderedOptions < 10 || result.markCount < 5) {
    throw new Error(`Rendered MCQ detail is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasEndpointCopy || !result.hasLiveCopy || !result.hasCompleteCardCopy || !result.hasFullLedgerLink) {
    throw new Error(`Question ledger preview copy/links are incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 15000) throw new Error(`Showcase page appears under-rendered: ${JSON.stringify(result)}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("showcase-question-ledger-api-preview").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-question-ledger-api-preview.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-question-ledger-api-preview-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-question-ledger-api-preview.png"),
            path.join(artifactDir, "upsc-question-ledger-api-preview-mobile.png"),
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
