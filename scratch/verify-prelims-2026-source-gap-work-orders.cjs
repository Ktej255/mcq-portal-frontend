const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy`;
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

const strategyState = {
  statuses: {
    "ir-multilateral": "Building",
    "science-new-domains": "Building",
    "polity-legal-ethics": "Building",
  },
  completedModules: ["economy-master", "art-culture-bank", "history-tn-board"],
  completedTasks: ["ir-source-matrix", "st-domain-capsules", "polity-act-text-pack"],
  queuedBlueprints: [],
};

async function seedLocalState(context) {
  await context.addInitScript(
    ({ profile, strategyState, workOrderStorageKey }) => {
      window.MOCK_TOKEN = "MOCK_TOKEN_MASTER_source_gap_work_orders";
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_source_gap_work_orders");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("sarit-upsc-prelims-2027-strategy-v1", JSON.stringify(strategyState));
      window.localStorage.removeItem("sarit-upsc-prelims-2026-question-proof-v1");
      window.localStorage.removeItem("sarit-upsc-prelims-2026-proof-packets-v1");
      window.localStorage.removeItem(workOrderStorageKey);
    },
    { profile, strategyState, workOrderStorageKey }
  );
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
  await page.getByTestId("prelims-2026-source-gap-work-orders").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction(() => {
    const section = document.querySelector('[data-testid="prelims-2026-source-gap-work-orders"]');
    return section?.getAttribute("data-source-status") === "ready" && Number(section?.getAttribute("data-blind-spot-count")) > 0;
  }, null, { timeout: 30000 });

  const firstRow = page.getByTestId("prelims-2026-source-gap-work-order-row").first();
  const firstQuestionNumber = await firstRow.getAttribute("data-question-number");
  if (!firstQuestionNumber) throw new Error("First source-gap work-order row has no question number.");

  await firstRow.getByTestId("prelims-2026-source-gap-queue-button").click();
  await page.waitForFunction((questionNumber) => {
    const row = Array.from(document.querySelectorAll('[data-testid="prelims-2026-source-gap-work-order-row"]')).find(
      (item) => item.getAttribute("data-question-number") === questionNumber
    );
    const section = document.querySelector('[data-testid="prelims-2026-source-gap-work-orders"]');
    return row?.getAttribute("data-work-order-status") === "Queued" && section?.getAttribute("data-work-order-count") === "1";
  }, firstQuestionNumber);

  await firstRow.getByTestId("prelims-2026-source-gap-status-source-row-drafted").click();
  await page.waitForFunction((questionNumber) => {
    const row = Array.from(document.querySelectorAll('[data-testid="prelims-2026-source-gap-work-order-row"]')).find(
      (item) => item.getAttribute("data-question-number") === questionNumber
    );
    return row?.getAttribute("data-work-order-status") === "Source row drafted";
  }, firstQuestionNumber);

  const result = await page.evaluate(
    ({ firstQuestionNumber, workOrderStorageKey }) => {
      const section = document.querySelector('[data-testid="prelims-2026-source-gap-work-orders"]');
      const rows = Array.from(document.querySelectorAll('[data-testid="prelims-2026-source-gap-work-order-row"]'));
      const firstRow = rows.find((row) => row.getAttribute("data-question-number") === firstQuestionNumber);
      const publishGate = document.querySelector('[data-testid="prelims-2027-publish-gate"]');
      const coursePacket = document.querySelector('[data-testid="prelims-2027-course-correction-packet"]');
      const stored = JSON.parse(window.localStorage.getItem(workOrderStorageKey) || "{}");
      const storedOrder = stored[`source-gap-q${firstQuestionNumber}`];
      const text = section?.textContent || "";
      const pageText = document.body.innerText;

      return {
        hasSection: Boolean(section),
        sourceStatus: section?.getAttribute("data-source-status"),
        blindSpotCount: Number(section?.getAttribute("data-blind-spot-count")),
        workOrderCount: Number(section?.getAttribute("data-work-order-count")),
        unqueuedCount: Number(section?.getAttribute("data-unqueued-count")),
        draftedCount: Number(section?.getAttribute("data-drafted-count")),
        resolvedCount: Number(section?.getAttribute("data-resolved-count")),
        rowCount: rows.length,
        firstQuestionNumber,
        firstRowStatus: firstRow?.getAttribute("data-work-order-status"),
        storedStatus: storedOrder?.status,
        storedSubject: storedOrder?.subject,
        storedRoute: storedOrder?.route,
        hasHeading: text.includes("Convert no-source MCQs into owned archive and content tasks"),
        hasSourceAction: text.includes("Create or rename a Morning Batch source row"),
        hasPublicRule: text.includes("Public question-level claim remains blocked"),
        hasSourceIntakeLink: Boolean(section?.querySelector('a[href="/upsc/source-library#upsc-morning-batch-archive-intake"]')),
        hasProofQueueLink: Boolean(section?.querySelector('a[href="#prelims-2026-question-proof-queue"]')),
        publishGateHasWorkOrders: publishGate?.textContent?.includes("No-source MCQ work orders") ?? false,
        coursePacketHasWorkOrders: coursePacket?.textContent?.includes("Source gap work orders:") ?? false,
        coursePacketHasQuestion: coursePacket?.textContent?.includes(`Q${firstQuestionNumber}`) ?? false,
        mentionsWebinar: /webinar/i.test(pageText),
        hasErrorOverlay: Boolean(
          document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
        ),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        textLength: text.trim().length,
      };
    },
    { firstQuestionNumber, workOrderStorageKey }
  );

  if (!result.hasSection) throw new Error("Source-gap work-order section did not render.");
  if (result.sourceStatus !== "ready") throw new Error(`Expected ready source status, got ${result.sourceStatus}.`);
  if (result.blindSpotCount < 1 || result.rowCount < 1) {
    throw new Error(`Expected source-gap rows, got ${JSON.stringify(result)}`);
  }
  if (result.workOrderCount !== 1 || result.draftedCount !== 1 || result.firstRowStatus !== "Source row drafted") {
    throw new Error(`Source-gap status metrics did not update: ${JSON.stringify(result)}`);
  }
  if (result.storedStatus !== "Source row drafted" || !result.storedSubject || !result.storedRoute) {
    throw new Error(`Source-gap work order did not persist correctly: ${JSON.stringify(result)}`);
  }
  if (!result.hasHeading || !result.hasSourceAction || !result.hasPublicRule) {
    throw new Error(`Source-gap work-order copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasSourceIntakeLink || !result.hasProofQueueLink) {
    throw new Error(`Source-gap work-order links are incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.publishGateHasWorkOrders || !result.coursePacketHasWorkOrders || !result.coursePacketHasQuestion) {
    throw new Error(`Source-gap work orders are not reflected in gate/packet: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 1100) throw new Error("Source-gap work-order section appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("prelims-2026-source-gap-work-orders").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2026-source-gap-work-orders.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2026-source-gap-work-orders-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2026-source-gap-work-orders.png"),
            path.join(artifactDir, "upsc-prelims-2026-source-gap-work-orders-mobile.png"),
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
