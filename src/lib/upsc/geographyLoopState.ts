import { getGeographyBatchCode } from "@/lib/upsc/mcqContract";
import { readMcqCommandBatchState } from "@/lib/upsc/mcqDraftBank";
import type { GeographySession } from "@/lib/upsc/plan";
import type { StudentLevel } from "@/lib/upsc/studentProfile";
import { GEOGRAPHY_RECALL_TARGET, getGuidedStudyEntryRoute } from "@/lib/upsc/guidedStudy";
import type { GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";

export type GeographyLoopRoom = "watch" | "talk" | "revisit" | "lab" | "mcq" | "loading";

export type GeographyLoopStateLabel =
  | "Loading local status"
  | "Lesson pending"
  | "Talk pending"
  | "Watch pending"
  | "Revisit required"
  | "Lab pending"
  | "Practice is being prepared"
  | "Practice ready"
  | "Practice in progress"
  | "Practice complete";

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
  if (typeof progress?.talkScore === "number") return progress.talkScore >= GEOGRAPHY_RECALL_TARGET;
  return progress?.talkBand === "Command";
}

export function getGeographyLoopState(
  session: GeographySession,
  progress?: GeographyDayProgress,
  options: { isLoaded?: boolean; labSlug?: string; learnerLevel?: StudentLevel } = {}
): GeographyLoopState {
  const isLoaded = options.isLoaded ?? true;
  const learnerLevel = options.learnerLevel ?? "intermediate";
  const entryRoute = getGuidedStudyEntryRoute(learnerLevel, session.day);

  if (!isLoaded) {
    return {
      label: "Loading local status",
      detail: "Reading this day's guided lesson, discussion, and MCQ memory from the local browser.",
      shortDetail: "Reading local memory",
      href: entryRoute,
      cta: learnerLevel === "beginner" ? "Start lesson" : "Start diagnosis",
      room: "loading",
      tone: "border-[#d7d0c0] bg-[#f7f4ee] text-[#5f665f]",
    };
  }

  if (progress?.revisitQueued || progress?.talkBand === "Revisit") {
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

  if (learnerLevel === "beginner" && !progress?.watched) {
    return {
      label: "Lesson pending",
      detail: "Start with one 10-15 minute topic. Discussion opens immediately after the lesson.",
      shortDetail: "Learn one topic",
      href: `/upsc/geography/watch?day=${session.day}`,
      cta: "Start lesson",
      room: "watch",
      tone: "border-[#cde2da] bg-[#e7f5ee] text-[#085041]",
    };
  }

  if (
    learnerLevel !== "beginner" &&
    typeof progress?.talkScore === "number" &&
    !hasGeographyTalkClearance(progress) &&
    !progress?.watched
  ) {
    return {
      label: "Watch pending",
      detail: "Your explanation exposed a gap. Open only the short repair lesson selected for this topic.",
      shortDetail: "Repair the diagnosed gap",
      href: `/upsc/geography/watch?day=${session.day}`,
      cta: "Open repair lesson",
      room: "watch",
      tone: "border-[#cde2da] bg-[#e7f5ee] text-[#085041]",
    };
  }

  if (!hasGeographyTalkClearance(progress)) {
    return {
      label: "Talk pending",
      detail:
        learnerLevel === "beginner"
          ? `Explain the lesson in your own words. The teacher keeps repairing recall until it reaches ${GEOGRAPHY_RECALL_TARGET}%.`
          : `Explain what you know first. The teacher diagnoses missing UPSC concepts and keeps repairing recall until it reaches ${GEOGRAPHY_RECALL_TARGET}%.`,
      shortDetail: learnerLevel === "beginner" ? "Discuss the lesson" : "Diagnose first",
      href: `/upsc/geography/talk?day=${session.day}`,
      cta: learnerLevel === "beginner" ? "Start discussion" : "Start diagnosis",
      room: "talk",
      tone: "border-[#bdddd3] bg-[#effaf5] text-[#085041]",
    };
  }

  const batchState = readMcqCommandBatchState(getGeographyBatchCode(session));
  if (batchState?.status === "READY") {
    if (progress?.mcqCompleted) {
      return {
        label: "Practice complete",
        detail: `${progress.mcqCorrectCount ?? 0}/${progress.mcqTotal ?? batchState.planned} correct. Open the result for your next step.`,
        shortDetail: `${progress.mcqCorrectCount ?? 0}/${progress.mcqTotal ?? batchState.planned} correct`,
        href: `/upsc/geography/mcq-readiness?day=${session.day}`,
        cta: "Open result",
        room: "mcq",
        tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
      };
    }

    if (progress?.mcqAttempted) {
      return {
        label: "Practice in progress",
        detail: `${progress.mcqAnsweredCount ?? 0}/${progress.mcqTotal ?? batchState.planned} questions answered.`,
        shortDetail: `${progress.mcqAnsweredCount ?? 0}/${progress.mcqTotal ?? batchState.planned} answered`,
        href: `/upsc/geography/mcq-readiness?day=${session.day}`,
        cta: "Continue practice",
        room: "mcq",
        tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
      };
    }

    return {
      label: "Practice ready",
      detail: "Your reviewed practice set is ready.",
      shortDetail: "Reviewed practice",
      href: `/upsc/geography/mcq-readiness?day=${session.day}`,
      cta: "Start practice",
      room: "mcq",
      tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
    };
  }

  if ((batchState?.drafted ?? 0) > 0) {
    return {
      label: "Practice is being prepared",
      detail: "Your discussion is saved. This reviewed practice set will open when it is ready.",
      shortDetail: "Preparing practice",
      href: `/upsc/geography/mcq-readiness?day=${session.day}`,
      cta: "View status",
      room: "mcq",
      tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
    };
  }

  return {
    label: "Practice is being prepared",
    detail: "Your discussion is saved. This reviewed practice set will open when it is ready.",
    shortDetail: "Preparing practice",
    href: `/upsc/geography/mcq-readiness?day=${session.day}`,
    cta: "View status",
    room: "mcq",
    tone: "border-[#dcd5c7] bg-[#fdfaf3] text-[#34453b]",
  };
}
