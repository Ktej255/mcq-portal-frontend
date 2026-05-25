"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers3,
  LineChart,
  PlayCircle,
  RefreshCcw,
  Save,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getUpscMcqBatchStatus, isUpscMcqCommandCleared } from "@/lib/upsc/mcqCommandStatus";
import { geographyLabs, geographySessions } from "@/lib/upsc/plan";
import { getSubjectBatchCode, subjectPlans, type SubjectLab, type SubjectSession } from "@/lib/upsc/subjectPlans";
import { buildUpscActionQueue } from "@/lib/upsc/upscActionQueue";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

type DailySubject = {
  slug: string;
  title: string;
  window: string;
  sessions: SubjectSession[];
  labs: Array<Pick<SubjectLab, "slug" | "title">>;
};

type ContentState = {
  videoStatus?: "Planned" | "Drafted" | "Ready";
  notesStatus?: "Planned" | "Drafted" | "Ready";
  transcriptStatus?: "Planned" | "Drafted" | "Ready";
};

type McqState = {
  planned?: number;
  drafted?: number;
  status?: "DRAFT" | "READY";
};

type DailyState = {
  subjectSlug: string;
  day: number;
  note?: string;
  updatedAt?: string;
};

const dailySubjects: DailySubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
    sessions: geographySessions,
    labs: geographyLabs.map((lab) => ({ slug: lab.slug, title: lab.title })),
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
    sessions: plan.sessions,
    labs: plan.labs.map((lab) => ({ slug: lab.slug, title: lab.title })),
  })),
];

const dailyStorageKey = "sarit-upsc-daily-command-v1";
const contentStorageKey = "sarit-upsc-content-command-v1";
const mcqStorageKey = "sarit-upsc-mcq-command-v1";
const defaultMcqState: McqState = { planned: 25, drafted: 0, status: "DRAFT" };

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

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function progressStorageKey(subjectSlug: string) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function contentKey(subject: DailySubject, session: SubjectSession) {
  return `${subject.slug}:D${String(session.day).padStart(2, "0")}`;
}

function batchCode(subject: DailySubject, session: SubjectSession) {
  return getSubjectBatchCode(subject.slug, session.day);
}

function getProgress(subject: DailySubject, session: SubjectSession) {
  const progress = readJson<Record<string, SubjectDayProgress>>(progressStorageKey(subject.slug), {});
  return progress[String(session.day)];
}

function getContentState(subject: DailySubject, session: SubjectSession) {
  const states = readJson<Record<string, ContentState>>(contentStorageKey, {});
  return states[contentKey(subject, session)] ?? {};
}

function getMcqState(subject: DailySubject, session: SubjectSession) {
  const states = readJson<Record<string, McqState>>(mcqStorageKey, {});
  return states[batchCode(subject, session)] ?? { planned: 25, drafted: 0, status: "DRAFT" };
}

function isContentReady(state: ContentState) {
  return state.videoStatus === "Ready" && state.notesStatus === "Ready" && state.transcriptStatus === "Ready";
}

function getLabSlug(subject: DailySubject, session: SubjectSession) {
  return subject.labs.find((lab) => lab.title === session.lab)?.slug ?? subject.labs[0]?.slug ?? "";
}

function getInitialDailyState(): DailyState {
  return readJson<DailyState>(dailyStorageKey, {
    subjectSlug: "geography",
    day: 1,
    note: "",
  });
}

