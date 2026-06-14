const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const localProofFeedStorageKey = "sarit-upsc-prelims-2026-public-proof-feed-local-v1";

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
    "economy-maintenance": "Ready",
  },
  completedModules: ["economy-master", "art-culture-bank", "history-tn-board"],
  completedTasks: ["ir-source-matrix", "st-current-source-tags", "eco-maintenance-test"],
  queuedBlueprints: ["ir-body-match-pair"],
};

const questionProofStates = {
  1: "Approved",
  2: "Rejected",
  3: "Build gap",
};

const questionProofPackets = {
  1: {
    sourceRef: "Economy module retained source",
    pageRef: "Page 4",
    teacherNote: "The exact term and trap logic are both present in retained notes.",
    publicClaim: "This question has retained proof and may be counted after review.",
    updatedAt: "2026-06-10T00:00:00.000Z",
  },
};

async function seedLocalState(context) {
  await context.addInitScript(
    ({ profile, strategyState, questionProofStates, questionProofPackets }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_local_admin_prelims_2026_question_proof_queue");
      window.localStorage.setItem("sarit-upsc-public-proof-feed-dry-run", "true");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("sarit-upsc-prelims-2027-strategy-v1", JSON.stringify(strategyState));
      window.localStorage.setItem("sarit-upsc-prelims-2026-question-proof-v1", JSON.stringify(questionProofStates));
      window.localStorage.setItem("sarit-upsc-prelims-2026-proof-packets-v1", JSON.stringify(questionProofPackets));
    },
    { profile, strategyState, questionProofStates, questionProofPackets }
  );
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
  await seedLocalState(context);

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("prelims-2026-question-proof-queue").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("prelims-2026-public-proof-feed-live-api").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => {
    const liveApi = document.querySelector('[data-testid="prelims-2026-public-proof-feed-live-api"]');
    return ["ready", "error"].includes(liveApi?.getAttribute("data-api-status") || "");
  });

  const before = await page.evaluate(() => {
    const queue = document.querySelector('[data-testid="prelims-2026-question-proof-queue"]');
    const publishPacket = document.querySelector('[data-testid="prelims-2026-website-publish-packet"]');
    const proofFeed = document.querySelector('[data-testid="prelims-2026-public-proof-feed"]');
    const liveApi = document.querySelector('[data-testid="prelims-2026-public-proof-feed-live-api"]');
    const releaseBoard = document.querySelector('[data-testid="prelims-2026-public-claim-release-board"]');
    const releaseRows = Array.from(document.querySelectorAll('[data-testid="prelims-2026-public-claim-row"]'));
    const editor = document.querySelector('[data-testid="prelims-2026-proof-packet-editor"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="prelims-2026-question-proof-row"]'));
    const decisions = rows.map((row) => row.getAttribute("data-proof-decision"));
    const auditStatuses = rows.map((row) => row.getAttribute("data-audit-status"));
    const packetStatuses = rows.map((row) => row.getAttribute("data-proof-packet-complete"));
    const bodyText = document.body.innerText;

    return {
      hasQueue: Boolean(queue),
      hasPublishPacket: Boolean(publishPacket),
      publishPacketReleaseCount: publishPacket?.getAttribute("data-release-count"),
      publishPacketHasCorrectedAudit: publishPacket?.textContent?.includes("Corrected research outcome") ?? false,
      hasProofFeed: Boolean(proofFeed),
      proofFeedClaimCount: proofFeed?.getAttribute("data-claim-count"),
      proofFeedHasVersion: proofFeed?.textContent?.includes('"version": "upsc-prelims-2026-public-proof-feed-v1"') ?? false,
      proofFeedHasReleasedClaims: proofFeed?.textContent?.includes('"releasedClaims"') ?? false,
      hasLiveApi: Boolean(liveApi),
      liveApiStatus: liveApi?.getAttribute("data-api-status"),
      liveApiMode: liveApi?.getAttribute("data-api-mode"),
      liveApiClaimCount: liveApi?.getAttribute("data-live-claim-count"),
      liveApiLocalClaimCount: liveApi?.getAttribute("data-local-claim-count"),
      liveApiInSync: liveApi?.getAttribute("data-feed-in-sync"),
      liveApiHasEndpoint: liveApi?.textContent?.includes("/api/upsc/prelims-2026/public-proof-feed") ?? false,
      liveApiHasPersistenceCopy: liveApi?.textContent?.includes("Persistence") ?? false,
      hasReleaseBoard: Boolean(releaseBoard),
      releaseRowCount: releaseRows.length,
      releaseQuestionNumbers: releaseRows.map((row) => row.getAttribute("data-question-number")),
      hasEditor: Boolean(editor),
      editorSelectedQuestion: editor?.getAttribute("data-selected-question"),
      editorPacketComplete: editor?.getAttribute("data-packet-complete"),
      rowCount: rows.length,
      decisions,
      auditStatuses,
      packetStatuses,
      hasApproved: decisions.includes("Approved"),
      hasRejected: decisions.includes("Rejected"),
      hasBuildGap: decisions.includes("Build gap"),
      hasNeedsProof: decisions.includes("Needs proof"),
      hasCompletePacket: packetStatuses.includes("true"),
      hasDirect: auditStatuses.includes("direct"),
      hasPartial: auditStatuses.includes("partial"),
      hasFullLedgerLink: Array.from(document.querySelectorAll("a")).some(
        (link) => link.getAttribute("href") === "/upsc-prelims-2026-showcase#question-ledger"
      ),
      mentionsWebinar: /webinar/i.test(bodyText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: bodyText.trim().length,
    };
  });

  if (!before.hasQueue) throw new Error("Question proof queue did not render.");
  if (!before.hasPublishPacket || before.publishPacketReleaseCount !== "1" || !before.publishPacketHasCorrectedAudit) {
    throw new Error(`Website publish packet did not render seeded state: ${JSON.stringify(before)}`);
  }
  if (!before.hasProofFeed || before.proofFeedClaimCount !== "1" || !before.proofFeedHasVersion || !before.proofFeedHasReleasedClaims) {
    throw new Error(`Public proof feed did not render seeded state: ${JSON.stringify(before)}`);
  }
  if (
    !before.hasLiveApi ||
    !["ready", "error"].includes(before.liveApiStatus || "") ||
    before.liveApiLocalClaimCount !== "1" ||
    !before.liveApiHasEndpoint ||
    !before.liveApiHasPersistenceCopy
  ) {
    throw new Error(`Live proof-feed API checkpoint did not render seeded state: ${JSON.stringify(before)}`);
  }
  if (!before.hasReleaseBoard) throw new Error("Public claim release board did not render.");
  if (before.releaseRowCount !== 1 || !before.releaseQuestionNumbers.includes("1")) {
    throw new Error(`Expected seeded release row for Q1: ${JSON.stringify(before)}`);
  }
  if (!before.hasEditor) throw new Error("Proof packet editor did not render.");
  if (before.rowCount < 97) throw new Error(`Expected at least 97 question proof rows, found ${before.rowCount}.`);
  if (!before.hasApproved || !before.hasRejected || !before.hasBuildGap || !before.hasNeedsProof) {
    throw new Error(`Missing expected proof decisions: ${JSON.stringify(before.decisions.slice(0, 12))}`);
  }
  if (!before.hasCompletePacket || before.editorPacketComplete !== "true") {
    throw new Error(`Expected seeded proof packet to be complete: ${JSON.stringify(before)}`);
  }
  if (!before.hasDirect || !before.hasPartial) {
    throw new Error(`Missing direct/partial audit mix: ${JSON.stringify(before.auditStatuses.slice(0, 12))}`);
  }
  if (!before.hasFullLedgerLink) throw new Error("Full MCQ ledger link is missing.");
  if (before.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (before.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (before.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (before.textLength < 2500) throw new Error("Page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  const firstNeedsProofRow = page
    .locator('[data-testid="prelims-2026-question-proof-row"][data-proof-decision="Needs proof"]')
    .first();
  await firstNeedsProofRow.scrollIntoViewIfNeeded();
  const selectedQuestionNumber = await firstNeedsProofRow.getAttribute("data-question-number");
  await firstNeedsProofRow.getByRole("button", { name: "Edit proof packet" }).click();

  const editor = page.getByTestId("prelims-2026-proof-packet-editor");
  await editor.scrollIntoViewIfNeeded();
  await editor.getByLabel("Source reference").fill("Retained geography source pack");
  await editor.getByLabel("Page or location").fill("PDF page 18");
  await editor.getByLabel("Teacher note").fill("The retained source covers the asked concept and the exact elimination trap.");
  await editor
    .getByLabel("Public claim line")
    .fill("This MCQ can be claimed after retained page proof because the exact concept and trap are both covered.");
  await editor.getByRole("button", { name: "Approve with packet" }).click();

  const after = await page.evaluate(() => {
    const publishPacket = document.querySelector('[data-testid="prelims-2026-website-publish-packet"]');
    const proofFeed = document.querySelector('[data-testid="prelims-2026-public-proof-feed"]');
    const releaseRows = Array.from(document.querySelectorAll('[data-testid="prelims-2026-public-claim-row"]'));
    const approvedRows = Array.from(
      document.querySelectorAll('[data-testid="prelims-2026-question-proof-row"][data-proof-decision="Approved"]')
    );
    const packetRows = Array.from(
      document.querySelectorAll('[data-testid="prelims-2026-question-proof-row"][data-proof-packet-complete="true"]')
    );
    const editor = document.querySelector('[data-testid="prelims-2026-proof-packet-editor"]');
    const stored = JSON.parse(window.localStorage.getItem("sarit-upsc-prelims-2026-question-proof-v1") || "{}");
    const storedPackets = JSON.parse(window.localStorage.getItem("sarit-upsc-prelims-2026-proof-packets-v1") || "{}");

    return {
      approvedCount: approvedRows.length,
      publishPacketReleaseCount: publishPacket?.getAttribute("data-release-count"),
      publishPacketHasNewClaim:
        publishPacket?.textContent?.includes(
          "This MCQ can be claimed after retained page proof because the exact concept and trap are both covered."
        ) ?? false,
      proofFeedClaimCount: proofFeed?.getAttribute("data-claim-count"),
      proofFeedHasNewClaim:
        proofFeed?.textContent?.includes(
          "This MCQ can be claimed after retained page proof because the exact concept and trap are both covered."
        ) ?? false,
      proofFeedHasMatchedPortions: proofFeed?.textContent?.includes('"matchedPortions"') ?? false,
      releaseRowCount: releaseRows.length,
      releaseQuestionNumbers: releaseRows.map((row) => row.getAttribute("data-question-number")),
      packetRowCount: packetRows.length,
      editorSelectedQuestion: editor?.getAttribute("data-selected-question"),
      editorPacketComplete: editor?.getAttribute("data-packet-complete"),
      storedApprovedCount: Object.values(stored).filter((value) => value === "Approved").length,
      storedPacketCount: Object.keys(storedPackets).length,
      storedPackets,
      storedKeys: Object.keys(stored).length,
    };
  });

  if (after.approvedCount < 2 || after.storedApprovedCount < 2) {
    throw new Error(`Approval click did not persist: ${JSON.stringify(after)}`);
  }
  if (after.packetRowCount < 2 || after.storedPacketCount < 2 || after.editorPacketComplete !== "true") {
    throw new Error(`Proof packet did not persist: ${JSON.stringify(after)}`);
  }
  if (after.releaseRowCount < 2 || !after.releaseQuestionNumbers.includes(String(selectedQuestionNumber))) {
    throw new Error(`Release board did not include approved proof packet: ${JSON.stringify(after)}`);
  }
  if (after.publishPacketReleaseCount !== "2" || !after.publishPacketHasNewClaim) {
    throw new Error(`Website publish packet did not include approved proof packet: ${JSON.stringify(after)}`);
  }
  if (after.proofFeedClaimCount !== "2" || !after.proofFeedHasNewClaim || !after.proofFeedHasMatchedPortions) {
    throw new Error(`Public proof feed did not include approved proof packet: ${JSON.stringify(after)}`);
  }
  if (String(after.editorSelectedQuestion) !== String(selectedQuestionNumber)) {
    throw new Error(`Editor did not stay on selected question ${selectedQuestionNumber}: ${JSON.stringify(after)}`);
  }

  const publishPacket = page.getByTestId("prelims-2026-website-publish-packet");
  await publishPacket.scrollIntoViewIfNeeded();
  await publishPacket.getByRole("button", { name: "Copy publish packet" }).click();
  await page.waitForFunction(() => {
    const packet = document.querySelector('[data-testid="prelims-2026-website-publish-packet"]');
    return packet?.textContent?.includes("Packet copied");
  });

  const proofFeed = page.getByTestId("prelims-2026-public-proof-feed");
  await proofFeed.scrollIntoViewIfNeeded();
  await proofFeed.getByRole("button", { name: "Copy proof feed" }).click();
  await page.waitForFunction(() => {
    const feed = document.querySelector('[data-testid="prelims-2026-public-proof-feed"]');
    return feed?.textContent?.includes("Feed copied");
  });
  await proofFeed.getByRole("button", { name: "Publish feed" }).click();
  await page.waitForFunction(() => {
    const status = document.querySelector('[data-testid="prelims-2026-public-proof-feed-api-status"]');
    return status?.getAttribute("data-api-status") === "saved";
  });

  const apiResult = await page.evaluate((localProofFeedStorageKey) => {
    const status = document.querySelector('[data-testid="prelims-2026-public-proof-feed-api-status"]');
    const liveApi = document.querySelector('[data-testid="prelims-2026-public-proof-feed-live-api"]');
    const rawLocalFeed = window.localStorage.getItem(localProofFeedStorageKey);
    const localFeed = rawLocalFeed ? JSON.parse(rawLocalFeed) : null;
    return {
      status: status?.getAttribute("data-api-status"),
      mode: status?.getAttribute("data-api-mode"),
      text: status?.textContent,
      liveStatus: liveApi?.getAttribute("data-api-status"),
      liveMode: liveApi?.getAttribute("data-api-mode"),
      liveClaimCount: liveApi?.getAttribute("data-live-claim-count"),
      liveLocalClaimCount: liveApi?.getAttribute("data-local-claim-count"),
      liveInSync: liveApi?.getAttribute("data-feed-in-sync"),
      liveText: liveApi?.textContent,
      localClaimCount: localFeed?.releasedClaims?.length ?? 0,
      localVersion: localFeed?.version ?? null,
    };
  }, localProofFeedStorageKey);

  if (apiResult.status !== "saved" || !["dry-run", "local-only", "supabase"].includes(apiResult.mode || "")) {
    throw new Error(`Public proof feed API publish did not succeed: ${JSON.stringify(apiResult)}`);
  }
  if (!apiResult.text?.includes("2 claims ready")) {
    throw new Error(`Public proof feed API status did not include claim count: ${JSON.stringify(apiResult)}`);
  }
  if (
    apiResult.liveStatus !== "ready" ||
    apiResult.liveMode !== "dry-run" ||
    apiResult.liveClaimCount !== "2" ||
    apiResult.liveLocalClaimCount !== "2" ||
    apiResult.liveInSync !== "true" ||
    !apiResult.liveText?.includes("Validated dry run")
  ) {
    throw new Error(`Live proof-feed API checkpoint did not sync after publish: ${JSON.stringify(apiResult)}`);
  }
  if (apiResult.localVersion !== "upsc-prelims-2026-public-proof-feed-v1" || apiResult.localClaimCount !== 2) {
    throw new Error(`Public proof feed local mirror was not retained: ${JSON.stringify(apiResult)}`);
  }

  const releaseRow = page.locator(`[data-testid="prelims-2026-public-claim-row"][data-question-number="${selectedQuestionNumber}"]`);
  await releaseRow.scrollIntoViewIfNeeded();
  await releaseRow.getByRole("button", { name: "Copy claim" }).click();
  await page.waitForFunction((questionNumber) => {
    const row = document.querySelector(
      `[data-testid="prelims-2026-public-claim-row"][data-question-number="${questionNumber}"]`
    );
    return row?.textContent?.includes("Copied");
  }, String(selectedQuestionNumber));

  await page.getByTestId("prelims-2026-public-proof-feed").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return { before, after, apiResult };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2026-public-proof-feed.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2026-public-proof-feed-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2026-public-proof-feed.png"),
            path.join(artifactDir, "upsc-prelims-2026-public-proof-feed-mobile.png"),
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
