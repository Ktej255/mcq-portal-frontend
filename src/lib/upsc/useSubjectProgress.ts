"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectAssessmentBand, SubjectMaicTurn, SubjectTalkUnlockStage } from "@/lib/upsc/subjectLearning";

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
  labCompleted?: boolean;
  labMode?: string;
  labInsight?: string;
  labFocus?: string;
  labProofIndex?: number;
  labProofCompletedIds?: string[];
  labProofSummary?: string;
  mcqAttempted?: boolean;
  mcqCompleted?: boolean;
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
  savedCount?: number;
  updatedAt?: string;
};

type SubjectProgressMap = Record<string, SubjectDayProgress>;

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

export function useSubjectProgress(subjectSlug: string, sessions: SubjectSession[]) {
  const [progress, setProgress] = useState<SubjectProgressMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgress(readProgress(subjectSlug));
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
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

    return {
      watchedCount: watchedDays.length,
      savedCount: savedDays.length,
      commandCount: commandDays.length,
      shakyCount: shakyDays.length,
      revisitCount: revisitDays.length,
      watchedDays,
      savedDays,
      commandDays,
      shakyDays,
      revisitDays,
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
