"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Compass,
  Gauge,
  PlayCircle,
  RefreshCcw,
  Target,
  TimerReset,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographySessions } from "@/lib/upsc/plan";
import {
  formatRebuildRules,
  prelims2027Priorities,
  strategyExecutionTasks,
  strategyPracticeBlueprints,
  strategySprintCalendar,
  type StrategyExecutionTask,
} from "@/lib/upsc/prelims2027Strategy";
import { readLocalQuestionBankAttempts, type QuestionBankAttempt } from "@/lib/upsc/questionBankEngine";
import { subjectPlans, type SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

type RevisionSubject = {
  slug: string;
  title: string;
  window: string;
  href: string;
  trackHref: string;
  sessions: SubjectSession[];
};

type SubjectSummary = RevisionSubject & {
  watchedCount: number;
  reflectedCount: number;
  commandCount: number;
  aiGapCount: number;
  shakyCount: number;
  revisitCount: number;
  questionBankTrapCount: number;
  questionBankTrapDays: number;
  spacedRevisionCount: number;
  completionPercent: number;
  watchPercent: number;
  progress: Record<string, SubjectDayProgress>;
  questionBankAttempts: QuestionBankAttempt[];
  latestEvidenceDay: number;
  spacedRevisionItems: SpacedRevisionItem[];
  nextSession: SubjectSession;
  nextHref: string;
  nextLabel: string;
};

type SpacedRevisionItem = {
  session: SubjectSession;
  dueSession: SubjectSession;
  dueDay: number;
};

const revisionSubjects: RevisionSubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
    href: "/upsc/geography",
    trackHref: "/upsc/geography/track",
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
    href: `/upsc/${plan.slug}`,
    trackHref: `/upsc/${plan.slug}/track`,
    sessions: plan.sessions,
  })),
];

const strategyStorageKey = "sarit-upsc-prelims-2027-strategy-v1";
const revisionTaskPhases = new Set<StrategyExecutionTask["phase"]>(["Release", "Planner"]);

function storageKey(subjectSlug: string) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function readCompletedStrategyTasks() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(strategyStorageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.completedTasks)
      ? parsed.completedTasks.filter((taskId: unknown): taskId is string => typeof taskId === "string")
      : [];
  } catch {
    return [];
  }
}

function revisionTaskTone(phase: StrategyExecutionTask["phase"]) {
  if (phase === "Release") return "border-[#c8ded6] bg-[#eef8f2] text-[#085041]";
  if (phase === "Planner") return "border-[#d9c18f] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-white text-[#4f5e55]";
}

function readProgress(subjectSlug: string) {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey(subjectSlug));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, SubjectDayProgress>) : {};
  } catch {
    return {};
  }
}

function getSessionProgress(progress: Record<string, SubjectDayProgress>, session: SubjectSession) {
  return progress[String(session.day)];
}

function getQuestionBankAttemptsForSession(attempts: QuestionBankAttempt[], session: SubjectSession) {
  return attempts.filter((attempt) => attempt.linkedDay === session.day);
}

function getQuestionBankTrapAttempts(attempts: QuestionBankAttempt[]) {
  return attempts.filter((attempt) => !attempt.isCorrect);
}

function getQuestionBankSignal(attempts: QuestionBankAttempt[]) {
  return {
    hasIncorrect: attempts.some((attempt) => !attempt.isCorrect),
    isCommand: attempts.length > 0 && attempts.every((attempt) => attempt.isCorrect),
  };
}

function hasQuestionBankTrap(attempts: QuestionBankAttempt[], session: SubjectSession) {
  return getQuestionBankTrapAttempts(getQuestionBankAttemptsForSession(attempts, session)).length > 0;
}

