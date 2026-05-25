"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  LineChart,
  Microscope,
  MapPinned,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UploadCloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyLoopActions } from "@/components/upsc/GeographyLoopActions";
import { getGeographyLoopState } from "@/lib/upsc/geographyLoopState";
import type { GeographyLoopStateLabel } from "@/lib/upsc/geographyLoopState";
import { buildGeographyReadinessSnapshot, getGeographyDayReadiness } from "@/lib/upsc/geographyReadiness";
import { geographyLabs, geographySessions } from "@/lib/upsc/plan";
import type { GeographySession } from "@/lib/upsc/plan";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

const weekTabs = [
  { week: 1, label: "Week 1", detail: "Physical base" },
  { week: 2, label: "Week 2", detail: "India map" },
  { week: 3, label: "Week 3", detail: "Human geography" },
  { week: 4, label: "Week 4", detail: "Atlas and PYQ" },
  { week: 5, label: "Final", detail: "Mock and command" },
];

const stepIcons = {
  watch: PlayCircle,
  talk: BrainCircuit,
  lab: Microscope,
  test: ClipboardCheck,
  track: LineChart,
  revisit: RefreshCcw,
};

function resolveSession(day?: number) {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

const nextActionIcons: Record<GeographyLoopStateLabel, LucideIcon> = {
  "Loading local status": TimerReset,
  "Watch pending": PlayCircle,
  "Talk pending": BrainCircuit,
  "Revisit required": RefreshCcw,
  "Lab pending": Layers3,
  "Fresh MCQ needed": UploadCloud,
  "MCQ drafting": UploadCloud,
  "MCQ batch ready": ClipboardCheck,
  "MCQ practice active": ClipboardCheck,
  "MCQ practice done": CheckCircle2,
};

function getDefaultLabSlug(session: GeographySession) {
  return geographyLabs.find((lab) => lab.title === session.lab)?.slug ?? geographyLabs[0].slug;
}

export function GeographyCommandRoom({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, progress: progressMap } = useGeographyProgress();
  const [activeDay, setActiveDay] = useState(resolveSession(initialDay).day);
  const activeSession = geographySessions.find((session) => session.day === activeDay) ?? geographySessions[0];
  const [activeLabTitle, setActiveLabTitle] = useState(activeSession.lab);
  const activeProgress = getDayProgress(activeSession.day);

  const activeWeek = activeSession.week;
  const weekSessions = useMemo(
    () => geographySessions.filter((session) => session.week === activeWeek),
    [activeWeek]
  );

  const selectedLab =
    geographyLabs.find((lab) => lab.title === activeLabTitle) ??
    geographyLabs.find((lab) => lab.title === activeSession.lab) ??
    geographyLabs[0];

  const SelectedLabIcon = selectedLab.icon;
  const calendarProgress = Math.round((activeSession.day / geographySessions.length) * 100);
  const readinessSnapshot = buildGeographyReadinessSnapshot(progressMap, { isLoaded });
  const activeReadiness = getGeographyDayReadiness(activeSession, activeProgress, {
    isLoaded,
    labSlug: selectedLab.slug,
  });
  const labCompleteCount = geographySessions.filter((session) => getDayProgress(session.day)?.labCompleted).length;
  const activeLabCompleted = Boolean(activeProgress?.labCompleted);
  const activeLabStatus = !isLoaded ? "Loading local status" : activeLabCompleted ? "Lab completed" : "Lab pending";
  const activeNextAction = getGeographyLoopState(activeSession, activeProgress, {
    isLoaded,
    labSlug: selectedLab.slug,
  });
  const ActiveNextIcon = nextActionIcons[activeNextAction.label];
  const weekSessionStates = weekSessions.map((session) => {
    const dayProgress = getDayProgress(session.day);
    return {
      session,
      nextAction: getGeographyLoopState(session, dayProgress, {
        isLoaded,
        labSlug: getDefaultLabSlug(session),
      }),
    };
  });
  const sessionSteps = [
    { label: "Watch", detail: activeSession.watch, icon: stepIcons.watch },
    { label: "Talk", detail: activeSession.talk, icon: stepIcons.talk },
    { label: "Lab", detail: activeSession.lab, icon: stepIcons.lab },
    { label: "Test", detail: activeSession.test, icon: stepIcons.test },
    { label: "Track", detail: activeSession.track, icon: stepIcons.track },
    { label: "Revisit", detail: activeSession.revisit, icon: stepIcons.revisit },
  ];

  const selectWeek = (week: number) => {
    const firstSession = geographySessions.find((session) => session.week === week);
    if (!firstSession) return;
    setActiveDay(firstSession.day);
    setActiveLabTitle(firstSession.lab);
    router.replace(`/upsc/geography?day=${firstSession.day}`, { scroll: false });
  };

  const selectDay = (day: number) => {
    const session = geographySessions.find((item) => item.day === day);
    if (!session) return;
    setActiveDay(day);
    setActiveLabTitle(session.lab);
    router.replace(`/upsc/geography?day=${day}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Geography</Badge>
              <span className="text-sm font-bold text-[#776f64]">June command room</span>
              <Link
                href="/upsc/geography/testing"
                className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 text-xs font-black text-[#085041] transition hover:bg-[#d7efe4]"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Testing cockpit
              </Link>
              <Link
                href="/upsc/geography/animation-studio"
                className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#f0d7a2] bg-[#fff3d6] px-3 text-xs font-black text-[#805000] transition hover:bg-[#fde8b4]"
              >
                <Sparkles className="h-3.5 w-3.5" /> Animation studio
              </Link>
            </div>

            <div className="grid gap-5 2xl:grid-cols-[1fr_180px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">
                  Day {activeSession.day} of 30
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-4xl">
                  {activeSession.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">
                  {activeSession.anchor}
                </p>
              </div>

              <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <CalendarDays className="h-5 w-5 text-[#085041]" />
                  <span className="text-sm font-black text-[#085041]">{calendarProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${calendarProgress}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold leading-5 text-[#49675e]">{activeSession.chapter}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                  {activeSession.duration}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Current block", value: activeSession.chapter },
                { label: "Lab focus", value: activeSession.lab },
                { label: "Lab state", value: activeLabStatus },
                { label: "Next action", value: activeNextAction.label },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{item.label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[#13251d]">{item.value}</p>
                </div>
              ))}
            </div>

            <div
              data-testid="command-next-action"
              className={cn("mt-6 rounded-lg border p-4", activeNextAction.tone)}
            >
              <div className="grid gap-4 md:grid-cols-[44px_1fr_auto] md:items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/75">
                  <ActiveNextIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em]">Next required room</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">{activeNextAction.label}</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 opacity-85">{activeNextAction.detail}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div data-testid="command-readiness-score" className="rounded-md bg-white/70 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">Day readiness</p>
                      <p className="mt-1 text-lg font-black">{activeReadiness.score}% / {activeReadiness.label}</p>
                    </div>
                    <div data-testid="command-subject-readiness" className="rounded-md bg-white/70 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">Subject readiness</p>
                      <p className="mt-1 text-lg font-black">
                        {readinessSnapshot.score}% / {readinessSnapshot.commandCount}/30 command
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href={activeNextAction.href}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#10291d]"
                >
                  {activeNextAction.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <GeographyLoopActions
              className="mt-6"
              activeDay={activeSession.day}
              labSlug={selectedLab.slug}
              title="Subject loop"
              detail="Use the same room sequence for every Geography day."
            />
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Sprint selector</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Choose week and day</h2>
              </div>
              <MapPinned className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-2 md:grid-cols-5">
              {weekTabs.map((tab) => {
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
                        ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#5f665f] hover:border-[#1d9e75]/60"
                    )}
                  >
                    <span className="block text-sm font-black">{tab.label}</span>
                    <span className="mt-1 block text-xs font-semibold">{tab.detail}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {weekSessionStates.map(({ session, nextAction }) => {
                const isActive = activeSession.day === session.day;
                const DayStateIcon = nextActionIcons[nextAction.label];
                return (
                  <button
                    key={session.day}
                    type="button"
                    data-testid={`command-day-${session.day}`}
                    aria-pressed={isActive}
                    onClick={() => selectDay(session.day)}
                    className={cn(
                      "min-h-20 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b] hover:bg-[#f2eadc]"
                    )}
                  >
                    <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em]">
                      Day {session.day}
                      <DayStateIcon className="h-4 w-4" />
                    </span>
                    <span className="mt-2 block text-sm font-bold leading-5">{session.title}</span>
                    <span
                      data-testid={`command-day-state-${session.day}`}
                      className={cn(
                        "mt-2 inline-flex max-w-full rounded px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
                        isActive ? "bg-white/15 text-white" : "bg-[#e7f5ee] text-[#085041]"
                      )}
                    >
                      {nextAction.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Session plan</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Watch, talk, lab, test, track, revisit</h2>
              </div>
              <Badge variant="outline" className="rounded-md border-[#1d9e75]/40 text-[#085041]">
                {activeSession.duration}
              </Badge>
            </div>

            <div className="grid gap-3">
              {sessionSteps.map((step) => (
                <div key={step.label} className="grid grid-cols-[44px_1fr] gap-3 rounded-md bg-[#f7f4ee] p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-black text-[#085041]">{step.label}</p>
                      {step.label === "Watch" && (
                        <Link
                          href={`/upsc/geography/watch?day=${activeSession.day}`}
                          className="text-xs font-black text-[#1d9e75] underline-offset-4 hover:underline"
                        >
                          Open class
                        </Link>
                      )}
                      {step.label === "Talk" && (
                        <Link
                          href={`/upsc/geography/talk?day=${activeSession.day}`}
                          className="text-xs font-black text-[#1d9e75] underline-offset-4 hover:underline"
                        >
                          Open room
                        </Link>
                      )}
                      {step.label === "Lab" && (
                        <Link
                          href={`/upsc/geography/lab?mode=${selectedLab.slug}&day=${activeSession.day}`}
                          className="text-xs font-black text-[#1d9e75] underline-offset-4 hover:underline"
                        >
                          Open visual lab
                        </Link>
                      )}
                      {step.label === "Test" && (
                        <Link
                          href={`/upsc/geography/mcq-readiness?day=${activeSession.day}`}
                          className="text-xs font-black text-[#1d9e75] underline-offset-4 hover:underline"
                        >
                          Map fresh MCQs
                        </Link>
                      )}
                      {step.label === "Track" && (
                        <Link
                          href={`/upsc/geography/track`}
                          className="text-xs font-black text-[#1d9e75] underline-offset-4 hover:underline"
                        >
                          Open tracker
                        </Link>
                      )}
                      {step.label === "Revisit" && (
                        <Link
                          href={`/upsc/geography/revisit?day=${activeSession.day}`}
                          className="text-xs font-black text-[#1d9e75] underline-offset-4 hover:underline"
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
            <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Visual lab</p>
                  <h2 className="text-2xl font-black tracking-tight text-[#085041]">{selectedLab.title}</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                  <SelectedLabIcon className="h-5 w-5" />
                </div>
              </div>

              <p className="text-sm font-semibold leading-6 text-[#49675e]">{selectedLab.detail}</p>

              <div data-testid="command-lab-status" className="mt-4 rounded-md border border-[#b9dacf] bg-white/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    {activeLabStatus}
                  </p>
                  <span className="text-xs font-black text-[#085041]">{labCompleteCount}/30 saved</span>
                </div>
                {activeProgress?.labInsight ? (
                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#49675e]">
                    {activeProgress.labInsight}
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#49675e]">
                    Complete the selected visual lab to attach map insight before fresh MCQ practice.
                  </p>
                )}
              </div>

              <Link
                href={`/upsc/geography/lab?mode=${selectedLab.slug}&day=${activeSession.day}`}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#10291d]"
              >
                <Microscope className="h-4 w-4" /> Open visual lab
              </Link>
              <Link
                href="/upsc/geography/animation-studio"
                className="ml-2 mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#f0d7a2] bg-[#fff3d6] px-3 text-sm font-bold text-[#805000] transition hover:bg-[#fde8b4]"
              >
                <Sparkles className="h-4 w-4" /> Universe storyboard
              </Link>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {geographyLabs.map((lab) => {
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
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : "border-[#b9dacf] bg-white/75 text-[#426259] hover:border-[#1d9e75]"
                      )}
                    >
                      <lab.icon className="h-4 w-4 shrink-0" />
                      <span>{lab.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Fresh MCQ upload contract</p>
                  <p className="text-xs font-semibold text-[#746f66]">Mapped to the selected Geography session</p>
                </div>
              </div>

              <div className="grid gap-2">
                {[
                  ["Subject", "Geography"],
                  ["Day", `Day ${activeSession.day}`],
                  ["Chapter", activeSession.chapter],
                  ["Topic", activeSession.title],
                  ["Batch", `GEO-D${String(activeSession.day).padStart(2, "0")}`],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[96px_1fr] gap-3 rounded-md bg-[#f7f4ee] px-3 py-2">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</span>
                    <span className="text-sm font-bold text-[#34453b]">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-md bg-[#fdfaf3] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                <p className="text-xs font-semibold leading-5 text-[#657066]">
                  Old EduEcosystem MCQs stay as reference. Fresh MCQs can be uploaded against this day/chapter/topic map.
                </p>
              </div>
              <Link
                href={`/upsc/geography/mcq-readiness?day=${activeSession.day}`}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#10291d]"
              >
                <UploadCloud className="h-4 w-4" /> Open MCQ readiness
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-[#13251d]">Local loop memory</p>
              <p className="text-xs font-semibold text-[#746f66]">Command room now reads the real daily gates from this browser</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              {
                label: "Watched",
                value: readinessSnapshot.stageCounts.watch,
                detail: "Class sessions started",
              },
              {
                label: "Talk clear",
                value: readinessSnapshot.stageCounts.talk,
                detail: "Practice or Command band",
              },
              {
                label: "Lab saved",
                value: readinessSnapshot.stageCounts.lab,
                detail: "Visual insights attached",
              },
              {
                label: "Revisit due",
                value: readinessSnapshot.revisitCount,
                detail: "Weak concepts queued",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{item.label}</p>
                <p className="mt-2 text-2xl font-black leading-none text-[#13251d]">{item.value}/30</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#657066]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
