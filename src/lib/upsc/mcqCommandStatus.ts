import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";

export const UPSC_MCQ_COMMAND_SCORE = 70;

export type UpscMcqBatchLike = {
  planned?: number;
  drafted?: number;
  status?: "DRAFT" | "READY";
};

export function getUpscMcqBatchStatus(state?: UpscMcqBatchLike | null) {
  const planned = Math.max(1, state?.planned ?? 25);
  const drafted = Math.max(0, state?.drafted ?? 0);

  return {
    planned,
    drafted,
    ready: state?.status === "READY" && drafted >= planned,
  };
}

export function isUpscMcqPracticeComplete(progress: SubjectDayProgress | undefined, batchCode: string) {
  return Boolean(progress?.mcqCompleted && progress.mcqLastBatchCode === batchCode);
}

export function isUpscMcqCommandCleared(progress: SubjectDayProgress | undefined, batchCode: string) {
  return (
    isUpscMcqPracticeComplete(progress, batchCode) &&
    progress?.mcqOutcome === "Command" &&
    (progress.mcqScorePercent ?? 0) >= UPSC_MCQ_COMMAND_SCORE
  );
}

export function isUpscMcqRevisitOutcome(progress: SubjectDayProgress | undefined, batchCode?: string) {
  if (!progress || progress.mcqOutcome !== "Revisit") return false;
  return batchCode ? progress.mcqLastBatchCode === batchCode : true;
}
