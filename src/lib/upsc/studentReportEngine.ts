import { getCurrentAffairsForSubject } from "@/lib/upsc/currentAffairsBridge";
import { geographySessions } from "@/lib/upsc/plan";
import type { QuestionBankAttempt } from "@/lib/upsc/questionBankEngine";
import { subjectPlans } from "@/lib/upsc/subjectPlans";
import type { SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress, SubjectMeTimeMood } from "@/lib/upsc/useSubjectProgress";

export type StudentReportProgress = SubjectDayProgress & {
  meTimeCompletedAt?: string;
  meTimeMood?: SubjectMeTimeMood;
};

export type StudentReportProgressMap = Record<string, StudentReportProgress | undefined>;
export type StudentReportQuestionBankAttempt = Pick<
  QuestionBankAttempt,
  "subjectSlug" | "linkedDay" | "difficulty" | "isCorrect" | "solvedAt"
> &
  Partial<Pick<QuestionBankAttempt, "source">>;
export type StudentReportQuestionBankAttemptMap = Record<string, StudentReportQuestionBankAttempt[] | undefined>;

export type StudentReportSubject = {
  slug: string;
  title: string;
  window: string;
  route: string;
  sessions: SubjectSession[];
};

export type StudentSubjectReport = {
  slug: string;
  title: string;
  window: string;
  route: string;
  totalDays: number;
  startedDays: number;
  watchedDays: number;
  recallAttempts: number;
  averageRecall: number | null;
  mcqSets: number;
  averageMcq: number | null;
  questionBankAttempts: number;
  questionBankCorrect: number;
  questionBankAccuracyPercent: number | null;
  exactPyqAttempts: number;
  exactPyqCorrect: number;
  exactPyqAccuracyPercent: number | null;
  recoveryItems: number;
  commandDays: number;
  meTimeChecks: number;
  teacherDoubtCount: number;
  latestTeacherDoubtCategory: string | null;
  latestTeacherDoubtAction: string | null;
  latestMeTimeMood: SubjectMeTimeMood | null;
  latestMeTimeResetPlan: string | null;
  readinessSignal: string;
  currentAffairsUnlocked: number;
  weeklyWindowsGenerated: number;
  monthlyVerdict: string;
  nextAction: string;
};

export type StudentReportWindow = {
  id: string;
  title: string;
  range: string;
  subjectCount: number;
  totalDays: number;
  startedDays: number;
  watchedDays: number;
  recallAttempts: number;
  averageRecall: number | null;
  mcqSets: number;
  averageMcq: number | null;
  questionBankAttempts: number;
  questionBankCorrect: number;
  questionBankAccuracyPercent: number | null;
  exactPyqAttempts: number;
  exactPyqCorrect: number;
  exactPyqAccuracyPercent: number | null;
  recoveryItems: number;
  commandDays: number;
  teacherDoubtCount: number;
  meTimeChecks: number;
  currentAffairsUnlocked: number;
  verdict: string;
  nextAction: string;
};

export type UpscStudentReportSnapshot = {
  subjects: StudentSubjectReport[];
  weekly: StudentReportWindow[];
  monthly: StudentReportWindow;
  autoReport: {
    weeklyReportId: string;
    monthlyReportId: string;
    cadence: string;
    evidenceRule: string;
    growthBaseline: string;
    growthNow: string;
    nextWeeklyAction: string;
    nextMonthlyAction: string;
    studentPromise: string;
  };
  totals: {
    totalDays: number;
    startedDays: number;
    watchedDays: number;
    commandDays: number;
    recoveryItems: number;
    teacherDoubtCount: number;
    meTimeChecks: number;
    currentAffairsUnlocked: number;
    weeklyWindowsGenerated: number;
    averageRecall: number | null;
    averageMcq: number | null;
    questionBankAttempts: number;
    questionBankCorrect: number;
    questionBankAccuracyPercent: number | null;
    exactPyqAttempts: number;
    exactPyqCorrect: number;
    exactPyqAccuracyPercent: number | null;
    growthPercent: number;
  };
  growth: {
    startedFrom: string;
    currentPosition: string;
    strongestSubject: string;
    weakestSubject: string;
  };
};

