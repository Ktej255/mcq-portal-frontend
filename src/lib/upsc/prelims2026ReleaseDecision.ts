import { buildPrelims2026BuildReadiness } from "@/lib/upsc/prelims2026BuildReadiness";
import { buildEmptyPrelims2026PublicProofFeed } from "@/lib/upsc/prelims2026PublicProofFeed";
import { buildPrelims2026QuestionLedgerPublic } from "@/lib/upsc/prelims2026QuestionLedgerPublic";
import {
  buildPrelims2026ArchiveProofReadiness,
  buildPrelims2026QuestionFormatStats,
} from "@/lib/upsc/prelims2026ArchiveProofReadiness";
import { buildPrelims2026ShowcaseManifest } from "@/lib/upsc/prelims2026ShowcaseManifest";
import { buildPrelims2026SourceArchiveSummaryFromScan } from "@/lib/upsc/prelims2026SourceArchiveSummary";
import { buildPrelims2027CourseActionPublic } from "@/lib/upsc/prelims2027CourseActionPublic";
import { defaultUpscSourceArchiveRoot, type SourceArchiveIntakeResponse } from "@/lib/upsc/sourceArchiveIntake";
import { scanSourceArchive } from "@/lib/upsc/sourceArchiveScanner";

export const prelims2026ReleaseDecisionVersion = "upsc-prelims-2026-release-decision-v1";

