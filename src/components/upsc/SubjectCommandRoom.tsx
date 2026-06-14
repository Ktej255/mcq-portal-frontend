"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Layers3,
  LineChart,
  Microscope,
  PlayCircle,
  RefreshCcw,
  TimerReset,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import { buildSubjectReadinessSnapshot, getSubjectDayReadiness } from "@/lib/upsc/subjectReadiness";
import { getSubjectGsCompatibility, getSubjectSyllabusChips } from "@/lib/upsc/subjectLearning";
import { buildSubjectDailyPath } from "@/lib/upsc/subjectGuidedStudy";
import { getSubjectBatchCode } from "@/lib/upsc/subjectPlans";
import type { SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import { getSubjectSourcePack } from "@/lib/upsc/syllabusPyqRegistry";
import { readStudentProfile, type StudentLevel, type StudentProfile } from "@/lib/upsc/studentProfile";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { useSubjectProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

const stepIcons = {
  watch: PlayCircle,
  talk: BrainCircuit,
  test: ClipboardCheck,
  track: LineChart,
  revisit: RefreshCcw,
};

const learnerLevelLabels: Record<StudentLevel, "Beginner" | "Intermediate" | "Advanced"> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function normalizeSavedLearnerLevel(level?: "Beginner" | "Intermediate" | "Advanced"): StudentLevel | null {
  if (level === "Beginner") return "beginner";
  if (level === "Intermediate") return "intermediate";
  if (level === "Advanced") return "advanced";
  return null;
}

export function SubjectCommandRoom({ plan, initialDay }: { plan: SubjectSprintPlan; initialDay?: number }) {
  const boundedInitialDay =
    initialDay && Number.isFinite(initialDay) ? Math.min(Math.max(initialDay, 1), plan.sessions.length) : 1;
  const [activeDay, setActiveDay] = useState(boundedInitialDay);
  const activeSession = plan.sessions.find((session) => session.day === activeDay) ?? plan.sessions[0];
  const [activeLabTitle, setActiveLabTitle] = useState(activeSession.lab);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [learnerLevel, setLearnerLevel] = useState<StudentLevel>("beginner");
  const [studyWindow, setStudyWindow] = useState("90 min");
  const { progress: progressMap, getDayProgress, isLoaded } = useSubjectProgress(plan.slug, plan.sessions);
  const activeProgress = getDayProgress(activeSession.day);
  const readinessSnapshot = useMemo(
    () => buildSubjectReadinessSnapshot(plan, progressMap, learnerLevel),
    [learnerLevel, plan, progressMap]
  );
  const generatedDailyPath = useMemo(
    () => buildSubjectDailyPath(plan, studentProfile, progressMap, activeSession.day),
    [activeSession.day, plan, progressMap, studentProfile]
  );
  const activeReadiness = useMemo(
    () => getSubjectDayReadiness(plan, activeSession, activeProgress, learnerLevel),
    [activeProgress, activeSession, learnerLevel, plan]
  );

  const activeWeek = activeSession.week;
  const weekSessions = useMemo(
    () => plan.sessions.filter((session) => session.week === activeWeek),
    [activeWeek, plan.sessions]
  );

  const selectedLab =
    plan.labs.find((lab) => lab.title === activeLabTitle) ??
    plan.labs.find((lab) => lab.title === activeSession.lab) ??
    plan.labs[0];
  const SelectedLabIcon = selectedLab?.icon ?? Layers3;
  const sprintProgress = Math.round((activeSession.day / plan.sessions.length) * 100);
  const basePath = `/upsc/${plan.slug}`;
  const themeStyle = getSubjectThemeStyle(plan);
  const syllabusAnchor = getSubjectGsCompatibility(plan, activeSession);
  const syllabusChips = getSubjectSyllabusChips(activeSession);
  const sourcePack = getSubjectSourcePack(plan.slug);
  const leadTrendInsight = sourcePack?.trendInsights[0];
  const learnerLevelLabel = learnerLevelLabels[learnerLevel];
  const firstActionCopy =
    learnerLevel === "beginner"
      ? {
          title: "Start with the short lesson. Discussion opens after the topic is complete.",
          detail: "Beginner path: one 10-15 minute topic -> AI discussion to 95% recall -> fresh MCQ -> next topic.",
        }
      : learnerLevel === "advanced"
        ? {
            title: "Explain first. The AI finds the attempt-level gap before any repair class.",
            detail: "Advanced path: speak the topic, diagnose missing UPSC links, repair only the weak concept, then clear 95% recall and MCQs.",
          }
        : {
            title: "Explain first. The AI checks what coaching already covered.",
            detail: "Intermediate path: oral diagnosis -> focused repair -> 95% recall -> fresh MCQ -> next topic.",
          };

  const sessionSteps = [
    { label: "Talk", detail: activeSession.talk, icon: stepIcons.talk },
    { label: "Watch", detail: activeSession.watch, icon: stepIcons.watch },
    { label: "Test", detail: activeSession.test, icon: stepIcons.test },
    { label: "Track", detail: activeSession.track, icon: stepIcons.track },
    { label: "Revisit", detail: activeSession.revisit, icon: stepIcons.revisit },
  ];
  const nextRevisionDay = Math.min(activeSession.day + 2, plan.sessions.length);
  const trendScore = activeProgress?.talkScore ?? activeReadiness.score;
  const trendLabel = activeProgress?.talkBand
    ? `${activeProgress.talkBand} recall band`
    : activeReadiness.score >= 95
      ? "Command trend"
      : "Not measured yet";
  const revisionSummary = activeProgress?.revisitQueued
    ? `${activeSession.title} is queued for repair before the next topic.`
    : `Day ${nextRevisionDay}: ${activeSession.revisit}`;

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setTimeout(() => {
      const saved = getDayProgress(activeSession.day);
      const studentProfile = readStudentProfile();
      setStudentProfile(studentProfile);
      setLearnerLevel(normalizeSavedLearnerLevel(saved?.learnerLevel) ?? studentProfile?.level ?? "beginner");
      setStudyWindow(saved?.studyWindow ?? (studentProfile ? `${studentProfile.studyWindow} min` : "90 min"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeSession.day, getDayProgress, isLoaded]);

  const selectWeek = (week: number) => {
    const firstSession = plan.sessions.find((session) => session.week === week);
    if (!firstSession) return;
    setActiveDay(firstSession.day);
    setActiveLabTitle(firstSession.lab);
  };

  const selectDay = (day: number) => {
    const session = plan.sessions.find((item) => item.day === day);
    if (!session) return;
    setActiveDay(day);
    setActiveLabTitle(session.lab);
  };

  return (
    <div
      data-testid="subject-standard-shell"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      data-subject-dark={plan.dark}
      data-subject-light={plan.light}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section
          data-testid="subject-simple-student-flow"
          data-visible-mode="four-signal-one-action"
          data-essential-signal-count="4"
          data-essential-signals="todays-task|learning-gap|next-revision|current-path"
          data-primary-action-href={activeReadiness.href}
          data-active-subject={plan.slug}
          data-active-day={activeSession.day}
          data-current-readiness={activeReadiness.label}
          className="space-y-4 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4 shadow-sm md:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">{plan.badge}</Badge>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                  Day {activeSession.day} of {plan.sessions.length}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--subject-heading)] md:text-4xl">
                Today's {plan.title} study
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Follow the next button. The generated path and deeper planner stay folded into this simple daily flow.
              </p>
            </div>
            <Link
              href="/upsc#upsc-intake"
              data-testid="subject-command-profile-summary"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--subject-border)] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)]"
            >
              {learnerLevelLabel} - {studyWindow}
            </Link>
          </div>

          <article
            data-testid="subject-command-next-action"
            data-student-signal="todays-task"
            data-next-action-href={activeReadiness.href}
            data-next-action-label={activeReadiness.actionLabel}
            className={cn("rounded-lg border p-4 md:p-5", activeReadiness.tone)}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-75">Today's task</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{activeSession.title}</h2>
                <p
                  data-testid="subject-command-primary-status"
                  className="mt-2 text-sm font-black leading-6 opacity-85"
                >
                  Status: {activeReadiness.label}
                </p>
                <div data-testid="subject-command-student-instruction" className="mt-3 max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.16em] opacity-75">First action</p>
                  <p className="mt-1 text-sm font-black leading-6 md:text-base">{firstActionCopy.title}</p>
                </div>
              </div>
              <span
                data-testid="subject-command-readiness-score"
                className="rounded-md bg-white/75 px-3 py-2 text-sm font-black text-[var(--subject-dark)] ring-1 ring-black/5"
              >
                {activeReadiness.score}% ready
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                data-testid="subject-command-action-route"
                href={activeReadiness.href}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90"
              >
                {activeReadiness.actionLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="min-w-0 flex-1 text-sm font-bold leading-6 opacity-80">{activeReadiness.detail}</p>
            </div>
          </article>

          <section
            data-testid="subject-generated-daily-path"
            className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                  Generated path
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--subject-heading)]">
                  {generatedDailyPath.length} topic{generatedDailyPath.length === 1 ? "" : "s"} in today's sitting
                </h2>
              </div>
              <span
                data-testid="subject-level-identified"
                className="rounded-md border border-[var(--subject-ring)] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--subject-dark)]"
              >
                {learnerLevelLabel} path identified
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {generatedDailyPath.map((topic) => (
                <div
                  key={`${topic.day}-${topic.title}`}
                  data-testid="subject-generated-daily-topic"
                  data-topic-state={topic.state}
                  data-topic-gate={topic.gateId}
                  className={cn(
                    "rounded-lg border bg-white p-3",
                    topic.state === "current" ? "border-[var(--subject-accent)]" : "border-[var(--subject-border)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                      Day {topic.day}
                    </p>
                    <span className="rounded-md bg-[var(--subject-light)] px-2 py-1 text-[10px] font-black text-[var(--subject-dark)]">
                      {topic.durationLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-black leading-5 text-[var(--subject-heading)]">{topic.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">{topic.chapter}</p>
                  <div className="mt-3 rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                        {topic.gateLabel}
                      </p>
                      <span className="text-[11px] font-black text-[var(--subject-dark)]">
                        {topic.readinessScore}% ready
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#59685f]">Next: {topic.entryLabel}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#7a746b]">
                      {topic.gateDetail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div
            data-testid="subject-four-signal-grid"
            data-signal-count="4"
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            <Link
              href={activeReadiness.href}
              data-testid="subject-signal-todays-task"
              data-signal-priority="primary"
              data-signal-route={activeReadiness.href}
              className="rounded-lg border border-[var(--subject-accent)] bg-[var(--subject-light)] p-4 transition hover:border-[var(--subject-dark)] hover:bg-white"
            >
              <ClipboardCheck className="h-5 w-5 text-[var(--subject-accent)]" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                Today's task
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-[var(--subject-heading)]">
                {activeReadiness.actionLabel}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">{activeSession.title}</p>
            </Link>

            <Link
              href={activeReadiness.href}
              data-testid="subject-signal-learning-gap"
              className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4 transition hover:border-[var(--subject-accent)] hover:bg-[var(--subject-light)]"
            >
              <Microscope className="h-5 w-5 text-[var(--subject-accent)]" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                Learning gap
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-[var(--subject-heading)]">{activeReadiness.label}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">{activeReadiness.detail}</p>
            </Link>

            <Link
              href={`${basePath}/revisit?day=${activeSession.day}`}
              data-testid="subject-signal-next-revision"
              className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4 transition hover:border-[var(--subject-accent)] hover:bg-[var(--subject-light)]"
            >
              <TimerReset className="h-5 w-5 text-[var(--subject-accent)]" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                Next revision
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-[var(--subject-heading)]">{revisionSummary}</p>
            </Link>

            <Link
              href={`${basePath}/track?day=${activeSession.day}`}
              data-testid="subject-signal-current-path"
              data-current-week={activeWeek}
              data-current-day={activeSession.day}
              data-total-days={plan.sessions.length}
              data-sprint-progress={sprintProgress}
              className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4 transition hover:border-[var(--subject-accent)] hover:bg-[var(--subject-light)]"
            >
              <CalendarDays className="h-5 w-5 text-[var(--subject-accent)]" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                Current path
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-[var(--subject-heading)]">
                Day {activeSession.day}/{plan.sessions.length} - Week {activeWeek}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">
                {trendLabel} - {trendScore}% signal. Track decides repair, practice, or the next topic.
              </p>
            </Link>
          </div>

          <details
            data-testid="subject-command-context-details"
            className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)]"
          >
            <summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
              Open syllabus, private note, and class context
            </summary>
            <div className="space-y-4 border-t border-[var(--subject-border)] p-4">
              <div
                data-testid="subject-command-syllabus-anchor"
                className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                  Syllabus anchor
                </p>
                <p className="mt-2 max-w-3xl text-sm font-black leading-6 text-[var(--subject-heading)]">
                  {syllabusAnchor}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {syllabusChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-md border border-[var(--subject-ring)] bg-white px-2.5 py-1 text-xs font-bold text-[var(--subject-dark)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {sourcePack ? (
                <div
                  data-testid="subject-command-source-path"
                  data-subject-slug={plan.slug}
                  data-pyq-row-count={sourcePack.pyqRows.length}
                  data-trend-insight-count={sourcePack.trendInsights.length}
                  data-readiness-score={sourcePack.readinessScore}
                  className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                        Systematic source path
                      </p>
                      <h3 className="mt-1 text-lg font-black tracking-tight text-[var(--subject-heading)]">
                        Syllabus + PYQ + trend + current affairs
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/upsc/source-library"
                        className="inline-flex min-h-9 items-center rounded-md border border-[var(--subject-ring)] bg-white px-3 text-xs font-black text-[var(--subject-dark)]"
                      >
                        Source library <FileSearch className="ml-2 h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/upsc/current-affairs?subject=${plan.slug}`}
                        className="inline-flex min-h-9 items-center rounded-md bg-[var(--subject-dark)] px-3 text-xs font-black text-white"
                      >
                        Covered news <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["NCERT basics", sourcePack.systematicPath.basicsStart],
                      ["Reference depth", sourcePack.systematicPath.advancedBridge],
                      [
                        "PYQ trend",
                        leadTrendInsight
                          ? `${leadTrendInsight.label}: ${leadTrendInsight.pyqSignal}`
                          : "Trend board is indexed in the source library.",
                      ],
                      ["Current affairs gate", sourcePack.systematicPath.currentAffairsRule],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                          {label}
                        </p>
                        <p className="mt-1 text-xs font-bold leading-5 text-[#49675e]">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--subject-dark)]">
                    <span className="rounded-md bg-[var(--subject-light)] px-2.5 py-1">{sourcePack.pyqRows.length} GS PYQ rows</span>
                    <span className="rounded-md bg-[var(--subject-light)] px-2.5 py-1">{sourcePack.trendInsights.length} trend boards</span>
                    <span className="rounded-md bg-[var(--subject-light)] px-2.5 py-1">{sourcePack.readinessScore}% source readiness</span>
                  </div>
                </div>
              ) : null}

              <div className="rounded-lg border border-[var(--subject-ring)] bg-[var(--subject-light)] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                  Flow rule
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">{firstActionCopy.detail}</p>
              </div>

              <div
                data-testid="subject-command-input-rule"
                className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                  Student input rule
                </p>
                <h3 className="mt-2 text-sm font-black text-[var(--subject-heading)]">
                  {learnerLevel === "beginner" ? "Lesson first, then Talk" : "Speak first inside Talk"}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                  {learnerLevel === "beginner"
                    ? "This command page only chooses the route. The learner explains the topic after the short lesson opens the Talk room."
                    : "This command page does not collect a second baseline. The learner explains the topic in Talk, and the AI opens only the missing repair."}
                </p>
                {activeProgress?.baselineKnowledge?.trim() ? (
                  <div
                    data-testid="subject-command-baseline-preview"
                    className="mt-3 rounded-md border border-[var(--subject-ring)] bg-[var(--subject-light)] p-3"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                      Saved Talk baseline
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[var(--subject-dark)]">
                      {activeProgress.baselineKnowledge}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </details>
        </section>

        <details data-testid="subject-planner-details" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] shadow-sm">
          <summary className="cursor-pointer px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
            Open full {plan.sessions.length}-day planner and readiness details
          </summary>
          <div className="space-y-6 border-t border-[var(--subject-border)] p-5">
        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">{plan.badge}</Badge>
              <span className="text-sm font-bold text-[#776f64]">{plan.window} command room</span>
            </div>

            <div className="grid gap-5 2xl:grid-cols-[1fr_180px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--subject-accent)]">
                  Day {activeSession.day} of {plan.sessions.length}
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-4xl">
                  {activeSession.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">
                  {activeSession.anchor}
                </p>
              </div>

              <div className="rounded-lg border border-[var(--subject-ring)] bg-[var(--subject-light)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <CalendarDays className="h-5 w-5 text-[var(--subject-dark)]" />
                  <span className="text-sm font-black text-[var(--subject-dark)]">{sprintProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[var(--subject-accent)]" style={{ width: `${sprintProgress}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold leading-5 text-[#49675e]">{activeSession.chapter}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                  {activeSession.duration}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Current block", value: activeSession.chapter },
                { label: "Lab focus", value: activeSession.lab },
                { label: "Next state", value: isLoaded ? activeReadiness.label : "Reading local state" },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">{item.label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[var(--subject-heading)]">{item.value}</p>
                </div>
              ))}
            </div>

            <div
              data-testid="subject-command-next-action-detail"
              className={cn("mt-6 rounded-lg border p-4", activeReadiness.tone)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.22em] opacity-75">Next action</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">{activeReadiness.label}</h2>
                  <p className="mt-2 break-words text-sm font-bold leading-6 opacity-80">{activeReadiness.detail}</p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <span
                    data-testid="subject-command-readiness-score-detail"
                    className="rounded-md bg-white/70 px-3 py-2 text-sm font-black text-[var(--subject-dark)] ring-1 ring-black/5"
                  >
                    {activeReadiness.score}% ready
                  </span>
                  <Link
                    data-testid="subject-command-action-route-detail"
                    href={activeReadiness.href}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90"
                  >
                    {activeReadiness.actionLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-5">
                {activeReadiness.stages.map((stage) => (
                  <div key={stage.id} className="rounded-md bg-white/60 p-3 ring-1 ring-black/5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] opacity-75">{stage.label}</p>
                    <p className="mt-1 text-sm font-black">{stage.status}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{stage.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Sprint selector</p>
                <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Choose week and day</h2>
              </div>
              <CalendarDays className="h-6 w-6 text-[var(--subject-dark)]" />
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {plan.weeks.map((tab) => {
                const isActive = activeWeek === tab.week;
                return (
                  <button
                    key={tab.week}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectWeek(tab.week)}
                    className={cn(
                      "min-h-16 rounded-md border px-3 py-2 text-left transition",
                      isActive
                        ? "border-[var(--subject-accent)] bg-[var(--subject-light)] text-[var(--subject-dark)]"
                        : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[#5f665f] hover:border-[var(--subject-accent)]"
                    )}
                  >
                    <span className="block text-sm font-black">{tab.label}</span>
                    <span className="mt-1 block text-xs font-semibold">{tab.detail}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {weekSessions.map((session) => {
                const isActive = activeSession.day === session.day;
                return (
                  <button
                    key={session.day}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectDay(session.day)}
                    className={cn(
                      "min-h-20 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                        : "border-[var(--subject-border)] bg-[var(--subject-card)] text-[#34453b] hover:bg-[var(--subject-light)]"
                    )}
                  >
                    <span className="block text-xs font-black uppercase tracking-[0.16em]">
                      Day {session.day}
                    </span>
                    <span className="mt-2 block text-sm font-bold leading-5">{session.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <SubjectLoopActions
          plan={plan}
          activeDay={activeSession.day}
          title="Subject loop"
          detail={`Use the same room sequence for every ${plan.title} day.`}
        />

        <section
          data-testid="subject-command-subject-readiness"
          className="grid gap-5 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm xl:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">
              Subject readiness
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--subject-heading)]">
              {plan.title} command snapshot
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#657066]">
              The same local gate checks used by Talk, Watch, Lab, MCQ, Track, and Revisit are now visible here.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Readiness", `${readinessSnapshot.score}%`],
              ["Command days", `${readinessSnapshot.commandReadyCount}/${readinessSnapshot.totalDays}`],
              ["Blocked days", readinessSnapshot.blockedCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">{label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-[var(--subject-heading)]">{value}</p>
              </div>
            ))}
          </div>
          <div className="xl:col-span-2">
            <div className="grid gap-3 sm:grid-cols-5">
              {[
                ["Watch", readinessSnapshot.stageCounts.watch],
                ["Talk", readinessSnapshot.stageCounts.talk],
                ["Revisit", readinessSnapshot.stageCounts.revisit],
                ["Lab", readinessSnapshot.stageCounts.lab],
                ["MCQ", readinessSnapshot.stageCounts.mcq],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-soft)] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">{label}</p>
                  <p className="mt-2 text-xl font-black text-[var(--subject-heading)]">{value}/{readinessSnapshot.totalDays}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Session plan</p>
                <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Recall, watch, test, track, revisit</h2>
              </div>
              <Badge variant="outline" className="rounded-md border-[var(--subject-ring)] text-[var(--subject-dark)]">
                {activeSession.duration}
              </Badge>
            </div>

            <div className="grid gap-3">
              {sessionSteps.map((step) => (
                <div key={step.label} className="grid grid-cols-[44px_1fr] gap-3 rounded-md bg-[var(--subject-bg)] p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--subject-accent)] text-white">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-black text-[var(--subject-dark)]">{step.label}</p>
                      {step.label === "Watch" && (
                        <Link
                          href={`${basePath}/watch?day=${activeSession.day}`}
                          className="text-xs font-black text-[var(--subject-accent)] underline-offset-4 hover:underline"
                        >
                          Open class
                        </Link>
                      )}
                      {step.label === "Talk" && (
                        <Link
                          href={`${basePath}/talk?day=${activeSession.day}`}
                          className="text-xs font-black text-[var(--subject-accent)] underline-offset-4 hover:underline"
                        >
                          Open room
                        </Link>
                      )}
                      {step.label === "Test" && (
                        <Link
                          href={`${basePath}/mcq-readiness?day=${activeSession.day}`}
                          className="text-xs font-black text-[var(--subject-accent)] underline-offset-4 hover:underline"
                        >
                          {getSubjectBatchCode(plan.slug, activeSession.day)}
                        </Link>
                      )}
                      {step.label === "Track" && (
                        <Link
                          href={`${basePath}/track`}
                          className="text-xs font-black text-[var(--subject-accent)] underline-offset-4 hover:underline"
                        >
                          Open tracker
                        </Link>
                      )}
                      {step.label === "Revisit" && (
                        <Link
                          href={`${basePath}/revisit?day=${activeSession.day}`}
                          className="text-xs font-black text-[var(--subject-accent)] underline-offset-4 hover:underline"
                        >
                          Open recovery
                        </Link>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#51665d]">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[var(--subject-ring)] bg-[var(--subject-light)] p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Subject lab</p>
                  <h2 className="text-2xl font-black tracking-tight text-[var(--subject-dark)]">{selectedLab.title}</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--subject-accent)] text-white">
                  <SelectedLabIcon className="h-5 w-5" />
                </div>
              </div>

              <p className="text-sm font-semibold leading-6 text-[#49675e]">{selectedLab.detail}</p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {plan.labs.map((lab) => {
                  const isActive = selectedLab.title === lab.title;
                  return (
                    <button
                      key={lab.title}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveLabTitle(lab.title)}
                      className={cn(
                        "flex min-h-12 items-center gap-2 rounded-md border px-3 text-left text-xs font-black transition",
                        isActive
                          ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                          : "border-[var(--subject-ring)] bg-white/75 text-[#426259] hover:border-[var(--subject-accent)]"
                      )}
                    >
                      <lab.icon className="h-4 w-4 shrink-0" />
                      <span>{lab.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--subject-heading)]">Fresh MCQ upload contract</p>
                  <p className="text-xs font-semibold text-[#746f66]">Mapped to the selected {plan.title} session</p>
                </div>
              </div>

              <div className="grid gap-2">
                {[
                  ["Subject", plan.title],
                  ["Day", `Day ${activeSession.day}`],
                  ["Chapter", activeSession.chapter],
                  ["Topic", activeSession.title],
                  ["Batch", getSubjectBatchCode(plan.slug, activeSession.day)],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[96px_1fr] gap-3 rounded-md bg-[var(--subject-bg)] px-3 py-2">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">{label}</span>
                    <span className="text-sm font-bold text-[#34453b]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--subject-dark)] text-white">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-[var(--subject-heading)]">Reusable subject architecture</p>
              <p className="text-xs font-semibold text-[#746f66]">
                This page is data-driven from `SubjectSprintPlan` and can be repeated for the next UPSC subjects.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              "Subject plan model",
              "Daily session selector",
              "Learning loop mapping",
              "Fresh MCQ batch contract",
            ].map((item, index) => (
              <div key={item} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-soft)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Layer {index + 1}</p>
                <p className="mt-2 text-sm font-black leading-5 text-[var(--subject-heading)]">{item}</p>
                {index === 0 && <CheckCircle2 className="mt-4 h-4 w-4 text-[var(--subject-accent)]" />}
                {index === 1 && <Microscope className="mt-4 h-4 w-4 text-[var(--subject-accent)]" />}
                {index === 2 && <TimerReset className="mt-4 h-4 w-4 text-[var(--subject-accent)]" />}
                {index === 3 && <ClipboardCheck className="mt-4 h-4 w-4 text-[var(--subject-accent)]" />}
              </div>
            ))}
          </div>
        </section>
          </div>
        </details>
      </div>
    </div>
  );
}