function questionBankTrapDetail(attempts: QuestionBankAttempt[]) {
  const wrongAttempts = getQuestionBankTrapAttempts(attempts);
  const topics = Array.from(new Set(wrongAttempts.map((attempt) => attempt.topic).filter(Boolean))).slice(0, 2);
  const topicText = topics.length ? ` in ${topics.join(", ")}` : "";
  return `Question Bank ledger has ${wrongAttempts.length} incorrect answer${
    wrongAttempts.length === 1 ? "" : "s"
  }${topicText}. Repair before retesting.`;
}

function hasRevisionEvidence(progress: SubjectDayProgress | undefined, attempts: QuestionBankAttempt[]) {
  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      progress?.labCompleted ||
      progress?.mcqAttempted ||
      progress?.mcqCompleted ||
      attempts.length
  );
}

function hasRevisionCommandEvidence(progress: SubjectDayProgress | undefined, attempts: QuestionBankAttempt[]) {
  if (getQuestionBankSignal(attempts).hasIncorrect) return false;
  return Boolean(
    progress?.confidence === "Command" ||
      progress?.talkBand === "Command" ||
      progress?.mcqOutcome === "Command" ||
      (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= 75) ||
      getQuestionBankSignal(attempts).isCommand
  );
}

function isSpacedRevisionCleared(progress?: SubjectDayProgress) {
  return Boolean(progress?.revisitQueued === false && progress?.activePromptLabel === "Revisit");
}

function getLatestEvidenceDay(
  subject: RevisionSubject,
  progress: Record<string, SubjectDayProgress>,
  questionBankAttempts: QuestionBankAttempt[]
) {
  return subject.sessions.reduce((latest, session) => {
    const attempts = getQuestionBankAttemptsForSession(questionBankAttempts, session);
    return hasRevisionEvidence(getSessionProgress(progress, session), attempts) ? Math.max(latest, session.day) : latest;
  }, 0);
}

function getSpacedRevisionItems(
  subject: RevisionSubject,
  progress: Record<string, SubjectDayProgress>,
  questionBankAttempts: QuestionBankAttempt[],
  latestEvidenceDay: number
): SpacedRevisionItem[] {
  return subject.sessions
    .map((session) => {
      const item = getSessionProgress(progress, session);
      const attempts = getQuestionBankAttemptsForSession(questionBankAttempts, session);
      const dueDay = Math.min(session.day + 2, subject.sessions.length);
      const dueSession = subject.sessions.find((candidate) => candidate.day === dueDay) ?? session;
      if (!hasRevisionCommandEvidence(item, attempts) || isSpacedRevisionCleared(item) || latestEvidenceDay < dueDay) {
        return null;
      }
      return { session, dueSession, dueDay };
    })
    .filter((item): item is SpacedRevisionItem => Boolean(item));
}

function hasTeacherDoubtSignal(progress?: SubjectDayProgress) {
  return Boolean(
    progress?.teacherDoubtCategory?.trim() ||
      progress?.teacherDoubtReason?.trim() ||
      progress?.teacherDoubtRepairAction?.trim() ||
      progress?.teacherDoubtMasteryCheck?.trim()
  );
}

function hasActiveTeacherDoubt(progress?: SubjectDayProgress) {
  if (!hasTeacherDoubtSignal(progress)) return false;
  return !(
    progress?.confidence === "Command" ||
    progress?.talkBand === "Command" ||
    progress?.mcqOutcome === "Command" ||
    (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= 75)
  );
}

function teacherDoubtCategory(progress?: SubjectDayProgress) {
  return progress?.teacherDoubtCategory?.trim() || "Concept";
}

function teacherDoubtHref(subject: RevisionSubject, session: SubjectSession, progress?: SubjectDayProgress) {
  return progress?.talkNextRoute || `${subject.href}/talk?day=${session.day}`;
}

