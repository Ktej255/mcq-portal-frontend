"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { geographySessions } from "@/lib/upsc/plan";
import {
  loadRemoteSubjectProgress,
  mergeProgressMaps,
  saveRemoteSubjectProgress,
  upscLearnerStateClearedEvent,
} from "@/lib/upsc/learnerPersistence";
import type {
  GeographyAssessmentBand,
  GeographyAssessmentRubricItem,
  GeographyMaicTurn,
  GeographyTalkUnlockStage,
} from "@/lib/upsc/geographyLearning";
import type {
  GeographyKnownConcept,
  GeographyMissingConcept,
} from "@/lib/upsc/geographyContentModules";

export type GeographyConfidence = "Shaky" | "Working" | "Command";
export type GeographyMentorMode = "Map logic" | "Cause-effect" | "UPSC trap";
export type GeographyWatchState = "Queued" | "In class" | "Watched";
export type GeographyTalkDiscussionStep = "explain" | "challenge" | "verdict";
export type GeographyTalkTeacherStatus = "answer-required" | "repair-required" | "mcq-ready";
export type GeographyTalkClassroomStage = "watch-proof" | "student-explain" | "peer-challenge" | "examiner-verdict";
export type GeographyLabProofStage = "concept" | "map" | "example" | "trap" | "answer";
export type GeographyLabEvidenceStatus = "proof-pending" | "talk-required" | "mcq-ready";
export type GeographyRecoveryProofStage = "recall" | "explain" | "map" | "trap" | "retest";
export type GeographyRecoveryStatus = "recovery-pending" | "talk-ready";
export type GeographyMcqOutcome = "Pending" | "Command" | "Revisit";
export type GeographyMcqReadinessStatus =
  | "learning-blocked"
  | "batch-pending"
  | "content-pending"
  | "quality-review"
  | "practice-ready"
  | "practice-active"
  | "command"
  | "revisit";

export type GeographyMeTimeMood = "calm" | "focused" | "tired" | "overloaded" | "low-confidence" | "exam-stress";

export type GeographyModuleSectionRecallAttempt = {
  moduleId: string;
  sectionId: string;
  cumulativeSectionIds: string[];
  answer: string;
  score: number;
  knownConcepts: GeographyKnownConcept[];
  missingConcepts: GeographyMissingConcept[];
  attemptedAt: string;
};

export type GeographyModuleProgress = {
  moduleId: string;
  activeSectionId?: string;
  readSectionIds?: string[];
  passedSectionIds?: string[];
  nextUnlockedSectionId?: string;
  knownConcepts?: GeographyKnownConcept[];
  missingConcepts?: GeographyMissingConcept[];
  initialKnownPercent?: number;
  currentMasteryPercent?: number;
  gapFilledPercent?: number;
  remainingGapPercent?: number;
  sectionRecallAttempts?: GeographyModuleSectionRecallAttempt[];
  updatedAt?: string;
};

