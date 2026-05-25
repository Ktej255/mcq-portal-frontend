import { readMcqCommandBatchState } from "@/lib/upsc/mcqDraftBank";
import {
  getUpscMcqBatchStatus,
  isUpscMcqCommandCleared,
  isUpscMcqPracticeComplete,
  isUpscMcqRevisitOutcome,
} from "@/lib/upsc/mcqCommandStatus";
import { getSubjectBatchCode } from "@/lib/upsc/subjectPlans";
import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import {
  getSubjectLabProofCompletion,
  getSubjectLearningGate,
  getSubjectWatchCompletion,
  isSubjectTalkReadyForLab,
  isSubjectTalkReadyForMcq,
  type SubjectLearningGateId,
} from "@/lib/upsc/subjectProgressGates";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";

export type SubjectReadinessStageId = "watch" | "talk" | "revisit" | "lab" | "mcq";
export type SubjectReadinessStageStatus = "complete" | "active" | "blocked" | "waiting";

export type SubjectReadinessStage = {
  id: SubjectReadinessStageId;
  label: string;
  detail: string;
  status: SubjectReadinessStageStatus;
};

export type SubjectDayReadiness = {
  session: SubjectSession;
  progress?: SubjectDayProgress;
  batchCode: string;
  score: number;
  isCommandReady: boolean;
  learningGateId: SubjectLearningGateId;
  label: string;
  detail: string;
  actionLabel: string;
  href: string;
  tone: string;
  watchComplete: boolean;
  talkLabReady: boolean;
  talkMcqReady: boolean;
  revisitNeeded: boolean;
  labComplete: boolean;
  batchReady: boolean;
  batchDrafted: number;
  batchPlanned: number;
  mcqPracticeComplete: boolean;
  mcqPracticeCommand: boolean;
  stages: SubjectReadinessStage[];
};

export type SubjectReadinessSnapshot = {
  subjectTitle: string;
  totalDays: number;
  score: number;
  commandReadyCount: number;
  blockedCount: number;
  stageCounts: Record<SubjectReadinessStageId, number>;
  days: SubjectDayReadiness[];
  nextActions: SubjectDayReadiness[];
};

const gatePriority: Record<SubjectLearningGateId, number> = {
  revisit: 0,
  watch: 1,
  talk: 2,
  lab: 3,
  mcq: 4,
};

function stageStatus(isComplete: boolean, isActive: boolean, isBlocked = false): SubjectReadinessStageStatus {
  if (isComplete) return "complete";
  if (isBlocked) return "blocked";
  if (isActive) return "active";
  return "waiting";
}

function scoreForDay({
  watchComplete,
  talkLabReady,
  talkMcqReady,
  revisitNeeded,
  labComplete,
  batchReady,
  batchDrafted,
  batchPlanned,
  mcqPracticeComplete,
  mcqPracticeCommand,
  progress,
}: {
  watchComplete: boolean;
  talkLabReady: boolean;
  talkMcqReady: boolean;
  revisitNeeded: boolean;
  labComplete: boolean;
  batchReady: boolean;
  batchDrafted: number;
  batchPlanned: number;
  mcqPracticeComplete: boolean;
  mcqPracticeCommand: boolean;
  progress?: SubjectDayProgress;
}) {
  const talkScore = progress?.talkScore ?? 0;
  const watchScore = watchComplete ? 15 : 0;
  const talkGateScore = talkMcqReady ? 30 : talkLabReady ? 20 : talkScore > 0 ? 8 : 0;
  const revisitScore = !revisitNeeded && watchComplete && talkScore > 0 ? 10 : 0;
  const labScore = labComplete ? 20 : 0;
  const draftRatio = batchPlanned > 0 ? Math.min(1, batchDrafted / batchPlanned) : 0;
  const mcqScore = mcqPracticeCommand
    ? 25
    : mcqPracticeComplete
      ? 15
      : batchReady
        ? 10
        : Math.round(draftRatio * 8);

  return Math.min(100, watchScore + talkGateScore + revisitScore + labScore + mcqScore);
}