function getNextFocus(
  subject: RevisionSubject,
  progress: Record<string, SubjectDayProgress>,
  questionBankAttempts: QuestionBankAttempt[],
  spacedRevisionItems: SpacedRevisionItem[]
) {
  const teacherDoubt = subject.sessions.find((session) => hasActiveTeacherDoubt(getSessionProgress(progress, session)));
  if (teacherDoubt) {
    const item = getSessionProgress(progress, teacherDoubt);
    return {
      session: teacherDoubt,
      href: teacherDoubtHref(subject, teacherDoubt, item),
      label: `AI ${teacherDoubtCategory(item)} repair`,
    };
  }

  const questionBankTrap = subject.sessions.find((session) => hasQuestionBankTrap(questionBankAttempts, session));
  if (questionBankTrap) {
    return {
      session: questionBankTrap,
      href: `${subject.href}/revisit?day=${questionBankTrap.day}`,
      label: "Question Bank trap",
    };
  }

  const revisit = subject.sessions.find((session) => getSessionProgress(progress, session)?.revisitQueued);
  if (revisit) {
    return {
      session: revisit,
      href: `${subject.href}/revisit?day=${revisit.day}`,
      label: "Revisit queued",
    };
  }

  const shaky = subject.sessions.find((session) => getSessionProgress(progress, session)?.confidence === "Shaky");
  if (shaky) {
    return {
      session: shaky,
      href: `${subject.href}/talk?day=${shaky.day}`,
      label: "Shaky talk repair",
    };
  }

  const spacedRevision = spacedRevisionItems[0];
  if (spacedRevision) {
    return {
      session: spacedRevision.session,
      href: `${subject.href}/revisit?day=${spacedRevision.session.day}`,
      label: "Spaced revision due",
    };
  }

  const unfinished = subject.sessions.find((session) => !getSessionProgress(progress, session)?.reflection?.trim());
  if (unfinished) {
    return {
      session: unfinished,
      href: `${subject.href}/watch?day=${unfinished.day}`,
      label: "Next unfinished class",
    };
  }

  const commandDrill = subject.sessions[subject.sessions.length - 1];
  return {
    session: commandDrill,
    href: `${subject.trackHref}?day=${commandDrill.day}`,
    label: "Command review",
  };
}

function buildSummary(subject: RevisionSubject): SubjectSummary {
  const progress = readProgress(subject.slug);
  const questionBankAttempts = readLocalQuestionBankAttempts(subject.slug);
  const latestEvidenceDay = getLatestEvidenceDay(subject, progress, questionBankAttempts);
  const spacedRevisionItems = getSpacedRevisionItems(subject, progress, questionBankAttempts, latestEvidenceDay);
  const watchedDays = subject.sessions.filter((session) => getSessionProgress(progress, session)?.watched);
  const reflectedDays = subject.sessions.filter((session) =>
    Boolean(getSessionProgress(progress, session)?.reflection?.trim())
  );
  const commandDays = subject.sessions.filter((session) => getSessionProgress(progress, session)?.confidence === "Command");
  const aiGapDays = subject.sessions.filter((session) => hasActiveTeacherDoubt(getSessionProgress(progress, session)));
  const shakyDays = subject.sessions.filter((session) => getSessionProgress(progress, session)?.confidence === "Shaky");
  const revisitDays = subject.sessions.filter((session) => getSessionProgress(progress, session)?.revisitQueued);
  const questionBankTrapAttempts = getQuestionBankTrapAttempts(questionBankAttempts);
  const questionBankTrapDays = subject.sessions.filter((session) => hasQuestionBankTrap(questionBankAttempts, session));
  const nextFocus = getNextFocus(subject, progress, questionBankAttempts, spacedRevisionItems);

  return {
    ...subject,
    watchedCount: watchedDays.length,
    reflectedCount: reflectedDays.length,
    commandCount: commandDays.length,
    aiGapCount: aiGapDays.length,
    shakyCount: shakyDays.length,
    revisitCount: revisitDays.length,
    questionBankTrapCount: questionBankTrapAttempts.length,
    questionBankTrapDays: questionBankTrapDays.length,
    spacedRevisionCount: spacedRevisionItems.length,
    completionPercent: Math.round((reflectedDays.length / subject.sessions.length) * 100),
    watchPercent: Math.round((watchedDays.length / subject.sessions.length) * 100),
    progress,
    questionBankAttempts,
    latestEvidenceDay,
    spacedRevisionItems,
    nextSession: nextFocus.session,
    nextHref: nextFocus.href,
    nextLabel: nextFocus.label,
  };
}

