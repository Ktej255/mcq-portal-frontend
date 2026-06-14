const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase#surprise-action-matrix`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2500)}` : message);
  }
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle", timeout: 90000 });
  await page.getByTestId("showcase-surprise-action-matrix").waitFor({ state: "visible", timeout: 30000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="showcase-surprise-action-matrix"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="showcase-surprise-action-row"]'));
    const sectionText = section?.textContent || "";
    const pageText = document.body.innerText;
    const links = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href") || "");

    return {
      hasSection: Boolean(section),
      rowCountAttr: Number(section?.getAttribute("data-row-count")),
      criticalCountAttr: Number(section?.getAttribute("data-critical-count")),
      buildFromScratchCountAttr: Number(section?.getAttribute("data-build-from-scratch-count")),
      sourceTaskCountAttr: Number(section?.getAttribute("data-source-task-count")),
      mcqTaskCountAttr: Number(section?.getAttribute("data-mcq-task-count")),
      renderedRows: rows.length,
      rowIds: rows.map((row) => row.getAttribute("data-priority-id")),
      criticalRows: rows.filter((row) => row.getAttribute("data-priority") === "Critical").length,
      buildRows: rows.filter((row) => row.getAttribute("data-reallocation-decision") === "Build from scratch").length,
      sourceTaskTotal: rows.reduce((total, row) => total + Number(row.getAttribute("data-source-task-count")), 0),
      mcqTaskTotal: rows.reduce((total, row) => total + Number(row.getAttribute("data-mcq-task-count")), 0),
      links,
      hasHeading: sectionText.includes("Every 2026 surprise becomes a 2027 operating decision."),
      hasIrSurprise: sectionText.includes("institutional role, membership, charter language and India links"),
      hasScienceSurprise: sectionText.includes("technology news into limitation, governance, use-case and strategic-material traps"),
      hasMedievalAbsence: sectionText.includes("The surprise was absence"),
      hasUntappedCopy: sectionText.includes("Mostly absent, not merely weak") && sectionText.includes("not enough official-current and application depth"),
      hasSoftwareActions: sectionText.includes("Create IR body source matrix") && sectionText.includes("Build monthly map radar"),
      hasProofGate: sectionText.includes("Do not show a public hit claim") && sectionText.includes("question-level hit claims wait"),
      hasSourceRoute: links.includes("/upsc/content-command?subject=internal-security-society&day=1"),
      hasScienceRoute: links.includes("/upsc/science-tech"),
      hasPlannerRoute: links.includes("/upsc/yearly-planner"),
      leakedLocalPath: ["D:\\", "C:\\", "relativePath", "sampleFiles", "Paid Students", "Mians ready Dec 2025"].some((token) =>
        sectionText.includes(token)
      ),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      sectionLength: sectionText.trim().length,
      pageLength: pageText.trim().length,
    };
  });

  assert(result.hasSection, "Surprise action matrix did not render", result);
  assert(result.rowCountAttr === 8 && result.renderedRows === 8, "Surprise action row count drifted", result);
  assert(result.criticalCountAttr === 2 && result.criticalRows === 2, "Critical surprise count drifted", result);
  assert(result.buildFromScratchCountAttr === 2 && result.buildRows === 2, "Build-from-scratch count drifted", result);
  assert(result.sourceTaskCountAttr === 7 && result.sourceTaskTotal === 7, "Source task count drifted", result);
  assert(result.mcqTaskCountAttr === 7 && result.mcqTaskTotal === 7, "MCQ task count drifted", result);
  for (const id of [
    "ir-multilateral",
    "science-new-domains",
    "polity-legal-ethics",
    "environment-current",
    "geography-international",
    "ancient-tn-board",
    "economy-maintenance",
    "medieval-reduction",
  ]) {
    assert(result.rowIds.includes(id), `Missing surprise matrix row ${id}`, result);
  }
  assert(
    result.hasHeading &&
      result.hasIrSurprise &&
      result.hasScienceSurprise &&
      result.hasMedievalAbsence &&
      result.hasUntappedCopy &&
      result.hasSoftwareActions &&
      result.hasProofGate,
    "Surprise/action matrix copy is incomplete",
    result
  );
  assert(result.hasSourceRoute && result.hasScienceRoute && result.hasPlannerRoute, "Surprise/action matrix route links are incomplete", result);
  assert(!result.leakedLocalPath, "Surprise/action matrix leaked a private path token", result);
  assert(!result.mentionsWebinar, "Page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Page has horizontal overflow", result);
  assert(result.sectionLength > 5200 && result.pageLength > 18000, "Surprise/action matrix appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("showcase-surprise-action-matrix").scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { ...result, screenshotPath };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-surprise-action-matrix.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-surprise-action-matrix-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [desktop.screenshotPath, mobile.screenshotPath],
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
