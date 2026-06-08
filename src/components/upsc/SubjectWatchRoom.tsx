"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  MapPinned,
  PlayCircle,
  Save,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import {
  buildDisasterManagementWatchScenes,
  getDisasterManagementLearningPack,
} from "@/lib/upsc/disasterManagementLearningDecks";
import { buildEconomyWatchScenes, getEconomyLearningPack } from "@/lib/upsc/economyLearningDecks";
import { buildEnvironmentWatchScenes, getEnvironmentLearningPack } from "@/lib/upsc/environmentLearningDecks";
import { buildHistoryWatchScenes, getHistoryLearningPack, getHistoryLectureMediaDeck } from "@/lib/upsc/historyLearningDecks";
import {
  buildInternalSecuritySocietyWatchScenes,
  getInternalSecuritySocietyLearningPack,
} from "@/lib/upsc/internalSecuritySocietyLearningDecks";
import {
  buildPolityGovernanceWatchScenes,
  getPolityGovernanceLearningPack,
} from "@/lib/upsc/polityGovernanceLearningDecks";
import { buildScienceTechWatchScenes, getScienceTechLearningPack } from "@/lib/upsc/scienceTechLearningDecks";
import type { SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import { getSubjectBatchCode } from "@/lib/upsc/subjectPlans";
import { buildSubjectWatchScenes, getCompressedSubjectRecap, SUBJECT_RECALL_TARGET } from "@/lib/upsc/subjectLearning";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { type SubjectWatchMediaAssetMap, type SubjectWatchState, useSubjectProgress } from "@/lib/upsc/useSubjectProgress";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { cn } from "@/lib/utils";

const watchStates: Array<{ label: SubjectWatchState; detail: string }> = [
  { label: "Queued", detail: "Focused topic is planned for this subject day." },
  { label: "In class", detail: "The 10-15 minute topic is active." },
  { label: "Watched", detail: "Topic is complete and ready for Talk/Test." },
];

const FOCUSED_TOPIC_DURATION_MINUTES = 12;
const DEMO_RECAP_MINUTES = 6;

function stateTone(state: SubjectWatchState) {
  if (state === "Watched") return "border-[var(--subject-accent)] bg-[var(--subject-light)] text-[var(--subject-dark)]";
  if (state === "In class") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-muted)]";
}

