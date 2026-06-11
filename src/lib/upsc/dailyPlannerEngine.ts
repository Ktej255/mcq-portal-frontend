import type { QuestionBankAttempt } from "@/lib/upsc/questionBankEngine";
import type { StudentProfile } from "@/lib/upsc/studentProfile";
import type { SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress, SubjectMeTimeMood } from "@/lib/upsc/useSubjectProgress";

export type DailyPlannerProgress = SubjectDayProgress & {
  meTimeCompletedAt?: string;
  meTimeMood?: SubjectMeTimeMood;
};

export type DailyPlannerQuestionBankAttempt = Pick<
  QuestionBankAttempt,
  "subjectSlug" | "linkedDay" | "difficulty" | "isCorrect" | "solvedAt"
> &
  Partial<Pick<QuestionBankAttempt, "source">>;

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
  nextSessionProof: {
    sourceDay: number;
    targetDay: number;
    decision: string;
    evidenceSummary: string;
    adjustmentRule: string;
    evidence: Array<{
      label: string;
      value: string;
      status: "used" | "missing" | "blocked";
    }>;
  };
  todayOriginProof: {
    sourceDay: number;
    targetDay: number;
    title: string;
    detail: string;
    href: string;
    statusLabel: string;
    evidenceSummary: string;
    evidence: Array<{
      label: string;
      value: string;
      status: "used" | "missing" | "blocked";
    }>;
  };
  automaticSessionHandoff: {
    id: string;
    subjectSlug: string;
    sourceDay: number;
    targetDay: number;
    targetTitle: string;
    statusLabel: string;
    href: string;
    actionLabel: string;
    canAdvance: boolean;
    evidenceUsed: number;
    evidenceMissing: number;
    blockers: number;
    readinessStatus: string;
    readinessScorePercent: number;
    learningGapTitle: string;
    revisionDueLabel: string;
    studentInstruction: string;
    reportHref: string;
    questionBankHref: string;
    proofRule: string;
  };
};

export type AutoSessionHandoffRecord = DailyPlannerDecision["automaticSessionHandoff"] & {
  generatedAt: string;
  selectedDay: number;
  selectedSubjectSlug: string;
};

type PlannerInput = {
  subjectSlug: string;
  sessions: SubjectSession[];
  selectedDay: number;
  progress: Record<string, DailyPlannerProgress | undefined>;
  profile?: StudentProfile | null;
  questionBankAttempts?: DailyPlannerQuestionBankAttempt[];
};

export const AUTO_SESSION_HANDOFF_STORAGE_KEY = "sarit-upsc-auto-session-handoff-v1";
const recallTarget = 95;
const mcqCommandTarget = 75;

function requiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAutoSessionHandoffRecord(input: unknown): AutoSessionHandoffRecord | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const sourceDay = requiredNumber(record.sourceDay);
  const targetDay = requiredNumber(record.targetDay);
  const evidenceUsed = requiredNumber(record.evidenceUsed);
  const evidenceMissing = requiredNumber(record.evidenceMissing);
  const blockers = requiredNumber(record.blockers);
  const readinessScorePercent = requiredNumber(record.readinessScorePercent);
  const selectedDay = requiredNumber(record.selectedDay);
  const requiredFields = {
    id: requiredText(record.id),
    subjectSlug: requiredText(record.subjectSlug),
    targetTitle: requiredText(record.targetTitle),
    statusLabel: requiredText(record.statusLabel),
    href: requiredText(record.href),
    actionLabel: requiredText(record.actionLabel),
    readinessStatus: requiredText(record.readinessStatus),
    learningGapTitle: requiredText(record.learningGapTitle),
    revisionDueLabel: requiredText(record.revisionDueLabel),
    studentInstruction: requiredText(record.studentInstruction),
    reportHref: requiredText(record.reportHref),
    questionBankHref: requiredText(record.questionBankHref),
    proofRule: requiredText(record.proofRule),
    generatedAt: requiredText(record.generatedAt),
    selectedSubjectSlug: requiredText(record.selectedSubjectSlug),
  };

  if (
    Object.values(requiredFields).some((value) => !value) ||
    sourceDay === null ||
    targetDay === null ||
    evidenceUsed === null ||
    evidenceMissing === null ||
    blockers === null ||
    readinessScorePercent === null ||
    selectedDay === null ||
    typeof record.canAdvance !== "boolean"
  ) {
    return null;
  }

  return {
    ...requiredFields,
    sourceDay,
    targetDay,
    canAdvance: record.canAdvance,
    evidenceUsed,
    evidenceMissing,
    blockers,
    readinessScorePercent,
    selectedDay,
  };
}

export function readLocalAutoSessionHandoff(): AutoSessionHandoffRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(AUTO_SESSION_HANDOFF_STORAGE_KEY) || "null");
    return parseAutoSessionHandoffRecord(parsed);
  } catch {
    return null;
  }
}

function attemptsForDay(input: Pick<PlannerInput, "questionBankAttempts">, day: number) {
  return (input.questionBankAttempts ?? []).filter((attempt) => attempt.linkedDay === day);
}

