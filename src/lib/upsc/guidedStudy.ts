import type { StudentLevel } from "@/lib/upsc/studentProfile";
import type { StudentProfile } from "@/lib/upsc/studentProfile";
import { geographySessions } from "@/lib/upsc/plan";
import type { QuestionBankAttempt } from "@/lib/upsc/questionBankEngine";

export const GEOGRAPHY_RECALL_TARGET = 95;

export type GuidedStudyStep = {
  id: "learn" | "discuss" | "practice";
  label: string;
  detail: string;
};

type GuidedPathProgress = Record<
  string,
  {
    watched?: boolean;
    reflection?: string;
    talkScore?: number;
    confidence?: string;
    mcqOutcome?: string;
    mcqCompleted?: boolean;
  }
>;

type GuidedPathQuestionBankAttempt = Pick<QuestionBankAttempt, "linkedDay" | "isCorrect">;

export type GuidedDailyTopic = {
  day: number;
  title: string;
  chapter: string;
  durationMinutes: number;
  entryRoute: string;
};

function topicCountForStudyWindow(studyWindow: StudentProfile["studyWindow"]) {
  if (studyWindow === "180") return 3;
  if (studyWindow === "120") return 2;
  return 1;
}

function attemptsForDay(attempts: GuidedPathQuestionBankAttempt[], day: number) {
  return attempts.filter((attempt) => attempt.linkedDay === day);
}

function isDayClearedByQuestionBank(
  progress: GuidedPathProgress[string] | undefined,
  attempts: GuidedPathQuestionBankAttempt[]
) {
  const hasLearningProof = Boolean(
    progress?.watched &&
      (progress.reflection?.trim() || (typeof progress.talkScore === "number" && progress.talkScore >= GEOGRAPHY_RECALL_TARGET))
  );
  return hasLearningProof && attempts.length > 0 && attempts.every((attempt) => attempt.isCorrect);
}

export function getCurrentGeographyTopic(
  progress: GuidedPathProgress,
  questionBankAttempts: GuidedPathQuestionBankAttempt[] = []
) {
  return (
    geographySessions.find((session) => {
      const item = progress[String(session.day)];
      const commandMcq = Boolean(item?.mcqCompleted && item.mcqOutcome === "Command");
      const commandQuestionBank = isDayClearedByQuestionBank(item, attemptsForDay(questionBankAttempts, session.day));
      return !(commandMcq || commandQuestionBank);
    }) ?? geographySessions[geographySessions.length - 1]
  );
}

export function buildGeographyDailyPath(
  profile: StudentProfile,
  progress: GuidedPathProgress,
  questionBankAttempts: GuidedPathQuestionBankAttempt[] = []
): GuidedDailyTopic[] {
  const currentTopic = getCurrentGeographyTopic(progress, questionBankAttempts);
  const topicCount = topicCountForStudyWindow(profile.studyWindow);

  return geographySessions
    .filter((session) => session.day >= currentTopic.day)
    .slice(0, topicCount)
    .map((session) => ({
      day: session.day,
      title: session.title,
      chapter: session.chapter,
      durationMinutes: 12,
      entryRoute: getGuidedStudyEntryRoute(profile.level, session.day),
    }));
}

export function getGuidedStudyEntryRoute(level: StudentLevel, day: number) {
  return level === "beginner"
    ? `/upsc/geography/watch?day=${day}`
    : `/upsc/geography/talk?day=${day}`;
}

export function getGuidedStudyEntryLabel(level: StudentLevel) {
  return level === "beginner" ? "Start lesson" : "Start diagnosis";
}

export function getGuidedStudySteps(level: StudentLevel): GuidedStudyStep[] {
  if (level === "beginner") {
    return [
      { id: "learn", label: "Learn", detail: "Watch one 10-15 minute topic." },
      { id: "discuss", label: "Discuss", detail: "Explain until recall reaches 95%." },
      { id: "practice", label: "MCQ", detail: "Clear fresh questions, then move ahead." },
    ];
  }

  return [
    { id: "discuss", label: "Diagnose", detail: "Explain the topic in your own words." },
    { id: "learn", label: "Repair", detail: "Open a short lesson only for missing concepts." },
    { id: "practice", label: "MCQ", detail: "Clear fresh questions, then move ahead." },
  ];
}

export function getGuidedStudyStrategy(level: StudentLevel) {
  if (level === "beginner") {
    return {
      eyebrow: "Foundation path",
      firstAction: "Learn one topic first",
      detail: "The system opens one 10-15 minute lesson, checks recall through discussion, then unlocks MCQs.",
    };
  }

  if (level === "advanced") {
    return {
      eyebrow: "Attempt recovery path",
      firstAction: "Explain before studying",
      detail: "The system diagnoses the UPSC gap from your explanation and opens only the repair you need.",
    };
  }

  return {
    eyebrow: "Self-study bridge",
    firstAction: "Explain before studying",
    detail: "The system checks what coaching already covered and opens only the missing concepts.",
  };
}
