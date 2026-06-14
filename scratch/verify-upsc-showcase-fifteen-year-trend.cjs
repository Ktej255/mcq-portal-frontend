const { chromium } = require("@playwright/test");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3021";
const route = `${baseUrl}/upsc-prelims-2026-showcase`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2000)}` : message);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await page.goto(route, { waitUntil: "networkidle", timeout: 90000 });
    await page.getByTestId("showcase-fifteen-year-trend").waitFor({ state: "visible", timeout: 30000 });
    await page.getByRole("tab", { name: /Subtopic shifts/i }).click();

    const result = await page.evaluate(() => {
      const section = document.querySelector('[data-testid="showcase-fifteen-year-trend"]');
      const rows = Array.from(document.querySelectorAll('[data-testid="showcase-fifteen-year-trend-row"]'));
      const bodyText = document.body.innerText;
      const pageText = document.documentElement.textContent || "";
      const requiredAreas = [
        "Ancient History",
        "Medieval History",
        "Modern History",
        "Art and Culture",
        "Polity and Governance",
        "International Relations",
        "Geography",
        "Environment",
        "Economy",
        "Science and Technology",
        "Current Affairs",
        "Schemes, Society and Social Justice",
      ];

      return {
        pathname: window.location.pathname,
        yearWindow: section?.getAttribute("data-year-window"),
        subjectCount: Number(section?.getAttribute("data-subject-count")),
        subtopicCount: Number(section?.getAttribute("data-subtopic-count")),
        rowCount: rows.length,
        areas: rows.map((row) => row.getAttribute("data-area")),
        requiredAreasPresent: requiredAreas.every((area) => bodyText.includes(area) || pageText.includes(area)),
        keepsFourYearChart: pageText.includes("Four-year subject swing") && pageText.includes("Question distribution trend"),
        hasTaxonomyCaution: pageText.includes("UPSC does not publish official subject-wise buckets"),
        hasMcqArchiveCopy: pageText.includes("400+ MCQs") && pageText.includes("Geography archive"),
        hasAllSubjectMcqCopy: pageText.includes("201 batch slots") && pageText.includes("5,025 planned MCQ authoring slots"),
        mentionsWebinar: /webinar/i.test(bodyText),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      };
    });

    assert(result.pathname === "/upsc-prelims-2026-showcase", "Wrong route", result);
    assert(result.keepsFourYearChart, "The original four-year trend chart copy is missing", result);
    assert(result.yearWindow === "2012-2026", "15-year window is missing", result);
    assert(result.subjectCount === 8, "15-year subject pressure chart should cover 8 subject groups", result);
    assert(result.subtopicCount === 12 && result.rowCount === 12, "15-year subtopic rows are incomplete", result);
    assert(result.requiredAreasPresent, "Not all requested subject/subtopic areas are visible", result);
    assert(result.hasTaxonomyCaution, "Trend taxonomy caution is missing", result);
    assert(result.hasMcqArchiveCopy && result.hasAllSubjectMcqCopy, "MCQ volume wording was not corrected", result);
    assert(!result.mentionsWebinar, "Public page contains webinar wording", result);
    assert(!result.horizontalOverflow, "Public page has horizontal overflow", result);
    assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

    await page.screenshot({
      path: path.join(artifactDir, "upsc-showcase-fifteen-year-trend.png"),
      fullPage: false,
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          result,
          artifact: path.join(artifactDir, "upsc-showcase-fifteen-year-trend.png"),
        },
        null,
        2
      )
    );
  } finally {
    await context.close();
    await browser.close();
  }
})();
