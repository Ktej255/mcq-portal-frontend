const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-talk-voice-fallback-e2e-evidence.json");

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("AUTH | Firebase auth is not initialized")) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    class MockSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = "en-IN";
        this.onstart = null;
        this.onresult = null;
        this.onend = null;
        this.onerror = null;
      }

      start() {
        this.onstart?.();
        window.setTimeout(() => {
          this.onerror?.({ error: "network", message: "Simulated speech service outage" });
        }, 20);
      }

      stop() {
        this.onend?.();
      }
    }

    class MockMediaRecorder {
      constructor(stream) {
        this.stream = stream;
        this.state = "inactive";
        this.mimeType = "audio/webm";
        this.ondataavailable = null;
        this.onstop = null;
        this.onerror = null;
      }

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        window.setTimeout(() => {
          this.ondataavailable?.({ data: new Blob(["voice-note"], { type: "audio/webm" }) });
          this.onstop?.();
        }, 20);
      }
    }

    Object.defineProperty(window, "SpeechRecognition", { value: MockSpeechRecognition, configurable: true });
    Object.defineProperty(window, "webkitSpeechRecognition", { value: MockSpeechRecognition, configurable: true });
    Object.defineProperty(window, "MediaRecorder", { value: MockMediaRecorder, configurable: true });
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop() {} }],
        }),
      },
      configurable: true,
    });
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey }) => {
      const token = "MOCK_TOKEN_geography_voice_fallback";
      window.MOCK_TOKEN = token;
      window.localStorage.setItem("MOCK_TOKEN", token);
      window.localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
          studyWindow: "60",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "no-attempt",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        geographyProgressKey,
        JSON.stringify({
          1: {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-map", "1-trap", "1-recap"],
            watchHandoffReady: true,
            watchHandoffSummary: "Day 1 watch complete.",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey }
  );

  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-speak-answer").click();
  await page.getByText("Browser speech recognition could not reach its speech service.", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Recording audio note now.", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-speak-answer").getByText("Stop recording", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "voice-fallback-recording-mobile", checks);

  await page.getByTestId("talk-speak-answer").click();
  await page.getByText("Voice note recorded.", { exact: false }).waitFor({ timeout: 15000 });
  const audioCount = await page.locator("audio[aria-label='Recorded answer voice note']").count();
  const buttonLabel = await page.getByTestId("talk-speak-answer").innerText();
  await assertNoOverflow(page, "voice-fallback-audio-note-mobile", checks);
  checks.push({ label: "voice-fallback-audio-note", audioCount, buttonLabel });

  if (audioCount !== 1 || !buttonLabel.includes("Speak answer")) {
    throw new Error(`Voice fallback did not return to reusable state: ${JSON.stringify({ audioCount, buttonLabel })}`);
  }

  await browser.close();
  const evidence = {
    baseUrl,
    checks,
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));

  if (!evidence.passed) {
    process.exit(1);
  }
}

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
