const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const feedbackKey = "sarit-upsc-geography-pilot-feedback-v1";
const releaseKey = "sarit-upsc-geography-pilot-release-v1";
const founderReviewKey = "sarit-upsc-geography-founder-review-v1";
const checkInKey = "sarit-upsc-geography-pilot-check-in-v1";
const rosterKey = "sarit-upsc-geography-pilot-roster-v1";
const inviteCode = "GEO-01-ZERO";
const evidencePath = path.join(__dirname, "geography-pilot-zero-start-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-pilot-zero-start-final.png");
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
    throw new Error(`${label} still contains old protected branding.`);
  }
}

async function seedApprovedZeroProgress(page) {
  await page.evaluate(
    ({ localProgressKey, localFeedbackKey, localReleaseKey, localFounderReviewKey, localCheckInKey, localRosterKey, localInviteCode }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_zero_start");
      window.localStorage.removeItem(localProgressKey);
      window.localStorage.removeItem(localFeedbackKey);
      window.localStorage.removeItem(localCheckInKey);
      window.localStorage.setItem(
        localRosterKey,
        JSON.stringify([
          {
            id: "zero-start-roster",
            name: "Zero Start Tester",
            contact: "Local Batch A",
            inviteCode: localInviteCode,
            status: "planned",
            note: "Zero-progress pilot proof tester.",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      );
      window.localStorage.setItem(
        localReleaseKey,
        JSON.stringify({
          status: "approved",
          reviewerName: "Founder QA",
          note: "Approved for zero-progress pilot route proof.",
          maxTesters: 3,
          testWindow: "25-35 minutes",
          updatedAt: new Date().toISOString(),
        }),
      );
      window.localStorage.setItem(
        localFounderReviewKey,
        JSON.stringify({
          checkedIds: [
            "geography-home",
            "watch-room",
            "talk-room",
            "visual-lab",
            "mcq-intake",
            "track-revisit",
            "mobile-fit",
          ],
          reviewerName: "Founder QA",
          updatedAt: new Date().toISOString(),
        }),
      );
    },
    {
      localProgressKey: progressKey,
      localFeedbackKey: feedbackKey,
      localReleaseKey: releaseKey,
      localFounderReviewKey: founderReviewKey,
      localCheckInKey: checkInKey,
      localRosterKey: rosterKey,
      localInviteCode: inviteCode,
    },
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await seedApprovedZeroProgress(page);

  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-room").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-release-state").getByText("Ready for controlled testing", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Check in before starting", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Save your name and contact", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-session-guide").getByText("25-35 minutes", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-session-guide").getByText("Return here", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-session-guide").getByText("Save feedback", { exact: false }).waitFor({ timeout: 15000 });
  const startLinksBeforeCheckIn = await page.getByTestId("geography-student-pilot-start").count();
  if (startLinksBeforeCheckIn !== 0) {
    throw new Error("Student pilot exposed the Start Watch link before check-in.");
  }
  await page.getByTestId("geography-student-pilot-check-in").getByText("Name pending", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByLabel("Pilot check-in name").fill("Zero Start Tester");
  await page.getByLabel("Pilot check-in contact").fill("Local Batch A");
  await page.getByLabel("Pilot invite code").fill(inviteCode);
  await page.getByTestId("geography-student-check-in-save").click();
  await page.getByTestId("geography-student-pilot-check-in").getByText("Checked in: Zero Start Tester", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Start Watch room", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Complete all Day 1 scenes", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByLabel("Pilot student name").inputValue().then((value) => {
    if (value !== "Zero Start Tester") throw new Error(`Check-in did not sync the feedback name: ${value}`);
  });
  const checkInState = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "null"), checkInKey);
  if (checkInState?.testerName !== "Zero Start Tester" || checkInState?.contact !== "Local Batch A" || checkInState?.inviteCode !== inviteCode) {
    throw new Error(`Unexpected pilot check-in state: ${JSON.stringify(checkInState)}`);
  }
  const rosterAfterCheckIn = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), rosterKey);
  if (rosterAfterCheckIn[0]?.status !== "invited") {
    throw new Error(`Check-in did not mark the roster entry invited: ${JSON.stringify(rosterAfterCheckIn)}`);
  }
  await page.getByTestId("geography-student-pilot-script").getByText("Room 1: Watch", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-script-step-1").getByText("Test", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-gates").getByText("Step 1: Watch", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByRole("link", { name: /Step 1: Watch/i }).getByText("Open", { exact: true }).waitFor({ timeout: 15000 });

  const zeroProgress = await page.evaluate((key) => window.localStorage.getItem(key), progressKey);
  if (zeroProgress !== null) {
    throw new Error(`Zero-progress test unexpectedly found existing Geography progress: ${zeroProgress}`);
  }

  const bodyText = await page.locator("body").innerText();
  if (/Admin view|Open Testing Cockpit|Operator sign-off required/i.test(bodyText)) {
    throw new Error("Zero-progress student pilot leaked operator/admin language.");
  }
  await assertNoOverflow(page, "zero-progress-pilot-desktop", checks);

  await page.getByTestId("geography-student-pilot-start").click();
  await page.waitForURL("**/upsc/geography/watch?day=1", { timeout: 15000 });
  await page.getByTestId("watch-demo-player").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-watch").getByText("You are in Watch", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-handoff-next-watch").getByText("Talk with AI teacher", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-handoff-ready-state").getByText("Draft empty", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "zero-progress-watch-desktop", checks);

  const progressAfterOpen = await page.evaluate((key) => window.localStorage.getItem(key), progressKey);
  if (progressAfterOpen !== null) {
    throw new Error(`Opening Watch should not auto-complete progress: ${progressAfterOpen}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Start Watch room", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "zero-progress-pilot-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify([
        {
          id: "zero-progress-open-blocker",
          createdAt: new Date().toISOString(),
          testerName: "Blocker Tester",
          stage: "Access",
          severity: "Blocker",
          day: 1,
          note: "The student cannot continue from the pilot page.",
          currentRoute: "/upsc/geography/pilot",
          status: "open",
        },
      ]),
    );
  }, feedbackKey);
  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-release-state").getByText("Paused after blocker feedback", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-blocker-alert").getByText("Pilot paused until 1 blocker feedback item is reviewed.", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Pilot paused for review", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-start-locked").getByText("Pilot paused after blocker feedback", { exact: false }).waitFor({ timeout: 15000 });
  const startLinksWhileBlocked = await page.getByTestId("geography-student-pilot-start").count();
  if (startLinksWhileBlocked !== 0) {
    throw new Error("Student pilot still exposed a start link while open Blocker feedback exists.");
  }
  await page.getByTestId("geography-student-pilot-gate-paused-1").getByText("Step 1: Watch", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-gate-paused-1").getByText("Paused", { exact: true }).waitFor({ timeout: 15000 });
  const blockedGateLinks = await page.getByRole("link", { name: /Step 1: Watch/i }).count();
  if (blockedGateLinks !== 0) {
    throw new Error("Student pilot still exposed clickable Day 1 path cards while open Blocker feedback exists.");
  }
  await assertNoOverflow(page, "zero-progress-pilot-blocker-paused", checks);

  await page.evaluate((key) => {
    const entries = JSON.parse(window.localStorage.getItem(key) || "[]");
    window.localStorage.setItem(key, JSON.stringify(entries.map((entry) => ({ ...entry, status: "reviewed" }))));
  }, feedbackKey);
  await page.goto(`${baseUrl}/upsc/geography/pilot`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("geography-student-pilot-release-state").getByText("Ready for controlled testing", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Start Watch room", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByLabel("Pilot student name").fill("Self Blocker Tester");
  await page.getByRole("button", { name: "Access" }).click();
  await page.getByRole("button", { name: "Blocker" }).click();
  await page
    .getByPlaceholder("Example: I completed Watch and Talk")
    .fill("I cannot continue from the pilot page and need admin review before another student uses this link.");
  await page.getByTestId("geography-student-feedback-save").click();
  await page.getByText("Blocker saved. Pilot paused until admin review.", { exact: true }).waitFor({ timeout: 15000 });
  const rosterAfterBlocker = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "[]"), rosterKey);
  if (rosterAfterBlocker[0]?.status !== "blocked") {
    throw new Error(`Blocker feedback did not mark the tester roster entry blocked: ${JSON.stringify(rosterAfterBlocker, null, 2)}`);
  }
  await page.getByTestId("geography-student-pilot-release-state").getByText("Paused after blocker feedback", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-blocker-alert").getByText("Pilot paused until 1 blocker feedback item is reviewed.", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Pilot paused for review", { exact: false }).waitFor({ timeout: 15000 });
  const startLinksAfterSelfBlocker = await page.getByTestId("geography-student-pilot-start").count();
  if (startLinksAfterSelfBlocker !== 0) {
    throw new Error("Student pilot still exposed a start link immediately after self-reporting a Blocker.");
  }
  await page.getByTestId("geography-student-pilot-gate-paused-1").getByText("Paused", { exact: true }).waitFor({ timeout: 15000 });
  await page.evaluate((key) => {
    const entries = JSON.parse(window.localStorage.getItem(key) || "[]");
    window.localStorage.setItem(key, JSON.stringify(entries.map((entry) => ({ ...entry, status: "reviewed" }))));
    window.dispatchEvent(new CustomEvent("geography-pilot-feedback-updated"));
  }, feedbackKey);
  await page.getByTestId("geography-student-pilot-release-state").getByText("Ready for controlled testing", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-student-pilot-current-action").getByText("Start Watch room", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByRole("link", { name: /Step 1: Watch/i }).getByText("Open", { exact: true }).waitFor({ timeout: 15000 });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    rosterAfterCheckIn,
    rosterAfterBlocker,
    finalUrl: page.url(),
    progressAfterOpen,
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
