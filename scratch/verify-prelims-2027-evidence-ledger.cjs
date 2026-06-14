const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const profile = {
  level: "intermediate",
  preparationStage: "coaching-complete",
  studyWindow: "120",
  learningStyle: "mixed",
  weakSignal: "mcq-traps",
  studyTime: "morning",
  attemptHistory: "one-attempt",
  learningPattern: "deep-work",
  mindState: "calm",
  updatedAt: "2026-06-10T00:00:00.000Z",
};

const strategyState = {
  statuses: {
    "ir-multilateral": "Building",
    "science-new-domains": "Building",
    "economy-maintenance": "Ready",
  },
  completedModules: ["economy-master", "art-culture-bank", "history-tn-board"],
  completedTasks: [
    "ir-source-matrix",
    "st-current-source-tags",
    "eco-irdai-pack",
    "eco-maintenance-test",
  ],
  queuedBlueprints: ["ir-body-match-pair"],
};

async function seedLocalState(context) {
  await context.addInitScript(
    ({ profile, strategyState }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_prelims_2027_evidence_ledger");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("sarit-upsc-prelims-2027-strategy-v1", JSON.stringify(strategyState));
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
  await page.getByTestId("prelims-2027-evidence-ledger").waitFor({ state: "visible", timeout: 15000 });

  const result = await page.evaluate(() => {
    const ledger = document.querySelector('[data-testid="prelims-2027-evidence-ledger"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="prelims-2027-evidence-row"]'));
    const statuses = rows.map((row) => row.getAttribute("data-proof-status"));
    const bodyText = document.body.innerText;

    return {
      hasLedger: Boolean(ledger),
      rowCount: rows.length,
      statuses,
      hasClaimReady: statuses.includes("Claim ready"),
      hasNeedsSourcePack: statuses.includes("Needs source pack"),
      hasNeedsPageProof: statuses.includes("Needs page proof"),
      hasInternalOnly: statuses.includes("Internal only"),
      mentionsWebinar: /webinar/i.test(bodyText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: bodyText.trim().length,
    };
  });

  if (!result.hasLedger) throw new Error("Evidence ledger did not render.");
  if (result.rowCount !== 8) throw new Error(`Expected 8 evidence rows, found ${result.rowCount}.`);
  if (!result.hasClaimReady || !result.hasNeedsSourcePack || !result.hasNeedsPageProof || !result.hasInternalOnly) {
    throw new Error(`Missing expected proof status mix: ${JSON.stringify(result.statuses)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 1500) throw new Error("Page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("prelims-2027-evidence-ledger").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2027-evidence-ledger.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2027-evidence-ledger-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2027-evidence-ledger.png"),
            path.join(artifactDir, "upsc-prelims-2027-evidence-ledger-mobile.png"),
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
