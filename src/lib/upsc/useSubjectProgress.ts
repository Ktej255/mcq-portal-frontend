"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectAssessmentBand, SubjectMaicTurn, SubjectTalkUnlockStage } from "@/lib/upsc/subjectLearning";
import {
  loadRemoteSubjectProgress,
  mergeProgressMaps,
  saveRemoteSubjectProgress,
  upscLearnerStateClearedEvent,
} from "@/lib/upsc/learnerPersistence";

export type SubjectConfidence = "Shaky" | "Working" | "Command";
export type SubjectMentorMode = "Concept logic" | "Cause-effect" | "UPSC trap";
export type SubjectWatchState = "Queued" | "In class" | "Watched";
export type SubjectWatchMediaAssetMap = Record<string, string>;
export type SubjectTalkDiscussionStep = "explain" | "challenge" | "verdict";
export type SubjectTalkClassroomStage =
  | "teacher-brief"
  | "student-explain"
  | "peer-challenge"
  | "examiner-verdict";
export type SubjectMcqReadinessStatus =
  | "learning-blocked"
  | "batch-pending"
  | "content-pending"
  | "quality-review"
  | "practice-ready"
  | "practice-active"
  | "command"
  | "revisit";
export type SubjectMeTimeMood = "calm" | "focused" | "tired" | "overloaded" | "low-confidence" | "exam-stress";

export type SubjectDayProgress = {
  day: number;
  watched?: boolean;
  watchState?: SubjectWatchState;
  watchNote?: string;
  watchMinutes?: number;
  watchSceneIndex?: number;
  watchSceneCompletedIds?: string[];
  watchMediaReadyIds?: string[];
  watchMediaAssetSources?: SubjectWatchMediaAssetMap;
  watchMediaTranscript?: string;
  learnerLevel?: "Beginner" | "Intermediate" | "Advanced";
  studyWindow?: string;
  baselineKnowledge?: string;
  baselineSavedAt?: string;
  confidence?: SubjectConfidence;
  mentorMode?: SubjectMentorMode;
  reflection?: string;
  activePromptLabel?: string;
  revisitQueued?: boolean;
  talkScore?: number;
  talkBand?: SubjectAssessmentBand;
  assessmentSummary?: string;
  talkTranscript?: SubjectMaicTurn[];
  talkUnlockStage?: SubjectTalkUnlockStage;
  talkVerdict?: string;
  talkChallengeResponse?: string;
  talkDiscussionStep?: SubjectTalkDiscussionStep;
  talkClassroomStage?: SubjectTalkClassroomStage;
  talkNextRoute?: string;
  talkNextActionLabel?: string;
  talkPreliminaryScore?: number;
  teacherMode?: "gemini" | "local-fallback";
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
  labCompleted?: boolean;
  labMode?: string;
  labInsight?: string;
  labFocus?: string;
  labProofIndex?: number;
  labProofCompletedIds?: string[];
  labProofSummary?: string;
  mcqAttempted?: boolean;
  mcqCompleted?: boolean;
  mcqAnswerMap?: Record<number, string>;
  mcqCurrentQuestionIndex?: number;
  mcqAnsweredCount?: number;
  mcqCorrectCount?: number;
  mcqTotal?: number;
  mcqScorePercent?: number;
  mcqLastBatchCode?: string;
  mcqOutcome?: "Pending" | "Command" | "Revisit";
  mcqRecommendedRoute?: string;
  mcqReviewSummary?: string;
  mcqReadinessStatus?: SubjectMcqReadinessStatus;
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
  mcqRecoveryCompleted?: boolean;
  mcqRecoveryNote?: string;
  mcqRecoverySummary?: string;
  mcqRecoverySourceOutcome?: string;
  mcqRecoveryCompletedAt?: string;
  mcqRecoveryRetestCompleted?: boolean;
  mcqRecoveryRetestOutcome?: "Pending" | "Command" | "Revisit";
  mcqRecoveryRetestSummary?: string;
  mcqRecoveryRetestCompletedAt?: string;
  mcqRecoveryResolved?: boolean;
  meTimeCompletedAt?: string;
  meTimeMood?: SubjectMeTimeMood;
  meTimeResetPlan?: string;
  savedCount?: number;
  updatedAt?: string;
};

type SubjectProgressMap = Record<string, SubjectDayProgress>;

export type SubjectSpacedRevisionItem = {
  source: SubjectSession;
  due: SubjectSession;
  progress: SubjectDayProgress;
  dueDay: number;
};

