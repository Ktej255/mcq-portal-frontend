const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "history-content-depth-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "history-content-depth-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still shows old branding.`);
  }
}

async function expectText(page, label, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
  return { label, text };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const findings = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_history_content_depth");
  });

  await page.goto(`${baseUrl}/upsc/history/watch?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-watch-teacher-pack").waitFor({ timeout: 15000 });
  await page.getByTestId("history-watch-media-queue").waitFor({ timeout: 15000 });
  await page.getByTestId("history-watch-media-segments").waitFor({ timeout: 15000 });
  await page.getByTestId("history-watch-asset-slots").waitFor({ timeout: 15000 });
  await page.getByTestId("history-watch-transcript-prompts").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "watch-modern-block-depth", "Modern command focus"));
  findings.push(await expectText(page, "watch-pack-lens", "Modern timeline causation frame"));
  findings.push(await expectText(page, "watch-case-anchor", "1857 centre-leader-cause map"));
  findings.push(await expectText(page, "watch-history-scene", "Source-to-causation chain"));
  findings.push(await expectText(page, "watch-media-title", "Revolt of 1857 Lecture Media Queue"));
  findings.push(await expectText(page, "watch-media-slot", "Lecture video"));
  findings.push(await expectText(page, "watch-media-script", "Open with: Modern timeline causation frame"));
  await page.getByTestId("history-watch-media-transcript").fill("Local transcript seed for Revolt of 1857.");
  const lectureSource = "D:\\UPSC\\History\\D04\\revolt-1857.mp4";
  await page.getByTestId("history-watch-asset-source-lecture-video").fill(lectureSource);
  await page.getByText(`Linked: ${lectureSource}`, { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("history-watch-asset-slots").getByRole("button", { name: /Lecture video/i }).click();
  await page.getByText("1/4 ready", { exact: false }).first().waitFor({ timeout: 15000 });
  findings.push({ label: "watch-media-local-readiness", text: "1/4 ready after marking lecture asset" });
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-watch-media-queue").waitFor({ timeout: 15000 });
  await page.waitForFunction(
    (source) => document.querySelector('[data-testid="history-watch-asset-source-lecture-video"]')?.value === source,
    lectureSource,
    { timeout: 15000 }
  );
  findings.push({ label: "watch-media-source-persisted", text: lectureSource });
  await assertNoOverflow(page, "history-watch-depth", checks);

  await page.goto(`${baseUrl}/upsc/history/talk?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-talk-teacher-pack").waitFor({ timeout: 15000 });
  await page.getByTestId("history-talk-classroom-protocol").waitFor({ timeout: 15000 });
  await page.getByTestId("history-talk-classroom-protocol").getByText("Interactive History classroom protocol", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("history-talk-classroom-protocol").getByText("Source-map proof gate", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Next prompt/i }).click();
  await page.getByRole("heading", { name: "Explain" }).waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "talk-modern-block-depth", "background cause, immediate trigger"));
  findings.push(await expectText(page, "talk-rubric", "History oral rubric"));
  findings.push(
    await expectText(page, "talk-trap", "Reducing Modern History to dates while missing cause, actor, British response, and consequence")
  );
  await page.getByTestId("talk-answer-draft").fill(
    [
      "Revolt of 1857 is a Modern History event that must be placed in chronology with background cause, immediate trigger, actor and consequence.",
      "The background causes include revenue systems, agrarian distress, military grievances and political annexation, while the immediate trigger was the cartridge issue.",
      "The source-map proof should connect Delhi, Kanpur, Lucknow and Jhansi with leaders, centres and the Company response.",
      "The British response converted Company rule to Crown rule and changed the next phase of nationalism.",
      "UPSC can trap by calling it uniform pan-India or by mixing background causes with immediate triggers.",
    ].join(" ")
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("history-talk-score-gate").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-talk-peer-challenge").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Peer challenge pending", { exact: false }).waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "talk-history-peer-gate", "Peer challenge active"));
  await page.getByTestId("subject-talk-challenge-response").fill(
    [
      "The missing proof is the centre-leader-cause map.",
      "Delhi shows symbolic Mughal legitimacy, Kanpur and Lucknow show regional leadership, and Jhansi links leadership, annexation and resistance.",
      "Revenue pressure, military grievance, cartridge trigger, British repression and Crown transfer form the consequence chain.",
      "The UPSC trap is to treat the revolt as fully national and uniform instead of uneven but historically consequential.",
    ].join(" ")
  );
  await page.getByTestId("subject-talk-reassess-challenge").click();
  await page.getByTestId("history-talk-score-gate").getByText("Final verdict saved", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Visual Lab required", { exact: false }).waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "talk-history-final-verdict", "Final verdict saved"));
  await assertNoOverflow(page, "history-talk-depth", checks);

  await page.goto(`${baseUrl}/upsc/history/lab?mode=modern-timeline&day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-lab-evidence-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("history-lab-selected-evidence").waitFor({ timeout: 15000 });
  await page.getByTestId("history-lab-visual-command-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("history-lab-media-studio").waitFor({ timeout: 15000 });
  await page.getByTestId("history-lab-animated-map").waitFor({ timeout: 15000 });
  await page.getByTestId("history-lab-media-timeline").waitFor({ timeout: 15000 });
  await page.getByTestId("history-lab-media-recognition").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "lab-evidence-title", "1857 Cause-Centre-Consequence Grid"));
  findings.push(await expectText(page, "lab-proof-hint", "Write one line that links cause, centre, leader, and consequence"));
  findings.push(await expectText(page, "lab-visual-command-title", "Modern Timeline Command Deck"));
  findings.push(await expectText(page, "lab-visual-rail", "Pre-1857 pressure"));
  findings.push(await expectText(page, "lab-visual-trap", "Uniform pan-India claim"));
  findings.push(await expectText(page, "lab-media-title", "Animated 1857 Centre Map"));
  findings.push(await expectText(page, "lab-media-anchor", "Jhansi"));
  findings.push(await expectText(page, "lab-media-recognition", "Character"));
  await assertNoOverflow(page, "history-lab-depth", checks);

  await page.goto(`${baseUrl}/upsc/history/lab?mode=art-architecture-lab&day=48`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("history-lab-visual-command-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("history-lab-media-studio").waitFor({ timeout: 15000 });
  await page.getByTestId("history-lab-recognition-grid").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "art-lab-visual-command-title", "Art Architecture Recognition Deck"));
  findings.push(await expectText(page, "art-lab-style-recognition", "Nagara Dravida Vesara"));
  findings.push(await expectText(page, "art-lab-trap", "Term-definition swap"));
  findings.push(await expectText(page, "art-lab-media-title", "Monument Recognition Canvas"));
  findings.push(await expectText(page, "art-lab-media-target", "Nagara silhouette cue"));
  findings.push(await expectText(page, "art-lab-media-site", "Thanjavur"));
  await assertNoOverflow(page, "history-art-lab-visual-depth", checks);

  for (const sample of [
    { day: 20, label: "watch-ancient-block-depth", text: "Ancient command focus" },
    { day: 38, label: "watch-medieval-block-depth", text: "Medieval command focus" },
    { day: 48, label: "watch-art-block-depth", text: "Art and culture command focus" },
    { day: 60, label: "watch-integrated-block-depth", text: "Integrated History command focus" },
  ]) {
    await page.goto(`${baseUrl}/upsc/history/watch?day=${sample.day}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.getByTestId("history-watch-teacher-pack").waitFor({ timeout: 15000 });
    findings.push(await expectText(page, sample.label, sample.text));
    await assertNoOverflow(page, sample.label, checks);
  }

  await page.goto(`${baseUrl}/upsc/history/mcq-readiness?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-mcq-shell").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mcq-modern-cause-trigger-depth", "cause-trigger"));
  findings.push(await expectText(page, "mcq-modern-leader-centre-depth", "leader-centre"));
  findings.push(await expectText(page, "mcq-template-source", "FRESH_HISTORY_AUTHORING"));
  findings.push(await expectText(page, "mcq-template-trap", "cause-centre-consequence trap"));
  await assertNoOverflow(page, "history-mcq-depth", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    findings,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
