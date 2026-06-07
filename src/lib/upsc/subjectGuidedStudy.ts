import type { StudentLevel, StudentProfile } from "@/lib/upsc/studentProfile";
import { defaultStudentProfile } from "@/lib/upsc/studentProfile";
import { getSubjectDayReadiness } from "@/lib/upsc/subjectReadiness";
import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";

export type SubjectGuidedDailyTopic = {
  day: number;
  title: string;
  chapter: string;
  durationLabel: string;
  entryRoute: string;
  entryLabel: string;
  gateLabel: string;
  gateDetail: string;
  gateId: string;
  readinessScore: number;
  state: "current" | "queued";
};

function topicCountForStudyWindow(studyWindow: StudentProfile["studyWindow"]) {
  if (studyWindow === "180") return 3;
  if (studyWindow === "120") return 2;
  return 1;
}

export function getSubjectGuidedStudyEntryRoute(plan: SubjectSprintPlan, level: StudentLevel, day: number) {
  return level === "beginner" ? `/upsc/${plan.slug}/watch?day=${day}` : `/upsc/${plan.slug}/talk?day=${day}`;
}

export function getSubjectGuidedStudyEntryLabel(level: StudentLevel) {
  return level === "beginner" ? "Open lesson" : "Start diagnosis";
}

export function getSubjectGuidedStudyEntry(
  plan: SubjectSprintPlan,
  session: SubjectSession,
  level: StudentLevel,
  progress?: SubjectDayProgress
) {
  const readiness = getSubjectDayReadiness(plan, session, progress, level);

  return {
    href: readiness.href,
    actionLabel: readiness.actionLabel,
    label: readiness.label,
    detail: readiness.detail,
    gateId: readiness.learningGateId,
    score: readiness.score,
  };
}

export function buildSubjectDailyPath(
  plan: SubjectSprintPlan,
  profile: StudentProfile | null,
  progress: Record<string, SubjectDayProgress>,
  selectedDay: number
): SubjectGuidedDailyTopic[] {
  const activeProfile = profile ?? defaultStudentProfile;
  const topicCount = topicCountForStudyWindow(activeProfile.studyWindow);
  const selectedSession = plan.sessions.find((session) => session.day === selectedDay);
  const firstIncomplete =
    plan.sessions.find((session) => {
      const dayProgress = progress[String(session.day)];
      return !(dayProgress?.mcqCompleted && dayProgress.mcqOutcome === "Command");
    }) ?? plan.sessions[plan.sessions.length - 1];
  const startDay = Math.max(selectedSession?.day ?? firstIncomplete.day, firstIncomplete.day);

  return plan.sessions
    .filter((session) => session.day >= startDay)
    .slice(0, topicCount)
    .map((session, index) => {
      const entry = getSubjectGuidedStudyEntry(plan, session, activeProfile.level, progress[String(session.day)]);

      return {
        day: session.day,
        title: session.title,
        chapter: session.chapter,
        durationLabel: "10-15 min topic",
        entryRoute: entry.href,
        entryLabel: entry.actionLabel,
        gateLabel: entry.label,
        gateDetail: entry.detail,
        gateId: entry.gateId,
        readinessScore: entry.score,
        state: index === 0 ? "current" : "queued",
      };
    });
}
