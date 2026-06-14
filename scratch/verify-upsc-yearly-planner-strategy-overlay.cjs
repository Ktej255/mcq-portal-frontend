const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/yearly-planner`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

async function seedLocalState(context) {
  await context.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_yearly_planner_strategy_overlay");
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
  await page.getByTestId("upsc-2027-strategy-overlay").waitFor({ state: "visible", timeout: 20000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="upsc-2027-strategy-overlay"]');
    const priorityRows = Array.from(document.querySelectorAll('[data-testid="upsc-2027-strategy-priority-row"]'));
    const sprintRows = Array.from(document.querySelectorAll('[data-testid="upsc-2027-strategy-sprint-row"]'));
    const text = document.body.innerText;

    return {
      url: window.location.pathname,
      hasSection: Boolean(section),
      priorityCount: Number(section?.getAttribute("data-priority-count")),
      sprintCount: Number(section?.getAttribute("data-sprint-count")),
      renderedPriorityRows: priorityRows.length,
      renderedSprintRows: sprintRows.length,
      priorityIds: priorityRows.map((row) => row.getAttribute("data-priority-id")),
      priorityLevels: priorityRows.map((row) => row.getAttribute("data-priority")),
      decisions: priorityRows.map((row) => row.getAttribute("data-decision")),
      sprintIds: sprintRows.map((row) => row.getAttribute("data-sprint-id")),
      hasStrategyCommandLink: Boolean(
        section?.querySelector('a[href="/upsc/prelims-2027-strategy#prelims-2027-reallocation-board"]')
      ),
      hasAdminSidebarYearlyPlanner: Boolean(document.querySelector('a[href="/upsc/yearly-planner"]')),
      activeHref:
        Array.from(document.querySelectorAll("a")).find((link) => link.className.includes("bg-[#1a3a2a]"))?.getAttribute("href") ||
        "",
      hasCriticalCopy: text.includes("build IR and") && text.includes("new-domain S&T"),
      hasEconomyMaintenance: text.includes("Protect the existing strong Economy module"),
      hasMedievalReduction: text.includes("Cap Medieval at maintenance"),
      hasProofGate: /proof locked/i.test(text) && /source\/page evidence/i.test(text),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (result.url !== "/upsc/yearly-planner") throw new Error(`Unexpected route after navigation: ${result.url}`);
  if (!result.hasSection) throw new Error("2027 strategy overlay did not render.");
  if (result.priorityCount !== 8 || result.renderedPriorityRows !== 8) {
    throw new Error(`Expected 8 strategy priorities: ${JSON.stringify(result)}`);
  }
  if (result.sprintCount !== 6 || result.renderedSprintRows !== 6) {
    throw new Error(`Expected 6 strategy sprints: ${JSON.stringify(result)}`);
  }
  for (const id of ["ir-multilateral", "science-new-domains", "economy-maintenance", "medieval-reduction"]) {
    if (!result.priorityIds.includes(id)) throw new Error(`Missing priority ${id}: ${JSON.stringify(result)}`);
  }
  if (!result.priorityLevels.includes("Critical") || !result.decisions.includes("Build from scratch")) {
    throw new Error(`Critical rebuild signals are missing: ${JSON.stringify(result)}`);
  }
  if (!result.sprintIds.includes("sprint-1-source-foundation") || !result.sprintIds.includes("sprint-6-maintenance-publication")) {
    throw new Error(`Sprint sequence is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasStrategyCommandLink) throw new Error("Strategy command handoff link is missing.");
  if (!result.hasAdminSidebarYearlyPlanner || result.activeHref !== "/upsc/yearly-planner") {
    throw new Error(`Yearly Planner is not active in admin sidebar: ${JSON.stringify(result)}`);
  }
  if (!result.hasCriticalCopy || !result.hasEconomyMaintenance || !result.hasMedievalReduction || !result.hasProofGate) {
    throw new Error(`Strategy overlay copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 6000) throw new Error("Yearly planner appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("upsc-2027-strategy-overlay").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-yearly-planner-strategy-overlay.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-yearly-planner-strategy-overlay-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-yearly-planner-strategy-overlay.png"),
            path.join(artifactDir, "upsc-yearly-planner-strategy-overlay-mobile.png"),
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