export function SubjectWatchRoom({ plan, initialDay }: { plan: SubjectSprintPlan; initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useSubjectProgress(plan.slug, plan.sessions);
  const [activeDay, setActiveDay] = useState(initialDay ?? 1);
  const [watchState, setWatchState] = useState<SubjectWatchState>("Queued");
  const [watchMinutes, setWatchMinutes] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [completedSceneIds, setCompletedSceneIds] = useState<string[]>([]);
  const [completedMediaSlotIds, setCompletedMediaSlotIds] = useState<string[]>([]);
  const [mediaAssetSources, setMediaAssetSources] = useState<SubjectWatchMediaAssetMap>({});
  const [mediaTranscript, setMediaTranscript] = useState("");
  const [watchNote, setWatchNote] = useState("");
  const [baselineKnowledge, setBaselineKnowledge] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState<"Idle" | "Armed" | "Opening">("Idle");
  const [hydratedDay, setHydratedDay] = useState<number | null>(null);
  const [learnerLevel, setLearnerLevel] = useState<StudentLevel>("beginner");
  const handoffTimersRef = useRef<number[]>([]);

  const activeSession = plan.sessions.find((session) => session.day === activeDay) ?? plan.sessions[0];
  const activeDayProgress = getDayProgress(activeSession.day);
  const recallScore = activeDayProgress?.talkScore;
  const savedRecall = activeDayProgress?.reflection?.trim() || activeDayProgress?.baselineKnowledge?.trim();
  const hasSavedRecall = Boolean(savedRecall) || typeof recallScore === "number";
  const isBeginner = learnerLevel === "beginner";
  const needsBeginnerBaseline = isBeginner && !hasSavedRecall && watchState !== "Watched";
  const isHydratedForActiveDay = hydratedDay === activeDay;
  const hasTalkAssessment = typeof recallScore === "number";
  const isPracticeReady =
    (hasTalkAssessment && (recallScore ?? 0) >= SUBJECT_RECALL_TARGET) || activeDayProgress?.talkUnlockStage === "mcq";
  const hasRepairDiagnosis = !isBeginner && hasTalkAssessment && !isPracticeReady;
  const canUseWatchContent = !needsBeginnerBaseline && (isBeginner || hasRepairDiagnosis || hasSavedRecall || watchState === "Watched");
  const durationMinutes = FOCUSED_TOPIC_DURATION_MINUTES;
  const weekSessions = useMemo(
    () => plan.sessions.filter((session) => session.week === activeSession.week),
    [activeSession.week, plan.sessions]
  );
  const watchProgress = watchState === "Watched" ? 100 : Math.round((watchMinutes / durationMinutes) * 100);
  const basePath = `/upsc/${plan.slug}`;
  const batchCode = getSubjectBatchCode(plan.slug, activeSession.day);
  const demoMinutes = DEMO_RECAP_MINUTES;
  const watchModeCopy = watchState === "Watched"
    ? {
        badge: "Lesson complete",
        headline: "Discuss what you learned",
        intro: "Class proof is saved. The next step is to explain the topic to the AI teacher.",
        nextTitle: "Return to Talk",
        nextDetail: "Explain the improved answer and clear the 95% recall gate before MCQs.",
        playerPrompt: "Discussion is ready",
      }
    : isBeginner
      ? {
          badge: needsBeginnerBaseline ? "60-sec recall" : "Guided lesson",
          headline: needsBeginnerBaseline ? "Tell what you already know first" : "Watch one focused topic",
          intro: needsBeginnerBaseline
            ? "Write a short recall note before the class opens. This becomes the baseline for gap analysis, revision, and reports."
            : "Beginner path: finish this 10-15 minute topic, discuss it with the AI teacher, then unlock fresh MCQs.",
          nextTitle: needsBeginnerBaseline ? "Save recall to unlock lesson" : "Finish lesson -> AI discussion",
          nextDetail: needsBeginnerBaseline
            ? "The lesson player opens after one honest baseline note. No perfect answer is needed."
            : "Do not choose the next step manually. Complete the lesson and the app sends you to Talk.",
          playerPrompt: needsBeginnerBaseline ? "Save recall first" : "Use the lesson player below",
        }
      : hasSavedRecall
        ? {
            badge: "Repair class",
            headline: "Repair the exact gap",
            intro: `Your recall is saved${typeof recallScore === "number" ? ` at ${recallScore}%` : ""}. Use this class only to repair the missing pieces.`,
            nextTitle: "Repair, then return",
            nextDetail: "Complete the short class proof. The app will then return you to the AI teacher.",
            playerPrompt: "Use the repair player below",
          }
        : {
            badge: "Recall first",
            headline: "Start with diagnosis",
            intro: "Answer first in Talk so the AI teacher can identify the real gap before opening content.",
            nextTitle: "Start with recall",
            nextDetail: "Speak first. The class opens only after the AI teacher knows what to repair.",
            playerPrompt: "Start recall first",
          };
  const compressedRecap = useMemo(() => getCompressedSubjectRecap(activeSession), [activeSession]);
  const environmentPack = useMemo(
    () => (plan.slug === "environment" ? getEnvironmentLearningPack(activeSession) : null),
    [activeSession, plan.slug]
  );
  const economyPack = useMemo(
    () => (plan.slug === "economy" ? getEconomyLearningPack(activeSession) : null),
    [activeSession, plan.slug]
  );
  const disasterManagementPack = useMemo(
    () => (plan.slug === "disaster-management" ? getDisasterManagementLearningPack(activeSession) : null),
    [activeSession, plan.slug]
  );
  const scienceTechPack = useMemo(
    () => (plan.slug === "science-tech" ? getScienceTechLearningPack(activeSession) : null),
    [activeSession, plan.slug]
  );
  const polityGovernancePack = useMemo(
    () => (plan.slug === "polity-governance" ? getPolityGovernanceLearningPack(activeSession) : null),
    [activeSession, plan.slug]
  );
  const internalSecuritySocietyPack = useMemo(
    () => (plan.slug === "internal-security-society" ? getInternalSecuritySocietyLearningPack(activeSession) : null),
    [activeSession, plan.slug]
  );
  const historyPack = useMemo(
    () => (plan.slug === "history" ? getHistoryLearningPack(activeSession) : null),
    [activeSession, plan.slug]
  );
  const historyLectureMediaDeck = useMemo(
    () => (plan.slug === "history" ? getHistoryLectureMediaDeck(activeSession) : null),
    [activeSession, plan.slug]
  );
  const learningPack =
    environmentPack ??
    economyPack ??
    disasterManagementPack ??
    scienceTechPack ??
    polityGovernancePack ??
    internalSecuritySocietyPack ??
    historyPack;
  const watchScenes = useMemo(
    () =>
      environmentPack
        ? buildEnvironmentWatchScenes(activeSession)
        : economyPack
          ? buildEconomyWatchScenes(activeSession)
          : disasterManagementPack
            ? buildDisasterManagementWatchScenes(activeSession)
            : scienceTechPack
              ? buildScienceTechWatchScenes(activeSession)
              : polityGovernancePack
                ? buildPolityGovernanceWatchScenes(activeSession)
                : internalSecuritySocietyPack
                  ? buildInternalSecuritySocietyWatchScenes(activeSession)
                  : historyPack
                    ? buildHistoryWatchScenes(activeSession)
                    : buildSubjectWatchScenes(activeSession),
    [
      activeSession,
      disasterManagementPack,
      economyPack,
      environmentPack,
      historyPack,
      internalSecuritySocietyPack,
      polityGovernancePack,
      scienceTechPack,
    ]
  );
  const activeScene = watchScenes[Math.min(activeSceneIndex, watchScenes.length - 1)];
  const sceneProgress = watchScenes.length > 0 ? Math.round((completedSceneIds.length / watchScenes.length) * 100) : 0;
  const mediaReadyPercent = historyLectureMediaDeck
    ? Math.round((completedMediaSlotIds.length / historyLectureMediaDeck.assetSlots.length) * 100)
    : 0;
  const themeStyle = getSubjectThemeStyle(plan);
  const watchFlowGate =
    !isHydratedForActiveDay
      ? null
      : !isBeginner && !hasTalkAssessment
        ? {
            eyebrow: "Diagnosis first",
            title: "Explain before watching",
            detail: "For self-study and attempt-level students, the AI teacher first checks what you already know. Then the class opens only for the exact gap.",
            href: `${basePath}/talk?day=${activeSession.day}`,
            cta: "Start recall",
          }
        : !isBeginner && isPracticeReady
          ? {
              eyebrow: "Practice ready",
              title: "MCQ is already open",
              detail: `Your recall has reached ${SUBJECT_RECALL_TARGET}%. Use fresh questions now; the class remains optional support.`,
              href: `${basePath}/mcq-readiness?day=${activeSession.day}`,
              cta: "Open practice",
            }
          : null;

  const classBlocks = useMemo(
    () => [
      { label: "Concept objective", body: activeSession.watch, icon: PlayCircle },
      { label: "Core anchor", body: activeSession.anchor, icon: MapPinned },
      { label: "Talk bridge", body: activeSession.talk, icon: BrainCircuit },
      { label: "Practice bridge", body: activeSession.test, icon: ClipboardCheck },
    ],
    [activeSession]
  );

  useEffect(() => {
    if (!isLoaded || hydratedDay === activeDay) return;

    const timer = window.setTimeout(() => {
      const saved = getDayProgress(activeDay);
      const nextState = saved?.watchState ?? (saved?.watched ? "Watched" : "Queued");
      setLearnerLevel(readStudentProfile()?.level ?? "beginner");
      setWatchState(nextState);
      setWatchMinutes(saved?.watchMinutes ?? (saved?.watched ? durationMinutes : 0));
      setActiveSceneIndex(Math.min(Math.max(saved?.watchSceneIndex ?? 0, 0), watchScenes.length - 1));
      setCompletedSceneIds(saved?.watchSceneCompletedIds ?? (saved?.watched ? watchScenes.map((scene) => scene.id) : []));
      setCompletedMediaSlotIds(saved?.watchMediaReadyIds ?? []);
      setMediaAssetSources(saved?.watchMediaAssetSources ?? {});
      setMediaTranscript(saved?.watchMediaTranscript ?? "");
      setWatchNote(saved?.watchNote ?? "");
      setBaselineKnowledge(saved?.baselineKnowledge ?? "");
      setSavedNote(false);
      setIsDemoPlaying(false);
      setHandoffStatus("Idle");
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
    watchState?: SubjectWatchState;
    watchMinutes?: number;
    watchNote?: string;
    watchSceneIndex?: number;
    watchSceneCompletedIds?: string[];
    watchMediaReadyIds?: string[];
    watchMediaAssetSources?: SubjectWatchMediaAssetMap;
    watchMediaTranscript?: string;
    baselineKnowledge?: string;
    baselineSavedAt?: string;
    watched?: boolean;
  } = {}) => {
    const nextState = patch.watchState ?? watchState;
    const existing = getDayProgress(activeSession.day);
    saveDayProgress(activeSession.day, {
      watched: patch.watched ?? nextState === "Watched",
      watchState: nextState,
      watchMinutes: patch.watchMinutes ?? watchMinutes,
      watchNote: patch.watchNote ?? watchNote,
      watchSceneIndex: patch.watchSceneIndex ?? activeSceneIndex,
      watchSceneCompletedIds: patch.watchSceneCompletedIds ?? completedSceneIds,
      watchMediaReadyIds: patch.watchMediaReadyIds ?? completedMediaSlotIds,
      watchMediaAssetSources: patch.watchMediaAssetSources ?? mediaAssetSources,
      watchMediaTranscript: patch.watchMediaTranscript ?? mediaTranscript,
      baselineKnowledge: patch.baselineKnowledge ?? baselineKnowledge,
      baselineSavedAt: patch.baselineSavedAt ?? existing?.baselineSavedAt ?? (baselineKnowledge.trim() ? new Date().toISOString() : undefined),
    });
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), plan.sessions.length);
    setActiveDay(boundedDay);
    setWatchState("Queued");
    setWatchMinutes(0);
    setActiveSceneIndex(0);
    setCompletedSceneIds([]);
    setCompletedMediaSlotIds([]);
    setMediaAssetSources({});
    setMediaTranscript("");
    setWatchNote("");
    setBaselineKnowledge("");
    setSavedNote(false);
    setIsDemoPlaying(false);
    setHandoffStatus("Idle");
    clearAutoHandoff();
    setHydratedDay(null);
    router.replace(`${basePath}/watch?day=${boundedDay}`, { scroll: false });
  };

  const updateState = (nextState: SubjectWatchState) => {
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
    const nextState: SubjectWatchState =
      boundedMinutes >= durationMinutes ? "Watched" : boundedMinutes > 0 ? "In class" : "Queued";
    const nextCompletedSceneIds = nextState === "Watched" ? watchScenes.map((scene) => scene.id) : completedSceneIds;
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

  const saveBaselineRecall = () => {
    const nextBaseline = baselineKnowledge.trim();
    if (!nextBaseline) return;
    setBaselineKnowledge(nextBaseline);
    persistWatch({
      baselineKnowledge: nextBaseline,
      baselineSavedAt: new Date().toISOString(),
    });
    setSavedNote(true);
  };

  const toggleMediaSlot = (slotId: string) => {
    const nextIds = completedMediaSlotIds.includes(slotId)
      ? completedMediaSlotIds.filter((id) => id !== slotId)
      : [...completedMediaSlotIds, slotId];

    setCompletedMediaSlotIds(nextIds);
    persistWatch({ watchMediaReadyIds: nextIds });
  };

  const updateMediaAssetSource = (slotId: string, source: string) => {
    const nextSources = {
      ...mediaAssetSources,
      [slotId]: source,
    };

    if (!source.trim()) delete nextSources[slotId];

    setMediaAssetSources(nextSources);
    persistWatch({ watchMediaAssetSources: nextSources });
  };

  const saveMediaTranscript = () => {
    persistWatch({ watchMediaTranscript: mediaTranscript });
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
    const nextState: SubjectWatchState = allScenesComplete ? "Watched" : "In class";

    setCompletedSceneIds(nextCompletedSceneIds);
    setActiveSceneIndex(nextIndex);
    setWatchMinutes(nextMinutes);
    setWatchState(nextState);
    setSavedNote(true);
    persistWatch({
      watchState: nextState,
      watchMinutes: nextMinutes,
      watchSceneIndex: nextIndex,
      watchSceneCompletedIds: nextCompletedSceneIds,
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
    setSavedNote(false);
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
      saveDayProgress(activeSession.day, {
        watched: true,
        watchState: "Watched",
        watchMinutes: durationMinutes,
        watchSceneIndex: watchScenes.length - 1,
        watchSceneCompletedIds: watchScenes.map((scene) => scene.id),
        watchNote,
        baselineKnowledge,
        baselineSavedAt: new Date().toISOString(),
      });

      const routeTimer = window.setTimeout(() => {
        router.push(`${basePath}/talk?day=${activeSession.day}`);
      }, 850);
      handoffTimersRef.current.push(routeTimer);
    }, 2200);

    handoffTimersRef.current.push(completeTimer);
  };

  const markWatched = () => {
    clearAutoHandoff();
    setWatchState("Watched");
    setWatchMinutes(durationMinutes);
    setActiveSceneIndex(watchScenes.length - 1);
    setCompletedSceneIds(watchScenes.map((scene) => scene.id));
    setHandoffStatus("Idle");
    persistWatch({
      watchState: "Watched",
      watchMinutes: durationMinutes,
      watchSceneIndex: watchScenes.length - 1,
      watchSceneCompletedIds: watchScenes.map((scene) => scene.id),
      watched: true,
    });
    setSavedNote(true);
  };

  const completeAndDiscuss = () => {
    clearAutoHandoff();
    markWatched();
    router.push(`${basePath}/talk?day=${activeSession.day}`);
  };

  if (!isLoaded || !isHydratedForActiveDay) {
    return (
      <div style={themeStyle} className="flex min-h-screen items-center justify-center bg-[var(--subject-bg)] text-[var(--subject-text)]">
        <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-6 text-sm font-black">
          Loading {plan.title} class room...
        </div>
      </div>
    );
  }

  if (watchFlowGate) {
    return (
      <div
        data-testid="subject-room-shell"
        data-room="watch-gate"
        data-subject={plan.slug}
        data-subject-accent={plan.accent}
        style={themeStyle}
        className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
          <Link href={basePath} className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
            <ArrowLeft className="h-4 w-4" /> {plan.title} command room
          </Link>
          <section
            data-testid="subject-watch-flow-gate"
            className="rounded-lg border border-[#dcd5c7] bg-[var(--subject-card)] p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--subject-dark)] text-white">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">{watchFlowGate.eyebrow}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--subject-heading)]">{watchFlowGate.title}</h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">{watchFlowGate.detail}</p>
                <Link
                  data-testid="subject-watch-flow-gate-action"
                  href={watchFlowGate.href}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90"
                >
                  {watchFlowGate.cta}
                  <BrainCircuit className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="subject-room-shell"
      data-room="watch"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section
          data-testid="subject-watch-simple-repair"
          data-duration-minutes={durationMinutes}
          data-visible-mode="focused-topic-player"
          className="order-1 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7"
        >
          <Link href={basePath} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
            <ArrowLeft className="h-4 w-4" /> {plan.title} command room
          </Link>

          <div className="grid gap-5 lg:grid-cols-[1fr_270px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">
                  {watchModeCopy.badge}
                </Badge>
                <span className="text-sm font-black text-[var(--subject-accent)]">Day {activeSession.day}</span>
                <span data-testid="subject-watch-visible-duration" className="text-sm font-semibold text-[#746f66]">
                  {durationMinutes} min focused topic
                </span>
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">
                {activeSession.chapter}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
                {activeSession.title}
              </h1>
              <p
                data-testid="subject-watch-path-headline"
                className="mt-3 text-lg font-black leading-7 text-[var(--subject-heading)]"
              >
                {watchModeCopy.headline}
              </p>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                {watchModeCopy.intro}
              </p>
              <div
                data-testid="subject-watch-simple-loop"
                className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--subject-dark)]"
              >
                <span className="rounded-md border border-[var(--subject-border)] bg-white px-2.5 py-1.5">
                  Topic
                </span>
                <span className="rounded-md border border-[var(--subject-border)] bg-white px-2.5 py-1.5">
                  AI discussion
                </span>
                <span className="rounded-md border border-[var(--subject-border)] bg-white px-2.5 py-1.5">
                  95% recall
                </span>
                <span className="rounded-md border border-[var(--subject-border)] bg-white px-2.5 py-1.5">
                  Fresh MCQ
                </span>
              </div>
              {hasSavedRecall && (
                <div className="mt-4 rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                    Recall gap
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-[var(--subject-heading)]">
                    {savedRecall || activeSession.talk}
                  </p>
                </div>
              )}
            </div>

            <div
              className={cn(
                "rounded-lg border p-4",
                watchState === "Watched"
                  ? "border-[var(--subject-accent)] bg-[var(--subject-light)]"
                  : "border-[#ef9f27]/55 bg-[#fff4df]"
              )}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Next</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">
                {watchModeCopy.nextTitle}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {watchModeCopy.nextDetail}
              </p>
              {watchState === "Watched" ? (
                <Link
                  href={`${basePath}/talk?day=${activeSession.day}`}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90"
                >
                  Return to Talk <BrainCircuit className="h-4 w-4" />
                </Link>
              ) : canUseWatchContent ? (
                <div
                  data-testid="watch-player-prompt"
                  className="mt-4 rounded-md border border-[var(--subject-border)] bg-white/65 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--subject-dark)]"
                >
                  {watchModeCopy.playerPrompt}
                </div>
              ) : needsBeginnerBaseline ? (
                <div
                  data-testid="watch-save-recall-first"
                  className="mt-4 rounded-md border border-[var(--subject-border)] bg-white/65 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--subject-dark)]"
                >
                  Save recall below
                </div>
              ) : !hasSavedRecall ? (
                <Link
                  href={`${basePath}/talk?day=${activeSession.day}`}
                  data-testid="watch-start-recall-first"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90"
                >
                  Start recall first <BrainCircuit className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {needsBeginnerBaseline && (
          <section
            data-testid="subject-pre-lesson-recall-gate"
            data-subject={plan.slug}
            data-day={activeSession.day}
            data-required="true"
            data-status="baseline-missing"
            data-can-open-lesson="false"
            data-current-action="save-baseline"
            className="order-2 rounded-lg border border-[#ef9f27]/60 bg-[#fff8ed] p-4 shadow-sm md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#6f4a12]">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6f4a12]">
                  Pre-lesson recall
                </p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">
                  What do you already know about Day {activeSession.day}?
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                  One honest baseline is enough. The lesson opens after this note is saved.
                </p>
              </div>
              <div className="rounded-lg border border-[#e8d2a8] bg-white p-3">
                <textarea
                  data-testid="subject-baseline-draft"
                  value={baselineKnowledge}
                  onChange={(event) => setBaselineKnowledge(event.target.value)}
                  placeholder={`Write what you already know about ${activeSession.title}.`}
                  className="min-h-28 w-full resize-y rounded-md border border-[#dcd5c7] bg-[#fffdf8] p-3 text-sm font-semibold leading-6 text-[#13251d] outline-none transition focus:border-[#1d9e75]"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span
                    data-testid="subject-baseline-draft-count"
                    className="text-xs font-black uppercase tracking-[0.14em] text-[#6f4a12]"
                  >
                    {baselineKnowledge.trim().length} chars
                  </span>
                  <button
                    type="button"
                    data-testid="subject-save-baseline"
                    onClick={saveBaselineRecall}
                    disabled={!baselineKnowledge.trim()}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Save className="h-4 w-4" /> Save recall
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <details data-testid="subject-baseline-check" className="group order-3 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] shadow-sm">
          <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Saved recall</p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-[var(--subject-heading)]">
                {hasSavedRecall ? "Talk diagnosis is attached" : "Recall happens in Talk"}
              </h2>
            </div>
            <span className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--subject-border)] bg-white px-3 text-xs font-black text-[var(--subject-dark)]">
              Open
            </span>
          </summary>
          <div className="hidden border-t border-[var(--subject-border)] p-4 group-open:block">
            <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">Topic</p>
              <p className="mt-2 text-sm font-black leading-5 text-[var(--subject-heading)]">{activeSession.title}</p>
              {!hasSavedRecall && (
                <Link
                  href={`${basePath}/talk?day=${activeSession.day}`}
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white"
                >
                  Start recall first
                </Link>
              )}
            </div>
            <div
              data-testid="subject-baseline-readonly"
              className="mt-4 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                Student input rule
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[var(--subject-heading)]">
                {hasSavedRecall
                  ? "This recall came from Talk. Watch only repairs the class gap."
                  : "No writing is needed here. Use Talk to explain the topic, then Watch opens only when a lesson or repair is needed."}
              </p>
              {hasSavedRecall ? (
                <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-[#5d675f]">{savedRecall}</p>
              ) : null}
            </div>
          </div>
        </details>

        {canUseWatchContent && (
          <section
            data-testid="subject-watch-visual-surface"
            className="order-2 overflow-hidden rounded-lg bg-[#13251d] text-white shadow-sm ring-1 ring-white/10"
            style={{
              background:
                "radial-gradient(circle at 25% 20%, var(--subject-accent-glow), transparent 28%), linear-gradient(135deg, var(--subject-dark), #111827)",
            }}
          >
            <div className="flex flex-col gap-4 border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-[#13251d]">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                    Lesson player
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">{activeSession.title}</h2>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em]">
                  {batchCode}
                </span>
                <span
                  data-testid="subject-watch-focus-duration"
                  className="rounded-md bg-white px-3 py-2 text-xs font-black text-[var(--subject-dark)]"
                >
                  10-15 min focus
                </span>
              </div>
            </div>
            <div className="p-5">
              <div
                data-testid="subject-watch-topic-player"
                data-duration-minutes={durationMinutes}
                data-visible-mode="single-action-player"
                className="flex min-h-[34rem] flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-5 md:min-h-[38rem] lg:min-h-[42rem]"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                    Teacher-led session
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">{activeSession.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/75">{activeSession.watch}</p>
                  <div
                    data-testid="subject-watch-player-flow"
                    className="mt-5 grid gap-2 text-xs font-black uppercase tracking-[0.1em] text-white/90 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    {["Topic", "10-15 min lesson", "AI discussion", `${SUBJECT_RECALL_TARGET}% recall`].map((step, index) => (
                      <div key={step} className="flex min-h-12 items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[var(--subject-dark)]">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div
                    data-testid="subject-watch-player-next-step"
                    className="mb-4 rounded-md border border-white/10 bg-white/10 p-3"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-light)]">
                      Next opens automatically
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
                      Complete this class once. The app sends you to the AI teacher discussion before MCQs.
                    </p>
                  </div>
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-white/75">
                    <span>{watchMinutes} of {durationMinutes} min focused topic</span>
                    <span>{watchProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-[var(--subject-accent)]" style={{ width: `${watchProgress}%` }} />
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={playDemoLesson}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] sm:w-auto"
                    >
                      <PlayCircle className="h-4 w-4" /> Play demo
                    </button>
                    <button
                      type="button"
                      data-testid="watch-complete-and-discuss"
                      data-action-location="player"
                      onClick={completeAndDiscuss}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-accent)] px-4 text-sm font-black text-white transition hover:brightness-90 sm:w-auto"
                    >
                      {isBeginner ? "Finish lesson and discuss" : "Finish repair and discuss"}
                      <BrainCircuit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {canUseWatchContent && (
          <details
            data-testid="subject-watch-scene-engine"
            className="group order-4 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] shadow-sm"
          >
          <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Optional proof checkpoints</p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-[var(--subject-heading)]">
                {completedSceneIds.length}/{watchScenes.length} saved
              </h2>
            </div>
            <span className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--subject-border)] bg-white px-3 text-xs font-black text-[var(--subject-dark)]">
              Open if needed
            </span>
          </summary>
          <div className="hidden border-t border-[var(--subject-border)] p-5 group-open:block md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">One repair checkpoint</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--subject-heading)]">
                  {`${activeSceneIndex + 1}. ${activeScene?.title ?? "Class proof"}`}
                </h2>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">{activeScene?.narration}</p>
              </div>
              <span className="rounded-md bg-[var(--subject-light)] px-3 py-2 text-xs font-black text-[var(--subject-dark)]">
                {completedSceneIds.length}/{watchScenes.length} complete
              </span>
            </div>

            <div className="mt-4 rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Checkpoint</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[var(--subject-heading)]">{activeScene?.checkpoint}</p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee6d8]">
              <div className="h-full rounded-full bg-[var(--subject-accent)]" style={{ width: `${sceneProgress}%` }} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                data-testid="subject-watch-scene-complete"
                onClick={completeActiveScene}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90 sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4" /> Save repair checkpoint
              </button>
            </div>

            <details
              data-testid="subject-watch-scene-list"
              className="mt-4 rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-3"
            >
              <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-[var(--subject-dark)]">
                Scene checklist and navigation
              </summary>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => selectScene(activeSceneIndex - 1)}
                  disabled={activeSceneIndex === 0}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous checkpoint
                </button>
                <button
                  type="button"
                  onClick={() => selectScene(activeSceneIndex + 1)}
                  disabled={activeSceneIndex === watchScenes.length - 1}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  Next checkpoint <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-5">
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
                        "min-h-20 rounded-md border p-3 text-left transition",
                        isActive
                          ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                          : isComplete
                            ? "border-[var(--subject-accent)] bg-[var(--subject-light)] text-[var(--subject-dark)] hover:border-[var(--subject-dark)]"
                            : "border-[var(--subject-border)] bg-white text-[var(--subject-text)] hover:border-[var(--subject-accent)]"
                      )}
                    >
                      <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em]">
                        Scene {index + 1}
                        {isComplete && <CheckCircle2 className="h-4 w-4" />}
                      </span>
                      <span className="mt-2 block text-sm font-bold leading-5">{scene.title}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
          </details>
        )}

        {canUseWatchContent && (
          <details data-testid="subject-watch-details" className="order-5 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[var(--subject-dark)]">
            Advanced class details, notes, and playlist
          </summary>
          <div className="mt-5 grid gap-5">
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
            <Link href={basePath} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
              <ArrowLeft className="h-4 w-4" /> {plan.title} command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">Watch</Badge>
              <span className="text-sm font-bold text-[#776f64]">Day {activeSession.day} class</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--subject-accent)]">{activeSession.chapter}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Duration", activeSession.duration],
                ["Class state", watchState],
                ["Batch", batchCode],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">{label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[var(--subject-heading)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => selectDay(activeSession.day - 1)}
                disabled={activeSession.day === 1}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" /> Previous day
              </button>
              <button
                type="button"
                onClick={() => selectDay(activeSession.day + 1)}
                disabled={activeSession.day === plan.sessions.length}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-bold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Next day <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
            <div
              data-testid="subject-watch-visual-surface-detail"
              className="relative min-h-80 overflow-hidden rounded-lg bg-[var(--subject-panel)] p-5 text-white"
              style={{
                background:
                  "radial-gradient(circle at 25% 20%, var(--subject-accent-glow), transparent 28%), linear-gradient(135deg, var(--subject-dark), #111827)",
              }}
            >
              <div className="relative flex h-full min-h-72 flex-col justify-between">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em]">
                    <Video className="h-4 w-4" /> Class slot
                  </div>
                  <span className="max-w-full break-words rounded-md bg-[#ef9f27] px-3 py-2 text-xs font-black text-[#13251d]">
                    {batchCode}
                  </span>
                </div>
                <div>
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                    <PlayCircle className="h-11 w-11 text-[var(--subject-light)]" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-light)]">Teacher-led session</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{activeSession.title}</h2>
                  <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#dce8e2]">{activeSession.watch}</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                        {handoffStatus === "Opening"
                          ? "Opening Talk Room"
                          : isDemoPlaying
                            ? "Demo lesson running"
                            : "Demo video ready"}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#dce8e2]">
                        Compressed {demoMinutes}-minute recap for this {durationMinutes}-minute topic, built for fast revision before discussion.
                      </p>
                      {handoffStatus !== "Idle" && (
                        <div
                          data-testid="watch-handoff-status"
                          className="mt-3 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-light)]"
                        >
                          {handoffStatus === "Opening" ? "Opening AI teacher discussion" : "Auto discussion handoff armed"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
                      <button
                        type="button"
                        onClick={playDemoLesson}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] sm:w-auto"
                      >
                        <PlayCircle className="h-4 w-4" /> Play demo
                      </button>
                      <button
                        type="button"
                        onClick={completeAndDiscuss}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-accent)] px-3 text-sm font-black text-white transition hover:brightness-90 sm:w-auto"
                      >
                        <BrainCircuit className="h-4 w-4" /> Complete and discuss
                      </button>
                    </div>
                  </div>

                  <div data-testid="subject-watch-scene-engine-detail" className="mt-4 rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subject-light)]">
                          Scene playback
                        </p>
                        <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                          {`${activeSceneIndex + 1}. ${activeScene?.title ?? ""}`}
                        </h3>
                      </div>
                      <span className="rounded-md bg-white/10 px-3 py-2 text-xs font-black text-[#dff7ee] ring-1 ring-white/15">
                        {completedSceneIds.length}/{watchScenes.length} complete
                      </span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[1fr_0.85fr]">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-light)]">
                          {activeScene?.objective}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#dce8e2]">
                          {activeScene?.narration}
                        </p>
                      </div>
                      <div className="rounded-md bg-black/20 p-3 ring-1 ring-white/10">
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
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => selectScene(activeSceneIndex - 1)}
                        disabled={activeSceneIndex === 0}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                      >
                        <ChevronLeft className="h-4 w-4" /> Scene back
                      </button>
                      <button
                        type="button"
                        data-testid="subject-watch-scene-complete-detail"
                        onClick={completeActiveScene}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#ef9f27] px-3 text-sm font-black text-[#13251d] transition hover:bg-[#f3b85c] sm:w-auto"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Complete scene
                      </button>
                      <button
                        type="button"
                        onClick={() => selectScene(activeSceneIndex + 1)}
                        disabled={activeSceneIndex === watchScenes.length - 1}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                      >
                        Scene next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-[#dff7ee]">
                    <span>{watchMinutes} of {durationMinutes} min topic</span>
                    <span>{watchProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-[var(--subject-accent)]" style={{ width: `${watchProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Class board</p>
              <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Build the topic before testing</h2>
            </div>

            <div data-testid="subject-watch-scene-list-detail" className="mb-5 grid gap-2 md:grid-cols-5">
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
                        ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                        : isComplete
                          ? "border-[var(--subject-accent)] bg-[var(--subject-light)] text-[var(--subject-dark)] hover:border-[var(--subject-dark)]"
                          : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-text)] hover:border-[var(--subject-accent)]"
                    )}
                  >
                    <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em]">
                      Scene {index + 1}
                      {isComplete && <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <span className="mt-2 block text-sm font-bold leading-5">{scene.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">{scene.durationMinutes} min</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {classBlocks.map((block) => (
                <div key={block.label} className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-soft)] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--subject-accent)] text-white">
                      <block.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-black text-[var(--subject-dark)]">{block.label}</p>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#51665d]">{block.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-[var(--subject-accent)] bg-[var(--subject-light)] p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Compressed recap</p>
              <div className="mt-3 grid gap-2">
                {compressedRecap.map((line, index) => (
                  <div key={line} className="flex items-start gap-3 rounded-md bg-white/75 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--subject-accent)] text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold leading-6 text-[#49675e]">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            {learningPack ? (
              <div
                data-testid={`${plan.slug}-watch-teacher-pack`}
                className="mt-5 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">
                      {plan.title} teacher pack
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[var(--subject-heading)]">{learningPack.lens}</h3>
                  </div>
                  <span className="max-w-full break-words rounded-md bg-[var(--subject-light)] px-3 py-2 text-xs font-black text-[var(--subject-dark)] ring-1 ring-[var(--subject-ring)] sm:shrink-0">
                    GS-ready
                  </span>
                </div>
                <p className="text-sm font-bold leading-6 text-[#49675e]">{learningPack.teacherFocus}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-md bg-[#f7f4ee] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Cause chain</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#34453b]">
                      {learningPack.causeChain.join(" -> ")}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#f7f4ee] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Case anchors</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#34453b]">
                      {learningPack.caseAnchors.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#fff4df] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a6a16]">Trap</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#6f4a12]">
                      {learningPack.trapBank[0]}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {historyLectureMediaDeck ? (
              <div
                data-testid="history-watch-media-queue"
                className="mt-5 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">
                      History lecture media queue
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[var(--subject-heading)]">
                      {historyLectureMediaDeck.title}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#49675e]">
                      {historyLectureMediaDeck.subtitle}
                    </p>
                  </div>
                  <span className="max-w-full break-words rounded-md bg-[var(--subject-light)] px-3 py-2 text-xs font-black text-[var(--subject-dark)] ring-1 ring-[var(--subject-ring)] sm:shrink-0">
                    {completedMediaSlotIds.length}/{historyLectureMediaDeck.assetSlots.length} ready
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-soft)] p-4">
                    <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                        Primary slot
                      </p>
                      <span className="max-w-full break-words rounded-md bg-white px-2 py-1 text-[10px] font-black text-[var(--subject-dark)] ring-1 ring-[var(--subject-ring)]">
                        {historyLectureMediaDeck.durationLabel}
                      </span>
                    </div>
                    <h4 className="text-lg font-black leading-6 text-[var(--subject-heading)]">
                      {historyLectureMediaDeck.primarySlot.label}
                    </h4>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-[#9a6a16]">
                      {historyLectureMediaDeck.primarySlot.kind}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#51665d]">
                      {historyLectureMediaDeck.primarySlot.placeholder}
                    </p>
                    <p className="mt-3 rounded-md bg-[#fff4df] p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                      {historyLectureMediaDeck.primarySlot.cue}
                    </p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-[var(--subject-accent)]" style={{ width: `${mediaReadyPercent}%` }} />
                    </div>
                  </div>

                  <div data-testid="history-watch-media-segments" className="grid gap-2 md:grid-cols-2">
                    {historyLectureMediaDeck.segments.map((segment) => (
                      <div key={`${segment.timestamp}-${segment.title}`} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="rounded-md bg-[var(--subject-accent)] px-2 py-1 text-[10px] font-black text-white">
                            {segment.timestamp}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                            {segment.visual}
                          </span>
                        </div>
                        <p className="text-sm font-black leading-5 text-[var(--subject-heading)]">{segment.title}</p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-[#51665d]">{segment.teacherCue}</p>
                        <p className="mt-2 rounded-md bg-white/80 p-2 text-xs font-bold leading-5 text-[#345d52]">
                          {segment.studentAction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div data-testid="history-watch-asset-slots" className="mt-4 grid gap-2 md:grid-cols-4">
                  {historyLectureMediaDeck.assetSlots.map((slot) => {
                    const isReady = completedMediaSlotIds.includes(slot.id);
                    const assetSource = mediaAssetSources[slot.id] ?? "";
                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "min-h-44 rounded-md border p-3 transition",
                          isReady
                            ? "border-[var(--subject-accent)] bg-[var(--subject-light)] text-[var(--subject-dark)]"
                            : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-text)]"
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={isReady}
                          data-testid={`history-watch-asset-ready-${slot.id}`}
                          onClick={() => toggleMediaSlot(slot.id)}
                          className="block w-full rounded-md text-left transition hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--subject-ring)]"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.14em]">{slot.kind}</span>
                            {isReady ? <CheckCircle2 className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                          </div>
                          <span className="block text-sm font-black leading-5">{slot.label}</span>
                          <span className="mt-2 block text-xs font-semibold leading-5 opacity-80">{slot.requirement}</span>
                          <span className="mt-2 block text-xs font-bold leading-5 opacity-75">{slot.use}</span>
                          <span className="mt-3 inline-flex rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--subject-dark)] ring-1 ring-[var(--subject-ring)]">
                            {isReady ? "Ready" : "Mark ready"}
                          </span>
                        </button>

                        <label className="mt-3 block">
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                            Asset source
                          </span>
                          <input
                            data-testid={`history-watch-asset-source-${slot.id}`}
                            value={assetSource}
                            onChange={(event) => updateMediaAssetSource(slot.id, event.target.value)}
                            placeholder="Paste local path or URL"
                            className="mt-1 w-full rounded-md border border-[var(--subject-border)] bg-white px-2 py-2 text-xs font-semibold text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[var(--subject-accent)] focus:ring-2 focus:ring-[var(--subject-ring)]"
                          />
                        </label>
                        <p
                          data-testid={`history-watch-asset-source-preview-${slot.id}`}
                          className="mt-2 min-h-8 break-all rounded-md bg-white/70 p-2 text-[10px] font-bold leading-4 text-[#51665d]"
                        >
                          {assetSource ? `Linked: ${assetSource}` : "Waiting for a local source reference."}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_0.9fr]">
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                      Transcript capture
                    </p>
                    <textarea
                      data-testid="history-watch-media-transcript"
                      value={mediaTranscript}
                      onChange={(event) => {
                        setMediaTranscript(event.target.value);
                        setSavedNote(false);
                      }}
                      rows={5}
                      placeholder="Paste or draft the lecture transcript, scene narration, or media production note here."
                      className="w-full resize-y rounded-md border border-[var(--subject-border)] bg-[var(--subject-soft)] p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[var(--subject-accent)] focus:ring-2 focus:ring-[var(--subject-ring)]"
                    />
                    <button
                      type="button"
                      onClick={saveMediaTranscript}
                      className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90 sm:w-auto"
                    >
                      <Save className="h-4 w-4" /> Save media transcript
                    </button>
                  </div>
                  <div data-testid="history-watch-transcript-prompts" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-soft)] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                      Script prompts
                    </p>
                    <div className="mt-3 grid gap-2">
                      {historyLectureMediaDeck.transcriptPrompts.map((prompt, index) => (
                        <div key={prompt} className="grid grid-cols-[28px_1fr] gap-2 rounded-md bg-white/75 p-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--subject-accent)] text-[10px] font-black text-white">
                            {index + 1}
                          </span>
                          <p className="text-xs font-bold leading-5 text-[#34453b]">{prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {watchStates.map((state) => {
                const isActive = watchState === state.label;
                return (
                  <button
                    key={state.label}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => updateState(state.label)}
                    className={cn(
                      "min-h-24 rounded-md border p-4 text-left transition",
                      isActive ? stateTone(state.label) : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-muted)] hover:border-[var(--subject-accent)]"
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

            <div className="mt-5 rounded-lg border border-[var(--subject-accent)] bg-[var(--subject-light)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-[var(--subject-dark)]">Topic minutes</p>
                <p className="text-sm font-black text-[var(--subject-dark)]">{watchMinutes}/{durationMinutes}</p>
              </div>
              <input
                type="range"
                min={0}
                max={durationMinutes}
                step={5}
                value={Math.min(watchMinutes, durationMinutes)}
                onChange={(event) => updateMinutes(Number(event.target.value))}
                className="w-full accent-[var(--subject-accent)]"
                aria-label="Class minutes completed"
              />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--subject-heading)]">Class note</p>
                  <p className="text-xs font-semibold text-[#746f66]">Saved locally for this {plan.title} day</p>
                </div>
              </div>

              <textarea
                value={watchNote}
                onChange={(event) => {
                  setWatchNote(event.target.value);
                  setSavedNote(false);
                }}
                placeholder="Capture teacher note, map clue, example, rule, report, or doubt."
                className="min-h-36 w-full resize-y rounded-lg border border-[var(--subject-border)] bg-[var(--subject-soft)] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[var(--subject-accent)] focus:ring-2 focus:ring-[var(--subject-ring)]"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={saveClassNote}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-bold text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] sm:w-auto"
                >
                  <Save className="h-4 w-4" /> Save note
                </button>
                <button
                  type="button"
                  onClick={markWatched}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-bold text-white transition hover:brightness-90 sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark watched
                </button>
              </div>

              {savedNote && (
                <div className="mt-4 flex items-start gap-3 rounded-md bg-[var(--subject-light)] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--subject-accent)]" />
                  <p className="text-sm font-bold leading-6 text-[var(--subject-dark)]">
                    Class progress saved locally. Track will now include this day.
                  </p>
                </div>
              )}
            </div>

            <SubjectLoopActions plan={plan} activeDay={activeSession.day} current="watch" />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Week {activeSession.week}</p>
            <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Class playlist</h2>
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
                      ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                      : item?.watched
                        ? "border-[var(--subject-accent)] bg-[var(--subject-light)] text-[var(--subject-dark)] hover:border-[var(--subject-dark)]"
                        : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[var(--subject-text)] hover:border-[var(--subject-accent)]"
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
        </details>
        )}
      </div>
    </div>
  );
}
