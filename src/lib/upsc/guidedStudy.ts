import type { StudentLevel } from "@/lib/upsc/studentProfile";
import type { StudentProfile } from "@/lib/upsc/studentProfile";
import { geographySessions } from "@/lib/upsc/plan";

export const GEOGRAPHY_RECALL_TARGET = 95;

export type GuidedStudyStep = {
  id: "learn" | "discuss" | "practice";
  label: string;
  detail: string;
};

type GuidedPathProgress = Record<
  string,
  {
    mcqOutcome?: string;
    mcqCompleted?: boolean;
  }
>;

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

export function getCurrentGeographyTopic(progress: GuidedPathProgress) {
  return (
    geographySessions.find((session) => {
      const item = progress[String(session.day)];
      return !(item?.mcqCompleted && item.mcqOutcome === "Command");
    }) ?? geographySessions[geographySessions.length - 1]
  );
}

export function buildGeographyDailyPath(profile: StudentProfile, progress: GuidedPathProgress): GuidedDailyTopic[] {
  const currentTopic = getCurrentGeographyTopic(progress);
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
