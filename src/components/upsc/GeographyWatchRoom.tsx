"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  LockKeyhole,
  MapPinned,
  PlayCircle,
  Route,
  Save,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyDay1MapThinkingVisual } from "@/components/upsc/GeographyDay1MapThinkingVisual";
import { GeographyDay2UniverseVisual } from "@/components/upsc/GeographyDay2UniverseVisual";
import { GeographyDay3PlateVisual } from "@/components/upsc/GeographyDay3PlateVisual";
import { GeographyDay4GeomorphicVisual } from "@/components/upsc/GeographyDay4GeomorphicVisual";
import { GeographyDay5ClimatologyVisual } from "@/components/upsc/GeographyDay5ClimatologyVisual";
import { GeographyDay6OceanVisual } from "@/components/upsc/GeographyDay6OceanVisual";
import { GeographyDay7ConsolidationVisual } from "@/components/upsc/GeographyDay7ConsolidationVisual";
import { GeographyDay8IndiaReliefVisual } from "@/components/upsc/GeographyDay8IndiaReliefVisual";
import { GeographyDay9DrainageVisual } from "@/components/upsc/GeographyDay9DrainageVisual";
import { GeographyDay10MonsoonVisual } from "@/components/upsc/GeographyDay10MonsoonVisual";
import { GeographyDay11ClimateRegionsVisual } from "@/components/upsc/GeographyDay11ClimateRegionsVisual";
import { GeographyDay12SoilsVegetationVisual } from "@/components/upsc/GeographyDay12SoilsVegetationVisual";
import { GeographyDay13ResourcesAgricultureVisual } from "@/components/upsc/GeographyDay13ResourcesAgricultureVisual";
import { GeographyDay14IndiaMapDrillVisual } from "@/components/upsc/GeographyDay14IndiaMapDrillVisual";
import { GeographyDay15PopulationVisual } from "@/components/upsc/GeographyDay15PopulationVisual";
import { GeographyDay16SettlementsVisual } from "@/components/upsc/GeographyDay16SettlementsVisual";
import { GeographyDay17EconomicActivitiesVisual } from "@/components/upsc/GeographyDay17EconomicActivitiesVisual";
import { GeographyDay18TransportTradeVisual } from "@/components/upsc/GeographyDay18TransportTradeVisual";
import { GeographyDay19IndustryLocationVisual } from "@/components/upsc/GeographyDay19IndustryLocationVisual";
import { GeographyDay20RegionalDevelopmentVisual } from "@/components/upsc/GeographyDay20RegionalDevelopmentVisual";
import { GeographyDay21HumanGeographyConsolidationVisual } from "@/components/upsc/GeographyDay21HumanGeographyConsolidationVisual";
import { GeographyDay22AtlasMasteryVisual } from "@/components/upsc/GeographyDay22AtlasMasteryVisual";
import { GeographyDay23PyqPatternReadingVisual } from "@/components/upsc/GeographyDay23PyqPatternReadingVisual";
import { GeographyDay24DisasterGeographyBridgeVisual } from "@/components/upsc/GeographyDay24DisasterGeographyBridgeVisual";
import { GeographyDay25EnvironmentGeographyBridgeVisual } from "@/components/upsc/GeographyDay25EnvironmentGeographyBridgeVisual";
import { GeographyDay26MainsGeographyApplicationVisual } from "@/components/upsc/GeographyDay26MainsGeographyApplicationVisual";
import { GeographyDay27FullGeographyDrillVisual } from "@/components/upsc/GeographyDay27FullGeographyDrillVisual";
import {
  GeographyDay28WeakAreaRepairVisual,
  GeographyDay29FinalMockReviewVisual,
  GeographyDay30GeographyCommandDayVisual,
} from "@/components/upsc/GeographyRevisionCloseoutVisual";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import {
  buildGeographyWatchScenes,
  getCompressedGeographyRecap,
  getGeographySubtopics,
  labSlugForGeographySession,
} from "@/lib/upsc/geographyLearning";
import { geographyDay1MediaAttachment } from "@/lib/upsc/geographyDay1Media";
import {
  getGeographyContentModule,
  getGeographyModuleSection,
  getPrimaryGeographyContentModuleForDay,
  type GeographyContentModule,
  type GeographyContentModuleSection,
} from "@/lib/upsc/geographyContentModules";
import { hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function getWatchLevelCopy({
  learnerLevel,
  talkCleared,
  hasRepairDiagnosis,
  recallScore,
}: {
  learnerLevel: StudentLevel;
  talkCleared: boolean;
  hasRepairDiagnosis: boolean;
  recallScore?: number;
}) {
  if (talkCleared) {
    return {
      badge: "Recall cleared",
      copy: `Recall is already cleared${typeof recallScore === "number" ? ` at ${recallScore}%` : ""}. Move directly to fresh MCQ practice.`,
    };
  }

  if (learnerLevel === "advanced") {
    return hasRepairDiagnosis
      ? {
          badge: "Attempt-gap repair",
          copy: `You answered first${typeof recallScore === "number" ? ` and scored ${recallScore}%` : ""}. Repair only the attempt trap, then explain it back to 95%.`,
        }
      : {
          badge: "Recall first",
          copy: "Advanced learners start by explaining. The class opens only for the exact attempt-level gap.",
        };
  }

  if (learnerLevel === "intermediate") {
    return hasRepairDiagnosis
      ? {
          badge: "Self-study repair",
          copy: `Your recall is saved${typeof recallScore === "number" ? ` at ${recallScore}%` : ""}. Repair only the missing self-study proof, then return to discussion.`,
        }
      : {
          badge: "Recall first",
          copy: "Start by telling the AI teacher what you know. The lesson opens only for the missing concept.",
        };
  }

  return {
    badge: "Beginner lesson",
    copy: "Watch one 10-15 minute lesson. The portal then opens AI discussion, fresh MCQ practice, and the next topic.",
  };
}

function moduleTalkHref(day: number, module: GeographyContentModule, section: GeographyContentModuleSection) {
  return `/upsc/geography/talk?day=${day}&module=${module.id}&section=${section.id}`;
}

function moduleWatchHref(day: number, module: GeographyContentModule, section: GeographyContentModuleSection) {
  return `/upsc/geography/watch?day=${day}&module=${module.id}&section=${section.id}`;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function GeographyWatchRoom({
  initialDay,
  initialModuleId,
  initialSectionId,
}: {
  initialDay?: number;
  initialModuleId?: string;
  initialSectionId?: string;
}) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay] = useState(resolveSession(initialDay).day);
  const [completedSceneIds, setCompletedSceneIds] = useState<string[]>([]);
  const [watchNote, setWatchNote] = useState("");
  const [baselineKnowledge, setBaselineKnowledge] = useState("");
  const [saved, setSaved] = useState(false);
  const [hydratedDay, setHydratedDay] = useState<number | null>(null);
  const [learnerLevel, setLearnerLevel] = useState<StudentLevel>("beginner");

  const activeSession = resolveSession(activeDay);
  const watchScenes = buildGeographyWatchScenes(activeSession);
  const requestedModule = getGeographyContentModule(initialModuleId);
  const dayModule = getPrimaryGeographyContentModuleForDay(activeSession.day);
  const activeModule = requestedModule?.day === activeSession.day ? requestedModule : dayModule;
  const durationMinutes = watchScenes.reduce((total, scene) => total + scene.durationMinutes, 0);
  const recap = getCompressedGeographyRecap(activeSession);
  const subtopics = getGeographySubtopics(activeSession);
  const labSlug = labSlugForGeographySession(activeSession.lab);
  const dayOneMedia = activeSession.day === 1 ? geographyDay1MediaAttachment : null;
  const progress = getDayProgress(activeSession.day);
  const activeModuleProgress = activeModule ? progress?.moduleProgress?.[activeModule.id] : undefined;
  const activeModuleFirstSectionId = activeModule?.sections[0]?.id;
  const activeModuleUnlockedSectionId =
    activeModuleProgress?.nextUnlockedSectionId ?? activeModuleFirstSectionId;
  const requestedModuleSectionIndex = activeModule
    ? activeModule.sections.findIndex((section) => section.id === initialSectionId)
    : -1;
  const unlockedModuleSectionIndex = activeModule
    ? Math.max(
        0,
        activeModule.sections.findIndex((section) => section.id === activeModuleUnlockedSectionId)
      )
    : -1;
  const activeModuleSectionIndex = activeModule
    ? Math.min(
        requestedModuleSectionIndex >= 0 ? requestedModuleSectionIndex : unlockedModuleSectionIndex,
        unlockedModuleSectionIndex
      )
    : -1;
  const activeModuleSection =
    activeModule && activeModuleSectionIndex >= 0
      ? getGeographyModuleSection(activeModule, activeModule.sections[activeModuleSectionIndex]?.id)
      : null;
  const activeModuleReadSectionIds = activeModuleProgress?.readSectionIds ?? [];
  const activeModulePassedSectionIds = activeModuleProgress?.passedSectionIds ?? [];
  const activeModuleSectionRead = Boolean(
    activeModuleSection && activeModuleReadSectionIds.includes(activeModuleSection.id)
  );
  const activeModuleComplete = Boolean(
    activeModule && activeModulePassedSectionIds.length >= activeModule.sections.length
  );
  const recallScore = progress?.talkScore;
  const savedRecall = progress?.reflection?.trim() || progress?.baselineKnowledge?.trim() || baselineKnowledge.trim();
  const hasSavedRecall = Boolean(savedRecall) || typeof recallScore === "number";
  const isBeginner = learnerLevel === "beginner";
  const talkCleared = hasGeographyTalkClearance(progress);
  const hasRepairDiagnosis =
    !isBeginner &&
    typeof recallScore === "number" &&
    !talkCleared;
  const canOpenLesson = !talkCleared && (isBeginner || hasRepairDiagnosis);
  const completedCount = completedSceneIds.length;
  const isComplete = activeModuleComplete || completedCount >= watchScenes.length || Boolean(progress?.watched);
  const progressPercent = Math.round((Math.min(completedCount, watchScenes.length) / watchScenes.length) * 100);
  const moduleProgressPercent = activeModule
    ? Math.round(
        (Math.min(
          uniqueValues([...activeModuleReadSectionIds, ...activeModulePassedSectionIds]).length,
          activeModule.sections.length
        ) /
          activeModule.sections.length) *
          100
      )
    : progressPercent;
  const previousDay = activeSession.day > 1 ? resolveSession(activeSession.day - 1) : null;
  const nextDay = activeSession.day < geographySessions.length ? resolveSession(activeSession.day + 1) : null;

  const talkHref =
    activeModule && activeModuleSection
      ? moduleTalkHref(activeSession.day, activeModule, activeModuleSection)
      : `/upsc/geography/talk?day=${activeSession.day}`;
  const currentAction = talkCleared
    ? {
        label: "Open MCQ practice",
        detail: "Recall is cleared. Fresh MCQ is the only next step.",
        href: `/upsc/geography/mcq-readiness?day=${activeSession.day}`,
      }
    : isComplete
      ? {
          label: "Open discussion",
          detail: "Lesson proof is saved. Now explain it to the AI teacher until 95%.",
          href: talkHref,
        }
      : canOpenLesson
        ? {
            label: isBeginner ? "Finish lesson and discuss" : "Finish repair and discuss",
            detail: isBeginner
              ? "Watch one 10-15 minute lesson. The portal then opens discussion automatically."
              : "Repair only the missing concept. The portal then returns to discussion.",
            href: "#watch-player",
          }
        : {
            label: "Start recall first",
            detail: "Answer the AI teacher first. Lesson opens only for the exact gap.",
            href: talkHref,
          };
  const watchLevelCopy = getWatchLevelCopy({
    learnerLevel,
    talkCleared,
    hasRepairDiagnosis,
    recallScore,
  });

  useEffect(() => {
    if (!isLoaded || hydratedDay === activeDay) return;

    const timer = window.setTimeout(() => {
      const savedProgress = getDayProgress(activeDay);
      setLearnerLevel(readStudentProfile()?.level ?? "beginner");
      const savedScenes = buildGeographyWatchScenes(resolveSession(activeDay));
      setCompletedSceneIds(
        savedProgress?.watchSceneCompletedIds ??
          (savedProgress?.watched ? savedScenes.map((scene) => scene.id) : [])
      );
      setWatchNote(savedProgress?.watchNote ?? "");
      setBaselineKnowledge(savedProgress?.baselineKnowledge ?? "");
      setSaved(false);
      setHydratedDay(activeDay);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeDay, getDayProgress, hydratedDay, isLoaded]);

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
    const existing = getDayProgress(activeSession.day);
    saveDayProgress(activeSession.day, {
      watched: allDone,
      watchState: allDone ? "Watched" : nextCompletedSceneIds.length > 0 ? "In class" : "Queued",
      watchMinutes: allDone ? durationMinutes : Math.round((nextCompletedSceneIds.length / watchScenes.length) * durationMinutes),
      watchNote,
      baselineKnowledge,
      baselineSavedAt: existing?.baselineSavedAt ?? (baselineKnowledge.trim() ? new Date().toISOString() : undefined),
      watchSceneIndex: Math.max(0, nextCompletedSceneIds.length - 1),
      watchSceneCompletedIds: nextCompletedSceneIds,
      watchHandoffSummary: allDone ? buildHandoff() : progress?.watchHandoffSummary,
      watchHandoffReady: allDone,
      labMode: labSlug,
    });
    setSaved(true);
    if (openTalk && allDone) {
      window.setTimeout(() => router.push(talkHref), 0);
    }
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

  const saveModuleSectionAndDiscuss = () => {
    if (!activeModule || !activeModuleSection) return;
    const existingModuleProgress = progress?.moduleProgress?.[activeModule.id];
    const nextReadSectionIds = uniqueValues([
      ...(existingModuleProgress?.readSectionIds ?? []),
      activeModuleSection.id,
    ]);
    const nextModuleProgress = {
      ...(progress?.moduleProgress ?? {}),
      [activeModule.id]: {
        ...existingModuleProgress,
        moduleId: activeModule.id,
        activeSectionId: activeModuleSection.id,
        readSectionIds: nextReadSectionIds,
        passedSectionIds: existingModuleProgress?.passedSectionIds ?? [],
        nextUnlockedSectionId: existingModuleProgress?.nextUnlockedSectionId ?? activeModule.sections[0]?.id,
        updatedAt: new Date().toISOString(),
      },
    };

    saveDayProgress(activeSession.day, {
      moduleProgress: nextModuleProgress,
      watchState: activeModuleComplete ? "Watched" : "In class",
      watchMinutes: Math.max(
        progress?.watchMinutes ?? 0,
        activeModule.sections
          .filter((section) => nextReadSectionIds.includes(section.id))
          .reduce((sum, section) => sum + section.estimatedMinutes, 0)
      ),
      watchSceneIndex: activeModuleSectionIndex,
      labMode: labSlug,
    });
    window.setTimeout(() => router.push(moduleTalkHref(activeSession.day, activeModule, activeModuleSection)), 0);
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
      <div
        className={cn(
          "mx-auto flex max-w-6xl flex-col px-4 md:px-8",
          canOpenLesson ? "gap-3 py-4 md:py-4" : "gap-5 py-6 md:py-8"
        )}
      >
        <section
          data-testid="geography-watch-simple-repair"
          data-learner-level={learnerLevel}
          data-day={activeSession.day}
          data-duration-minutes={durationMinutes}
          data-scene-count={watchScenes.length}
          data-flow-state={talkCleared ? "mcq-ready" : canOpenLesson ? "lesson-open" : "recall-first"}
          data-current-action-label={currentAction.label}
          data-current-action-href={currentAction.href}
          data-talk-href={talkHref}
          data-visible-mode={canOpenLesson ? "lesson-first-player" : "route-gated"}
          className={cn(
            "rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm",
            canOpenLesson ? "p-2" : "p-5 md:p-7"
          )}
        >
          <div className={cn("flex flex-wrap items-center justify-between gap-2", canOpenLesson ? "mb-1" : "mb-5")}>
            <Link href={`/upsc/geography?day=${activeSession.day}`} className="inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div data-testid="watch-day-neighbor-strip" className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-black text-[#5d675f]">
              {previousDay ? (
                <Link
                  href={`/upsc/geography?day=${previousDay.day}`}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-[#dcd5c7] bg-white px-3 text-[#1a3a2a] transition hover:border-[#1d9e75]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Day {previousDay.day}
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center gap-1 rounded-md border border-[#eadfcb] bg-[#f7f4ee] px-3 text-[#9b8f7d]">
                  <ChevronLeft className="h-4 w-4" />
                  Start
                </span>
              )}
              <span className="inline-flex h-9 items-center rounded-md bg-[#1a3a2a] px-3 text-white">
                Day {activeSession.day}/{geographySessions.length}
              </span>
              <span className="inline-flex h-9 max-w-full items-center gap-1 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] px-3 text-[#746f66]">
                {nextDay ? `Next opens after MCQ: Day ${nextDay.day}` : "Final day closeout"}
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className={cn("grid lg:items-start", canOpenLesson ? "gap-2 lg:grid-cols-[1fr_0.86fr]" : "gap-5 lg:grid-cols-[1fr_0.86fr]")}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Watch</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span data-testid="watch-topic-duration" className="text-sm font-semibold text-[#746f66]">
                  {durationMinutes} min topic
                </span>
                <span
                  data-testid="geography-watch-level-badge"
                  className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#085041]"
                >
                  {watchLevelCopy.badge}
                </span>
              </div>
              <h1 className={cn("font-black tracking-tight", canOpenLesson ? "mt-1 text-lg md:text-xl" : "mt-3 text-3xl md:text-5xl")}>
                {activeSession.title}
              </h1>
              {!canOpenLesson && (
                <p
                  data-testid="geography-watch-level-copy"
                  className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]"
                >
                  {watchLevelCopy.copy}
                </p>
              )}
              {hasSavedRecall && (
                <div className="mt-4 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recall gap</p>
                  <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-[#425047]">
                    {savedRecall || activeSession.talk}
                  </p>
                </div>
              )}
            </div>

            {canOpenLesson ? (
              <div
                data-testid="watch-current-action"
                data-current-action-label={currentAction.label}
                data-current-action-href={currentAction.href}
                className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-2"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#085041]">
                    <Route className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Do this now</p>
                    <h2 className="mt-0.5 text-base font-black tracking-tight text-[#13251d]">{currentAction.label}</h2>
                    <p data-testid="geography-watch-level-copy" className="mt-1 text-xs font-semibold leading-5 text-[#49675e]">
                      {watchLevelCopy.copy}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {!canOpenLesson ? (
            <div data-testid="watch-route-summary" className={cn("rounded-lg border p-4", isComplete ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#ef9f27]/55 bg-[#fff4df]")}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">
                {talkCleared ? "Continue to MCQ" : isComplete ? "Discuss what you learned" : isBeginner ? "Complete one focused lesson" : hasRepairDiagnosis ? "Repair, then return" : "Start with recall"}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {talkCleared
                  ? "Your recall target is already cleared. Move directly into the reviewed fresh questions."
                  : isComplete
                  ? "Class proof is saved. Explain the improved answer to the AI teacher."
                  : isBeginner
                    ? "The lesson takes 10-15 minutes. The discussion opens automatically when you finish."
                    : hasRepairDiagnosis
                    ? "Complete the short class proof. The app will then move the student into discussion."
                    : "Tell the AI teacher what you already know before opening content."}
              </p>
              {talkCleared ? (
                <Link
                  href={`/upsc/geography/mcq-readiness?day=${activeSession.day}`}
                  data-testid="watch-open-mcq-after-clearance"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  Open MCQ practice <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : isComplete ? (
                <Link href={talkHref} className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  Open discussion <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : !canOpenLesson ? (
                <Link
                  href={talkHref}
                  data-testid="watch-start-recall-first"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  Start recall first <BrainCircuit className="ml-2 h-4 w-4" />
                </Link>
              ) : null}
            </div>
            ) : null}
          </div>
        </section>

        {canOpenLesson && (
        <section className="space-y-3">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-2 shadow-sm">
            <div
              id="watch-player"
              data-testid="watch-topic-player"
              data-day={activeSession.day}
              data-duration-minutes={durationMinutes}
              data-scene-count={watchScenes.length}
              data-talk-href={talkHref}
              data-next-topic-day={nextDay?.day ?? ""}
              data-media-source={dayOneMedia?.status ?? "portal-native-topic"}
              data-visible-mode="single-action-player"
              className="rounded-lg bg-[#13251d] p-3 text-white md:p-4"
            >
              <details
                data-testid="geography-watch-path-strip"
                className="mb-3 rounded-lg border border-white/10 bg-white/5 p-2 text-xs font-black text-white"
              >
                <summary className="cursor-pointer list-none rounded-md bg-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-white/75">
                  Flow after this lesson
                </summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  {[
                    ["1", isBeginner ? "Lesson" : "Repair", "Do this now"],
                    ["2", "Discussion", "AI recall to 95%"],
                    ["3", "Fresh MCQ", "No old batch"],
                    ["4", "Next topic", nextDay ? `Day ${nextDay.day}` : "Closeout"],
                  ].map(([number, label, detail]) => (
                    <div key={number} className="rounded-md bg-white/10 px-3 py-2">
                      <span className="text-[#75ddbc]">{number}.</span> {label}
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-white/58">{detail}</span>
                    </div>
                  ))}
                </div>
              </details>
              <p
                data-testid="watch-one-action-rule"
                className="mb-4 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/70"
              >
                Use the green button. The portal moves you to discussion, MCQ, and the next topic.
              </p>
              <div className="flex min-h-[36rem] flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-5 md:min-h-[42rem]">
                {activeModule && activeModuleSection ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-[#13251d]">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#75ddbc]">
                            {activeModule.cluster} module reader
                          </p>
                          <p className="truncate text-sm font-black text-white">{activeModule.title}</p>
                        </div>
                      </div>
                      <span
                        data-testid="geography-module-slide-progress"
                        className="rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em]"
                      >
                        Slide {activeModuleSectionIndex + 1} of {activeModule.sections.length}
                      </span>
                    </div>

                    <div
                      data-testid="geography-module-slide"
                      data-module-id={activeModule.id}
                      data-section-id={activeModuleSection.id}
                      data-section-read={activeModuleSectionRead ? "true" : "false"}
                      className="my-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch"
                    >
                      <article className="rounded-lg border border-white/15 bg-white p-5 text-[#13251d]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                          {activeModuleSection.eyebrow}
                        </p>
                        <h3 className="mt-2 text-2xl font-black tracking-tight">
                          {activeModuleSection.title}
                        </h3>
                        <p className="mt-3 text-sm font-semibold leading-6 text-[#4f5e55]">
                          {activeModuleSection.body}
                        </p>
                        <div className="mt-4 grid gap-2">
                          {activeModuleSection.bullets.map((bullet) => (
                            <p key={bullet} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-sm font-bold leading-6 text-[#34453b]">
                              {bullet}
                            </p>
                          ))}
                        </div>
                      </article>

                      <aside className="flex min-h-72 flex-col justify-between rounded-lg border border-white/15 bg-white/10 p-4">
                        {activeModuleSection.image?.url ? (
                          <div className="overflow-hidden rounded-lg border border-white/15 bg-black/30">
                            <img
                              src={activeModuleSection.image.url}
                              alt={activeModuleSection.image.alt}
                              className="max-h-56 w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex min-h-48 items-center justify-center rounded-lg border border-white/15 bg-[#0f2a20] p-5 text-center">
                            <p className="text-sm font-black leading-6 text-white/80">
                              Visual slot: use sourced map, NASA/public-domain image, or portal-native diagram here.
                            </p>
                          </div>
                        )}
                        <div className="mt-4 rounded-md bg-white/10 p-3 text-xs font-bold leading-5 text-white/72">
                          <p className="font-black uppercase tracking-[0.14em] text-[#75ddbc]">Image/source rule</p>
                          <p className="mt-2">
                            {activeModuleSection.image
                              ? `${activeModuleSection.image.credit}. ${activeModuleSection.image.license}.`
                              : activeModule.sourceLabel}
                          </p>
                          {activeModuleSection.image?.sourceUrl ? (
                            <a
                              href={activeModuleSection.image.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 font-black text-[#75ddbc] hover:text-white"
                            >
                              Source <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      </aside>
                    </div>

                    <div data-testid="geography-module-section-rail" className="grid gap-2 md:grid-cols-4">
                      {activeModule.sections.map((section, index) => {
                        const passed = activeModulePassedSectionIds.includes(section.id);
                        const read = activeModuleReadSectionIds.includes(section.id);
                        const unlocked = index <= unlockedModuleSectionIndex;
                        const active = section.id === activeModuleSection.id;
                        const content = (
                          <>
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 text-[10px] font-black text-[#13251d]">
                              {passed ? <CheckCircle2 className="h-3.5 w-3.5 text-[#1d9e75]" /> : unlocked ? index + 1 : <LockKeyhole className="h-3.5 w-3.5 text-[#8a8174]" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-black">{section.title}</span>
                              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.1em] opacity-70">
                                {passed ? "Recall clear" : read ? "Discuss now" : unlocked ? "Unlocked" : "Locked"}
                              </span>
                            </span>
                          </>
                        );

                        return unlocked ? (
                          <Link
                            key={section.id}
                            href={moduleWatchHref(activeSession.day, activeModule, section)}
                            data-testid={`geography-module-section-${section.id}`}
                            data-section-state={active ? "active" : passed ? "passed" : read ? "read" : "unlocked"}
                            className={cn(
                              "flex min-h-14 min-w-0 items-center gap-2 rounded-md border px-3 transition",
                              active
                                ? "border-[#75ddbc] bg-[#1d9e75] text-white"
                                : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                            )}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div
                            key={section.id}
                            data-testid={`geography-module-section-${section.id}`}
                            data-section-state="locked"
                            className="flex min-h-14 min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-white/45"
                          >
                            {content}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      data-testid="watch-module-read-and-discuss"
                      data-action-location="module-player"
                      data-module-id={activeModule.id}
                      data-section-id={activeModuleSection.id}
                      data-next-action-href={moduleTalkHref(activeSession.day, activeModule, activeModuleSection)}
                      onClick={saveModuleSectionAndDiscuss}
                      className="mt-5 inline-flex h-11 w-fit items-center justify-center rounded-md bg-[#1d9e75] px-4 text-sm font-black text-white transition hover:bg-[#087a59]"
                    >
                      {activeModuleSectionRead ? "Discuss cumulative recall" : "Mark slide read and discuss"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-[#13251d]">
                        <Video className="h-5 w-5" />
                      </div>
                      <span className="rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em]">
                        {durationMinutes} min guided class
                      </span>
                    </div>
                    <div>
                        {activeSession.day === 1 && !dayOneMedia?.releaseAssetPairReady ? <GeographyDay1MapThinkingVisual /> : null}
                        {activeSession.day === 2 ? <GeographyDay2UniverseVisual /> : null}
                        {activeSession.day === 3 ? <GeographyDay3PlateVisual /> : null}
                        {activeSession.day === 4 ? <GeographyDay4GeomorphicVisual /> : null}
                        {activeSession.day === 5 ? <GeographyDay5ClimatologyVisual /> : null}
                        {activeSession.day === 6 ? <GeographyDay6OceanVisual /> : null}
                        {activeSession.day === 7 ? <GeographyDay7ConsolidationVisual /> : null}
                        {activeSession.day === 8 ? <GeographyDay8IndiaReliefVisual /> : null}
                        {activeSession.day === 9 ? <GeographyDay9DrainageVisual /> : null}
                        {activeSession.day === 10 ? <GeographyDay10MonsoonVisual /> : null}
                        {activeSession.day === 11 ? <GeographyDay11ClimateRegionsVisual /> : null}
                        {activeSession.day === 12 ? <GeographyDay12SoilsVegetationVisual /> : null}
                        {activeSession.day === 13 ? <GeographyDay13ResourcesAgricultureVisual /> : null}
                        {activeSession.day === 14 ? <GeographyDay22AtlasMasteryVisual /> : null}
                        {activeSession.day === 15 ? <GeographyDay15PopulationVisual /> : null}
                        {activeSession.day === 16 ? <GeographyDay21HumanGeographyConsolidationVisual /> : null}
                        {activeSession.day === 17 ? <GeographyDay24DisasterGeographyBridgeVisual /> : null}
                        {activeSession.day === 18 ? <GeographyDay27FullGeographyDrillVisual /> : null}
                        {activeSession.day === 19 ? <GeographyDay28WeakAreaRepairVisual /> : null}
                        {activeSession.day === 20 ? <GeographyDay30GeographyCommandDayVisual /> : null}
                      {dayOneMedia?.releaseAssetPairReady && dayOneMedia.mediaUrl ? (
                        <div className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-black/30">
                          <video
                            data-testid="watch-approved-day1-video"
                            controls
                            preload="metadata"
                            src={dayOneMedia.mediaUrl}
                            onEnded={completeAndDiscuss}
                            className="aspect-video w-full bg-black object-contain"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                            <p className="text-xs font-black text-white/80">{dayOneMedia.mediaLabel}</p>
                            {dayOneMedia.transcriptUrl ? (
                              <a
                                href={dayOneMedia.transcriptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-black text-[#75ddbc] hover:text-white"
                              >
                                Transcript <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      <h3 className="text-2xl font-black tracking-tight">{activeSession.title}</h3>
                      <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/72">{activeSession.watch}</p>
                    </div>
                    <button
                      type="button"
                      data-testid="watch-complete-and-discuss"
                      data-action-location="player"
                      data-next-action-href={talkHref}
                      data-duration-minutes={durationMinutes}
                      onClick={completeAndDiscuss}
                      className="inline-flex h-11 w-fit items-center justify-center rounded-md bg-[#1d9e75] px-4 text-sm font-black text-white transition hover:bg-[#087a59]"
                    >
                      {isBeginner ? "Finish lesson and discuss" : "Finish repair and discuss"} <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee6d7]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${isComplete ? 100 : moduleProgressPercent}%` }} />
            </div>
          </div>

          {!activeModule && (
          <details data-testid="geography-watch-checkpoints" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
              Class checkpoints
            </summary>
            <div className="mt-4">
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
          </details>
          )}
        </section>
        )}

        {canOpenLesson && (
        <details data-testid="geography-watch-details" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
            Recap, saved recall, and note
          </summary>
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
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
            <div data-testid="geography-watch-saved-recall" className="mb-4 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Recall already captured in Talk</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#425047]">
                {baselineKnowledge.trim() || "No saved recall in this local session. Start from Talk if the student has not answered first."}
              </p>
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
          </div>
        </details>
        )}
      </div>
    </main>
  );
}
