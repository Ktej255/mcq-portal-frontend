"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, BrainCircuit, CalendarDays, ClipboardCheck, FileText, Focus, LibraryBig, Target, TriangleAlert } from "lucide-react";

import { buildGeographyReportSnapshot, type GeographyReportWindow } from "@/lib/upsc/geographyReportEngine";
import {
  buildDailyPlannerDecision,
  readLocalAutoSessionHandoff,
  type AutoSessionHandoffRecord,
  type DailyPlannerProgress,
} from "@/lib/upsc/dailyPlannerEngine";
import { readLocalQuestionBankAttempts, type QuestionBankAttempt } from "@/lib/upsc/questionBankEngine";
import {
  prelims2027Priorities,
  strategyExecutionTasks,
  strategyPracticeBlueprints,
  strategyPracticeHandoffStorageKey,
  type StrategyPracticeHandoff,
} from "@/lib/upsc/prelims2027Strategy";
import {
  buildUpscStudentReportSnapshot,
  readLocalStudentReportProgress,
  studentReportSubjects,
  type StudentReportQuestionBankAttemptMap,
  type StudentReportWindow,
  type StudentReportProgressMap,
} from "@/lib/upsc/studentReportEngine";
import { readStudentProfile } from "@/lib/upsc/studentProfile";
import { useGeographyStudentOverview } from "@/lib/upsc/useGeographyStudentOverview";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";

type DailyReportState = {
  subjectSlug: string;
  day: number;
  note?: string;
  updatedAt?: string;
};

