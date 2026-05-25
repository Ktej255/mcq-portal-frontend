"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LineChart,
  MapPinned,
  PlayCircle,
  RefreshCcw,
  Save,
  Sparkles,
  TimerReset,
  UploadCloud,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyLoopActions } from "@/components/upsc/GeographyLoopActions";
import {
  GeographyStudentHandoffStrip,
  type GeographyStudentHandoffStep,
} from "@/components/upsc/GeographyStudentHandoffStrip";
import { geographySessions, GeographySession } from "@/lib/upsc/plan";
import {
  buildGeographyWatchScenes,
  getCompressedGeographyRecap,
  getGeographyGsCompatibility,
  getGeographySubtopics,
  labSlugForGeographySession,
} from "@/lib/upsc/geographyLearning";
import {
  contentKey,
  defaultContentState,
  isContentReady,
  readContentState,
  sourceTypeLabel,
  type ContentState,
} from "@/lib/upsc/contentCommand";
import { GeographyWatchState, useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

const watchStates: Array<{
  label: GeographyWatchState;
  detail: string;
}> = [
  { label: "Queued", detail: "Class is planned for this Geography day." },
  { label: "In class", detail: "Session is active and notes are being built." },
  { label: "Watched", detail: "Class is complete and ready for Talk/Test." },
];

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function parseDurationMinutes(duration: string) {
  const match = duration.match(/\d+/);
  return match ? Number(match[0]) : 75;
}

function stateTone(state: GeographyWatchState) {
  if (state === "Watched") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (state === "In class") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#f7f4ee] text-[#5f665f]";
}

export function GeographyWatchRoom({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay, setActiveDay] = useState(resolveSession(initialDay).day);
  const [watchState, setWatchState] = useState<GeographyWatchState>("Queued");
  const [watchMinutes, setWatchMinutes] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [completedSceneIds, setCompletedSceneIds] = useState<string[]>([]);
  const [watchNote, setWatchNote] = useState("");
  const [handoffDraft, setHandoffDraft] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState<"Idle" | "Armed" | "Opening">("Idle");
  const [hydratedDay, setHydratedDay] = useState<number | null>(null);
  const [contentState, setContentState] = useState<ContentState>(defaultContentState);
  const handoffTimersRef = useRef<number[]>([]);

  const activeSession = resolveSession(activeDay);
  const durationMinutes = useMemo(() => parseDurationMinutes(activeSession.duration), [activeSession.duration]);
  const weekSessions = useMemo(
    () => geographySessions.filter((session) => session.week === activeSession.week),
    [activeSession.week]
  );
  const labSlug = labSlugForGeographySession(activeSession.lab);
  const subtopics = useMemo(() => getGeographySubtopics(activeSession), [activeSession]);
  const gsCompatibility = useMemo(() => getGeographyGsCompatibility(activeSession), [activeSession]);
  const compressedRecap = useMemo(() => getCompressedGeographyRecap(activeSession), [activeSession]);
  const watchScenes = useMemo(() => buildGeographyWatchScenes(activeSession), [activeSession]);
  const activeScene = watchScenes[Math.min(activeSceneIndex, watchScenes.length - 1)];
  const sceneProgress = watchScenes.length > 0 ? Math.round((completedSceneIds.length / watchScenes.length) * 100) : 0;
  const demoMinutes = Math.max(6, Math.min(8, Math.round(durationMinutes / 10)));
  const watchProgress = watchState === "Watched" ? 100 : Math.round((watchMinutes / durationMinutes) * 100);
  const isWatchComplete = watchState === "Watched" && completedSceneIds.length >= watchScenes.length;
  const contentReady = isContentReady(contentState);
  const contentReadyCount = [contentState.videoStatus, contentState.notesStatus, contentState.transcriptStatus].filter(
    (status) => status === "Ready"
  ).length;
  const contentAssetStatus = contentReady ? "Institutional content ready" : "Local lesson simulator active";
  const studentHandoffSteps: GeographyStudentHandoffStep[] = [
    {
      label: "Watch class",
      detail: `${completedSceneIds.length}/${watchScenes.length} scenes complete`,
      status: isWatchComplete ? "done" : "current",
    },
    {
      label: "Save Talk handoff",
      detail: handoffDraft.trim() ? "Concept, mechanism, map/example, and trap ready" : "Load or write the recap packet",
      status: handoffDraft.trim() ? "done" : "current",
    },
    {
      label: "Talk with AI teacher",
      detail: isWatchComplete ? "Unlocked after class proof" : "Locked until Watch proof is saved",
      status: isWatchComplete ? "next" : "locked",
    },
    {
      label: "Visual Lab proof",
      detail: "Opens after Talk verdict",
      status: "locked",
    },
  ];

  const classBlocks = useMemo(
    () => [
      { label: "Concept objective", body: activeSession.watch, icon: PlayCircle },
      { label: "Map anchor", body: activeSession.anchor, icon: MapPinned },
      { label: "Talk bridge", body: activeSession.talk, icon: BrainCircuit },
      { label: "Practice bridge", body: activeSession.test, icon: ClipboardCheck },
      { label: "GS compatibility", body: gsCompatibility, icon: Sparkles },
    ],
    [activeSession, gsCompatibility]
  );
  const handoffSeed = useMemo(
    () =>
      [
        `Concept: ${activeSession.title} should be explained through ${activeSession.anchor}.`,
        `Mechanism: ${compressedRecap[1] ?? activeSession.watch}`,
        `Map/example: ${compressedRecap[2] ?? activeSession.talk}`,
        `UPSC trap: ${activeSession.test}`,
      ].join("\n"),
    [activeSession, compressedRecap]
  );

  useEffect(() => {
    if (!isLoaded || hydratedDay === activeDay) return;

    const timer = window.setTimeout(() => {
      const saved = getDayProgress(activeDay);
      const nextState = saved?.watchState ?? (saved?.watched ? "Watched" : "Queued");
      setWatchState(nextState);
      setWatchMinutes(saved?.watchMinutes ?? (saved?.watched ? durationMinutes : 0));
      setActiveSceneIndex(Math.min(Math.max(saved?.watchSceneIndex ?? 0, 0), watchScenes.length - 1));
      setCompletedSceneIds(saved?.watchSceneCompletedIds ?? (saved?.watched ? watchScenes.map((scene) => scene.id) : []));
      setWatchNote(saved?.watchNote ?? "");
      setHandoffDraft(saved?.watchHandoffSummary ?? "");
      setSavedNote(false);
      setIsDemoPlaying(false);
      setHandoffStatus("Idle");
      setContentState(readContentState("geography", activeDay));
      setHydratedDay(activeDay);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeDay, durationMinutes, getDayProgress, hydratedDay, isLoaded, watchScenes]);

  const clearAutoHandoff = () => {
    handoffTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    handoffTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearAutoHandoff();
  }, []);

  const persistWatch = (patch: {
    watchState?: GeographyWatchState;
    watchMinutes?: number;
    watchNote?: string;
    watchSceneIndex?: number;
    watchSceneCompletedIds?: string[];
    watchHandoffSummary?: string;
    watchHandoffReady?: boolean;
    watched?: boolean;
  } = {}) => {
    const nextState = patch.watchState ?? watchState;
    saveDayProgress(activeSession.day, {
      watched: patch.watched ?? nextState === "Watched",
      watchState: nextState,
      watchMinutes: patch.watchMinutes ?? watchMinutes,
      watchNote: patch.watchNote ?? watchNote,
      watchSceneIndex: patch.watchSceneIndex ?? activeSceneIndex,
      watchSceneCompletedIds: patch.watchSceneCompletedIds ?? completedSceneIds,
      watchHandoffSummary: patch.watchHandoffSummary ?? handoffDraft,
      watchHandoffReady: patch.watchHandoffReady ?? Boolean((patch.watchHandoffSummary ?? handoffDraft).trim()),
    });
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), geographySessions.length);
    setActiveDay(boundedDay);
    setWatchState("Queued");
    setWatchMinutes(0);
    setActiveSceneIndex(0);
    setCompletedSceneIds([]);
    setWatchNote("");
    setHandoffDraft("");
    setSavedNote(false);
    setIsDemoPlaying(false);
    setHandoffStatus("Idle");
    clearAutoHandoff();
    setHydratedDay(null);
    router.replace(`/upsc/geography/watch?day=${boundedDay}`, { scroll: false });
  };

  const setStateAndPersist = (nextState: GeographyWatchState) => {
    const nextMinutes =
      nextState === "Watched"
        ? durationMinutes
        : nextState === "In class"
          ? Math.max(watchMinutes, Math.min(30, durationMinutes))
          : 0;
    const nextCompletedSceneIds = nextState === "Watched" ? watchScenes.map((scene) => scene.id) : completedSceneIds;

    setWatchState(nextState);
    setWatchMinutes(nextMinutes);
    setCompletedSceneIds(nextCompletedSceneIds);
    setSavedNote(false);
    persistWatch({
      watchState: nextState,
      watchMinutes: nextMinutes,
      watchSceneIndex: activeSceneIndex,
      watchSceneCompletedIds: nextCompletedSceneIds,
      watched: nextState === "Watched",
    });
  };

  const updateMinutes = (minutes: number) => {
    const boundedMinutes = Math.min(Math.max(minutes, 0), durationMinutes);
    const nextState: GeographyWatchState =
      boundedMinutes >= durationMinutes ? "Watched" : boundedMinutes > 0 ? "In class" : "Queued";
    const nextCompletedSceneIds =
      nextState === "Watched" ? watchScenes.map((scene) => scene.id) : completedSceneIds;

    setWatchMinutes(boundedMinutes);
    setWatchState(nextState);
    setCompletedSceneIds(nextCompletedSceneIds);
    setSavedNote(false);
    persistWatch({
      watchState: nextState,
      watchMinutes: boundedMinutes,
      watchSceneCompletedIds: nextCompletedSceneIds,
      watched: nextState === "Watched",
    });
  };

  const saveClassNote = () => {
    persistWatch({ watchNote });
    setSavedNote(true);
  };

  const selectScene = (index: number) => {
    const boundedIndex = Math.min(Math.max(index, 0), watchScenes.length - 1);
    setActiveSceneIndex(boundedIndex);
    setWatchState((current) => (current === "Queued" ? "In class" : current));
    persistWatch({
      watchState: watchState === "Queued" ? "In class" : watchState,
      watchSceneIndex: boundedIndex,
      watched: watchState === "Watched",
    });
  };

  const completeActiveScene = () => {
    if (!activeScene) return;
    const nextCompletedSceneIds = Array.from(new Set([...completedSceneIds, activeScene.id]));
    const nextIndex = Math.min(activeSceneIndex + 1, watchScenes.length - 1);
    const allScenesComplete = nextCompletedSceneIds.length >= watchScenes.length;
    const nextMinutes = allScenesComplete
      ? durationMinutes
      : Math.max(
          watchMinutes,
          Math.round((nextCompletedSceneIds.length / watchScenes.length) * durationMinutes)
        );
    const nextState: GeographyWatchState = allScenesComplete ? "Watched" : "In class";
    const nextHandoffSummary = allScenesComplete ? handoffDraft.trim() || handoffSeed : handoffDraft;

    setCompletedSceneIds(nextCompletedSceneIds);
    setActiveSceneIndex(nextIndex);
    setWatchMinutes(nextMinutes);
    setWatchState(nextState);
    setHandoffDraft(nextHandoffSummary);
    setSavedNote(true);
    persistWatch({
      watchState: nextState,
      watchMinutes: nextMinutes,
      watchSceneIndex: nextIndex,
      watchSceneCompletedIds: nextCompletedSceneIds,
      watchHandoffSummary: nextHandoffSummary,
      watchHandoffReady: allScenesComplete || Boolean(nextHandoffSummary.trim()),
      watched: allScenesComplete,
    });
  };

  const playDemoLesson = () => {
    clearAutoHandoff();
    setIsDemoPlaying(true);
    setHandoffStatus("Armed");
    const nextMinutes = Math.max(watchMinutes, Math.min(demoMinutes, durationMinutes));
    setWatchMinutes(nextMinutes);
    setWatchState("In class");
    persistWatch({
      watchState: "In class",
      watchMinutes: nextMinutes,
      watched: false,
    });

    const completeTimer = window.setTimeout(() => {
      setWatchState("Watched");
      setWatchMinutes(durationMinutes);
      setSavedNote(true);
      setHandoffStatus("Opening");
      const nextHandoffSummary = handoffDraft.trim() || handoffSeed;
      saveDayProgress(activeSession.day, {
        watched: true,
        watchState: "Watched",
        watchMinutes: durationMinutes,
        watchSceneIndex: watchScenes.length - 1,
        watchSceneCompletedIds: watchScenes.map((scene) => scene.id),
        watchNote,
        watchHandoffSummary: nextHandoffSummary,
        watchHandoffReady: true,
      });

      const routeTimer = window.setTimeout(() => {
        router.push(`/upsc/geography/talk?day=${activeSession.day}`);
      }, 850);
      handoffTimersRef.current.push(routeTimer);
    }, 2200);

    handoffTimersRef.current.push(completeTimer);
  };

  const markWatched = () => {
    clearAutoHandoff();
    const nextHandoffSummary = handoffDraft.trim() || handoffSeed;
    setWatchState("Watched");
    setWatchMinutes(durationMinutes);
    setActiveSceneIndex(watchScenes.length - 1);
    setCompletedSceneIds(watchScenes.map((scene) => scene.id));
    setHandoffDraft(nextHandoffSummary);
    setHandoffStatus("Idle");
    persistWatch({
      watchState: "Watched",
      watchMinutes: durationMinutes,
      watchSceneIndex: watchScenes.length - 1,
      watchSceneCompletedIds: watchScenes.map((scene) => scene.id),
      watchHandoffSummary: nextHandoffSummary,
      watchHandoffReady: true,
      watched: true,
    });
    setSavedNote(true);
  };

  const completeAndDiscuss = () => {
    clearAutoHandoff();
    markWatched();
    router.push(`/upsc/geography/talk?day=${activeSession.day}`);
  };

  const loadHandoffSeed = () => {
    setHandoffDraft(handoffSeed);
    setSavedNote(false);
  };

  const saveHandoffPacket = () => {
    const nextHandoffSummary = handoffDraft.trim() || handoffSeed;
    setHandoffDraft(nextHandoffSummary);
    persistWatch({
      watchHandoffSummary: nextHandoffSummary,
      watchHandoffReady: true,
    });
    setSavedNote(true);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading Geography class room...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> Geography command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Watch</Badge>
              <span className="text-sm font-bold text-[#776f64]">Day {activeSession.day} class</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">{activeSession.chapter}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Duration", activeSession.duration],
                ["Class state", watchState],
                ["Visual lab", activeSession.lab],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div
              data-testid="watch-content-asset-gate"
              className={cn(
                "mt-6 rounded-lg border p-4",
                contentReady ? "border-[#1d9e75]/45 bg-[#e7f5ee]" : "border-[#ef9f27]/55 bg-[#fff4df]"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Content asset gate</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">{contentAssetStatus}</h2>
                  <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">
                    Video, notes, and transcript readiness are read from Content Command for {contentKey("geography", activeSession.day)}.
                  </p>
                </div>
                <Link
                  href={`/upsc/content-command?subject=geography&day=${activeSession.day}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  <UploadCloud className="h-4 w-4" /> Content Command
                </Link>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  ["Video", contentState.videoStatus],
                  ["Notes", contentState.notesStatus],
                  ["Transcript", contentState.transcriptStatus],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-white/75 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                    <p className="mt-1 text-sm font-black text-[#13251d]">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#6f756d]">
                {contentReadyCount}/3 assets ready | Source: {sourceTypeLabel(contentState.sourceType)}
              </p>
              {contentState.lessonTitle?.trim() && (
                <div data-testid="watch-content-pack-preview" className="mt-3 rounded-md bg-white/75 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{contentState.lessonTitle}</p>
                  {contentState.lessonPromise ? (
                    <p className="mt-2 text-xs font-bold leading-5 text-[#49675e]">{contentState.lessonPromise}</p>
                  ) : null}
                  {contentState.notesPreview?.length ? (
                    <div className="mt-3 grid gap-2">
                      {contentState.notesPreview.slice(0, 5).map((line) => (
                        <p key={line} className="rounded-md bg-[#f7f4ee] px-3 py-2 text-xs font-semibold leading-5 text-[#34453b]">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
              {contentState.contentNote?.trim() && (
                <p className="mt-3 rounded-md bg-white/75 p-3 text-xs font-bold leading-5 text-[#49675e]">
                  {contentState.contentNote}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => selectDay(activeSession.day - 1)}
                disabled={activeSession.day === 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous day
              </button>
              <button
                type="button"
                onClick={() => selectDay(activeSession.day + 1)}
                disabled={activeSession.day === geographySessions.length}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next day <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div data-testid="watch-demo-player" className="relative min-h-80 overflow-hidden rounded-lg bg-[#13251d] p-5 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(29,158,117,0.38),transparent_28%),linear-gradient(135deg,rgba(8,80,65,0.94),rgba(19,37,29,0.98))]" />
              <div className="relative flex h-full min-h-72 flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em]">
                    <Video className="h-4 w-4" /> Class slot
                  </div>
                  <span className="rounded-md bg-[#ef9f27] px-3 py-2 text-xs font-black text-[#13251d]">
                    GEO-D{String(activeSession.day).padStart(2, "0")}
                  </span>
                </div>

                <div>
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                    <PlayCircle className="h-11 w-11 text-[#dff7ee]" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9ee4cf]">Teacher-led session</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{activeSession.title}</h2>
                  <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#dce8e2]">
                    {activeSession.watch}
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9ee4cf]">
                        {handoffStatus === "Opening"
                          ? "Opening Talk Room"
                          : isDemoPlaying
                            ? "Class simulator running"
                            : contentAssetStatus}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#dce8e2]">
                        Compressed {demoMinutes}-minute recap for this {durationMinutes}-minute class, built for quick revision before discussion.
                      </p>
                      {handoffStatus !== "Idle" && (
                        <div
                          data-testid="watch-handoff-status"
                          className="mt-3 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#dff7ee]"
                        >
                          {handoffStatus === "Opening" ? "Opening AI teacher discussion" : "Auto discussion handoff armed"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <button
                        type="button"
                        data-testid="watch-demo-play"
                        onClick={playDemoLesson}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-black text-[#13251d] transition hover:bg-[#dff7ee]"
                      >
                        <PlayCircle className="h-4 w-4" /> Start class
                      </button>
                      <button
                        type="button"
                        data-testid="watch-complete-discuss"
                        onClick={completeAndDiscuss}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-3 text-sm font-black text-white transition hover:bg-[#087a59]"
                      >
                        <BrainCircuit className="h-4 w-4" /> Complete and discuss
                      </button>
                    </div>
                  </div>

                  <div data-testid="watch-scene-engine" className="mt-4 rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9ee4cf]">
                          Scene playback
                        </p>
                        <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                          {activeSceneIndex + 1}. {activeScene?.title}
                        </h3>
                      </div>
                      <span className="rounded-md bg-white/10 px-3 py-2 text-xs font-black text-[#dff7ee] ring-1 ring-white/15">
                        {completedSceneIds.length}/{watchScenes.length} complete
                      </span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[1fr_0.85fr]">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9ee4cf]">
                          {activeScene?.objective}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#dce8e2]">
                          {activeScene?.narration}
                        </p>
                      </div>
                      <div className="rounded-md bg-[#13251d]/55 p-3 ring-1 ring-white/10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ef9f27]">
                          Checkpoint
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#f5ead8]">
                          {activeScene?.checkpoint}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-[#ef9f27]" style={{ width: `${sceneProgress}%` }} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => selectScene(activeSceneIndex - 1)}
                        disabled={activeSceneIndex === 0}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" /> Scene back
                      </button>
                      <button
                        type="button"
                        data-testid="watch-scene-complete"
                        onClick={completeActiveScene}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#ef9f27] px-3 text-sm font-black text-[#13251d] transition hover:bg-[#f3b85c]"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Complete scene
                      </button>
                      <button
                        type="button"
                        onClick={() => selectScene(activeSceneIndex + 1)}
                        disabled={activeSceneIndex === watchScenes.length - 1}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Scene next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-[#dff7ee]">
                    <span>{watchMinutes} of {durationMinutes} min</span>
                    <span>{watchProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${watchProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <GeographyStudentHandoffStrip
          testId="watch"
          activeDay={activeSession.day}
          title="You are in Watch. Build proof before discussion."
          detail="Finish the class scenes, save the Talk handoff packet, then move into the AI teacher discussion with the recap already loaded."
          previous={{
            label: "Geography command room",
            detail: "Use the command room to change the day or inspect the full 30-day sequence.",
            href: `/upsc/geography?day=${activeSession.day}`,
          }}
          next={{
            label: "Talk with AI teacher",
            detail: isWatchComplete
              ? "Talk opens with the saved handoff packet so the student can explain instead of starting cold."
              : `Complete ${watchScenes.length - completedSceneIds.length} more scene${watchScenes.length - completedSceneIds.length === 1 ? "" : "s"} and save the handoff before Talk opens.`,
            href: `/upsc/geography/talk?day=${activeSession.day}`,
            locked: !isWatchComplete,
          }}
          steps={studentHandoffSteps}
        />

        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Class board</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Build the topic before testing</h2>
              </div>
              <TimerReset className="h-6 w-6 text-[#085041]" />
            </div>

            <div data-testid="watch-scene-list" className="mb-5 grid gap-2 md:grid-cols-5">
              {watchScenes.map((scene, index) => {
                const isActive = activeSceneIndex === index;
                const isComplete = completedSceneIds.includes(scene.id);
                return (
                  <button
                    key={scene.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectScene(index)}
                    className={cn(
                      "min-h-24 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : isComplete
                          ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041] hover:border-[#1a3a2a]"
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.16em]">
                      Scene {index + 1}
                      {isComplete && <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <span className="mt-2 block text-sm font-black leading-5">{scene.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">{scene.durationMinutes} min</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {classBlocks.map((block) => (
                <div key={block.label} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                      <block.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-black text-[#085041]">{block.label}</p>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#51665d]">{block.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">GS compatibility</p>
                <p className="mt-3 text-sm font-bold leading-6 text-[#34453b]">{gsCompatibility}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {subtopics.map((topic) => (
                    <span key={topic} className="rounded-md border border-[#cfc6b6] bg-white px-2 py-1 text-xs font-black text-[#1a3a2a]">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Compressed recap</p>
                <div className="mt-3 grid gap-2">
                  {compressedRecap.map((line, index) => (
                    <div key={line} className="flex items-start gap-3 rounded-md bg-white/75 p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1d9e75] text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm font-bold leading-6 text-[#49675e]">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {watchStates.map((state) => {
                const isActive = watchState === state.label;
                return (
                  <button
                    key={state.label}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setStateAndPersist(state.label)}
                    className={cn(
                      "min-h-24 rounded-md border p-4 text-left transition",
                      isActive ? stateTone(state.label) : "border-[#dcd5c7] bg-[#f7f4ee] text-[#5f665f] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="flex items-center justify-between gap-3 text-sm font-black">
                      {state.label}
                      {isActive && <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <span className="mt-2 block text-xs font-semibold leading-5 opacity-80">{state.detail}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-[#085041]">Class minutes</p>
                <p className="text-sm font-black text-[#085041]">{watchMinutes}/{durationMinutes}</p>
              </div>
              <input
                type="range"
                min={0}
                max={durationMinutes}
                step={5}
                value={Math.min(watchMinutes, durationMinutes)}
                onChange={(event) => updateMinutes(Number(event.target.value))}
                className="w-full accent-[#1d9e75]"
                aria-label="Class minutes completed"
              />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Class note</p>
                  <p className="text-xs font-semibold text-[#746f66]">Saved locally for this Geography day</p>
                </div>
              </div>

              <textarea
                value={watchNote}
                onChange={(event) => {
                  setWatchNote(event.target.value);
                  setSavedNote(false);
                }}
                placeholder="Capture teacher note, map clue, formula, example, or doubt."
                className="min-h-36 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveClassNote}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  <Save className="h-4 w-4" /> Save note
                </button>
                <button
                  type="button"
                  data-testid="watch-mark-watched"
                  onClick={markWatched}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark watched
                </button>
              </div>

              <div data-testid="watch-talk-handoff-packet" className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#f3fbf7] p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Talk handoff packet</p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">Lecture to AI teacher bridge</h3>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#49675e]">
                      Save this after the class so Talk Room opens with a ready concept, mechanism, map/example, and trap.
                    </p>
                  </div>
                  <span
                    data-testid="watch-handoff-ready-state"
                    className={cn(
                      "inline-flex min-h-9 items-center rounded-md px-3 text-xs font-black",
                      handoffDraft.trim() ? "bg-[#e7f5ee] text-[#085041] ring-1 ring-[#1d9e75]/30" : "bg-white text-[#746f66] ring-1 ring-[#dcd5c7]"
                    )}
                  >
                    {handoffDraft.trim() ? "Handoff ready" : "Draft empty"}
                  </span>
                </div>
                <div className="mb-3 grid gap-2">
                  {handoffSeed.split("\n").map((line) => (
                    <p key={line} className="rounded-md bg-white/80 p-3 text-xs font-bold leading-5 text-[#34453b]">
                      {line}
                    </p>
                  ))}
                </div>
                <textarea
                  data-testid="watch-handoff-draft"
                  value={handoffDraft}
                  onChange={(event) => {
                    setHandoffDraft(event.target.value);
                    setSavedNote(false);
                  }}
                  placeholder="Load or write the handoff that should prefill the Talk Room explanation."
                  className="min-h-32 w-full resize-y rounded-lg border border-[#cfc6b6] bg-white p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="watch-load-handoff"
                    onClick={loadHandoffSeed}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                  >
                    <Sparkles className="h-4 w-4" /> Load handoff
                  </button>
                  <button
                    type="button"
                    data-testid="watch-save-handoff"
                    onClick={saveHandoffPacket}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    <BrainCircuit className="h-4 w-4" /> Save for Talk
                  </button>
                </div>
              </div>

              {savedNote && (
                <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <p className="text-sm font-bold leading-6 text-[#085041]">
                    Class progress saved locally. Track will now include this day.
                  </p>
                </div>
              )}

              <div
                data-testid="watch-route-gate"
                className={cn(
                  "mt-4 rounded-lg border p-4",
                  isWatchComplete ? "border-[#1d9e75]/45 bg-[#e7f5ee]" : "border-[#ef9f27]/45 bg-[#fff4df]"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Route gate</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">
                      {isWatchComplete ? "AI teacher unlocked" : "Complete class scenes first"}
                    </h3>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">
                      {completedSceneIds.length}/{watchScenes.length} scenes complete. The Talk room should open only after the class proof is saved locally.
                    </p>
                  </div>
                  {isWatchComplete ? (
                    <Link
                      data-testid="watch-primary-route"
                      href={`/upsc/geography/talk?day=${activeSession.day}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                    >
                      Open AI teacher <BrainCircuit className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md bg-[#d6cec0] px-3 text-sm font-black text-[#7b7164]"
                    >
                      Locked
                    </button>
                  )}
                </div>
              </div>
            </div>

            <GeographyLoopActions activeDay={activeSession.day} labSlug={labSlug} current="watch" onSelectDay={selectDay} />
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Week {activeSession.week}</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Class playlist</h2>
            </div>
            <RefreshCcw className="h-6 w-6 text-[#085041]" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {weekSessions.map((session) => {
              const item = getDayProgress(session.day);
              const isActive = activeSession.day === session.day;
              return (
                <button
                  key={session.day}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectDay(session.day)}
                  className={cn(
                    "min-h-24 rounded-md border p-3 text-left transition",
                    isActive
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : item?.watched
                        ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041] hover:border-[#1a3a2a]"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                  )}
                >
                  <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em]">
                    Day {session.day}
                    {item?.watched && <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <span className="mt-2 block text-sm font-bold leading-5">{session.title}</span>
                  <span className="mt-2 block text-xs font-semibold opacity-75">{item?.watchState ?? "Queued"}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
