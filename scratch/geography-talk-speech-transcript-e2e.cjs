const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-talk-speech-transcript-e2e-evidence.json");

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

function countNeedle(value, needle) {
  return value.split(needle).length - 1;
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
    const makeResult = (transcript, isFinal) => Object.assign([{ transcript }], { isFinal });

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
          this.onresult?.({
            resultIndex: 0,
            results: [makeResult("Geographic thinking", false)],
          });
        }, 20);
        window.setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [makeResult("Geographic thinking connects location and scale.", true)],
          });
        }, 60);
        window.setTimeout(() => {
          this.onresult?.({
            resultIndex: 1,
            results: [
              makeResult("Geographic thinking connects location and scale.", true),
              makeResult("It avoids isolated map facts.", true),
            ],
          });
        }, 100);
      }

      stop() {
        this.onend?.();
      }
    }

    Object.defineProperty(window, "SpeechRecognition", { value: MockSpeechRecognition, configurable: true });
    Object.defineProperty(window, "webkitSpeechRecognition", { value: MockSpeechRecognition, configurable: true });
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
      const token = "MOCK_TOKEN_geography_speech_transcript";
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
  await page.getByTestId("talk-speech-interim").getByText("Geographic thinking", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Speech captured as text.", { exact: false }).waitFor({ timeout: 15000 });

  await page.waitForFunction(() => {
    const textarea = document.querySelector("[data-testid='talk-answer-draft']");
    return textarea?.value?.includes("It avoids isolated map facts.");
  });

  await page.getByTestId("talk-speak-answer").click();
  await page.getByText("Recording stopped.", { exact: false }).waitFor({ timeout: 15000 });

  const answerDraft = await page.getByTestId("talk-answer-draft").inputValue();
  const audioCount = await page.locator("audio[aria-label='Recorded answer voice note']").count();
  const interimCount = await page.locator("[data-testid='talk-speech-interim']").count();
  const buttonLabel = await page.getByTestId("talk-speak-answer").innerText();

  checks.push({
    label: "speech-transcript-clean-final-text",
    answerDraft,
    geographicSentenceCount: countNeedle(answerDraft, "Geographic thinking connects location and scale."),
    secondSentenceCount: countNeedle(answerDraft, "It avoids isolated map facts."),
    audioCount,
    interimCount,
    buttonLabel,
  });
  await assertNoOverflow(page, "speech-transcript-mobile", checks);

  const transcriptClean =
    countNeedle(answerDraft, "Geographic thinking connects location and scale.") === 1 &&
    countNeedle(answerDraft, "It avoids isolated map facts.") === 1 &&
    audioCount === 0 &&
    interimCount === 0 &&
    buttonLabel.includes("Speak answer");

  await browser.close();
  const evidence = {
    baseUrl,
    checks,
    consoleErrors,
    pageErrors,
    passed: transcriptClean && consoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));

  if (!evidence.passed) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