function questionBankPracticeSignal(attempts: DailyPlannerQuestionBankAttempt[] = []) {
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const exactPyqAttempts = attempts.filter((attempt) => attempt.source === "EXACT_PYQ_IMPORT");
  const exactPyqCorrect = exactPyqAttempts.filter((attempt) => attempt.isCorrect).length;
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : null;

  return {
    count: attempts.length,
    correct,
    exactPyqCount: exactPyqAttempts.length,
    exactPyqCorrect,
    hasExactPyqEvidence: exactPyqAttempts.length > 0,
    hasIncorrectExactPyq: exactPyqAttempts.some((attempt) => !attempt.isCorrect),
    accuracy,
    hasEvidence: attempts.length > 0,
    hasIncorrect: attempts.some((attempt) => !attempt.isCorrect),
    isCommand: attempts.length > 0 && attempts.every((attempt) => attempt.isCorrect),
  };
}

function questionBankPracticeLabel(attempts: DailyPlannerQuestionBankAttempt[] = []) {
  const signal = questionBankPracticeSignal(attempts);
  if (!signal.hasEvidence) return null;
  if (signal.hasExactPyqEvidence) {
    return `Exact PYQ ${signal.exactPyqCount} solved / ${signal.exactPyqCorrect} clear`;
  }
  return `Question Bank ${signal.count} solved${signal.accuracy === null ? "" : ` / ${signal.accuracy}%`}`;
}

function hasStarted(progress?: DailyPlannerProgress, questionBankAttempts: DailyPlannerQuestionBankAttempt[] = []) {
  const moduleProgress = progress as
    | (DailyPlannerProgress & {
        moduleProgress?: Record<string, { currentMasteryPercent?: number; gapFilledPercent?: number }>;
      })
    | undefined;
  const moduleEvidence = Object.values(moduleProgress?.moduleProgress ?? {}).some(
    (module) =>
      typeof module.currentMasteryPercent === "number" ||
      typeof module.gapFilledPercent === "number"
  );

  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      moduleEvidence ||
      progress?.labCompleted ||
      progress?.mcqAttempted ||
      questionBankAttempts.length
  );
}

function correctedTalkHref(progress?: DailyPlannerProgress) {
  const recoveryProgress = progress as
    | (DailyPlannerProgress & {
        recoveryCompleted?: boolean;
        recoveryStatus?: string;
        recoveryNextRoute?: string;
      })
    | undefined;
  const href = progress?.mcqNextRoute ?? recoveryProgress?.recoveryNextRoute ?? "";
  const isCorrectedTalkReady = Boolean(
    progress?.mcqOutcome === "Revisit" &&
      progress?.revisitQueued === false &&
      recoveryProgress?.recoveryCompleted &&
      recoveryProgress.recoveryStatus === "talk-ready" &&
      href.includes("/talk")
  );

  return isCorrectedTalkReady ? href : null;
}

function correctedTalkActionLabel(progress?: DailyPlannerProgress) {
  const recoveryProgress = progress as
    | (DailyPlannerProgress & {
        recoveryNextActionLabel?: string;
      })
    | undefined;

  return progress?.mcqNextActionLabel ?? recoveryProgress?.recoveryNextActionLabel ?? "Explain corrected answer";
}

function needsRecovery(progress?: DailyPlannerProgress, questionBankAttempts: DailyPlannerQuestionBankAttempt[] = []) {
  return Boolean(
    !correctedTalkHref(progress) &&
      (progress?.revisitQueued ||
      progress?.talkBand === "Revisit" ||
      progress?.mcqOutcome === "Revisit" ||
      progress?.confidence === "Shaky" ||
      questionBankPracticeSignal(questionBankAttempts).hasIncorrect)
  );
}

