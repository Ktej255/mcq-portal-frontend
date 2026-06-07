import type { StudentProfile } from "@/lib/upsc/studentProfile";
import type { SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";

export type DailyPlannerProgress = SubjectDayProgress & {
  meTimeCompletedAt?: string;
  meTimeMood?: "calm" | "focused" | "tired";
};

export type DailyPlannerDecision = {
  learningGap: {
    title: string;
    detail: string;
    scoreLabel: string;
    tone: "good" | "repair" | "neutral";
  };
  revision: {
    title: string;
    detail: string;
    href: string;
    dueLabel: string;
    urgent: boolean;
  };
  todayTask: {
    title: string;
    detail: string;
    href: string;
    actionLabel: string;
  };
  growth: {
    title: string;
    detail: string;
    metricLabel: string;
    meTimeLabel: string;
  };
};

type PlannerInput = {
  subjectSlug: string;
  sessions: SubjectSession[];
  selectedDay: number;
  progress: Record<string, DailyPlannerProgress | undefined>;
  profile?: StudentProfile | null;
};

const recallTarget = 95;
const mcqCommandTarget = 75;

function hasStarted(progress?: DailyPlannerProgress) {
  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      progress?.labCompleted ||
      progress?.mcqAttempted
  );
}

function needsRecovery(progress?: DailyPlannerProgress) {
  return Boolean(
    progress?.revisitQueued ||
      progress?.talkBand === "Revisit" ||
      progress?.mcqOutcome === "Revisit" ||
      progress?.confidence === "Shaky"
  );
}