export type GeographyDayProgress = {
  day: number;
  moduleProgress?: Record<string, GeographyModuleProgress>;
  sectionRecallAttempts?: GeographyModuleSectionRecallAttempt[];
  knownConcepts?: GeographyKnownConcept[];
  missingConcepts?: GeographyMissingConcept[];
  initialKnownPercent?: number;
  currentMasteryPercent?: number;
  gapFilledPercent?: number;
  nextUnlockedSectionId?: string;
  dayStartRecallSourceDay?: number;
  dayStartRecallClearedAt?: string;
  dayStartRecallScore?: number;
  watched?: boolean;
  watchState?: GeographyWatchState;
  watchNote?: string;
  watchMinutes?: number;
  watchSceneIndex?: number;
  watchSceneCompletedIds?: string[];
  watchHandoffSummary?: string;
  watchHandoffReady?: boolean;
  learnerLevel?: "Beginner" | "Intermediate" | "Advanced";
  studyWindow?: string;
  baselineKnowledge?: string;
  baselineSavedAt?: string;
  confidence?: GeographyConfidence;
  mentorMode?: GeographyMentorMode;
  reflection?: string;
  activePromptLabel?: string;
  revisitQueued?: boolean;
  talkScore?: number;
  talkBand?: GeographyAssessmentBand;
  assessmentSummary?: string;
  talkTranscript?: GeographyMaicTurn[];
  talkUnlockStage?: GeographyTalkUnlockStage;
  talkVerdict?: string;
  talkChallengeResponse?: string;
  talkDiscussionStep?: GeographyTalkDiscussionStep;
  talkRubric?: GeographyAssessmentRubricItem[];
  talkRepairHints?: string[];
  talkPreliminaryScore?: number;
  talkPreliminaryBand?: GeographyAssessmentBand;
  talkPreliminarySummary?: string;
  talkPreliminaryUnlockStage?: GeographyTalkUnlockStage;
  talkPreliminaryRubric?: GeographyAssessmentRubricItem[];
  talkPreliminaryRepairHints?: string[];
  talkClassroomStage?: GeographyTalkClassroomStage;
  talkNextRoute?: string;
  talkNextActionLabel?: string;
  teacherMode?: "nvidia-teacher" | "gemini" | "local-fallback";
  teacherPromptVersion?: string;
  teacherRubricVersion?: string;
  teacherRecallTarget?: number;
  teacherCoachSummary?: string;
  teacherCoachNextPrompt?: string;
  teacherDoubtCategory?: string;
  teacherDoubtReason?: string;
  teacherDoubtRepairAction?: string;
  teacherDoubtMasteryCheck?: string;
  teacherProviderScore?: number;
  talkTeacherFollowUpPrompt?: string;
  talkTeacherFollowUpAnswer?: string;
  talkTeacherTurnCount?: number;
  talkTeacherStatus?: GeographyTalkTeacherStatus;
  recoveryCompleted?: boolean;
  recoveryStepIndex?: number;
  recoveryProofCompletedIds?: string[];
  recoveryProofNotes?: Record<string, string>;
  recoverySummary?: string;
  recoveryWeakSkill?: string;
  recoveryDiagnosisSummary?: string;
  recoveryReturnPrompt?: string;
  recoveryStatus?: GeographyRecoveryStatus;
  recoveryEvidenceAnchor?: string;
  recoveryNextRoute?: string;
  recoveryNextActionLabel?: string;
  labCompleted?: boolean;
  labMode?: string;
  labInsight?: string;
  labFocus?: string;
  labProofIndex?: number;
  labProofCompletedIds?: string[];
  labProofSummary?: string;
  labAtlasLayer?: string;
  labAtlasPoint?: string;
  labEvidenceStatus?: GeographyLabEvidenceStatus;
  labEvidenceAnchor?: string;
  labNextRoute?: string;
  labNextActionLabel?: string;
  mcqAttempted?: boolean;
  mcqCompleted?: boolean;
  mcqAnswerMap?: Record<number, string>;
  mcqCurrentQuestionIndex?: number;
  mcqAnsweredCount?: number;
  mcqCorrectCount?: number;
  mcqTotal?: number;
  mcqScorePercent?: number;
  mcqLastBatchCode?: string;
  mcqOutcome?: GeographyMcqOutcome;
  mcqRecommendedRoute?: string;
  mcqReviewSummary?: string;
  mcqReadinessStatus?: GeographyMcqReadinessStatus;
  mcqEvidenceAnchor?: string;
  mcqNextRoute?: string;
  mcqNextActionLabel?: string;
  mcqPreflightSummary?: string;
  mcqFreshQuestionCount?: number;
  mcqPlannedCount?: number;
  mcqQualityScore?: number;
  mcqQualityWarnings?: string[];
  mcqQualityPassed?: boolean;
  mcqQualityGateLabel?: string;
  meTimeCompletedAt?: string;
  meTimeMood?: GeographyMeTimeMood;
  meTimeResetPlan?: string;
  savedCount?: number;
  updatedAt?: string;
};

type GeographyProgressMap = Record<string, GeographyDayProgress>;

export type GeographySpacedRevisionItem = {
  source: (typeof geographySessions)[number];
  due: (typeof geographySessions)[number];
  progress: GeographyDayProgress;
  dueDay: number;
};

const STORAGE_KEY = "sarit-upsc-geography-progress-v1";

function readProgress(): GeographyProgressMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgress(progress: GeographyProgressMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function hasStartedTopic(progress?: GeographyDayProgress) {
  const moduleEvidence = Object.values(progress?.moduleProgress ?? {}).some(
    (module) =>
      (module.readSectionIds?.length ?? 0) > 0 ||
      (module.passedSectionIds?.length ?? 0) > 0 ||
      (module.sectionRecallAttempts?.length ?? 0) > 0
  );

  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      moduleEvidence ||
      progress?.labCompleted ||
      progress?.mcqAttempted
  );
}