export const studentReportSubjects: StudentReportSubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
    route: "/upsc/geography",
    sessions: geographySessions,
  },
  ...[
    subjectPlans.environment,
    subjectPlans["disaster-management"],
    subjectPlans.economy,
    subjectPlans["science-tech"],
    subjectPlans["polity-governance"],
    subjectPlans["internal-security-society"],
    subjectPlans.history,
  ].map((plan) => ({
    slug: plan.slug,
    title: plan.title,
    window: plan.window,
    route: `/upsc/${plan.slug}`,
    sessions: plan.sessions,
  })),
];

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function attemptsForDay(attempts: StudentReportQuestionBankAttempt[] = [], day: number) {
  return attempts.filter((attempt) => attempt.linkedDay === day);
}

function questionBankAccuracy(correct: number, total: number) {
  return total ? Math.round((correct / total) * 100) : null;
}

function exactPyqAttempts(attempts: StudentReportQuestionBankAttempt[] = []) {
  return attempts.filter((attempt) => attempt.source === "EXACT_PYQ_IMPORT");
}

function exactPyqSignal(attempts: StudentReportQuestionBankAttempt[] = []) {
  const exactAttempts = exactPyqAttempts(attempts);
  const correct = exactAttempts.filter((attempt) => attempt.isCorrect).length;

  return {
    count: exactAttempts.length,
    correct,
    accuracyPercent: questionBankAccuracy(correct, exactAttempts.length),
    hasIncorrect: exactAttempts.some((attempt) => !attempt.isCorrect),
  };
}

function hasStarted(progress?: StudentReportProgress, questionBankAttempts: StudentReportQuestionBankAttempt[] = []) {
  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      progress?.labCompleted ||
      progress?.mcqAttempted ||
      progress?.meTimeCompletedAt ||
      questionBankAttempts.length
  );
}

function needsRecovery(progress?: StudentReportProgress) {
  return Boolean(
    progress?.revisitQueued ||
      progress?.talkBand === "Revisit" ||
      progress?.mcqOutcome === "Revisit" ||
      progress?.confidence === "Shaky"
  );
}

function needsRecoveryFromReportRow(
  progress?: StudentReportProgress,
  questionBankAttempts: StudentReportQuestionBankAttempt[] = []
) {
  return needsRecovery(progress) || questionBankAttempts.some((attempt) => !attempt.isCorrect);
}

function hasTeacherDoubt(progress?: StudentReportProgress) {
  return Boolean(
    progress?.teacherDoubtCategory &&
      progress?.teacherDoubtReason &&
      progress?.teacherDoubtRepairAction &&
      progress?.teacherDoubtMasteryCheck
  );
}

function hasCommand(progress?: StudentReportProgress, questionBankAttempts: StudentReportQuestionBankAttempt[] = []) {
  return Boolean(
    !needsRecoveryFromReportRow(progress, questionBankAttempts) &&
      (progress?.confidence === "Command" ||
        progress?.mcqOutcome === "Command" ||
        (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= 75))
  );
}

function latestTeacherDoubtSignal(states: Array<StudentReportProgress | undefined>) {
  const completed = states
    .filter((state): state is StudentReportProgress => hasTeacherDoubt(state) && !hasCommand(state))
    .sort((left, right) => {
      const leftTime = Date.parse(left.updatedAt ?? left.teacherDoubtMasteryCheck ?? "");
      const rightTime = Date.parse(right.updatedAt ?? right.teacherDoubtMasteryCheck ?? "");
      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    });
  const latest = completed[0];

  return {
    teacherDoubtCount: completed.length,
    latestTeacherDoubtCategory: latest?.teacherDoubtCategory ?? null,
    latestTeacherDoubtAction: latest?.teacherDoubtRepairAction ?? null,
  };
}

const meTimeMoodLabels: Record<SubjectMeTimeMood, string> = {
  calm: "Calm start saved",
  focused: "Focused start saved",
  tired: "Tired: reset before class",
  overloaded: "Overloaded: reduce load",
  "low-confidence": "Low confidence: warm-up needed",
  "exam-stress": "Exam stress: grounding needed",
};

function latestMeTimeSignal(states: Array<StudentReportProgress | undefined>) {
  const completed = states
    .filter((state): state is StudentReportProgress => Boolean(state?.meTimeCompletedAt))
    .sort((left, right) => {
      const leftTime = Date.parse(left.meTimeCompletedAt ?? "");
      const rightTime = Date.parse(right.meTimeCompletedAt ?? "");
      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    });
  const latest = completed[0];
  const mood = latest?.meTimeMood ?? null;

  return {
    latestMeTimeMood: mood,
    latestMeTimeResetPlan: latest?.meTimeResetPlan ?? null,
    readinessSignal: mood ? meTimeMoodLabels[mood] : "Me-time pending",
  };
}

