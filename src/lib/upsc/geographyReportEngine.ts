import { geographyCurrentAffairsBridge } from "@/lib/upsc/currentAffairsBridge";
import { geographySessions } from "@/lib/upsc/plan";
import type { GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";

export type GeographyProgressInput = Record<string, GeographyDayProgress | undefined>;

export type GeographyReportWindow = {
  id: string;
  title: string;
  range: string;
  totalDays: number;
  startedDays: number;
  watchedDays: number;
  recallAttempts: number;
  averageRecall: number | null;
  mcqSets: number;
  averageMcq: number | null;
  recoveryItems: number;
  meTimeChecks: number;
  currentAffairsUnlocked: number;
  initialKnownPercent: number | null;
  currentMasteryPercent: number | null;
  gapFilledPercent: number | null;
  remainingGapPercent: number | null;
  verdict: string;
  nextAction: string;
};

export type GeographyGrowthScale = {
  startedFrom: string;
  currentPosition: string;
  growthPercent: number;
  strongestSignal: string;
  weakestSignal: string;
};

export type GeographyReportSnapshot = {
  monthly: GeographyReportWindow;
  weekly: GeographyReportWindow[];
  growth: GeographyGrowthScale;
  evidenceStreams: Array<{ label: string; value: string; detail: string }>;
};

function dayProgress(progress: GeographyProgressInput, day: number) {
  return progress[String(day)];
}

function hasStarted(progress?: GeographyDayProgress) {
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
      progress?.mcqAttempted ||
      progress?.meTimeCompletedAt
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

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function moduleGrowthValues(dayStates: Array<GeographyDayProgress | undefined>) {
  const moduleStates = dayStates.flatMap((state) => Object.values(state?.moduleProgress ?? {}));
  const initialKnown = moduleStates
    .map((state) => state.initialKnownPercent)
    .filter((value): value is number => typeof value === "number");
  const currentMastery = moduleStates
    .map((state) => state.currentMasteryPercent)
    .filter((value): value is number => typeof value === "number");
  const gapFilled = moduleStates
    .map((state) => state.gapFilledPercent)
    .filter((value): value is number => typeof value === "number");
  const remainingGap = moduleStates
    .map((state) => state.remainingGapPercent)
    .filter((value): value is number => typeof value === "number");

  return {
    initialKnownPercent: average(initialKnown),
    currentMasteryPercent: average(currentMastery),
    gapFilledPercent: average(gapFilled),
    remainingGapPercent: average(remainingGap),
  };
}

function currentAffairsUnlockedCount(progress: GeographyProgressInput, daySet: Set<number>) {
  return geographyCurrentAffairsBridge.filter((item) => daySet.has(item.linkedDay) && hasStarted(dayProgress(progress, item.linkedDay))).length;
}

function buildWindowReport(id: string, title: string, sessions: typeof geographySessions, progress: GeographyProgressInput): GeographyReportWindow {
  const daySet = new Set(sessions.map((session) => session.day));
  const dayStates = sessions.map((session) => dayProgress(progress, session.day));
  const startedDays = dayStates.filter(hasStarted).length;
  const watchedDays = dayStates.filter((state) => state?.watched).length;
  const recallScores = dayStates
    .map((state) => state?.talkScore)
    .filter((score): score is number => typeof score === "number");
  const mcqScores = dayStates
    .map((state) => state?.mcqScorePercent)
    .filter((score): score is number => typeof score === "number");
  const recoveryItems = dayStates.filter(needsRecovery).length;
  const meTimeChecks = dayStates.filter((state) => state?.meTimeCompletedAt).length;
  const averageRecall = average(recallScores);
  const averageMcq = average(mcqScores);
  const moduleGrowth = moduleGrowthValues(dayStates);
  const currentAffairsUnlocked = currentAffairsUnlockedCount(progress, daySet);
  const range = sessions.length
    ? `Day ${sessions[0].day}-${sessions[sessions.length - 1].day}`
    : "No days";
  const completionRatio = sessions.length ? startedDays / sessions.length : 0;
  const verdict =
    startedDays === 0
      ? "No learning evidence yet"
      : recoveryItems > 0
        ? "Repair weak points before adding load"
        : completionRatio >= 0.7
          ? "Healthy command movement"
          : "Evidence is forming";
  const nextAction =
    recoveryItems > 0
      ? "Open the recovery queue and clear one weak point."
      : startedDays === 0
        ? "Start today's Geography task to generate the first report row."
        : averageRecall !== null && averageRecall < 95
          ? "Use Talk room once more to push recall toward 95 percent."
          : "Continue the next scheduled topic and keep the start check saved.";

  return {
    id,
    title,
    range,
    totalDays: sessions.length,
    startedDays,
    watchedDays,
    recallAttempts: recallScores.length,
    averageRecall,
    mcqSets: dayStates.filter((state) => state?.mcqCompleted).length,
    averageMcq,
    recoveryItems,
    meTimeChecks,
    currentAffairsUnlocked,
    ...moduleGrowth,
    verdict,
    nextAction,
  };
}

function resolveGrowthScale(monthly: GeographyReportWindow, weekly: GeographyReportWindow[]): GeographyGrowthScale {
  const activeWeek = weekly.find((week) => week.startedDays > 0);
  const latestWeek = [...weekly].reverse().find((week) => week.startedDays > 0);
  const growthPercent = monthly.totalDays ? Math.round((monthly.startedDays / monthly.totalDays) * 100) : 0;
  const strongestSignal =
    monthly.gapFilledPercent !== null && monthly.gapFilledPercent > 0
      ? `Gap filled ${monthly.gapFilledPercent}%`
      : monthly.averageRecall !== null && monthly.averageRecall >= 95
      ? "Recall command"
      : monthly.mcqSets > 0
        ? "Practice evidence"
        : monthly.watchedDays > 0
          ? "Lesson consistency"
          : monthly.meTimeChecks > 0
            ? "Session readiness"
            : "Baseline pending";
  const weakestSignal =
    monthly.remainingGapPercent !== null && monthly.remainingGapPercent > 0
      ? `Remaining gap ${monthly.remainingGapPercent}%`
      : monthly.recoveryItems > 0
      ? "Recovery queue"
      : monthly.recallAttempts === 0
        ? "Recall not measured"
        : monthly.mcqSets === 0
          ? "MCQ evidence missing"
          : "Current affairs depth";

  return {
    startedFrom: activeWeek ? `${activeWeek.title}: ${activeWeek.startedDays}/${activeWeek.totalDays} days started` : "No Geography evidence yet",
    currentPosition: latestWeek ? `${latestWeek.title}: ${latestWeek.verdict}` : "Start the first topic to create a baseline",
    growthPercent,
    strongestSignal,
    weakestSignal,
  };
}

export function buildGeographyReportSnapshot(progress: GeographyProgressInput): GeographyReportSnapshot {
  const weekly = [1, 2, 3, 4].map((weekNumber) => {
    const sessions = geographySessions.filter((session) => session.week === weekNumber);
    return buildWindowReport(`week-${weekNumber}`, `Week ${weekNumber}`, sessions, progress);
  });
  const monthly = buildWindowReport("month-geography", "Geography monthly report", geographySessions, progress);
  const growth = resolveGrowthScale(monthly, weekly);

  return {
    monthly,
    weekly,
    growth,
    evidenceStreams: [
      {
        label: "Known First",
        value: monthly.initialKnownPercent === null ? "Not measured" : `${monthly.initialKnownPercent}%`,
        detail: "First module recall baseline from student speech",
      },
      {
        label: "Gap Filled",
        value: monthly.gapFilledPercent === null ? "Not measured" : `${monthly.gapFilledPercent}%`,
        detail:
          monthly.remainingGapPercent === null
            ? "Module section recall has not generated a gap ledger yet"
            : `${monthly.remainingGapPercent}% gap still needs repair`,
      },
      {
        label: "Recall",
        value: monthly.averageRecall === null ? "Not measured" : `${monthly.averageRecall}/100`,
        detail: `${monthly.recallAttempts} Talk attempt${monthly.recallAttempts === 1 ? "" : "s"} recorded`,
      },
      {
        label: "MCQ",
        value: monthly.averageMcq === null ? "No score" : `${monthly.averageMcq}%`,
        detail: `${monthly.mcqSets} completed MCQ set${monthly.mcqSets === 1 ? "" : "s"}`,
      },
      {
        label: "Revision",
        value: `${monthly.recoveryItems} active`,
        detail: "Only measured weak points enter the queue",
      },
      {
        label: "Me-time",
        value: `${monthly.meTimeChecks} saved`,
        detail: "Session readiness checks are included in the report",
      },
    ],
  };
}