function hasCommand(progress?: DailyPlannerProgress) {
  return Boolean(
    !needsRecovery(progress) &&
      (progress?.confidence === "Command" ||
        progress?.mcqOutcome === "Command" ||
        (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= mcqCommandTarget))
  );
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function routeFor(subjectSlug: string, room: "watch" | "talk" | "mcq-readiness" | "track" | "revisit", day: number) {
  if (room === "track") return `/upsc/${subjectSlug}/track?day=${day}`;
  return `/upsc/${subjectSlug}/${room}?day=${day}`;
}

function findSession(sessions: SubjectSession[], day: number) {
  return sessions.find((session) => session.day === day) ?? sessions[0];
}

function findRevisionDue(input: PlannerInput) {
  return input.sessions
    .map((source) => {
      const sourceProgress = input.progress[String(source.day)];
      const dueDay = Math.min(source.day + 2, input.sessions.length);
      const due = findSession(input.sessions, dueDay);
      if (!sourceProgress || !hasStarted(sourceProgress) || hasCommand(sourceProgress)) return null;
      if (dueDay > input.selectedDay && !needsRecovery(sourceProgress)) return null;
      return { source, due, progress: sourceProgress, dueDay };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => {
      const leftUrgent = needsRecovery(left.progress) ? 0 : 1;
      const rightUrgent = needsRecovery(right.progress) ? 0 : 1;
      return leftUrgent - rightUrgent || left.source.day - right.source.day;
    })[0];
}

function buildGap(input: PlannerInput, revisionDue: ReturnType<typeof findRevisionDue>): DailyPlannerDecision["learningGap"] {
  const active = input.progress[String(input.selectedDay)];
  const previous = input.progress[String(input.selectedDay - 1)];
  const reference = revisionDue?.progress ?? previous ?? active;

  if (needsRecovery(reference)) {
    const score =
      typeof reference?.talkScore === "number"
        ? `${reference.talkScore}/100 recall`
        : typeof reference?.mcqScorePercent === "number"
          ? `${reference.mcqScorePercent}% MCQ`
          : "Recovery active";
    return {
      title: `Repair Day ${revisionDue?.source.day ?? input.selectedDay} before moving ahead`,
      detail: "The next lesson should wait until the weak recall or MCQ signal is corrected.",
      scoreLabel: score,
      tone: "repair",
    };
  }

  if (typeof reference?.talkScore === "number" && reference.talkScore < recallTarget) {
    return {
      title: `${recallTarget - reference.talkScore} recall points missing`,
      detail: "The student should explain the same topic again before opening heavy practice.",
      scoreLabel: `${reference.talkScore}/100`,
      tone: "repair",
    };
  }

  if (typeof reference?.mcqScorePercent === "number" && reference.mcqScorePercent < mcqCommandTarget) {
    return {
      title: `${mcqCommandTarget - reference.mcqScorePercent} MCQ points missing`,
      detail: "Practice evidence is below command level, so revision should stay close.",
      scoreLabel: `${reference.mcqScorePercent}%`,
      tone: "repair",
    };
  }

  if (!active?.baselineSavedAt && !active?.reflection?.trim()) {
    return {
      title: "Recall baseline pending",
      detail: "Start by writing what is already known, then the system can identify the true gap.",
      scoreLabel: "Not measured",
      tone: "neutral",
    };
  }

  return {
    title: "No urgent gap",
    detail: "The next step can continue, with normal spaced revision kept in the loop.",
    scoreLabel: "On track",
    tone: "good",
  };
}

function buildTodayTask(input: PlannerInput, revisionDue: ReturnType<typeof findRevisionDue>): DailyPlannerDecision["todayTask"] {
  const active = input.progress[String(input.selectedDay)];

  if (revisionDue && needsRecovery(revisionDue.progress)) {
    return {
      title: `Repair Day ${revisionDue.source.day}`,
      detail: revisionDue.source.title,
      href: routeFor(input.subjectSlug, "revisit", revisionDue.source.day),
      actionLabel: "Open revisit",
    };
  }

  if (!active?.watched) {
    return {
      title: `Watch Day ${input.selectedDay}`,
      detail: findSession(input.sessions, input.selectedDay).title,
      href: routeFor(input.subjectSlug, "watch", input.selectedDay),
      actionLabel: "Start class",
    };
  }

  if (!active.reflection?.trim() || (typeof active.talkScore === "number" && active.talkScore < recallTarget)) {
    return {
      title: `Talk Day ${input.selectedDay}`,
      detail: "Explain the topic until recall reaches command level.",
      href: routeFor(input.subjectSlug, "talk", input.selectedDay),
      actionLabel: "Open talk room",
    };
  }

  if (!active.mcqCompleted || active.mcqOutcome === "Pending") {
    return {
      title: `MCQ Day ${input.selectedDay}`,
      detail: "Clear the fresh practice batch before the next topic.",
      href: routeFor(input.subjectSlug, "mcq-readiness", input.selectedDay),
      actionLabel: "Open MCQs",
    };
  }

  if (active.mcqOutcome === "Revisit") {
    return {
      title: `Recover Day ${input.selectedDay}`,
      detail: "Practice result needs a repair loop.",
      href: routeFor(input.subjectSlug, "revisit", input.selectedDay),
      actionLabel: "Repair",
    };
  }

  return {
    title: `Track Day ${input.selectedDay}`,
    detail: "Command evidence is ready for review and next-day adjustment.",
    href: routeFor(input.subjectSlug, "track", input.selectedDay),
    actionLabel: "Open track",
  };
}

function buildGrowth(input: PlannerInput): DailyPlannerDecision["growth"] {
  const states = input.sessions.map((session) => input.progress[String(session.day)]);
  const startedCount = states.filter(hasStarted).length;
  const commandCount = states.filter(hasCommand).length;
  const recallScores = states
    .map((item) => item?.talkScore)
    .filter((score): score is number => typeof score === "number");
  const mcqScores = states
    .map((item) => item?.mcqScorePercent)
    .filter((score): score is number => typeof score === "number");
  const averageRecall = average(recallScores);
  const averageMcq = average(mcqScores);
  const recentWindow = input.sessions.slice(Math.max(0, input.selectedDay - 7), input.selectedDay);
  const recentStarted = recentWindow.filter((session) => hasStarted(input.progress[String(session.day)])).length;
  const consistency = recentWindow.length ? Math.round((recentStarted / recentWindow.length) * 100) : 0;
  const latestMeTime = states
    .filter((item) => item?.meTimeCompletedAt || item?.meTimeMood)
    .at(-1);
  const mood = latestMeTime?.meTimeMood ?? input.profile?.mindState;
  const meTimeLabel =
    mood === "tired" || mood === "overloaded" || mood === "exam-stress"
      ? "Reset before class"
      : mood === "low-confidence"
        ? "Start with small win"
        : "Normal loop";

  return {
    title: `${commandCount}/${input.sessions.length} command days`,
    detail:
      averageRecall === null && averageMcq === null
        ? "Growth begins after the first recall or MCQ evidence is saved."
        : `Average recall ${averageRecall ?? "not measured"}, average MCQ ${averageMcq ?? "not measured"}.`,
    metricLabel: `${startedCount} started / ${consistency}% consistency`,
    meTimeLabel,
  };
}

export function buildDailyPlannerDecision(input: PlannerInput): DailyPlannerDecision {
  const revisionDue = findRevisionDue(input);
  const fallbackRevisionDay = Math.min(input.selectedDay + 2, input.sessions.length);
  const fallbackRevision = findSession(input.sessions, fallbackRevisionDay);

  return {
    learningGap: buildGap(input, revisionDue),
    revision: revisionDue
      ? {
          title: `Revise Day ${revisionDue.source.day}`,
          detail: `${revisionDue.source.title} is due before ${revisionDue.due.title}.`,
          href: routeFor(input.subjectSlug, "revisit", revisionDue.source.day),
          dueLabel: needsRecovery(revisionDue.progress) ? "Due now" : `Day ${revisionDue.dueDay}`,
          urgent: needsRecovery(revisionDue.progress),
        }
      : {
          title: `Next revision Day ${fallbackRevision.day}`,
          detail: fallbackRevision.title,
          href: routeFor(input.subjectSlug, "revisit", fallbackRevision.day),
          dueLabel: `Day ${fallbackRevisionDay}`,
          urgent: false,
        },
    todayTask: buildTodayTask(input, revisionDue),
    growth: buildGrowth(input),
  };
}
