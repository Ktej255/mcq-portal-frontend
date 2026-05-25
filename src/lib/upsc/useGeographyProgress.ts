"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { geographySessions } from "@/lib/upsc/plan";
import type {
  GeographyAssessmentBand,
  GeographyAssessmentRubricItem,
  GeographyMaicTurn,
  GeographyTalkUnlockStage,
} from "@/lib/upsc/geographyLearning";

export type GeographyConfidence = "Shaky" | "Working" | "Command";
export type GeographyMentorMode = "Map logic" | "Cause-effect" | "UPSC trap";
export type GeographyWatchState = "Queued" | "In class" | "Watched";
export type GeographyTalkDiscussionStep = "explain" | "challenge" | "verdict";
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

export type GeographyDayProgress = {
  day: number;
  watched?: boolean;
  watchState?: GeographyWatchState;
  watchNote?: string;
  watchMinutes?: number;
  watchSceneIndex?: number;
  watchSceneCompletedIds?: string[];
  watchHandoffSummary?: string;
  watchHandoffReady?: boolean;
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
  savedCount?: number;
  updatedAt?: string;
};

type GeographyProgressMap = Record<string, GeographyDayProgress>;

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

export function useGeographyProgress() {
  const [progress, setProgress] = useState<GeographyProgressMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgress(readProgress());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
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

    return {
      watchedCount: watchedDays.length,
      savedCount: savedDays.length,
      commandCount: commandDays.length,
      shakyCount: shakyDays.length,
      revisitCount: revisitDays.length,
      mcqAttemptedCount: mcqAttemptedDays.length,
      mcqCompletedCount: mcqCompletedDays.length,
      watchedDays,
      savedDays,
      commandDays,
      shakyDays,
      revisitDays,
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
