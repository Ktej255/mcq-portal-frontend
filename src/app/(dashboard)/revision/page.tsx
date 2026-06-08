"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarClock,
  ClipboardCheck,
  LibraryBig,
  RefreshCcw,
  Repeat2,
  Target,
} from "lucide-react";

import {
  buildDailyPlannerDecision,
  type DailyPlannerDecision,
  type DailyPlannerProgress,
} from "@/lib/upsc/dailyPlannerEngine";
import { readLocalQuestionBankAttempts } from "@/lib/upsc/questionBankEngine";
import {
  buildUpscStudentReportSnapshot,
  readLocalStudentReportProgress,
  studentReportSubjects,
  type StudentReportProgress,
  type StudentReportProgressMap,
  type StudentReportQuestionBankAttempt,
  type StudentReportQuestionBankAttemptMap,
  type StudentReportSubject,
  type StudentSubjectReport,
} from "@/lib/upsc/studentReportEngine";
import { readStudentProfile, type StudentProfile } from "@/lib/upsc/studentProfile";

type RevisionSubjectRow = {
  subject: StudentReportSubject;
  report: StudentSubjectReport;
  selectedDay: number;
  decision: DailyPlannerDecision;
  questionBankAttempts: StudentReportQuestionBankAttempt[];
  priority: number;
};

const emptyProgressBySubject = Object.fromEntries(
  studentReportSubjects.map((subject) => [subject.slug, {}])
) as Record<string, StudentReportProgressMap>;

function dayState(progress: StudentReportProgressMap, day: number) {
  return progress[String(day)];
}

function attemptsForDay(attempts: StudentReportQuestionBankAttempt[] = [], day: number) {
  return attempts.filter((attempt) => attempt.linkedDay === day);
}

function hasTeacherDoubt(progress?: StudentReportProgress) {
  return Boolean(
    progress?.teacherDoubtCategory &&
      progress.teacherDoubtReason &&
      progress.teacherDoubtRepairAction &&
      progress.teacherDoubtMasteryCheck
  );
}

function needsRecovery(progress?: StudentReportProgress, attempts: StudentReportQuestionBankAttempt[] = []) {
  return Boolean(
    progress?.revisitQueued ||
      progress?.talkBand === "Revisit" ||
      progress?.mcqOutcome === "Revisit" ||
      progress?.confidence === "Shaky" ||
      attempts.some((attempt) => !attempt.isCorrect)
  );
}

function hasEvidence(progress?: StudentReportProgress, attempts: StudentReportQuestionBankAttempt[] = []) {
  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      progress?.labCompleted ||
      progress?.mcqAttempted ||
      progress?.mcqCompleted ||
      progress?.meTimeCompletedAt ||
      attempts.length
  );
}

function selectRevisionDay(
  subject: StudentReportSubject,
  progress: StudentReportProgressMap,
  attempts: StudentReportQuestionBankAttempt[]
) {
  const teacherDoubt = subject.sessions.find((session) => hasTeacherDoubt(dayState(progress, session.day)));
  if (teacherDoubt) return teacherDoubt.day;

  const recovery = subject.sessions.find((session) =>
    needsRecovery(dayState(progress, session.day), attemptsForDay(attempts, session.day))
  );
  if (recovery) return recovery.day;

  const weakRecall = subject.sessions.find((session) => {
    const state = dayState(progress, session.day);
    return typeof state?.talkScore === "number" && state.talkScore < 95;
  });
  if (weakRecall) return weakRecall.day;

  const startedSessions = subject.sessions.filter((session) =>
    hasEvidence(dayState(progress, session.day), attemptsForDay(attempts, session.day))
  );
  const latestStartedDay = startedSessions.at(-1)?.day;
  if (latestStartedDay) return Math.min(latestStartedDay + 1, subject.sessions.length);

  return subject.sessions[0]?.day ?? 1;
}

function priorityFor(row: Omit<RevisionSubjectRow, "priority">) {
  if (row.decision.teacherDoubt) return 100;
  if (row.decision.revision.urgent) return 90;
  if (row.report.teacherDoubtCount > 0) return 80;
  if (row.report.recoveryItems > 0) return 70;
  if (row.questionBankAttempts.some((attempt) => !attempt.isCorrect)) return 65;
  if (row.report.averageRecall !== null && row.report.averageRecall < 95) return 60;
  if (row.report.meTimeChecks === 0 && row.report.startedDays > 0) return 45;
  if (row.report.startedDays === 0) return 35;
  return 20 + row.report.commandDays;
}

function primaryHref(row: RevisionSubjectRow) {
  if (row.decision.teacherDoubt) return row.decision.teacherDoubt.href;
  if (row.decision.revision.urgent) return row.decision.revision.href;
  return row.decision.sessionReadiness.href;
}

function primaryLabel(row: RevisionSubjectRow) {
  if (row.decision.teacherDoubt) return "Repair AI gap";
  if (row.decision.revision.urgent) return "Open revision";
  if (row.report.startedDays === 0) return "Start subject";
  return row.decision.sessionReadiness.actionLabel;
}