function currentAffairsUnlocked(
  subject: StudentReportSubject,
  progress: StudentReportProgressMap,
  questionBankAttempts: StudentReportQuestionBankAttempt[] = []
) {
  return getCurrentAffairsForSubject(subject.slug).filter((item) =>
    hasStarted(progress[String(item.linkedDay)], attemptsForDay(questionBankAttempts, item.linkedDay))
  ).length;
}

function weeklyWindowCount(subject: StudentReportSubject) {
  return new Set(subject.sessions.map((session) => session.week)).size;
}

function buildReportWindow(
  id: string,
  title: string,
  range: string,
  subjectSessions: Array<{
    subject: StudentReportSubject;
    sessions: SubjectSession[];
    progress: StudentReportProgressMap;
    questionBankAttempts?: StudentReportQuestionBankAttempt[];
  }>
): StudentReportWindow {
  const dayRows = subjectSessions.flatMap(({ subject, sessions, progress, questionBankAttempts = [] }) =>
    sessions.map((session) => ({
      subject,
      session,
      progress: progress[String(session.day)],
      questionBankAttempts: attemptsForDay(questionBankAttempts, session.day),
    }))
  );
  const startedDays = dayRows.filter((row) => hasStarted(row.progress, row.questionBankAttempts)).length;
  const watchedDays = dayRows.filter((row) => row.progress?.watched).length;
  const recallScores = dayRows
    .map((row) => row.progress?.talkScore)
    .filter((score): score is number => typeof score === "number");
  const mcqScores = dayRows
    .map((row) => row.progress?.mcqScorePercent)
    .filter((score): score is number => typeof score === "number");
  const recoveryItems = dayRows.filter((row) =>
    needsRecoveryFromReportRow(row.progress, row.questionBankAttempts)
  ).length;
  const commandDays = dayRows.filter((row) => hasCommand(row.progress, row.questionBankAttempts)).length;
  const teacherDoubtCount = dayRows.filter(
    (row) => hasTeacherDoubt(row.progress) && !hasCommand(row.progress, row.questionBankAttempts)
  ).length;
  const meTimeChecks = dayRows.filter((row) => row.progress?.meTimeCompletedAt).length;
  const questionBankAttemptsCount = dayRows.reduce((sum, row) => sum + row.questionBankAttempts.length, 0);
  const questionBankCorrect = dayRows.reduce(
    (sum, row) => sum + row.questionBankAttempts.filter((attempt) => attempt.isCorrect).length,
    0
  );
  const exactPyqAttemptsCount = dayRows.reduce(
    (sum, row) => sum + exactPyqAttempts(row.questionBankAttempts).length,
    0
  );
  const exactPyqCorrect = dayRows.reduce(
    (sum, row) => sum + exactPyqAttempts(row.questionBankAttempts).filter((attempt) => attempt.isCorrect).length,
    0
  );
  const hasIncorrectExactPyq = dayRows.some((row) => exactPyqSignal(row.questionBankAttempts).hasIncorrect);
  const currentAffairsUnlocked = subjectSessions.reduce((sum, { subject, sessions, progress, questionBankAttempts = [] }) => {
    const daySet = new Set(sessions.map((session) => session.day));
    return (
      sum +
      getCurrentAffairsForSubject(subject.slug).filter(
        (item) =>
          daySet.has(item.linkedDay) &&
          hasStarted(progress[String(item.linkedDay)], attemptsForDay(questionBankAttempts, item.linkedDay))
      ).length
    );
  }, 0);
  const averageRecall = average(recallScores);
  const averageMcq = average(mcqScores);
  const completionRatio = dayRows.length ? startedDays / dayRows.length : 0;
  const verdict =
    startedDays === 0
      ? "No evidence yet"
      : teacherDoubtCount > 0
        ? "AI repair active"
        : hasIncorrectExactPyq
          ? "Exact PYQ repair active"
        : recoveryItems > 0
          ? "Recovery active"
          : commandDays > 0 && completionRatio >= 0.35
            ? "Command forming"
            : "Evidence forming";
  const nextAction =
    teacherDoubtCount > 0
      ? "Clear the latest AI teacher gap before increasing difficulty."
      : hasIncorrectExactPyq
        ? "Repair the missed exact PYQ demand before adding new load."
      : recoveryItems > 0
        ? "Clear one recovery item before adding new load."
        : startedDays === 0
          ? "Start one subject day to generate the first report row."
          : averageRecall !== null && averageRecall < 95
            ? "Run one more Talk check to move recall toward 95 percent."
            : averageMcq === null && questionBankAttemptsCount === 0
              ? "Add MCQ evidence to complete the report cycle."
              : "Continue the next planned topic and keep me-time saved.";

  return {
    id,
    title,
    range,
    subjectCount: subjectSessions.length,
    totalDays: dayRows.length,
    startedDays,
    watchedDays,
    recallAttempts: recallScores.length,
    averageRecall,
    mcqSets: dayRows.filter((row) => row.progress?.mcqCompleted).length,
    averageMcq,
    questionBankAttempts: questionBankAttemptsCount,
    questionBankCorrect,
    questionBankAccuracyPercent: questionBankAccuracy(questionBankCorrect, questionBankAttemptsCount),
    exactPyqAttempts: exactPyqAttemptsCount,
    exactPyqCorrect,
    exactPyqAccuracyPercent: questionBankAccuracy(exactPyqCorrect, exactPyqAttemptsCount),
    recoveryItems,
    commandDays,
    teacherDoubtCount,
    meTimeChecks,
    currentAffairsUnlocked,
    verdict,
    nextAction,
  };
}

