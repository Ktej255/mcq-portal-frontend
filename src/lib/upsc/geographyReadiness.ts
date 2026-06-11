import { labSlugForGeographySession } from "@/lib/upsc/geographyLearning";
import { getGeographyLoopState, type GeographyLoopState } from "@/lib/upsc/geographyLoopState";
import { GEOGRAPHY_RECALL_TARGET } from "@/lib/upsc/guidedStudy";
import { getGeographyBatchCode } from "@/lib/upsc/mcqContract";
import { readMcqCommandBatchState } from "@/lib/upsc/mcqDraftBank";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import type { GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";
import type { StudentLevel } from "@/lib/upsc/studentProfile";

export type GeographyReadinessStageId = "watch" | "talk" | "revisit" | "lab" | "mcq";
export type GeographyReadinessStageStatus = "complete" | "active" | "blocked" | "waiting";

export type GeographyReadinessStage = {
  id: GeographyReadinessStageId;
  label: string;
  status: GeographyReadinessStageStatus;
  href: string;
  detail: string;
};

export type GeographyDayReadiness = {
  session: GeographySession;
  progress?: GeographyDayProgress;
  nextState: GeographyLoopState;
  score: number;
  label: string;
  detail: string;
  stages: GeographyReadinessStage[];
  watchComplete: boolean;
  talkClear: boolean;
  revisitNeeded: boolean;
  recoveryComplete: boolean;
  labComplete: boolean;
  mcqCommand: boolean;
  mcqDrafted: number;
  mcqPlanned: number;
};

export type GeographyReadinessSnapshot = {
  days: GeographyDayReadiness[];
  score: number;
  label: string;
  detail: string;
  stageCounts: Record<GeographyReadinessStageId, number>;
  blockedCount: number;
  revisitCount: number;
  commandCount: number;
  nextActions: GeographyDayReadiness[];
};

function stageStatus(isComplete: boolean, isActive: boolean, isBlocked: boolean): GeographyReadinessStageStatus {
  if (isComplete) return "complete";
  if (isActive) return "active";
  if (isBlocked) return "blocked";
  return "waiting";
}

function readinessLabel(score: number, nextState: GeographyLoopState, mcqCommand: boolean) {
  if (mcqCommand && score >= 95) return "Command ready";
  if (nextState.room === "revisit") return "Recovery due";
  if (nextState.room === "talk") return "Recall pending";
  if (nextState.room === "watch") return "Class repair pending";
  if (nextState.room === "mcq") return "Practice phase";
  return "Reading local status";
}

function nextActionPriority(day: GeographyDayReadiness) {
  const roomPriority: Record<string, number> = {
    revisit: 1,
    talk: 2,
    watch: 3,
    lab: 4,
    mcq: 5,
    loading: 9,
  };

  return roomPriority[day.nextState.room] ?? 8;
}

export function getGeographyDayReadiness(
  session: GeographySession,
  progress?: GeographyDayProgress,
  options: { isLoaded?: boolean; labSlug?: string; learnerLevel?: StudentLevel } = {}
): GeographyDayReadiness {
  const nextState = getGeographyLoopState(session, progress, options);
  const watchProofCount = Math.min(progress?.watchSceneCompletedIds?.length ?? (progress?.watched ? 5 : 0), 5);
  const labProofCount = Math.min(progress?.labProofCompletedIds?.length ?? (progress?.labCompleted ? 5 : 0), 5);
  const batchState = readMcqCommandBatchState(getGeographyBatchCode(session));
  const mcqDrafted = batchState?.drafted ?? 0;
  const mcqPlanned = batchState?.planned ?? 25;
  const watchComplete = Boolean(progress?.watched) && watchProofCount >= 5;
  const revisitNeeded = Boolean(progress?.revisitQueued || progress?.talkBand === "Revisit");
  const talkClear =
    !revisitNeeded &&
    (typeof progress?.talkScore === "number" ? progress.talkScore >= GEOGRAPHY_RECALL_TARGET : progress?.talkBand === "Command");
  const recoveryComplete = Boolean(progress?.recoveryCompleted && !revisitNeeded) || Boolean(watchComplete && !revisitNeeded && progress?.talkScore);
  const labComplete = Boolean(progress?.labCompleted) && labProofCount >= 5;
  const mcqCommand =
    !revisitNeeded &&
    (progress?.mcqOutcome === "Command" ||
      Boolean(progress?.mcqCompleted && typeof progress?.mcqScorePercent === "number" && progress.mcqScorePercent >= 70));
  const talkPartial =
    typeof progress?.talkScore === "number"
      ? Math.min(48, Math.round((progress.talkScore / GEOGRAPHY_RECALL_TARGET) * 50))
      : 0;
  const mcqPoints = mcqCommand ? 50 : progress?.mcqCompleted ? 30 : batchState?.status === "READY" ? 15 : mcqDrafted > 0 ? 8 : 0;
  const score = Math.min(
    100,
    (talkClear ? 50 : talkPartial) +
      mcqPoints
  );

  const stages: GeographyReadinessStage[] = [
    {
      id: "talk",
      label: "Talk",
      status: stageStatus(talkClear, nextState.room === "talk", revisitNeeded),
      href: `/upsc/geography/talk?day=${session.day}`,
      detail: typeof progress?.talkScore === "number" ? `${progress.talkScore}/100 oral score` : "AI teacher check",
    },
    {
      id: "watch",
      label: "Watch",
      status: stageStatus(watchComplete, nextState.room === "watch", !talkClear || revisitNeeded),
      href: `/upsc/geography/watch?day=${session.day}`,
      detail: `${watchProofCount}/5 scene proofs`,
    },
    {
      id: "lab",
      label: "Visual Lab (optional)",
      status: stageStatus(labComplete, nextState.room === "lab", false),
      href: `/upsc/geography/lab?mode=${options.labSlug ?? progress?.labMode ?? labSlugForGeographySession(session.lab)}&day=${session.day}`,
      detail: `${labProofCount}/5 optional visual activities`,
    },
    {
      id: "mcq",
      label: "Practice",
      status: stageStatus(mcqCommand, nextState.room === "mcq", !talkClear || revisitNeeded),
      href: `/upsc/geography/mcq-readiness?day=${session.day}`,
      detail: progress?.mcqCompleted
        ? `${progress.mcqCorrectCount ?? 0}/${progress.mcqTotal ?? mcqPlanned} correct`
        : batchState?.status === "READY"
          ? "Reviewed practice is ready"
          : "Reviewed practice is being prepared",
    },
    {
      id: "revisit",
      label: "Revisit",
      status: stageStatus(recoveryComplete, nextState.room === "revisit", false),
      href: `/upsc/geography/revisit?day=${session.day}`,
      detail: revisitNeeded ? progress?.recoveryDiagnosisSummary ?? "Weak concept repair required" : "No active recovery",
    },
  ];

  return {
    session,
    progress,
    nextState,
    score,
    label: readinessLabel(score, nextState, mcqCommand),
    detail: mcqCommand
      ? "All local gates are strong enough for command review."
      : nextState.detail,
    stages,
    watchComplete,
    talkClear,
    revisitNeeded,
    recoveryComplete,
    labComplete,
    mcqCommand,
    mcqDrafted,
    mcqPlanned,
  };
}

export function buildGeographyReadinessSnapshot(
  progressMap: Record<string, GeographyDayProgress>,
  options: { isLoaded?: boolean; learnerLevel?: StudentLevel } = {}
): GeographyReadinessSnapshot {
  const days = geographySessions.map((session) =>
    getGeographyDayReadiness(session, progressMap[String(session.day)], {
      isLoaded: options.isLoaded,
      learnerLevel: options.learnerLevel,
    })
  );
  const score = Math.round(days.reduce((sum, day) => sum + day.score, 0) / geographySessions.length);
  const stageCounts = days.reduce<Record<GeographyReadinessStageId, number>>(
    (counts, day) => {
      day.stages.forEach((stage) => {
        if (stage.status === "complete") counts[stage.id] += 1;
      });
      return counts;
    },
    { watch: 0, talk: 0, revisit: 0, lab: 0, mcq: 0 }
  );
  const blockedCount = days.filter((day) => ["watch", "talk", "revisit"].includes(day.nextState.room)).length;
  const revisitCount = days.filter((day) => day.revisitNeeded).length;
  const commandCount = days.filter((day) => day.mcqCommand).length;
  const nextActions = days
    .filter((day) => !day.mcqCommand)
    .sort((first, second) => nextActionPriority(first) - nextActionPriority(second) || first.session.day - second.session.day)
    .slice(0, 6);
  const label = score >= 95 && commandCount === geographySessions.length ? "Geography command ready" : score >= 70 ? "Geography build active" : "Geography build underway";

  return {
    days,
    score,
    label,
    detail:
      score >= 95 && commandCount === geographySessions.length
        ? `All ${geographySessions.length} Geography days have local command proof.`
        : `${blockedCount} days still need a lesson, discussion, or short revision before practice is complete.`,
    stageCounts,
    blockedCount,
    revisitCount,
    commandCount,
    nextActions,
  };
}
