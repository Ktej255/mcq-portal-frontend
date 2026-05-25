"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPinned,
  PlayCircle,
  Save,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import {
  buildGeographyWatchScenes,
  getCompressedGeographyRecap,
  getGeographySubtopics,
  labSlugForGeographySession,
} from "@/lib/upsc/geographyLearning";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function parseDurationMinutes(duration: string) {
  const match = duration.match(/\d+/);
  return match ? Number(match[0]) : 75;
}

export function GeographyWatchRoom({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay, setActiveDay] = useState(resolveSession(initialDay).day);
  const [completedSceneIds, setCompletedSceneIds] = useState<string[]>([]);
  const [watchNote, setWatchNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [hydratedDay, setHydratedDay] = useState<number | null>(null);

  const activeSession = resolveSession(activeDay);
  const durationMinutes = parseDurationMinutes(activeSession.duration);
  const watchScenes = useMemo(() => buildGeographyWatchScenes(activeSession), [activeSession]);
  const recap = useMemo(() => getCompressedGeographyRecap(activeSession), [activeSession]);
  const subtopics = useMemo(() => getGeographySubtopics(activeSession), [activeSession]);
  const labSlug = labSlugForGeographySession(activeSession.lab);
  const progress = getDayProgress(activeSession.day);
  const completedCount = completedSceneIds.length;
  const isComplete = completedCount >= watchScenes.length || Boolean(progress?.watched);
  const progressPercent = Math.round((Math.min(completedCount, watchScenes.length) / watchScenes.length) * 100);

  const previousDay = activeDay > 1 ? activeDay - 1 : null;
  const nextDay = activeDay < geographySessions.length ? activeDay + 1 : null;
  const talkHref = `/upsc/geography/talk?day=${activeSession.day}`;

  useEffect(() => {
    if (!isLoaded || hydratedDay === activeDay) return;

    const savedProgress = getDayProgress(activeDay);
    setCompletedSceneIds(
      savedProgress?.watchSceneCompletedIds ??
        (savedProgress?.watched ? watchScenes.map((scene) => scene.id) : [])
    );
    setWatchNote(savedProgress?.watchNote ?? "");
    setSaved(false);
    setHydratedDay(activeDay);
  }, [activeDay, getDayProgress, hydratedDay, isLoaded, watchScenes]);

  const buildHandoff = () => {
    return [
      `Concept: ${activeSession.title}.`,
      `Mechanism: ${recap[1] ?? activeSession.watch}`,
      `Map/example: ${recap[2] ?? activeSession.anchor}`,
      `UPSC trap: ${activeSession.test}`,
    ].join("\n");
  };

  const persistWatch = (nextCompletedSceneIds = completedSceneIds, openTalk = false) => {
    const allDone = nextCompletedSceneIds.length >= watchScenes.length;
    saveDayProgress(activeSession.day, {
      watched: allDone,
      watchState: allDone ? "Watched" : nextCompletedSceneIds.length > 0 ? "In class" : "Queued",
      watchMinutes: allDone ? durationMinutes : Math.round((nextCompletedSceneIds.length / watchScenes.length) * durationMinutes),
      watchNote,
      watchSceneIndex: Math.max(0, nextCompletedSceneIds.length - 1),
      watchSceneCompletedIds: nextCompletedSceneIds,
      watchHandoffSummary: allDone ? buildHandoff() : progress?.watchHandoffSummary,
      watchHandoffReady: allDone,
      labMode: labSlug,
    });
    setSaved(true);
    if (openTalk && allDone) router.push(talkHref);
  };

  const toggleScene = (sceneId: string) => {
    const next = completedSceneIds.includes(sceneId)
      ? completedSceneIds.filter((id) => id !== sceneId)
      : [...completedSceneIds, sceneId];
    setCompletedSceneIds(next);
    persistWatch(next);
  };

  const completeAndDiscuss = () => {
    const allScenes = watchScenes.map((scene) => scene.id);
    setCompletedSceneIds(allScenes);
    persistWatch(allScenes, true);
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), geographySessions.length);
    setActiveDay(boundedDay);
    setCompletedSceneIds([]);
    setWatchNote("");
    setSaved(false);
    setHydratedDay(null);
    router.replace(`/upsc/geography/watch?day=${boundedDay}`, { scroll: false });
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Opening Watch room...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link href={`/upsc/geography?day=${activeSession.day}`} className="inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> Day funnel
            </Link>
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

          <div className="grid gap-5 lg:grid-cols-[1fr_0.86fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Watch</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span className="text-sm font-semibold text-[#746f66]">{activeSession.duration}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{activeSession.title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">{activeSession.anchor}</p>
            </div>

            <div className={cn("rounded-lg border p-4", isComplete ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#ef9f27]/55 bg-[#fff4df]")}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next room</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{isComplete ? "Discussion unlocked" : "Finish Watch first"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {isComplete
                  ? "The AI teacher is ready. The student now explains the class in their own words."
                  : "Complete the class checkpoints. The app will then move the student into discussion."}
              </p>
              {isComplete ? (
                <Link href={talkHref} className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  Open discussion <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  data-testid="watch-complete-and-discuss"
                  onClick={completeAndDiscuss}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  Complete Watch <BrainCircuit className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Class player</p>
                <h2 className="text-xl font-black tracking-tight">Watch the lesson</h2>
              </div>
              <span className="rounded-md bg-[#f7f4ee] px-3 py-2 text-xs font-black text-[#5d675f]">{progressPercent}%</span>
            </div>

            <div className="rounded-lg bg-[#13251d] p-5 text-white">
              <div className="flex min-h-64 flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-[#13251d]">
                    <Video className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em]">
                    Guided class
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{activeSession.title}</h3>
                  <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/72">{activeSession.watch}</p>
                </div>
                <button
                  type="button"
                  onClick={completeAndDiscuss}
                  className="inline-flex h-11 w-fit items-center justify-center rounded-md bg-[#1d9e75] px-4 text-sm font-black text-white transition hover:bg-[#087a59]"
                >
                  I watched this <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee6d7]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${isComplete ? 100 : progressPercent}%` }} />
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Class checkpoints</p>
                <h2 className="text-lg font-black tracking-tight">Tap what is clear</h2>
              </div>
            </div>
            <div className="space-y-2">
              {watchScenes.map((scene, index) => {
                const done = completedSceneIds.includes(scene.id) || isComplete;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    data-testid={`watch-scene-${index + 1}`}
                    onClick={() => toggleScene(scene.id)}
                    className={cn(
                      "grid w-full grid-cols-[34px_1fr] gap-3 rounded-md border p-3 text-left transition",
                      done ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#f7f4ee] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-md text-xs font-black", done ? "bg-[#1d9e75] text-white" : "bg-white text-[#1a3a2a]")}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-black text-[#13251d]">{scene.title}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#657066]">{scene.checkpoint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                <MapPinned className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Remember only this</p>
                <h2 className="text-lg font-black tracking-tight">Compressed recap</h2>
              </div>
            </div>
            <div className="space-y-2">
              {recap.slice(0, 3).map((line, index) => (
                <div key={line} className="flex gap-3 rounded-md bg-[#f7f4ee] p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-[#1a3a2a]">{index + 1}</span>
                  <p className="text-sm font-semibold leading-6 text-[#4f5e55]">{line}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {subtopics.slice(0, 5).map((topic) => (
                <span key={topic} className="rounded-md border border-[#cfc6b6] bg-white px-2 py-1 text-xs font-black text-[#1a3a2a]">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Optional note</p>
                <h2 className="text-lg font-black tracking-tight">One doubt or one map clue</h2>
              </div>
            </div>
            <textarea
              value={watchNote}
              onChange={(event) => {
                setWatchNote(event.target.value);
                setSaved(false);
              }}
              placeholder="Write one thing you want the AI teacher to ask you about."
              className="min-h-28 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => persistWatch()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                <Save className="h-4 w-4" /> Save
              </button>
              {saved && <span className="text-sm font-black text-[#1d9e75]">Saved</span>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
