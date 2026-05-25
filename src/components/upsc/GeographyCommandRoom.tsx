"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
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
import { labSlugForGeographySession } from "@/lib/upsc/geographyLearning";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
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

function getDayStatus(progress?: GeographyDayProgress) {
  if (progress?.mcqCompleted) return "Practice done";
  if (progress?.mcqAttempted) return "Practice active";
  if (progress?.labCompleted) return "MCQ next";
  if (hasGeographyTalkClearance(progress)) return "Visual next";
  if (progress?.watched) return "Talk next";
  return "Watch next";
}

function buildFunnelSteps(session: GeographySession, progress: GeographyDayProgress | undefined, currentRoom: string): FunnelStep[] {
  const labSlug = progress?.labMode ?? labSlugForGeographySession(session.lab);
  const talkDone = hasGeographyTalkClearance(progress);
  const watchDone = Boolean(progress?.watched);
  const labDone = Boolean(progress?.labCompleted);
  const mcqDone = Boolean(progress?.mcqCompleted);
  const revisitActive = progress?.revisitQueued || currentRoom === "revisit";

  const currentByRoom: Record<string, string> = {
    loading: "watch",
    watch: "watch",
    talk: "talk",
    revisit: "revisit",
    lab: "lab",
    mcq: "mcq",
  };
  const currentStep = currentByRoom[currentRoom] ?? "watch";

  const stepDone = {
    watch: watchDone,
    talk: talkDone,
    lab: labDone,
    mcq: mcqDone,
    revisit: !revisitActive && mcqDone,
  };

  const stepUnlocked = {
    watch: true,
    talk: watchDone,
    lab: talkDone,
    mcq: labDone,
    revisit: revisitActive || mcqDone,
  };

  const statusFor = (id: keyof typeof stepDone): FunnelStatus => {
    if (stepDone[id]) return "done";
    if (currentStep === id || (id === "revisit" && revisitActive)) return "current";
    return stepUnlocked[id] ? "current" : "locked";
  };

  return [
    {
      id: "watch",
      label: "Watch",
      helper: "Learn the topic",
      href: `/upsc/geography/watch?day=${session.day}`,
      status: statusFor("watch"),
      icon: PlayCircle,
    },
    {
      id: "talk",
      label: "Explain",
      helper: "AI teacher check",
      href: `/upsc/geography/talk?day=${session.day}`,
      status: statusFor("talk"),
      icon: BrainCircuit,
    },
    {
      id: "lab",
      label: "Visual",
      helper: "Map or mechanism proof",
      href: `/upsc/geography/lab?mode=${labSlug}&day=${session.day}`,
      status: statusFor("lab"),
      icon: MapPinned,
    },
    {
      id: "mcq",
      label: "MCQ",
      helper: "Fresh practice",
      href: `/upsc/geography/mcq-readiness?day=${session.day}`,
      status: statusFor("mcq"),
      icon: ClipboardCheck,
    },
    {
      id: "revisit",
      label: "Revise",
      helper: "Only weak points",
      href: `/upsc/geography/revisit?day=${session.day}`,
      status: statusFor("revisit"),
      icon: RefreshCcw,
    },
  ];
}

export function GeographyCommandRoom({ initialDay }: { initialDay?: number }) {
  const { getDayProgress, isLoaded } = useGeographyProgress();
  const [activeDay, setActiveDay] = useState(resolveSession(initialDay).day);
  const activeSession = resolveSession(activeDay);
  const activeProgress = getDayProgress(activeSession.day);
  const labSlug = activeProgress?.labMode ?? labSlugForGeographySession(activeSession.lab);
  const nextAction = getGeographyLoopState(activeSession, activeProgress, { isLoaded, labSlug });
  const funnelSteps = buildFunnelSteps(activeSession, activeProgress, nextAction.room);
  const completedStepCount = funnelSteps.filter((step) => step.status === "done").length;
  const monthPercent = Math.round((activeSession.day / geographySessions.length) * 100);
  const currentWeekDays = useMemo(
    () => geographySessions.filter((session) => session.week === activeSession.week),
    [activeSession.week]
  );

  const previousDay = activeSession.day > 1 ? activeSession.day - 1 : null;
  const nextDay = activeSession.day < geographySessions.length ? activeSession.day + 1 : null;

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), geographySessions.length);
    setActiveDay(boundedDay);
    window.history.replaceState(null, "", `/upsc/geography?day=${boundedDay}`);
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Geography</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day} of 30</span>
                <span className="text-sm font-semibold text-[#746f66]">{activeSession.duration}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{activeSession.title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                {activeSession.anchor}
              </p>
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

        <section data-testid="geography-next-action" className={cn("rounded-lg border p-5 shadow-sm", nextAction.tone)}>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
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

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Today&apos;s funnel</p>
              <h2 className="text-xl font-black tracking-tight">The app decides the next room</h2>
            </div>
            <span className="rounded-md bg-[#f7f4ee] px-3 py-2 text-xs font-black text-[#5d675f]">
              {completedStepCount}/5 steps complete
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
              <p>After Watch, the student moves to Explain.</p>
              <p>If explanation is weak, the app sends them to Revise.</p>
              <p>If explanation is clear, Visual opens before MCQ.</p>
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
                const status = getDayStatus(getDayProgress(session.day));
                return (
                  <button
                    key={session.day}
                    type="button"
                    data-testid={`geography-week-day-${session.day}`}
                    onClick={() => selectDay(session.day)}
                    className={cn(
                      "rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Day {session.day}</p>
                    <p className="mt-1 text-sm font-black leading-5">{session.title}</p>
                    <p className={cn("mt-2 inline-flex rounded px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", isActive ? "bg-white/15" : "bg-[#e7f5ee] text-[#085041]")}>
                      {status}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">30-day map</p>
              <h2 className="text-lg font-black tracking-tight">Pick a day only when needed</h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Today
            </Link>
          </div>

          <div data-testid="geography-30-day-map" className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
            {geographySessions.map((session) => {
              const isActive = session.day === activeSession.day;
              const progress = getDayProgress(session.day);
              const isDone = Boolean(progress?.mcqCompleted);
              return (
                <button
                  key={session.day}
                  type="button"
                  data-testid={`geography-day-${session.day}`}
                  onClick={() => selectDay(session.day)}
                  className={cn(
                    "min-h-20 rounded-md border p-2 text-left transition",
                    isActive
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : isDone
                        ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
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
    </main>
  );
}