function storageKey(subjectSlug: string) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function readProgress(subjectSlug: string): SubjectProgressMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey(subjectSlug));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgress(subjectSlug: string, progress: SubjectProgressMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(subjectSlug), JSON.stringify(progress));
}

function hasStartedTopic(progress?: SubjectDayProgress) {
  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      progress?.labCompleted ||
      progress?.mcqAttempted
  );
}

function hasClearedSpacedRevision(progress?: SubjectDayProgress) {
  return Boolean(
    progress?.confidence === "Command" ||
      progress?.revisitQueued === false && progress?.activePromptLabel === "Revisit" ||
      progress?.mcqRecoveryResolved
  );
}

export function useSubjectProgress(subjectSlug: string, sessions: SubjectSession[]) {
  const [progress, setProgress] = useState<SubjectProgressMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const localProgress = readProgress(subjectSlug);
      setProgress(localProgress);
      setIsLoaded(true);

      void loadRemoteSubjectProgress<SubjectDayProgress>(subjectSlug).then((remoteProgress) => {
        if (cancelled) return;
        if (!remoteProgress) {
          if (Object.keys(localProgress).length) void saveRemoteSubjectProgress(subjectSlug, localProgress);
          return;
        }
        const mergedProgress = mergeProgressMaps(localProgress, remoteProgress);
        writeProgress(subjectSlug, mergedProgress);
        setProgress((current) => mergeProgressMaps(current, mergedProgress));
        if (Object.keys(localProgress).length) void saveRemoteSubjectProgress(subjectSlug, mergedProgress);
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [subjectSlug]);

  useEffect(() => {
    const syncLocalProgress = () => {
      const localProgress = readProgress(subjectSlug);
      if (Object.keys(localProgress).length) void saveRemoteSubjectProgress(subjectSlug, localProgress);
    };
    const clearInMemoryProgress = () => setProgress(readProgress(subjectSlug));

    window.addEventListener("online", syncLocalProgress);
    window.addEventListener(upscLearnerStateClearedEvent, clearInMemoryProgress);
    return () => {
      window.removeEventListener("online", syncLocalProgress);
      window.removeEventListener(upscLearnerStateClearedEvent, clearInMemoryProgress);
    };
  }, [subjectSlug]);

  const saveDayProgress = useCallback(
    (day: number, patch: Omit<Partial<SubjectDayProgress>, "day">) => {
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
        writeProgress(subjectSlug, next);
        void saveRemoteSubjectProgress(subjectSlug, next);
        return next;
      });
    },
    [subjectSlug]
  );

  const getDayProgress = useCallback((day: number) => progress[String(day)], [progress]);

  const stats = useMemo(() => {
    const watchedDays = sessions.filter((session) => progress[String(session.day)]?.watched);
    const savedDays = sessions.filter((session) => Boolean(progress[String(session.day)]?.reflection?.trim()));
    const commandDays = sessions.filter((session) => progress[String(session.day)]?.confidence === "Command");
    const shakyDays = sessions.filter((session) => progress[String(session.day)]?.confidence === "Shaky");
    const revisitDays = sessions.filter((session) => progress[String(session.day)]?.revisitQueued);
    const spacedRevisionItems = sessions
      .map((source) => {
        const sourceProgress = progress[String(source.day)];
        const dueDay = Math.min(source.day + 2, sessions.length);
        const due = sessions.find((session) => session.day === dueDay);
        if (!sourceProgress || !due || !hasStartedTopic(sourceProgress) || hasClearedSpacedRevision(sourceProgress)) {
          return null;
        }
        return { source, due, progress: sourceProgress, dueDay };
      })
      .filter((item): item is SubjectSpacedRevisionItem => Boolean(item));
    const spacedRevisionDays = spacedRevisionItems.map((item) => item.source);

    return {
      watchedCount: watchedDays.length,
      savedCount: savedDays.length,
      commandCount: commandDays.length,
      shakyCount: shakyDays.length,
      revisitCount: revisitDays.length,
      spacedRevisionCount: spacedRevisionDays.length,
      watchedDays,
      savedDays,
      commandDays,
      shakyDays,
      revisitDays,
      spacedRevisionDays,
      spacedRevisionItems,
      watchCompletionPercent: Math.round((watchedDays.length / sessions.length) * 100),
      completionPercent: Math.round((savedDays.length / sessions.length) * 100),
    };
  }, [progress, sessions]);

  return {
    progress,
    isLoaded,
    stats,
    getDayProgress,
    saveDayProgress,
  };
}
