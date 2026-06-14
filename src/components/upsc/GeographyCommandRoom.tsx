"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileSearch,
  Lock,
  MapPinned,
  PlayCircle,
  RefreshCcw,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getGeographyLoopState, hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { GEOGRAPHY_RECALL_TARGET, getCurrentGeographyTopic, getGuidedStudySteps } from "@/lib/upsc/guidedStudy";
import {
  geographyCompletionAuditItems,
  getGeographyCompletionAuditSummary,
} from "@/lib/upsc/geographyCompletionAudit";
import {
  getGeographyGsCompatibility,
  getGeographySubtopics,
  labSlugForGeographySession,
} from "@/lib/upsc/geographyLearning";
import {
  geographyModuleReadinessSummaries,
  getGeographyModuleReadiness,
  getPrimaryGeographyContentModuleForDay,
} from "@/lib/upsc/geographyContentModules";
import {
  getGeographyTopicCoverageSummary,
  getGeographyTopicGroupsForDay,
  geographyTopicGroups,
} from "@/lib/upsc/geographyTopicCoverage";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { getSubjectSourcePack } from "@/lib/upsc/syllabusPyqRegistry";
import { useGeographyProgress, type GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

type FunnelStatus = "done" | "current" | "locked";

type FunnelStep = {
  id: string;
  label: string;
  helper: string;
  href: string;
  status: FunnelStatus;
  icon: LucideIcon;
};

const stepTone: Record<FunnelStatus, string> = {
  done: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
  current: "border-[#1a3a2a] bg-[#1a3a2a] text-white",
  locked: "border-[#dcd5c7] bg-[#f7f4ee] text-[#786f64]",
};

const stepBadgeTone: Record<FunnelStatus, string> = {
  done: "bg-white text-[#085041]",
  current: "bg-white/15 text-white",
  locked: "bg-white text-[#786f64]",
};

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function getDayStatus(progress: GeographyDayProgress | undefined, learnerLevel: StudentLevel) {
  if (progress?.mcqCompleted) return "Practice done";
  if (progress?.mcqAttempted) return "Practice active";
  if (hasGeographyTalkClearance(progress)) return "MCQ next";
  if (progress?.revisitQueued || progress?.talkBand === "Revisit") return "Revisit next";
  if (
    learnerLevel !== "beginner" &&
    typeof progress?.talkScore === "number" &&
    progress.talkScore < GEOGRAPHY_RECALL_TARGET &&
    !progress?.watched
  ) return "Repair next";
  if (progress?.watched) return "Talk pending";
  return learnerLevel === "beginner" ? "Lesson next" : "Talk first";
}

function buildFunnelSteps(
  session: GeographySession,
  progress: GeographyDayProgress | undefined,
  currentRoom: string,
  learnerLevel: StudentLevel
): FunnelStep[] {
  const talkDone = hasGeographyTalkClearance(progress);
  const watchDone = Boolean(progress?.watched);
  const mcqDone = Boolean(progress?.mcqCompleted);
  const guidedSteps = getGuidedStudySteps(learnerLevel);

  return guidedSteps.map((step) => {
    const isLearn = step.id === "learn";
    const isDiscuss = step.id === "discuss";
    const isPractice = step.id === "practice";
    const done = isLearn ? watchDone : isDiscuss ? talkDone : mcqDone;
    const repairDiagnosed =
      learnerLevel !== "beginner" &&
      typeof progress?.talkScore === "number" &&
      !talkDone;
    const unlocked =
      learnerLevel === "beginner"
        ? isLearn || (isDiscuss && watchDone) || (isPractice && talkDone)
        : isDiscuss || (isLearn && repairDiagnosed) || (isPractice && talkDone);
    const roomMatches =
      (isLearn && currentRoom === "watch") ||
      (isDiscuss && currentRoom === "talk") ||
      (isPractice && currentRoom === "mcq");

    return {
      id: step.id,
      label: step.label,
      helper: step.detail,
      href: isLearn
        ? `/upsc/geography/watch?day=${session.day}`
        : isDiscuss
          ? `/upsc/geography/talk?day=${session.day}`
          : `/upsc/geography/mcq-readiness?day=${session.day}`,
      status: done ? "done" : roomMatches || unlocked ? "current" : "locked",
      icon: isLearn ? PlayCircle : isDiscuss ? BrainCircuit : ClipboardCheck,
    };
  });
}

export function GeographyCommandRoom({ initialDay }: { initialDay?: number }) {
  const { getDayProgress, isLoaded, progress } = useGeographyProgress();
  const [activeDay, setActiveDay] = useState(resolveSession(initialDay).day);
  const [learnerLevel, setLearnerLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [studyWindow, setStudyWindow] = useState("90 min");
  const activeSession = resolveSession(activeDay);
  const activeProgress = getDayProgress(activeSession.day);
  const labSlug = activeProgress?.labMode ?? labSlugForGeographySession(activeSession.lab);
  const profileLevel = learnerLevel.toLowerCase() as StudentLevel;
  const previousRecallSession = activeSession.day > 1 ? resolveSession(activeSession.day - 1) : null;
  const dayStartRecallCleared = Boolean(
    !previousRecallSession ||
      (activeProgress?.dayStartRecallSourceDay === previousRecallSession.day &&
        activeProgress.dayStartRecallClearedAt)
  );
  const shouldStartWithPreviousRecall = isLoaded && Boolean(previousRecallSession) && !dayStartRecallCleared;
  const regularNextAction = getGeographyLoopState(activeSession, activeProgress, { isLoaded, labSlug, learnerLevel: profileLevel });
  const nextAction =
    previousRecallSession && shouldStartWithPreviousRecall
      ? {
          label: "Previous day recall due" as const,
          detail: `Day ${activeSession.day} starts by recalling Day ${previousRecallSession.day}: ${previousRecallSession.title}. New content opens after this recall clears.`,
          shortDetail: `Recall Day ${previousRecallSession.day} first`,
          href: `/upsc/geography/talk?day=${previousRecallSession.day}&startDay=${activeSession.day}`,
          cta: `Recall Day ${previousRecallSession.day} first`,
          room: "talk" as const,
          tone: "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
        }
      : regularNextAction;
  const funnelSteps = buildFunnelSteps(activeSession, activeProgress, nextAction.room, profileLevel);
  const completedStepCount = funnelSteps.filter((step) => step.status === "done").length;
  const monthPercent = Math.round((activeSession.day / geographySessions.length) * 100);
  const currentWeekDays = geographySessions.filter((session) => session.week === activeSession.week);
  const generatedCurrentDay = getCurrentGeographyTopic(progress).day;
  const syllabusAnchor = getGeographyGsCompatibility(activeSession);
  const syllabusChips = getGeographySubtopics(activeSession).slice(0, 4);
  const sourcePack = getSubjectSourcePack("geography");
  const contentModule = getPrimaryGeographyContentModuleForDay(activeSession.day);
  const activeModuleReadiness = contentModule ? getGeographyModuleReadiness(contentModule) : null;
  const moduleReadinessQueue = [...geographyModuleReadinessSummaries].sort((a, b) => a.day - b.day);
  const productionReadyModuleCount = moduleReadinessQueue.filter((module) => module.status === "complete").length;
  const moduleQueueMissingActionCount = moduleReadinessQueue.reduce((sum, module) => sum + module.missingActions.length, 0);
  const topicCoverageSummary = getGeographyTopicCoverageSummary();
  const completionAuditSummary = getGeographyCompletionAuditSummary();
  const activeTopicGroups = getGeographyTopicGroupsForDay(activeSession.day);
  const activeCompressedGroups = activeTopicGroups.filter((group) => group.coverageMode === "compressed-day");
  const activeModuleGapCount = activeTopicGroups.filter((group) => group.moduleReadiness === "module-needed").length;
  const leadTrendInsight = sourcePack?.trendInsights[0];
  const revisionDay = Math.min(activeSession.day + 2, geographySessions.length);
  const revisionSession = resolveSession(revisionDay);
  const revisionSummary =
    activeProgress?.revisitQueued || activeProgress?.talkBand === "Revisit"
      ? `Revisit Day ${activeSession.day}: ${activeSession.revisit}`
      : `Day ${revisionDay}: ${revisionSession.revisit}`;

  const canSelectDay = (day: number) => day <= generatedCurrentDay || Boolean(getDayProgress(day));
  const previousDay = activeSession.day > 1 ? activeSession.day - 1 : null;
  const nextDay =
    activeSession.day < geographySessions.length && canSelectDay(activeSession.day + 1)
      ? activeSession.day + 1
      : null;

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setTimeout(() => {
      const saved = getDayProgress(activeSession.day);
      const studentProfile = readStudentProfile();
      setLearnerLevel(
        saved?.learnerLevel ??
          (studentProfile?.level === "advanced"
            ? "Advanced"
            : studentProfile?.level === "intermediate"
              ? "Intermediate"
              : "Beginner")
      );
      setStudyWindow(saved?.studyWindow ?? (studentProfile ? `${studentProfile.studyWindow} min` : "90 min"));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeSession.day, getDayProgress, isLoaded]);

  useEffect(() => {
    if (!isLoaded || activeSession.day <= generatedCurrentDay || getDayProgress(activeSession.day)) return;

    setActiveDay(generatedCurrentDay);
    window.history.replaceState(null, "", `/upsc/geography?day=${generatedCurrentDay}`);
  }, [activeSession.day, generatedCurrentDay, getDayProgress, isLoaded]);

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), geographySessions.length);
    setActiveDay(boundedDay);
    window.history.replaceState(null, "", `/upsc/geography?day=${boundedDay}`);
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 md:px-8 md:py-8">
        <section
          data-testid="geography-today-simple-entry"
          data-visible-mode="four-signal-one-action"
          data-essential-signal-count="4"
          data-essential-signals="todays-task|learning-gap|next-revision|current-path"
          data-primary-action-href={nextAction.href}
          data-active-subject="geography"
          data-active-day={activeSession.day}
          data-current-readiness={nextAction.label}
          data-day-start-recall-source-day={previousRecallSession?.day ?? ""}
          data-day-start-recall-state={!isLoaded ? "loading" : dayStartRecallCleared ? "clear" : "due"}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Geography</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day} of {geographySessions.length}</span>
                <span className="text-sm font-semibold text-[#746f66]">{activeSession.duration}</span>
                <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1 text-xs font-black text-[#085041]">
                  {activeTopicGroups.length || 0} PDF topic groups
                </span>
                <Link
                  href="/upsc/geography/continue"
                  className="inline-flex min-h-8 items-center rounded-md border border-[#cfe5dc] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#085041] transition hover:border-[#1d9e75]"
                >
                  Continue Geography
                </Link>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{activeSession.title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                {activeSession.anchor}
              </p>
              <details
                data-testid="geography-command-syllabus-anchor"
                className="group mt-4 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee]"
              >
                <summary className="cursor-pointer list-none p-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                  See syllabus coverage
                </summary>
                <div className="border-t border-[#dcd5c7] p-4">
                  <p className="max-w-3xl text-sm font-black leading-6 text-[#13251d]">
                    {syllabusAnchor}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {syllabusChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-md border border-[#cfe5dc] bg-white px-2.5 py-1 text-xs font-bold text-[#085041]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div
                    data-testid="geography-command-topic-coverage-audit"
                    data-total-pdf-topic-groups={topicCoverageSummary.total}
                    data-mapped-topic-percent={topicCoverageSummary.mappedPercent}
                    data-module-ready-percent={topicCoverageSummary.moduleReadyPercent}
                    data-active-topic-count={activeTopicGroups.length}
                    data-active-compressed-topic-count={activeCompressedGroups.length}
                    data-active-module-gap-count={activeModuleGapCount}
                    className="mt-4 rounded-lg border border-[#dcd5c7] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                          PDF topic coverage audit
                        </p>
                        <h3 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">
                          {topicCoverageSummary.total}/82 groups mapped into the 20-day plan
                        </h3>
                        <p className="mt-1 text-xs font-bold leading-5 text-[#66736b]">
                          {topicCoverageSummary.compressed} groups are compressed inside broader days. {topicCoverageSummary.moduleNeeded} groups still need final slide-style web modules.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
                        <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1 text-[#085041]">
                          {topicCoverageSummary.direct} direct
                        </span>
                        <span className="rounded-md bg-[#fff4df] px-2.5 py-1 text-[#6f4a12]">
                          {topicCoverageSummary.compressed} compressed
                        </span>
                        <span className="rounded-md bg-[#f7f4ee] px-2.5 py-1 text-[#5d675f]">
                          {topicCoverageSummary.pilotModules} pilot / {topicCoverageSummary.draftModules} draft
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {activeTopicGroups.length ? (
                        activeTopicGroups.map((group) => (
                          <div
                            key={group.id}
                            data-testid={`geography-topic-group-${group.id}`}
                            data-topic-day={group.plannedDay}
                            data-coverage-mode={group.coverageMode}
                            data-module-readiness={group.moduleReadiness}
                            className="rounded-md border border-[#eee7dc] bg-[#f7f4ee] p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-white px-2 py-1 text-[10px] font-black text-[#1a3a2a]">
                                Topic {group.id}
                              </span>
                              <span className={cn(
                                "rounded px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
                                group.coverageMode === "direct-day"
                                  ? "bg-[#e7f5ee] text-[#085041]"
                                  : "bg-[#fff4df] text-[#6f4a12]"
                              )}>
                                {group.coverageMode === "direct-day" ? "Direct" : "Compressed"}
                              </span>
                              <span className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#5d675f]">
                                {group.moduleReadiness === "pilot-module"
                                  ? "Pilot module"
                                  : group.moduleReadiness === "draft-module"
                                    ? "Draft module"
                                    : "Module needed"}
                              </span>
                            </div>
                            <h4 className="mt-2 text-sm font-black leading-5 text-[#13251d]">{group.title}</h4>
                            <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">{group.auditNote}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border border-[#eee7dc] bg-[#f7f4ee] p-3 md:col-span-2">
                          <p className="text-sm font-black text-[#13251d]">
                            Day {activeSession.day} is a foundation or integration day.
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">
                            It supports the PDF topic groups but does not introduce a new numbered PDF group.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {sourcePack ? (
                    <div
                      data-testid="geography-command-source-path"
                      data-pyq-row-count={sourcePack.pyqRows.length}
                      data-trend-insight-count={sourcePack.trendInsights.length}
                      data-readiness-score={sourcePack.readinessScore}
                      className="mt-4 rounded-lg border border-[#dcd5c7] bg-white p-4"
                    >
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                            Systematic source path
                          </p>
                          <h3 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">
                            NCERT, reference depth, PYQ trend, covered news
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href="/upsc/source-library"
                            className="inline-flex min-h-9 items-center rounded-md border border-[#cfe5dc] bg-[#f7f4ee] px-3 text-xs font-black text-[#085041]"
                          >
                            Source library <FileSearch className="ml-2 h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href="/upsc/current-affairs?subject=geography"
                            className="inline-flex min-h-9 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white"
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
                          <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                              {label}
                            </p>
                            <p className="mt-1 text-xs font-bold leading-5 text-[#49675e]">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#085041]">
                        <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1">{sourcePack.pyqRows.length} GS PYQ rows</span>
                        <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1">{sourcePack.trendInsights.length} trend boards</span>
                        <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1">{sourcePack.readinessScore}% source readiness</span>
                      </div>
                    </div>
                  ) : null}
                  {contentModule && activeModuleReadiness ? (
                    <div
                      data-testid="geography-command-content-module"
                      data-module-id={contentModule.id}
                      data-module-section-count={contentModule.sections.length}
                      data-module-readiness-status={activeModuleReadiness.status}
                      data-module-readiness-score={activeModuleReadiness.score}
                      data-module-readiness-missing-count={activeModuleReadiness.missing}
                      className="mt-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                            Web module available
                          </p>
                          <h3 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">
                            {contentModule.title}
                          </h3>
                          <p className="mt-1 text-xs font-bold leading-5 text-[#49675e]">
                            {contentModule.sections.length} slide-style sections with cumulative AI discussion after every section.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
                            <span className="rounded-md bg-white px-2.5 py-1 text-[#085041]">
                              {activeModuleReadiness.score}% ready
                            </span>
                            <span className="rounded-md bg-white px-2.5 py-1 text-[#085041]">
                              {activeModuleReadiness.complete}/5 checks complete
                            </span>
                            <span className="rounded-md bg-[#fff4df] px-2.5 py-1 text-[#6f4a12]">
                              {activeModuleReadiness.missing} missing
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/upsc/geography/watch?day=${activeSession.day}&module=${contentModule.id}&section=${contentModule.sections[0]?.id ?? ""}`}
                          className="inline-flex min-h-10 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black uppercase tracking-[0.12em] text-white"
                        >
                          Open module <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </div>
                      <div
                        data-testid="geography-active-module-readiness"
                        data-readiness-score={activeModuleReadiness.score}
                        data-readiness-complete-count={activeModuleReadiness.complete}
                        data-readiness-partial-count={activeModuleReadiness.partial}
                        data-readiness-missing-count={activeModuleReadiness.missing}
                        className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
                      >
                        {activeModuleReadiness.checklist.map((item) => (
                          <div
                            key={item.id}
                            data-testid={`geography-active-module-readiness-${item.id}`}
                            data-readiness-status={item.status}
                            className="rounded-md border border-[#cfe5dc] bg-white p-3"
                          >
                            <span
                              className={cn(
                                "rounded px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
                                item.status === "complete"
                                  ? "bg-[#e7f5ee] text-[#085041]"
                                  : item.status === "partial"
                                    ? "bg-[#fff4df] text-[#6f4a12]"
                                    : "bg-[#fff1ed] text-[#7d3827]"
                              )}
                            >
                              {item.status}
                            </span>
                            <h4 className="mt-2 text-xs font-black leading-5 text-[#13251d]">{item.label}</h4>
                            <p className="mt-1 text-[11px] font-bold leading-5 text-[#66736b]">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </details>
            </div>

            <div className="w-full rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4 md:w-56">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">June progress</p>
                <p className="text-sm font-black text-[#085041]">{monthPercent}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${monthPercent}%` }} />
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-[#49675e]">{activeSession.chapter}</p>
            </div>
          </div>
        </section>

        <section
          data-testid="geography-next-action"
          data-student-signal="todays-task"
          data-next-action-href={nextAction.href}
          data-next-action-label={nextAction.cta}
          className={cn("rounded-lg border p-5 shadow-sm", nextAction.tone)}
        >
          <div data-testid="command-next-action" className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/70">
                <Route className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em]">Do this now</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">{nextAction.label}</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 opacity-85">{nextAction.detail}</p>
              </div>
            </div>
            <Link
              href={nextAction.href}
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {nextAction.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section
          data-testid="geography-four-signal-grid"
          data-signal-count="4"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        >
          <Link
            href={nextAction.href}
            data-testid="geography-signal-todays-task"
            data-signal-priority="primary"
            data-signal-route={nextAction.href}
            className="rounded-lg border border-[#1d9e75] bg-[#e7f5ee] p-4 transition hover:border-[#1a3a2a] hover:bg-white"
          >
            <ClipboardCheck className="h-5 w-5 text-[#1d9e75]" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
              Today's task
            </p>
            <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{nextAction.cta}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">{activeSession.title}</p>
          </Link>

          <Link
            href={nextAction.href}
            data-testid="geography-signal-learning-gap"
            className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
          >
            <BrainCircuit className="h-5 w-5 text-[#1d9e75]" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
              Learning gap
            </p>
            <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{nextAction.label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">{nextAction.detail}</p>
          </Link>

          <Link
            href={`/upsc/geography/revisit?day=${activeSession.day}`}
            data-testid="geography-signal-next-revision"
            className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
          >
            <RefreshCcw className="h-5 w-5 text-[#1d9e75]" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
              Next revision
            </p>
            <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{revisionSummary}</p>
          </Link>

          <Link
            href={`/upsc/geography/track?day=${activeSession.day}`}
            data-testid="geography-signal-current-path"
            data-current-week={activeSession.week}
            data-current-day={activeSession.day}
            data-total-days={geographySessions.length}
            data-month-progress={monthPercent}
            className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
          >
            <MapPinned className="h-5 w-5 text-[#1d9e75]" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
              Current path
            </p>
            <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">
              Day {activeSession.day}/{geographySessions.length} - Week {activeSession.week}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">
              {monthPercent}% June progress. Track decides repair, practice, or the next topic.
            </p>
          </Link>
        </section>

        <details
          data-testid="geography-command-funnel-details"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
        >
          <summary className="cursor-pointer list-none text-sm font-black text-[#13251d]">
            Today&apos;s full flow
            <span className="ml-2 text-xs font-semibold text-[#746f66]">
              Optional context. The next action above is already selected.
            </span>
          </summary>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Today&apos;s funnel</p>
              <h2 className="text-xl font-black tracking-tight">Follow one step at a time</h2>
            </div>
            <span className="rounded-md bg-[#f7f4ee] px-3 py-2 text-xs font-black text-[#5d675f]">
              {completedStepCount}/{funnelSteps.length} steps complete
            </span>
          </div>

          <div data-testid="geography-day-funnel" className="grid gap-3 md:grid-cols-5">
            {funnelSteps.map((step, index) => {
              const Icon = step.icon;
              const body = (
                <>
                  <div className={cn("mb-4 flex h-9 w-9 items-center justify-center rounded-md", stepBadgeTone[step.status])}>
                    {step.status === "done" ? <CheckCircle2 className="h-4 w-4" /> : step.status === "locked" ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">Step {index + 1}</p>
                  <h3 className="mt-1 text-lg font-black tracking-tight">{step.label}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{step.helper}</p>
                </>
              );

              return step.status === "locked" ? (
                <div key={step.id} className={cn("min-h-36 rounded-lg border p-4", stepTone[step.status])}>
                  {body}
                </div>
              ) : (
                <Link key={step.id} href={step.href} className={cn("min-h-36 rounded-lg border p-4 transition hover:-translate-y-0.5", stepTone[step.status])}>
                  {body}
                </Link>
              );
            })}
          </div>
        </details>

        <details
          data-testid="geography-command-advanced-controls"
          className="group overflow-hidden rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm"
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Optional controls</p>
              <h2 className="text-lg font-black tracking-tight">Profile, week switcher, and 20-day map</h2>
            </div>
            <span className="rounded-md border border-[#cfc6b6] bg-white px-3 py-2 text-xs font-black text-[#1a3a2a] transition group-open:bg-[#1a3a2a] group-open:text-white">
              Open controls
            </span>
          </summary>

          <div className="grid gap-5 border-t border-[#eee7dc] p-5">
            <section
              data-testid="geography-baseline-intake"
              className="grid gap-4 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4 lg:grid-cols-[220px_1fr_auto]"
            >
              <div className="rounded-lg border border-[#dcd5c7] bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Saved profile</p>
                <p className="mt-2 text-lg font-black text-[#13251d]">{learnerLevel}</p>
                <p className="mt-1 text-sm font-bold text-[#5d675f]">{studyWindow} daily sitting</p>
                <Link
                  href="/upsc#upsc-intake"
                  className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md border border-[#cfc6b6] bg-[#fdfaf3] px-3 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  Edit profile
                </Link>
              </div>

              <div className="rounded-lg border border-[#dcd5c7] bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                  Student input rule
                </p>
                <h3 className="mt-2 text-sm font-black text-[#13251d]">
                  {profileLevel === "beginner" ? "Lesson first, then Talk" : "Speak first inside Talk"}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                  {profileLevel === "beginner"
                    ? "This page only selects the route. The beginner writes or speaks after the short lesson opens the Talk room."
                    : "The command page does not collect another baseline. The learner explains the topic in Talk, then the AI opens only the missing repair."}
                </p>
                {activeProgress?.baselineKnowledge?.trim() ? (
                  <div
                    data-testid="geography-command-baseline-preview"
                    className="mt-3 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      Saved Talk baseline
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#315447]">
                      {activeProgress.baselineKnowledge}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col justify-end gap-3 rounded-lg border border-[#dcd5c7] bg-white p-3">
                <Link
                  href={nextAction.href}
                  data-testid="geography-command-diagnosis-action"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-4 text-sm font-black text-white transition hover:bg-[#168864]"
                >
                  {nextAction.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section
              data-testid="geography-completion-audit"
              data-audit-score={completionAuditSummary.score}
              data-audit-complete-count={completionAuditSummary.complete}
              data-audit-partial-count={completionAuditSummary.partial}
              data-audit-missing-count={completionAuditSummary.missing}
              data-topic-groups={completionAuditSummary.topicGroups}
              data-module-covered-topic-count={completionAuditSummary.moduleCoveredTopicCount}
              data-module-gap-count={completionAuditSummary.moduleGapCount}
              data-module-covered-day-count={completionAuditSummary.moduleCoveredDayCount}
              data-module-day-gap-count={completionAuditSummary.moduleDayGapCount}
              data-approved-module-count={completionAuditSummary.approvedModuleCount}
              data-draft-module-count={completionAuditSummary.draftModuleCount}
              data-sample-module-count={completionAuditSummary.sampleModuleCount}
              data-module-section-count={completionAuditSummary.moduleSectionCount}
              data-modules-with-image-metadata-count={completionAuditSummary.modulesWithImageMetadataCount}
              data-sections-with-image-metadata-count={completionAuditSummary.sectionsWithImageMetadataCount}
              data-modules-with-pyq-sections-count={completionAuditSummary.modulesWithPyqSectionsCount}
              data-modules-with-mcq-sections-count={completionAuditSummary.modulesWithMcqSectionsCount}
              data-modules-with-complete-recall-points-count={completionAuditSummary.modulesWithCompleteRecallPointsCount}
              className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Completion audit</p>
                  <h2 className="text-lg font-black tracking-tight">What is complete, partial, and still missing</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#657066]">
                    {completionAuditSummary.score}% implementation confidence. {completionAuditSummary.moduleGapCount} topic groups and {completionAuditSummary.moduleDayGapCount} student days are missing draft modules; remaining work is content approval, media, transcription, and evidence quality.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
                  <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1 text-[#085041]">
                    {completionAuditSummary.complete} complete
                  </span>
                  <span className="rounded-md bg-[#fff4df] px-2.5 py-1 text-[#6f4a12]">
                    {completionAuditSummary.partial} partial
                  </span>
                  <span className="rounded-md bg-[#fff1ed] px-2.5 py-1 text-[#7d3827]">
                    {completionAuditSummary.missing} missing
                  </span>
                  <span className="rounded-md bg-[#f7f4ee] px-2.5 py-1 text-[#5d675f]">
                    {completionAuditSummary.approvedModuleCount}/{completionAuditSummary.moduleCount} approved
                  </span>
                  <span className="rounded-md bg-[#f7f4ee] px-2.5 py-1 text-[#5d675f]">
                    {completionAuditSummary.modulesWithImageMetadataCount}/{completionAuditSummary.moduleCount} media
                  </span>
                  <span className="rounded-md bg-[#f7f4ee] px-2.5 py-1 text-[#5d675f]">
                    {completionAuditSummary.modulesWithPyqSectionsCount}/{completionAuditSummary.moduleCount} PYQ
                  </span>
                  <span className="rounded-md bg-[#f7f4ee] px-2.5 py-1 text-[#5d675f]">
                    {completionAuditSummary.modulesWithMcqSectionsCount}/{completionAuditSummary.moduleCount} MCQ
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {geographyCompletionAuditItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`geography-completion-audit-${item.id}`}
                    data-audit-status={item.status}
                    className="rounded-md border border-[#eee7dc] bg-[#f7f4ee] p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
                          item.status === "complete"
                            ? "bg-[#e7f5ee] text-[#085041]"
                            : item.status === "partial"
                              ? "bg-[#fff4df] text-[#6f4a12]"
                              : "bg-[#fff1ed] text-[#7d3827]"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-black leading-5 text-[#13251d]">{item.label}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">{item.gap}</p>
                    <p className="mt-2 text-xs font-black leading-5 text-[#085041]">{item.nextAction}</p>
                  </div>
                ))}
              </div>
            </section>

            <section
              data-testid="geography-content-production-queue"
              data-module-count={moduleReadinessQueue.length}
              data-production-ready-module-count={productionReadyModuleCount}
              data-missing-action-count={moduleQueueMissingActionCount}
              className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                    Content production queue
                  </p>
                  <h2 className="text-lg font-black tracking-tight">All 20 modules, one approval view</h2>
                  <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#657066]">
                    This is the teacher/operator view for the remaining Geography work. It removes the need to open each day just to find missing approval, media, PYQ, MCQ, or recall-point tasks.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
                  <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1 text-[#085041]">
                    {productionReadyModuleCount}/{moduleReadinessQueue.length} production-ready
                  </span>
                  <span className="rounded-md bg-[#fff4df] px-2.5 py-1 text-[#6f4a12]">
                    {moduleQueueMissingActionCount} remaining actions
                  </span>
                </div>
              </div>

              <div className="max-h-[34rem] overflow-y-auto pr-1">
                <div className="grid gap-2 lg:grid-cols-2">
                  {moduleReadinessQueue.map((module) => {
                    const missingChecks = module.checklist.filter((item) => item.status !== "complete");
                    return (
                      <div
                        key={module.moduleId}
                        data-testid={`geography-content-production-module-${module.day}`}
                        data-module-id={module.moduleId}
                        data-module-day={module.day}
                        data-module-readiness-status={module.status}
                        data-module-readiness-score={module.score}
                        data-module-missing-action-count={module.missingActions.length}
                        className={cn(
                          "rounded-md border p-3",
                          module.status === "complete"
                            ? "border-[#cfe5dc] bg-[#e7f5ee]"
                            : "border-[#eee7dc] bg-[#f7f4ee]"
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1a3a2a]">
                                Day {module.day}
                              </span>
                              <span
                                className={cn(
                                  "rounded px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
                                  module.status === "complete"
                                    ? "bg-white text-[#085041]"
                                    : "bg-[#fff4df] text-[#6f4a12]"
                                )}
                              >
                                {module.score}% ready
                              </span>
                              <span className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#5d675f]">
                                {module.complete}/5 checks
                              </span>
                            </div>
                            <h3 className="mt-2 text-sm font-black leading-5 text-[#13251d]">{module.title}</h3>
                            <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">
                              {missingChecks.length
                                ? `${missingChecks.length} checks need attention before approval.`
                                : "All checks are complete; this module can move into final approval records."}
                            </p>
                          </div>
                          <Link
                            href={`/upsc/geography/watch?day=${module.day}&module=${module.moduleId}`}
                            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border border-[#cfe5dc] bg-white px-3 text-xs font-black text-[#085041] transition hover:border-[#1d9e75]"
                          >
                            Review
                          </Link>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {missingChecks.length ? (
                            missingChecks.map((item) => (
                              <span
                                key={item.id}
                                data-testid={`geography-content-production-module-${module.day}-${item.id}`}
                                data-readiness-status={item.status}
                                className={cn(
                                  "rounded px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
                                  item.status === "partial"
                                    ? "bg-[#fff4df] text-[#6f4a12]"
                                    : "bg-[#fff1ed] text-[#7d3827]"
                                )}
                              >
                                {item.label}: {item.status}
                              </span>
                            ))
                          ) : (
                            <span className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#085041]">
                              No missing checks
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">AI routing rule</p>
                    <h2 className="text-lg font-black tracking-tight">No student confusion</h2>
                  </div>
                </div>
                <div className="space-y-3 text-sm font-semibold leading-6 text-[#5d675f]">
                  <p>First the student explains what they already know.</p>
                  <p>If recall is weak, the app opens a repair class instead of new overload.</p>
                  <p>If explanation is clear after repair, MCQ opens. Visual Lab stays available as optional support.</p>
                  <p>After MCQ, only weak areas come back into revision.</p>
                </div>
              </div>

              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">This week</p>
                    <h2 className="text-lg font-black tracking-tight">Simple day switcher</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!previousDay}
                      onClick={() => previousDay && selectDay(previousDay)}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!nextDay}
                      onClick={() => nextDay && selectDay(nextDay)}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentWeekDays.map((session) => {
                    const isActive = session.day === activeSession.day;
                    const canOpen = canSelectDay(session.day);
                    const status = getDayStatus(getDayProgress(session.day), profileLevel);
                    return (
                      <button
                        key={session.day}
                        type="button"
                        data-testid={`geography-week-day-${session.day}`}
                        data-day-state={isActive ? "active" : canOpen ? "review" : "locked"}
                        disabled={!canOpen}
                        onClick={() => canOpen && selectDay(session.day)}
                        className={cn(
                          "rounded-md border p-3 text-left transition",
                          isActive
                            ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                            : canOpen
                              ? "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                              : "cursor-not-allowed border-[#e7e2d9] bg-[#f7f4ee] text-[#9a9489] opacity-65"
                        )}
                      >
                        <p data-testid={`command-day-${session.day}`} className="text-xs font-black uppercase tracking-[0.16em]">
                          Day {session.day}
                        </p>
                        <p className="mt-1 text-sm font-black leading-5">{session.title}</p>
                        <p
                          data-testid={`command-day-state-${session.day}`}
                          className={cn(
                            "mt-2 inline-flex rounded px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
                            isActive ? "bg-white/15" : "bg-[#e7f5ee] text-[#085041]"
                          )}
                        >
                          {status}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section
              data-testid="geography-topic-finder"
              data-topic-count={geographyTopicGroups.length}
              className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Topic finder</p>
                  <h2 className="text-lg font-black tracking-tight">Jump from the 82 PDF groups to the right day</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#657066]">
                    Use this when a student asks where a specific Geography topic lives. The main route still remains the single current action above.
                  </p>
                </div>
                <span className="rounded-md bg-[#e7f5ee] px-3 py-2 text-xs font-black text-[#085041]">
                  {geographyTopicGroups.length} mapped groups
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto pr-1">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {geographyTopicGroups.map((group) => {
                    const isActiveTopicDay = group.plannedDay === activeSession.day;
                    const canOpen = canSelectDay(group.plannedDay);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        data-testid={`geography-topic-finder-${group.id}`}
                        data-topic-day={group.plannedDay}
                        data-topic-part={group.part}
                        data-topic-module-readiness={group.moduleReadiness}
                        disabled={!canOpen}
                        onClick={() => canOpen && selectDay(group.plannedDay)}
                        className={cn(
                          "min-h-24 rounded-md border p-3 text-left transition",
                          isActiveTopicDay
                            ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                            : canOpen
                              ? "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
                              : "cursor-not-allowed border-[#e7e2d9] bg-[#f7f4ee] text-[#9a9489] opacity-65"
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded px-2 py-1 text-[10px] font-black", isActiveTopicDay ? "bg-white/15" : "bg-white")}>
                            Topic {group.id}
                          </span>
                          <span className={cn("rounded px-2 py-1 text-[10px] font-black", isActiveTopicDay ? "bg-white/15" : "bg-[#e7f5ee] text-[#085041]")}>
                            Day {group.plannedDay}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-black leading-5">{group.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 opacity-75">{group.part}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">20-day map</p>
                  <h2 className="text-lg font-black tracking-tight">Pick a day only when needed</h2>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Today
                </Link>
              </div>

              <div data-testid="geography-20-day-map" className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
                {geographySessions.map((session) => {
                  const isActive = session.day === activeSession.day;
                  const progress = getDayProgress(session.day);
                  const isDone = Boolean(progress?.mcqCompleted);
                  const canOpen = canSelectDay(session.day);
                  return (
                    <button
                      key={session.day}
                      type="button"
                      data-testid={`geography-day-${session.day}`}
                      data-day-state={isActive ? "active" : canOpen ? "review" : "locked"}
                      disabled={!canOpen}
                      onClick={() => canOpen && selectDay(session.day)}
                      className={cn(
                        "min-h-20 rounded-md border p-2 text-left transition",
                        isActive
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : isDone
                            ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                            : canOpen
                              ? "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                              : "cursor-not-allowed border-[#e7e2d9] bg-[#f7f4ee] text-[#9a9489] opacity-65"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black">Day {session.day}</span>
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 opacity-45" />}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs font-bold leading-4">{session.title}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </details>
      </div>
    </main>
  );
}
