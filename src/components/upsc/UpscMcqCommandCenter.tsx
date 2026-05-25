"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Gauge,
  Layers3,
  ListChecks,
  Search,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographySessions } from "@/lib/upsc/plan";
import { getSubjectBatchCode, subjectPlans, type SubjectSession } from "@/lib/upsc/subjectPlans";
import { cn } from "@/lib/utils";

type McqSubject = {
  slug: string;
  title: string;
  window: string;
  sessions: SubjectSession[];
};

type BatchState = {
  planned: number;
  drafted: number;
  difficulty: string;
  status: "DRAFT" | "READY";
  updatedAt?: string;
};

const difficulties = ["EASY", "MEDIUM", "HARD", "PYQ_STYLE"];

const mcqSubjects: McqSubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
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
    sessions: plan.sessions,
  })),
];

const defaultBatchState: BatchState = {
  planned: 25,
  drafted: 0,
  difficulty: "MEDIUM",
  status: "DRAFT",
};

const storageKey = "sarit-upsc-mcq-command-v1";

function csvEscape(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function readBatchStates() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, BatchState>) : {};
  } catch {
    return {};
  }
}

function writeBatchStates(states: Record<string, BatchState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(states));
}

function buildBatchCode(subject: McqSubject, session: SubjectSession) {
  return getSubjectBatchCode(subject.slug, session.day);
}

function buildTemplateRow(subject: McqSubject, session: SubjectSession, state: BatchState) {
  return {
    subject: subject.title,
    day: session.day,
    week: session.week,
    chapter: session.chapter,
    topic: session.title,
    batch_code: buildBatchCode(subject, session),
    test_title: `${subject.title} Day ${session.day}: ${session.title}`,
    difficulty: state.difficulty,
    question_text_en: `Fresh MCQ stem for ${session.title}`,
    option_a: "Option A",
    option_b: "Option B",
    option_c: "Option C",
    option_d: "Option D",
    correct_option: "A",
    explanation_en: `Explain the concept, example, and UPSC trap for ${session.title}.`,
    source: "FRESH_AUTHORING",
    map_or_case_tag: session.lab,
    pyq_linked: "No",
    status: state.status,
  };
}

function buildCsv(subject: McqSubject, session: SubjectSession, state: BatchState) {
  const row = buildTemplateRow(subject, session, state);
  const headers = Object.keys(row) as Array<keyof typeof row>;
  return `${headers.join(",")}\n${headers.map((header) => csvEscape(row[header])).join(",")}\n`;
}

function getState(states: Record<string, BatchState>, batchCode: string) {
  return states[batchCode] ?? defaultBatchState;
}

