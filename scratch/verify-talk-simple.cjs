const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await page.addInitScript(() => {
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_local_validator");
    localStorage.setItem(
      "sarit-upsc-student-profile-v1",
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
    localStorage.setItem(
      "sarit-upsc-geography-progress-v1",
      JSON.stringify({
        1: {
          day: 1,
          watched: true,
          watchSceneCompletedIds: ["a", "b", "c", "d", "e", "f", "g", "h"],
          watchHandoffSummary:
            "Earth structure, rotation, revolution, heat budget, and UPSC trap around seasons.",
          labCompleted: false,
        },
      })
    );
  });

  const checks = [];

  await page.goto("http://127.0.0.1:3001/upsc/environment/talk?day=1", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-testid="talk-answer-draft"]', { timeout: 20000 });
  let text = await page.locator("body").innerText();
  let normalizedText = text.toLowerCase();
  checks.push({
    route: "environment talk",
    hasTeacherQuestion: normalizedText.includes("ai teacher question"),
    hasAdvancedDetails: text.includes("Advanced details, rubric, and other rooms"),
    hasOldPromptWall: text.includes("Prompt ladder"),
    peerChallengeVisible: await page.locator('[data-testid="subject-talk-peer-challenge"]').isVisible().catch(() => false),
    hasTextarea: await page.locator('[data-testid="talk-answer-draft"]').count(),
  });
  await page.screenshot({
    path: "validation-artifacts/environment-talk-simple.png",
    fullPage: false,
  });

  await page.goto("http://127.0.0.1:3001/upsc/geography/talk?day=1", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-testid="talk-answer-draft"]', { timeout: 20000 });
  text = await page.locator("body").innerText();
  normalizedText = text.toLowerCase();
  checks.push({
    route: "geography talk",
    hasTeacherQuestion: normalizedText.includes("ai teacher question"),
    hasDetails: text.includes("Recap, proof status, and teacher details"),
    isUnlocked: !text.includes("Discussion locked"),
    hasTextarea: await page.locator('[data-testid="talk-answer-draft"]').count(),
  });
  await page.screenshot({
    path: "validation-artifacts/geography-talk-simple.png",
    fullPage: false,
  });

  console.log(
    JSON.stringify(
      {
        checks,
        screenshots: [
          "validation-artifacts/environment-talk-simple.png",
          "validation-artifacts/geography-talk-simple.png",
        ],
      },
      null,
      2
    )
  );

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