export async function buildPrelims2026ReleaseDecision(
  rootPath = defaultUpscSourceArchiveRoot,
  archiveScan?: SourceArchiveIntakeResponse
) {
  const manifest = buildPrelims2026ShowcaseManifest();
  const readiness = buildPrelims2026BuildReadiness();
  const questionLedger = buildPrelims2026QuestionLedgerPublic();
  const proofFeed = buildEmptyPrelims2026PublicProofFeed();
  const courseAction = buildPrelims2027CourseActionPublic();
  const questionFormat = buildPrelims2026QuestionFormatStats();
  const sourceArchiveScan = archiveScan ?? (await scanSourceArchive(rootPath));
  const archiveProofReadiness = buildPrelims2026ArchiveProofReadiness(sourceArchiveScan);
  const sourceArchive = buildPrelims2026SourceArchiveSummaryFromScan(sourceArchiveScan);
  const corrected = manifest.audit.corrected;

  const allowedNow = [
    "Corrected headline, coverage line and audit split may be published as the public outcome.",
    "The full 100-question MCQ ledger may be shown as candidate evidence with proof-lock labels.",
    "The source archive may be summarized by counts and rebuild tracks only.",
    "The 2027 course-action priorities may be shown as the software execution path.",
  ];
  const proofLocked = [
    "Question-wise public claims stay locked until source reference, page/location, teacher note and public claim line are complete.",
    "Matched portions can be highlighted as candidate signals, not final proof, until the approval packet is retained.",
    "The public proof feed can stay empty until approved claim cards are published from the Strategy Command.",
  ];
  const internalOnly = [
    "Raw D-drive paths, source filenames and page-level proof remain inside the operator portal.",
    "Source-gap work orders, archive triage and reallocation logic stay internal until converted into public copy.",
    "Student delivery progress is portal evidence; the public page should show the workflow, not private learner state.",
  ];

  const releaseGates = [
    {
      id: "corrected-audit-public-safe",
      title: "Corrected audit summary",
      status: "Public safe",
      metric: `${corrected.effectiveCoveragePercent}%`,
      evidence: `${corrected.preparedQuestions}/${corrected.scorableQuestions} scorable questions show direct or partial preparation advantage.`,
      publicAction: "Use the corrected audit split in the hero, chart labels and public website copy.",
      softwareOwner: "/upsc/prelims-2027-strategy#prelims-2027-publish-gate",
    },
    {
      id: "complete-mcq-proof-lock",
      title: "Complete MCQ evidence",
      status: "Proof locked",
      metric: `${questionLedger.summary.completeQuestionCards}/${questionLedger.summary.totalQuestions}`,
      evidence: `${questionLedger.summary.statementCoverageRows} statement rows and ${questionLedger.summary.optionSets} option sets are available.`,
      publicAction: "Show complete questions, highest matched portions and manual-check portions, but label them as candidate evidence.",
      softwareOwner: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
    },
    {
      id: "public-proof-feed-release",
      title: "Released claim feed",
      status: proofFeed.releasedClaims.length ? "Ready" : "Waiting for approved packets",
      metric: `${proofFeed.releasedClaims.length} released`,
      evidence: proofFeed.proofPolicy,
      publicAction: "Render claim cards only after the Strategy Command publishes approved proof packets.",
      softwareOwner: proofFeed.portalOwner,
    },
    {
      id: "source-archive-boundary",
      title: "Year-long source archive",
      status: "Public summary only",
      metric: `${sourceArchive.scan.totalFiles} files`,
      evidence: `${sourceArchive.scan.pdfCount} PDFs, ${sourceArchive.scan.trackCount} rebuild tracks, ${archiveProofReadiness.candidateQuestions} archive-candidate questions and ${archiveProofReadiness.blindSpotQuestions} source-gap work orders summarized.`,
      publicAction: "Publish archive strength and rebuild-track decisions without raw filenames or folder paths.",
      softwareOwner: sourceArchive.internalIntakeRoute,
    },
    {
      id: "course-action-software-path",
      title: "2027 software path",
      status: "Portal owned",
      metric: `${courseAction.summary.taskCount} tasks`,
      evidence: `${courseAction.summary.priorityCount} priorities, ${courseAction.summary.practiceBlueprintCount} practice blueprints and ${courseAction.summary.formatRuleCount} format rules are available.`,
      publicAction: "Show the course correction as a software execution path, not as final question-wise proof.",
      softwareOwner: manifest.reviewCommandRoute,
    },
    {
      id: "main-site-api-contract",
      title: "Main website API contract",
      status: "Ready with locks",
      metric: `${readiness.summary.apiEndpointCount} endpoints`,
      evidence: `${readiness.summary.requirementCount} requirements, ${readiness.gates.length} gates and ${readiness.summary.verifierCount} verifier scripts protect the handoff.`,
      publicAction: "Connect the main website to the handoff, release-decision, manifest, match-accountability, proof-feed and course-action endpoints.",
      softwareOwner: manifest.reviewCommandRoute,
    },
  ];

  return {
    version: prelims2026ReleaseDecisionVersion,
    generatedAt: new Date().toISOString(),
    status: "publish-safe-with-proof-locks",
    publicRoute: manifest.publicRoute,
    publicAnchor: "/upsc-prelims-2026-showcase#release-decision",
    reviewCommandRoute: manifest.reviewCommandRoute,
    strategyRoute: manifest.strategyRoute,
    strategyAnchor: "/upsc/prelims-2027-strategy#prelims-2027-publish-gate",
    proofPolicy:
      "Publish the corrected audit, source summary, software path and complete MCQ evidence with proof-lock labels. Do not publish question-wise hit claims until approved proof packets are released through the proof feed.",
    decision: {
      headline: "Ready for main-site integration with proof locks.",
      publicStatus: "Safe with lock",
      allowedNow,
      proofLocked,
      internalOnly,
    },
    summary: {
      effectiveCoveragePercent: corrected.effectiveCoveragePercent,
      preparedQuestions: corrected.preparedQuestions,
      scorableQuestions: corrected.scorableQuestions,
      correctedDirect: corrected.direct,
      correctedPartial: corrected.partial,
      correctedMisses: corrected.misses,
      correctedDropped: corrected.dropped,
      completeQuestionCards: questionLedger.summary.completeQuestionCards,
      multiStatementQuestionCount: questionFormat.multiStatementQuestions,
      threePlusStatementCount: questionFormat.threePlusStatements,
      twoStatementCount: questionFormat.twoStatements,
      noExplicitListQuestionCount: questionFormat.noExplicitList,
      proofLockedQuestionCount: questionLedger.summary.totalQuestions,
      releasedClaimCount: proofFeed.releasedClaims.length,
      sourceArchiveFileCount: sourceArchive.scan.totalFiles,
      sourceArchivePdfCount: sourceArchive.scan.pdfCount,
      sourceArchiveTrackCount: sourceArchive.scan.trackCount,
      sourceCandidateQuestionCount: archiveProofReadiness.candidateQuestions,
      sourceGapBlindSpotCount: archiveProofReadiness.blindSpotQuestions,
      sourceGapWorkOrdersRequired: archiveProofReadiness.sourceGapWorkOrdersRequired,
      strategyPriorityCount: courseAction.summary.priorityCount,
      strategyTaskCount: courseAction.summary.taskCount,
      practiceBlueprintCount: courseAction.summary.practiceBlueprintCount,
      apiEndpointCount: readiness.summary.apiEndpointCount,
    },
    visualStory: {
      publicAnchor: "/upsc-prelims-2026-showcase#question-logic",
      questionFormat,
      statementDominanceLine: `${questionFormat.multiStatementQuestions}/${questionFormat.totalQuestions} questions used multi-statement or pair-list logic.`,
      chartPolicy: questionFormat.chartPolicy,
    },
    sourceGapReadiness: {
      endpoint: "/api/upsc/source-archive",
      strategyAnchor: "/upsc/prelims-2027-strategy#prelims-2026-source-gap-work-orders",
      archiveProofAnchor: "/upsc/prelims-2027-strategy#prelims-2026-archive-proof-triage",
      sourceStatus: archiveProofReadiness.sourceStatus,
      sourceConnected: archiveProofReadiness.sourceConnected,
      totalQuestions: archiveProofReadiness.totalQuestions,
      candidateQuestions: archiveProofReadiness.candidateQuestions,
      needsProofWithCandidates: archiveProofReadiness.needsProofWithCandidates,
      blindSpotQuestions: archiveProofReadiness.blindSpotQuestions,
      needsProofBlindSpots: archiveProofReadiness.needsProofBlindSpots,
      buildGapBlindSpots: archiveProofReadiness.buildGapBlindSpots,
      blindSpotQuestionNumbers: archiveProofReadiness.blindSpotQuestionNumbers,
      sourceGapWorkOrdersRequired: archiveProofReadiness.sourceGapWorkOrdersRequired,
      strongestCandidateTrackId: archiveProofReadiness.strongestCandidateTrackId,
      strongestCandidateTrackLabel: archiveProofReadiness.strongestCandidateTrackLabel,
      proofPolicy: archiveProofReadiness.proofPolicy,
    },
    gates: releaseGates,
    api: {
      releaseDecision: "/api/upsc/prelims-2026/release-decision",
      mainSiteHandoff: manifest.api.mainSiteHandoff,
      reviewCommand: manifest.api.reviewCommand,
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
