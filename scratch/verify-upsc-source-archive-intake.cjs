const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/source-library`;
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

async function seedLocalState(context) {
  await context.addInitScript((profile) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_local_source_archive_intake");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
  }, profile);
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
  await page.getByTestId("upsc-morning-batch-archive-intake").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction(() => {
    const section = document.querySelector('[data-testid="upsc-morning-batch-archive-intake"]');
    return section?.getAttribute("data-scan-status") === "ready";
  }, null, { timeout: 30000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="upsc-morning-batch-archive-intake"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="upsc-source-archive-track"]'));
    const folders = Array.from(document.querySelectorAll('[data-testid="upsc-source-archive-folder"]'));
    const extensions = Array.from(document.querySelectorAll('[data-testid="upsc-source-archive-extension"]'));
    const sampleFiles = Array.from(document.querySelectorAll('[data-testid="upsc-source-archive-sample-file"]'));
    const recentFiles = Array.from(document.querySelectorAll('[data-testid="upsc-source-archive-recent-file"]'));
    const hitCounts = rows.map((row) => Number(row.getAttribute("data-hit-count")));
    const trackIds = rows.map((row) => row.getAttribute("data-track-id"));
    const decisions = rows.map((row) => row.getAttribute("data-decision"));
    const sampleCounts = rows.map((row) => Number(row.getAttribute("data-sample-count")));
    const text = section?.textContent || "";
    const pageText = document.body.innerText;

    return {
      hasSection: Boolean(section),
      scanStatus: section?.getAttribute("data-scan-status"),
      proofRule: section?.getAttribute("data-proof-rule"),
      totalFiles: Number(section?.getAttribute("data-total-files")),
      pdfCount: Number(section?.getAttribute("data-pdf-count")),
      docxCount: Number(section?.getAttribute("data-docx-count")),
      imageCount: Number(section?.getAttribute("data-image-count")),
      directoryCount: Number(section?.getAttribute("data-directory-count")),
      totalBytes: Number(section?.getAttribute("data-total-bytes")),
      trackCount: Number(section?.getAttribute("data-track-count")),
      strongestTrackId: section?.getAttribute("data-strongest-track-id"),
      rowCount: rows.length,
      folderCount: folders.length,
      extensionRowCount: extensions.length,
      sampleFileCount: sampleFiles.length,
      recentFileCount: recentFiles.length,
      trackIds,
      hitCounts,
      decisions,
      sampleCounts,
      folderNames: folders.map((folder) => folder.getAttribute("data-folder-name")),
      extensionCounts: Object.fromEntries(extensions.map((extension) => [extension.getAttribute("data-extension"), Number(extension.getAttribute("data-count"))])),
      sampleTrackIds: Array.from(new Set(sampleFiles.map((file) => file.getAttribute("data-track-id")))),
      sampleExtensions: Array.from(new Set(sampleFiles.map((file) => file.getAttribute("data-extension")))),
      recentExtensions: Array.from(new Set(recentFiles.map((file) => file.getAttribute("data-extension")))),
      hasMorningBatchRoot: text.includes("Morning Batch"),
      hasPdfMetric: text.includes("PDFs"),
      hasProofQueueLink: Boolean(section?.querySelector('a[href="/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue"]')),
      hasIrCandidate: text.includes("D9_International_Organisations_Radar_UPSC2026.pdf"),
      hasScienceCandidate: text.includes("SARIT_CLASSES_ScienceTech_FULL_MODULE.pdf"),
      hasMedievalCandidate: text.includes("UPSC_Medieval_History_Master_Module_COMPLETE.pdf"),
      hasDecisionLabels:
        text.includes("Build from scratch") &&
        text.includes("Depth upgrade") &&
        text.includes("Patch and tag") &&
        text.includes("Maintain") &&
        text.includes("Reduce"),
      mentionsWebinar: /webinar/i.test(pageText),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasSection) throw new Error("Source archive intake section did not render.");
  if (result.scanStatus !== "ready") throw new Error(`Expected ready scan status, got ${result.scanStatus}.`);
  if (result.proofRule !== "local-archive-to-proof-queue-and-2027-course-correction") {
    throw new Error(`Wrong archive proof rule: ${JSON.stringify(result)}`);
  }
  if (result.totalFiles < 1000) throw new Error(`Expected at least 1000 archive files, found ${result.totalFiles}.`);
  if (result.pdfCount < 1000) throw new Error(`Expected at least 1000 PDFs, found ${result.pdfCount}.`);
  if (result.directoryCount < 30 || result.totalBytes < 1000000000) {
    throw new Error(`Archive size/directory scan is too small: ${JSON.stringify(result)}`);
  }
  if (result.trackCount !== 8 || result.rowCount !== 8) throw new Error(`Expected 8 archive tracks, found ${result.rowCount}.`);
  if (!result.trackIds.includes("ir-multilateral") || !result.trackIds.includes("science-new-domains")) {
    throw new Error(`Critical archive tracks are missing: ${JSON.stringify(result.trackIds)}`);
  }
  if (!result.strongestTrackId || !result.trackIds.includes(result.strongestTrackId)) {
    throw new Error(`Strongest archive track was not exposed: ${JSON.stringify(result)}`);
  }
  if (!result.hitCounts.every((count) => count > 0)) {
    throw new Error(`Every archive track should have at least one candidate file: ${JSON.stringify(result.hitCounts)}`);
  }
  if (!result.sampleCounts.every((count) => count > 0) || result.sampleFileCount < 20) {
    throw new Error(`Sample files are not exposed for every archive track: ${JSON.stringify(result)}`);
  }
  for (const decision of ["Build from scratch", "Depth upgrade", "Patch and tag", "Maintain", "Reduce"]) {
    if (!result.decisions.includes(decision)) throw new Error(`Missing archive decision ${decision}: ${JSON.stringify(result)}`);
  }
  if (result.folderCount < 6 || result.extensionRowCount < 3 || !result.extensionCounts[".pdf"]) {
    throw new Error(`Folder/type summaries are incomplete: ${JSON.stringify(result)}`);
  }
  for (const id of ["ir-multilateral", "science-new-domains", "polity-legal-ethics", "environment-current", "economy-maintenance"]) {
    if (!result.sampleTrackIds.includes(id)) throw new Error(`Missing sample file rows for ${id}: ${JSON.stringify(result)}`);
  }
  if (!result.sampleExtensions.includes(".pdf") || result.recentFileCount < 6 || !result.recentExtensions.includes(".pdf")) {
    throw new Error(`Recent/sample file rows do not expose PDF archive proof: ${JSON.stringify(result)}`);
  }
  if (!result.hasMorningBatchRoot || !result.hasPdfMetric || !result.hasProofQueueLink) {
    throw new Error(`Archive summary/linking is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasIrCandidate || !result.hasScienceCandidate || !result.hasMedievalCandidate) {
    throw new Error(`Expected source candidates are missing: ${JSON.stringify(result)}`);
  }
  if (!result.hasDecisionLabels) throw new Error("Decision labels are missing from source archive tracks.");
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 2400) throw new Error("Source archive intake appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("upsc-morning-batch-archive-intake").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-source-archive-intake.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-source-archive-intake-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-source-archive-intake.png"),
            path.join(artifactDir, "upsc-source-archive-intake-mobile.png"),
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