export function UpscMcqCommandCenter({
  initialSubjectSlug,
  initialDay,
}: {
  initialSubjectSlug?: string;
  initialDay?: number;
}) {
  const router = useRouter();
  const [batchStates, setBatchStates] = useState<Record<string, BatchState>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSubjectSlug, setActiveSubjectSlug] = useState(initialSubjectSlug ?? "geography");
  const [activeDay, setActiveDay] = useState(initialDay ?? 1);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBatchStates(readBatchStates());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeSubject = mcqSubjects.find((subject) => subject.slug === activeSubjectSlug) ?? mcqSubjects[0];
  const activeSession =
    activeSubject.sessions.find((session) => session.day === activeDay) ?? activeSubject.sessions[0];
  const activeBatchCode = buildBatchCode(activeSubject, activeSession);
  const activeState = getState(batchStates, activeBatchCode);
  const completion = activeState.planned > 0 ? Math.min(100, Math.round((activeState.drafted / activeState.planned) * 100)) : 0;
  const csvPreview = useMemo(
    () => buildCsv(activeSubject, activeSession, activeState),
    [activeSubject, activeSession, activeState]
  );

  const batchSummaries = useMemo(
    () =>
      mcqSubjects.map((subject) => {
        const ready = subject.sessions.filter((session) => {
          const code = buildBatchCode(subject, session);
          const state = getState(batchStates, code);
          return state.status === "READY" || (state.planned > 0 && state.drafted >= state.planned);
        });
        const drafted = subject.sessions.filter((session) => {
          const code = buildBatchCode(subject, session);
          return getState(batchStates, code).drafted > 0;
        });

        return {
          subject,
          readyCount: ready.length,
          draftedCount: drafted.length,
          total: subject.sessions.length,
          completionPercent: Math.round((ready.length / subject.sessions.length) * 100),
        };
      }),
    [batchStates]
  );

  const totals = useMemo(() => {
    const totalBatches = mcqSubjects.reduce((sum, subject) => sum + subject.sessions.length, 0);
    const readyBatches = batchSummaries.reduce((sum, item) => sum + item.readyCount, 0);
    const draftedBatches = batchSummaries.reduce((sum, item) => sum + item.draftedCount, 0);
    const plannedQuestions = mcqSubjects.reduce(
      (sum, subject) =>
        sum +
        subject.sessions.reduce((inner, session) => inner + getState(batchStates, buildBatchCode(subject, session)).planned, 0),
      0
    );
    const draftedQuestions = mcqSubjects.reduce(
      (sum, subject) =>
        sum +
        subject.sessions.reduce((inner, session) => inner + getState(batchStates, buildBatchCode(subject, session)).drafted, 0),
      0
    );

    return {
      totalBatches,
      readyBatches,
      draftedBatches,
      plannedQuestions,
      draftedQuestions,
      completionPercent: totalBatches ? Math.round((readyBatches / totalBatches) * 100) : 0,
    };
  }, [batchStates, batchSummaries]);

  const saveBatchState = (patch: Partial<BatchState>) => {
    const nextState = {
      ...activeState,
      ...patch,
      status:
        (patch.drafted ?? activeState.drafted) >= (patch.planned ?? activeState.planned)
          ? "READY"
          : patch.status ?? activeState.status,
      updatedAt: new Date().toISOString(),
    } satisfies BatchState;
    const next = {
      ...batchStates,
      [activeBatchCode]: nextState,
    };
    setBatchStates(next);
    writeBatchStates(next);
  };

  const updateRoute = (slug: string, day: number) => {
    router.replace(`/upsc/mcq-command?subject=${slug}&day=${day}`, { scroll: false });
  };

  const selectSubject = (slug: string) => {
    const subject = mcqSubjects.find((item) => item.slug === slug) ?? mcqSubjects[0];
    const nextDay = subject.sessions[0]?.day ?? 1;
    setActiveSubjectSlug(subject.slug);
    setActiveDay(nextDay);
    updateRoute(subject.slug, nextDay);
    setDownloaded(false);
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), activeSubject.sessions.length);
    setActiveDay(boundedDay);
    updateRoute(activeSubject.slug, boundedDay);
    setDownloaded(false);
  };

  const markReady = () => {
    saveBatchState({
      drafted: activeState.planned,
      status: "READY",
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvPreview], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeBatchCode}-mcq-template.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading UPSC MCQ command...
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
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">MCQ Command</Badge>
              <span className="text-sm font-bold text-[#776f64]">Fresh batch planning</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">Question engine control room</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              Build fresh MCQs against every class day.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">
              Use this room to track planned and drafted question batches across all UPSC subjects. Each batch keeps the
              subject, day, chapter, topic, test title, difficulty, explanation, and map/case tag aligned with the LMS flow.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${totals.completionPercent}%` }} />
            </div>
            <p className="mt-3 text-sm font-black text-[#085041]">
              {totals.readyBatches} of {totals.totalBatches} batches marked ready
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Batches", value: totals.totalBatches, icon: Layers3 },
              { label: "Ready", value: totals.readyBatches, icon: CheckCircle2 },
              { label: "Drafted", value: totals.draftedBatches, icon: ClipboardCheck },
              { label: "Question plan", value: totals.plannedQuestions, icon: ListChecks },
              { label: "Questions drafted", value: totals.draftedQuestions, icon: Gauge },
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

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Batch map</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Select subject and day</h2>
              </div>
              <Search className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {batchSummaries.map((item) => {
                const isActive = activeSubject.slug === item.subject.slug;
                return (
                  <button
                    key={item.subject.slug}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectSubject(item.subject.slug)}
                    className={cn(
                      "min-h-20 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block text-xs font-black uppercase tracking-[0.14em]">{item.subject.window}</span>
                    <span className="mt-2 block text-sm font-black leading-5">{item.subject.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">
                      {item.readyCount}/{item.total} ready
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {activeSubject.sessions.map((session) => {
                const code = buildBatchCode(activeSubject, session);
                const state = getState(batchStates, code);
                const isActive = activeSession.day === session.day;
                const isReady = state.status === "READY" || state.drafted >= state.planned;

                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectDay(session.day)}
                    className={cn(
                      "min-h-24 min-w-0 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : isReady
                          ? "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041] hover:border-[#1d9e75]"
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block break-words text-xs font-black uppercase tracking-[0.16em]">{code}</span>
                    <span className="mt-2 block break-words text-sm font-bold leading-5">{session.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">
                      {state.drafted}/{state.planned} drafted
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
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">{activeBatchCode}</p>
                  <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Batch readiness</h2>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md",
                    activeState.status === "READY" || activeState.drafted >= activeState.planned
                      ? "border-[#1d9e75]/40 text-[#085041]"
                      : "border-[#ef9f27]/50 text-[#6f4a12]"
                  )}
                >
                  {activeState.status === "READY" || activeState.drafted >= activeState.planned ? "READY" : "DRAFT"}
                </Badge>
              </div>

              <p className="text-lg font-black leading-7 text-[#13251d]">{activeSession.title}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#657066]">{activeSession.chapter}</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                    Planned questions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={activeState.planned}
                    onChange={(event) => saveBatchState({ planned: Math.max(1, Number(event.target.value) || 1) })}
                    className="mt-3 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#13251d] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                  />
                </div>
                <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                    Drafted questions
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={activeState.drafted}
                    onChange={(event) => saveBatchState({ drafted: Math.max(0, Number(event.target.value) || 0) })}
                    className="mt-3 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#13251d] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#085041]">Batch completion</p>
                  <p className="text-sm font-black text-[#085041]">{completion}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f2eadc]">
                  <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${completion}%` }} />
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                {difficulties.map((item) => {
                  const isActive = activeState.difficulty === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        saveBatchState({ difficulty: item });
                        setDownloaded(false);
                      }}
                      className={cn(
                        "min-h-11 rounded-md border px-3 text-xs font-black transition",
                        isActive
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={markReady}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark ready
                </button>
                <Link
                  href={`/upsc/${activeSubject.slug}/mcq-readiness?day=${activeSession.day}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  Daily MCQ room
                </Link>
              </div>
            </div>

            <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">CSV contract preview</p>
                  <p className="text-xs font-semibold text-[#746f66]">Download and use in bulk upload</p>
                </div>
              </div>

              <pre className="max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-all rounded-md bg-[#13251d] p-4 text-xs font-semibold leading-5 text-[#e7f5ee]">
                {csvPreview}
              </pre>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                >
                  <Download className="h-4 w-4" /> Download CSV
                </button>
                <Link
                  href="/admin/questions/bulk"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  <UploadCloud className="h-4 w-4" /> Bulk upload
                </Link>
              </div>
              {downloaded && (
                <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <p className="text-sm font-bold leading-6 text-[#085041]">
                    Template generated for {activeBatchCode}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Authoring contract</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Every fresh MCQ must stay attached to learning.</h2>
            </div>
            <ClipboardCheck className="h-6 w-6 text-[#085041]" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Batch identity", "subject, day, chapter, topic, batch_code, test_title"],
              ["Question quality", "difficulty, question_text_en, options, correct_option, explanation_en"],
              ["Exam hook", "source, map_or_case_tag, pyq_linked, status"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-sm font-black text-[#13251d]">{title}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#657066]">{detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