export function UpscDailyMissionControl() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dailyState, setDailyState] = useState<DailyState>({ subjectSlug: "geography", day: 1, note: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDailyState(getInitialDailyState());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeSubject = dailySubjects.find((subject) => subject.slug === dailyState.subjectSlug) ?? dailySubjects[0];
  const activeSession =
    activeSubject.sessions.find((session) => session.day === dailyState.day) ?? activeSubject.sessions[0];
  const activeLabSlug = getLabSlug(activeSubject, activeSession);
  const activeProgress = isLoaded ? getProgress(activeSubject, activeSession) : undefined;
  const activeContent = isLoaded ? getContentState(activeSubject, activeSession) : {};
  const activeMcq = isLoaded ? getMcqState(activeSubject, activeSession) : defaultMcqState;
  const contentReady = isContentReady(activeContent);
  const activeMcqBatch = getUpscMcqBatchStatus(activeMcq);
  const basePath = `/upsc/${activeSubject.slug}`;
  const activeBatchCode = batchCode(activeSubject, activeSession);
  const activeMcqCommand = isUpscMcqCommandCleared(activeProgress, activeBatchCode);

  const totals = useMemo(() => {
    if (!isLoaded) {
      return {
        watched: 0,
        reflected: 0,
        revisit: 0,
        contentReady: 0,
        mcqBatchReady: 0,
        mcqCommand: 0,
        total: dailySubjects.reduce((sum, subject) => sum + subject.sessions.length, 0),
      };
    }

    return dailySubjects.reduce(
      (sum, subject) => {
        subject.sessions.forEach((session) => {
          const progress = getProgress(subject, session);
          const content = getContentState(subject, session);
          const activeBatchCode = batchCode(subject, session);
          const mcq = getUpscMcqBatchStatus(getMcqState(subject, session));
          sum.total += 1;
          if (progress?.watched) sum.watched += 1;
          if (progress?.reflection?.trim()) sum.reflected += 1;
          if (progress?.revisitQueued) sum.revisit += 1;
          if (isContentReady(content)) sum.contentReady += 1;
          if (mcq.ready) sum.mcqBatchReady += 1;
          if (isUpscMcqCommandCleared(progress, activeBatchCode)) sum.mcqCommand += 1;
        });
        return sum;
      },
      { watched: 0, reflected: 0, revisit: 0, contentReady: 0, mcqBatchReady: 0, mcqCommand: 0, total: 0 }
    );
  }, [isLoaded, dailyState]);
  const actionQueue = useMemo(() => (isLoaded ? buildUpscActionQueue(8) : []), [isLoaded, dailyState, saved]);

  const saveDailyState = (patch: Partial<DailyState>) => {
    const next = {
      ...dailyState,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setDailyState(next);
    writeJson(dailyStorageKey, next);
    setSaved(true);
  };

  const selectSubject = (slug: string) => {
    const subject = dailySubjects.find((item) => item.slug === slug) ?? dailySubjects[0];
    saveDailyState({ subjectSlug: subject.slug, day: subject.sessions[0]?.day ?? 1 });
    setSaved(false);
  };

  const selectDay = (day: number) => {
    saveDailyState({ day });
    setSaved(false);
  };

  const saveNote = () => saveDailyState({ note: dailyState.note ?? "" });

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading UPSC daily mission...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href="/upsc" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> UPSC command home
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Daily Mission</Badge>
              <span className="text-sm font-bold text-[#776f64]">Student launch control</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">{activeSubject.window}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              {activeSubject.title}: Day {activeSession.day}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Batch", activeBatchCode],
                ["Chapter", activeSession.chapter],
                ["Duration", activeSession.duration],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Watched", value: totals.watched, icon: PlayCircle },
              { label: "Talk notes", value: totals.reflected, icon: BrainCircuit },
              { label: "Revisit", value: totals.revisit, icon: RefreshCcw },
              { label: "Content ready", value: totals.contentReady, icon: BookOpen },
              { label: "Batch ready", value: totals.mcqBatchReady, icon: ClipboardCheck },
              { label: "MCQ command", value: totals.mcqCommand, icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{item.label}</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-[#13251d]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          data-testid="global-next-action-queue"
          className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Global next action</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What should be done now?</h2>
            </div>
            <Target className="h-6 w-6 text-[#085041]" />
          </div>

          {actionQueue.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#dcd5c7] bg-[#fdfaf3] p-5 text-sm font-bold leading-6 text-[#746f66]">
              No pending action found in local storage. The queue will populate as subjects, labs, Talk checks, and fresh MCQ batches move.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {actionQueue.map((item, index) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn("min-h-36 rounded-md border p-4 transition hover:-translate-y-0.5", item.tone)}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-75">
                        {index + 1}. {item.subjectWindow}
                      </p>
                      <h3 className="mt-1 break-words text-sm font-black leading-5">{item.subjectTitle}</h3>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">
                    Day {item.day} / {item.room}
                  </p>
                  <p className="mt-2 break-words text-sm font-black leading-5">{item.statusLabel}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 opacity-80">{item.detail}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em]">
                    {item.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Mission selector</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Choose subject and day</h2>
              </div>
              <CalendarDays className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {dailySubjects.map((subject) => {
                const isActive = activeSubject.slug === subject.slug;
                return (
                  <button
                    key={subject.slug}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectSubject(subject.slug)}
                    className={cn(
                      "min-h-20 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block text-xs font-black uppercase tracking-[0.14em]">{subject.window}</span>
                    <span className="mt-2 block text-sm font-black leading-5">{subject.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">{subject.sessions.length} days</span>
                  </button>
                );
              })}
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {activeSubject.sessions.map((session) => {
                const progress = getProgress(activeSubject, session);
                const contentReadyForDay = isContentReady(getContentState(activeSubject, session));
                const mcqCommandForDay = isUpscMcqCommandCleared(progress, batchCode(activeSubject, session));
                const isActive = activeSession.day === session.day;

                return (
                  <button
                    key={session.day}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectDay(session.day)}
                    className={cn(
                      "min-h-24 min-w-0 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : progress?.revisitQueued
                          ? "border-[#ef9f27]/50 bg-[#fff4df] text-[#6f4a12] hover:border-[#ef9f27]"
                          : contentReadyForDay && mcqCommandForDay
                            ? "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041] hover:border-[#1d9e75]"
                            : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block break-words text-xs font-black uppercase tracking-[0.16em]">
                      {batchCode(activeSubject, session)}
                    </span>
                    <span className="mt-2 block break-words text-sm font-bold leading-5">{session.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">
                      {progress?.revisitQueued
                        ? "Revisit queued"
                        : progress?.watched
                          ? "Watched"
                          : contentReadyForDay
                            ? "Content ready"
                            : "Start here"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid min-w-0 gap-5">
            <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Today loop</p>
                  <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Move through the class sequence</h2>
                </div>
                <Target className="h-6 w-6 text-[#085041]" />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    label: "Watch",
                    detail: activeProgress?.watched ? "Watched" : contentReady ? "Ready to watch" : "Content pending",
                    href: `${basePath}/watch?day=${activeSession.day}`,
                    icon: PlayCircle,
                    active: true,
                  },
                  {
                    label: "Talk",
                    detail: activeProgress?.reflection ? "Reflection saved" : "Explain after watch",
                    href: `${basePath}/talk?day=${activeSession.day}`,
                    icon: BrainCircuit,
                    active: Boolean(activeProgress?.watched),
                  },
                  {
                    label: "Lab",
                    detail: activeSession.lab,
                    href: `${basePath}/lab?mode=${activeLabSlug}&day=${activeSession.day}`,
                    icon: Layers3,
                    active: Boolean(activeLabSlug),
                  },
                  {
                    label: "MCQ",
                    detail: activeMcqCommand
                      ? `Command ${activeProgress?.mcqScorePercent ?? 0}%`
                      : activeProgress?.mcqOutcome === "Revisit"
                        ? "Revisit required"
                        : activeMcqBatch.ready
                          ? "Practice pending"
                          : `${activeMcqBatch.drafted}/${activeMcqBatch.planned} drafted`,
                    href: `${basePath}/mcq-readiness?day=${activeSession.day}`,
                    icon: ClipboardCheck,
                    active: true,
                  },
                  {
                    label: "Track",
                    detail: "Subject progress",
                    href: `${basePath}/track`,
                    icon: LineChart,
                    active: true,
                  },
                  {
                    label: "Revisit",
                    detail: activeProgress?.revisitQueued ? "Repair now" : "Recovery room",
                    href: `${basePath}/revisit?day=${activeSession.day}`,
                    icon: RefreshCcw,
                    active: true,
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "group flex min-h-16 items-center gap-3 rounded-md border px-3 text-left transition hover:-translate-y-0.5",
                      item.active
                        ? "border-[#dcd5c7] bg-[#f7f4ee] text-[#1a3a2a] hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
                        : "pointer-events-none border-[#dcd5c7] bg-[#f7f4ee] text-[#8a8174] opacity-60"
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#085041] group-hover:bg-[#1d9e75] group-hover:text-white">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black leading-5">{item.label}</span>
                      <span className="mt-0.5 block break-words text-xs font-semibold opacity-70">{item.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Daily note</p>
                  <p className="text-xs font-semibold text-[#746f66]">Saved locally for the selected mission</p>
                </div>
              </div>

              <textarea
                value={dailyState.note ?? ""}
                onChange={(event) => {
                  setDailyState((current) => ({ ...current, note: event.target.value }));
                  setSaved(false);
                }}
                placeholder="Write today's target, doubt, or class instruction here."
                className="min-h-28 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              />

              <button
                type="button"
                onClick={saveNote}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
              >
                <Save className="h-4 w-4" /> Save daily mission
              </button>
              {saved && (
                <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <p className="text-sm font-bold leading-6 text-[#085041]">Daily mission saved locally.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Global controls</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Jump to command centers</h2>
            </div>
            <Gauge className="h-6 w-6 text-[#085041]" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["Content Command", "/upsc/content-command"],
              ["MCQ Command", "/upsc/mcq-command"],
              ["Revision Command", "/upsc/revision-command"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-[#f7f4ee] px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#e7f5ee]"
              >
                {label} <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
