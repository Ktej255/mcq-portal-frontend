import { buildPrelims2026ShowcaseEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";
import {
  buildPrelims2026ShowcasePublicStrategyTracks,
  prelims2026ShowcaseRequirementTracker,
  prelims2026ShowcaseWebsiteCopyBlocks,
  prelims2026ShowcaseWebsiteIntegrationMap,
} from "@/lib/upsc/prelims2026ShowcasePublicContract";
import {
  formatRebuildRules,
  prelims2027Priorities,
  strategyExecutionTasks,
  strategyPracticeBlueprints,
  type StrategyTaskPhase,
} from "@/lib/upsc/prelims2027Strategy";

export const prelims2026ShowcaseManifestVersion = "upsc-prelims-2026-showcase-manifest-v1";

const strategyTaskPhaseOrder: StrategyTaskPhase[] = ["Source", "Capsule", "MCQ", "Proof", "Release", "Planner"];

function countStrategyTaskPhases() {
  return strategyTaskPhaseOrder.reduce<Record<StrategyTaskPhase, number>>(
    (counts, phase) => ({
      ...counts,
      [phase]: strategyExecutionTasks.filter((task) => task.phase === phase).length,
    }),
    {
      Source: 0,
      Capsule: 0,
      MCQ: 0,
      Proof: 0,
      Release: 0,
      Planner: 0,
    }
  );
}

export function buildPrelims2026ShowcaseManifest() {
  const questionEvidence = buildPrelims2026ShowcaseEvidence();
  const statementCoverageRows = questionEvidence.reduce((total, question) => total + question.statementCoverage.length, 0);

  return {
    version: prelims2026ShowcaseManifestVersion,
    generatedAt: new Date().toISOString(),
    publicRoute: "/upsc-prelims-2026-showcase",
    dashboardRoute: "/upsc/prelims-2026-showcase",
    reviewCommandRoute: "/upsc/prelims-review-command",
    strategyRoute: "/upsc/prelims-2027-strategy",
    proofPolicy:
      "Use the corrected final audit for public summary. Keep question-level claims proof-locked until exact source, page and teacher validation are retained.",
    audit: {
      corrected: {
        direct: 44,
        partial: 30,
        misses: 23,
        dropped: 3,
        scorableQuestions: 97,
        preparedQuestions: 74,
        effectiveCoveragePercent: 76,
      },
      sourceLead: {
        directTextLeads: 37,
        conceptualLeads: 63,
        totalQuestions: 100,
        interpretation: "Candidate source discovery ledger, not final public accuracy.",
      },
    },
    questionLedger: {
      totalQuestions: questionEvidence.length,
      completeQuestionCards: questionEvidence.length,
      optionSets: questionEvidence.filter((question) => question.options.length > 0).length,
      statementCoverageRows,
      multiStatementQuestions: questionEvidence.filter((question) => question.statementCount >= 2).length,
      directTextLeadCards: questionEvidence.filter((question) => question.status === "direct").length,
      conceptualLeadCards: questionEvidence.filter((question) => question.status === "partial").length,
      noIndexedLeadCards: questionEvidence.filter((question) => question.status === "none").length,
      proofLocked: true,
      publicAnchor: "/upsc-prelims-2026-showcase#question-ledger",
    },
    website: {
      copyBlocks: prelims2026ShowcaseWebsiteCopyBlocks,
      integrationMap: prelims2026ShowcaseWebsiteIntegrationMap,
      requirements: prelims2026ShowcaseRequirementTracker,
    },
    strategy: {
      priorityCount: prelims2027Priorities.length,
      taskCount: strategyExecutionTasks.length,
      practiceBlueprintCount: strategyPracticeBlueprints.length,
      formatRuleCount: formatRebuildRules.length,
      phaseCounts: countStrategyTaskPhases(),
      tracks: buildPrelims2026ShowcasePublicStrategyTracks(),
    },
    api: {
      releaseDecision: "/api/upsc/prelims-2026/release-decision",
      mainSiteHandoff: "/api/upsc/prelims-2026/main-site-handoff",
      reviewCommand: "/api/upsc/prelims-2026/review-command",
      manifest: "/api/upsc/prelims-2026/showcase-manifest",
      matchAccountability: "/api/upsc/prelims-2026/match-accountability",
      questionLedger: "/api/upsc/prelims-2026/question-ledger",
      proofFeed: "/api/upsc/prelims-2026/public-proof-feed",
      courseAction: "/api/upsc/prelims-2027/course-action",
      sourceArchiveSummary: "/api/upsc/prelims-2026/source-archive-summary",
      buildReadiness: "/api/upsc/prelims-2026/build-readiness",
    },
  };
}
