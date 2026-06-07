const { chromium } = require("playwright");
const profile = {
  level: "advanced",
  studyWindow: "120",
  learningStyle: "mixed",
  weakSignal: "retention",
  studyTime: "morning",
  updatedAt: new Date().toISOString(),
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await page.addInitScript((value) => {
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_local_validator");
    localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(value));
  }, profile);

  const checks = [];

  await page.goto("http://127.0.0.1:3001/upsc/environment/watch?day=1", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-testid="subject-watch-simple-repair"]', { timeout: 20000 });
  let text = await page.locator("body").innerText();
  const startRecallHref = await page.locator('[data-testid="watch-start-recall-first"]').getAttribute("href");
  checks.push({
    route: "environment watch",
    hasRecallGate: text.includes("Start recall first"),
    startRecallHref,
    hidesWatchSurfaceUntilRecall: (await page.locator('[data-testid="subject-watch-visual-surface"]').count()) === 0,
    hidesAdvancedDetailsUntilRecall: !text.includes("Advanced class details, notes, and playlist"),
    oldClassBoardVisible: text.includes("Build the topic before testing"),
  });
  await page.screenshot({
    path: "validation-artifacts/environment-watch-simple.png",
    fullPage: false,
  });

  await page.goto("http://127.0.0.1:3001/upsc/geography/watch?day=1", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-testid="watch-start-recall-first"]', { timeout: 20000 });
  text = await page.locator("body").innerText();
  const geographyRecallHref = await page.locator('[data-testid="watch-start-recall-first"]').getAttribute("href");
  checks.push({
    route: "geography watch",
    hasRecallGate: text.includes("Start recall first"),
    geographyRecallHref,
    hidesWatchButtonUntilRecall: (await page.locator('[data-testid="watch-complete-and-discuss"]').count()) === 0,
    hidesCheckpointsUntilRecall: (await page.locator('[data-testid="watch-scene-1"]').count()) === 0,
    detailsHiddenUntilRecall: !text.includes("Recap, saved recall, and note"),
  });

  await page.evaluate(() => {
    window.localStorage.setItem(
      "sarit-upsc-geography-progress-v1",
      JSON.stringify({
        "1": {
          day: 1,
          reflection: "Earth system recall is saved; class should now repair the exact gap.",
          baselineKnowledge: "I know the basics but need map proof.",
          talkScore: 45,
          talkBand: "Revisit",
          talkUnlockStage: "revisit",
          updatedAt: new Date().toISOString(),
        },
      })
    );
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="watch-complete-and-discuss"]', { timeout: 20000 });
  text = await page.locator("body").innerText();
  checks.push({
    route: "geography watch after recall",
    hasOneStepButton: text.includes("Complete Watch") || text.includes("I watched this"),
    checkpointsFolded: text.includes("Class checkpoints"),
    detailsFolded: text.includes("Recap, saved recall, and note"),
    noteVisibleByDefault: text.includes("One doubt or one map clue"),
  });
  await page.screenshot({
    path: "validation-artifacts/geography-watch-simple.png",
    fullPage: false,
  });

  console.log(
    JSON.stringify(
      {
        checks,
        screenshots: [
          "validation-artifacts/environment-watch-simple.png",
          "validation-artifacts/geography-watch-simple.png",
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
