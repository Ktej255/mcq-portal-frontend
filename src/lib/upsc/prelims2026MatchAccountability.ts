import { buildPrelims2026ShowcaseEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";

export const prelims2026MatchAccountabilityVersion = "upsc-prelims-2026-match-accountability-v1";

export function buildPrelims2026MatchAccountability() {
  const questions = buildPrelims2026ShowcaseEvidence();
  const portionRows = questions.flatMap((question) =>
    question.statementCoverage.map((portion) => ({
      ...portion,
      questionNumber: question.number,
      subject: question.subject,
    }))
  );
  const sourceSignalRows = portionRows.filter((portion) => portion.coverage === "source-signal");
  const conceptSignalRows = portionRows.filter((portion) => portion.coverage === "concept-signal");
  const manualCheckRows = portionRows.filter((portion) => portion.coverage === "manual-check");
  const matchedRows = portionRows.filter((portion) => portion.coverage !== "manual-check");
  const fullyMatchedQuestions = questions.filter((question) =>
    question.statementCoverage.every((portion) => portion.coverage !== "manual-check")
  );
  const partialMatchQuestions = questions.filter((question) => {
    const matched = question.statementCoverage.some((portion) => portion.coverage !== "manual-check");
    const manual = question.statementCoverage.some((portion) => portion.coverage === "manual-check");
    return matched && manual;
  });
  const manualOnlyQuestions = questions.filter((question) =>
    question.statementCoverage.every((portion) => portion.coverage === "manual-check")
  );
  const highlightedQuestions = questions.filter((question) =>
    question.statementCoverage.some((portion) => portion.matchedSignals.length > 0)
  );

  return {
    version: prelims2026MatchAccountabilityVersion,
    generatedAt: new Date().toISOString(),
    publicRoute: "/upsc-prelims-2026-showcase",
    publicAnchor: "/upsc-prelims-2026-showcase#match-accountability",
    strategyRoute: "/upsc/prelims-2027-strategy",
    strategyAnchor: "/upsc/prelims-2027-strategy#prelims-2026-match-accountability-api-readiness",
    proofPolicy:
      "This endpoint explains which MCQ portions carry candidate matched signals. It is not final proof until retained source page evidence and teacher validation unlock a public claim.",
    summary: {
      totalQuestions: questions.length,
      completeQuestionCards: questions.length,
      optionSets: questions.filter((question) => question.options.length > 0).length,
      portionRows: portionRows.length,
      matchedPortionRows: matchedRows.length,
      sourceSignalRows: sourceSignalRows.length,
      conceptSignalRows: conceptSignalRows.length,
      manualCheckRows: manualCheckRows.length,
      fullyMatchedQuestions: fullyMatchedQuestions.length,
      partialMatchQuestions: partialMatchQuestions.length,
      manualOnlyQuestions: manualOnlyQuestions.length,
      highlightedQuestions: highlightedQuestions.length,
      proofLockedQuestions: questions.length,
      directTextLeads: questions.filter((question) => question.status === "direct").length,
      conceptualLeads: questions.filter((question) => question.status === "partial").length,
      noIndexedLeads: questions.filter((question) => question.status === "none").length,
    },
    questions: questions.map((question) => {
      const matchedPortions = question.statementCoverage.filter((portion) => portion.coverage !== "manual-check");
      const manualPortions = question.statementCoverage.filter((portion) => portion.coverage === "manual-check");
      const highestMatchedPortion = matchedPortions[matchedPortions.length - 1]?.label ?? "No matched portion";
      const coverageScorePercent = Math.round((matchedPortions.length / Math.max(question.statementCoverage.length, 1)) * 100);

      return {
        number: question.number,
        subject: question.subject,
        difficulty: question.difficulty,
        nature: question.nature,
        status: question.status,
        statusLabel: question.statusLabel,
        answer: question.answer,
        proofLocked: true,
        question: {
          stem: question.stemFull,
          statements: question.statementsFull,
          instruction: question.instruction,
          options: question.options,
        },
        match: {
          sourceLead: question.sourceLead,
          formatLabel: question.formatLabel,
          trapStyle: question.trapStyle,
          matchScope: question.matchScope,
          highestMatchedPortion,
          matchedPortionLabels: matchedPortions.map((portion) => portion.label),
          manualCheckPortionLabels: manualPortions.map((portion) => portion.label),
          coverageScorePercent,
          coveredSignals: question.coveredSignals,
          nextProofAction: question.nextAction,
          researchNote: question.researchNote,
          portionCoverage: question.statementCoverage.map((portion) => ({
            label: portion.label,
            text: portion.text,
            coverage: portion.coverage,
            coverageLabel: portion.coverageLabel,
            matchedSignals: portion.matchedSignals,
          })),
        },
      };
    }),
    api: {
      releaseDecision: "/api/upsc/prelims-2026/release-decision",
      reviewCommand: "/api/upsc/prelims-2026/review-command",
      matchAccountability: "/api/upsc/prelims-2026/match-accountability",
      questionLedger: "/api/upsc/prelims-2026/question-ledger",
      proofFeed: "/api/upsc/prelims-2026/public-proof-feed",
      manifest: "/api/upsc/prelims-2026/showcase-manifest",
    },
  };
}
