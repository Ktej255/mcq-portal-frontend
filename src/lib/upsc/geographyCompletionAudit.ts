import { geographyContentModules } from "@/lib/upsc/geographyContentModules";
import { geographyTopicGroups, getGeographyTopicCoverageSummary } from "@/lib/upsc/geographyTopicCoverage";
import { geographySessions } from "@/lib/upsc/plan";

export type GeographyCompletionStatus = "complete" | "partial" | "missing";

export type GeographyCompletionAuditItem = {
  id: string;
  label: string;
  status: GeographyCompletionStatus;
  evidence: string;
  gap: string;
  nextAction: string;
};

const statusWeight: Record<GeographyCompletionStatus, number> = {
  complete: 1,
  partial: 0.5,
  missing: 0,
};

const moduleCoveredTopicIds = new Set(geographyContentModules.flatMap((module) => module.topicIds));
const moduleCoveredTopicCount = geographyTopicGroups.filter((group) => moduleCoveredTopicIds.has(group.id)).length;
const moduleGapCount = Math.max(geographyTopicGroups.length - moduleCoveredTopicCount, 0);
const moduleCoveredDays = new Set(geographyContentModules.map((module) => module.day));
const moduleCoveredDayCount = geographySessions.filter((session) => moduleCoveredDays.has(session.day)).length;
const moduleDayGapCount = Math.max(geographySessions.length - moduleCoveredDayCount, 0);
const moduleCount = geographyContentModules.length;
const moduleSectionCount = geographyContentModules.reduce((sum, module) => sum + module.sections.length, 0);
const approvedModuleCount = geographyContentModules.filter((module) => module.status === "approved").length;
const draftModuleCount = geographyContentModules.filter((module) => module.status === "draft").length;
const sampleModuleCount = geographyContentModules.filter((module) => module.status === "sample-layout").length;
const modulesWithImageMetadataCount = geographyContentModules.filter((module) =>
  module.sections.some((section) =>
    Boolean(section.image?.alt && section.image.credit && section.image.license && section.image.sourceUrl)
  )
).length;
const sectionsWithImageMetadataCount = geographyContentModules.reduce(
  (sum, module) =>
    sum +
    module.sections.filter((section) =>
      Boolean(section.image?.alt && section.image.credit && section.image.license && section.image.sourceUrl)
    ).length,
  0
);
const modulesWithPyqSectionsCount = geographyContentModules.filter((module) =>
  module.sections.some((section) => section.kind === "pyq")
).length;
const modulesWithMcqSectionsCount = geographyContentModules.filter((module) =>
  module.sections.some((section) => section.kind === "mcq")
).length;
const modulesWithExamPracticeSectionsCount = geographyContentModules.filter((module) =>
  module.sections.some((section) => section.kind === "pyq" || section.kind === "mcq")
).length;
const modulesWithCompleteRecallPointsCount = geographyContentModules.filter((module) =>
  module.sections.every((section) => section.expectedRecallPoints.length > 0)
).length;

