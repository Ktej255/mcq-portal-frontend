const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "verify-adaptive-teacher-evaluation-evidence.json");

const cases = [
  {
    id: "weak",
    expectedBand: "Revisit",
    scoreRange: [0, 39],
    answer: "Geography is about places. I need to understand the map with one example.",
  },
  {
    id: "developing",
    expectedBand: "Practice",
    scoreRange: [40, 94],
    answer:
      "Geography uses location and map relationships. In India a river connects with a sea and a pass connects with a state. Because the relationship changes the answer, the effect should be explained with one region and one example.",
  },
  {
    id: "command",
    expectedBand: "Command",
    scoreRange: [95, 100],
    answer:
      "Geographic thinking begins with what, where and why. Geography foundation means reading spatial distribution through map relationships instead of memorizing names. Absolute location uses coordinates, while relative location explains nearby rivers, coasts, passes and routes. Site describes what a place is like; situation explains its relationship to other places; scale changes the answer from local to regional or national. India map example: the Nathu La pass is in Sikkim and the Ganga river reaches the Bay of Bengal. Because each pair links location to consequence, it explains why here and not there. UPSC trap: never assume every near-correct pair is identical; a statement may confuse a strait with a canal or reverse a river-to-sea relationship. Finally use one map relationship, one exception and one cause-effect chain.",
  },
];

async function evaluate(testCase) {
  const response = await fetch(`${baseUrl}/api/upsc/teacher/discuss`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer MOCK_TOKEN_teacher_eval_${testCase.id}_${Date.now()}`,
    },
    body: JSON.stringify({
      day: 1,
      learnerLevel: "beginner",
      answer: testCase.answer,
    }),
  });
  const payload = await response.json();
  return {
    id: testCase.id,
    status: response.status,
    cacheControl: response.headers.get("cache-control"),
    expectedBand: testCase.expectedBand,
    scoreRange: testCase.scoreRange,
    mode: payload.mode,
    trace: payload.trace,
    score: payload.assessment?.score,
    band: payload.assessment?.band,
    nextAction: payload.assessment?.nextAction,
    nextPrompt: payload.coach?.nextPrompt,
  };
}

async function run() {
  const results = [];
  for (const testCase of cases) {
    results.push(await evaluate(testCase));
  }

  for (const result of results) {
    const [minimum, maximum] = result.scoreRange;
    if (
      result.status !== 200 ||
      result.cacheControl !== "no-store" ||
      result.band !== result.expectedBand ||
      typeof result.score !== "number" ||
      result.score < minimum ||
      result.score > maximum ||
      result.trace?.promptVersion !== "upsc-teacher-2026-06-03.2" ||
      result.trace?.rubricVersion !== "upsc-recall-rubric-2026-06-03.1" ||
      result.trace?.recallTarget !== 95
    ) {
      throw new Error(`Adaptive teacher evaluation mismatch: ${JSON.stringify(result, null, 2)}`);
    }
  }

  const evidence = {
    baseUrl,
    cases: results,
    passed: true,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
