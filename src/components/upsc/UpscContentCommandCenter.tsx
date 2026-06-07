"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers3,
  PlayCircle,
  Save,
  Search,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  contentKey,
  defaultContentState,
  getContentState,
  isContentReady,
  readContentStates,
  sourceTypeLabel,
  writeContentStates,
  type ContentState,
} from "@/lib/upsc/contentCommand";
import { geographySessions } from "@/lib/upsc/plan";
import { getSubjectBatchCode, subjectPlans, type SubjectSession } from "@/lib/upsc/subjectPlans";
import { cn } from "@/lib/utils";

type ContentSubject = {
  slug: string;
  title: string;
  window: string;
  sessions: SubjectSession[];
};

const contentSubjects: ContentSubject[] = [
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

const statuses: ContentState["videoStatus"][] = ["Planned", "Drafted", "Ready"];
const sourceTypes: ContentState["sourceType"][] = ["Local", "Recorded", "Live", "External"];

function buildBatchCode(subject: ContentSubject, session: SubjectSession) {
  return getSubjectBatchCode(subject.slug, session.day);
}

export function UpscContentCommandCenter({
  initialSubjectSlug,
  initialDay,
}: {
  initialSubjectSlug?: string;
  initialDay?: number;
}) {
  const router = useRouter();
  const [contentStates, setContentStates] = useState<Record<string, ContentState>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSubjectSlug, setActiveSubjectSlug] = useState(initialSubjectSlug ?? "geography");
  const [activeDay, setActiveDay] = useState(initialDay ?? 1);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setContentStates(readContentStates());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeSubject = contentSubjects.find((subject) => subject.slug === activeSubjectSlug) ?? contentSubjects[0];
  const activeSession =
    activeSubject.sessions.find((session) => session.day === activeDay) ?? activeSubject.sessions[0];
  const activeKey = contentKey(activeSubject.slug, activeSession.day);
  const activeState = getContentState(contentStates, activeSubject.slug, activeSession.day);
  const activeBatchCode = buildBatchCode(activeSubject, activeSession);
  const readyScore =
    [activeState.videoStatus, activeState.notesStatus, activeState.transcriptStatus].filter((status) => status === "Ready")
      .length * 33 + (isContentReady(activeState) ? 1 : 0);

  const summaries = useMemo(
    () =>
      contentSubjects.map((subject) => {
        const readySessions = subject.sessions.filter((session) =>
          isContentReady(getContentState(contentStates, subject.slug, session.day))
        );
        const draftedSessions = subject.sessions.filter((session) => {
          const state = getContentState(contentStates, subject.slug, session.day);
          return (
            state.videoStatus !== "Planned" ||
            state.notesStatus !== "Planned" ||
            state.transcriptStatus !== "Planned" ||
            Boolean(state.contentNote?.trim())
          );
        });

        return {
          subject,
          readyCount: readySessions.length,
          draftedCount: draftedSessions.length,
          total: subject.sessions.length,
          completionPercent: Math.round((readySessions.length / subject.sessions.length) * 100),
        };
      }),
    [contentStates]
  );

  const totals = useMemo(() => {
    const totalClasses = contentSubjects.reduce((sum, subject) => sum + subject.sessions.length, 0);
    const readyClasses = summaries.reduce((sum, item) => sum + item.readyCount, 0);
    const draftedClasses = summaries.reduce((sum, item) => sum + item.draftedCount, 0);

    return {
      totalClasses,
      readyClasses,
      draftedClasses,
      pendingClasses: totalClasses - readyClasses,
      completionPercent: totalClasses ? Math.round((readyClasses / totalClasses) * 100) : 0,
    };
  }, [summaries]);

  const saveContentState = (patch: Partial<ContentState>) => {
    const nextState = {
      ...activeState,
      ...patch,
      updatedAt: new Date().toISOString(),
    } satisfies ContentState;
    const next = {
      ...contentStates,
      [activeKey]: nextState,
    };
    setContentStates(next);
    writeContentStates(next);
    setSaved(true);
  };

  const updateRoute = (slug: string, day: number) => {
    router.replace(`/upsc/content-command?subject=${slug}&day=${day}`, { scroll: false });
  };

  const selectSubject = (slug: string) => {
    const subject = contentSubjects.find((item) => item.slug === slug) ?? contentSubjects[0];
    const nextDay = subject.sessions[0]?.day ?? 1;
    setActiveSubjectSlug(subject.slug);
    setActiveDay(nextDay);
    updateRoute(subject.slug, nextDay);
    setSaved(false);
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), activeSubject.sessions.length);
    setActiveDay(boundedDay);
    updateRoute(activeSubject.slug, boundedDay);
    setSaved(false);
  };

  const markReady = () => {
    saveContentState({
      videoStatus: "Ready",
      notesStatus: "Ready",
      transcriptStatus: "Ready",
    });
  };

  const markActiveSubjectReady = () => {
    const readyStates = activeSubject.sessions.reduce<Record<string, ContentState>>((acc, session) => {
      const key = contentKey(activeSubject.slug, session.day);
      const existing = getContentState(contentStates, activeSubject.slug, session.day);
      const existingNote = existing.contentNote?.trim() ?? "";
      acc[key] = {
        ...existing,
        videoStatus: "Ready",
        notesStatus: "Ready",
        transcriptStatus: "Ready",
        sourceType: existing.sourceType === "Demo" ? "Local" : existing.sourceType ?? "Local",
        contentNote:
          existingNote && !existingNote.startsWith("Planned placeholder")
            ? existingNote
            : `${activeSubject.title} ${activeSubject.window} class pack is locally ready for Watch, Talk, and fresh MCQ handoff.`,
        updatedAt: new Date().toISOString(),
      };
      return acc;
    }, {});
    const next = {
      ...contentStates,
      ...readyStates,
    };
    setContentStates(next);
    writeContentStates(next);
    setSaved(true);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading UPSC content command...
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
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Content Command</Badge>
              <span className="text-sm font-bold text-[#776f64]">Local rehearsal pack status</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">Class content control room</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              Prepare every Watch room before testing.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">
              This local command center tracks whether each class day has a staged video state, notes, transcript or recap,
              source type, and a content note. It connects directly to Watch, Talk, and MCQ rooms for the selected day.
            </p>

            <div
              data-testid="content-rehearsal-boundary"
              className="mt-5 rounded-lg border border-[#ef9f27]/45 bg-[#fff4df] p-4 text-sm font-bold leading-6 text-[#6f4a12]"
            >
              Local rehearsal state only. Staged locally never means founder-approved live lecture media or student-release approval.
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${totals.completionPercent}%` }} />
            </div>
            <p className="mt-3 text-sm font-black text-[#085041]">
              {totals.readyClasses} of {totals.totalClasses} class days staged locally
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Class days", value: totals.totalClasses, icon: Layers3 },
              { label: "Staged", value: totals.readyClasses, icon: CheckCircle2 },
              { label: "Drafted", value: totals.draftedClasses, icon: FileText },
              { label: "Pending", value: totals.pendingClasses, icon: Gauge },
              { label: "Active score", value: `${readyScore}%`, icon: Video },
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
          data-testid="content-subject-pack-command"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Local rehearsal pack</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">
                {activeSubject.title}: {summaries.find((item) => item.subject.slug === activeSubject.slug)?.readyCount ?? 0}/{activeSubject.sessions.length} classes staged locally
              </h2>
              <p className="mt-2 break-words text-sm font-bold leading-6 text-[#657066]">
                Stage the selected subject locally when every class has a rehearsal lesson, notes, and transcript or recap handoff for the student loop.
              </p>
            </div>
            <button
              type="button"
              data-testid="content-mark-subject-ready"
              onClick={markActiveSubjectReady}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              <CheckCircle2 className="h-4 w-4" /> Stage {activeSubject.title} rehearsal pack
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              ["Watch feed", "Every selected day exposes content status inside Watch."],
              ["Talk handoff", "Each class keeps a recap packet that can seed the AI teacher discussion."],
              ["MCQ handoff", "Fresh MCQ readiness sees the same day, batch code, and test command."],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-sm font-black text-[#13251d]">{title}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#657066]">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Content map</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Select subject and class day</h2>
              </div>
              <Search className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {summaries.map((item) => {
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
                      {item.readyCount}/{item.total} staged
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {activeSubject.sessions.map((session) => {
                const key = contentKey(activeSubject.slug, session.day);
                const state = getContentState(contentStates, activeSubject.slug, session.day);
                const sessionReady = isContentReady(state);
                const isActive = activeSession.day === session.day;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectDay(session.day)}
                    className={cn(
                      "min-h-24 min-w-0 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : sessionReady
                          ? "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041] hover:border-[#1d9e75]"
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block break-words text-xs font-black uppercase tracking-[0.16em]">
                      {buildBatchCode(activeSubject, session)}
                    </span>
                    <span className="mt-2 block break-words text-sm font-bold leading-5">{session.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">
                      {sessionReady ? "Locally staged" : state.videoStatus}
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
                  <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Local rehearsal state</h2>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md",
                    isContentReady(activeState) ? "border-[#1d9e75]/40 text-[#085041]" : "border-[#ef9f27]/50 text-[#6f4a12]"
                  )}
                >
                  {isContentReady(activeState) ? "STAGED LOCAL" : "IN PROGRESS"}
                </Badge>
              </div>

              <p className="text-lg font-black leading-7 text-[#13251d]">{activeSession.title}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#657066]">{activeSession.anchor}</p>

              {activeState.lessonTitle?.trim() && (
                <div data-testid="content-pack-preview" className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Staged class pack</p>
                      <h3 className="mt-1 break-words text-xl font-black tracking-tight text-[#085041]">{activeState.lessonTitle}</h3>
                      {activeState.lessonPromise ? (
                        <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{activeState.lessonPromise}</p>
                      ) : null}
                    </div>
                    <span className="rounded-md bg-white/75 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#085041]">
                      {sourceTypeLabel(activeState.sourceType)}
                    </span>
                  </div>
                  {activeState.notesPreview?.length ? (
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {activeState.notesPreview.map((line) => (
                        <p key={line} className="rounded-md bg-white/75 p-3 text-xs font-bold leading-5 text-[#34453b]">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {activeState.transcriptSummary ? (
                    <p className="mt-4 rounded-md border border-[#b9dacf] bg-white/70 p-3 text-xs font-semibold leading-5 text-[#49675e]">
                      {activeState.transcriptSummary}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="mt-5 grid gap-4">
                {[
                  ["Video", "videoStatus"],
                  ["Notes", "notesStatus"],
                  ["Transcript", "transcriptStatus"],
                ].map(([label, key]) => (
                  <div key={key} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{label}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {statuses.map((status) => {
                        const stateValue = activeState[key as keyof Pick<ContentState, "videoStatus" | "notesStatus" | "transcriptStatus">];
                        const isActive = stateValue === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => saveContentState({ [key]: status } as Partial<ContentState>)}
                            className={cn(
                              "min-h-10 rounded-md border px-3 text-xs font-black transition",
                              isActive
                                ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                                : "border-[#dcd5c7] bg-white text-[#34453b] hover:border-[#1d9e75]"
                            )}
                          >
                            {status === "Ready" ? "Ready locally" : status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Source type</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {sourceTypes.map((source) => {
                    const isActive = activeState.sourceType === source;
                    return (
                      <button
                        key={source}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => saveContentState({ sourceType: source })}
                        className={cn(
                          "min-h-10 rounded-md border px-3 text-xs font-black transition",
                          isActive
                            ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                            : "border-[#dcd5c7] bg-white text-[#34453b] hover:border-[#1d9e75]"
                        )}
                      >
                        {sourceTypeLabel(source)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                value={activeState.contentNote ?? ""}
                onChange={(event) => {
                  saveContentState({ contentNote: event.target.value });
                  setSaved(false);
                }}
                placeholder="Write content note, source link, lecture instruction, or recording status here."
                className="mt-5 min-h-28 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              />

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={markReady}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                >
                  <CheckCircle2 className="h-4 w-4" /> Stage content locally
                </button>
                <button
                  type="button"
                  onClick={() => saveContentState({ contentNote: activeState.contentNote ?? "" })}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  <Save className="h-4 w-4" /> Save note
                </button>
              </div>

              {saved && (
                <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <p className="text-sm font-bold leading-6 text-[#085041]">Content state saved locally for {activeKey}.</p>
                </div>
              )}
            </div>

            <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Student flow links</p>
                  <p className="text-xs font-semibold text-[#746f66]">Open the exact room for this class day</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Link
                  data-testid="content-watch-route"
                  href={`/upsc/${activeSubject.slug}/watch?day=${activeSession.day}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                >
                  <PlayCircle className="h-4 w-4" /> Watch
                </Link>
                <Link
                  href={`/upsc/${activeSubject.slug}/talk?day=${activeSession.day}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  <BrainCircuit className="h-4 w-4" /> Talk
                </Link>
                <Link
                  href={`/upsc/${activeSubject.slug}/mcq-readiness?day=${activeSession.day}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  <ClipboardCheck className="h-4 w-4" /> MCQ
                </Link>
              </div>

              <Link
                href={`/upsc/${activeSubject.slug}`}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-[#f7f4ee] px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                Open subject command <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Content rule</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Watch is the first gate in the LMS loop.</h2>
            </div>
            <BookOpen className="h-6 w-6 text-[#085041]" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Video", "Local simulator, recorded, live, or external class slot must be identified before Talk opens."],
              ["Notes", "Concept objective, anchor, recap, and class notes stay tied to the same day and batch code."],
              ["Transcript", "A compressed recap or transcript makes the 20-minute lecture recoverable in 6-8 minutes."],
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