function hasCommand(progress?: DailyPlannerProgress, questionBankAttempts: DailyPlannerQuestionBankAttempt[] = []) {
  return Boolean(
    !needsRecovery(progress, questionBankAttempts) &&
      (progress?.confidence === "Command" ||
        progress?.mcqOutcome === "Command" ||
        (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= mcqCommandTarget) ||
        questionBankPracticeSignal(questionBankAttempts).isCommand)
  );
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function weakSkillLabel(progress?: DailyPlannerProgress) {
  const progressWithRubric = progress as
    | (DailyPlannerProgress & {
        recoveryWeakSkill?: string;
        recoveryDiagnosisSummary?: string;
        talkRepairHints?: string[];
        talkRubric?: Array<{ label: string; status?: string }>;
      })
    | undefined;

  return (
    progressWithRubric?.recoveryWeakSkill ??
    progressWithRubric?.talkRubric?.find((item) => item.status && item.status !== "Ready")?.label ??
    null
  );
}

function repairDetail(progress?: DailyPlannerProgress) {
  const progressWithRepair = progress as
    | (DailyPlannerProgress & {
        recoveryDiagnosisSummary?: string;
        talkRepairHints?: string[];
        mcqReviewSummary?: string;
      })
    | undefined;

  return (
    progressWithRepair?.recoveryDiagnosisSummary ??
    progressWithRepair?.talkRepairHints?.[0] ??
    progressWithRepair?.mcqReviewSummary ??
    "The next lesson should wait until the weak recall or MCQ signal is corrected."
  );
}

function routeFor(subjectSlug: string, room: "watch" | "talk" | "mcq-readiness" | "track" | "revisit", day: number) {
  if (room === "track") return `/upsc/${subjectSlug}/track?day=${day}`;
  return `/upsc/${subjectSlug}/${room}?day=${day}`;
}

function findSession(sessions: SubjectSession[], day: number) {
  return sessions.find((session) => session.day === day) ?? sessions[0];
}

function findCorrectedTalkDue(input: PlannerInput) {
  return input.sessions
    .map((session) => {
      const progress = input.progress[String(session.day)];
      const href = correctedTalkHref(progress);
      if (!progress || !href) return null;
      return {
        session,
        progress,
        attempts: attemptsForDay(input, session.day),
        href,
        actionLabel: correctedTalkActionLabel(progress),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => left.session.day - right.session.day)[0];
}

function findRevisionDue(input: PlannerInput) {
  return input.sessions
    .map((source) => {
      const sourceProgress = input.progress[String(source.day)];
      const sourceAttempts = attemptsForDay(input, source.day);
      const dueDay = Math.min(source.day + 2, input.sessions.length);
      const due = findSession(input.sessions, dueDay);
      if (!hasStarted(sourceProgress, sourceAttempts) || hasCommand(sourceProgress, sourceAttempts)) return null;
      if (dueDay > input.selectedDay && !needsRecovery(sourceProgress, sourceAttempts)) return null;
      return { source, due, progress: sourceProgress, attempts: sourceAttempts, dueDay };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => {
      const leftUrgent = needsRecovery(left.progress, left.attempts) ? 0 : 1;
      const rightUrgent = needsRecovery(right.progress, right.attempts) ? 0 : 1;
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

  const correctedTalkDue = findCorrectedTalkDue(input);
  if (correctedTalkDue) {
    return {
      title: correctedTalkDue.actionLabel,
      detail: `Day ${correctedTalkDue.session.day}: short revision is saved. Explain the corrected answer before any fresh load opens.`,
      scoreLabel: "Repair saved",
      tone: "neutral",
    };
  }

  const active = input.progress[String(input.selectedDay)];
  const previous = input.progress[String(input.selectedDay - 1)];
  const activeAttempts = attemptsForDay(input, input.selectedDay);
  const previousAttempts = attemptsForDay(input, input.selectedDay - 1);
  const activeHasUnfinishedEvidence = hasStarted(active, activeAttempts) && !hasCommand(active, activeAttempts);
  const reference = revisionDue?.progress ?? (activeHasUnfinishedEvidence ? active : previous ?? active);
  const referenceAttempts =
    revisionDue?.attempts ?? (activeHasUnfinishedEvidence ? activeAttempts : previous ? previousAttempts : activeAttempts);
  const weakSkill = weakSkillLabel(reference);
  const referenceCorrectedTalkHref = correctedTalkHref(reference);

  if (referenceCorrectedTalkHref) {
    return {
      title: correctedTalkActionLabel(reference),
      detail: "Short revision is saved. The next step is to explain the corrected answer before any fresh load opens.",
      scoreLabel: "Repair saved",
      tone: "neutral",
    };
  }

  if (needsRecovery(reference, referenceAttempts)) {
    const score =
      typeof reference?.talkScore === "number"
        ? `${reference.talkScore}/100 recall`
        : typeof reference?.mcqScorePercent === "number"
          ? `${reference.mcqScorePercent}% MCQ`
          : questionBankPracticeLabel(referenceAttempts) ?? "Recovery active";
    if (questionBankPracticeSignal(referenceAttempts).hasIncorrect) {
      const exactPyqSignal = questionBankPracticeSignal(referenceAttempts);
      return {
        title: exactPyqSignal.hasIncorrectExactPyq ? "Exact PYQ trap repair" : "Question-bank trap repair",
        detail: exactPyqSignal.hasIncorrectExactPyq
          ? "An exact PYQ demand drill is incorrect, so the next step should repair the official-question trap before advancing."
          : "Solved-question evidence has an incorrect answer, so the next step should repair the trap before advancing.",
        scoreLabel: score,
        tone: "repair",
      };
    }
    return {
      title: weakSkill ? `${weakSkill} repair` : `Repair Day ${revisionDue?.source.day ?? input.selectedDay} before moving ahead`,
      detail: repairDetail(reference),
      scoreLabel: score,
      tone: "repair",
    };
  }

  if (typeof reference?.talkScore === "number" && reference.talkScore < recallTarget) {
    return {
      title: weakSkill ?? `${recallTarget - reference.talkScore} recall points missing`,
      detail: repairDetail(reference),
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

  if (!active?.baselineSavedAt && !active?.reflection?.trim() && typeof active?.talkScore !== "number") {
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
  const activeAttempts = attemptsForDay(input, input.selectedDay);
  const activeQuestionBankSignal = questionBankPracticeSignal(activeAttempts);
  const activeCorrectedTalkHref = correctedTalkHref(active);
  const correctedTalkDue = findCorrectedTalkDue(input);

  if (teacherDoubt) {
    return {
      title: `Solve Day ${teacherDoubt.day} ${teacherDoubt.category} gap`,
      detail: teacherDoubt.masteryCheck,
      href: teacherDoubt.href,
      actionLabel: labelForDoubtHref(teacherDoubt.href),
    };
  }

  if (revisionDue && needsRecovery(revisionDue.progress, revisionDue.attempts)) {
    return {
      title: `Repair Day ${revisionDue.source.day}`,
      detail: revisionDue.source.title,
      href: routeFor(input.subjectSlug, "revisit", revisionDue.source.day),
      actionLabel: "Open revisit",
    };
  }

  if (correctedTalkDue) {
    return {
      title: `Talk Day ${correctedTalkDue.session.day}`,
      detail: "Short revision is complete. Explain the corrected answer to close the MCQ repair cleanly.",
      href: correctedTalkDue.href,
      actionLabel: correctedTalkDue.actionLabel,
    };
  }

  if (activeCorrectedTalkHref) {
    return {
      title: `Talk Day ${input.selectedDay}`,
      detail: "Short revision is complete. Explain the corrected answer to close the MCQ repair cleanly.",
      href: activeCorrectedTalkHref,
      actionLabel: correctedTalkActionLabel(active),
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

  if (activeQuestionBankSignal.hasIncorrect || active?.mcqOutcome === "Revisit") {
    return {
      title: `Recover Day ${input.selectedDay}`,
      detail: activeQuestionBankSignal.hasIncorrectExactPyq
        ? "Exact PYQ practice has an official-question trap that needs a repair loop."
        : activeQuestionBankSignal.hasIncorrect
        ? "Question Bank has an incorrect trap that needs a repair loop."
        : "Practice result needs a repair loop.",
      href: routeFor(input.subjectSlug, "revisit", input.selectedDay),
      actionLabel: "Repair",
    };
  }

  if ((!active?.mcqCompleted || active.mcqOutcome === "Pending") && !activeQuestionBankSignal.hasEvidence) {
    return {
      title: `MCQ Day ${input.selectedDay}`,
      detail: "Clear the fresh practice batch before the next topic.",
      href: routeFor(input.subjectSlug, "mcq-readiness", input.selectedDay),
      actionLabel: "Open MCQs",
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
  const startedCount = input.sessions.filter((session) =>
    hasStarted(input.progress[String(session.day)], attemptsForDay(input, session.day))
  ).length;
  const commandCount = input.sessions.filter((session) =>
    hasCommand(input.progress[String(session.day)], attemptsForDay(input, session.day))
  ).length;
  const recallScores = states
    .map((item) => item?.talkScore)
    .filter((score): score is number => typeof score === "number");
  const mcqScores = states
    .map((item) => item?.mcqScorePercent)
    .filter((score): score is number => typeof score === "number");
  const averageRecall = average(recallScores);
  const averageMcq = average(mcqScores);
  const recentWindow = input.sessions.slice(Math.max(0, input.selectedDay - 7), input.selectedDay);
  const recentStarted = recentWindow.filter((session) =>
    hasStarted(input.progress[String(session.day)], attemptsForDay(input, session.day))
  ).length;
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
  const moduleProgress = progress as
    | (DailyPlannerProgress & {
        currentMasteryPercent?: number;
        moduleProgress?: Record<string, { currentMasteryPercent?: number }>;
      })
    | undefined;
  const moduleRecall = Boolean(
    typeof moduleProgress?.currentMasteryPercent === "number" ||
      Object.values(moduleProgress?.moduleProgress ?? {}).some(
        (module) => typeof module.currentMasteryPercent === "number"
      )
  );

  return Boolean(
    progress?.baselineSavedAt ||
      progress?.baselineKnowledge?.trim() ||
      progress?.reflection?.trim() ||
      typeof progress?.talkScore === "number" ||
      moduleRecall
  );
}

function buildSessionReadiness(
  input: PlannerInput,
  teacherDoubt: DailyPlannerDecision["teacherDoubt"]
): DailyPlannerDecision["sessionReadiness"] {
  const correctedTalkDue = findCorrectedTalkDue(input);
  const effectiveDay = correctedTalkDue?.session.day ?? input.selectedDay;
  const active = correctedTalkDue?.progress ?? input.progress[String(effectiveDay)];
  const activeAttempts = correctedTalkDue?.attempts ?? attemptsForDay(input, effectiveDay);
  const questionBankSignal = questionBankPracticeSignal(activeAttempts);
  const questionBankLabel = questionBankPracticeLabel(activeAttempts);
  const meTimeReady = Boolean(active?.meTimeCompletedAt);
  const recallReady = hasRecallBaseline(active);
  const watchReady = Boolean(active?.watched);
  const activeCorrectedTalkHref = correctedTalkHref(active);
  const activeCorrectedTalkLabel = correctedTalkActionLabel(active);
  const talkReady = typeof active?.talkScore === "number" && active.talkScore >= recallTarget;
  const mcqReady = Boolean(
    (active?.mcqCompleted && active.mcqOutcome !== "Pending") ||
      (questionBankSignal.hasEvidence && !questionBankSignal.hasIncorrect)
  );
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
      detail: mcqReady
        ? questionBankLabel ?? `${active?.mcqScorePercent ?? 0}% MCQ evidence saved.`
        : activeCorrectedTalkHref
          ? "Repair proof is saved. Corrected talk should run before fresh practice is retried."
        : questionBankSignal.hasIncorrect
          ? questionBankSignal.hasIncorrectExactPyq
            ? `${questionBankLabel}: repair exact PYQ trap.`
            : `${questionBankLabel}: repair incorrect trap.`
          : "Fresh MCQ evidence is still pending.",
      status: mcqReady
        ? "done"
        : activeCorrectedTalkHref
          ? "pending"
          : active?.mcqOutcome === "Revisit" || questionBankSignal.hasIncorrect
            ? "repair"
            : "pending",
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

  if (activeCorrectedTalkHref) {
    return {
      title: activeCorrectedTalkLabel,
      detail: "The MCQ repair note is saved. The student should now explain the corrected answer with the AI teacher.",
      href: activeCorrectedTalkHref,
      actionLabel: activeCorrectedTalkLabel,
      statusLabel: "Corrected talk",
      scorePercent,
      tone: "neutral",
      checklist,
    };
  }

  if (needsRecovery(active, activeAttempts)) {
    return {
      title: `Recovery is active for Day ${effectiveDay}`,
      detail: questionBankSignal.hasIncorrectExactPyq
        ? "The solved-question ledger has an incorrect exact PYQ trap, so the next session should stay inside revisit."
        : questionBankSignal.hasIncorrect
        ? "The solved-question ledger has an incorrect trap, so the next session should stay inside revisit."
        : "The next session should stay inside revisit until the weak signal is resolved.",
      href: routeFor(input.subjectSlug, "revisit", effectiveDay),
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
      href: routeFor(input.subjectSlug, "talk", effectiveDay),
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
      href: routeFor(input.subjectSlug, "watch", effectiveDay),
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
      href: routeFor(input.subjectSlug, "talk", effectiveDay),
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
      href: routeFor(input.subjectSlug, "mcq-readiness", effectiveDay),
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
    href: routeFor(input.subjectSlug, "track", effectiveDay),
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
  const correctedTalkDue = findCorrectedTalkDue(input);
  const effectiveDay = correctedTalkDue?.session.day ?? input.selectedDay;
  const active = correctedTalkDue?.progress ?? input.progress[String(effectiveDay)];
  const activeAttempts = correctedTalkDue?.attempts ?? attemptsForDay(input, effectiveDay);
  const questionBankSignal = questionBankPracticeSignal(activeAttempts);
  const currentSession = findSession(input.sessions, effectiveDay);
  const nextDay = Math.min(effectiveDay + 1, input.sessions.length);
  const nextSession = findSession(input.sessions, nextDay);
  const activeCorrectedTalkHref = correctedTalkDue?.href ?? correctedTalkHref(active);

  if (teacherDoubt) {
    return {
      title: `Hold Day ${teacherDoubt.day} for repair`,
      detail: `Tomorrow starts with the AI teacher's ${teacherDoubt.category} gap before any new topic opens.`,
      href: teacherDoubt.href,
      statusLabel: "Repair first",
    };
  }

  if (activeCorrectedTalkHref) {
    return {
      title: `Return Day ${currentSession.day} to corrected Talk`,
      detail: "Short revision is complete, but the corrected answer still needs one AI discussion before the next topic opens.",
      href: activeCorrectedTalkHref,
      statusLabel: "Corrected talk",
    };
  }

  if (needsRecovery(active, activeAttempts)) {
    return {
      title: `Repeat Day ${currentSession.day} before moving ahead`,
      detail: questionBankSignal.hasIncorrect
        ? questionBankSignal.hasIncorrectExactPyq
          ? `${currentSession.title} stays active because the exact PYQ ledger has an official-question trap.`
          : `${currentSession.title} stays active because the Question Bank ledger has an incorrect trap.`
        : `${currentSession.title} stays active because the latest evidence is still in recovery.`,
      href: routeFor(input.subjectSlug, "revisit", currentSession.day),
      statusLabel: "Recovery lock",
    };
  }

  if (!active || !hasStarted(active, activeAttempts) || !active.watched) {
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

  if ((!active.mcqCompleted || active.mcqOutcome === "Pending") && !questionBankSignal.hasEvidence) {
    return {
      title: `Attach Day ${currentSession.day} MCQs`,
      detail: "Class and recall evidence exist, but practice evidence is still missing.",
      href: routeFor(input.subjectSlug, "mcq-readiness", currentSession.day),
      statusLabel: "Practice pending",
    };
  }

  if (active.mcqOutcome === "Revisit" || questionBankSignal.hasIncorrect) {
    return {
      title: `Repair Day ${currentSession.day} MCQ traps`,
      detail: questionBankSignal.hasIncorrect
        ? questionBankSignal.hasIncorrectExactPyq
          ? "Exact PYQ result needs a short recovery loop before the next topic can safely open."
          : "Question Bank result needs a short recovery loop before the next topic can safely open."
        : "Practice result needs a short recovery loop before the next topic can safely open.",
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

function buildNextSessionProof(
  input: PlannerInput,
  tomorrowAdjustment: DailyPlannerDecision["tomorrowAdjustment"],
  teacherDoubt: DailyPlannerDecision["teacherDoubt"]
): DailyPlannerDecision["nextSessionProof"] {
  const correctedTalkDue = findCorrectedTalkDue(input);
  const effectiveDay = correctedTalkDue?.session.day ?? input.selectedDay;
  const active = correctedTalkDue?.progress ?? input.progress[String(effectiveDay)];
  const activeAttempts = correctedTalkDue?.attempts ?? attemptsForDay(input, effectiveDay);
  const questionBankSignal = questionBankPracticeSignal(activeAttempts);
  const questionBankLabel = questionBankPracticeLabel(activeAttempts);
  const currentSession = findSession(input.sessions, effectiveDay);
  const nextDay = Math.min(effectiveDay + 1, input.sessions.length);
  const targetDay = tomorrowAdjustment.statusLabel === "Advance" ? nextDay : currentSession.day;
  const activeCorrectedTalkHref = correctedTalkHref(active);
  const recentWindow = input.sessions.slice(Math.max(0, effectiveDay - 7), effectiveDay);
  const recentStarted = recentWindow.filter((session) =>
    hasStarted(input.progress[String(session.day)], attemptsForDay(input, session.day))
  ).length;
  const consistency = recentWindow.length ? Math.round((recentStarted / recentWindow.length) * 100) : 0;
  const recallValue =
    typeof active?.talkScore === "number"
      ? `Recall ${active.talkScore}/100`
      : active?.reflection?.trim()
        ? "Recall note saved"
        : "Recall baseline missing";
  const recallStatus =
    teacherDoubt ||
    needsRecovery(active, activeAttempts) ||
    (typeof active?.talkScore === "number" && active.talkScore < recallTarget)
      ? "blocked"
      : active?.reflection?.trim() || typeof active?.talkScore === "number"
        ? "used"
        : "missing";
  const practiceStatus =
    (!activeCorrectedTalkHref && active?.mcqOutcome === "Revisit") || questionBankSignal.hasIncorrect
      ? "blocked"
      : (active?.mcqCompleted && active.mcqOutcome !== "Pending") || questionBankSignal.hasEvidence
        ? "used"
        : "missing";
  const evidence: DailyPlannerDecision["nextSessionProof"]["evidence"] = [
    {
      label: "Mind-state",
      value: active?.meTimeCompletedAt ? `Saved ${active.meTimeMood ?? "ready"}` : "Me-time pending",
      status: active?.meTimeCompletedAt ? "used" : "missing",
    },
    {
      label: "Recall",
      value: teacherDoubt ? `AI gap: ${teacherDoubt.category}` : recallValue,
      status: recallStatus,
    },
    {
      label: "Class",
      value: active?.watched ? "Class watched" : "Class proof missing",
      status: active?.watched ? "used" : "missing",
    },
    {
      label: "Practice",
      value: questionBankLabel
        ? questionBankLabel
        : active?.mcqCompleted
        ? `${active.mcqOutcome ?? "Completed"}${typeof active.mcqScorePercent === "number" ? ` ${active.mcqScorePercent}%` : ""}`
        : "MCQ evidence missing",
      status: practiceStatus,
    },
    {
      label: "Consistency",
      value: `${recentStarted}/${recentWindow.length || 1} recent days started (${consistency}%)`,
      status: recentStarted > 0 ? "used" : "missing",
    },
  ];
  const blockedCount = evidence.filter((item) => item.status === "blocked").length;
  const missingCount = evidence.filter((item) => item.status === "missing").length;
  const evidenceSummary =
    blockedCount > 0
      ? `${blockedCount} blocker${blockedCount === 1 ? "" : "s"} changed tomorrow's route.`
      : missingCount > 0
        ? `${missingCount} missing evidence signal${missingCount === 1 ? "" : "s"} kept the plan conservative.`
        : "All required evidence is clear, so the next topic can open.";

  return {
    sourceDay: currentSession.day,
    targetDay,
    decision: tomorrowAdjustment.statusLabel,
    evidenceSummary,
    adjustmentRule: tomorrowAdjustment.detail,
    evidence,
  };
}

function buildTodayOriginProof(input: PlannerInput): DailyPlannerDecision["todayOriginProof"] {
  if (input.selectedDay <= 1) {
    return {
      sourceDay: 0,
      targetDay: 1,
      title: "Day 1 starts here",
      detail: "No yesterday evidence is required for the first subject day.",
      href: routeFor(input.subjectSlug, "watch", 1),
      statusLabel: "Subject start",
      evidenceSummary: "The subject starts with mind-state, recall baseline, class, discussion, and MCQ evidence.",
      evidence: [
        { label: "Yesterday", value: "No earlier day", status: "used" },
        { label: "Rule", value: "Start Day 1", status: "used" },
        { label: "Next proof", value: "Me-time and recall baseline", status: "missing" },
      ],
    };
  }

  const sourceDay = input.selectedDay - 1;
  const sourceSession = findSession(input.sessions, sourceDay);
  const progress = input.progress[String(sourceDay)];
  const sourceAttempts = attemptsForDay(input, sourceDay);
  const questionBankSignal = questionBankPracticeSignal(sourceAttempts);
  const questionBankLabel = questionBankPracticeLabel(sourceAttempts);
  const sourceCorrectedTalkHref = correctedTalkHref(progress);
  const sourceDoubt =
    progress && hasTeacherDoubt(progress)
      ? {
          category: progress.teacherDoubtCategory!,
          reason: progress.teacherDoubtReason!,
          repairAction: progress.teacherDoubtRepairAction!,
          masteryCheck: progress.teacherDoubtMasteryCheck!,
          href:
            progress.talkNextRoute ??
            (progress.talkUnlockStage === "mcq"
              ? routeFor(input.subjectSlug, "mcq-readiness", sourceDay)
              : routeFor(input.subjectSlug, "talk", sourceDay)),
        }
      : null;
  const commandReady = hasCommand(progress, sourceAttempts);
  const recallStatus =
    commandReady
      ? "used"
      : sourceDoubt ||
          needsRecovery(progress, sourceAttempts) ||
          (typeof progress?.talkScore === "number" && progress.talkScore < recallTarget)
      ? "blocked"
      : hasRecallBaseline(progress)
        ? "used"
        : "missing";
  const classStatus = progress?.watched || commandReady ? "used" : "missing";
  const practiceStatus =
    commandReady
      ? "used"
      : (!sourceCorrectedTalkHref && progress?.mcqOutcome === "Revisit") || questionBankSignal.hasIncorrect
      ? "blocked"
      : (progress?.mcqCompleted && progress.mcqOutcome !== "Pending") || questionBankSignal.hasEvidence
        ? "used"
        : "missing";
  const evidence: DailyPlannerDecision["todayOriginProof"]["evidence"] = [
    {
      label: "Mind-state",
      value: progress?.meTimeCompletedAt ? `Saved ${progress.meTimeMood ?? "ready"}` : "Yesterday me-time missing",
      status: progress?.meTimeCompletedAt ? "used" : "missing",
    },
    {
      label: "Recall",
      value: sourceDoubt
        ? `AI gap: ${sourceDoubt.category}`
        : typeof progress?.talkScore === "number"
          ? `Recall ${progress.talkScore}/100`
          : commandReady
            ? "Command recall accepted"
          : progress?.reflection?.trim()
            ? "Recall note saved"
            : "Recall baseline missing",
      status: recallStatus,
    },
    {
      label: "Class",
      value: progress?.watched
        ? `${sourceSession.title} watched`
        : commandReady
          ? "Command class gate accepted"
          : "Class proof missing",
      status: classStatus,
    },
    {
      label: "Practice",
      value: questionBankLabel
        ? questionBankLabel
        : progress?.mcqCompleted
        ? `${progress.mcqOutcome ?? "Completed"}${typeof progress.mcqScorePercent === "number" ? ` ${progress.mcqScorePercent}%` : ""}`
        : "MCQ evidence missing",
      status: practiceStatus,
    },
  ];

  if (!hasStarted(progress, sourceAttempts)) {
    return {
      sourceDay,
      targetDay: input.selectedDay,
      title: `Day ${sourceDay} evidence is missing`,
      detail: `Today is on Day ${input.selectedDay}, but the auto planner still needs Day ${sourceDay} proof before it can claim a true advance.`,
      href: routeFor(input.subjectSlug, "watch", sourceDay),
      statusLabel: "Manual selection",
      evidenceSummary: "Yesterday did not provide enough evidence, so the plan stays conservative.",
      evidence,
    };
  }

  if (sourceDoubt) {
    return {
      sourceDay,
      targetDay: sourceDay,
      title: `Day ${sourceDay} AI gap controls today`,
      detail: sourceDoubt.repairAction,
      href: sourceDoubt.href,
      statusLabel: "Yesterday repair",
      evidenceSummary: `Yesterday produced an AI ${sourceDoubt.category} gap, so new work should wait.`,
      evidence,
    };
  }

  if (sourceCorrectedTalkHref) {
    return {
      sourceDay,
      targetDay: sourceDay,
      title: `Day ${sourceDay} corrected Talk is next`,
      detail: correctedTalkActionLabel(progress),
      href: sourceCorrectedTalkHref,
      statusLabel: "Yesterday corrected talk",
      evidenceSummary: "Yesterday's short revision is saved, so the next route is corrected explanation, not another repair loop.",
      evidence,
    };
  }

  if (needsRecovery(progress, sourceAttempts)) {
    return {
      sourceDay,
      targetDay: sourceDay,
      title: `Day ${sourceDay} needs repair first`,
      detail: questionBankSignal.hasIncorrect
        ? questionBankSignal.hasIncorrectExactPyq
          ? "Exact PYQ practice has an official-question trap that needs repair first."
          : "Question Bank practice has an incorrect trap that needs repair first."
        : repairDetail(progress),
      href: routeFor(input.subjectSlug, "revisit", sourceDay),
      statusLabel: "Yesterday repair",
      evidenceSummary: "Yesterday has a recovery signal, so today's plan should repair before advancing.",
      evidence,
    };
  }

  if (hasCommand(progress, sourceAttempts)) {
    return {
      sourceDay,
      targetDay: input.selectedDay,
      title: `Day ${sourceDay} cleared, Day ${input.selectedDay} opens`,
      detail: `${sourceSession.title} has enough command evidence to justify today's next topic.`,
      href: routeFor(input.subjectSlug, "watch", input.selectedDay),
      statusLabel: "Auto advance",
      evidenceSummary: questionBankLabel
        ? `${questionBankLabel} helped clear yesterday, so the next subject day can open.`
        : "Yesterday's command evidence is strong enough for the next subject day.",
      evidence,
    };
  }

  if (!hasRecallBaseline(progress) || (typeof progress?.talkScore === "number" && progress.talkScore < recallTarget)) {
    return {
      sourceDay,
      targetDay: sourceDay,
      title: `Day ${sourceDay} recall proof is incomplete`,
      detail: "Yesterday cannot open a fresh topic until recall reaches command level.",
      href: routeFor(input.subjectSlug, "talk", sourceDay),
      statusLabel: "Yesterday recall",
      evidenceSummary: "Recall evidence is missing or below target, so the next route remains discussion-first.",
      evidence,
    };
  }

  if ((!progress?.mcqCompleted || progress.mcqOutcome === "Pending") && !questionBankSignal.hasEvidence) {
    return {
      sourceDay,
      targetDay: sourceDay,
      title: `Day ${sourceDay} MCQs are pending`,
      detail: "Yesterday has class and recall evidence, but practice proof is still required before a true advance.",
      href: routeFor(input.subjectSlug, "mcq-readiness", sourceDay),
      statusLabel: "Yesterday practice",
      evidenceSummary: "Practice evidence is missing, so the route stays on yesterday's MCQ gate.",
      evidence,
    };
  }

  return {
    sourceDay,
    targetDay: sourceDay,
    title: `Day ${sourceDay} remains under review`,
    detail: "Yesterday has partial evidence, so the planner keeps a conservative route until command is clear.",
    href: routeFor(input.subjectSlug, "track", sourceDay),
    statusLabel: "Review",
    evidenceSummary: "Partial evidence exists, but command is not yet proven.",
    evidence,
  };
}

function buildAutomaticSessionHandoff({
  input,
  learningGap,
  revision,
  sessionReadiness,
  tomorrowAdjustment,
  nextSessionProof,
}: {
  input: PlannerInput;
  learningGap: DailyPlannerDecision["learningGap"];
  revision: DailyPlannerDecision["revision"];
  sessionReadiness: DailyPlannerDecision["sessionReadiness"];
  tomorrowAdjustment: DailyPlannerDecision["tomorrowAdjustment"];
  nextSessionProof: DailyPlannerDecision["nextSessionProof"];
}): DailyPlannerDecision["automaticSessionHandoff"] {
  const evidenceUsed = nextSessionProof.evidence.filter((item) => item.status === "used").length;
  const evidenceMissing = nextSessionProof.evidence.filter((item) => item.status === "missing").length;
  const blockers = nextSessionProof.evidence.filter((item) => item.status === "blocked").length;
  const canAdvance = tomorrowAdjustment.statusLabel === "Advance" && blockers === 0 && evidenceMissing === 0;
  const targetSession = findSession(input.sessions, nextSessionProof.targetDay);
  const normalizedStatus = tomorrowAdjustment.statusLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id: `${input.subjectSlug}-d${nextSessionProof.sourceDay}-to-d${nextSessionProof.targetDay}-${normalizedStatus}`,
    subjectSlug: input.subjectSlug,
    sourceDay: nextSessionProof.sourceDay,
    targetDay: nextSessionProof.targetDay,
    targetTitle: targetSession.title,
    statusLabel: tomorrowAdjustment.statusLabel,
    href: tomorrowAdjustment.href,
    actionLabel: canAdvance ? `Open Day ${nextSessionProof.targetDay}` : sessionReadiness.actionLabel,
    canAdvance,
    evidenceUsed,
    evidenceMissing,
    blockers,
    readinessStatus: sessionReadiness.statusLabel,
    readinessScorePercent: sessionReadiness.scorePercent,
    learningGapTitle: learningGap.title,
    revisionDueLabel: revision.dueLabel,
    studentInstruction: canAdvance
      ? `Next session is ready: Day ${nextSessionProof.targetDay} opens because the required evidence is clear.`
      : blockers > 0
        ? `Do not open new load yet. Clear ${blockers} blocker${blockers === 1 ? "" : "s"} before moving ahead.`
        : evidenceMissing > 0
          ? `Complete ${evidenceMissing} missing evidence signal${evidenceMissing === 1 ? "" : "s"} before the next session changes.`
          : "Continue the current route until the planner records a clean advance.",
    reportHref: "/reports",
    questionBankHref: `/upsc/question-bank?subject=${input.subjectSlug}`,
    proofRule: "automatic-new-day-handoff-from-me-time-recall-class-discussion-mcq-revision-report",
  };
}

export function buildDailyPlannerDecision(input: PlannerInput): DailyPlannerDecision {
  const revisionDue = findRevisionDue(input);
  const teacherDoubt = findTeacherDoubtDue(input);
  const fallbackRevisionDay = Math.min(input.selectedDay + 2, input.sessions.length);
  const fallbackRevision = findSession(input.sessions, fallbackRevisionDay);
  const tomorrowAdjustment = buildTomorrowAdjustment(input, teacherDoubt);
  const learningGap = buildGap(input, revisionDue, teacherDoubt);
  const revision: DailyPlannerDecision["revision"] = revisionDue
    ? {
        title: teacherDoubt ? `Mastery check Day ${teacherDoubt.day}` : `Revise Day ${revisionDue.source.day}`,
        detail: teacherDoubt ? teacherDoubt.masteryCheck : `${revisionDue.source.title} is due before ${revisionDue.due.title}.`,
        href: teacherDoubt?.href ?? routeFor(input.subjectSlug, "revisit", revisionDue.source.day),
        dueLabel: teacherDoubt
          ? "AI gap"
          : needsRecovery(revisionDue.progress, revisionDue.attempts)
            ? "Due now"
            : `Day ${revisionDue.dueDay}`,
        urgent: Boolean(teacherDoubt) || needsRecovery(revisionDue.progress, revisionDue.attempts),
      }
    : {
        title: teacherDoubt ? `Mastery check Day ${teacherDoubt.day}` : `Next revision Day ${fallbackRevision.day}`,
        detail: teacherDoubt?.masteryCheck ?? fallbackRevision.title,
        href: teacherDoubt?.href ?? routeFor(input.subjectSlug, "revisit", fallbackRevision.day),
        dueLabel: teacherDoubt ? "AI gap" : `Day ${fallbackRevisionDay}`,
        urgent: Boolean(teacherDoubt),
      };
  const sessionReadiness = buildSessionReadiness(input, teacherDoubt);
  const nextSessionProof = buildNextSessionProof(input, tomorrowAdjustment, teacherDoubt);

  return {
    teacherDoubt,
    learningGap,
    revision,
    todayTask: buildTodayTask(input, revisionDue, teacherDoubt),
    growth: buildGrowth(input),
    sessionReadiness,
    tomorrowAdjustment,
    nextSessionProof,
    todayOriginProof: buildTodayOriginProof(input),
    automaticSessionHandoff: buildAutomaticSessionHandoff({
      input,
      learningGap,
      revision,
      sessionReadiness,
      tomorrowAdjustment,
      nextSessionProof,
    }),
  };
}
