import { labSlugForGeographySession } from "@/lib/upsc/geographyLearning";
import { getGeographyBatchCode } from "@/lib/upsc/mcqContract";
import { readMcqCommandBatchState } from "@/lib/upsc/mcqDraftBank";
import type { GeographySession } from "@/lib/upsc/plan";
import type { GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";

export type GeographyLoopRoom = "watch" | "talk" | "revisit" | "lab" | "mcq" | "loading";

export type GeographyLoopStateLabel =
  | "Loading local status"
  | "Watch pending"
  | "Talk pending"
  | "Revisit required"
  | "Lab pending"
  | "Fresh MCQ needed"
  | "MCQ drafting"
  | "MCQ batch ready"
  | "MCQ practice active"
  | "MCQ practice done";

export type GeographyLoopState = {
  label: GeographyLoopStateLabel;
  detail: string;
  shortDetail: string;
  href: string;
  cta: string;
  room: GeographyLoopRoom;
  tone: string;
};

export function hasGeographyTalkClearance(progress?: GeographyDayProgress) {
  if (typeof progress?.talkScore === "number") return progress.talkScore >= 70;
  return progress?.talkBand === "Command";
}

export function getGeographyLoopState(
  session: GeographySession,
  progress?: GeographyDayProgress,
  options: { isLoaded?: boolean; labSlug?: string } = {}
): GeographyLoopState {
  const isLoaded = options.isLoaded ?? true;
  const labSlug = options.labSlug ?? progress?.labMode ?? labSlugForGeographySession(session.lab);
  const labProofCount = Math.min(progress?.labProofCompletedIds?.length ?? (progress?.labCompleted ? 5 : 0), 5);

  if (!isLoaded) {
    return {
      label: "Loading local status",
      detail: "Reading this day's Watch, Talk, Lab, and MCQ memory from the local browser.",
      shortDetail: "Reading local memory",
      href: `/upsc/geography/watch?day=${session.day}`,
      cta: "Open class",
      room: "loading",
      tone: "border-[#d7d0c0] bg-[#f7f4ee] text-[#5f665f]",
    };
  }

  if (!progress?.watched) {
    return {
      label: "Watch pending",
      detail: "Start with the concept class before discussion, lab, or MCQ practice unlocks.",
      shortDetail: "Start class",
      href: `/upsc/geography/watch?day=${session.day}`,
      cta: "Open class",
      room: "watch",
      tone: "border-[#cde2da] bg-[#e7f5ee] text-[#085041]",
    };
  }

  if (progress.revisitQueued || progress.talkBand === "Revisit") {
    return {
      label: "Revisit required",
      detail: "Repair the weak concept first, then return to the Talk room for a fresh explanation.",
      shortDetail: "Repair first",
      href: `/upsc/geography/revisit?day=${session.day}`,
      cta: "Open recovery",
      room: "revisit",
      tone: "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
    };
  }

  if (!hasGeographyTalkClearance(progress)) {
    return {
      label: "Talk pending",
      detail: "Explain the class to the AI teacher and cross the Practice or Command band.",
      shortDetail: "Oral check",
      href: `/upsc/geography/talk?day=${session.day}`,
      cta: "Open talk room",
      room: "talk",
      tone: "border-[#bdddd3] bg-[#effaf5] text-[#085041]",
    };
  }

  if (!progress.labCompleted || labProofCount < 5) {
    return {
      label: "Lab pending",
      detail: `Save five visual proof stages from the map or simulator before MCQ readiness. Current proof: ${labProofCount}/5.`,
      shortDetail: `${labProofCount}/5 lab proofs`,
      href: `/upsc/geography/lab?mode=${labSlug}&day=${session.day}`,
      cta: "Open visual lab",
      room: "lab",
      tone: "border-[#8db7d8] bg-[#edf7ff] text-[#23406f]",
    };
  }

  const batchState = readMcqCommandBatchState(getGeographyBatchCode(session));
  if (batchState?.status === "READY") {
    if (progress?.mcqCompleted) {
      return {
        label: "MCQ practice done",
        detail: `${progress.mcqCorrectCount ?? 0}/${progress.mcqTotal ?? batchState.planned} correct in local fresh practice.`,
        shortDetail: `${progress.mcqCorrectCount ?? 0}/${progress.mcqTotal ?? batchState.planned} correct`,
        href: `/upsc/geography/mcq-readiness?day=${session.day}`,
        cta: "Review practice",
        room: "mcq",
        tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
      };
    }

    if (progress?.mcqAttempted) {
      return {
        label: "MCQ practice active",
        detail: `${progress.mcqAnsweredCount ?? 0}/${progress.mcqTotal ?? batchState.planned} fresh questions attempted locally.`,
        shortDetail: `${progress.mcqAnsweredCount ?? 0}/${progress.mcqTotal ?? batchState.planned} attempted`,
        href: `/upsc/geography/mcq-readiness?day=${session.day}`,
        cta: "Continue practice",
        room: "mcq",
        tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
      };
    }

    return {
      label: "MCQ batch ready",
      detail: `${batchState.drafted}/${batchState.planned} fresh questions are mapped to this day.`,
      shortDetail: `${batchState.drafted}/${batchState.planned} fresh`,
      href: `/upsc/geography/mcq-readiness?day=${session.day}`,
      cta: "Open practice",
      room: "mcq",
      tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
    };
  }

  if ((batchState?.drafted ?? 0) > 0) {
    return {
      label: "MCQ drafting",
      detail: `${batchState?.drafted ?? 0}/${batchState?.planned ?? 25} fresh questions are drafted locally.`,
      shortDetail: `${batchState?.drafted ?? 0}/${batchState?.planned ?? 25} fresh`,
      href: `/upsc/geography/mcq-readiness?day=${session.day}`,
      cta: "Finish batch",
      room: "mcq",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    };
  }

  return {
    label: "Fresh MCQ needed",
    detail: "The learning loop is ready; now attach a fresh MCQ batch for this day.",
    shortDetail: "Author batch",
    href: `/upsc/geography/mcq-readiness?day=${session.day}`,
    cta: "Plan MCQs",
    room: "mcq",
    tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
  };
}
