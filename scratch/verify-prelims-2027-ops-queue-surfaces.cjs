const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const workOrderStorageKey = "sarit-upsc-prelims-2026-source-gap-work-orders-v1";

const profile = {
  level: "advanced",
  preparationStage: "multiple-attempts",
  studyWindow: "120",
  learningStyle: "practice-first",
  weakSignal: "mcq-traps",
  studyTime: "morning",
  attemptHistory: "two-plus-attempts",
  learningPattern: "revision-first",
  mindState: "calm",
  updatedAt: "2026-06-10T00:00:00.000Z",
};

const strategyWorkOrders = {
  "source-gap-q43": {
    id: "source-gap-q43",
    questionNumber: 43,
    subject: "Current Affairs",
    status: "Source row drafted",
    sourceGap: "German Chancellor visit outcome source proof",
    sourceAction:
      "Create or rename a Morning Batch source row for Q43 (Current Affairs); retain exact file, page or slide proof before any public claim.",
    publicRule:
      "Public question-level claim remains blocked until source reference, page location, teacher note and public claim line are complete.",
    route: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:10:00.000Z",
  },
  "source-gap-q100": {
    id: "source-gap-q100",
    questionNumber: 100,
    subject: "Current Affairs",
    status: "Queued",
    sourceGap: "European Union member-country source proof",
    sourceAction:
      "Create or rename a Morning Batch source row for Q100 (Current Affairs); retain exact file, page or slide proof before any public claim.",
    publicRule:
      "Public question-level claim remains blocked until source reference, page location, teacher note and public claim line are complete.",
    route: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
    createdAt: "2026-06-10T00:05:00.000Z",
  },
};

async function seedLocalState(context) {
  await context.addInitScript(
    ({ profile, strategyWorkOrders, workOrderStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_prelims_2027_ops_queue");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem(workOrderStorageKey, JSON.stringify(strategyWorkOrders));
      window.localStorage.setItem(
        "sarit-upsc-daily-command-v1",
        JSON.stringify({ subjectSlug: "geography", day: 1, note: "" })
      );
    },
    { profile, strategyWorkOrders, workOrderStorageKey }
  );
}

async function inspectSurface(page, testId) {
  return page.evaluate((testId) => {
    const section = document.querySelector(`[data-testid="${testId}"]`);
    const rows = Array.from(section?.querySelectorAll(`[data-testid="${testId.replace("queue", "row")}"]`) ?? []);
    const pageText = document.body.innerText;
    const links = Array.from(section?.querySelectorAll("a") ?? []).map((link) => link.getAttribute("href"));

    return {
      hasSection: Boolean(section),
      sourceOrders: Number(section?.getAttribute("data-source-orders")),
      unresolvedOrders: Number(section?.getAttribute("data-unresolved-orders")),
      draftedOrders: Number(section?.getAttribute("data-drafted-orders")),
      actionCount: Number(section?.getAttribute("data-action-count")),
      rowCount: rows.length,
      statuses: rows.map((row) => row.getAttribute("data-status-label")),
      keys: rows.map((row) => row.getAttribute("data-action-key")),
      text: section?.textContent || "",
      links,
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  }, testId);
}

async function verifyPage(browser, route, testId, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await seedLocalState(context);
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.getByTestId(testId).waitFor({ state: "visible", timeout: 30000 });

  const result = await inspectSurface(page, testId);

  if (!result.hasSection) throw new Error(`${route}: strategy operations section did not render.`);
  if (result.sourceOrders !== 2 || result.unresolvedOrders !== 2 || result.draftedOrders !== 1) {
    throw new Error(`${route}: strategy operations metrics are wrong: ${JSON.stringify(result)}`);
  }
  if (result.actionCount !== 2 || result.rowCount !== 2) {
    throw new Error(`${route}: expected two strategy action rows: ${JSON.stringify(result)}`);
  }
  if (!result.keys.includes("source-gap-q43") || !result.keys.includes("source-gap-q100")) {
    throw new Error(`${route}: missing source-gap action keys: ${JSON.stringify(result)}`);
  }
  if (!result.statuses.includes("Queued") || !result.statuses.includes("Source row drafted")) {
    throw new Error(`${route}: missing source-gap statuses: ${JSON.stringify(result)}`);
  }
  if (!result.text.includes("Q43 source proof") || !result.text.includes("Q100 source proof")) {
    throw new Error(`${route}: source proof titles missing: ${JSON.stringify(result)}`);
  }
  if (!result.links.every((href) => href === "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue")) {
    throw new Error(`${route}: source-gap links do not point to proof queue: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error(`${route}: page still contains webinar wording.`);
  if (result.hasErrorOverlay) throw new Error(`${route}: framework error overlay is visible.`);
  if (result.horizontalOverflow) throw new Error(`${route}: page has horizontal overflow.`);
  if (consoleErrors.length) throw new Error(`${route}: console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId(testId).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    const checks = {
      dailyDesktop: await verifyPage(
        browser,
        "/upsc/daily-command",
        "daily-prelims-2027-ops-queue",
        { width: 1440, height: 1100 },
        "daily-prelims-2027-ops-queue.png"
      ),
      dailyMobile: await verifyPage(
        browser,
        "/upsc/daily-command",
        "daily-prelims-2027-ops-queue",
        { width: 390, height: 900 },
        "daily-prelims-2027-ops-queue-mobile.png"
      ),
      readinessDesktop: await verifyPage(
        browser,
        "/upsc/readiness-audit",
        "readiness-prelims-2027-ops-queue",
        { width: 1440, height: 1100 },
        "readiness-prelims-2027-ops-queue.png"
      ),
      readinessMobile: await verifyPage(
        browser,
        "/upsc/readiness-audit",
        "readiness-prelims-2027-ops-queue",
        { width: 390, height: 900 },
        "readiness-prelims-2027-ops-queue-mobile.png"
      ),
    };

    console.log(
      JSON.stringify(
        {
          ok: true,
          checks,
          artifacts: [
            path.join(artifactDir, "daily-prelims-2027-ops-queue.png"),
            path.join(artifactDir, "daily-prelims-2027-ops-queue-mobile.png"),
            path.join(artifactDir, "readiness-prelims-2027-ops-queue.png"),
            path.join(artifactDir, "readiness-prelims-2027-ops-queue-mobile.png"),
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
