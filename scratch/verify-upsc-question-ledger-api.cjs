const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const ledgerRoute = `${baseUrl}/api/upsc/prelims-2026/question-ledger`;
const manifestRoute = `${baseUrl}/api/upsc/prelims-2026/showcase-manifest`;

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2000)}` : message);
  }
}

function verifyLedger(payload, headers) {
  const serialized = JSON.stringify(payload);
  const questions = payload.questions || [];
  const first = questions[0];
  const statementCoverageRows = questions.reduce(
    (total, question) => total + (question.match?.statementCoverage?.length || 0),
    0
  );
  const optionSets = questions.filter((question) => question.question?.options?.length > 0).length;
  const direct = questions.filter((question) => question.status === "direct").length;
  const partial = questions.filter((question) => question.status === "partial").length;
  const none = questions.filter((question) => question.status === "none").length;
  const multiStatement = questions.filter((question) => (question.question?.statements?.length || 0) >= 2).length;
  const proofLocked = questions.filter((question) => question.proofLocked === true).length;
  const highlightedQuestions = questions.filter((question) =>
    (question.match?.statementCoverage || []).some((coverage) => (coverage.matchedSignals || []).length > 0)
  ).length;

  assert(headers["cache-control"]?.includes("no-store"), "Question ledger should not be cached", headers);
  assert(payload.version === "upsc-prelims-2026-question-ledger-v1", "Unexpected ledger version", payload.version);
  assert(payload.publicAnchor === "/upsc-prelims-2026-showcase#question-ledger", "Unexpected public anchor", payload);
  assert(payload.api?.manifest === "/api/upsc/prelims-2026/showcase-manifest", "Missing manifest API link", payload.api);
  assert(payload.api?.matchAccountability === "/api/upsc/prelims-2026/match-accountability", "Missing match-accountability API link", payload.api);
  assert(payload.api?.questionLedger === "/api/upsc/prelims-2026/question-ledger", "Missing question ledger API link", payload.api);
  assert(payload.api?.proofFeed === "/api/upsc/prelims-2026/public-proof-feed", "Missing proof feed API link", payload.api);

  assert(payload.correctedAudit?.direct === 44, "Wrong corrected direct count", payload.correctedAudit);
  assert(payload.correctedAudit?.partial === 30, "Wrong corrected partial count", payload.correctedAudit);
  assert(payload.correctedAudit?.misses === 23, "Wrong corrected miss count", payload.correctedAudit);
  assert(payload.correctedAudit?.dropped === 3, "Wrong corrected dropped count", payload.correctedAudit);
  assert(payload.correctedAudit?.scorableQuestions === 97, "Wrong scorable denominator", payload.correctedAudit);
  assert(payload.correctedAudit?.preparedQuestions === 74, "Wrong prepared count", payload.correctedAudit);
  assert(payload.correctedAudit?.effectiveCoveragePercent === 76, "Wrong effective coverage", payload.correctedAudit);

  assert(payload.sourceLeadLedger?.directTextLeads === 37, "Wrong source direct count", payload.sourceLeadLedger);
  assert(payload.sourceLeadLedger?.conceptualLeads === 63, "Wrong source conceptual count", payload.sourceLeadLedger);
  assert(payload.sourceLeadLedger?.noIndexedLeads === 0, "Wrong no-indexed count", payload.sourceLeadLedger);
  assert(payload.sourceLeadLedger?.totalQuestions === 100, "Wrong source total", payload.sourceLeadLedger);

  assert(payload.summary?.totalQuestions === 100, "Wrong question total", payload.summary);
  assert(payload.summary?.completeQuestionCards === 100, "Wrong complete question count", payload.summary);
  assert(payload.summary?.optionSets === 100, "Wrong option set count", payload.summary);
  assert(payload.summary?.statementCoverageRows === 275, "Wrong statement coverage count", payload.summary);
  assert(payload.summary?.multiStatementQuestions === 75, "Wrong multi-statement count", payload.summary);
  assert(Array.isArray(payload.summary?.subjects) && payload.summary.subjects.length >= 8, "Subject summary missing", payload.summary);

  assert(questions.length === 100, "Expected 100 questions", { count: questions.length });
  assert(optionSets === 100, "Every question should have options", { optionSets });
  assert(statementCoverageRows === 275, "Question statement coverage rows drifted", { statementCoverageRows });
  assert(direct === 37 && partial === 63 && none === 0, "Source-ledger question statuses drifted", { direct, partial, none });
  assert(multiStatement === 75, "Multi-statement count drifted", { multiStatement });
  assert(proofLocked === 100, "Every question should be proof locked", { proofLocked });
  assert(highlightedQuestions >= 90, "Expected most questions to include matched signals", { highlightedQuestions });

  assert(first?.number === 1, "First question is missing", first);
  assert(typeof first?.question?.stem === "string" && first.question.stem.length > 20, "First question stem missing", first);
  assert(Array.isArray(first?.question?.options) && first.question.options.length >= 2, "First question options missing", first);
  assert(typeof first?.answer === "string" && first.answer.length > 0, "First question answer missing", first);
  assert(
    Array.isArray(first?.match?.statementCoverage) && first.match.statementCoverage.length > 0,
    "First question statement coverage missing",
    first
  );
  assert(typeof first?.match?.matchScope === "string" && first.match.matchScope.includes("proof"), "First match scope missing proof rule", first);
  assert(/proof-locked/i.test(payload.proofPolicy || ""), "Proof policy should mention proof locking", payload.proofPolicy);
  assert(!/webinar/i.test(serialized), "Ledger contains webinar wording");

  return {
    version: payload.version,
    correctedAudit: payload.correctedAudit,
    sourceLeadLedger: payload.sourceLeadLedger,
    summary: payload.summary,
    derived: {
      questions: questions.length,
      optionSets,
      statementCoverageRows,
      direct,
      partial,
      none,
      multiStatement,
      proofLocked,
      highlightedQuestions,
    },
    firstQuestion: {
      number: first.number,
      subject: first.subject,
      optionCount: first.question.options.length,
      coverageRows: first.match.statementCoverage.length,
    },
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const [ledgerResponse, manifestResponse] = await Promise.all([
      page.request.get(ledgerRoute),
      page.request.get(manifestRoute),
    ]);

    const ledgerPayload = await ledgerResponse.json();
    const manifestPayload = await manifestResponse.json();

    assert(ledgerResponse.status() === 200, `Question ledger returned ${ledgerResponse.status()}`, ledgerPayload);
    assert(manifestResponse.status() === 200, `Manifest returned ${manifestResponse.status()}`, manifestPayload);
    assert(
      manifestPayload.api?.questionLedger === "/api/upsc/prelims-2026/question-ledger",
      "Manifest does not point to question ledger API",
      manifestPayload.api
    );
    assert(
      manifestPayload.api?.matchAccountability === "/api/upsc/prelims-2026/match-accountability",
      "Manifest does not point to match-accountability API",
      manifestPayload.api
    );

    const ledger = verifyLedger(ledgerPayload, ledgerResponse.headers());

    console.log(
      JSON.stringify(
        {
          ok: true,
          ledgerRoute,
          manifestRoute,
          ledger,
          manifestApi: manifestPayload.api,
        },
        null,
        2
      )
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