function subjectTone(row: RevisionSubjectRow) {
  if (row.decision.revision.urgent || row.report.teacherDoubtCount > 0 || row.report.recoveryItems > 0) {
    return "border-[#e8b061] bg-[#fff8ed]";
  }
  if (row.report.commandDays > 0) return "border-[#93d3b8] bg-[#f0fbf5]";
  return "border-[#dcd5c7] bg-[#fffdf8]";
}

export default function RevisionPage() {
  const [progressBySubject, setProgressBySubject] =
    useState<Record<string, StudentReportProgressMap>>(emptyProgressBySubject);
  const [questionBankAttemptsBySubject, setQuestionBankAttemptsBySubject] =
    useState<StudentReportQuestionBankAttemptMap>({});
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
      setProfile(readStudentProfile());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const report = useMemo(
    () => buildUpscStudentReportSnapshot(progressBySubject, questionBankAttemptsBySubject),
    [progressBySubject, questionBankAttemptsBySubject]
  );

  const subjectRows = useMemo<RevisionSubjectRow[]>(() => {
    return studentReportSubjects
      .map((subject) => {
        const subjectProgress = progressBySubject[subject.slug] ?? {};
        const attempts = questionBankAttemptsBySubject[subject.slug] ?? [];
        const selectedDay = selectRevisionDay(subject, subjectProgress, attempts);
        const decision = buildDailyPlannerDecision({
          subjectSlug: subject.slug,
          sessions: subject.sessions,
          selectedDay,
          progress: subjectProgress as Record<string, DailyPlannerProgress | undefined>,
          profile,
          questionBankAttempts: attempts,
        });
        const subjectReport = report.subjects.find((item) => item.slug === subject.slug) ?? report.subjects[0];
        const row = {
          subject,
          report: subjectReport,
          selectedDay,
          decision,
          questionBankAttempts: attempts,
        };

        return { ...row, priority: priorityFor(row) };
      })
      .sort((left, right) => right.priority - left.priority || left.subject.title.localeCompare(right.subject.title));
  }, [profile, progressBySubject, questionBankAttemptsBySubject, report.subjects]);

  const activeRow = subjectRows[0];
  const activeChecklist = activeRow?.decision.sessionReadiness.checklist.slice(0, 3) ?? [];
  const urgentCount = subjectRows.filter((row) => row.decision.revision.urgent).length;
  const questionBankAttemptCount = report.totals.questionBankAttempts;
  const aiGapCount = report.totals.teacherDoubtCount;
  const recoveryCount = report.totals.recoveryItems;
  const activePrimaryHref = activeRow ? primaryHref(activeRow) : "/upsc";
  const activePrimaryLabel = activeRow ? primaryLabel(activeRow) : "Start UPSC plan";
  const activeSignalCards = [
    {
      id: "learning-gap",
      label: "Learning gap",
      title:
        aiGapCount > 0
          ? `${aiGapCount} AI gap${aiGapCount === 1 ? "" : "s"} active`
          : recoveryCount > 0
            ? `${recoveryCount} repair item${recoveryCount === 1 ? "" : "s"} active`
            : "No urgent gap",
      detail: activeRow?.decision.learningGap.detail ?? "Start a subject day to generate the first gap proof.",
      icon: Target,
    },
    {
      id: "revise-next",
      label: "Revise next",
      title: activeRow?.decision.revision.title ?? "Revision baseline pending",
      detail: activeRow?.decision.revision.detail ?? "The first saved class will create your revision clock.",
      icon: RefreshCcw,
    },
    {
      id: "current-path",
      label: "Current path",
      title: `${report.totals.growthPercent}% evidence movement`,
      detail: `${report.totals.startedDays}/${report.totals.totalDays} planned subject days have saved evidence.`,
      icon: BarChart3,
    },
    {
      id: "today-task",
      label: "Today's task",
      title: activeRow?.decision.sessionReadiness.title ?? "Start your first day",
      detail: activeRow?.decision.sessionReadiness.detail ?? "Open the first subject step and let the planner adapt.",
      icon: ClipboardCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section
          data-testid="student-revision-command"
          data-proof-rule="all-subject-revision-from-recall-mcq-ai-gaps-me-time-question-bank"
          data-loaded={String(isLoaded)}
          data-subject-count={studentReportSubjects.length}
          data-urgent-count={urgentCount}
          data-recovery-items={recoveryCount}
          data-ai-gap-count={aiGapCount}
          data-me-time-checks={report.totals.meTimeChecks}
          data-question-bank-attempts={questionBankAttemptCount}
          data-current-affairs-unlocked={report.totals.currentAffairsUnlocked}
          data-primary-href={activePrimaryHref}
          data-primary-subject={activeRow?.subject.slug ?? "pending"}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">All-subject revision</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Revise the next weak point only
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                The page chooses one action from recall, MCQ, AI teacher gaps, me-time, and question-bank evidence so the
                student does not decide what to open next.
              </p>
            </div>
            <Link
              href={activePrimaryHref}
              data-testid="student-revision-primary-action"
              data-primary-href={activePrimaryHref}
              data-primary-subject={activeRow?.subject.slug ?? "pending"}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {activePrimaryLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {activeSignalCards.map((card) => (
            <article key={card.id} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
              <card.icon className="h-5 w-5 text-[#085041]" />
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{card.label}</p>
              <h2 className="mt-2 text-lg font-black tracking-tight">{card.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-[#085041]" />
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">One action queue</p>
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight">
              {activeRow ? `${activeRow.subject.title} Day ${activeRow.selectedDay}` : "No active subject yet"}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
              {activeRow?.decision.todayOriginProof.evidenceSummary ??
                "Start Day 1 to create a recall and revision evidence line."}
            </p>
            <div className="mt-4 space-y-2">
              {activeChecklist.map((item) => (
                <div
                  key={item.label}
                  className="flex gap-3 rounded-md border border-[#e4dccf] bg-[#f7f4ee] p-3 text-sm font-semibold text-[#4f5e55]"
                >
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1d9e75]" />
                  <span>
                    <strong className="text-[#13251d]">{item.label}:</strong> {item.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            data-testid="student-revision-weekly-monthly-proof"
            data-weekly-report-id={report.autoReport.weeklyReportId}
            data-monthly-report-id={report.autoReport.monthlyReportId}
            data-growth-percent={report.totals.growthPercent}
            data-weekly-windows={report.totals.weeklyWindowsGenerated}
            className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-[#085041]" />
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Report bridge</p>
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight">Weekly and monthly reports stay automatic</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{report.autoReport.evidenceRule}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Weekly</p>
                <p className="mt-1 text-sm font-black">{report.autoReport.weeklyReportId}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">{report.autoReport.nextWeeklyAction}</p>
              </div>
              <div className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Monthly</p>
                <p className="mt-1 text-sm font-black">{report.autoReport.monthlyReportId}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">{report.autoReport.nextMonthlyAction}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Repeat2 className="h-5 w-5 text-[#085041]" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Subject queue</p>
                <h2 className="text-xl font-black tracking-tight">Every subject keeps the same revision rule</h2>
              </div>
            </div>
            <Link
              href="/reports"
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              Open Reports
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {subjectRows.map((row) => {
              const href = primaryHref(row);
              return (
                <article
                  key={row.subject.slug}
                  data-testid="student-revision-subject-card"
                  data-subject-slug={row.subject.slug}
                  data-selected-day={row.selectedDay}
                  data-revision-urgent={String(row.decision.revision.urgent)}
                  data-revision-href={row.decision.revision.href}
                  data-readiness-status={row.decision.sessionReadiness.statusLabel}
                  data-learning-gap={row.decision.learningGap.title}
                  data-teacher-gap-count={row.report.teacherDoubtCount}
                  data-recovery-items={row.report.recoveryItems}
                  data-question-bank-attempts={row.report.questionBankAttempts}
                  data-me-time-checks={row.report.meTimeChecks}
                  className={`rounded-lg border p-4 shadow-sm ${subjectTone(row)}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                        {row.subject.window}
                      </p>
                      <h3 className="mt-1 text-lg font-black tracking-tight">{row.subject.title}</h3>
                    </div>
                    <Link
                      href={href}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white transition hover:bg-[#10291d]"
                    >
                      Open <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#4f5e55]">{row.decision.revision.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md border border-[#e4dccf] bg-white px-2.5 py-1 text-[11px] font-black text-[#1a3a2a]">
                      {row.decision.sessionReadiness.statusLabel}
                    </span>
                    <span className="rounded-md border border-[#e4dccf] bg-white px-2.5 py-1 text-[11px] font-black text-[#6f4a12]">
                      {row.decision.learningGap.title}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-[#13251d] sm:grid-cols-4">
                    <div className="rounded-md border border-[#e4dccf] bg-white p-2">
                      <LibraryBig className="mb-1 h-4 w-4 text-[#085041]" />
                      {row.report.startedDays}/{row.report.totalDays}
                    </div>
                    <div className="rounded-md border border-[#e4dccf] bg-white p-2">
                      <BrainCircuit className="mb-1 h-4 w-4 text-[#085041]" />
                      {row.report.averageRecall ?? 0}%
                    </div>
                    <div className="rounded-md border border-[#e4dccf] bg-white p-2">
                      <RefreshCcw className="mb-1 h-4 w-4 text-[#085041]" />
                      {row.report.recoveryItems}
                    </div>
                    <div className="rounded-md border border-[#e4dccf] bg-white p-2">
                      <ClipboardCheck className="mb-1 h-4 w-4 text-[#085041]" />
                      {row.report.questionBankAttempts}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
