import { buildPrelims2026ShowcaseEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";

export const prelims2026QuestionLedgerVersion = "upsc-prelims-2026-question-ledger-v1";

export function buildPrelims2026QuestionLedgerPublic() {
  const questions = buildPrelims2026ShowcaseEvidence();
  const statementCoverageRows = questions.reduce((total, question) => total + question.statementCoverage.length, 0);
  const sourceSignalRows = questions.reduce(
    (total, question) =>
      total + question.statementCoverage.filter((coverage) => coverage.coverage === "source-signal").length,
    0
  );
  const conceptSignalRows = questions.reduce(
    (total, question) =>
      total + question.statementCoverage.filter((coverage) => coverage.coverage === "concept-signal").length,
    0
  );
  const manualCheckRows = questions.reduce(
    (total, question) =>
      total + question.statementCoverage.filter((coverage) => coverage.coverage === "manual-check").length,
    0
  );

  const subjectCounts = questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.subject] = (counts[question.subject] ?? 0) + 1;
    return counts;
  }, {});

  return {
    version: prelims2026QuestionLedgerVersion,
    generatedAt: new Date().toISOString(),
    publicRoute: "/upsc-prelims-2026-showcase",
    publicAnchor: "/upsc-prelims-2026-showcase#question-ledger",
    proofPolicy:
      "This endpoint exposes candidate evidence only. Keep question-level claims proof-locked until exact source, page and teacher validation are retained.",
    correctedAudit: {
      direct: 44,
      partial: 30,
      misses: 23,
      dropped: 3,
      scorableQuestions: 97,
      preparedQuestions: 74,
      effectiveCoveragePercent: 76,
    },
    sourceLeadLedger: {
      directTextLeads: questions.filter((question) => question.status === "direct").length,
      conceptualLeads: questions.filter((question) => question.status === "partial").length,
      noIndexedLeads: questions.filter((question) => question.status === "none").length,
      totalQuestions: questions.length,
      interpretation: "Candidate source discovery ledger, not final public accuracy.",
    },
    summary: {
      totalQuestions: questions.length,
      completeQuestionCards: questions.length,
      optionSets: questions.filter((question) => question.options.length > 0).length,
      statementCoverageRows,
      sourceSignalRows,
      conceptSignalRows,
      manualCheckRows,
      multiStatementQuestions: questions.filter((question) => question.statementCount >= 2).length,
      subjects: Object.entries(subjectCounts)
        .map(([subject, count]) => ({ subject, count }))
        .sort((left, right) => right.count - left.count || left.subject.localeCompare(right.subject)),
    },
    questions: questions.map((question) => ({
      number: question.number,
      subject: question.subject,
      difficulty: question.difficulty,
      nature: question.nature,
      answer: question.answer,
      status: question.status,
      statusLabel: question.statusLabel,
      bestScore: question.bestScore,
      sourceLead: question.sourceLead,
      proofLocked: true,
      question: {
        stem: question.stemFull,
        statements: question.statementsFull,
        instruction: question.instruction,
        options: question.options,
      },
      match: {
        coveredSignals: question.coveredSignals,
        formatLabel: question.formatLabel,
        trapStyle: question.trapStyle,
        whyAsked: question.whyAsked,
        depthTest: question.depthTest,
        matchScope: question.matchScope,
        conceptLead: question.conceptLead,
        researchNote: question.researchNote,
        nextAction: question.nextAction,
        statementCoverage: question.statementCoverage,
      },
    })),
    api: {
      reviewCommand: "/api/upsc/prelims-2026/review-command",
      manifest: "/api/upsc/prelims-2026/showcase-manifest",
      matchAccountability: "/api/upsc/prelims-2026/match-accountability",
      questionLedger: "/api/upsc/prelims-2026/question-ledger",
      proofFeed: "/api/upsc/prelims-2026/public-proof-feed",
    },
  };
}