function hasClearedSpacedRevision(progress?: GeographyDayProgress) {
  return Boolean(
    progress?.confidence === "Command" ||
      (progress?.revisitQueued === false && progress?.activePromptLabel === "Revisit") ||
      progress?.recoveryStatus === "talk-ready"
  );
}

export function useGeographyProgress() {
  const [progress, setProgress] = useState<GeographyProgressMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const localProgress = readProgress();
      if (cancelled) return;
      setProgress(localProgress);
      setIsLoaded(true);

      void loadRemoteSubjectProgress<GeographyDayProgress>("geography").then((remoteProgress) => {
        if (cancelled) return;
        if (!remoteProgress) {
          if (Object.keys(localProgress).length) void saveRemoteSubjectProgress("geography", localProgress);
          return;
        }
        const mergedProgress = mergeProgressMaps(localProgress, remoteProgress);
        writeProgress(mergedProgress);
        setProgress((current) => mergeProgressMaps(current, mergedProgress));
        if (Object.keys(localProgress).length) void saveRemoteSubjectProgress("geography", mergedProgress);
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const syncLocalProgress = () => {
      const localProgress = readProgress();
      if (Object.keys(localProgress).length) void saveRemoteSubjectProgress("geography", localProgress);
    };
    const clearInMemoryProgress = () => setProgress(readProgress());

    window.addEventListener("online", syncLocalProgress);
    window.addEventListener(upscLearnerStateClearedEvent, clearInMemoryProgress);
    return () => {
      window.removeEventListener("online", syncLocalProgress);
      window.removeEventListener(upscLearnerStateClearedEvent, clearInMemoryProgress);
    };
  }, []);

  const saveDayProgress = useCallback((day: number, patch: Omit<Partial<GeographyDayProgress>, "day">) => {
    setProgress((current) => {
      const key = String(day);
      const nextDay = {
        ...current[key],
        day,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      const next = {
        ...current,
        [key]: nextDay,
      };
      writeProgress(next);
      void saveRemoteSubjectProgress("geography", next);
      return next;
    });
  }, []);

  const getDayProgress = useCallback((day: number) => progress[String(day)], [progress]);

  const stats = useMemo(() => {
    const savedDays = geographySessions.filter((session) => {
      const item = progress[String(session.day)];
      return Boolean(item?.reflection?.trim());
    });
    const watchedDays = geographySessions.filter((session) => progress[String(session.day)]?.watched);
    const commandDays = geographySessions.filter((session) => progress[String(session.day)]?.confidence === "Command");
    const shakyDays = geographySessions.filter((session) => progress[String(session.day)]?.confidence === "Shaky");
    const revisitDays = geographySessions.filter((session) => progress[String(session.day)]?.revisitQueued);
    const mcqAttemptedDays = geographySessions.filter((session) => progress[String(session.day)]?.mcqAttempted);
    const mcqCompletedDays = geographySessions.filter((session) => progress[String(session.day)]?.mcqCompleted);
    const spacedRevisionItems = geographySessions
      .map((source) => {
        const sourceProgress = progress[String(source.day)];
        const dueDay = Math.min(source.day + 2, geographySessions.length);
        const due = geographySessions.find((session) => session.day === dueDay);
        if (!sourceProgress || !due || !hasStartedTopic(sourceProgress) || hasClearedSpacedRevision(sourceProgress)) {
          return null;
        }
        return { source, due, progress: sourceProgress, dueDay };
      })
      .filter((item): item is GeographySpacedRevisionItem => Boolean(item));
    const spacedRevisionDays = spacedRevisionItems.map((item) => item.source);

    return {
      watchedCount: watchedDays.length,
      savedCount: savedDays.length,
      commandCount: commandDays.length,
      shakyCount: shakyDays.length,
      revisitCount: revisitDays.length,
      spacedRevisionCount: spacedRevisionDays.length,
      mcqAttemptedCount: mcqAttemptedDays.length,
      mcqCompletedCount: mcqCompletedDays.length,
      watchedDays,
      savedDays,
      commandDays,
      shakyDays,
      revisitDays,
      spacedRevisionDays,
      spacedRevisionItems,
      mcqAttemptedDays,
      mcqCompletedDays,
      watchCompletionPercent: Math.round((watchedDays.length / geographySessions.length) * 100),
      completionPercent: Math.round((savedDays.length / geographySessions.length) * 100),
    };
  }, [progress]);

  return {
    progress,
    isLoaded,
    stats,
    getDayProgress,
    saveDayProgress,
  };
}
