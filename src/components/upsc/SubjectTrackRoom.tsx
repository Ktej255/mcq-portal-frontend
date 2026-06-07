"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Layers3,
  PlayCircle,
  RefreshCcw,
  TimerReset,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import { buildHistoryRevisionCommandDeck } from "@/lib/upsc/historyLearningDecks";
import { buildSubjectReadinessSnapshot } from "@/lib/upsc/subjectReadiness";
import type { SubjectDayReadiness } from "@/lib/upsc/subjectReadiness";
import { getSubjectGuidedStudyEntry } from "@/lib/upsc/subjectGuidedStudy";
import type { SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { useSubjectProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

export function SubjectTrackRoom({ plan, initialDay }: { plan: SubjectSprintPlan; initialDay?: number }) {
  const { progress, getDayProgress, isLoaded, stats } = useSubjectProgress(plan.slug, plan.sessions);
  const [learnerLevel, setLearnerLevel] = useState<StudentLevel>("beginner");
  const basePath = `/upsc/${plan.slug}`;
  const focusedDay =
    initialDay && Number.isFinite(initialDay) ? Math.min(Math.max(initialDay, 1), plan.sessions.length) : undefined;
  useEffect(() => {
    if (!isLoaded) return;
    setLearnerLevel(readStudentProfile()?.level ?? "beginner");
  }, [isLoaded]);

  const readinessSnapshot = buildSubjectReadinessSnapshot(plan, progress, learnerLevel);
  const focusedReadiness =
    readinessSnapshot.days.find(({ session }) => session.day === focusedDay) ??
    readinessSnapshot.nextActions[0] ??
    readinessSnapshot.days.find(({ session }) => session.day === stats.revisitDays[0]?.day) ??
    readinessSnapshot.days.find(({ session }) => session.day === stats.shakyDays[0]?.day) ??
    readinessSnapshot.days.find(({ progress: item }) => !item?.reflection?.trim()) ??
    readinessSnapshot.days[0];
  const talkPassedCount = readinessSnapshot.stageCounts.talk;
  const labProofCount = readinessSnapshot.stageCounts.lab;
  const mcqCommandCount = readinessSnapshot.stageCounts.mcq;
  const blockedCount = readinessSnapshot.blockedCount;
  const historyRevisionCommand =
    plan.slug === "history" ? buildHistoryRevisionCommandDeck(readinessSnapshot.days) : null;
  const focusedProgress = focusedReadiness?.progress;
  const historyWatchSceneCount = focusedProgress?.watchSceneCompletedIds?.length ?? 0;
  const historyWatchMediaCount = focusedProgress?.watchMediaReadyIds?.length ?? 0;
  const historyMediaSourceCount = Object.keys(focusedProgress?.watchMediaAssetSources ?? {}).length;
  const historyLabProofCount = focusedProgress?.labProofCompletedIds?.length ?? 0;
  const historyMcqQualityScore =
    typeof focusedProgress?.mcqQualityScore === "number" ? focusedProgress.mcqQualityScore : undefined;
  const historyMcqWarnings = focusedProgress?.mcqQualityWarnings ?? [];
  const historyCommandAuditItems =
    plan.slug === "history" && focusedReadiness
      ? [
          {
            id: "watch",
            label: "Watch scenes",
            value: `${historyWatchSceneCount}/5`,
            detail: focusedReadiness.watchComplete
              ? "Class proof saved with lecture scene completion."
              : "Complete the lecture scenes before Talk opens.",
            complete: focusedReadiness.watchComplete,
            icon: PlayCircle,
          },
          {
            id: "media",
            label: "Media assets",
            value: `${historyWatchMediaCount} ready`,
            detail:
              historyMediaSourceCount > 0
                ? `${historyMediaSourceCount} source references linked for video, map, timeline, or transcript.`
                : "Attach lecture video, map/timeline support, and transcript notes.",
            complete:
              historyWatchMediaCount >= 3 ||
              historyMediaSourceCount >= 3 ||
              Boolean(focusedProgress?.watchMediaTranscript?.trim()),
            icon: ClipboardCheck,
          },
          {
            id: "talk",
            label: "AI classroom",
            value: typeof focusedProgress?.talkScore === "number" ? `${focusedProgress.talkScore}%` : "Pending",
            detail:
              focusedProgress?.talkClassroomStage === "examiner-verdict"
                ? focusedProgress.talkNextActionLabel ?? "Examiner verdict saved."
                : focusedProgress?.talkNextActionLabel ?? "Teacher, peer challenge, and examiner verdict pending.",
            complete: focusedReadiness.talkMcqReady,
            icon: BrainCircuit,
          },
          {
            id: "lab",
            label: "Source-map proof",
            value: `${historyLabProofCount}/5`,
            detail: focusedProgress?.labProofSummary ?? "Save timeline, map, source, personality, and trap proof.",
            complete: focusedReadiness.labComplete,
            icon: Layers3,
          },
          {
            id: "mcq-quality",
            label: "MCQ quality",
            value: historyMcqQualityScore === undefined ? "Pending" : `${historyMcqQualityScore}%`,
            detail: focusedProgress?.mcqQualityPassed
              ? focusedProgress.mcqEvidenceAnchor ?? "Fresh History MCQ quality gate cleared."
              : historyMcqWarnings[0] ?? "Fresh MCQ batch still needs quality review.",
            complete: Boolean(focusedProgress?.mcqQualityPassed),
            icon: Gauge,
          },
          {
            id: "practice",
            label: "Practice route",
            value: focusedProgress?.mcqOutcome ?? focusedProgress?.mcqReadinessStatus ?? "Pending",
            detail: focusedProgress?.mcqRecoveryCompleted
              ? focusedProgress.mcqRecoverySummary ?? "Recovery completed. Retest fresh practice."
              : focusedProgress?.mcqReviewSummary ??
                focusedProgress?.mcqPreflightSummary ??
                "Run local practice after Watch, 95% Talk recall, fresh MCQ quality, and optional visual support.",
            complete: focusedReadiness.mcqPracticeCommand || focusedProgress?.mcqReadinessStatus === "practice-ready",
            icon: CheckCircle2,
          },
          ...(focusedProgress?.mcqRecoveryCompleted ||
          focusedProgress?.mcqOutcome === "Revisit" ||
          focusedProgress?.mcqReadinessStatus === "revisit"
            ? [
                {
                  id: "recovery",
                  label: "Recovery loop",
                  value: focusedProgress?.mcqRecoveryResolved
                    ? "Closed"
                    : focusedProgress?.mcqRecoveryCompleted
                      ? "Retest"
                      : "Open",
                  detail:
                    focusedProgress?.mcqRecoveryRetestSummary ??
                    focusedProgress?.mcqRecoverySummary ??
                    focusedProgress?.mcqReviewSummary ??
                    "MCQ revisit is open. Repair the trap, save proof, then retest fresh MCQs.",
                  complete: Boolean(focusedProgress?.mcqRecoveryResolved),
                  icon: RefreshCcw,
                },
              ]
            : []),
        ]
      : [];
  const focusedNextSession =
    focusedReadiness?.isCommandReady && focusedReadiness.session.day < plan.sessions.length
      ? plan.sessions.find((session) => session.day === focusedReadiness.session.day + 1)
      : undefined;
  const focusedNextEntry = focusedNextSession
    ? getSubjectGuidedStudyEntry(plan, focusedNextSession, learnerLevel, progress[String(focusedNextSession.day)])
    : null;
  const focusedStudentHref = focusedNextEntry
    ? focusedNextEntry.href
    : focusedReadiness?.href ?? basePath;
  const focusedStudentActionLabel = focusedNextEntry && focusedNextSession
    ? focusedNextEntry.gateId === "watch"
      ? `Start Day ${focusedNextSession.day} lesson`
      : focusedNextEntry.gateId === "talk"
        ? `Start Day ${focusedNextSession.day} diagnosis`
        : `Day ${focusedNextSession.day}: ${focusedNextEntry.actionLabel}`
    : focusedReadiness?.actionLabel ?? "Continue";
  const focusedStudentDetail =
    focusedNextEntry && focusedNextSession && focusedReadiness
      ? `Day ${focusedReadiness.session.day} is cleared. Continue with ${focusedNextSession.title}. ${focusedNextEntry.label}: ${focusedNextEntry.detail}`
      : focusedReadiness?.detail ?? "Open the first learning room and continue from there.";
  const historyCommandAuditScore = historyCommandAuditItems.length
    ? Math.round((historyCommandAuditItems.filter((item) => item.complete).length / historyCommandAuditItems.length) * 100)
    : 0;
  const historyCommandAuditNextHref =
    focusedNextSession ? focusedStudentHref : focusedProgress?.mcqNextRoute ?? focusedProgress?.talkNextRoute ?? focusedReadiness?.href ?? basePath;
  const historyCommandAuditNextLabel =
    focusedNextSession
      ? focusedStudentActionLabel
      : focusedProgress?.mcqNextActionLabel ?? focusedProgress?.talkNextActionLabel ?? focusedReadiness?.actionLabel ?? "Continue";
  const historyDayReportStatus = !focusedReadiness
    ? "No focused day"
    : focusedProgress?.mcqRecoveryResolved
      ? "Recovery closed"
      : focusedReadiness.isCommandReady
        ? "Command cleared"
        : focusedProgress?.mcqRecoveryCompleted
          ? "Retest pending"
          : focusedProgress?.mcqOutcome === "Revisit" || focusedProgress?.mcqReadinessStatus === "revisit"
            ? "Recovery required"
            : focusedReadiness.learningGateId === "watch"
              ? "Class not complete"
              : focusedReadiness.learningGateId === "talk"
                ? "AI teacher pending"
                : focusedReadiness.learningGateId === "lab"
                  ? "Recall support pending"
                  : focusedReadiness.learningGateId === "mcq" && focusedProgress?.mcqQualityPassed
                    ? "Practice ready"
                    : focusedReadiness.learningGateId === "mcq"
                      ? "Fresh MCQ pending"
                      : "In progress";
  const historyDayReportSummary = !focusedReadiness
    ? "Select a day to inspect readiness."
    : focusedProgress?.mcqRecoveryResolved
      ? `Day ${focusedReadiness.session.day} recovered successfully. ${focusedProgress.mcqRecoveryRetestSummary ?? "Recovery retest cleared and the loop is closed."}`
      : focusedReadiness.isCommandReady
        ? `Day ${focusedReadiness.session.day} is cleared because Watch, 95% AI classroom recall, fresh MCQ quality, and MCQ command are complete.`
        : focusedProgress?.mcqRecoveryCompleted
          ? `Day ${focusedReadiness.session.day} has repair proof saved. Retest the fresh MCQ batch before marking final command.`
          : focusedProgress?.mcqOutcome === "Revisit" || focusedProgress?.mcqReadinessStatus === "revisit"
            ? `Day ${focusedReadiness.session.day} is blocked by MCQ performance. Open Revisit, repair the trap, then retest fresh MCQs.`
            : focusedReadiness.learningGateId === "watch"
              ? `Day ${focusedReadiness.session.day} is blocked at Watch: lecture proof is ${historyWatchSceneCount}/5 scenes.`
              : focusedReadiness.learningGateId === "talk"
                ? `Day ${focusedReadiness.session.day} is blocked at AI classroom: command-level oral proof is not complete.`
                : focusedReadiness.learningGateId === "lab"
                  ? `Day ${focusedReadiness.session.day} needs recall support: visual proof is optional and currently ${historyLabProofCount}/5.`
                  : focusedReadiness.learningGateId === "mcq" && focusedProgress?.mcqQualityPassed
                    ? `Day ${focusedReadiness.session.day} has learning gates and MCQ quality ready. Start local practice to finish command.`
                    : `Day ${focusedReadiness.session.day} is waiting for fresh History MCQs and quality checks.`;
  const historyDayReportProofs =
    plan.slug === "history"
      ? [
          {
            label: "Lecture evidence",
            value: `${historyWatchSceneCount}/5 scenes, ${historyWatchMediaCount} media`,
            detail: focusedProgress?.watchMediaTranscript
              ? "Transcript or media notes are saved."
              : "Lecture scene and media proof should be attached.",
          },
          {
            label: "Oral command",
            value: typeof focusedProgress?.talkScore === "number" ? `${focusedProgress.talkScore}%` : "Pending",
            detail: focusedProgress?.talkVerdict ?? focusedProgress?.assessmentSummary ?? "AI classroom verdict not saved yet.",
          },
          {
            label: "Source-map proof",
            value: `${historyLabProofCount}/5 proofs`,
            detail: focusedProgress?.labProofSummary ?? "Timeline, source, map, personality, and trap proof still needed.",
          },
          {
            label: "Fresh MCQ quality",
            value: historyMcqQualityScore === undefined ? "Pending" : `${historyMcqQualityScore}%`,
            detail:
              focusedProgress?.mcqQualityPassed
                ? focusedProgress.mcqEvidenceAnchor ?? "History quality gate passed."
                : historyMcqWarnings[0] ?? "Fresh batch not yet cleared.",
          },
          {
            label: "Practice / recovery",
            value:
              focusedProgress?.mcqRecoveryResolved
                ? "Recovery closed"
                : focusedProgress?.mcqRecoveryCompleted
                  ? "Retest pending"
                  : focusedProgress?.mcqOutcome ?? focusedProgress?.mcqReadinessStatus ?? "Pending",
            detail:
              focusedProgress?.mcqRecoveryRetestSummary ??
              focusedProgress?.mcqRecoverySummary ??
              focusedProgress?.mcqReviewSummary ??
              focusedProgress?.mcqPreflightSummary ??
              "Practice has not produced a final command signal yet.",
          },
        ]
      : [];
  const historyDayReportBlockers = historyCommandAuditItems.filter((item) => !item.complete);

  const groupedSessions = plan.weeks.map((week) => ({
    ...week,
    sessions: readinessSnapshot.days.filter(({ session }) => session.week === week.week),
  }));
  const nextFocusSession =
    focusedReadiness?.session ??
    stats.revisitDays[0] ??
    stats.shakyDays[0] ??
    plan.sessions.find((session) => !getDayProgress(session.day)?.reflection?.trim()) ??
    plan.sessions[0];
  const focusedDayNumber = focusedReadiness?.session.day ?? nextFocusSession.day;
  const spacedRevisionDayNumber = Math.min(focusedDayNumber + 2, plan.sessions.length);
  const spacedRevisionItem = stats.revisitDays[0]
    ? {
        source: stats.revisitDays[0],
        due: plan.sessions.find((session) => session.day === Math.min(stats.revisitDays[0].day + 2, plan.sessions.length)) ?? stats.revisitDays[0],
      }
    : stats.spacedRevisionItems[0];
  const spacedRevisionSession =
    spacedRevisionItem?.source ??
    plan.sessions.find((session) => session.day === spacedRevisionDayNumber) ??
    nextFocusSession;
  const spacedRevisionDueSession =
    spacedRevisionItem?.due ?? spacedRevisionSession;
  const spacedRevisionHref =
    stats.revisitDays[0] || stats.spacedRevisionItems.length > 0
      ? `${basePath}/revisit?day=${spacedRevisionSession.day}`
      : `${basePath}/track?day=${spacedRevisionDueSession.day}`;
  const spacedRevisionCopy =
    stats.revisitDays[0]
      ? `Day ${spacedRevisionSession.day} is already in revisit. Repair it before new work.`
      : stats.spacedRevisionItems.length > 0
        ? `Day ${spacedRevisionSession.day} is due on study Day ${spacedRevisionDueSession.day}. Re-explain it before new content.`
        : `Revise Day ${spacedRevisionSession.day} on the Feynman + Day 3 recall cycle.`;
  const simpleTrendLabel =
    readinessSnapshot.score >= 75
      ? "Stable"
      : readinessSnapshot.score >= 45
        ? "Building"
        : "Needs support";
  const simpleTrackSignals = [
    {
      id: "gap",
      label: "Learning gap",
      value: focusedReadiness?.label ?? "Start class",
      detail: focusedReadiness?.detail ?? "Begin with the first watch room.",
      icon: Gauge,
      testId: "subject-track-learning-gap",
    },
    {
      id: "revision",
      label: "Next revision",
      value: stats.revisitDays[0] || stats.spacedRevisionItems.length > 0 ? `Day ${spacedRevisionSession.day}` : `Day ${spacedRevisionDueSession.day}`,
      detail: spacedRevisionCopy,
      icon: TimerReset,
      testId: "subject-track-next-revision",
    },
    {
      id: "trend",
      label: "Trend",
      value: simpleTrendLabel,
      detail: `${readinessSnapshot.score}% subject readiness, ${readinessSnapshot.commandReadyCount}/${readinessSnapshot.totalDays} command days.`,
      icon: BarChart3,
      testId: "subject-track-trend",
    },
  ];

  const stageStatusTone = (status: SubjectDayReadiness["stages"][number]["status"]) => {
    if (status === "complete") return "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041]";
    if (status === "active") return "border-[#ef9f27]/40 bg-[#fff4df] text-[#6f4a12]";
    if (status === "blocked") return "border-[#b91c1c]/35 bg-[#fef2f2] text-[#7f1d1d]";
    return "border-[#dcd5c7] bg-[#f7f4ee] text-[#746f66]";
  };
  const themeStyle = getSubjectThemeStyle(plan);

  if (!isLoaded) {
    return (
      <div style={themeStyle} className="flex min-h-screen items-center justify-center bg-[var(--subject-bg)] text-[var(--subject-text)]">
        <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-6 text-sm font-black">
          Loading {plan.title} progress...
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="subject-room-shell"
      data-room="track"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section
          data-testid="subject-track-simple-dashboard"
          className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4 shadow-sm md:p-6"
        >
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div
              data-testid="track-focused-day"
              className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-5"
            >
              <Link href={basePath} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
                <ArrowLeft className="h-4 w-4" /> {plan.title}
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">
                Today&apos;s task
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--subject-heading)] md:text-4xl">
                Day {focusedDayNumber}: {focusedReadiness?.session.title ?? nextFocusSession.title}
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#5d675f]">
                {focusedReadiness?.label ?? "Start class"}: {focusedStudentDetail}
              </p>
              {focusedNextSession ? (
                <div
                  data-testid="track-next-topic-handoff"
                  className="mt-4 rounded-md border border-[var(--subject-ring)] bg-white/80 px-3 py-2 text-sm font-black text-[var(--subject-dark)]"
                >
                  Next topic: Day {focusedNextSession.day} / {focusedNextSession.chapter}
                </div>
              ) : null}
              <Link
                data-testid="track-focused-route"
                href={focusedStudentHref}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90 sm:w-auto"
              >
                {focusedStudentActionLabel} <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {simpleTrackSignals.map((signal) => (
                <Link
                  key={signal.id}
                  href={signal.id === "revision" ? spacedRevisionHref : focusedStudentHref}
                  data-testid={signal.testId}
                  className="rounded-lg border border-[var(--subject-border)] bg-white/75 p-4 transition hover:-translate-y-0.5 hover:border-[var(--subject-accent)]"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-[var(--subject-dark)] text-white">
                    <signal.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                    {signal.label}
                  </p>
                  <p className="mt-2 text-xl font-black leading-6 text-[var(--subject-heading)]">{signal.value}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#657066]">{signal.detail}</p>
                </Link>
              ))}
            </div>
          </div>

          <details
            data-testid="subject-track-day-flow"
            className="group mt-5 rounded-lg border border-[var(--subject-border)] bg-white/60 p-3"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-md px-2 py-1 text-sm font-black text-[var(--subject-heading)] marker:text-[var(--subject-accent)]">
              <span>View 30-day path</span>
              <span className="text-xs font-bold text-[#746f66]">
                Optional map. Today&apos;s action is already selected above.
              </span>
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {readinessSnapshot.days.map((dayReadiness) => (
                <Link
                  key={dayReadiness.session.day}
                  href={dayReadiness.href}
                  data-testid={`track-day-${dayReadiness.session.day}`}
                  className={cn(
                    "min-h-20 rounded-md border p-3 transition hover:-translate-y-0.5",
                    dayReadiness.tone,
                    focusedDayNumber === dayReadiness.session.day ? "ring-2 ring-[var(--subject-dark)]/25" : ""
                  )}
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em]">Day {dayReadiness.session.day}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-black leading-5">{dayReadiness.session.title}</p>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] opacity-75">
                    {dayReadiness.label}
                  </p>
                </Link>
              ))}
            </div>
          </details>
        </section>

        <details
          data-testid="subject-track-advanced-tools"
          className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4 shadow-sm"
        >
          <summary className="cursor-pointer text-sm font-black text-[var(--subject-heading)]">
            Optional progress details
          </summary>
          <div className="mt-5 flex flex-col gap-6">
        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
            <Link href={basePath} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
              <ArrowLeft className="h-4 w-4" /> {plan.title} command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">Track</Badge>
              <span className="text-sm font-bold text-[#776f64]">Local progress memory</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--subject-accent)]">{plan.window}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
              Track {plan.title} command, doubt, and revisit.
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">
              This page reads your saved class state, Talk reflections, confidence marks, and revisit queue from local browser storage.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[var(--subject-accent)]" style={{ width: `${stats.completionPercent}%` }} />
            </div>
            <p className="mt-3 text-sm font-black text-[var(--subject-dark)]">{stats.completionPercent}% reflected</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Watched classes", value: stats.watchedCount, icon: PlayCircle },
              { label: "95% recall", value: talkPassedCount, icon: BrainCircuit },
              { label: "Visual support saved", value: labProofCount, icon: Layers3 },
              { label: "MCQ command", value: mcqCommandCount, icon: ClipboardCheck },
              { label: "Revisit queue", value: stats.revisitCount, icon: RefreshCcw },
              { label: "Blocked days", value: blockedCount, icon: Gauge },
              { label: "Command days", value: stats.commandCount, icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--subject-dark)] text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">{item.label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-[var(--subject-heading)]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          data-testid="subject-readiness-snapshot"
          className="grid gap-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm xl:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">
              Readiness dashboard
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
              {readinessSnapshot.score}% {plan.title} ready
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#657066]">
              This combines scene proof, AI teacher score, revisit repair, lab proof, fresh MCQ batch status, and MCQ practice outcome.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Command ready", `${readinessSnapshot.commandReadyCount}/${readinessSnapshot.totalDays}`],
              ["Needs action", readinessSnapshot.nextActions.length],
              ["Blocked before MCQ", readinessSnapshot.blockedCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-[#13251d]">{value}</p>
              </div>
            ))}
          </div>
          <div data-testid="subject-next-action-queue" className="xl:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black text-[#13251d]">Next action queue</p>
              <span className="text-xs font-bold text-[#746f66]">Priority: revisit, watch, talk, lab, MCQ</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {readinessSnapshot.nextActions.length === 0 ? (
                <div className="rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] p-4 text-sm font-black text-[#085041] md:col-span-3">
                  Every {plan.title} day is command-ready.
                </div>
              ) : (
                readinessSnapshot.nextActions.slice(0, 6).map((item) => (
                  <Link
                    key={item.session.day}
                    href={item.href}
                    data-testid={`subject-next-action-${item.session.day}`}
                    className={cn("rounded-md border p-4 transition hover:-translate-y-0.5", item.tone)}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] opacity-75">
                      Day {item.session.day} / {item.score}%
                    </p>
                    <p className="mt-2 text-sm font-black leading-5">{item.session.title}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 opacity-75">
                      {item.label}: {item.detail}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {historyCommandAuditItems.length > 0 && focusedReadiness ? (
          <section
            data-testid="history-track-command-audit"
            className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm"
          >
            <div className="mb-5 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">
                  History command audit
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--subject-heading)]">
                  Day {focusedReadiness.session.day}: {focusedReadiness.session.title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-[#657066]">
                  One live control board for lecture proof, media readiness, 95% AI classroom recall, optional visual support,
                  fresh MCQ quality, and the next practice route.
                </p>
              </div>
              <div className="w-full rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] px-4 py-3 text-left sm:w-auto sm:min-w-40 sm:text-right">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">Audit ready</p>
                <p className="mt-1 text-3xl font-black text-[var(--subject-heading)]">{historyCommandAuditScore}%</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {historyCommandAuditItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`history-track-command-audit-${item.id}`}
                  className={cn(
                    "rounded-lg border p-4",
                    item.complete
                      ? "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041]"
                      : "border-[#ef9f27]/35 bg-[#fff4df] text-[#6f4a12]"
                  )}
                >
                  <div className="mb-3 flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/75 text-[var(--subject-dark)] ring-1 ring-black/5">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <p className="break-words text-xs font-black uppercase tracking-[0.16em]">{item.label}</p>
                    </div>
                    <span className="max-w-full break-words rounded-md bg-white/75 px-2 py-1 text-xs font-black ring-1 ring-black/5 sm:shrink-0">
                      {item.value}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-5 opacity-85">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col items-stretch gap-3 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                  Next unlocked route
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-[#657066]">
                  {focusedProgress?.mcqEvidenceAnchor ?? focusedReadiness.detail}
                </p>
              </div>
              <Link
                href={historyCommandAuditNextHref}
                data-testid="history-track-command-audit-next-route"
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90 sm:w-auto"
              >
                {historyCommandAuditNextLabel} <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </section>
        ) : null}

        {plan.slug === "history" && focusedReadiness ? (
          <section
            data-testid="history-day-command-report"
            className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm"
          >
            <div className="mb-5 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">
                  Day command report
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--subject-heading)]">
                  Status: {historyDayReportStatus}
                </h2>
                <p className="mt-3 max-w-4xl text-sm font-bold leading-6 text-[#657066]">
                  {historyDayReportSummary}
                </p>
              </div>
              <div className="w-full rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] px-4 py-3 text-left sm:w-auto sm:min-w-40 sm:text-right">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">Day score</p>
                <p className="mt-1 text-3xl font-black text-[var(--subject-heading)]">{focusedReadiness.score}%</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div data-testid="history-day-command-proof-chain" className="grid gap-3 md:grid-cols-2">
                {historyDayReportProofs.map((proof) => (
                  <div key={proof.label} className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                    <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                        {proof.label}
                      </p>
                      <span className="max-w-full break-words rounded-md bg-white px-2 py-1 text-xs font-black text-[var(--subject-dark)] ring-1 ring-[var(--subject-ring)]">
                        {proof.value}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-5 text-[#657066]">{proof.detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <div
                  data-testid="history-day-command-blockers"
                  className={cn(
                    "rounded-lg border p-4",
                    historyDayReportBlockers.length === 0
                      ? "border-[#1d9e75]/40 bg-[#e7f5ee]"
                      : "border-[#ef9f27]/40 bg-[#fff4df]"
                  )}
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                    Why this day is {historyDayReportBlockers.length === 0 ? "cleared" : "blocked"}
                  </p>
                  {historyDayReportBlockers.length === 0 ? (
                    <p className="mt-3 text-sm font-black leading-6 text-[#085041]">
                      All active gates are clear. The student can move forward from this day.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      {historyDayReportBlockers.map((blocker) => (
                        <div key={blocker.id} className="rounded-md bg-white/75 p-3">
                          <p className="break-words text-xs font-black uppercase tracking-[0.14em] text-[#9a6a16]">{blocker.label}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#6f4a12]">{blocker.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                    Next action
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#657066]">
                    {focusedProgress?.mcqEvidenceAnchor ?? focusedReadiness.detail}
                  </p>
                  <Link
                    href={historyCommandAuditNextHref}
                    data-testid="history-day-command-report-next-route"
                    className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90"
                  >
                    {historyCommandAuditNextLabel} <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {historyRevisionCommand ? (
          <section
            data-testid="history-revision-command-board"
            className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm"
          >
            <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">
                  History 60-day command drill
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--subject-heading)]">
                  {historyRevisionCommand.score}% History revision command
                </h2>
                <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-[#657066]">
                  The board separates Modern, Ancient, Medieval, and Art/Culture so weak days are retested by the exact kind of History error.
                </p>
              </div>
              <div className="w-full rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] px-4 py-3 text-left sm:w-auto sm:min-w-40 sm:text-right">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">Command days</p>
                <p className="mt-1 text-2xl font-black text-[var(--subject-heading)]">
                  {historyRevisionCommand.commandCount}/{historyRevisionCommand.totalDays}
                </p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-4">
              {historyRevisionCommand.blocks.map((block) => (
                <div
                  key={block.id}
                  data-testid={`history-revision-block-${block.id}`}
                  className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                        {block.dayRange}
                      </p>
                      <h3 className="mt-1 text-lg font-black leading-6 text-[var(--subject-heading)]">{block.title}</h3>
                    </div>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-[var(--subject-dark)] ring-1 ring-[var(--subject-ring)]">
                      {block.averageScore}%
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-5 text-[#657066]">{block.focus}</p>
                  <div className="mt-3 rounded-md bg-white/75 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9a6a16]">Trap focus</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#6f4a12]">{block.trapFocus}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {block.stageGaps.length === 0 ? (
                      <span className="rounded-md bg-[#e7f5ee] px-2 py-1 text-xs font-black text-[#085041]">
                        Clean
                      </span>
                    ) : (
                      block.stageGaps.map((gap) => (
                        <span
                          key={`${block.id}-${gap.label}`}
                          className="rounded-md bg-[#fff4df] px-2 py-1 text-xs font-black text-[#6f4a12] ring-1 ring-[#ef9f27]/25"
                        >
                          {gap.label}: {gap.count}
                        </span>
                      ))
                    )}
                  </div>
                  {block.nextAction ? (
                    <Link
                      href={block.nextAction.href}
                      className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-xs font-black text-white transition hover:brightness-90"
                    >
                      Retest Day {block.nextAction.session.day}: {block.nextAction.actionLabel}
                    </Link>
                  ) : (
                    <div className="mt-4 rounded-md border border-[#1d9e75]/35 bg-[#e7f5ee] px-3 py-2 text-xs font-black text-[#085041]">
                      Block command-ready
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div data-testid="history-retest-queue" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--subject-heading)]">60-day retest queue</p>
                  <span className="text-xs font-bold text-[#746f66]">{historyRevisionCommand.retestQueue.length} active</span>
                </div>
                <div className="grid gap-2">
                  {historyRevisionCommand.retestQueue.length === 0 ? (
                    <div className="rounded-md border border-[#1d9e75]/35 bg-[#e7f5ee] p-3 text-sm font-black text-[#085041]">
                      No History retest pending.
                    </div>
                  ) : (
                    historyRevisionCommand.retestQueue.map((day) => (
                      <Link
                        key={day.session.day}
                        href={day.href}
                        className="grid gap-1 rounded-md border border-[var(--subject-border)] bg-white px-3 py-2 transition hover:border-[var(--subject-accent)]"
                      >
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                          Day {day.session.day} / {day.score}% / {day.label}
                        </span>
                        <span className="text-sm font-black leading-5 text-[var(--subject-heading)]">{day.session.title}</span>
                        <span className="text-xs font-semibold leading-5 text-[#657066]">{day.detail}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div data-testid="history-retest-protocol" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                <p className="text-sm font-black text-[var(--subject-heading)]">Retest protocol</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {historyRevisionCommand.protocol.map((step, index) => (
                    <div key={step} className="grid grid-cols-[32px_1fr] gap-3 rounded-md bg-white p-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--subject-accent)] text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <p className="text-xs font-bold leading-5 text-[#34453b]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">{plan.sessions.length}-day heatmap</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">{plan.title} sprint state</h2>
              </div>
              <BarChart3 className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-5">
              {groupedSessions.map((group) => (
                <div key={group.week} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{group.label}</p>
                    <span className="text-xs font-bold text-[#746f66]">{group.detail}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
                    {group.sessions.map((dayReadiness) => {
                      const { session, progress: dayProgress } = dayReadiness;
                      return (
                        <Link
                          key={session.day}
                          href={dayReadiness.href}
                          data-testid={`track-day-detail-${session.day}`}
                          className={cn(
                            "min-h-24 rounded-md border p-3 transition hover:-translate-y-0.5",
                            dayReadiness.tone,
                            focusedReadiness?.session.day === session.day ? "ring-2 ring-[#1a3a2a]/25" : ""
                          )}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-black uppercase tracking-[0.14em]">Day {session.day}</p>
                            <span className="flex items-center gap-1">
                              {dayProgress?.watched && <PlayCircle className="h-4 w-4" />}
                              {dayProgress?.reflection && <CheckCircle2 className="h-4 w-4" />}
                              {(dayProgress?.talkBand === "Practice" || dayProgress?.talkBand === "Command") && <BrainCircuit className="h-4 w-4" />}
                            </span>
                          </div>
                          <p className="text-sm font-black leading-5">{session.title}</p>
                          <p className="mt-2 text-xs font-semibold opacity-75">
                            {dayReadiness.label} / {dayReadiness.detail}
                          </p>
                          {dayProgress?.mcqCompleted && (
                            <p className="mt-2 text-xs font-black opacity-85">
                              MCQ practice done / {dayProgress.mcqCorrectCount ?? 0}/{dayProgress.mcqTotal ?? 0} correct
                            </p>
                          )}
                          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] opacity-75">
                            {dayReadiness.actionLabel}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            {focusedReadiness ? (
              <div
                data-testid="track-focused-day-detail"
                className={cn("rounded-lg border p-5 shadow-sm", focusedReadiness.tone)}
              >
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-75">Focused day</p>
                <h2 className="mt-2 text-xl font-black leading-7">
                  Day {focusedReadiness.session.day}: {focusedReadiness.session.title}
                </h2>
                <p className="mt-3 text-sm font-bold leading-6 opacity-80">{focusedReadiness.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{focusedReadiness.detail}</p>
                <div data-testid="subject-focused-stage-checklist" className="mt-4 grid gap-2">
                  {focusedReadiness.stages.map((stage) => (
                    <div key={stage.id} className={cn("rounded-md border px-3 py-2", stageStatusTone(stage.status))}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-[0.16em]">{stage.label}</p>
                        <span className="text-xs font-black">{stage.status}</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{stage.detail}</p>
                    </div>
                  ))}
                </div>
                {focusedReadiness.progress?.mcqAttempted && (
                  <div data-testid="subject-focused-mcq-outcome" className="mt-4 rounded-md border border-[#cfe5dc] bg-white/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                        Fresh MCQ practice
                      </p>
                      <span className="rounded-md bg-[#f7f4ee] px-2 py-1 text-xs font-black text-[#13251d]">
                        {focusedReadiness.progress.mcqOutcome ?? "Pending"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-black leading-6">
                      Score {focusedReadiness.progress.mcqCorrectCount ?? 0}/{focusedReadiness.progress.mcqTotal ?? 0} ({focusedReadiness.progress.mcqScorePercent ?? 0}%)
                    </p>
                    {focusedReadiness.progress.mcqReviewSummary && (
                      <p className="mt-1 text-xs font-semibold leading-5 opacity-75">
                        {focusedReadiness.progress.mcqReviewSummary}
                      </p>
                    )}
                  </div>
                )}
                <Link
                  data-testid="track-focused-route-detail"
                  href={focusedStudentHref}
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  {focusedStudentActionLabel} <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            ) : null}

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <TimerReset className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Revisit queue</p>
                  <p className="text-xs font-semibold text-[#746f66]">Days marked during Talk room</p>
                </div>
              </div>

              {stats.revisitDays.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#dcd5c7] bg-[#fdfaf3] p-5 text-sm font-bold leading-6 text-[#746f66]">
                  No revisit items yet. Mark a concept from the Talk room when it feels shaky.
                </div>
              ) : (
                <div className="grid gap-3">
                  {stats.revisitDays.map((session) => {
                    const item = getDayProgress(session.day);
                    return (
                      <Link
                        key={session.day}
                        href={`${basePath}/revisit?day=${session.day}`}
                        className="rounded-md border border-[#ef9f27]/40 bg-[#fff4df] p-4 transition hover:border-[#ef9f27]"
                      >
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a6a16]">
                          Day {session.day} / {item?.confidence ?? "Working"}
                        </p>
                        <p className="mt-2 text-sm font-black text-[#332514]">{session.title}</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-[#6f4a12]">
                          {item?.activePromptLabel ?? "Talk"} prompt saved for revisit.
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <SubjectLoopActions plan={plan} activeDay={nextFocusSession.day} current="track" />
          </div>
        </section>
          </div>
        </details>
      </div>
    </div>
  );
}