function buildWeeklyReportWindows(
  progressBySubject: Record<string, StudentReportProgressMap>,
  questionBankAttemptsBySubject: StudentReportQuestionBankAttemptMap = {}
) {
  const weekNumbers = Array.from(
    new Set(studentReportSubjects.flatMap((subject) => subject.sessions.map((session) => session.week)))
  ).sort((left, right) => left - right);

  return weekNumbers.map((weekNumber) =>
    buildReportWindow(
      `all-subject-week-${weekNumber}`,
      `All-subject Week ${weekNumber}`,
      `Week ${weekNumber} across active subjects`,
      studentReportSubjects.map((subject) => ({
        subject,
        sessions: subject.sessions.filter((session) => session.week === weekNumber),
        progress: progressBySubject[subject.slug] ?? {},
        questionBankAttempts: questionBankAttemptsBySubject[subject.slug] ?? [],
      }))
    )
  );
}

function buildMonthlyReportWindow(
  progressBySubject: Record<string, StudentReportProgressMap>,
  questionBankAttemptsBySubject: StudentReportQuestionBankAttemptMap = {}
) {
  return buildReportWindow(
    "all-subject-month",
    "All-subject monthly report",
    "Full UPSC subject path",
    studentReportSubjects.map((subject) => ({
      subject,
      sessions: subject.sessions,
      progress: progressBySubject[subject.slug] ?? {},
      questionBankAttempts: questionBankAttemptsBySubject[subject.slug] ?? [],
    }))
  );
}

export function readLocalStudentReportProgress(subjectSlug: string): StudentReportProgressMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(`sarit-upsc-${subjectSlug}-progress-v1`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StudentReportProgressMap) : {};
  } catch {
    return {};
  }
}

