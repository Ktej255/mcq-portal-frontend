import type { StudentProfile } from "@/lib/upsc/studentProfile";
import type { SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress, SubjectMeTimeMood } from "@/lib/upsc/useSubjectProgress";

export type DailyPlannerProgress = SubjectDayProgress & {
  meTimeCompletedAt?: string;
  meTimeMood?: SubjectMeTimeMood;
};

export type DailyPlannerDecision = {
  teacherDoubt: {
    day: number;
    category: string;
    reason: string;
    repairAction: string;
    masteryCheck: string;
    href: string;
  } | null;
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
  sessionReadiness: {
    title: string;
    detail: string;
    href: string;
    actionLabel: string;
    statusLabel: string;
    scorePercent: number;
    tone: "good" | "repair" | "neutral";
    checklist: Array<{
      label: string;
      detail: string;
      status: "done" | "pending" | "repair";
    }>;
  };
  tomorrowAdjustment: {
    title: string;
    detail: string;
    href: string;
    statusLabel: string;
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

function hasTeacherDoubt(progress?: DailyPlannerProgress) {
  return Boolean(
    progress?.teacherDoubtCategory &&
      progress?.teacherDoubtReason &&
      progress?.teacherDoubtRepairAction &&
      progress?.teacherDoubtMasteryCheck
  );
}

function findTeacherDoubtDue(input: PlannerInput): DailyPlannerDecision["teacherDoubt"] {
  const candidate = input.sessions
    .map((session) => {
      const progress = input.progress[String(session.day)];
      if (!progress || !hasTeacherDoubt(progress) || hasCommand(progress)) return null;
      if (session.day > input.selectedDay) return null;
      const href =
        progress.talkNextRoute ??
        (progress.talkUnlockStage === "mcq"
          ? routeFor(input.subjectSlug, "mcq-readiness", session.day)
          : routeFor(input.subjectSlug, "talk", session.day));

      return {
        day: session.day,
        progress,
        category: progress.teacherDoubtCategory!,
        reason: progress.teacherDoubtReason!,
        repairAction: progress.teacherDoubtRepairAction!,
        masteryCheck: progress.teacherDoubtMasteryCheck!,
        href,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => {
      const leftUrgent = needsRecovery(left.progress) || left.day === input.selectedDay ? 0 : 1;
      const rightUrgent = needsRecovery(right.progress) || right.day === input.selectedDay ? 0 : 1;
      return leftUrgent - rightUrgent || right.day - left.day;
    })[0];

  return candidate
    ? {
        day: candidate.day,
        category: candidate.category,
        reason: candidate.reason,
        repairAction: candidate.repairAction,
        masteryCheck: candidate.masteryCheck,
        href: candidate.href,
      }
    : null;
}

function labelForDoubtHref(href: string) {
  if (href.includes("/watch")) return "Open repair class";
  if (href.includes("/revisit")) return "Open revisit";
  if (href.includes("/mcq-readiness")) return "Open MCQs";
  if (href.includes("/lab")) return "Use visual support";
  return "Repeat talk";
}

function buildGap(
  input: PlannerInput,
  revisionDue: ReturnType<typeof findRevisionDue>,
  teacherDoubt: DailyPlannerDecision["teacherDoubt"]
): DailyPlannerDecision["learningGap"] {
  if (teacherDoubt) {
    return {
      title: `AI found ${teacherDoubt.category} gap`,
      detail: `Day ${teacherDoubt.day}: ${teacherDoubt.repairAction}`,
      scoreLabel: "Teacher gap",
      tone: "repair",
    };
  }

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

function buildTodayTask(
  input: PlannerInput,
  revisionDue: ReturnType<typeof findRevisionDue>,
  teacherDoubt: DailyPlannerDecision["teacherDoubt"]
): DailyPlannerDecision["todayTask"] {
  const active = input.progress[String(input.selectedDay)];

  if (teacherDoubt) {
    return {
      title: `Solve Day ${teacherDoubt.day} ${teacherDoubt.category} gap`,
      detail: teacherDoubt.masteryCheck,
      href: teacherDoubt.href,
      actionLabel: labelForDoubtHref(teacherDoubt.href),
    };
  }

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

function hasRecallBaseline(progress?: DailyPlannerProgress) {
  return Boolean(
    progress?.baselineSavedAt ||
      progress?.baselineKnowledge?.trim() ||
      progress?.reflection?.trim() ||
      typeof progress?.talkScore === "number"
  );
}

function buildSessionReadiness(
  input: PlannerInput,
  teacherDoubt: DailyPlannerDecision["teacherDoubt"]
): DailyPlannerDecision["sessionReadiness"] {
  const active = input.progress[String(input.selectedDay)];
  const meTimeReady = Boolean(active?.meTimeCompletedAt);
  const recallReady = hasRecallBaseline(active);
  const watchReady = Boolean(active?.watched);
  const talkReady = typeof active?.talkScore === "number" && active.talkScore >= recallTarget;
  const mcqReady = Boolean(active?.mcqCompleted && active.mcqOutcome !== "Pending");
  const checklist: DailyPlannerDecision["sessionReadiness"]["checklist"] = [
    {
      label: "Mind-state",
      detail: meTimeReady ? `Saved as ${active?.meTimeMood ?? "ready"}` : "Save me-time before opening the next action.",
      status: meTimeReady ? "done" : "pending",
    },
    {
      label: "Known points",
      detail: recallReady ? "Recall baseline is attached to this day." : "Start by explaining what is already known.",
      status: recallReady ? "done" : "pending",
    },
    {
      label: "Class proof",
      detail: watchReady ? "Focused class evidence is saved." : "Watch only after the readiness step is clear.",
      status: watchReady ? "done" : "pending",
    },
    {
      label: "AI discussion",
      detail: talkReady ? `${active?.talkScore}/100 recall is command-ready.` : "Explain to the AI teacher before MCQs.",
      status: talkReady ? "done" : active?.talkScore || active?.teacherDoubtCategory ? "repair" : "pending",
    },
    {
      label: "Practice evidence",
      detail: mcqReady ? `${active?.mcqScorePercent ?? 0}% MCQ evidence saved.` : "Fresh MCQ evidence is still pending.",
      status: mcqReady ? "done" : active?.mcqOutcome === "Revisit" ? "repair" : "pending",
    },
  ];
  const scorePercent = Math.round(
    (checklist.filter((item) => item.status === "done").length / checklist.length) * 100
  );

  if (teacherDoubt) {
    return {
      title: `Repair Day ${teacherDoubt.day} before new load`,
      detail: teacherDoubt.repairAction,
      href: teacherDoubt.href,
      actionLabel: labelForDoubtHref(teacherDoubt.href),
      statusLabel: "Repair lock",
      scorePercent,
      tone: "repair",
      checklist,
    };
  }

  if (needsRecovery(active)) {
    return {
      title: `Recovery is active for Day ${input.selectedDay}`,
      detail: "The next session should stay inside revisit until the weak signal is resolved.",
      href: routeFor(input.subjectSlug, "revisit", input.selectedDay),
      actionLabel: "Open revisit",
      statusLabel: "Recovery lock",
      scorePercent,
      tone: "repair",
      checklist,
    };
  }

  if (!meTimeReady) {
    return {
      title: "Save mind-state before starting",
      detail: "One small check-in tells the system whether to run normal class, small-win mode, or a reduced-load loop.",
      href: "#daily-me-time-checkin",
      actionLabel: "Choose me-time",
      statusLabel: "Mind-state first",
      scorePercent,
      tone: "neutral",
      checklist,
    };
  }

  if (!recallReady) {
    return {
      title: "Recall baseline is pending",
      detail: "The student should first explain what is already known so the gap is measured before content opens.",
      href: routeFor(input.subjectSlug, "talk", input.selectedDay),
      actionLabel: "Start recall",
      statusLabel: "Recall first",
      scorePercent,
      tone: "neutral",
      checklist,
    };
  }

  if (!watchReady) {
    return {
      title: "Class can start now",
      detail: "Mind-state and known-points evidence exist. Open the focused lesson or repair class for this day.",
      href: routeFor(input.subjectSlug, "watch", input.selectedDay),
      actionLabel: "Open class",
      statusLabel: "Class ready",
      scorePercent,
      tone: "good",
      checklist,
    };
  }

  if (!talkReady) {
    return {
      title: "Discussion is the next gate",
      detail: "Class evidence exists. The next proof is a 95 percent recall explanation with the AI teacher.",
      href: routeFor(input.subjectSlug, "talk", input.selectedDay),
      actionLabel: "Open talk",
      statusLabel: "Talk gate",
      scorePercent,
      tone: "neutral",
      checklist,
    };
  }

  if (!mcqReady) {
    return {
      title: "Fresh MCQ evidence is next",
      detail: "Recall is strong enough. Complete the day-specific MCQ set before advancing.",
      href: routeFor(input.subjectSlug, "mcq-readiness", input.selectedDay),
      actionLabel: "Open MCQs",
      statusLabel: "Practice ready",
      scorePercent,
      tone: "good",
      checklist,
    };
  }

  return {
    title: "Session is command-ready",
    detail: "Mind-state, recall, class proof, discussion, and practice evidence are all saved for this day.",
    href: routeFor(input.subjectSlug, "track", input.selectedDay),
    actionLabel: "Open track",
    statusLabel: "Cleared",
    scorePercent,
    tone: "good",
    checklist,
  };
}

function buildTomorrowAdjustment(
  input: PlannerInput,
  teacherDoubt: DailyPlannerDecision["teacherDoubt"]
): DailyPlannerDecision["tomorrowAdjustment"] {
  const active = input.progress[String(input.selectedDay)];
  const currentSession = findSession(input.sessions, input.selectedDay);
  const nextDay = Math.min(input.selectedDay + 1, input.sessions.length);
  const nextSession = findSession(input.sessions, nextDay);

  if (teacherDoubt) {
    return {
      title: `Hold Day ${teacherDoubt.day} for repair`,
      detail: `Tomorrow starts with the AI teacher's ${teacherDoubt.category} gap before any new topic opens.`,
      href: teacherDoubt.href,
      statusLabel: "Repair first",
    };
  }

  if (needsRecovery(active)) {
    return {
      title: `Repeat Day ${currentSession.day} before moving ahead`,
      detail: `${currentSession.title} stays active because the latest evidence is still in recovery.`,
      href: routeFor(input.subjectSlug, "revisit", currentSession.day),
      statusLabel: "Recovery lock",
    };
  }

  if (!active || !hasStarted(active) || !active.watched) {
    return {
      title: `Keep Day ${currentSession.day} as the next start`,
      detail: "No completed class evidence is saved yet, so tomorrow should not jump to a new topic.",
      href: routeFor(input.subjectSlug, "watch", currentSession.day),
      statusLabel: "Same topic",
    };
  }

  if (!active.reflection?.trim() || (typeof active.talkScore === "number" && active.talkScore < recallTarget)) {
    return {
      title: `Keep Day ${currentSession.day} in Talk`,
      detail: "Recall evidence is incomplete or below 95 percent, so the next plan remains discussion-first.",
      href: routeFor(input.subjectSlug, "talk", currentSession.day),
      statusLabel: "Recall gap",
    };
  }

  if (!active.mcqCompleted || active.mcqOutcome === "Pending") {
    return {
      title: `Attach Day ${currentSession.day} MCQs`,
      detail: "Class and recall evidence exist, but practice evidence is still missing.",
      href: routeFor(input.subjectSlug, "mcq-readiness", currentSession.day),
      statusLabel: "Practice pending",
    };
  }

  if (active.mcqOutcome === "Revisit") {
    return {
      title: `Repair Day ${currentSession.day} MCQ traps`,
      detail: "Practice result needs a short recovery loop before the next topic can safely open.",
      href: routeFor(input.subjectSlug, "revisit", currentSession.day),
      statusLabel: "MCQ repair",
    };
  }

  if (currentSession.day >= input.sessions.length) {
    return {
      title: "Move into final tracking",
      detail: "The last planned day has command evidence, so tomorrow should consolidate the full subject.",
      href: routeFor(input.subjectSlug, "track", currentSession.day),
      statusLabel: "Subject closeout",
    };
  }

  return {
    title: `Advance to Day ${nextSession.day}`,
    detail: `${nextSession.title} opens because today's watch, recall, and MCQ evidence are clear.`,
    href: routeFor(input.subjectSlug, "watch", nextSession.day),
    statusLabel: "Advance",
  };
}

export function buildDailyPlannerDecision(input: PlannerInput): DailyPlannerDecision {
  const revisionDue = findRevisionDue(input);
  const teacherDoubt = findTeacherDoubtDue(input);
  const fallbackRevisionDay = Math.min(input.selectedDay + 2, input.sessions.length);
  const fallbackRevision = findSession(input.sessions, fallbackRevisionDay);

  return {
    teacherDoubt,
    learningGap: buildGap(input, revisionDue, teacherDoubt),
    revision: revisionDue
      ? {
          title: teacherDoubt ? `Mastery check Day ${teacherDoubt.day}` : `Revise Day ${revisionDue.source.day}`,
          detail: teacherDoubt ? teacherDoubt.masteryCheck : `${revisionDue.source.title} is due before ${revisionDue.due.title}.`,
          href: teacherDoubt?.href ?? routeFor(input.subjectSlug, "revisit", revisionDue.source.day),
          dueLabel: teacherDoubt ? "AI gap" : needsRecovery(revisionDue.progress) ? "Due now" : `Day ${revisionDue.dueDay}`,
          urgent: Boolean(teacherDoubt) || needsRecovery(revisionDue.progress),
        }
      : {
          title: teacherDoubt ? `Mastery check Day ${teacherDoubt.day}` : `Next revision Day ${fallbackRevision.day}`,
          detail: teacherDoubt?.masteryCheck ?? fallbackRevision.title,
          href: teacherDoubt?.href ?? routeFor(input.subjectSlug, "revisit", fallbackRevision.day),
          dueLabel: teacherDoubt ? "AI gap" : `Day ${fallbackRevisionDay}`,
          urgent: Boolean(teacherDoubt),
        },
    todayTask: buildTodayTask(input, revisionDue, teacherDoubt),
    growth: buildGrowth(input),
    sessionReadiness: buildSessionReadiness(input, teacherDoubt),
    tomorrowAdjustment: buildTomorrowAdjustment(input, teacherDoubt),
  };
}
