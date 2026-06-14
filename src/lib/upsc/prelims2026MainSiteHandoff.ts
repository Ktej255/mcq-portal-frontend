import { buildPrelims2026BuildReadiness } from "@/lib/upsc/prelims2026BuildReadiness";
import { buildPrelims2026MatchAccountability } from "@/lib/upsc/prelims2026MatchAccountability";
import { buildEmptyPrelims2026PublicProofFeed } from "@/lib/upsc/prelims2026PublicProofFeed";
import { buildPrelims2026QuestionLedgerPublic } from "@/lib/upsc/prelims2026QuestionLedgerPublic";
import { buildPrelims2026ReleaseDecision } from "@/lib/upsc/prelims2026ReleaseDecision";
import {
  buildPrelims2026ArchiveProofReadiness,
  buildPrelims2026QuestionFormatStats,
} from "@/lib/upsc/prelims2026ArchiveProofReadiness";
import { buildPrelims2026ShowcaseManifest } from "@/lib/upsc/prelims2026ShowcaseManifest";
import { buildPrelims2026SourceArchiveSummaryFromScan } from "@/lib/upsc/prelims2026SourceArchiveSummary";
import { buildPrelims2027CourseActionPublic } from "@/lib/upsc/prelims2027CourseActionPublic";
import { defaultUpscSourceArchiveRoot } from "@/lib/upsc/sourceArchiveIntake";
import { scanSourceArchive } from "@/lib/upsc/sourceArchiveScanner";

export const prelims2026MainSiteHandoffVersion = "upsc-prelims-2026-main-site-handoff-v1";

