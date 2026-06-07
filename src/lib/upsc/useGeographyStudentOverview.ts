"use client";

import { useMemo } from "react";

import { getGeographyLoopState } from "@/lib/upsc/geographyLoopState";
import { getGuidedStudyEntryLabel, getGuidedStudyEntryRoute } from "@/lib/upsc/guidedStudy";
import { geographySessions } from "@/lib/upsc/plan";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { useGeographyProgress, type GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";

function hasStarted(progress?: GeographyDayProgress) {
  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      progress?.labCompleted ||
      progress?.mcqAttempted
  );
}

function needsRecovery(progress?: GeographyDayProgress) {
  return Boolean(
    progress?.revisitQueued ||
      progress?.talkBand === "Revisit" ||
      progress?.mcqOutcome === "Revisit" ||
      progress?.confidence === "Shaky"
  );
}

function hasCommand(progress?: GeographyDayProgress) {
  return Boolean(
    !needsRecovery(progress) &&
      (progress?.mcqOutcome === "Command" ||
        (progress?.mcqCompleted && progress?.confidence === "Command"))
  );
}

function gapStatus(progress?: GeographyDayProgress) {
  if (!progress || !hasStarted(progress)) return "Not measured";
  if (progress.mcqOutcome === "Revisit") return `MCQ recovery: ${progress.mcqScorePercent ?? 0}%`;
  if (progress.talkBand === "Revisit") return `Recall recovery: ${progress.talkScore ?? 0}/100`;
  if (progress.revisitQueued) return "Recovery queued";
  if (progress.confidence === "Shaky") return "Confidence is shaky";
  if (typeof progress.talkScore === "number") return `Recall score: ${progress.talkScore}/100`;
  return "Evidence forming";
}

function gapAction(day: number, learnerLevel: StudentLevel, progress?: GeographyDayProgress) {
  if (needsRecovery(progress)) {
    return {
      href: `/upsc/geography/revisit?day=${day}`,
      label: "Open recovery",
      detail: "Repair the weak point, then explain it again.",
    };
  }

  return {
    href: getGuidedStudyEntryRoute(learnerLevel, day),
    label: getGuidedStudyEntryLabel(learnerLevel),
    detail:
      learnerLevel === "beginner"
        ? "Start one focused lesson. Discussion and fresh MCQs follow automatically."
        : "Explain the topic once so the portal can diagnose a real UPSC gap.",
  };
}

export function useGeographyStudentOverview() {
  const { progress, isLoaded, stats } = useGeographyProgress();

  return useMemo(() => {
    const learnerLevel = readStudentProfile()?.level ?? "beginner";
    const urgentRecovery = geographySessions.find((session) => needsRecovery(progress[String(session.day)]));
    const activeInProgress = geographySessions.find((session) => {
      const dayProgress = progress[String(session.day)];
      return hasStarted(dayProgress) && !hasCommand(dayProgress);
    });
    const firstIncomplete = geographySessions.find((session) => !hasCommand(progress[String(session.day)]));
    const activeSession = urgentRecovery ?? activeInProgress ?? firstIncomplete ?? geographySessions[geographySessions.length - 1];
    const activeProgress = progress[String(activeSession.day)];
    const loopState = getGeographyLoopState(activeSession, activeProgress, { isLoaded, learnerLevel });
    const recoverySessions = geographySessions.filter((session) => needsRecovery(progress[String(session.day)]));
    const measuredSessions = geographySessions.filter((session) => hasStarted(progress[String(session.day)]));
    const mcqSessions = geographySessions.filter((session) => progress[String(session.day)]?.mcqCompleted);
    const commandSessions = geographySessions.filter((session) => hasCommand(progress[String(session.day)]));
    const meTimeSessions = geographySessions.filter((session) => progress[String(session.day)]?.meTimeCompletedAt);
    const latestMeTimeMood = meTimeSessions
      .map((session) => progress[String(session.day)]?.meTimeMood)
      .filter((mood): mood is NonNullable<GeographyDayProgress["meTimeMood"]> => Boolean(mood))
      .at(-1);
    const averageMcqScore = mcqSessions.length
      ? Math.round(
          mcqSessions.reduce((sum, session) => sum + (progress[String(session.day)]?.mcqScorePercent ?? 0), 0) /
            mcqSessions.length
        )
      : null;
    const latestTalkScore = measuredSessions
      .map((session) => progress[String(session.day)]?.talkScore)
      .filter((score): score is number => typeof score === "number")
      .at(-1);
    const spacedRevision = stats.spacedRevisionItems[0];
    const revisionSource = urgentRecovery ?? spacedRevision?.source ?? activeSession;
    const revisionDue =
      urgentRecovery
        ? urgentRecovery
        : spacedRevision?.due ??
          geographySessions.find((session) => session.day === Math.min(revisionSource.day + 2, geographySessions.length)) ??
          revisionSource;
    const gapSessions = recoverySessions.length ? recoverySessions : [activeSession];

    return {
      isLoaded,
      activeSession,
      activeProgress,
      loopState,
      hasUrgentRecovery: Boolean(urgentRecovery),
      revisionSource,
      revisionDue,
      revisionHref: `/upsc/geography/revisit?day=${revisionSource.day}`,
      gapRows: gapSessions.slice(0, 4).map((session) => {
        const dayProgress = progress[String(session.day)];
        return {
          day: session.day,
          topic: session.title,
          status: gapStatus(dayProgress),
          ...gapAction(session.day, learnerLevel, dayProgress),
        };
      }),
      metrics: {
        startedCount: measuredSessions.length,
        watchedCount: stats.watchedCount,
        commandCount: commandSessions.length,
        revisitCount: recoverySessions.length,
        mcqCompletedCount: mcqSessions.length,
        averageMcqScore,
        latestTalkScore,
        meTimeCount: meTimeSessions.length,
        latestMeTimeMood,
      },
    };
  }, [isLoaded, progress, stats]);
}
