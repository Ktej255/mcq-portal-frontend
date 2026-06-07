import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";
import { SUBJECT_RECALL_TARGET } from "@/lib/upsc/subjectLearning";
import type { StudentLevel } from "@/lib/upsc/studentProfile";

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
  return score >= SUBJECT_RECALL_TARGET;
}

export function isSubjectPreRepairTalkAssessment(progress?: SubjectDayProgress) {
  return Boolean(progress?.talkNextRoute?.includes("/watch"));
}

export function isSubjectRevisitRequired(progress?: SubjectDayProgress) {
  const revisitSignal =
    progress?.talkUnlockStage === "revisit" ||
    progress?.talkBand === "Revisit" ||
    progress?.talkUnlockStage === "retry";

  return Boolean(progress?.revisitQueued) || (!isSubjectPreRepairTalkAssessment(progress) && revisitSignal);
}

export function getSubjectLearningGate(
  plan: SubjectSprintPlan,
  session: SubjectSession,
  progress?: SubjectDayProgress,
  learnerLevel: StudentLevel = "intermediate"
): SubjectLearningGate {
  const basePath = `/upsc/${plan.slug}`;
  const activeLab = plan.labs.find((lab) => lab.title === session.lab) ?? plan.labs[0];
  const watchCompletion = getSubjectWatchCompletion(progress);
  const labProofCompletion = getSubjectLabProofCompletion(progress);
  const hasTalkAssessment = typeof progress?.talkScore === "number";
  const revisitRequired = isSubjectRevisitRequired(progress);

  if (!hasTalkAssessment) {
    if (learnerLevel === "beginner" && !watchCompletion.complete) {
      return {
        id: "watch",
        label: "Start lesson",
        detail: "Beginner path: watch one 10-15 minute topic first",
        href: `${basePath}/watch?day=${session.day}`,
        actionLabel: "Open lesson",
        tone: "border-[#dcd5c7] bg-[#fffdf8] text-[#746f66]",
      };
    }

    return {
      id: "talk",
      label: watchCompletion.complete ? "Talk pending" : "Recall first",
      detail: watchCompletion.complete
        ? `Discuss until recall reaches ${SUBJECT_RECALL_TARGET}%`
        : "Answer before content so the AI can diagnose the exact gap",
      href: `${basePath}/talk?day=${session.day}`,
      actionLabel: watchCompletion.complete ? "Open AI teacher" : "Start recall",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    };
  }

  if (!watchCompletion.complete && (learnerLevel === "beginner" || !isSubjectTalkReadyForMcq(progress))) {
    return {
      id: "watch",
      label: learnerLevel === "beginner" ? "Finish lesson" : "Watch the exact gap",
      detail:
        learnerLevel === "beginner"
          ? `${watchCompletion.completed}/${watchCompletion.target} scenes complete before Talk`
          : `Recall ${progress?.talkScore ?? 0}% saved; ${watchCompletion.completed}/${watchCompletion.target} repair scenes`,
      href: `${basePath}/watch?day=${session.day}`,
      actionLabel: learnerLevel === "beginner" ? "Open lesson" : "Open repair",
      tone: "border-[#dcd5c7] bg-[#fffdf8] text-[#746f66]",
    };
  }

  if (revisitRequired) {
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

  if (!isSubjectTalkReadyForMcq(progress)) {
    return {
      id: "lab",
      label: "Recall support",
      detail: `Score ${progress?.talkScore ?? 0}%; target ${SUBJECT_RECALL_TARGET}%`,
      href: `${basePath}/lab?mode=${progress?.labMode ?? activeLab?.slug ?? ""}&day=${session.day}`,
      actionLabel: "Use visual support",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    };
  }

  return {
    id: "mcq",
    label: "Fresh practice open",
    detail: labProofCompletion.complete
      ? "Recall target and optional visual proof are complete"
      : "Recall target reached; visual proof remains optional",
    href: `${basePath}/mcq-readiness?day=${session.day}`,
    actionLabel: "Open practice",
    tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
  };
}