export async function buildPrelims2026MainSiteHandoff(rootPath = defaultUpscSourceArchiveRoot) {
  const manifest = buildPrelims2026ShowcaseManifest();
  const readiness = buildPrelims2026BuildReadiness();
  const matchAccountability = buildPrelims2026MatchAccountability();
  const questionLedger = buildPrelims2026QuestionLedgerPublic();
  const courseAction = buildPrelims2027CourseActionPublic();
  const questionFormat = buildPrelims2026QuestionFormatStats();
  const archiveScan = await scanSourceArchive(rootPath);
  const archiveProofReadiness = buildPrelims2026ArchiveProofReadiness(archiveScan);
  const sourceArchive = buildPrelims2026SourceArchiveSummaryFromScan(archiveScan);
  const releaseDecision = await buildPrelims2026ReleaseDecision(rootPath, archiveScan);
  const proofFeed = buildEmptyPrelims2026PublicProofFeed();
  const heroCopy = manifest.website.copyBlocks.find((block) => block.id === "hero-copy");
  const proofCopy = manifest.website.copyBlocks.find((block) => block.id === "proof-copy");
  const strategyCopy = manifest.website.copyBlocks.find((block) => block.id === "strategy-copy");
  const softwareCopy = manifest.website.copyBlocks.find((block) => block.id === "software-copy");

  return {
    version: prelims2026MainSiteHandoffVersion,
    generatedAt: new Date().toISOString(),
    status: readiness.status,
    mode: "public-safe-main-site-bundle",
    publicRoute: manifest.publicRoute,
    dashboardRoute: manifest.dashboardRoute,
    reviewCommandRoute: manifest.reviewCommandRoute,
    strategyRoute: manifest.strategyRoute,
    proofPolicy:
      "Use this bundle for website integration. It includes public-safe copy, summary counts, route ownership and preview rows only; full MCQ evidence and approved claim release stay behind their dedicated endpoints and proof gates.",
    audit: manifest.audit.corrected,
    sourceLead: manifest.audit.sourceLead,
    visualStory: {
      publicAnchor: "/upsc-prelims-2026-showcase#question-logic",
      questionFormat,
      statementDominanceLine: `${questionFormat.multiStatementQuestions}/${questionFormat.totalQuestions} questions used multi-statement or pair-list logic.`,
      chartPolicy: questionFormat.chartPolicy,
    },
    website: {
      headline: heroCopy?.body.split("\n")[0] ?? "UPSC Prelims 2026: what we built, what appeared, and what changes for 2027.",
      correctedCoverageLine:
        proofCopy?.body.split("\n").find((line) => line.includes("Corrected research outcome")) ??
        "Corrected research outcome: 44 direct hits, 30 partial hits, 23 misses and 3 dropped questions.",
      strategyLine: strategyCopy?.body.split("\n")[0] ?? "The 2027 plan is not more content everywhere. It is sharper allocation.",
      softwareLine:
        softwareCopy?.body.split("\n")[0] ??
        "The analysis is connected to the UPSC Command software through evidence, practice and delivery workflows.",
      copyBlocks: manifest.website.copyBlocks,
      integrationMap: manifest.website.integrationMap,
    },
    operatorHandoff: {
      reviewCommandRoute: manifest.reviewCommandRoute,
      strategyRoute: manifest.strategyRoute,
      publicShowcaseRoute: manifest.publicRoute,
      proofQueueRoute: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
      sourceGapRoute: "/upsc/prelims-2027-strategy#prelims-2026-source-gap-work-orders",
      reallocationRoute: "/upsc/prelims-2027-strategy#prelims-2027-reallocation-board",
      mcqCommandRoute: "/upsc/mcq-command",
      releaseDecisionApi: manifest.api.releaseDecision,
      rule:
        "Start operators from the Review Command, then move into Strategy Command sections for proof packets, source gaps, reallocation and delivery tracking.",
    },
    readiness: {
      summary: readiness.summary,
      gates: readiness.gates,
      requirements: readiness.requirements.map((requirement) => ({
        id: requirement.id,
        label: requirement.label,
        status: requirement.status,
        publicAnchor: requirement.publicAnchor,
        portalOwner: requirement.portalOwner,
        apiEvidence: requirement.apiEvidence,
        verifier: requirement.verifier,
      })),
    },
    questionLedger: {
      endpoint: manifest.api.questionLedger,
      publicAnchor: questionLedger.publicAnchor,
      proofLocked: true,
      summary: questionLedger.summary,
      sourceLeadLedger: questionLedger.sourceLeadLedger,
      previewQuestions: questionLedger.questions.slice(0, 3).map((question) => ({
        number: question.number,
        subject: question.subject,
        statusLabel: question.statusLabel,
        answer: question.answer,
        stem: question.question.stem,
        optionCount: question.question.options.length,
        statementCoverageRows: question.match.statementCoverage.length,
        matchScope: question.match.matchScope,
      })),
    },
    matchAccountability: {
      endpoint: manifest.api.matchAccountability,
      publicAnchor: matchAccountability.publicAnchor,
      strategyAnchor: matchAccountability.strategyAnchor,
      proofPolicy: matchAccountability.proofPolicy,
      summary: matchAccountability.summary,
      previewQuestions: matchAccountability.questions.slice(0, 5).map((question) => ({
        number: question.number,
        subject: question.subject,
        statusLabel: question.statusLabel,
        answer: question.answer,
        highestMatchedPortion: question.match.highestMatchedPortion,
        matchedPortionLabels: question.match.matchedPortionLabels,
        manualCheckPortionLabels: question.match.manualCheckPortionLabels,
        coverageScorePercent: question.match.coverageScorePercent,
        nextProofAction: question.match.nextProofAction,
      })),
    },
    sourceArchive: {
      endpoint: manifest.api.sourceArchiveSummary,
      publicAnchor: sourceArchive.publicAnchor,
      internalIntakeRoute: sourceArchive.internalIntakeRoute,
      proofPolicy: sourceArchive.proofPolicy,
      scan: sourceArchive.scan,
      tracks: sourceArchive.tracks,
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
    proofFeed: {
      endpoint: manifest.api.proofFeed,
      portalOwner: proofFeed.portalOwner,
      proofPolicy: proofFeed.proofPolicy,
      releasedClaimCount: proofFeed.releasedClaims.length,
      releaseMode: "empty-until-approved-proof-packets",
    },
    releaseDecision: {
      endpoint: releaseDecision.api.releaseDecision,
      publicAnchor: releaseDecision.publicAnchor,
      strategyAnchor: releaseDecision.strategyAnchor,
      status: releaseDecision.status,
      summary: releaseDecision.summary,
      gates: releaseDecision.gates,
    },
    courseAction: {
      endpoint: manifest.api.courseAction,
      publicAnchor: courseAction.publicAnchor,
      proofPolicy: courseAction.proofPolicy,
      summary: courseAction.summary,
      priorityPreview: courseAction.priorities.slice(0, 5).map((priority) => ({
        id: priority.id,
        subject: priority.subject,
        priority: priority.priority,
        window: priority.window,
        action: priority.action,
        taskCount: priority.taskCount,
        blueprintCount: priority.blueprintCount,
        proofStatus: priority.proofStatus,
        releaseGate: priority.releaseGate,
      })),
    },
    api: {
      releaseDecision: "/api/upsc/prelims-2026/release-decision",
      mainSiteHandoff: "/api/upsc/prelims-2026/main-site-handoff",
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
