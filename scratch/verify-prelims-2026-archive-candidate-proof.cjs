const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

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
    ({ profile, strategyState }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_local_archive_candidate_proof");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("sarit-upsc-prelims-2027-strategy-v1", JSON.stringify(strategyState));
      window.localStorage.removeItem("sarit-upsc-prelims-2026-question-proof-v1");
      window.localStorage.removeItem("sarit-upsc-prelims-2026-proof-packets-v1");
    },
    { profile, strategyState }
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
  await page.getByTestId("prelims-2026-question-proof-queue").waitFor({ state: "visible", timeout: 30000 });
  const editor = page.getByTestId("prelims-2026-proof-packet-editor");
  await editor.scrollIntoViewIfNeeded();

  await page.waitForFunction(() => {
    const panel = document.querySelector('[data-testid="prelims-2026-archive-candidate-panel"]');
    return panel?.getAttribute("data-source-status") === "ready" && Number(panel.getAttribute("data-candidate-count")) > 0;
  }, null, { timeout: 30000 });

  const firstCandidatePath = await page
    .getByTestId("prelims-2026-archive-candidate-row")
    .first()
    .getAttribute("data-source-path");
  if (!firstCandidatePath) throw new Error("First archive candidate path is missing.");

  await page.getByTestId("prelims-2026-archive-candidate-row").first().getByRole("button", { name: "Use source" }).click();

  const result = await page.evaluate((firstCandidatePath) => {
    const panel = document.querySelector('[data-testid="prelims-2026-archive-candidate-panel"]');
    const editor = document.querySelector('[data-testid="prelims-2026-proof-packet-editor"]');
    const sourceInput = Array.from(document.querySelectorAll("input")).find((input) => input.value === firstCandidatePath);
    const pageInput = Array.from(document.querySelectorAll("input")).find((input) => input.placeholder === "Page, slide, timestamp or file section");
    const teacherNote = Array.from(document.querySelectorAll("textarea")).find((textarea) =>
      textarea.value.includes("Archive candidate selected from the Morning Batch source intake")
    );
    const approveButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Approve with packet")
    );
    const selectedQuestion = editor?.getAttribute("data-selected-question") || "";
    const packets = JSON.parse(window.localStorage.getItem("sarit-upsc-prelims-2026-proof-packets-v1") || "{}");
    const storedPacket = packets[selectedQuestion];
    const pageText = document.body.innerText;

    return {
      panelStatus: panel?.getAttribute("data-source-status"),
      trackCount: Number(panel?.getAttribute("data-track-count")),
      candidateCount: Number(panel?.getAttribute("data-candidate-count")),
      rowCount: document.querySelectorAll('[data-testid="prelims-2026-archive-candidate-row"]').length,
      firstCandidatePath,
      sourceInputValue: sourceInput?.value || "",
      pageInputValue: pageInput?.value || "",
      teacherNoteValue: teacherNote?.value || "",
      approveDisabled: approveButton?.hasAttribute("disabled") ?? false,
      storedSourceRef: storedPacket?.sourceRef || "",
      storedTeacherNote: storedPacket?.teacherNote || "",
      hasIntakeLink: Boolean(panel?.querySelector('a[href="/upsc/source-library#upsc-morning-batch-archive-intake"]')),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  }, firstCandidatePath);

  if (result.panelStatus !== "ready") throw new Error(`Expected ready archive panel, got ${result.panelStatus}.`);
  if (result.trackCount < 1 || result.candidateCount < 1 || result.rowCount < 1) {
    throw new Error(`Archive candidate panel is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.sourceInputValue !== firstCandidatePath || result.storedSourceRef !== firstCandidatePath) {
    throw new Error(`Archive candidate did not prefill source ref: ${JSON.stringify(result)}`);
  }
  if (!result.teacherNoteValue || !result.storedTeacherNote.includes("Archive candidate selected")) {
    throw new Error(`Archive candidate did not preserve a teacher note: ${JSON.stringify(result)}`);
  }
  if (result.pageInputValue) throw new Error("Archive candidate should not invent an exact page/location.");
  if (!result.approveDisabled) throw new Error("Proof approval should remain locked until page and public claim are filled.");
  if (!result.hasIntakeLink) throw new Error("Source intake link is missing from archive candidate panel.");
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await editor.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2026-archive-candidate-proof.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2026-archive-candidate-proof-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2026-archive-candidate-proof.png"),
            path.join(artifactDir, "upsc-prelims-2026-archive-candidate-proof-mobile.png"),
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
