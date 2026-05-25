import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";

export const SUBJECT_WATCH_SCENE_TARGET = 5;
export const SUBJECT_LAB_PROOF_TARGET = 5;

export type SubjectLearningGateId = "watch" | "revisit" | "talk" | "lab" | "mcq";

export type SubjectLearningGate = {
  id: SubjectLearningGateId;
  label: string;
  detail: string;
  href: string;
  actionLabel: string;
  tone: string;
};

export function getSubjectWatchCompletion(progress?: SubjectDayProgress) {
  const completed = progress?.watchSceneCompletedIds?.length ?? (progress?.watched ? SUBJECT_WATCH_SCENE_TARGET : 0);
  return {
    completed: Math.min(completed, SUBJECT_WATCH_SCENE_TARGET),
    target: SUBJECT_WATCH_SCENE_TARGET,
    complete: Boolean(progress?.watched) && completed >= SUBJECT_WATCH_SCENE_TARGET,
  };
}

export function getSubjectLabProofCompletion(progress?: SubjectDayProgress) {
  const completed = progress?.labProofCompletedIds?.length ?? 0;
  return {
    completed: Math.min(completed, SUBJECT_LAB_PROOF_TARGET),
    target: SUBJECT_LAB_PROOF_TARGET,
    complete: Boolean(progress?.labCompleted) && completed >= SUBJECT_LAB_PROOF_TARGET,
  };
}

export function isSubjectTalkReadyForLab(progress?: SubjectDayProgress) {
  const score = progress?.talkScore ?? 0;
  return progress?.talkUnlockStage === "lab" || progress?.talkUnlockStage === "mcq" || score >= 70;
}

export function isSubjectTalkReadyForMcq(progress?: SubjectDayProgress) {
  const score = progress?.talkScore ?? 0;
  return progress?.talkUnlockStage === "mcq" || progress?.talkBand === "Command" || score >= 85;
}

export function getSubjectLearningGate(
  plan: SubjectSprintPlan,
  session: SubjectSession,
  progress?: SubjectDayProgress
): SubjectLearningGate {
  const basePath = `/upsc/${plan.slug}`;
  const activeLab = plan.labs.find((lab) => lab.title === session.lab) ?? plan.labs[0];
  const watchCompletion = getSubjectWatchCompletion(progress);
  const labProofCompletion = getSubjectLabProofCompletion(progress);

  if (!watchCompletion.complete) {
    return {
      id: "watch",
      label: "Watch pending",
      detail: `${watchCompletion.completed}/${watchCompletion.target} scenes`,
      href: `${basePath}/watch?day=${session.day}`,
      actionLabel: "Open class",
      tone: "border-[#dcd5c7] bg-[#fffdf8] text-[#746f66]",
    };
  }

  if (progress?.revisitQueued || progress?.talkUnlockStage === "revisit" || progress?.talkBand === "Revisit") {
    return {
      id: "revisit",
      label: "Revisit required",
      detail: "Repair first",
      href: `${basePath}/revisit?day=${session.day}`,
      actionLabel: "Open revisit",
      tone: "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
    };
  }

  if (!isSubjectTalkReadyForLab(progress)) {
    return {
      id: "talk",
      label: progress?.talkScore ? "Talk retry required" : "Talk pending",
      detail: progress?.talkScore ? `Score ${progress.talkScore}%` : "AI teacher check",
      href: `${basePath}/talk?day=${session.day}`,
      actionLabel: "Open AI teacher",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    };
  }

  if (!labProofCompletion.complete) {
    return {
      id: "lab",
      label: "Lab proof pending",
      detail: `${labProofCompletion.completed}/${labProofCompletion.target} proofs`,
      href: `${basePath}/lab?mode=${progress?.labMode ?? activeLab?.slug ?? ""}&day=${session.day}`,
      actionLabel: "Open visual lab",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    };
  }

  if (!isSubjectTalkReadyForMcq(progress)) {
    return {
      id: "talk",
      label: "Talk command needed",
      detail: `Score ${progress?.talkScore ?? 0}%`,
      href: `${basePath}/talk?day=${session.day}`,
      actionLabel: "Retry oral check",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    };
  }

  return {
    id: "mcq",
    label: "MCQ readiness open",
    detail: "Author fresh batch",
    href: `${basePath}/mcq-readiness?day=${session.day}`,
    actionLabel: "Open MCQ readiness",
    tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
  };
}
