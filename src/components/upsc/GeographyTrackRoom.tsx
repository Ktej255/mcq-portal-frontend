"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Gauge,
  Layers3,
  LockKeyhole,
  PlayCircle,
  RefreshCcw,
  Target,
  TimerReset,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyLoopActions } from "@/components/upsc/GeographyLoopActions";
import { getGeographyLoopState, hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { labSlugForGeographySession } from "@/lib/upsc/geographyLearning";
import { buildGeographyReadinessSnapshot } from "@/lib/upsc/geographyReadiness";
import { geographySessions } from "@/lib/upsc/plan";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

const weekLabels = [
  "Physical base",
  "India map",
  "Human geography",
  "Atlas and PYQ",
  "Command phase",
];

const stageStatusTone = {
  complete: "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041]",
  active: "border-[#ef9f27]/60 bg-[#fff4df] text-[#6f4a12]",
  blocked: "border-[#d9b4a8] bg-[#fff1ed] text-[#7d3827]",
  waiting: "border-[#dcd5c7] bg-[#f7f4ee] text-[#657066]",
};

type EvidenceStatus = "Done" | "Active" | "Pending" | "Blocked";

type FocusedEvidenceItem = {
  label: string;
  detail: string;
  status: EvidenceStatus;
  href: string;
  icon: LucideIcon;
};

const evidenceStatusTone: Record<EvidenceStatus, string> = {
  Done: "border-[#1d9e75]/45 bg-[#e7f5ee] text-[#085041]",
  Active: "border-[#ef9f27]/50 bg-[#fff4df] text-[#6f4a12]",
  Pending: "border-[#dcd5c7] bg-[#f7f4ee] text-[#657066]",
  Blocked: "border-[#d9b4a8] bg-[#fff1ed] text-[#7d3827]",
};

const evidenceStatusIcon: Record<EvidenceStatus, LucideIcon> = {
  Done: CheckCircle2,
  Active: Gauge,
  Pending: CircleDashed,
  Blocked: LockKeyhole,
};

export function GeographyTrackRoom({ initialDay }: { initialDay?: number }) {
  const { getDayProgress, isLoaded, progress, stats } = useGeographyProgress();
  const focusedDay =
    initialDay && Number.isFinite(initialDay) ? Math.min(Math.max(initialDay, 1), geographySessions.length) : undefined;
  const readinessSnapshot = buildGeographyReadinessSnapshot(progress, { isLoaded });

  const loopStates = geographySessions.map((session) => ({
    session,
    progress: getDayProgress(session.day),
    state: getGeographyLoopState(session, getDayProgress(session.day)),
  }));
  const focusedLoopState =
    loopStates.find(({ session }) => session.day === focusedDay) ??
    loopStates.find(({ session }) => session.day === stats.revisitDays[0]?.day) ??
    loopStates.find(({ session }) => session.day === stats.shakyDays[0]?.day) ??
    loopStates.find(({ session }) => !getDayProgress(session.day)?.reflection?.trim()) ??
    loopStates[0];
  const talkPassedCount = loopStates.filter(({ progress }) => hasGeographyTalkClearance(progress)).length;
  const labCompleteCount = loopStates.filter(({ progress }) => progress?.labCompleted).length;
  const mcqCommandCount = readinessSnapshot.stageCounts.mcq;
  const blockedCount = loopStates.filter(({ state }) =>
    ["Watch pending", "Talk pending", "Lab pending", "Revisit required"].includes(state.label)
  ).length;

  const groupedSessions = weekLabels.map((label, index) => ({
    label,
    week: index + 1,
    sessions: loopStates.filter(({ session }) => session.week === index + 1),
  }));
  const nextFocusSession =
    focusedLoopState?.session ??
    stats.revisitDays[0] ??
    stats.shakyDays[0] ??
    geographySessions.find((session) => !getDayProgress(session.day)?.reflection?.trim()) ??
    geographySessions[0];
  const nextFocusLabSlug = labSlugForGeographySession(nextFocusSession.lab);
  const focusedReadiness =
    readinessSnapshot.days.find((day) => day.session.day === nextFocusSession.day) ?? readinessSnapshot.days[0];
  const focusedProgress = focusedLoopState?.progress;
  const focusedDayComplete = Boolean(focusedReadiness?.mcqCommand);
  const focusedCloseoutHref = focusedDayComplete
    ? "/upsc/geography/pilot"
    : focusedReadiness?.nextState.href ?? focusedLoopState?.state.href ?? `/upsc/geography/watch?day=${nextFocusSession.day}`;
  const focusedCloseoutLabel = focusedDayComplete ? "Return to pilot feedback" : "Finish current gate";
  const focusedWatchProofCount = Math.min(
    focusedProgress?.watchSceneCompletedIds?.length ?? (focusedProgress?.watched ? 5 : 0),
    5
  );
  const focusedLabProofCount = Math.min(
    focusedProgress?.labProofCompletedIds?.length ?? (focusedProgress?.labCompleted ? 5 : 0),
    5
  );
  const focusedEvidenceItems: FocusedEvidenceItem[] = focusedReadiness
    ? [
        {
          label: "Watch proof",
          detail: `${focusedWatchProofCount}/5 scene proofs saved`,
          status: focusedReadiness.watchComplete ? "Done" : focusedLoopState?.state.room === "watch" ? "Active" : "Pending",
          href: `/upsc/geography/watch?day=${nextFocusSession.day}`,
          icon: PlayCircle,
        },
        {
          label: "Talk verdict",
          detail:
            typeof focusedProgress?.talkScore === "number"
              ? `${focusedProgress.talkScore}/100 ${focusedProgress.talkBand ?? "Talk"} verdict`
              : "AI teacher verdict missing",
          status: focusedReadiness.talkClear
            ? "Done"
            : focusedReadiness.watchComplete
              ? focusedLoopState?.state.room === "talk"
                ? "Active"
                : "Pending"
              : "Blocked",
          href: `/upsc/geography/talk?day=${nextFocusSession.day}`,
          icon: BrainCircuit,
        },
        {
          label: "Revisit state",
          detail: focusedReadiness.revisitNeeded
            ? focusedProgress?.recoveryDiagnosisSummary ?? "Recovery is queued"
            : focusedReadiness.recoveryComplete
              ? "No active recovery blocker"
              : "No recovery proof yet",
          status: focusedReadiness.revisitNeeded ? "Active" : focusedReadiness.recoveryComplete ? "Done" : "Pending",
          href: `/upsc/geography/revisit?day=${nextFocusSession.day}`,
          icon: RefreshCcw,
        },
        {
          label: "Lab proof",
          detail:
            focusedProgress?.labEvidenceAnchor
              ? `${focusedLabProofCount}/5 proofs at ${focusedProgress.labEvidenceAnchor}`
              : `${focusedLabProofCount}/5 visual proofs saved`,
          status: focusedReadiness.labComplete
            ? "Done"
            : focusedReadiness.talkClear
              ? focusedLoopState?.state.room === "lab"
                ? "Active"
                : "Pending"
              : "Blocked",
          href: `/upsc/geography/lab?mode=${focusedProgress?.labMode ?? nextFocusLabSlug}&day=${nextFocusSession.day}`,
          icon: Layers3,
        },
        {
          label: "MCQ outcome",
          detail: focusedProgress?.mcqCompleted
            ? `${focusedProgress.mcqCorrectCount ?? 0}/${focusedProgress.mcqTotal ?? focusedReadiness.mcqPlanned} correct`
            : `${focusedReadiness.mcqDrafted}/${focusedReadiness.mcqPlanned} fresh drafted`,
          status: focusedReadiness.mcqCommand
            ? "Done"
            : focusedReadiness.labComplete
              ? focusedLoopState?.state.room === "mcq"
                ? "Active"
                : "Pending"
              : "Blocked",
          href: `/upsc/geography/mcq-readiness?day=${nextFocusSession.day}`,
          icon: ClipboardCheck,
        },
      ]
    : [];

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading Geography progress...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href={`/upsc/geography?day=${nextFocusSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> Geography command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Track</Badge>
              <span className="text-sm font-bold text-[#776f64]">Local progress memory</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">June Geography</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              Track command, doubt, and revisit.
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">
              This page reads your saved Talk reflections, confidence marks, and revisit queue from local browser storage.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${stats.completionPercent}%` }} />
            </div>
            <p className="mt-3 text-sm font-black text-[#085041]">{stats.completionPercent}% reflected</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Watched classes", value: stats.watchedCount, icon: PlayCircle },
              { label: "Talk passed", value: talkPassedCount, icon: BrainCircuit },
              { label: "Lab completed", value: labCompleteCount, icon: Layers3 },
              { label: "MCQ command", value: mcqCommandCount, icon: ClipboardCheck },
              { label: "MCQ attempted", value: stats.mcqAttemptedCount, icon: ClipboardCheck },
              { label: "Revisit queue", value: stats.revisitCount, icon: RefreshCcw },
              { label: "Blocked days", value: blockedCount, icon: Gauge },
              { label: "Command days", value: stats.commandCount, icon: CheckCircle2 },
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
          data-testid="geography-readiness-snapshot"
          className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        >
          <div className="min-w-0 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Command readiness</p>
                <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-[#085041]">
                  {readinessSnapshot.label}
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#49675e]">{readinessSnapshot.detail}</p>
              </div>
              <div className="shrink-0 rounded-lg border border-[#b9dacf] bg-white/70 p-4 text-center">
                <p className="text-4xl font-black leading-none text-[#085041]">{readinessSnapshot.score}%</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">subject score</p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-5">
              {[
                ["Watch", readinessSnapshot.stageCounts.watch],
                ["Talk", readinessSnapshot.stageCounts.talk],
                ["Recover", readinessSnapshot.stageCounts.revisit],
                ["Lab", readinessSnapshot.stageCounts.lab],
                ["MCQ", readinessSnapshot.stageCounts.mcq],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#b9dacf] bg-white/70 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 text-2xl font-black leading-none text-[#13251d]">{value}/30</p>
                </div>
              ))}
            </div>
          </div>

          <div
            data-testid="geography-next-action-queue"
            className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Next action queue</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Clear these first</h2>
              </div>
              <Target className="h-6 w-6 text-[#085041]" />
            </div>

            {readinessSnapshot.nextActions.length === 0 ? (
              <div className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-5 text-sm font-black leading-6 text-[#085041]">
                All local Geography gates are clear. Use final mock review or global revision command next.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {readinessSnapshot.nextActions.map((day) => (
                  <Link
                    key={day.session.day}
                    href={day.nextState.href}
                    data-testid={`geography-next-action-${day.session.day}`}
                    className={cn("min-h-32 rounded-md border p-4 transition hover:-translate-y-0.5", day.nextState.tone)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">
                          Day {day.session.day} / {day.score}%
                        </p>
                        <h3 className="mt-1 break-words text-sm font-black leading-5">{day.session.title}</h3>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </div>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] opacity-80">{day.nextState.label}</p>
                    <p className="mt-2 break-words text-xs font-semibold leading-5 opacity-80">{day.nextState.shortDetail}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">30-day heatmap</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Geography sprint state</h2>
              </div>
              <BarChart3 className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-5">
              {groupedSessions.map((group) => (
                <div key={group.week} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                      Week {group.week}
                    </p>
                    <span className="text-xs font-bold text-[#746f66]">{group.label}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
                    {group.sessions.map(({ session, progress, state }) => {
                      return (
                        <Link
                          key={session.day}
                          href={state.href}
                          data-testid={`track-day-${session.day}`}
                          className={cn(
                            "min-h-24 rounded-md border p-3 transition hover:-translate-y-0.5",
                            state.tone,
                            focusedLoopState?.session.day === session.day ? "ring-2 ring-[#1a3a2a]/25" : ""
                          )}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-black uppercase tracking-[0.14em]">Day {session.day}</p>
                            <span className="flex items-center gap-1">
                              {progress?.watched && <PlayCircle className="h-4 w-4" />}
                              {progress?.labCompleted && <Layers3 className="h-4 w-4" />}
                              {progress?.reflection && <CheckCircle2 className="h-4 w-4" />}
                              {(progress?.talkBand === "Practice" || progress?.talkBand === "Command") && <BrainCircuit className="h-4 w-4" />}
                              {progress?.mcqAttempted && <ClipboardCheck className="h-4 w-4" />}
                            </span>
                          </div>
                          <p className="text-sm font-black leading-5">{session.title}</p>
                          <p className="mt-2 text-xs font-semibold opacity-75">
                            {state.label} / {state.shortDetail}
                          </p>
                          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
                            {progress?.mcqAttempted
                              ? `MCQ ${progress.mcqCorrectCount ?? 0}/${progress.mcqTotal ?? 0}`
                              : progress?.labCompleted ? "Lab completed" : "Lab pending"}
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
            {focusedLoopState ? (
              <div
                data-testid="geography-track-focused-day"
                className={cn("rounded-lg border p-5 shadow-sm", focusedLoopState.state.tone)}
              >
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-75">Focused day</p>
                <h2 className="mt-2 text-xl font-black leading-7">
                  Day {focusedLoopState.session.day}: {focusedLoopState.session.title}
                </h2>
                <p className="mt-3 text-sm font-bold leading-6 opacity-80">{focusedLoopState.state.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{focusedLoopState.state.detail}</p>
                <Link
                  data-testid="geography-track-focused-route"
                  href={focusedLoopState.state.href}
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  {focusedLoopState.state.cta} <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>

                <div data-testid="geography-focused-evidence-ledger" className="mt-5 rounded-lg border border-white/50 bg-white/70 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Evidence ledger</p>
                      <h3 className="mt-1 text-lg font-black text-[#13251d]">Tick status for this day</h3>
                    </div>
                    <span className="rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
                      {focusedReadiness?.score ?? 0}% ready
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {focusedEvidenceItems.map((item) => {
                      const StatusIcon = evidenceStatusIcon[item.status];
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          data-testid={`geography-evidence-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                          className={cn("rounded-md border p-3 transition hover:-translate-y-0.5", evidenceStatusTone[item.status])}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/75">
                                <StatusIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.14em]">{item.label}</p>
                                <p className="mt-1 break-words text-xs font-semibold leading-5 opacity-80">{item.detail}</p>
                              </div>
                            </div>
                            <span className="shrink-0 rounded bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                              {item.status}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {focusedReadiness ? (
                  <div data-testid="geography-focused-stage-checklist" className="mt-5 grid gap-2">
                    {focusedReadiness.stages.map((stage) => (
                      <Link
                        key={stage.id}
                        href={stage.href}
                        className={cn("rounded-md border p-3 transition hover:-translate-y-0.5", stageStatusTone[stage.status])}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase tracking-[0.14em]">{stage.label}</p>
                          <span className="rounded bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                            {stage.status}
                          </span>
                        </div>
                        <p className="mt-2 break-words text-xs font-semibold leading-5 opacity-80">{stage.detail}</p>
                      </Link>
                    ))}
                  </div>
                ) : null}

                <div data-testid="geography-track-closeout-panel" className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#f3fbf7] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Pilot closeout</p>
                      <h3 className="mt-1 text-lg font-black text-[#13251d]">
                        {focusedDayComplete ? `Day ${nextFocusSession.day} complete` : `Day ${nextFocusSession.day} still needs proof`}
                      </h3>
                      <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">
                        {focusedDayComplete
                          ? "The student has Watch, Talk, Lab, and MCQ command proof. Return to the pilot page and save the final observation."
                          : focusedReadiness?.nextState.detail ?? "Finish the active room before closing the pilot loop."}
                      </p>
                    </div>
                    <span className={cn(
                      "rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ring-1",
                      focusedDayComplete
                        ? "bg-[#e7f5ee] text-[#085041] ring-[#1d9e75]/25"
                        : "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/30"
                    )}>
                      {focusedDayComplete ? "Feedback due" : focusedReadiness?.nextState.label ?? "In progress"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Link
                      data-testid="geography-track-pilot-feedback-route"
                      href={focusedCloseoutHref}
                      className={cn(
                        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition",
                        focusedDayComplete
                          ? "bg-[#1a3a2a] text-white hover:bg-[#10291d]"
                          : "border border-[#cfc6b6] bg-white text-[#1a3a2a] hover:bg-[#f2eadc]"
                      )}
                    >
                      {focusedCloseoutLabel} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      data-testid="geography-track-recovery-route"
                      href={`/upsc/geography/revisit?day=${nextFocusSession.day}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                    >
                      Open Revisit recovery <RefreshCcw className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
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
                        href={`/upsc/geography/revisit?day=${session.day}`}
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

            <GeographyLoopActions activeDay={nextFocusSession.day} labSlug={nextFocusLabSlug} current="track" />
          </div>
        </section>
      </div>
    </div>
  );
}