export function buildStudentSubjectReport(
  subject: StudentReportSubject,
  progress: StudentReportProgressMap,
  questionBankAttempts: StudentReportQuestionBankAttempt[] = []
): StudentSubjectReport {
  const rows = subject.sessions.map((session) => ({
    session,
    progress: progress[String(session.day)],
    questionBankAttempts: attemptsForDay(questionBankAttempts, session.day),
  }));
  const states = rows.map((row) => row.progress);
  const startedDays = rows.filter((row) => hasStarted(row.progress, row.questionBankAttempts)).length;
  const watchedDays = states.filter((state) => state?.watched).length;
  const recallScores = states
    .map((state) => state?.talkScore)
    .filter((score): score is number => typeof score === "number");
  const mcqScores = states
    .map((state) => state?.mcqScorePercent)
    .filter((score): score is number => typeof score === "number");
  const recoveryItems = rows.filter((row) => needsRecoveryFromReportRow(row.progress, row.questionBankAttempts)).length;
  const commandDays = rows.filter((row) => hasCommand(row.progress, row.questionBankAttempts)).length;
  const mcqSets = states.filter((state) => state?.mcqCompleted).length;
  const meTimeChecks = states.filter((state) => state?.meTimeCompletedAt).length;
  const questionBankAttemptsCount = rows.reduce((sum, row) => sum + row.questionBankAttempts.length, 0);
  const questionBankCorrect = rows.reduce(
    (sum, row) => sum + row.questionBankAttempts.filter((attempt) => attempt.isCorrect).length,
    0
  );
  const exactPyqAttemptsCount = rows.reduce((sum, row) => sum + exactPyqAttempts(row.questionBankAttempts).length, 0);
  const exactPyqCorrect = rows.reduce(
    (sum, row) => sum + exactPyqAttempts(row.questionBankAttempts).filter((attempt) => attempt.isCorrect).length,
    0
  );
  const hasIncorrectExactPyq = rows.some((row) => exactPyqSignal(row.questionBankAttempts).hasIncorrect);
  const teacherDoubtSignal = latestTeacherDoubtSignal(states);
  const meTimeSignal = latestMeTimeSignal(states);
  const averageRecall = average(recallScores);
  const averageMcq = average(mcqScores);
  const completionRatio = subject.sessions.length ? startedDays / subject.sessions.length : 0;
  const monthlyVerdict =
    startedDays === 0
      ? "No evidence yet"
      : hasIncorrectExactPyq
        ? "Exact PYQ repair"
      : recoveryItems > 0
        ? "Repair active"
        : commandDays > 0 && completionRatio >= 0.35
          ? "Command forming"
          : "Evidence forming";
  const nextAction =
    teacherDoubtSignal.teacherDoubtCount > 0 && teacherDoubtSignal.latestTeacherDoubtAction
      ? teacherDoubtSignal.latestTeacherDoubtAction
      : hasIncorrectExactPyq
        ? "Repair the missed exact PYQ demand before opening the next day."
      : recoveryItems > 0
      ? "Clear the first recovery item before adding new load."
      : startedDays === 0
        ? "Start Day 1 to create the baseline report."
        : averageRecall !== null && averageRecall < 95
          ? "Use Talk once more to push recall toward 95 percent."
          : mcqSets === 0 && questionBankAttemptsCount === 0
            ? "Add MCQ evidence for this subject."
            : "Continue the next scheduled topic.";

  return {
    slug: subject.slug,
    title: subject.title,
    window: subject.window,
    route: subject.route,
    totalDays: subject.sessions.length,
    startedDays,
    watchedDays,
    recallAttempts: recallScores.length,
    averageRecall,
    mcqSets,
    averageMcq,
    questionBankAttempts: questionBankAttemptsCount,
    questionBankCorrect,
    questionBankAccuracyPercent: questionBankAccuracy(questionBankCorrect, questionBankAttemptsCount),
    exactPyqAttempts: exactPyqAttemptsCount,
    exactPyqCorrect,
    exactPyqAccuracyPercent: questionBankAccuracy(exactPyqCorrect, exactPyqAttemptsCount),
    recoveryItems,
    commandDays,
    meTimeChecks,
    ...teacherDoubtSignal,
    ...meTimeSignal,
    currentAffairsUnlocked: currentAffairsUnlocked(subject, progress, questionBankAttempts),
    weeklyWindowsGenerated: weeklyWindowCount(subject),
    monthlyVerdict,
    nextAction,
  };
}

