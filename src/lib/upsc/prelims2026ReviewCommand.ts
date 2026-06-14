import { buildPrelims2026ArchiveProofReadiness } from "@/lib/upsc/prelims2026ArchiveProofReadiness";
import { buildPrelims2026BuildReadiness } from "@/lib/upsc/prelims2026BuildReadiness";
import { buildPrelims2026QuestionLedgerPublic } from "@/lib/upsc/prelims2026QuestionLedgerPublic";
import { buildPrelims2026ShowcaseManifest } from "@/lib/upsc/prelims2026ShowcaseManifest";
import { buildPrelims2027CourseActionPublic } from "@/lib/upsc/prelims2027CourseActionPublic";
import { defaultUpscSourceArchiveRoot, type SourceArchiveIntakeResponse } from "@/lib/upsc/sourceArchiveIntake";
import { scanSourceArchive } from "@/lib/upsc/sourceArchiveScanner";

export const prelims2026ReviewCommandVersion = "upsc-prelims-2026-review-command-v1";
export const prelims2026ReviewCommandApiRoute = "/api/upsc/prelims-2026/review-command";
export const prelims2026ReviewCommandRoute = "/upsc/prelims-review-command";

export async function buildPrelims2026ReviewCommand(
  rootPath = defaultUpscSourceArchiveRoot,
  archiveScan?: SourceArchiveIntakeResponse
) {
  const manifest = buildPrelims2026ShowcaseManifest();
  const readiness = buildPrelims2026BuildReadiness();
  const questionLedger = buildPrelims2026QuestionLedgerPublic();
  const courseAction = buildPrelims2027CourseActionPublic();
  const sourceArchiveScan = archiveScan ?? (await scanSourceArchive(rootPath));
  const sourceReadiness = buildPrelims2026ArchiveProofReadiness(sourceArchiveScan);
  const corrected = manifest.audit.corrected;
  const buildFromScratchCount = courseAction.reallocationPlan.filter(
    (decision) => decision.decision === "Build from scratch"
  ).length;

  const quickLinks = [
    {
      id: "public-showcase",
      label: "Open public showcase",
      href: manifest.publicRoute,
      role: "Public review",
    },
    {
      id: "strategy-command",
      label: "Open strategy command",
      href: manifest.strategyRoute,
      role: "Detailed execution",
    },
    {
      id: "question-proof-queue",
      label: "Open question proof queue",
      href: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
      role: "Proof packet work",
    },
  ];

  const actionLanes = [
    {
      id: "website-release",
      title: "Website Release",
      status: "Public safe",
      metric: `${corrected.effectiveCoveragePercent}%`,
      detail: "Corrected audit, trend story, source summary and software path can be connected to the main site.",
      ownerRoute: `${manifest.publicRoute}#main-website-manifest-contract`,
    },
    {
      id: "mcq-proof-lock",
      title: "MCQ Proof Lock",
      status: "Needs packet approval",
      metric: `${questionLedger.summary.completeQuestionCards}/${questionLedger.summary.totalQuestions}`,
      detail: "Every question has complete stem, options, answer, match scope and highlighted candidate portions.",
      ownerRoute: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
    },
    {
      id: "source-archive-triage",
      title: "Source Archive Triage",
      status: sourceReadiness.sourceConnected ? "Archive connected" : "Archive unavailable",
      metric: `${sourceReadiness.candidateQuestions}/${sourceReadiness.totalQuestions}`,
      detail: "Archive candidates are internal signals until source, page and teacher validation are retained.",
      ownerRoute: "/upsc/prelims-2027-strategy#prelims-2026-source-gap-work-orders",
    },
    {
      id: "reallocation",
      title: "2027 Reallocation",
      status: "Action mapped",
      metric: `${courseAction.summary.priorityCount} lanes`,
      detail: "Critical gaps become build-from-scratch or depth-upgrade tracks with owner surfaces.",
      ownerRoute: "/upsc/prelims-2027-strategy#prelims-2027-reallocation-board",
    },
    {
      id: "practice-build",
      title: "Practice Build",
      status: "Blueprint ready",
      metric: `${courseAction.summary.practiceBlueprintCount} sets`,
      detail: "New practice banks move toward multi-statement, pair-list, caselet and how-many-correct formats.",
      ownerRoute: "/upsc/prelims-2027-strategy#prelims-2027-practice-blueprints",
    },
    {
      id: "delivery-tracking",
      title: "Delivery Tracking",
      status: "Portal owned",
      metric: `${courseAction.summary.taskCount} tasks`,
      detail: "Source, capsule, MCQ, proof, release and planner work can be tracked from the strategy board.",
      ownerRoute: "/upsc/prelims-2027-strategy#prelims-2027-delivery-dashboard",
    },
  ];

  return {
    version: prelims2026ReviewCommandVersion,
    generatedAt: new Date().toISOString(),
    status: sourceReadiness.sourceConnected ? "ready-with-live-archive" : "ready-with-source-warning",
    publicRoute: manifest.publicRoute,
    dashboardRoute: manifest.dashboardRoute,
    reviewCommandRoute: manifest.reviewCommandRoute,
    strategyRoute: manifest.strategyRoute,
    proofPolicy:
      "The Review Command is the operator start point. Public claims remain proof-locked until exact source, page/location and teacher validation are approved.",
    summary: {
      effectiveCoveragePercent: corrected.effectiveCoveragePercent,
      preparedQuestions: corrected.preparedQuestions,
      scorableQuestions: corrected.scorableQuestions,
      direct: corrected.direct,
      partial: corrected.partial,
      misses: corrected.misses,
      dropped: corrected.dropped,
      totalQuestions: questionLedger.summary.totalQuestions,
      completeQuestionCards: questionLedger.summary.completeQuestionCards,
      optionSets: questionLedger.summary.optionSets,
      statementCoverageRows: questionLedger.summary.statementCoverageRows,
      multiStatementQuestions: questionLedger.summary.multiStatementQuestions,
      sourceCandidateQuestions: sourceReadiness.candidateQuestions,
      sourceBlindSpotQuestions: sourceReadiness.blindSpotQuestions,
      sourceGapWorkOrdersRequired: sourceReadiness.sourceGapWorkOrdersRequired,
      priorityCount: courseAction.summary.priorityCount,
      criticalPriorityCount: courseAction.summary.criticalPriorityCount,
      taskCount: courseAction.summary.taskCount,
      practiceBlueprintCount: courseAction.summary.practiceBlueprintCount,
      formatRuleCount: courseAction.summary.formatRuleCount,
      buildFromScratchCount,
      readinessRequirementCount: readiness.summary.requirementCount,
      readinessCompleteCount: readiness.summary.completeCount,
      readinessProofLockedCount: readiness.summary.proofLockedCount,
      apiEndpointCount: readiness.summary.apiEndpointCount,
    },
    quickLinks,
    actionLanes,
    sourceReadiness: {
      sourceStatus: sourceReadiness.sourceStatus,
      sourceConnected: sourceReadiness.sourceConnected,
      totalQuestions: sourceReadiness.totalQuestions,
      candidateQuestions: sourceReadiness.candidateQuestions,
      needsProofWithCandidates: sourceReadiness.needsProofWithCandidates,
      blindSpotQuestions: sourceReadiness.blindSpotQuestions,
      blindSpotQuestionNumbers: sourceReadiness.blindSpotQuestionNumbers,
      sourceGapWorkOrdersRequired: sourceReadiness.sourceGapWorkOrdersRequired,
      strongestCandidateTrackId: sourceReadiness.strongestCandidateTrackId,
      strongestCandidateTrackLabel: sourceReadiness.strongestCandidateTrackLabel,
      proofPolicy: sourceReadiness.proofPolicy,
    },
    priorities: courseAction.priorities.map((priority) => ({
      id: priority.id,
      subject: priority.subject,
      priority: priority.priority,
      window: priority.window,
      action: priority.action,
      targetRoute: priority.targetRoute,
      taskCount: priority.taskCount,
      blueprintCount: priority.blueprintCount,
      proofStatus: priority.proofStatus,
      releaseGate: priority.releaseGate,
      nextProofAction: priority.nextProofAction,
    })),
    phaseCounts: courseAction.summary.phaseCounts,
    api: {
      reviewCommand: prelims2026ReviewCommandApiRoute,
      releaseDecision: "/api/upsc/prelims-2026/release-decision",
      mainSiteHandoff: "/api/upsc/prelims-2026/main-site-handoff",
      manifest: manifest.api.manifest,
      matchAccountability: manifest.api.matchAccountability,
      questionLedger: manifest.api.questionLedger,
      proofFeed: manifest.api.proofFeed,
      courseAction: manifest.api.courseAction,
      sourceArchiveSummary: manifest.api.sourceArchiveSummary,
      buildReadiness: manifest.api.buildReadiness,
    },
  };
}
