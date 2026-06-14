const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase#question-ledger`;
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
  await page.getByTestId("showcase-question-ledger").waitFor({ state: "visible", timeout: 20000 });
  await page.locator('[data-testid="showcase-question-evidence-card"][data-question-number="1"]').evaluate((node) => {
    node.setAttribute("open", "");
  });

  const initial = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="showcase-question-ledger"]');
    const cards = Array.from(document.querySelectorAll('[data-testid="showcase-question-evidence-card"]'));
    const first = document.querySelector('[data-testid="showcase-question-evidence-card"][data-question-number="1"]');
    const last = document.querySelector('[data-testid="showcase-question-evidence-card"][data-question-number="100"]');
    const optionCounts = cards.map((card) => Number(card.getAttribute("data-option-count")));
    const coverageCounts = cards.map((card) => Number(card.getAttribute("data-coverage-count")));
    const text = document.body.innerText;
    const ledgerText = section?.textContent || "";

    return {
      hasSection: Boolean(section),
      questionCountAttr: Number(section?.getAttribute("data-question-count")),
      directCountAttr: Number(section?.getAttribute("data-direct-count")),
      partialCountAttr: Number(section?.getAttribute("data-partial-count")),
      gapCountAttr: Number(section?.getAttribute("data-gap-count")),
      multiStatementCountAttr: Number(section?.getAttribute("data-multi-statement-count")),
      renderedCards: cards.length,
      firstStatus: first?.getAttribute("data-status"),
      lastStatus: last?.getAttribute("data-status"),
      firstOptionCount: Number(first?.getAttribute("data-option-count")),
      lastOptionCount: Number(last?.getAttribute("data-option-count")),
      firstCoverageCount: Number(first?.getAttribute("data-coverage-count")),
      lastCoverageCount: Number(last?.getAttribute("data-coverage-count")),
      totalCoverageRows: coverageCounts.reduce((sum, value) => sum + value, 0),
      minOptionCount: Math.min(...optionCounts),
      maxOptionCount: Math.max(...optionCounts),
      subjectSet: Array.from(new Set(cards.map((card) => card.getAttribute("data-subject")))).sort(),
      hasShowingCopy: text.includes("Showing 100 of 100 audited questions."),
      hasCompleteMcqCopy: ledgerText.includes("Complete MCQ with matched portions"),
      hasStatementCoverageCopy: ledgerText.includes("Statement coverage map"),
      hasAnswerCopy: ledgerText.includes("Answer:"),
      hasFirstStem: ledgerText.includes("In the Pleistocene period either the Yamuna once flowed into the Indus"),
      hasLastStem: ledgerText.includes("Which of the following countries are members of the European Union?"),
      hasLastOption: ledgerText.includes("2 and 3"),
      hasMatchScopeCopy: /highest matched portion|Match covers every MCQ portion|proof-locked/i.test(ledgerText),
      markCount: section ? section.querySelectorAll("mark").length : 0,
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!initial.hasSection) throw new Error("Question ledger did not render.");
  if (initial.questionCountAttr !== 100 || initial.renderedCards !== 100) {
    throw new Error(`Expected all 100 question cards: ${JSON.stringify(initial)}`);
  }
  if (initial.directCountAttr !== 37 || initial.partialCountAttr !== 63 || initial.gapCountAttr !== 0) {
    throw new Error(`Automated source-lead counts changed: ${JSON.stringify(initial)}`);
  }
  if (initial.multiStatementCountAttr !== 75 || initial.totalCoverageRows !== 275) {
    throw new Error(`Statement coverage totals are incomplete: ${JSON.stringify(initial)}`);
  }
  if (initial.minOptionCount < 2 || initial.maxOptionCount < 4 || initial.firstOptionCount !== 4 || initial.lastOptionCount !== 4) {
    throw new Error(`Options are not complete across cards: ${JSON.stringify(initial)}`);
  }
  if (initial.firstCoverageCount !== 3 || initial.lastCoverageCount !== 4) {
    throw new Error(`First/last statement coverage counts are wrong: ${JSON.stringify(initial)}`);
  }
  for (const subject of [
    "Ancient India",
    "Art and Culture",
    "Current Affairs",
    "Environment",
    "Geography",
    "Indian Economy",
    "Indian Polity",
    "Modern History",
    "Science and Technology",
  ]) {
    if (!initial.subjectSet.includes(subject)) throw new Error(`Missing subject ${subject}: ${JSON.stringify(initial)}`);
  }
  if (
    !initial.hasShowingCopy ||
    !initial.hasCompleteMcqCopy ||
    !initial.hasStatementCoverageCopy ||
    !initial.hasAnswerCopy ||
    !initial.hasFirstStem ||
    !initial.hasLastStem ||
    !initial.hasLastOption ||
    !initial.hasMatchScopeCopy
  ) {
    throw new Error(`Question ledger copy or complete MCQ text is incomplete: ${JSON.stringify(initial)}`);
  }
  if (initial.markCount < 10) throw new Error(`Highlighted matched portions did not render: ${JSON.stringify(initial)}`);
  if (initial.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (initial.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (initial.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (initial.textLength < 12000) throw new Error(`Showcase page appears under-rendered: ${JSON.stringify(initial)}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.selectOption("#showcase-status-filter", "direct");
  await page.waitForFunction(() => {
    return document.querySelectorAll('[data-testid="showcase-question-evidence-card"]').length === 37;
  });
  const directFilter = await page.evaluate(() => ({
    visibleCards: document.querySelectorAll('[data-testid="showcase-question-evidence-card"]').length,
    statuses: Array.from(document.querySelectorAll('[data-testid="showcase-question-evidence-card"]')).map((card) =>
      card.getAttribute("data-status")
    ),
    showingCopy: document.body.innerText.includes("Showing 37 of 100 audited questions."),
  }));
  if (directFilter.visibleCards !== 37 || directFilter.statuses.some((status) => status !== "direct") || !directFilter.showingCopy) {
    throw new Error(`Direct filter did not isolate direct leads: ${JSON.stringify(directFilter)}`);
  }

  await page.selectOption("#showcase-status-filter", "partial");
  await page.waitForFunction(() => {
    return document.querySelectorAll('[data-testid="showcase-question-evidence-card"]').length === 63;
  });
  const partialFilter = await page.evaluate(() => ({
    visibleCards: document.querySelectorAll('[data-testid="showcase-question-evidence-card"]').length,
    statuses: Array.from(document.querySelectorAll('[data-testid="showcase-question-evidence-card"]')).map((card) =>
      card.getAttribute("data-status")
    ),
    showingCopy: document.body.innerText.includes("Showing 63 of 100 audited questions."),
  }));
  if (
    partialFilter.visibleCards !== 63 ||
    partialFilter.statuses.some((status) => status !== "partial") ||
    !partialFilter.showingCopy
  ) {
    throw new Error(`Conceptual filter did not isolate partial leads: ${JSON.stringify(partialFilter)}`);
  }

  await page.selectOption("#showcase-status-filter", "all");
  await page.locator('[data-testid="showcase-question-evidence-card"][data-question-number="1"]').evaluate((node) => {
    node.setAttribute("open", "");
  });
  await page.getByTestId("showcase-question-ledger").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return { initial, directFilter, partialFilter };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-showcase-question-ledger.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-showcase-question-ledger-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-showcase-question-ledger.png"),
            path.join(artifactDir, "upsc-showcase-question-ledger-mobile.png"),
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