const dailyStorageKey = "sarit-upsc-daily-command-v1";
const strategyStorageKey = "sarit-upsc-prelims-2027-strategy-v1";
const prioritySubjectSlug: Record<string, string> = {
  "ir-multilateral": "internal-security-society",
  "science-new-domains": "science-tech",
  "polity-legal-ethics": "polity-governance",
  "environment-current": "environment",
  "geography-international": "geography",
  "ancient-tn-board": "history",
  "economy-maintenance": "economy",
  "medieval-reduction": "history",
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function readCompletedStrategyTasks() {
  return (
    readJson<{ completedTasks?: unknown[] }>(strategyStorageKey, {}).completedTasks?.filter(
      (taskId): taskId is string => typeof taskId === "string"
    ) ?? []
  );
}

function readStrategyPracticeHandoffs() {
  const handoffs = readJson<unknown>(strategyPracticeHandoffStorageKey, []);
  return Array.isArray(handoffs) ? (handoffs as StrategyPracticeHandoff[]) : [];
}

export default function ReportsPage() {
  const overview = useGeographyStudentOverview();
  const { progress } = useGeographyProgress();
  const [progressBySubject, setProgressBySubject] = useState<Record<string, StudentReportProgressMap>>({});
  const [questionBankAttemptsBySubject, setQuestionBankAttemptsBySubject] =
    useState<StudentReportQuestionBankAttemptMap>({});
  const [dailyState, setDailyState] = useState<DailyReportState>({ subjectSlug: "geography", day: 1 });
  const [autoSessionHandoff, setAutoSessionHandoff] = useState<AutoSessionHandoffRecord | null>(null);
  const [completedStrategyTasks, setCompletedStrategyTasks] = useState<string[]>([]);
  const [strategyPracticeHandoffs, setStrategyPracticeHandoffs] = useState<StrategyPracticeHandoff[]>([]);
  const [strategyQuestionAttempts, setStrategyQuestionAttempts] = useState<QuestionBankAttempt[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgressBySubject(
        Object.fromEntries(
          studentReportSubjects.map((subject) => [subject.slug, readLocalStudentReportProgress(subject.slug)])
        )
      );
      setQuestionBankAttemptsBySubject(
        Object.fromEntries(
          studentReportSubjects.map((subject) => [subject.slug, readLocalQuestionBankAttempts(subject.slug)])
        )
      );
      setDailyState(readJson<DailyReportState>(dailyStorageKey, { subjectSlug: "geography", day: 1 }));
      setAutoSessionHandoff(readLocalAutoSessionHandoff());
      setCompletedStrategyTasks(readCompletedStrategyTasks());
      setStrategyPracticeHandoffs(readStrategyPracticeHandoffs());
      setStrategyQuestionAttempts(
        studentReportSubjects
          .flatMap((subject) => readLocalQuestionBankAttempts(subject.slug))
          .filter((attempt) => attempt.source === "UPSC_2027_STRATEGY")
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const report = buildGeographyReportSnapshot(progress);
  const allSubjectReport = useMemo(
    () => buildUpscStudentReportSnapshot(progressBySubject, questionBankAttemptsBySubject),
    [progressBySubject, questionBankAttemptsBySubject]
  );
  const activeReportSubject =
    studentReportSubjects.find((subject) => subject.slug === dailyState.subjectSlug) ?? studentReportSubjects[0];
  const activeReportDay = Math.min(Math.max(dailyState.day || 1, 1), activeReportSubject.sessions.length);
  const currentReadiness = useMemo(
    () =>
      buildDailyPlannerDecision({
        subjectSlug: activeReportSubject.slug,
        sessions: activeReportSubject.sessions,
        selectedDay: activeReportDay,
        progress: (progressBySubject[activeReportSubject.slug] ?? {}) as Record<string, DailyPlannerProgress | undefined>,
        questionBankAttempts: questionBankAttemptsBySubject[activeReportSubject.slug] ?? [],
        profile: readStudentProfile(),
      }).sessionReadiness,
    [activeReportDay, activeReportSubject.sessions, activeReportSubject.slug, progressBySubject, questionBankAttemptsBySubject]
  );
  const headline = overview.hasUrgentRecovery
    ? `${overview.metrics.revisitCount} recovery item${overview.metrics.revisitCount === 1 ? "" : "s"} need attention`
    : overview.metrics.startedCount
      ? "No queued gap right now"
      : "No real gap yet";
  const reportSummaryCards = [
    {
      id: "gap-now",
      label: "Gap now",
      title:
        allSubjectReport.totals.teacherDoubtCount > 0
          ? `${allSubjectReport.totals.teacherDoubtCount} AI gap active`
          : allSubjectReport.totals.recoveryItems > 0
            ? `${allSubjectReport.totals.recoveryItems} recovery item active`
            : "No urgent gap",
      detail:
        allSubjectReport.autoReport.growthNow === "Start the first daily loop to create evidence"
          ? "Start one daily loop to create the first measured gap."
          : allSubjectReport.autoReport.growthNow,
    },
    {
      id: "revise-next",
      label: "Revise",
      title: currentReadiness.statusLabel,
      detail: currentReadiness.title,
    },
    {
      id: "growth",
      label: "Growth",
      title: `${allSubjectReport.totals.growthPercent}% movement`,
      detail: `${allSubjectReport.totals.startedDays}/${allSubjectReport.totals.totalDays} planned days have evidence.`,
    },
    {
      id: "report-action",
      label: "Next report",
      title: allSubjectReport.autoReport.weeklyReportId,
      detail: allSubjectReport.autoReport.nextWeeklyAction,
    },
  ];
  const handoffMatchesActiveDay =
    autoSessionHandoff?.selectedSubjectSlug === activeReportSubject.slug &&
    autoSessionHandoff.selectedDay === activeReportDay;
  const strategyAuditReadiness = useMemo(() => {
    const generatedBlueprintIds = new Set(strategyPracticeHandoffs.map((handoff) => handoff.blueprintId));
    const attemptedBlueprintIds = new Set(
      strategyQuestionAttempts
        .map(
          (attempt) =>
            strategyPracticeBlueprints.find((blueprint) =>
              attempt.questionId.startsWith(`strategy-${blueprint.id}-`)
            )?.id
        )
        .filter((blueprintId): blueprintId is string => Boolean(blueprintId))
    );
    const correctAttempts = strategyQuestionAttempts.filter((attempt) => attempt.isCorrect).length;
    const completedTaskCount = strategyExecutionTasks.filter((task) => completedStrategyTasks.includes(task.id)).length;
    const priorityRows = prelims2027Priorities.map((priority) => {
      const tasks = strategyExecutionTasks.filter((task) => task.priorityId === priority.id);
      const blueprints = strategyPracticeBlueprints.filter((blueprint) => blueprint.priorityId === priority.id);
      const completed = tasks.filter((task) => completedStrategyTasks.includes(task.id)).length;
      const generated = blueprints.filter((blueprint) => generatedBlueprintIds.has(blueprint.id)).length;
      const attempted = blueprints.filter((blueprint) => attemptedBlueprintIds.has(blueprint.id)).length;
      const subjectSlug = prioritySubjectSlug[priority.id] ?? "geography";

      return {
        priority,
        subjectSlug,
        tasks,
        blueprints,
        completed,
        generated,
        attempted,
        status: attempted ? "Solved evidence" : generated ? "Practice generated" : completed ? "Build moving" : "Pending",
      };
    });

    return {
      generatedBlueprintIds,
      attemptedBlueprintIds,
      strategyAttempts: strategyQuestionAttempts,
      correctAttempts,
      completedTaskCount,
      accuracyPercent: strategyQuestionAttempts.length
        ? Math.round((correctAttempts / strategyQuestionAttempts.length) * 100)
        : null,
      priorityRows,
    };
  }, [completedStrategyTasks, strategyPracticeHandoffs, strategyQuestionAttempts]);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Learning Gaps</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{headline}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                The portal measures gaps from your recall and practice evidence. Work on one weak point, then move ahead.
              </p>
            </div>
            <Link
              href={overview.loopState.href}
              data-testid="student-gap-primary-action"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {overview.loopState.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section
          data-testid="upsc-current-readiness-report"
          data-readiness-subject={activeReportSubject.slug}
          data-readiness-day={activeReportDay}
          data-readiness-status={currentReadiness.statusLabel}
          data-readiness-score={currentReadiness.scorePercent}
          className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                  Current session readiness
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {activeReportSubject.title} Day {activeReportDay}: {currentReadiness.statusLabel}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {currentReadiness.title}. {currentReadiness.detail}
              </p>
              <Link
                href={currentReadiness.href}
                data-testid="upsc-current-readiness-action"
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
              >
                {currentReadiness.actionLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                  Same signal as Daily Mission
                </p>
                <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1.5 text-xs font-black text-[#085041]">
                  {currentReadiness.scorePercent}%
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {currentReadiness.checklist.map((item) => (
                  <div key={item.label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">
                      {item.status}
                    </p>
                    <h3 className="mt-2 text-sm font-black leading-5 text-[#13251d]">{item.label}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#657066]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-student-report-summary"
          data-proof-rule="student-visible-gap-revision-growth-report-summary"
          data-active-subject={activeReportSubject.slug}
          data-active-day={activeReportDay}
          data-current-readiness={currentReadiness.statusLabel}
          data-current-action={currentReadiness.actionLabel}
          data-current-action-href={currentReadiness.href}
          data-weekly-report-id={allSubjectReport.autoReport.weeklyReportId}
          data-monthly-report-id={allSubjectReport.autoReport.monthlyReportId}
          data-growth-percent={allSubjectReport.totals.growthPercent}
          data-started-days={allSubjectReport.totals.startedDays}
          data-total-days={allSubjectReport.totals.totalDays}
          data-ai-gap-count={allSubjectReport.totals.teacherDoubtCount}
          data-recovery-items={allSubjectReport.totals.recoveryItems}
          data-me-time-checks={allSubjectReport.totals.meTimeChecks}
          data-current-affairs-unlocked={allSubjectReport.totals.currentAffairsUnlocked}
          data-question-bank-attempts={allSubjectReport.totals.questionBankAttempts}
          data-question-bank-correct={allSubjectReport.totals.questionBankCorrect}
          data-question-bank-accuracy={allSubjectReport.totals.questionBankAccuracyPercent ?? "no-attempts"}
          data-exact-pyq-attempts={allSubjectReport.totals.exactPyqAttempts}
          data-exact-pyq-correct={allSubjectReport.totals.exactPyqCorrect}
          data-exact-pyq-accuracy={allSubjectReport.totals.exactPyqAccuracyPercent ?? "no-attempts"}
          className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Student report summary
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Four signals decide the next study move.</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                The report stays simple: what is weak, what to revise, how much growth is visible, and what the next
                weekly report action says.
              </p>
            </div>
            <Link
              href={currentReadiness.href}
              data-testid="upsc-student-report-summary-action"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {currentReadiness.actionLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {reportSummaryCards.map((card) => (
              <article
                key={card.id}
                data-testid="upsc-student-report-summary-card"
                data-card-id={card.id}
                className="min-h-32 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{card.label}</p>
                <h3 className="mt-2 text-base font-black leading-5 text-[#13251d]">{card.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">{card.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-2027-audit-readiness-report"
          data-proof-rule="strategy-build-generated-practice-solved-attempt-readiness"
          data-priority-count={strategyAuditReadiness.priorityRows.length}
          data-build-task-count={strategyExecutionTasks.length}
          data-completed-task-count={strategyAuditReadiness.completedTaskCount}
          data-blueprint-count={strategyPracticeBlueprints.length}
          data-generated-blueprints={strategyAuditReadiness.generatedBlueprintIds.size}
          data-attempted-blueprints={strategyAuditReadiness.attemptedBlueprintIds.size}
          data-strategy-attempts={strategyAuditReadiness.strategyAttempts.length}
          data-strategy-correct={strategyAuditReadiness.correctAttempts}
          data-strategy-accuracy={strategyAuditReadiness.accuracyPercent ?? "no-attempts"}
          className="mt-5 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Target className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                  2027 audit readiness
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Strategy changes count only when build, practice, and solved evidence line up.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                This report reads the same 2027 strategy queue used by Content, MCQ, Current Affairs, Revision, and
                Question Bank. It separates planned work from generated practice and solved student attempts.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Build tasks done", `${strategyAuditReadiness.completedTaskCount}/${strategyExecutionTasks.length}`],
                  ["Practice generated", `${strategyAuditReadiness.generatedBlueprintIds.size}/${strategyPracticeBlueprints.length}`],
                  ["Blueprints solved", strategyAuditReadiness.attemptedBlueprintIds.size],
                  [
                    "Strategy accuracy",
                    strategyAuditReadiness.accuracyPercent === null ? "No attempts" : `${strategyAuditReadiness.accuracyPercent}%`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#93cdb6] bg-white/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                    <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/upsc/question-bank"
                data-testid="upsc-2027-audit-readiness-action"
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
              >
                Open strategy practice <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {strategyAuditReadiness.priorityRows.map((row) => (
                <Link
                  key={row.priority.id}
                  href={`/upsc/question-bank?subject=${row.subjectSlug}`}
                  data-testid="upsc-2027-audit-readiness-row"
                  data-priority-id={row.priority.id}
                  data-subject-slug={row.subjectSlug}
                  data-task-count={row.tasks.length}
                  data-completed-count={row.completed}
                  data-blueprint-count={row.blueprints.length}
                  data-generated-count={row.generated}
                  data-attempted-count={row.attempted}
                  data-status={row.status}
                  className="rounded-lg border border-[#c8ded6] bg-[#fffdf8] p-4 shadow-sm transition hover:border-[#1d9e75]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                        {row.priority.subject}
                      </p>
                      <h3 className="mt-1 text-base font-black tracking-tight text-[#13251d]">{row.status}</h3>
                    </div>
                    <span className="rounded-md bg-[#fff4df] px-2 py-1 text-xs font-black text-[#6f4a12]">
                      {row.priority.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">{row.priority.action}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Build", `${row.completed}/${row.tasks.length}`],
                      ["Practice", `${row.generated}/${row.blueprints.length}`],
                      ["Solved", row.attempted],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-2">
                        <p className="text-sm font-black text-[#13251d]">{value}</p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#6f756d]">{label}</p>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-auto-session-report-bridge"
          data-proof-rule={
            autoSessionHandoff?.proofRule ??
            "automatic-new-day-handoff-from-me-time-recall-class-discussion-mcq-revision-report"
          }
          data-handoff-status={autoSessionHandoff ? "saved" : "missing"}
          data-handoff-current={handoffMatchesActiveDay ? "true" : "false"}
          data-handoff-id={autoSessionHandoff?.id ?? "missing"}
          data-subject-slug={autoSessionHandoff?.subjectSlug ?? activeReportSubject.slug}
          data-selected-day={autoSessionHandoff?.selectedDay ?? activeReportDay}
          data-source-day={autoSessionHandoff?.sourceDay ?? "missing"}
          data-target-day={autoSessionHandoff?.targetDay ?? "missing"}
          data-status-label={autoSessionHandoff?.statusLabel ?? "missing"}
          data-action-label={autoSessionHandoff?.actionLabel ?? "Open Daily Command"}
          data-action-href={autoSessionHandoff?.href ?? "/upsc/daily-command"}
          data-can-advance={autoSessionHandoff ? String(autoSessionHandoff.canAdvance) : "false"}
          data-evidence-used={autoSessionHandoff?.evidenceUsed ?? 0}
          data-evidence-missing={autoSessionHandoff?.evidenceMissing ?? 0}
          data-blockers={autoSessionHandoff?.blockers ?? 0}
          data-readiness-status={autoSessionHandoff?.readinessStatus ?? currentReadiness.statusLabel}
          data-readiness-score={autoSessionHandoff?.readinessScorePercent ?? currentReadiness.scorePercent}
          data-learning-gap={autoSessionHandoff?.learningGapTitle ?? "No saved handoff yet"}
          data-revision-due={autoSessionHandoff?.revisionDueLabel ?? "Open Daily Command"}
          data-report-href={autoSessionHandoff?.reportHref ?? "/reports"}
          data-question-bank-href={autoSessionHandoff?.questionBankHref ?? `/upsc/question-bank?subject=${activeReportSubject.slug}`}
          className="mt-5 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                  Auto session report bridge
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {autoSessionHandoff
                  ? autoSessionHandoff.canAdvance
                    ? `Next session ready: Day ${autoSessionHandoff.targetDay}`
                    : `Next session held: ${autoSessionHandoff.statusLabel}`
                  : "Daily Command has not generated a handoff yet"}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                {autoSessionHandoff
                  ? autoSessionHandoff.studentInstruction
                  : "Open Daily Command once so the portal can save the next-session handoff from mind-state, recall, class, MCQ, revision, and report evidence."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={autoSessionHandoff?.href ?? "/upsc/daily-command"}
                  data-testid="upsc-auto-session-report-action"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  {autoSessionHandoff?.actionLabel ?? "Open Daily Command"} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={autoSessionHandoff?.questionBankHref ?? `/upsc/question-bank?subject=${activeReportSubject.slug}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#b9d9cd] bg-white/70 px-4 text-sm font-black text-[#085041] transition hover:bg-white"
                >
                  MCQ bank <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Source", autoSessionHandoff ? `Day ${autoSessionHandoff.sourceDay}` : "Pending"],
                ["Target", autoSessionHandoff ? `Day ${autoSessionHandoff.targetDay}` : "Pending"],
                ["Evidence", autoSessionHandoff ? `${autoSessionHandoff.evidenceUsed} used / ${autoSessionHandoff.evidenceMissing} missing` : "No handoff"],
                ["Blockers", autoSessionHandoff?.blockers ?? 0],
                ["Readiness", `${autoSessionHandoff?.readinessStatus ?? currentReadiness.statusLabel} / ${autoSessionHandoff?.readinessScorePercent ?? currentReadiness.scorePercent}%`],
                ["Current", handoffMatchesActiveDay ? "Same day" : autoSessionHandoff ? "Older handoff" : "Missing"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#b9d9cd] bg-white/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">{label}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-all-subject-report"
          data-proof-rule="recall-mcq-question-bank-recovery-ai-me-time-current-affairs-growth"
          data-subject-count={allSubjectReport.subjects.length}
          data-total-days={allSubjectReport.totals.totalDays}
          data-started-days={allSubjectReport.totals.startedDays}
          data-watched-days={allSubjectReport.totals.watchedDays}
          data-command-days={allSubjectReport.totals.commandDays}
          data-recovery-items={allSubjectReport.totals.recoveryItems}
          data-ai-gap-count={allSubjectReport.totals.teacherDoubtCount}
          data-me-time-checks={allSubjectReport.totals.meTimeChecks}
          data-current-affairs-unlocked={allSubjectReport.totals.currentAffairsUnlocked}
          data-weekly-windows-generated={allSubjectReport.totals.weeklyWindowsGenerated}
          data-average-recall={allSubjectReport.totals.averageRecall ?? "not-measured"}
          data-average-mcq={allSubjectReport.totals.averageMcq ?? "no-score"}
          data-question-bank-attempts={allSubjectReport.totals.questionBankAttempts}
          data-question-bank-correct={allSubjectReport.totals.questionBankCorrect}
          data-question-bank-accuracy={allSubjectReport.totals.questionBankAccuracyPercent ?? "no-attempts"}
          data-exact-pyq-attempts={allSubjectReport.totals.exactPyqAttempts}
          data-exact-pyq-correct={allSubjectReport.totals.exactPyqCorrect}
          data-exact-pyq-accuracy={allSubjectReport.totals.exactPyqAccuracyPercent ?? "no-attempts"}
          data-growth-percent={allSubjectReport.totals.growthPercent}
          className="mt-5 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <LibraryBig className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                  UPSC all-subject report
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {allSubjectReport.totals.growthPercent}% movement across the full plan
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Started from: {allSubjectReport.growth.startedFrom}. Current position: {allSubjectReport.growth.currentPosition}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Started", `${allSubjectReport.totals.startedDays}/${allSubjectReport.totals.totalDays}`],
                ["Weekly reports", allSubjectReport.totals.weeklyWindowsGenerated],
                ["Recovery", allSubjectReport.totals.recoveryItems],
                ["AI gaps", allSubjectReport.totals.teacherDoubtCount],
                ["Recall", allSubjectReport.totals.averageRecall === null ? "Not measured" : `${allSubjectReport.totals.averageRecall}/100`],
                ["MCQ", allSubjectReport.totals.averageMcq === null ? "No score" : `${allSubjectReport.totals.averageMcq}%`],
                ["Question bank", allSubjectReport.totals.questionBankAttempts],
                [
                  "QB accuracy",
                  allSubjectReport.totals.questionBankAccuracyPercent === null
                    ? "No attempts"
                    : `${allSubjectReport.totals.questionBankAccuracyPercent}%`,
                ],
                ["Exact PYQ", allSubjectReport.totals.exactPyqAttempts],
                ["Me-time", allSubjectReport.totals.meTimeChecks],
                ["Current affairs", allSubjectReport.totals.currentAffairsUnlocked],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">{label}</p>
                  <p className="mt-1 text-lg font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {allSubjectReport.subjects.map((subject) => (
              <Link
                key={subject.slug}
                href={subject.route}
                data-testid="upsc-subject-report-card"
                data-subject-slug={subject.slug}
                data-total-days={subject.totalDays}
                data-started-days={subject.startedDays}
                data-watched-days={subject.watchedDays}
                data-recall-attempts={subject.recallAttempts}
                data-average-recall={subject.averageRecall ?? "not-measured"}
                data-mcq-sets={subject.mcqSets}
                data-average-mcq={subject.averageMcq ?? "no-score"}
                data-question-bank-attempts={subject.questionBankAttempts}
                data-question-bank-correct={subject.questionBankCorrect}
                data-question-bank-accuracy={subject.questionBankAccuracyPercent ?? "no-attempts"}
                data-exact-pyq-attempts={subject.exactPyqAttempts}
                data-exact-pyq-correct={subject.exactPyqCorrect}
                data-exact-pyq-accuracy={subject.exactPyqAccuracyPercent ?? "no-attempts"}
                data-recovery-items={subject.recoveryItems}
                data-command-days={subject.commandDays}
                data-ai-gap-count={subject.teacherDoubtCount}
                data-me-time-checks={subject.meTimeChecks}
                data-current-affairs-unlocked={subject.currentAffairsUnlocked}
                data-readiness-signal={subject.readinessSignal}
                className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4 transition hover:border-[#1d9e75]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">{subject.window}</p>
                    <h3 className="mt-1 text-base font-black tracking-tight text-[#13251d]">{subject.title}</h3>
                  </div>
                  <span className="rounded-md bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
                    {subject.monthlyVerdict}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    ["Start", `${subject.startedDays}/${subject.totalDays}`],
                    ["Cmd", subject.commandDays],
                    ["Fix", subject.recoveryItems],
                    ["AI", subject.teacherDoubtCount],
                    ["QB", subject.questionBankAttempts],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-[#f7f4ee] p-2">
                      <p className="text-sm font-black text-[#13251d]">{value}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#657066]">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-md border border-[#d7e8df] bg-white/80 p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#657066]">Readiness</p>
                    <p className="mt-1 text-xs font-black leading-4 text-[#13251d]">{subject.readinessSignal}</p>
                  </div>
                  <div className="rounded-md border border-[#d7e8df] bg-white/80 p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#657066]">Exact PYQ</p>
                    <p className="mt-1 text-xs font-black leading-4 text-[#13251d]">
                      {subject.exactPyqAttempts} drill{subject.exactPyqAttempts === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#d7e8df] bg-white/80 p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#657066]">Covered News</p>
                    <p className="mt-1 text-xs font-black leading-4 text-[#13251d]">{subject.currentAffairsUnlocked} hook{subject.currentAffairsUnlocked === 1 ? "" : "s"}</p>
                  </div>
                </div>
                {subject.latestTeacherDoubtCategory && subject.latestTeacherDoubtAction ? (
                  <div className="mt-3 rounded-md border border-[#ef9f27]/35 bg-[#fff8e8] p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9a6a16]">
                      Latest AI gap: {subject.latestTeacherDoubtCategory}
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#5d3a05]">{subject.latestTeacherDoubtAction}</p>
                  </div>
                ) : null}
                <p className="mt-3 text-xs font-semibold leading-5 text-[#49675e]">{subject.nextAction}</p>
              </Link>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-auto-report-proof"
          data-proof-rule="saved-daily-loop-evidence-regenerates-reports"
          data-weekly-report-id={allSubjectReport.autoReport.weeklyReportId}
          data-monthly-report-id={allSubjectReport.autoReport.monthlyReportId}
          data-growth-baseline={allSubjectReport.autoReport.growthBaseline}
          data-growth-now={allSubjectReport.autoReport.growthNow}
          data-next-weekly-action={allSubjectReport.autoReport.nextWeeklyAction}
          data-next-monthly-action={allSubjectReport.autoReport.nextMonthlyAction}
          className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                  Auto-generated report proof
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Weekly and monthly reports rebuild from evidence</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {allSubjectReport.autoReport.studentPromise}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Weekly ID", allSubjectReport.autoReport.weeklyReportId],
                ["Monthly ID", allSubjectReport.autoReport.monthlyReportId],
                ["Growth start", allSubjectReport.autoReport.growthBaseline],
                ["Growth now", allSubjectReport.autoReport.growthNow],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Cadence</p>
              <p className="mt-1 text-sm font-bold leading-6 text-[#4f5e55]">{allSubjectReport.autoReport.cadence}</p>
            </div>
            <div className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Evidence rule</p>
              <p className="mt-1 text-sm font-bold leading-6 text-[#4f5e55]">
                {allSubjectReport.autoReport.evidenceRule}
              </p>
            </div>
            <div className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Next report action</p>
              <p className="mt-1 text-sm font-bold leading-6 text-[#4f5e55]">
                {allSubjectReport.autoReport.nextWeeklyAction}
              </p>
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-all-subject-report-windows"
          className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Generated reports
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Weekly and monthly UPSC command reports</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                These windows are generated from all subject progress, not only Geography. AI gaps, recovery, recall,
                MCQ, question-bank practice, me-time, and covered news all affect the verdict.
              </p>
            </div>
            <CalendarDays className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 xl:grid-cols-[1fr_0.9fr]">
            <AllSubjectReportWindowCard report={allSubjectReport.monthly} variant="monthly" />
            <div className="grid gap-3 md:grid-cols-2">
              {allSubjectReport.weekly.slice(0, 4).map((week) => (
                <AllSubjectReportWindowCard key={week.id} report={week} variant="weekly" />
              ))}
            </div>
          </div>
        </section>

        <section data-testid="upsc-report-evidence-streams" className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Auto report</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Weekly and monthly evidence summary</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Reports are generated from recall, MCQ, question-bank practice, recovery, me-time, and covered-topic
                current-affairs evidence.
              </p>
            </div>
            <FileText className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {report.evidenceStreams.map((stream) => (
              <div key={stream.label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{stream.label}</p>
                <p className="mt-2 text-xl font-black tracking-tight">{stream.value}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#657066]">{stream.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-growth-scale"
          data-subject-slug="geography"
          data-growth-percent={report.growth.growthPercent}
          data-started-from={report.growth.startedFrom}
          data-current-position={report.growth.currentPosition}
          data-strongest-signal={report.growth.strongestSignal}
          data-weakest-signal={report.growth.weakestSignal}
          className="mt-5 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">Growth scale</p>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{report.growth.growthPercent}% Geography movement</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Started from: {report.growth.startedFrom}. Current position: {report.growth.currentPosition}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">Strongest signal</p>
                <p className="mt-2 text-lg font-black">{report.growth.strongestSignal}</p>
              </div>
              <div className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">Needs attention</p>
                <p className="mt-2 text-lg font-black">{report.growth.weakestSignal}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <TriangleAlert className="h-5 w-5 text-[#6f4a12]" />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recovery Queue</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{overview.metrics.revisitCount} topic</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">Only measured weak points enter this list.</p>
          </div>
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <Focus className="h-5 w-5 text-[#085041]" />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Current Focus</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">Day {overview.activeSession.day}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">{overview.activeSession.title}</p>
          </div>
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <Target className="h-5 w-5 text-[#085041]" />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next Step</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{overview.loopState.label}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">{overview.loopState.shortDetail}</p>
          </div>
        </section>

        <section data-testid="upsc-weekly-reports" className="mt-5 grid gap-4 lg:grid-cols-2">
          {report.weekly.map((week) => (
            <ReportWindowCard key={week.id} report={week} variant="weekly" />
          ))}
        </section>

        <section data-testid="upsc-monthly-report" className="mt-5">
          <ReportWindowCard report={report.monthly} variant="monthly" />
        </section>

        <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <h2 className="text-lg font-black tracking-tight">Your recovery list</h2>
          <div className="mt-4 space-y-3">
            {overview.gapRows.map((row) => (
              <div
                key={row.day}
                className="grid gap-3 rounded-md border border-[#e4dccf] bg-[#f7f4ee] p-4 md:grid-cols-[0.2fr_0.8fr_0.8fr_1.1fr_auto] md:items-center"
              >
                <p className="text-xs font-black uppercase text-[#1d9e75]">D{row.day}</p>
                <p className="text-sm font-black">{row.topic}</p>
                <p className="text-sm font-semibold text-[#6f4a12]">{row.status}</p>
                <p className="text-sm font-medium leading-6 text-[#657066]">{row.detail}</p>
                <Link href={row.href} className="text-sm font-black text-[#085041] hover:underline">
                  {row.label}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function AllSubjectReportWindowCard({
  report,
  variant,
}: {
  report: StudentReportWindow;
  variant: "weekly" | "monthly";
}) {
  return (
    <article
      data-testid={variant === "monthly" ? "upsc-all-subject-monthly-report" : "upsc-all-subject-weekly-report"}
      data-report-id={report.id}
      data-report-variant={variant}
      data-subject-count={report.subjectCount}
      data-total-days={report.totalDays}
      data-started-days={report.startedDays}
      data-recall-attempts={report.recallAttempts}
      data-average-recall={report.averageRecall ?? "not-measured"}
      data-mcq-sets={report.mcqSets}
      data-average-mcq={report.averageMcq ?? "no-score"}
      data-question-bank-attempts={report.questionBankAttempts}
      data-question-bank-correct={report.questionBankCorrect}
      data-question-bank-accuracy={report.questionBankAccuracyPercent ?? "no-attempts"}
      data-exact-pyq-attempts={report.exactPyqAttempts}
      data-exact-pyq-correct={report.exactPyqCorrect}
      data-exact-pyq-accuracy={report.exactPyqAccuracyPercent ?? "no-attempts"}
      data-ai-gap-count={report.teacherDoubtCount}
      data-me-time-checks={report.meTimeChecks}
      data-current-affairs-unlocked={report.currentAffairsUnlocked}
      data-initial-known-percent={report.initialKnownPercent ?? "not-measured"}
      data-current-mastery-percent={report.currentMasteryPercent ?? "not-measured"}
      data-gap-filled-percent={report.gapFilledPercent ?? "not-measured"}
      data-remaining-gap-percent={report.remainingGapPercent ?? "not-measured"}
      data-verdict={report.verdict}
      className={`rounded-lg border p-4 shadow-sm ${
        variant === "monthly" ? "border-[#b9d9cd] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#f7f4ee]"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{report.range}</p>
          <h3 className="mt-1 text-lg font-black tracking-tight">{report.title}</h3>
        </div>
        <span className="rounded-md border border-[#b9d9cd] bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
          {report.verdict}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {[
          ["Started", `${report.startedDays}/${report.totalDays}`],
          ["Recall", report.averageRecall === null ? "Not measured" : `${report.averageRecall}/100`],
          ["Known first", report.initialKnownPercent === null ? "Not measured" : `${report.initialKnownPercent}%`],
          ["Gap filled", report.gapFilledPercent === null ? "Not measured" : `${report.gapFilledPercent}%`],
          ["MCQ", report.averageMcq === null ? "No score" : `${report.averageMcq}%`],
          ["QB", report.questionBankAttempts],
          [
            "QB accuracy",
            report.questionBankAccuracyPercent === null ? "No attempts" : `${report.questionBankAccuracyPercent}%`,
          ],
          ["Exact PYQ", report.exactPyqAttempts],
          ["AI gaps", report.teacherDoubtCount],
          ["Me-time", report.meTimeChecks],
          ["News", report.currentAffairsUnlocked],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#dcd5c7] bg-white/75 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
            <p className="mt-1 text-base font-black">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-md border border-[#dcd5c7] bg-white/75 p-3 text-xs font-bold leading-5 text-[#4f5e55]">
        {report.nextAction}
      </p>
    </article>
  );
}

function ReportWindowCard({
  report,
  variant,
}: {
  report: GeographyReportWindow;
  variant: "weekly" | "monthly";
}) {
  return (
    <article
      data-testid={variant === "weekly" ? "upsc-weekly-report" : "upsc-monthly-report-card"}
      data-report-variant={variant}
      data-report-id={report.id}
      data-total-days={report.totalDays}
      data-started-days={report.startedDays}
      data-recall-attempts={report.recallAttempts}
      data-average-recall={report.averageRecall ?? "not-measured"}
      data-mcq-sets={report.mcqSets}
      data-average-mcq={report.averageMcq ?? "no-score"}
      data-recovery-items={report.recoveryItems}
      data-me-time-checks={report.meTimeChecks}
      data-current-affairs-unlocked={report.currentAffairsUnlocked}
      data-initial-known-percent={report.initialKnownPercent ?? "not-measured"}
      data-current-mastery-percent={report.currentMasteryPercent ?? "not-measured"}
      data-gap-filled-percent={report.gapFilledPercent ?? "not-measured"}
      data-remaining-gap-percent={report.remainingGapPercent ?? "not-measured"}
      data-verdict={report.verdict}
      className={`rounded-lg border p-5 shadow-sm ${
        variant === "monthly" ? "border-[#b9d9cd] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#fffdf8]"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{report.range}</p>
          <h2 className="mt-1 text-xl font-black tracking-tight">{report.title}</h2>
        </div>
        {variant === "monthly" ? <BarChart3 className="h-5 w-5 text-[#085041]" /> : <CalendarDays className="h-5 w-5 text-[#085041]" />}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["Started", `${report.startedDays}/${report.totalDays}`],
          ["Recall", report.averageRecall === null ? "Not measured" : `${report.averageRecall}/100`],
          ["Known first", report.initialKnownPercent === null ? "Not measured" : `${report.initialKnownPercent}%`],
          ["Gap filled", report.gapFilledPercent === null ? "Not measured" : `${report.gapFilledPercent}%`],
          ["MCQ", report.averageMcq === null ? "No score" : `${report.averageMcq}%`],
          ["Recovery", report.recoveryItems],
          ["Me-time", report.meTimeChecks],
          ["Current affairs", report.currentAffairsUnlocked],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#dcd5c7] bg-white/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
            <p className="mt-1 text-base font-black">{value}</p>
          </div>
        ))}
      </div>
      <GeographyGapGrowthBar report={report} />
      <div className="mt-4 rounded-md border border-[#dcd5c7] bg-white/70 p-3">
        <p className="text-sm font-black text-[#13251d]">{report.verdict}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#657066]">{report.nextAction}</p>
      </div>
    </article>
  );
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function GeographyGapGrowthBar({ report }: { report: GeographyReportWindow }) {
  const measured =
    report.initialKnownPercent !== null ||
    report.currentMasteryPercent !== null ||
    report.gapFilledPercent !== null ||
    report.remainingGapPercent !== null;
  const initialKnown = clampPercent(report.initialKnownPercent ?? 0);
  const currentMastery = clampPercent(report.currentMasteryPercent ?? report.initialKnownPercent ?? 0);
  const gapFilled = clampPercent(Math.max(0, currentMastery - initialKnown));
  const remainingGap = clampPercent(report.remainingGapPercent ?? Math.max(0, 100 - currentMastery));

  return (
    <div
      data-testid="geography-gap-growth-bar"
      data-report-id={report.id}
      data-initial-known-percent={measured ? initialKnown : "not-measured"}
      data-gap-filled-absolute-percent={measured ? gapFilled : "not-measured"}
      data-remaining-gap-percent={measured ? remainingGap : "not-measured"}
      className="mt-4 rounded-md border border-[#dcd5c7] bg-white/75 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
          Known vs gap filled
        </p>
        <p className="text-xs font-bold text-[#657066]">
          {measured ? `${initialKnown}% initial, ${gapFilled}% filled, ${remainingGap}% remaining` : "Module recall baseline pending"}
        </p>
      </div>
      <div
        aria-label="Geography growth stacked bar showing initially known, gap filled, and remaining gap"
        className="mt-3 flex h-3 overflow-hidden rounded-full bg-[#f7f4ee]"
      >
        {measured ? (
          <>
            <div
              data-testid="gap-bar-initial-known"
              className="h-full bg-[#1a3a2a]"
              style={{ width: `${initialKnown}%` }}
            />
            <div
              data-testid="gap-bar-filled"
              className="h-full bg-[#1d9e75]"
              style={{ width: `${gapFilled}%` }}
            />
            <div
              data-testid="gap-bar-remaining"
              className="h-full bg-[#ef9f27]"
              style={{ width: `${remainingGap}%` }}
            />
          </>
        ) : (
          <div className="h-full w-full bg-[#e7e2d9]" />
        )}
      </div>
      <div className="mt-3 grid gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#506257] sm:grid-cols-3">
        <span>Initial known</span>
        <span>Gap filled</span>
        <span>Remaining gap</span>
      </div>
    </div>
  );
}