function subjectTone(summary: SubjectSummary) {
  if (summary.aiGapCount > 0) return "border-[#ef9f27] bg-[#fff7ed]";
  if (summary.questionBankTrapCount > 0) return "border-[#ef9f27] bg-[#fff7ed]";
  if (summary.revisitCount > 0) return "border-[#ef9f27] bg-[#fff7ed]";
  if (summary.completionPercent >= 80) return "border-[#1d9e75] bg-[#e7f5ee]";
  if (summary.reflectedCount > 0 || summary.watchedCount > 0) return "border-[#dcd5c7] bg-[#fdfaf3]";
  return "border-[#dcd5c7] bg-[#fffdf8]";
}

export function UpscRevisionCommandRoom({
  initialSubjectSlug,
  initialDay,
}: {
  initialSubjectSlug?: string;
  initialDay?: number;
}) {
  const [summaries, setSummaries] = useState<SubjectSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [completedStrategyTasks, setCompletedStrategyTasks] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSummaries(revisionSubjects.map(buildSummary));
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncCompletedTasks = () => setCompletedStrategyTasks(readCompletedStrategyTasks());
    const timer = window.setTimeout(syncCompletedTasks, 0);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === strategyStorageKey) syncCompletedTasks();
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const totals = useMemo(() => {
    const totalDays = summaries.reduce((sum, subject) => sum + subject.sessions.length, 0);
    const watched = summaries.reduce((sum, subject) => sum + subject.watchedCount, 0);
    const reflected = summaries.reduce((sum, subject) => sum + subject.reflectedCount, 0);
    const command = summaries.reduce((sum, subject) => sum + subject.commandCount, 0);
    const aiGap = summaries.reduce((sum, subject) => sum + subject.aiGapCount, 0);
    const shaky = summaries.reduce((sum, subject) => sum + subject.shakyCount, 0);
    const revisit = summaries.reduce((sum, subject) => sum + subject.revisitCount, 0);
    const questionBankTrap = summaries.reduce((sum, subject) => sum + subject.questionBankTrapCount, 0);
    const spacedRevision = summaries.reduce((sum, subject) => sum + subject.spacedRevisionCount, 0);

    return {
      totalDays,
      watched,
      reflected,
      command,
      aiGap,
      shaky,
      revisit,
      questionBankTrap,
      spacedRevision,
      completionPercent: totalDays ? Math.round((reflected / totalDays) * 100) : 0,
      watchPercent: totalDays ? Math.round((watched / totalDays) * 100) : 0,
    };
  }, [summaries]);

  const focusQueue = useMemo(
    () =>
      summaries
        .flatMap((subject) =>
          subject.sessions
            .map((session) => {
              const item = getSessionProgress(subject.progress, session);
              const isAiGap = hasActiveTeacherDoubt(item);
              const questionBankAttempts = getQuestionBankAttemptsForSession(subject.questionBankAttempts, session);
              const questionBankTrapAttempts = getQuestionBankTrapAttempts(questionBankAttempts);
              const isQuestionBankTrap = questionBankTrapAttempts.length > 0;
              const spacedRevisionItem = subject.spacedRevisionItems.find(
                (revision) => revision.session.day === session.day
              );
              const isSpacedRevision = Boolean(spacedRevisionItem);
              if (
                !isAiGap &&
                !isQuestionBankTrap &&
                !isSpacedRevision &&
                !item?.revisitQueued &&
                item?.confidence !== "Shaky"
              ) {
                return null;
              }
              return {
                subject,
                session,
                progress: item,
                source: isAiGap
                  ? "ai-teacher"
                  : isQuestionBankTrap
                    ? "question-bank"
                    : isSpacedRevision
                      ? "spaced-revision"
                    : item?.revisitQueued
                      ? "revisit"
                      : "shaky",
                status: isAiGap
                  ? "AI teacher gap"
                  : isQuestionBankTrap
                    ? "Question Bank trap"
                    : isSpacedRevision
                      ? "Spaced revision due"
                    : item?.revisitQueued
                      ? "Revisit queued"
                      : "Shaky confidence",
                detail: isAiGap
                  ? item?.teacherDoubtRepairAction?.trim() || "Repair the AI-identified gap before new testing."
                  : isQuestionBankTrap
                    ? questionBankTrapDetail(questionBankTrapAttempts)
                  : isSpacedRevision && spacedRevisionItem
                    ? `${session.title} cleared earlier and is due for recall before ${spacedRevisionItem.dueSession.title} stays stable.`
                  : item?.revisitQueued
                    ? "Revisit queued from local progress."
                    : "Shaky confidence from local progress.",
                category: isAiGap ? teacherDoubtCategory(item) : null,
                href: isAiGap
                  ? teacherDoubtHref(subject, session, item)
                  : isQuestionBankTrap
                    ? `${subject.href}/revisit?day=${session.day}`
                  : isSpacedRevision
                    ? `${subject.href}/revisit?day=${session.day}`
                  : item?.revisitQueued
                    ? `${subject.href}/revisit?day=${session.day}`
                    : `${subject.href}/talk?day=${session.day}`,
              };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
        )
        .slice(0, 12),
    [summaries]
  );
  const revisionStrategyRows = useMemo(() => {
    const taskRows = strategyExecutionTasks.filter((task) => revisionTaskPhases.has(task.phase));
    const priorityRows = prelims2027Priorities
      .map((priority) => {
        const tasks = taskRows.filter((task) => task.priorityId === priority.id);
        const blueprints = strategyPracticeBlueprints.filter((blueprint) => blueprint.priorityId === priority.id);
        const completedCount = tasks.filter((task) => completedStrategyTasks.includes(task.id)).length;

        return { priority, tasks, blueprints, completedCount };
      })
      .filter((row) => row.tasks.length > 0 || row.blueprints.length > 0);
    const completedTaskCount = taskRows.filter((task) => completedStrategyTasks.includes(task.id)).length;
    const revisionSprintIds = ["sprint-4-format-rebuild", "sprint-5-student-pilot", "sprint-6-maintenance-publication"];
    const revisionSprints = strategySprintCalendar.filter((sprint) => revisionSprintIds.includes(sprint.id));

    return {
      taskRows,
      priorityRows,
      completedTaskCount,
      revisionSprints,
      maintenanceBlueprints: strategyPracticeBlueprints.filter((blueprint) =>
        blueprint.priorityId === "medieval-reduction" || blueprint.priorityId === "economy-maintenance"
      ),
    };
  }, [completedStrategyTasks]);

  const targetSummary = summaries.find((summary) => summary.slug === initialSubjectSlug);
  const targetSession =
    targetSummary?.sessions.find((session) => session.day === initialDay) ?? targetSummary?.nextSession;
  const targetProgress =
    targetSummary && targetSession ? getSessionProgress(targetSummary.progress, targetSession) : undefined;
  const targetQuestionBankAttempts =
    targetSummary && targetSession
      ? getQuestionBankAttemptsForSession(targetSummary.questionBankAttempts, targetSession)
      : [];
  const targetQuestionBankTrapAttempts = getQuestionBankTrapAttempts(targetQuestionBankAttempts);
  const targetHasQuestionBankTrap = targetQuestionBankTrapAttempts.length > 0;
  const targetSpacedRevision = targetSummary?.spacedRevisionItems.find(
    (revision) => revision.session.day === targetSession?.day
  );
  const targetHref =
    targetSummary && targetSession
      ? hasActiveTeacherDoubt(targetProgress)
        ? teacherDoubtHref(targetSummary, targetSession, targetProgress)
        : targetHasQuestionBankTrap
          ? `${targetSummary.href}/revisit?day=${targetSession.day}`
        : targetSpacedRevision
          ? `${targetSummary.href}/revisit?day=${targetSession.day}`
        : targetProgress?.revisitQueued
        ? `${targetSummary.href}/revisit?day=${targetSession.day}`
        : targetProgress?.confidence === "Shaky"
          ? `${targetSummary.href}/talk?day=${targetSession.day}`
          : `${targetSummary.trackHref}?day=${targetSession.day}`
      : null;
  const targetStatus = hasActiveTeacherDoubt(targetProgress)
      ? `AI teacher gap: ${teacherDoubtCategory(targetProgress)}`
    : targetHasQuestionBankTrap
      ? "Question Bank trap"
    : targetSpacedRevision
      ? `Spaced revision due: Day ${targetSpacedRevision.dueDay}`
    : targetProgress?.revisitQueued
      ? "Revisit queued"
      : targetProgress?.confidence === "Shaky"
        ? "Shaky talk repair"
        : "Track focused day";

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading UPSC revision command...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href="/upsc" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> UPSC command home
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Revision Command</Badge>
              <span className="text-sm font-bold text-[#776f64]">All subjects, local browser memory</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">Post-subject command phase</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              One dashboard for every subject queue.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">
              This room reads the local progress from Geography, Environment, Disaster Management, Economy, Science and Tech,
              Polity and Governance, Internal Security and Society, and History. It tells you what to revise next.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${totals.completionPercent}%` }} />
            </div>
            <p className="mt-3 text-sm font-black text-[#085041]">
              {totals.completionPercent}% reflected across {totals.totalDays} planned study days
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
            {[
              { label: "Total days", value: totals.totalDays, icon: Compass },
              { label: "Watched", value: totals.watched, icon: PlayCircle },
              { label: "Reflections", value: totals.reflected, icon: BrainCircuit },
              { label: "Command", value: totals.command, icon: CheckCircle2 },
              { label: "AI gaps", value: totals.aiGap, icon: CircleAlert },
              { label: "QB traps", value: totals.questionBankTrap, icon: CircleAlert },
              { label: "Due", value: totals.spacedRevision, icon: TimerReset },
              { label: "Revisit", value: totals.revisit, icon: RefreshCcw },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{item.label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-[#13251d]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="upsc-2027-revision-strategy-overlay"
          data-testid="upsc-2027-revision-strategy-overlay"
          data-format-rule-count={formatRebuildRules.length}
          data-priority-row-count={revisionStrategyRows.priorityRows.length}
          data-revision-task-count={revisionStrategyRows.taskRows.length}
          data-completed-revision-task-count={revisionStrategyRows.completedTaskCount}
          data-blueprint-count={strategyPracticeBlueprints.length}
          data-maintenance-blueprint-count={revisionStrategyRows.maintenanceBlueprints.length}
          data-sprint-count={revisionStrategyRows.revisionSprints.length}
          data-proof-rule="format-rebuild-maintenance-revision-only"
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-[#085041]" />
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#085041]">
                  2027 revision and repair plan
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d] md:text-3xl">
                Rebuild practice around UPSC formats, then keep low-return areas in revision-only mode.
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#49675e]">
                The 2026 paper rewarded format discipline: multi-statement, how-many-correct, match-pair,
                NOT/exception, assertion-reason, and scenario caselets. Revision Command now shows which practice
                loops, release tasks, and maintenance drills must exist before the student queue can be trusted.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Format rules", formatRebuildRules.length],
                  ["Practice blueprints", strategyPracticeBlueprints.length],
                  ["Release/planner tasks", revisionStrategyRows.taskRows.length],
                  ["Maintenance drills", revisionStrategyRows.maintenanceBlueprints.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#93cdb6] bg-white/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                    <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/upsc/prelims-2027-strategy#practice-blueprints"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white"
                >
                  Open practice blueprints <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/upsc/mcq-command"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1a3a2a] bg-white px-4 text-sm font-black text-[#1a3a2a]"
                >
                  Open MCQ command
                </Link>
              </div>
            </div>

            <div className="grid min-w-0 gap-4">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {formatRebuildRules.map((rule) => (
                  <div
                    key={rule.id}
                    data-testid="upsc-2027-revision-format-rule"
                    data-format-id={rule.id}
                    data-target-percent={rule.targetPercent}
                    className="rounded-lg border border-[#c8ded6] bg-[#fffdf8] p-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      {rule.targetPercent}% target
                    </p>
                    <h3 className="mt-1 text-base font-black tracking-tight text-[#13251d]">{rule.format}</h3>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">{rule.reason}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                {revisionStrategyRows.priorityRows.map((row) => (
                  <article
                    key={row.priority.id}
                    data-testid="upsc-2027-revision-priority-row"
                    data-priority-id={row.priority.id}
                    data-blueprint-count={row.blueprints.length}
                    data-task-count={row.tasks.length}
                    data-completed-count={row.completedCount}
                    className="rounded-lg border border-[#c8ded6] bg-[#fffdf8] p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                          {row.priority.subject}
                        </p>
                        <h3 className="mt-1 break-words text-lg font-black tracking-tight text-[#13251d]">
                          {row.priority.action}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">
                          {row.priority.priority}
                        </Badge>
                        <Badge className="rounded-md bg-[#fff4df] px-2 py-1 text-[#6f4a12]">
                          {row.completedCount}/{row.tasks.length} tasks
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {row.blueprints.map((blueprint) => (
                        <Link
                          key={blueprint.id}
                          href={blueprint.route}
                          data-testid="upsc-2027-revision-blueprint-link"
                          data-blueprint-id={blueprint.id}
                          className="rounded-md border border-[#dcd5c7] bg-white p-3 transition hover:border-[#1d9e75]"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                            {blueprint.difficulty} / {blueprint.minutes} min
                          </p>
                          <p className="mt-1 text-sm font-black tracking-tight text-[#13251d]">{blueprint.title}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">
                            {blueprint.expectedOutput}
                          </p>
                        </Link>
                      ))}
                    </div>

                    {row.tasks.length ? (
                      <div className="mt-4 grid gap-2">
                        {row.tasks.map((task) => {
                          const isDone = completedStrategyTasks.includes(task.id);

                          return (
                            <Link
                              key={task.id}
                              href={task.route}
                              data-testid="upsc-2027-revision-task-link"
                              data-task-id={task.id}
                              data-phase={task.phase}
                              data-done={isDone ? "true" : "false"}
                              className={cn(
                                "rounded-md border p-3 transition hover:border-[#1d9e75]",
                                isDone ? "border-[#93cdb6] bg-[#eef8f2]" : "border-[#dcd5c7] bg-white"
                              )}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Badge className={cn("rounded-md border px-2 py-1", revisionTaskTone(task.phase))}>
                                  {task.phase}
                                </Badge>
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d675f]">
                                  {isDone ? "Done" : "Pending"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-black tracking-tight text-[#13251d]">{task.title}</p>
                              <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">{task.output}</p>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Subject map</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Revision status by subject</h2>
              </div>
              <BarChart3 className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {summaries.map((summary) => (
                <div
                  key={summary.slug}
                  data-question-bank-traps={summary.questionBankTrapCount}
                  data-spaced-revision-due={summary.spacedRevisionCount}
                  className={cn("rounded-lg border p-4 shadow-sm", subjectTone(summary))}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{summary.window}</p>
                      <h3 className="mt-2 text-lg font-black leading-6 text-[#13251d]">{summary.title}</h3>
                    </div>
                    <Badge variant="outline" className="rounded-md border-[#1d9e75]/40 text-[#085041]">
                      {summary.sessions.length} days
                    </Badge>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center">
                    {[
                      ["Watch", summary.watchedCount],
                      ["Talk", summary.reflectedCount],
                      ["Cmd", summary.commandCount],
                      ["AI", summary.aiGapCount],
                      ["QB", summary.questionBankTrapCount],
                      ["Due", summary.spacedRevisionCount],
                      ["Fix", summary.revisitCount],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-white/75 px-2 py-3">
                        <p className="text-lg font-black text-[#13251d]">{value}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#6f756d]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href={summary.nextHref}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                    >
                      {summary.nextLabel} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`${summary.trackHref}?day=${summary.nextSession.day}`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                    >
                      Track subject
                    </Link>
                  </div>

                  <p className="mt-3 text-xs font-semibold leading-5 text-[#657066]">
                    Next: Day {summary.nextSession.day}, {summary.nextSession.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            {targetSummary && targetSession && targetHref ? (
              <div
                data-testid="revision-target-focus"
                data-question-bank-traps={targetQuestionBankTrapAttempts.length}
                data-spaced-revision-due={targetSpacedRevision ? "true" : "false"}
                className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                  <Target className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Direct target</p>
                <h2 className="mt-2 text-xl font-black leading-7 text-[#085041]">
                  {targetSummary.title} Day {targetSession.day}
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#41645a]">{targetSession.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#41645a]">{targetStatus}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    data-testid="revision-target-route"
                    href={targetHref}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    Open target <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`${targetSummary.trackHref}?day=${targetSession.day}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#bdddd3] bg-white px-3 text-sm font-black text-[#085041] transition hover:bg-[#effaf5]"
                  >
                    Track focused day
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <TimerReset className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Global revision queue</p>
                  <p className="text-xs font-semibold text-[#746f66]">Repair, due, and shaky days from all subjects</p>
                </div>
              </div>

              {focusQueue.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#dcd5c7] bg-[#fdfaf3] p-5 text-sm font-bold leading-6 text-[#746f66]">
                  No shaky, due, or revisit days saved yet. As study evidence grows, revision work will collect here automatically.
                </div>
              ) : (
                <div className="grid gap-3">
                  {focusQueue.map((item) => (
                    <Link
                      key={`${item.subject.slug}-${item.session.day}`}
                      data-revision-source={item.source}
                      href={item.href}
                      className="rounded-md border border-[#ef9f27]/40 bg-[#fff4df] p-4 transition hover:border-[#ef9f27]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a6a16]">
                          {item.subject.title} / Day {item.session.day}
                        </p>
                        {item.status === "AI teacher gap" || item.status === "Question Bank trap" ? (
                          <CircleAlert className="h-4 w-4 text-[#9a6a16]" />
                        ) : item.progress?.revisitQueued ? (
                          <RefreshCcw className="h-4 w-4 text-[#9a6a16]" />
                        ) : (
                          <Gauge className="h-4 w-4 text-[#9a6a16]" />
                        )}
                      </div>
                      <p className="text-sm font-black text-[#332514]">{item.session.title}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#6f4a12]">
                        {item.category ? `${item.status}: ${item.category}. ` : ""}
                        {item.detail}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                <Target className="h-5 w-5" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Revision rule</p>
              <h2 className="mt-2 text-xl font-black text-[#085041]">Repair before new testing.</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#41645a]">
                The command phase should cycle through AI teacher gaps first, then wrong Question Bank traps, queued revisits,
                shaky explanations, due spaced revision, unfinished classes, and finally mixed MCQ drills.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