export function buildUpscStudentReportSnapshot(
  progressBySubject: Record<string, StudentReportProgressMap>,
  questionBankAttemptsBySubject: StudentReportQuestionBankAttemptMap = {}
): UpscStudentReportSnapshot {
  const subjects = studentReportSubjects.map((subject) =>
    buildStudentSubjectReport(
      subject,
      progressBySubject[subject.slug] ?? {},
      questionBankAttemptsBySubject[subject.slug] ?? []
    )
  );
  const weekly = buildWeeklyReportWindows(progressBySubject, questionBankAttemptsBySubject);
  const monthly = buildMonthlyReportWindow(progressBySubject, questionBankAttemptsBySubject);
  const allRecallScores = subjects
    .map((subject) => subject.averageRecall)
    .filter((score): score is number => typeof score === "number");
  const allMcqScores = subjects
    .map((subject) => subject.averageMcq)
    .filter((score): score is number => typeof score === "number");
  const totalDays = subjects.reduce((sum, subject) => sum + subject.totalDays, 0);
  const startedDays = subjects.reduce((sum, subject) => sum + subject.startedDays, 0);
  const recoveryItems = subjects.reduce((sum, subject) => sum + subject.recoveryItems, 0);
  const teacherDoubtCount = subjects.reduce((sum, subject) => sum + subject.teacherDoubtCount, 0);
  const questionBankAttempts = subjects.reduce((sum, subject) => sum + subject.questionBankAttempts, 0);
  const questionBankCorrect = subjects.reduce((sum, subject) => sum + subject.questionBankCorrect, 0);
  const exactPyqAttemptsCount = subjects.reduce((sum, subject) => sum + subject.exactPyqAttempts, 0);
  const exactPyqCorrect = subjects.reduce((sum, subject) => sum + subject.exactPyqCorrect, 0);
  const startedSubjects = subjects.filter((subject) => subject.startedDays > 0);
  const strongestSubject =
    [...startedSubjects].sort(
      (left, right) =>
        right.commandDays - left.commandDays ||
        right.startedDays / right.totalDays - left.startedDays / left.totalDays
    )[0]?.title ?? "Baseline pending";
  const weakestSubject =
    [...subjects].sort(
      (left, right) =>
        right.recoveryItems - left.recoveryItems ||
        left.startedDays / left.totalDays - right.startedDays / right.totalDays
    )[0]?.title ?? "Baseline pending";
  const weeklyFocus = weekly.find((window) => window.startedDays > 0 || window.recoveryItems > 0 || window.teacherDoubtCount > 0) ?? weekly[0];
  const growthBaseline = startedSubjects[0]
    ? `${startedSubjects[0].title}: ${startedSubjects[0].startedDays}/${startedSubjects[0].totalDays} days started`
    : "No subject baseline yet";
  const growthNow =
    teacherDoubtCount > 0
      ? `${teacherDoubtCount} AI teacher gap${teacherDoubtCount === 1 ? "" : "s"} active`
      : recoveryItems > 0
        ? `${recoveryItems} recovery item${recoveryItems === 1 ? "" : "s"} across subjects`
        : startedDays > 0
          ? `${startedDays}/${totalDays} planned days have evidence`
          : "Start the first daily loop to create evidence";

  return {
    subjects,
    weekly,
    monthly,
    autoReport: {
      weeklyReportId: weeklyFocus?.id ?? "all-subject-week-1",
      monthlyReportId: monthly.id,
      cadence: "Weekly report rebuilds from each active subject week; monthly report rebuilds from the full UPSC plan.",
      evidenceRule:
        "Only saved learning evidence is counted: recall, MCQ, question-bank solved ledger, exact imported PYQ demand drills, recovery, AI teacher gaps, me-time, and covered-topic current affairs.",
      growthBaseline,
      growthNow,
      nextWeeklyAction: weeklyFocus?.nextAction ?? "Start one subject day to generate the first weekly report row.",
      nextMonthlyAction: monthly.nextAction,
      studentPromise: "No manual spreadsheet: every report is regenerated from the learner's saved daily loop evidence.",
    },
    totals: {
      totalDays,
      startedDays,
      watchedDays: subjects.reduce((sum, subject) => sum + subject.watchedDays, 0),
      commandDays: subjects.reduce((sum, subject) => sum + subject.commandDays, 0),
      recoveryItems,
      teacherDoubtCount,
      meTimeChecks: subjects.reduce((sum, subject) => sum + subject.meTimeChecks, 0),
      currentAffairsUnlocked: subjects.reduce((sum, subject) => sum + subject.currentAffairsUnlocked, 0),
      weeklyWindowsGenerated: subjects.reduce((sum, subject) => sum + subject.weeklyWindowsGenerated, 0),
      averageRecall: average(allRecallScores),
      averageMcq: average(allMcqScores),
      questionBankAttempts,
      questionBankCorrect,
      questionBankAccuracyPercent: questionBankAccuracy(questionBankCorrect, questionBankAttempts),
      exactPyqAttempts: exactPyqAttemptsCount,
      exactPyqCorrect,
      exactPyqAccuracyPercent: questionBankAccuracy(exactPyqCorrect, exactPyqAttemptsCount),
      growthPercent: totalDays ? Math.round((startedDays / totalDays) * 100) : 0,
    },
    growth: {
      startedFrom: growthBaseline,
      currentPosition: growthNow,
      strongestSubject,
      weakestSubject,
    },
  };
}