export const geographyCompletionAuditItems: GeographyCompletionAuditItem[] = [
  {
    id: "topic-coverage",
    label: "82-topic PDF coverage",
    status: "complete",
    evidence: "The extracted PDF list has 82 groups and all 82 are mapped in geographyTopicCoverage.ts.",
    gap: "No unmapped topic-group gap found.",
    nextAction: "Keep this registry as the source of truth when new modules are added.",
  },
  {
    id: "twenty-day-plan",
    label: "20-day student plan",
    status: moduleDayGapCount === 0 ? "complete" : "partial",
    evidence: `geographySessions exposes ${geographySessions.length} student-facing days; ${moduleCoveredDayCount}/${geographySessions.length} days now have a primary slide module.`,
    gap:
      moduleDayGapCount === 0
        ? "Every student-facing Geography day has a primary slide module; legacy 30-day assets remain only as internal source material."
        : `${moduleDayGapCount} student-facing days still need primary slide modules.`,
    nextAction: "Use the legacy assets only as source material during module migration.",
  },
  {
    id: "single-action-navigation",
    label: "Simple navigation",
    status: "complete",
    evidence: "Command has one primary action; Watch, Talk, MCQ, Revisit, Track, and optional Lab share the Geography room compass.",
    gap: "No required learner-room navigation gap remains. Pilot, testing, and production-check are specialist/operator surfaces outside the daily learner loop.",
    nextAction: "Keep specialist routes out of the student resume path and route learners through /upsc/geography/continue.",
  },
  {
    id: "web-modules",
    label: "Slide-style web modules",
    status: moduleGapCount === 0 && moduleDayGapCount === 0 ? "complete" : "partial",
    evidence: `${geographyContentModules.length} structured Geography content modules cover ${moduleCoveredTopicCount}/${geographyTopicGroups.length} topic groups and ${moduleCoveredDayCount}/${geographySessions.length} student-facing days.`,
    gap:
      moduleGapCount === 0 && moduleDayGapCount === 0
        ? "All 82 topic groups and all 20 student-facing days have at least pilot/draft module coverage; teacher approval and richer media are still content-quality work."
        : `${moduleGapCount} topic groups still need approved slide modules.`,
    nextAction: "Move draft modules through teacher approval, licensed image metadata, richer PYQ/MCQ banks, and final copy review.",
  },
  {
    id: "teacher-approved-content",
    label: "Teacher-approved content",
    status: approvedModuleCount === moduleCount ? "complete" : approvedModuleCount > 0 ? "partial" : "missing",
    evidence: `${approvedModuleCount}/${moduleCount} modules are marked approved; ${draftModuleCount} draft modules and ${sampleModuleCount} sample-layout modules remain.`,
    gap:
      approvedModuleCount === moduleCount
        ? "Every module is teacher-approved."
        : "The web-module system is structurally ready, but module copy is not yet teacher-approved as final classroom content.",
    nextAction: "Run teacher review module by module and change status to approved only after content, examples, traps, and handoff are accepted.",
  },
  {
    id: "cumulative-recall",
    label: "Cumulative section recall",
    status: moduleGapCount === 0 && modulesWithCompleteRecallPointsCount === moduleCount ? "complete" : "partial",
    evidence: `Module recall uses cumulative expected recall points and blocks future sections when earlier concepts are missed. ${modulesWithCompleteRecallPointsCount}/${moduleCount} modules have expected recall points on every section.`,
    gap:
      moduleGapCount === 0 && modulesWithCompleteRecallPointsCount === moduleCount
        ? "No structural recall gap remains; production quality depends on the final expected-recall-point review."
        : "Some day modules still need expected recall points before the cumulative behavior is complete.",
    nextAction: "Review expected recall points with the teacher before marking modules approved.",
  },
  {
    id: "known-missing-ledger",
    label: "Known vs need-to-cover ledger",
    status: moduleDayGapCount === 0 ? "complete" : "partial",
    evidence: "Talk stores known concepts and missing concepts from module recall attempts; every student-facing day now has module expected-recall points.",
    gap:
      moduleDayGapCount === 0
        ? "No required daily learner route remains without the Known/Need ledger. Precision depends on final teacher review of expected recall points."
        : "Some student-facing days still lack module expected-recall points.",
    nextAction: "Review expected recall points with the teacher and calibrate missing-concept repair prompts using real attempts.",
  },
  {
    id: "speech-transcription",
    label: "Speech and transcription",
    status: "partial",
    evidence: "Talk has browser live speech, audio-note fallback, and an optional /api/upsc/teacher/transcribe hook.",
    gap: "Automatic server transcription is not complete until an STT provider or local Whisper backend is configured.",
    nextAction: "Choose STT backend and wire credentials/runtime limits for production.",
  },
  {
    id: "growth-reports",
    label: "Growth reports",
    status: "complete",
    evidence: "Reports show initial known, gap filled, and remaining gap from Geography module/progress fields.",
    gap: "Report precision now depends on the quality of each module's final expected recall points.",
    nextAction: "Use live student attempts to calibrate the gap-filled graph and teacher repair prompts.",
  },
  {
    id: "pyq-mcq-enrichment",
    label: "PYQ and MCQ enrichment",
    status:
      modulesWithPyqSectionsCount === moduleCount && modulesWithMcqSectionsCount === moduleCount
        ? "complete"
        : modulesWithExamPracticeSectionsCount > 0
          ? "partial"
          : "missing",
    evidence: `${modulesWithPyqSectionsCount}/${moduleCount} modules include PYQ sections; ${modulesWithMcqSectionsCount}/${moduleCount} modules include MCQ sections; ${modulesWithExamPracticeSectionsCount}/${moduleCount} modules include either PYQ or MCQ practice sections.`,
    gap:
      modulesWithPyqSectionsCount === moduleCount && modulesWithMcqSectionsCount === moduleCount
        ? "Every module includes both PYQ and MCQ enrichment."
        : "Most modules still need explicit PYQ and MCQ enrichment sections, even though the general MCQ readiness room exists.",
    nextAction: "Add module-specific PYQ pattern cards and MCQ repair drills before approving each module.",
  },
  {
    id: "media-and-images",
    label: "Licensed images and diagrams",
    status: "partial",
    evidence: `${modulesWithImageMetadataCount}/${moduleCount} modules and ${sectionsWithImageMetadataCount}/${moduleSectionCount} sections include image metadata with alt text, credit, license, and source URL.`,
    gap:
      modulesWithImageMetadataCount === moduleCount
        ? "Every module has at least one credited image or diagram; section-level media depth can still improve."
        : "Most modules do not yet have credited image metadata or diagrams.",
    nextAction: "Require image metadata in every module before marking a module approved.",
  },
];

export function getGeographyCompletionAuditSummary() {
  const coverage = getGeographyTopicCoverageSummary();
  const total = geographyCompletionAuditItems.length;
  const complete = geographyCompletionAuditItems.filter((item) => item.status === "complete").length;
  const partial = geographyCompletionAuditItems.filter((item) => item.status === "partial").length;
  const missing = geographyCompletionAuditItems.filter((item) => item.status === "missing").length;
  const score = Math.round(
    (geographyCompletionAuditItems.reduce((sum, item) => sum + statusWeight[item.status], 0) / Math.max(total, 1)) * 100
  );

  return {
    total,
    complete,
    partial,
    missing,
    score,
    topicGroups: coverage.total,
    mappedTopicPercent: coverage.mappedPercent,
    moduleReadyPercent: coverage.moduleReadyPercent,
    moduleCount,
    moduleCoveredTopicCount,
    moduleGapCount,
    moduleCoveredDayCount,
    moduleDayGapCount,
    approvedModuleCount,
    draftModuleCount,
    sampleModuleCount,
    moduleSectionCount,
    modulesWithImageMetadataCount,
    sectionsWithImageMetadataCount,
    modulesWithPyqSectionsCount,
    modulesWithMcqSectionsCount,
    modulesWithExamPracticeSectionsCount,
    modulesWithCompleteRecallPointsCount,
  };
}