export function getSubjectDayReadiness(
  plan: SubjectSprintPlan,
  session: SubjectSession,
  progress?: SubjectDayProgress
): SubjectDayReadiness {
  const basePath = `/upsc/${plan.slug}`;
  const learningGate = getSubjectLearningGate(plan, session, progress);
  const watchCompletion = getSubjectWatchCompletion(progress);
  const labCompletion = getSubjectLabProofCompletion(progress);
  const batchCode = getSubjectBatchCode(plan.slug, session.day);
  const batchState = readMcqCommandBatchState(batchCode);
  const batchStatus = getUpscMcqBatchStatus(batchState);
  const batchPlanned = batchStatus.planned;
  const batchDrafted = batchStatus.drafted;
  const batchReady = batchStatus.ready;
  const mcqPracticeComplete = isUpscMcqPracticeComplete(progress, batchCode);
  const mcqPracticeCommand = isUpscMcqCommandCleared(progress, batchCode);
  const watchComplete = watchCompletion.complete;
  const talkLabReady = isSubjectTalkReadyForLab(progress);
  const talkMcqReady = isSubjectTalkReadyForMcq(progress);
  const revisitNeeded =
    Boolean(progress?.revisitQueued) ||
    progress?.talkUnlockStage === "revisit" ||
    progress?.talkBand === "Revisit" ||
    isUpscMcqRevisitOutcome(progress, batchCode);
  const labComplete = labCompletion.complete;
  const isCommandReady = watchComplete && talkMcqReady && !revisitNeeded && labComplete && batchReady && mcqPracticeCommand;
  const score = scoreForDay({
    watchComplete,
    talkLabReady,
    talkMcqReady,
    revisitNeeded,
    labComplete,
    batchReady,
    batchDrafted,
    batchPlanned,
    mcqPracticeComplete,
    mcqPracticeCommand,
    progress,
  });

  const label = isCommandReady
    ? "Command ready"
    : learningGate.id === "mcq" && batchReady && progress?.mcqAttempted && !mcqPracticeComplete
      ? "Finish MCQ practice"
      : learningGate.id === "mcq" && batchReady
        ? "MCQ practice needed"
        : learningGate.id === "mcq" && batchDrafted > 0
          ? "MCQ drafting"
          : learningGate.id === "mcq"
            ? "Fresh MCQ needed"
            : learningGate.label;
  const detail = isCommandReady
    ? `MCQ command ${progress?.mcqScorePercent ?? 0}% from ${batchCode}`
    : learningGate.id === "mcq"
      ? batchReady
        ? progress?.mcqAttempted
          ? `${progress.mcqAnsweredCount ?? 0}/${progress.mcqTotal ?? 0} MCQs answered`
          : `${batchDrafted}/${batchPlanned} fresh MCQs ready; practice pending`
        : `${batchDrafted}/${batchPlanned} fresh MCQs drafted`
      : learningGate.detail;
  const href = isCommandReady ? `${basePath}/track?day=${session.day}` : learningGate.href;
  const actionLabel = isCommandReady
    ? "Track command"
    : learningGate.id === "mcq" && batchReady
      ? "Run MCQ practice"
      : learningGate.id === "mcq" && batchDrafted > 0
        ? "Continue authoring"
        : learningGate.actionLabel;
  const tone = isCommandReady ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : learningGate.tone;
  const talkActive = watchComplete && !revisitNeeded && !talkMcqReady;
  const labActive = talkLabReady && !revisitNeeded && !labComplete;
  const mcqActive = talkMcqReady && labComplete && (!batchReady || !mcqPracticeCommand);
  const mcqDetail = mcqPracticeCommand
    ? `Command ${progress?.mcqScorePercent ?? 0}%`
    : mcqPracticeComplete
      ? `${progress?.mcqCorrectCount ?? 0}/${progress?.mcqTotal ?? 0} correct, revisit`
      : progress?.mcqAttempted
        ? `${progress.mcqAnsweredCount ?? 0}/${progress.mcqTotal ?? 0} answered`
        : batchReady
          ? "Practice pending"
          : `${batchDrafted}/${batchPlanned} fresh`;

  return {
    session,
    progress,
    batchCode,
    score,
    isCommandReady,
    learningGateId: learningGate.id,
    label,
    detail,
    actionLabel,
    href,
    tone,
    watchComplete,
    talkLabReady,
    talkMcqReady,
    revisitNeeded,
    labComplete,
    batchReady,
    batchDrafted,
    batchPlanned,
    mcqPracticeComplete,
    mcqPracticeCommand,
    stages: [
      {
        id: "watch",
        label: "Watch",
        detail: `${watchCompletion.completed}/${watchCompletion.target} scenes`,
        status: stageStatus(watchComplete, learningGate.id === "watch"),
      },
      {
        id: "talk",
        label: "Talk",
        detail: typeof progress?.talkScore === "number" ? `${progress.talkScore}% oral score` : "AI teacher check",
        status: stageStatus(talkMcqReady, talkActive, revisitNeeded),
      },
      {
        id: "revisit",
        label: "Revisit",
        detail: revisitNeeded ? "Repair required" : "No active recovery",
        status: stageStatus(!revisitNeeded && watchComplete && Boolean(progress?.talkScore), revisitNeeded),
      },
      {
        id: "lab",
        label: "Lab",
        detail: `${labCompletion.completed}/${labCompletion.target} proofs`,
        status: stageStatus(labComplete, labActive, revisitNeeded || !talkLabReady),
      },
      {
        id: "mcq",
        label: "MCQ",
        detail: mcqDetail,
        status: stageStatus(mcqPracticeCommand, mcqActive, revisitNeeded || !talkMcqReady || !labComplete),
      },
    ],
  };
}

export function buildSubjectReadinessSnapshot(
  plan: SubjectSprintPlan,
  progressMap: Record<string, SubjectDayProgress>
): SubjectReadinessSnapshot {
  const days = plan.sessions.map((session) =>
    getSubjectDayReadiness(plan, session, progressMap[String(session.day)])
  );
  const totalDays = days.length || 1;
  const score = Math.round(days.reduce((sum, day) => sum + day.score, 0) / totalDays);
  const commandReadyCount = days.filter((day) => day.isCommandReady).length;
  const blockedCount = days.filter((day) => !day.isCommandReady && day.learningGateId !== "mcq").length;
  const stageCounts = days.reduce<Record<SubjectReadinessStageId, number>>(
    (counts, day) => {
      day.stages.forEach((stage) => {
        if (stage.status === "complete") counts[stage.id] += 1;
      });
      return counts;
    },
    { watch: 0, talk: 0, revisit: 0, lab: 0, mcq: 0 }
  );
  const nextActions = days
    .filter((day) => !day.isCommandReady)
    .sort((a, b) => gatePriority[a.learningGateId] - gatePriority[b.learningGateId] || a.session.day - b.session.day)
    .slice(0, 6);

  return {
    subjectTitle: plan.title,
    totalDays,
    score,
    commandReadyCount,
    blockedCount,
    stageCounts,
    days,
    nextActions,
  };
}
