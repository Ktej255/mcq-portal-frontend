const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const ledgerRoute = `${baseUrl}/api/upsc/prelims-2026/question-ledger`;
const publicRoute = `${baseUrl}/upsc-prelims-2026-showcase#coverage-map`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2000)}` : message);
  }
}

function countStatementFormats(questions) {
  return questions.reduce(
    (counts, question) => {
      const statementCount = question.question?.statements?.length ?? 0;
      if (statementCount >= 3) counts.threePlus += 1;
      else if (statementCount === 2) counts.two += 1;
      else counts.noList += 1;
      return counts;
    },
    { threePlus: 0, two: 0, noList: 0 }
  );
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const ledgerResponse = await page.request.get(ledgerRoute);
  const ledger = await ledgerResponse.json();
  assert(ledgerResponse.status() === 200, `Question-ledger API returned ${ledgerResponse.status()}`, ledger);
  assert(Array.isArray(ledger.questions) && ledger.questions.length === 100, "Question-ledger API questions are incomplete", ledger.summary);

  const expected = countStatementFormats(ledger.questions);
  const expectedMultiStatementTotal = expected.threePlus + expected.two;

  await page.goto(publicRoute, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-question-logic").waitFor({ state: "visible", timeout: 30000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="showcase-question-logic"]');
    const pageText = document.body.innerText;
    const sectionText = section?.textContent || "";

    return {
      hasSection: Boolean(section),
      threePlus: Number(section?.getAttribute("data-format-three-plus")),
      two: Number(section?.getAttribute("data-format-two")),
      noList: Number(section?.getAttribute("data-format-no-list")),
      multiStatementTotal: Number(section?.getAttribute("data-format-multi-statement-total")),
      hasThreePlusCopy: sectionText.includes("67 questions used 3+ statements"),
      hasDominanceCopy: pageText.includes("75/100"),
      hasFormatChartCopy: sectionText.includes("Statement architecture"),
      hasDepthChartCopy: sectionText.includes("Why questions were framed"),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: sectionText.trim().length,
    };
  });

  assert(result.hasSection, "Question logic section did not render", result);
  assert(
    result.threePlus === expected.threePlus &&
      result.two === expected.two &&
      result.noList === expected.noList &&
      result.multiStatementTotal === expectedMultiStatementTotal,
    "Question-format chart counts drifted from the live ledger",
    { expected, expectedMultiStatementTotal, result }
  );
  assert(result.hasThreePlusCopy && result.hasDominanceCopy, "Question-format copy drifted from chart counts", result);
  assert(result.hasFormatChartCopy && result.hasDepthChartCopy, "Question logic chart labels are incomplete", result);
  assert(!result.mentionsWebinar, "Page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Page has horizontal overflow", result);
  assert(result.textLength > 900, "Question logic section appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("showcase-question-logic").scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { expected, expectedMultiStatementTotal, result, screenshotPath };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-showcase-chart-consistency.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-showcase-chart-consistency-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          ledgerRoute,
          publicRoute,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-showcase-chart-consistency.png"),
            path.join(artifactDir, "upsc-showcase-chart-consistency-mobile.png"),
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
