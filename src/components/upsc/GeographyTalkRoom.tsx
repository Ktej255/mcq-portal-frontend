"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Lightbulb,
  LockKeyhole,
  MapPinned,
  MessageCircle,
  RefreshCcw,
  Save,
  UnlockKeyhole,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyLoopActions } from "@/components/upsc/GeographyLoopActions";
import {
  GeographyStudentHandoffStrip,
  type GeographyStudentHandoffStep,
} from "@/components/upsc/GeographyStudentHandoffStrip";
import { geographySessions, GeographySession } from "@/lib/upsc/plan";
import {
  assessGeographyExplanation,
  buildGeographyChallengeScaffold,
  buildGeographyWatchScenes,
  buildGeographyMaicDiscussion,
  GeographyAssessment,
  GeographyMaicDiscussion,
  getCompressedGeographyRecap,
  getGeographySubtopics,
  getGeographyTalkUnlockStage,
  labSlugForGeographySession,
} from "@/lib/upsc/geographyLearning";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import type { GeographyTalkClassroomStage, GeographyTalkDiscussionStep } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

type Confidence = "Shaky" | "Working" | "Command";
type MentorMode = "Map logic" | "Cause-effect" | "UPSC trap";
type ProtocolState = "Done" | "Active" | "Ready" | "Locked" | "Skipped";

type ClassroomStage = {
  id: GeographyTalkClassroomStage;
  label: string;
  detail: string;
  state: ProtocolState;
  icon: LucideIcon;
};

const confidenceOptions: Confidence[] = ["Shaky", "Working", "Command"];
const mentorModes: MentorMode[] = ["Map logic", "Cause-effect", "UPSC trap"];

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function buildPromptLadder(session: GeographySession, mode: MentorMode) {
  const modeLens = {
    "Map logic": "Keep answering through location, relief, direction, distance, and spatial pattern.",
    "Cause-effect": "Keep answering through cause, mechanism, consequence, and exception.",
    "UPSC trap": "Keep answering through statement traps, pair matching, and wrong-generalization risk.",
  }[mode];

  return [
    {
      label: "Observe",
      question: `What are the two or three core variables inside: ${session.anchor}?`,
      nudge: "Name the moving parts before explaining anything.",
    },
    {
      label: "Explain",
      question: session.talk,
      nudge: modeLens,
    },
    {
      label: "Apply",
      question: `Give one India or world example where "${session.title}" becomes visible on a map.`,
      nudge: "Force the idea into a place, region, river, coast, mountain, or climate belt.",
    },
    {
      label: "UPSC Angle",
      question: `What kind of statement could UPSC create to test ${session.title}?`,
      nudge: "Think of an almost-correct statement with one hidden exception.",
    },
    {
      label: "Revisit",
      question: session.revisit,
      nudge: "End with a memory action that can be checked tomorrow.",
    },
  ];
}

export function GeographyTalkRoom({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay, setActiveDay] = useState(resolveSession(initialDay).day);
  const [mentorMode, setMentorMode] = useState<MentorMode>("Cause-effect");
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [confidence, setConfidence] = useState<Confidence>("Working");
  const [answerDraft, setAnswerDraft] = useState("");
  const [challengeDraft, setChallengeDraft] = useState("");
  const [discussionStep, setDiscussionStep] = useState<GeographyTalkDiscussionStep>("explain");
  const [assessment, setAssessment] = useState<GeographyAssessment | null>(null);
  const [maicDiscussion, setMaicDiscussion] = useState<GeographyMaicDiscussion | null>(null);
  const [savedReflection, setSavedReflection] = useState(false);
  const [revisionQueued, setRevisionQueued] = useState(false);
  const [hydratedDay, setHydratedDay] = useState<number | null>(null);

  const activeSession = resolveSession(activeDay);
  const promptLadder = useMemo(() => buildPromptLadder(activeSession, mentorMode), [activeSession, mentorMode]);
  const activePrompt = promptLadder[activePromptIndex];
  const subtopics = useMemo(() => getGeographySubtopics(activeSession), [activeSession]);
  const compressedRecap = useMemo(() => getCompressedGeographyRecap(activeSession), [activeSession]);
  const labSlug = labSlugForGeographySession(activeSession.lab);
  const watchHref = `/upsc/geography/watch?day=${activeSession.day}`;
  const activeProgress = getDayProgress(activeSession.day);
  const watchScenes = useMemo(() => buildGeographyWatchScenes(activeSession), [activeSession]);
  const watchProofCount = Math.min(activeProgress?.watchSceneCompletedIds?.length ?? (activeProgress?.watched ? watchScenes.length : 0), watchScenes.length);
  const isWatchComplete = Boolean(activeProgress?.watched) && watchProofCount >= watchScenes.length;
  const peerChallenge = maicDiscussion?.turns.find((turn) => turn.role === "Peer Challenger");
  const examinerTurn = maicDiscussion?.turns.find((turn) => turn.role === "UPSC Examiner");
  const challengeScaffold = assessment ? buildGeographyChallengeScaffold(activeSession, assessment) : "";
  const watchHandoffSummary = activeProgress?.watchHandoffSummary?.trim() ?? "";
  const answerWordCount = answerDraft.trim().split(/\s+/).filter(Boolean).length;

  const progress = Math.round(((activePromptIndex + 1) / promptLadder.length) * 100);
  const revisitHref = `/upsc/geography/revisit?day=${activeSession.day}`;
  const labHref = `/upsc/geography/lab?mode=${activeProgress?.labMode ?? labSlug}&day=${activeSession.day}`;
  const mcqHref = `/upsc/geography/mcq-readiness?day=${activeSession.day}`;
  const isLabCompleted = Boolean(activeProgress?.labCompleted);
  const unlockStage = assessment ? getGeographyTalkUnlockStage(assessment) : null;
  const isFinalVerdict = Boolean(assessment && discussionStep === "verdict");
  const isChallengePending = Boolean(assessment && discussionStep !== "verdict");
  const isLabUnlocked = isFinalVerdict && (unlockStage === "lab" || unlockStage === "mcq");
  const isMcqScoreReady = isFinalVerdict && unlockStage === "mcq";
  const isMcqUnlocked = isMcqScoreReady && isLabCompleted;
  const routeGateTitle = !isWatchComplete
    ? "Watch room required"
    : !assessment
    ? "Awaiting MAIC oral check"
    : isChallengePending
      ? "Peer challenge pending"
    : unlockStage === "mcq"
      ? isLabCompleted
        ? "MCQ gate unlocked"
        : "Visual Lab required"
      : unlockStage === "lab"
        ? "Visual Lab required"
        : unlockStage === "retry"
          ? "Retry talk after compressed recap"
          : "MCQ locked: revisit first";
  const routeGateDetail = !isWatchComplete
    ? `Complete the class scenes before the AI teacher discussion starts. Current Watch proof: ${watchProofCount}/${watchScenes.length}.`
    : !assessment
    ? "The student must explain the topic in their own words before the next room opens."
    : isChallengePending
      ? "The AI teacher has heard the first answer. Now the peer challenger must test one weak point, and the examiner will only save the final route after reassessment."
    : unlockStage === "mcq"
      ? isLabCompleted
        ? "Teacher, peer challenger, and examiner checks are strong enough for fresh MCQ readiness. Old low-quality MCQs stay out of this loop."
        : "The explanation is strong, but the Visual Lab proof is still required before MCQ readiness opens."
      : unlockStage === "lab"
        ? "The explanation crossed the 70 percent floor. Complete the Visual Lab and save one map/mechanism insight before MCQ readiness."
        : unlockStage === "retry"
          ? "The answer has partial logic, but it needs a compressed recap and another oral attempt before the lab opens."
          : "The explanation is below the required floor. Send the student to compressed recap, then bring them back for another oral check.";
  const routeGateTone = !isWatchComplete ? "locked" : !assessment ? "neutral" : isLabUnlocked ? "unlocked" : "locked";
  const primaryRouteHref = !isWatchComplete ? watchHref : isLabUnlocked ? (isMcqUnlocked ? mcqHref : labHref) : revisitHref;
  const primaryRouteLabel = !isWatchComplete ? "Open Watch room" : isLabUnlocked ? (isMcqUnlocked ? "Open MCQ readiness" : "Open visual lab") : "Open compressed recap";
  const talkSelfHref = `/upsc/geography/talk?day=${activeSession.day}`;
  const handoffDecisionLabel = !isWatchComplete
    ? "Complete Watch room first"
    : !assessment
      ? "Assess explanation first"
      : isChallengePending
        ? "Answer peer challenge"
        : primaryRouteLabel;
  const handoffDecisionRoute = !isWatchComplete
    ? watchHref
    : !assessment || isChallengePending
      ? talkSelfHref
      : primaryRouteHref;
  const currentClassroomStage: GeographyTalkClassroomStage = !isWatchComplete
    ? "watch-proof"
    : !assessment
      ? "student-explain"
      : isChallengePending
        ? "peer-challenge"
        : "examiner-verdict";
  const peerStageState: ProtocolState = !assessment
    ? "Locked"
    : isChallengePending
      ? "Active"
      : unlockStage === "revisit"
        ? "Skipped"
        : "Done";
  const classroomStages: ClassroomStage[] = [
    {
      id: "watch-proof",
      label: "Watch proof",
      detail: isWatchComplete ? `${watchProofCount}/${watchScenes.length} scenes complete` : `${watchProofCount}/${watchScenes.length} scenes pending`,
      state: isWatchComplete ? "Done" : "Active",
      icon: BookOpenCheck,
    },
    {
      id: "student-explain",
      label: "Student explains",
      detail: answerDraft.trim() ? `${answerWordCount} spoken words drafted` : "Own-word explanation required",
      state: !isWatchComplete ? "Locked" : !assessment ? "Active" : "Done",
      icon: MessageCircle,
    },
    {
      id: "peer-challenge",
      label: "Peer challenge",
      detail: isChallengePending ? "Counter-question must be answered" : "Weakest point gets tested",
      state: peerStageState,
      icon: Lightbulb,
    },
    {
      id: "examiner-verdict",
      label: "Examiner verdict",
      detail: isFinalVerdict ? `${assessment?.score ?? 0}% route saved` : "Final route not saved yet",
      state: isFinalVerdict ? "Done" : isChallengePending ? "Ready" : "Locked",
      icon: Gauge,
    },
  ];
  const thresholdCards = [
    { label: "Below 40", detail: "Compressed recap required", tone: "border-[#ef9f27]/45 bg-[#fff4df] text-[#6f4a12]" },
    { label: "40 to 69", detail: "Retry Talk after repair", tone: "border-[#f0d5a8] bg-[#fff9ed] text-[#6f4a12]" },
    { label: "70 to 84", detail: "Visual Lab opens", tone: "border-[#8db7d8] bg-[#edf7ff] text-[#23406f]" },
    { label: "85+", detail: "MCQ score gate ready", tone: "border-[#1d9e75]/45 bg-[#e7f5ee] text-[#085041]" },
  ];
  const talkNextLocked = isWatchComplete && (!assessment || isChallengePending);
  const studentHandoffSteps: GeographyStudentHandoffStep[] = [
    {
      label: "Watch proof",
      detail: `${watchProofCount}/${watchScenes.length} scenes saved`,
      status: isWatchComplete ? "done" : "locked",
    },
    {
      label: "Explain to AI teacher",
      detail: assessment ? `${assessment.score}% ${assessment.band}` : "Own-word explanation required",
      status: !isWatchComplete ? "locked" : assessment ? "done" : "current",
    },
    {
      label: "Peer challenge",
      detail: isChallengePending ? "Answer the weakest point" : isFinalVerdict ? "Challenge resolved" : "Unlocks after first assessment",
      status: !assessment ? "locked" : isChallengePending ? "current" : "done",
    },
    {
      label: "Route decision",
      detail: handoffDecisionLabel,
      status: isFinalVerdict ? "next" : "locked",
    },
  ];

  useEffect(() => {
    if (!isLoaded || hydratedDay === activeDay) return;

    const timer = window.setTimeout(() => {
      const saved = getDayProgress(activeDay);
      const savedMode = saved?.mentorMode ?? "Cause-effect";
      const savedPromptIndex = saved?.activePromptLabel
        ? buildPromptLadder(activeSession, savedMode).findIndex((prompt) => prompt.label === saved.activePromptLabel)
        : 0;

      setMentorMode(savedMode);
      setConfidence(saved?.confidence ?? "Working");
      setAnswerDraft(saved?.reflection?.trim() ? saved.reflection : saved?.watchHandoffSummary ?? "");
      setChallengeDraft(saved?.talkChallengeResponse ?? "");
      setDiscussionStep(saved?.talkDiscussionStep ?? (typeof saved?.talkScore === "number" ? "verdict" : "explain"));
      const savedAssessment =
        typeof saved?.talkScore === "number" || typeof saved?.talkPreliminaryScore === "number"
          ? {
              score: saved.talkScore ?? saved.talkPreliminaryScore ?? 0,
              band: saved.talkBand ?? saved.talkPreliminaryBand ?? "Practice",
              matchedKeywords: [],
              missingKeywords: [],
              summary: saved.assessmentSummary ?? saved.talkPreliminarySummary ?? "Saved local assessment.",
              nextAction:
                (saved.talkUnlockStage ?? saved.talkPreliminaryUnlockStage) === "revisit" || saved.talkBand === "Revisit"
                  ? "Rewatch compressed recap"
                  : (saved.talkUnlockStage ?? saved.talkPreliminaryUnlockStage) === "mcq"
                    ? "Proceed to MCQs"
                    : "Open visual lab",
              rubric: saved.talkRubric ?? saved.talkPreliminaryRubric ?? [],
              repairHints: saved.talkRepairHints ?? saved.talkPreliminaryRepairHints ?? [],
            }
          : null;

      setAssessment(savedAssessment);
      setMaicDiscussion(
        savedAssessment
          ? {
              turns: saved?.talkTranscript ?? buildGeographyMaicDiscussion(activeSession, saved?.reflection ?? "", savedAssessment).turns,
              verdict: saved?.talkVerdict ?? buildGeographyMaicDiscussion(activeSession, saved?.reflection ?? "", savedAssessment).verdict,
              unlockStage: saved?.talkUnlockStage ?? saved?.talkPreliminaryUnlockStage ?? getGeographyTalkUnlockStage(savedAssessment),
              score: savedAssessment.score,
            }
          : null
      );
      setRevisionQueued(saved?.revisitQueued ?? false);
      setActivePromptIndex(savedPromptIndex >= 0 ? savedPromptIndex : 0);
      setSavedReflection(false);
      setHydratedDay(activeDay);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeDay, activeSession, getDayProgress, hydratedDay, isLoaded]);

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), geographySessions.length);
    setActiveDay(boundedDay);
    setHydratedDay(null);
    setActivePromptIndex(0);
    setAnswerDraft("");
    setChallengeDraft("");
    setDiscussionStep("explain");
    setAssessment(null);
    setMaicDiscussion(null);
    setSavedReflection(false);
    setRevisionQueued(false);
    router.replace(`/upsc/geography/talk?day=${boundedDay}`, { scroll: false });
  };

  const goNextPrompt = () => {
    setActivePromptIndex((current) => Math.min(current + 1, promptLadder.length - 1));
    setSavedReflection(false);
  };

  const goPreviousPrompt = () => {
    setActivePromptIndex((current) => Math.max(current - 1, 0));
    setSavedReflection(false);
  };

  const persistCurrentState = (patch: {
    confidence?: Confidence;
    mentorMode?: MentorMode;
    reflection?: string;
    challengeResponse?: string;
    revisitQueued?: boolean;
    assessment?: GeographyAssessment | null;
    discussion?: GeographyMaicDiscussion | null;
    discussionStep?: GeographyTalkDiscussionStep;
    incrementSavedCount?: boolean;
  } = {}) => {
    const existing = getDayProgress(activeSession.day);
    saveDayProgress(activeSession.day, {
      confidence: patch.confidence ?? confidence,
      mentorMode: patch.mentorMode ?? mentorMode,
      reflection: patch.reflection ?? answerDraft,
      talkChallengeResponse: patch.challengeResponse ?? challengeDraft,
      talkDiscussionStep: patch.discussionStep ?? discussionStep,
      activePromptLabel: activePrompt.label,
      revisitQueued: patch.revisitQueued ?? revisionQueued,
      talkScore: patch.assessment === null ? undefined : patch.assessment?.score ?? assessment?.score,
      talkBand: patch.assessment === null ? undefined : patch.assessment?.band ?? assessment?.band,
      assessmentSummary: patch.assessment === null ? undefined : patch.assessment?.summary ?? assessment?.summary,
      talkTranscript: patch.discussion === null ? undefined : patch.discussion?.turns ?? maicDiscussion?.turns,
      talkUnlockStage: patch.discussion === null ? undefined : patch.discussion?.unlockStage ?? maicDiscussion?.unlockStage,
      talkVerdict: patch.discussion === null ? undefined : patch.discussion?.verdict ?? maicDiscussion?.verdict,
      talkRubric: patch.assessment === null ? undefined : patch.assessment?.rubric ?? assessment?.rubric,
      talkRepairHints: patch.assessment === null ? undefined : patch.assessment?.repairHints ?? assessment?.repairHints,
      talkClassroomStage: currentClassroomStage,
      talkNextRoute: handoffDecisionRoute,
      talkNextActionLabel: handoffDecisionLabel,
      savedCount: patch.incrementSavedCount ? (existing?.savedCount ?? 0) + 1 : existing?.savedCount,
    });
  };

  const assessCurrentAnswer = (includeChallenge = false) => {
    const assessmentText = [answerDraft, includeChallenge ? challengeDraft : ""]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\nPeer challenge response:\n");
    const nextAssessment = assessGeographyExplanation(activeSession, assessmentText);
    const nextDiscussion = buildGeographyMaicDiscussion(activeSession, assessmentText, nextAssessment);
    const nextUnlockStage = getGeographyTalkUnlockStage(nextAssessment);
    const isFinalRound = includeChallenge || nextUnlockStage === "revisit";
    const nextConfidence: Confidence = !isFinalRound
      ? "Working"
      : nextUnlockStage === "mcq"
        ? "Command"
        : nextUnlockStage === "revisit"
          ? "Shaky"
          : "Working";
    const nextRevisionQueued = isFinalRound && (nextUnlockStage === "revisit" || nextUnlockStage === "retry");
    const nextDiscussionStep: GeographyTalkDiscussionStep = isFinalRound ? "verdict" : "challenge";
    const nextClassroomStage: GeographyTalkClassroomStage = isFinalRound ? "examiner-verdict" : "peer-challenge";
    const nextRouteHref =
      !isFinalRound
        ? `/upsc/geography/talk?day=${activeSession.day}`
        : nextUnlockStage === "mcq" && isLabCompleted
          ? mcqHref
          : nextUnlockStage === "mcq" || nextUnlockStage === "lab"
            ? labHref
            : revisitHref;
    const nextRouteLabel =
      !isFinalRound
        ? "Answer peer challenge"
        : nextUnlockStage === "mcq" && isLabCompleted
          ? "Open MCQ readiness"
          : nextUnlockStage === "mcq" || nextUnlockStage === "lab"
            ? "Open visual lab"
            : "Open compressed recap";
    const existing = getDayProgress(activeSession.day);

    setAssessment(nextAssessment);
    setMaicDiscussion(nextDiscussion);
    setConfidence(nextConfidence);
    setRevisionQueued(nextRevisionQueued);
    setDiscussionStep(nextDiscussionStep);
    setSavedReflection(true);

    saveDayProgress(activeSession.day, {
      confidence: nextConfidence,
      mentorMode,
      reflection: answerDraft,
      talkChallengeResponse: includeChallenge ? challengeDraft : "",
      talkDiscussionStep: nextDiscussionStep,
      activePromptLabel: activePrompt.label,
      revisitQueued: nextRevisionQueued,
      talkTranscript: nextDiscussion.turns,
      talkVerdict: isFinalRound ? nextDiscussion.verdict : "Peer challenge pending before examiner verdict.",
      talkPreliminaryScore: isFinalRound ? undefined : nextAssessment.score,
      talkPreliminaryBand: isFinalRound ? undefined : nextAssessment.band,
      talkPreliminarySummary: isFinalRound ? undefined : nextAssessment.summary,
      talkPreliminaryUnlockStage: isFinalRound ? undefined : nextUnlockStage,
      talkPreliminaryRubric: isFinalRound ? undefined : nextAssessment.rubric,
      talkPreliminaryRepairHints: isFinalRound ? undefined : nextAssessment.repairHints,
      talkScore: isFinalRound ? nextAssessment.score : undefined,
      talkBand: isFinalRound ? nextAssessment.band : undefined,
      assessmentSummary: isFinalRound ? nextAssessment.summary : undefined,
      talkUnlockStage: isFinalRound ? nextDiscussion.unlockStage : undefined,
      talkRubric: isFinalRound ? nextAssessment.rubric : undefined,
      talkRepairHints: isFinalRound ? nextAssessment.repairHints : undefined,
      talkClassroomStage: nextClassroomStage,
      talkNextRoute: nextRouteHref,
      talkNextActionLabel: nextRouteLabel,
      savedCount: (existing?.savedCount ?? 0) + 1,
    });
  };

  const loadChallengeScaffold = () => {
    if (!challengeScaffold) return;
    setChallengeDraft(challengeScaffold);
    setDiscussionStep("challenge");
    setSavedReflection(false);
  };

  const loadWatchHandoff = () => {
    if (!watchHandoffSummary) return;
    setAnswerDraft(watchHandoffSummary);
    setChallengeDraft("");
    setDiscussionStep("explain");
    setAssessment(null);
    setMaicDiscussion(null);
    setSavedReflection(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading Geography Talk room...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> Geography command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Socratic Talk</Badge>
              <span className="text-sm font-bold text-[#776f64]">Day {activeSession.day} conversation</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">{activeSession.chapter}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Day", `${activeSession.day}/30`],
                ["Mode", mentorMode],
                ["Confidence", confidence],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
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
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Prompt ladder</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">{activePrompt.label}</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                <BrainCircuit className="h-5 w-5" />
              </div>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${progress}%` }} />
            </div>

            <div className="grid gap-2 sm:grid-cols-5">
              {promptLadder.map((prompt, index) => {
                const isActive = activePromptIndex === index;
                return (
                  <button
                    key={prompt.label}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setActivePromptIndex(index);
                      setSavedReflection(false);
                    }}
                    className={cn(
                      "min-h-14 rounded-md border px-3 text-left text-xs font-black transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    {index + 1}. {prompt.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-black text-[#085041]">Question</p>
              </div>
              <p className="text-lg font-black leading-8 text-[#13251d]">{activePrompt.question}</p>
              <div className="mt-4 flex items-start gap-3 rounded-md bg-white/75 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#ef9f27]" />
                <p className="text-sm font-semibold leading-6 text-[#49675e]">{activePrompt.nudge}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">AI teacher</p>
                <p className="mt-3 text-sm font-bold leading-6 text-[#34453b]">
                  Explain the topic back to me using cause, location, example, and one UPSC trap. I will decide whether MCQs open or revision starts.
                </p>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Student must cover</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {subtopics.map((topic) => (
                    <span key={topic} className="rounded-md border border-[#cfc6b6] bg-white px-2 py-1 text-xs font-black text-[#1a3a2a]">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {mentorModes.map((mode) => {
                  const isActive = mentorMode === mode;
                  return (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setMentorMode(mode);
                      persistCurrentState({ mentorMode: mode });
                    }}
                    className={cn(
                      "min-h-12 rounded-md border px-3 text-left text-sm font-black transition",
                      isActive
                        ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#5f665f] hover:border-[#1d9e75]"
                    )}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <GeographyStudentHandoffStrip
          testId="talk"
          activeDay={activeSession.day}
          title="You are in Talk. Prove recall before the map lab."
          detail="The AI teacher listens for concept, mechanism, map/example, and one UPSC trap. A peer challenge must be answered before the route is saved."
          previous={{
            label: "Watch room",
            detail: "Go back to Watch if the lecture recap or class-scene proof is incomplete.",
            href: watchHref,
          }}
          next={{
            label: handoffDecisionLabel,
            detail: !isWatchComplete
              ? "Watch proof is missing, so the only safe route is back to the class room."
              : !assessment
                ? "Assess the student's explanation before opening the next room."
                : isChallengePending
                  ? "Answer the peer challenge and ask the examiner to reassess."
                  : routeGateDetail,
            href: handoffDecisionRoute,
            locked: talkNextLocked,
          }}
          steps={studentHandoffSteps}
        />

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Discussion gate</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">AI teacher oral check</h2>
              </div>
              <MapPinned className="h-6 w-6 text-[#085041]" />
            </div>

            <div data-testid="talk-discussion-window" className="mb-5 grid gap-3">
              <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#085041]">AI teacher</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#254438]">
                      First explain the mechanism. Then attach a map/example. End with one UPSC statement trap.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#1a3a2a] ring-1 ring-[#dcd5c7]">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#776f64]">Student response</p>
                    <p className="mt-1 break-words text-sm font-bold leading-6 text-[#34453b]">
                      {answerDraft.trim()
                        ? `${answerDraft.trim().slice(0, 180)}${answerDraft.trim().length > 180 ? "..." : ""}`
                        : "Write the response below. The gate will stay closed until an explanation is assessed."}
                    </p>
                  </div>
                </div>
              </div>
              <div data-testid="talk-maic-role-cycle" className="grid gap-2 md:grid-cols-4">
                {[
                  ["AI Teacher", "Ask for concept and mechanism", BrainCircuit],
                  ["Peer Challenger", "Attack the weakest point", MessageCircle],
                  ["UPSC Examiner", "Score five classroom skills", Gauge],
                  ["Learning Summarizer", "Compress memory for next room", BookOpenCheck],
                ].map(([role, action, Icon]) => (
                  <div key={String(role)} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                    <Icon className="mb-2 h-4 w-4 text-[#1d9e75]" />
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{String(role)}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#49675e]">{String(action)}</p>
                  </div>
                ))}
              </div>
              <div data-testid="talk-classroom-protocol" className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Interactive classroom protocol</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">Watch to Talk to next room</h3>
                  </div>
                  <span className="rounded-md bg-[#f7f4ee] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#49675e]">
                    {currentClassroomStage.replace("-", " ")}
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  {classroomStages.map((stage, index) => (
                    <div
                      key={stage.id}
                      data-testid={`talk-stage-${stage.id}`}
                      className={cn(
                        "rounded-md border p-3",
                        stage.state === "Done" && "border-[#1d9e75]/45 bg-[#e7f5ee]",
                        stage.state === "Active" && "border-[#1a3a2a] bg-[#f7f4ee]",
                        stage.state === "Ready" && "border-[#8db7d8] bg-[#edf7ff]",
                        stage.state === "Locked" && "border-[#dcd5c7] bg-[#fbf8f0] opacity-80",
                        stage.state === "Skipped" && "border-[#f0d5a8] bg-[#fff9ed]"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <stage.icon className="h-4 w-4 text-[#1d9e75]" />
                        <span className="text-[11px] font-black text-[#8c5d14]">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{stage.label}</p>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#746f66]">{stage.state}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">{stage.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-4">
                  {thresholdCards.map((item) => (
                    <div key={item.label} className={cn("rounded-md border px-3 py-2", item.tone)}>
                      <p className="text-xs font-black uppercase tracking-[0.14em]">{item.label}</p>
                      <p className="mt-1 text-xs font-bold leading-5">{item.detail}</p>
                    </div>
                  ))}
                </div>
                <div data-testid="talk-next-handoff" className="mt-4 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#085041]">
                      Next decision: {handoffDecisionLabel}
                    </p>
                    <p className="text-xs font-bold text-[#49675e]">
                      Saved route target: {handoffDecisionRoute}
                    </p>
                  </div>
                </div>
              </div>
              {maicDiscussion && (
                <div data-testid="maic-discussion-turns" className="grid gap-3 md:grid-cols-2">
                  {maicDiscussion.turns.map((turn) => (
                    <div
                      key={`${turn.role}-${turn.title}`}
                      className={cn(
                        "rounded-lg border p-4",
                        turn.tone === "teacher" && "border-[#cfe5dc] bg-[#e7f5ee]",
                        turn.tone === "peer" && "border-[#d9d4f0] bg-[#f1efff]",
                        turn.tone === "examiner" && "border-[#f0d5a8] bg-[#fff4df]",
                        turn.tone === "summarizer" && "border-[#dcd5c7] bg-white"
                      )}
                    >
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{turn.role}</p>
                      <h3 className="mt-2 text-sm font-black text-[#13251d]">{turn.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#34453b]">{turn.message}</p>
                    </div>
                  ))}
                </div>
              )}
              {maicDiscussion && (
                <div data-testid="talk-peer-challenge" className="rounded-lg border border-[#d9d4f0] bg-[#f8f6ff] p-4">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5b4ba8]">Peer challenge round</p>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">
                        Answer the counter-question
                      </h3>
                    </div>
                    <span className="rounded-md bg-white px-3 py-2 text-xs font-black text-[#5b4ba8] ring-1 ring-[#d9d4f0]">
                      {discussionStep === "verdict" ? "Examiner verdict saved" : "Challenge pending"}
                    </span>
                  </div>
                  <p className="rounded-md bg-white/80 p-3 text-sm font-bold leading-6 text-[#34453b]">
                    {peerChallenge?.message ?? "Connect the weak concept to one map, one example, and one UPSC trap."}
                  </p>
                  {challengeScaffold && (
                    <div data-testid="talk-challenge-scaffold" className="mt-3 rounded-md border border-[#d9d4f0] bg-white/80 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5b4ba8]">Suggested repair frame</p>
                          <p className="mt-2 break-words text-xs font-bold leading-5 text-[#5f5b73]">{challengeScaffold}</p>
                        </div>
                        <button
                          type="button"
                          data-testid="talk-load-challenge-scaffold"
                          onClick={loadChallengeScaffold}
                          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#d9d4f0] bg-white px-3 text-xs font-black text-[#5b4ba8] transition hover:bg-[#f1efff]"
                        >
                          <Lightbulb className="h-4 w-4" /> Load
                        </button>
                      </div>
                    </div>
                  )}
                  <textarea
                    data-testid="talk-challenge-response"
                    value={challengeDraft}
                    onChange={(event) => {
                      setChallengeDraft(event.target.value);
                      setDiscussionStep("challenge");
                      setSavedReflection(false);
                    }}
                    placeholder="Answer the peer challenge. Add the missing map/example/trap here, then ask the examiner to reassess."
                    className="mt-4 min-h-28 w-full resize-y rounded-lg border border-[#d9d4f0] bg-white p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#5b4ba8] focus:ring-2 focus:ring-[#5b4ba8]/20"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-xl text-xs font-bold leading-5 text-[#5f5b73]">
                      {examinerTurn?.message ?? "The examiner will combine the first answer and this challenge response for the final local score."}
                    </p>
                    <button
                      type="button"
                      data-testid="talk-reassess-challenge"
                      onClick={() => assessCurrentAnswer(true)}
                      disabled={challengeDraft.trim().length < 20}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5b4ba8] px-3 text-sm font-bold text-white transition hover:bg-[#46398b] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Gauge className="h-4 w-4" /> Reassess with challenge
                    </button>
                  </div>
                </div>
              )}
              {assessment && (
                <div data-testid="talk-teacher-verdict" className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white",
                        isLabUnlocked ? "bg-[#1d9e75]" : "bg-[#9a6a16]"
                      )}
                    >
                      {isLabUnlocked ? <UnlockKeyhole className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">AI teacher verdict</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-[#34453b]">
                        {isChallengePending
                          ? "Good start. The peer challenger must now test one weak point before the examiner saves the final route."
                          : isMcqUnlocked
                          ? "Good. You may move to fresh MCQ readiness for this topic."
                          : isLabUnlocked
                            ? "Good. Move to the Visual Lab and prove the idea through map or mechanism."
                            : "Pause. Revisit the compressed recap, then return and explain again."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {watchHandoffSummary && (
              <div data-testid="talk-watch-recap-handoff" className="mb-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Watch recap handoff</p>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#34453b]">{watchHandoffSummary}</p>
                  </div>
                  <button
                    type="button"
                    data-testid="talk-load-watch-recap"
                    onClick={loadWatchHandoff}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#1d9e75]/30 bg-white px-3 text-sm font-black text-[#085041] transition hover:bg-[#f7f4ee]"
                  >
                    <BookOpenCheck className="h-4 w-4" /> Use recap
                  </button>
                </div>
              </div>
            )}

            <textarea
              data-testid="talk-answer-draft"
              value={answerDraft}
              onChange={(event) => {
                setAnswerDraft(event.target.value);
                setChallengeDraft("");
                setDiscussionStep("explain");
                setAssessment(null);
                setMaicDiscussion(null);
                setSavedReflection(false);
              }}
              placeholder="Write the explanation in your own words. Start with cause, then mechanism, then example."
              className="min-h-48 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  persistCurrentState({ incrementSavedCount: true });
                  setSavedReflection(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
              >
                <Save className="h-4 w-4" /> Save reflection
              </button>
              <button
                type="button"
                onClick={() => assessCurrentAnswer(false)}
                disabled={!isWatchComplete || answerDraft.trim().length < 20}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-3 text-sm font-bold text-white transition hover:bg-[#087a59] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Gauge className="h-4 w-4" /> Assess explanation
              </button>
              <button
                type="button"
                onClick={goPreviousPrompt}
                disabled={activePromptIndex === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={goNextPrompt}
                disabled={activePromptIndex === promptLadder.length - 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next prompt <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {savedReflection && (
              <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                <p className="text-sm font-bold leading-6 text-[#085041]">
                  Reflection saved to the local learner profile and included in Track.
                </p>
              </div>
            )}

            {assessment && (
              <div className="mt-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">AI teacher assessment</p>
                    <h3 className="mt-2 text-2xl font-black text-[#13251d]">{assessment.score}% / {assessment.band}</h3>
                  </div>
                  <div className="rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
                    {assessment.nextAction}
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-[#49675e]">{assessment.summary}</p>
                {assessment.rubric.length > 0 && (
                  <div data-testid="talk-rubric-board" className="mt-4 grid gap-2 md:grid-cols-5">
                    {assessment.rubric.map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          "rounded-md border p-3",
                          item.status === "Ready" && "border-[#1d9e75]/40 bg-white/80",
                          item.status === "Forming" && "border-[#f0d5a8] bg-[#fff9ed]",
                          item.status === "Weak" && "border-[#ef9f27]/50 bg-[#fff4df]"
                        )}
                      >
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                        <p className="mt-2 text-lg font-black text-[#13251d]">
                          {item.score}/{item.max}
                        </p>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#746f66]">{item.status}</p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-[#657066]">{item.evidence}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-white/75 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Matched logic</p>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#34453b]">
                      {assessment.matchedKeywords.length > 0 ? assessment.matchedKeywords.join(", ") : "Not enough core keywords yet."}
                    </p>
                  </div>
                  <div className="rounded-md bg-white/75 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ef9f27]">Repair next</p>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#34453b]">
                      {assessment.missingKeywords.length > 0 ? assessment.missingKeywords.join(", ") : "No major keyword gaps detected."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              data-testid="talk-route-gate"
              className={cn(
                "mt-4 rounded-lg border p-4",
                routeGateTone === "unlocked" && "border-[#1d9e75]/45 bg-[#e7f5ee]",
                routeGateTone === "locked" && "border-[#ef9f27]/45 bg-[#fff4df]",
                routeGateTone === "neutral" && "border-[#dcd5c7] bg-[#fdfaf3]"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white",
                      routeGateTone === "unlocked" && "bg-[#1d9e75]",
                      routeGateTone === "locked" && "bg-[#9a6a16]",
                      routeGateTone === "neutral" && "bg-[#1a3a2a]"
                    )}
                  >
                    {routeGateTone === "unlocked" ? (
                      <UnlockKeyhole className="h-4 w-4" />
                    ) : routeGateTone === "locked" ? (
                      <LockKeyhole className="h-4 w-4" />
                    ) : (
                      <BookOpenCheck className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Route decision</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">{routeGateTitle}</h3>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{routeGateDetail}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isWatchComplete ? (
                    <Link
                      data-testid="talk-primary-route"
                      href={primaryRouteHref}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#9a6a16] px-3 text-sm font-black text-white transition hover:bg-[#7f5410]"
                    >
                      {primaryRouteLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : assessment && !isChallengePending ? (
                    <Link
                      data-testid="talk-primary-route"
                      href={primaryRouteHref}
                      className={cn(
                        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black text-white transition",
                        isLabUnlocked ? "bg-[#1a3a2a] hover:bg-[#10291d]" : "bg-[#9a6a16] hover:bg-[#7f5410]"
                      )}
                    >
                      {primaryRouteLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : assessment && isChallengePending ? (
                    <button
                      type="button"
                      disabled
                      data-testid="talk-primary-route"
                      className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md bg-[#d6cec0] px-3 text-sm font-black text-[#7b7164]"
                    >
                      Answer challenge first
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md bg-[#d6cec0] px-3 text-sm font-black text-[#7b7164]"
                    >
                      Assess first
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Confidence check</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">How solid is this concept?</h2>

              <div className="mt-5 grid gap-2">
                {confidenceOptions.map((option) => {
                  const isActive = confidence === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setConfidence(option);
                        persistCurrentState({ confidence: option });
                      }}
                      className={cn(
                        "flex min-h-12 items-center justify-between rounded-md border px-3 text-left transition",
                        isActive
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                      )}
                    >
                      <span className="text-sm font-black">{option}</span>
                      {isActive && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextValue = !revisionQueued;
                  setRevisionQueued(nextValue);
                  persistCurrentState({ revisitQueued: nextValue });
                }}
                className={cn(
                  "mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition",
                  revisionQueued
                    ? "bg-[#e7f5ee] text-[#085041] ring-1 ring-[#1d9e75]/30"
                    : "bg-[#1a3a2a] text-white hover:bg-[#10291d]"
                )}
              >
                <RefreshCcw className="h-4 w-4" />
                {revisionQueued ? "Queued for revisit" : "Queue for revisit"}
              </button>

              {assessment?.band === "Revisit" && (
                <div className="mt-5 rounded-lg border border-[#ef9f27]/40 bg-[#fff4df] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a6a16]">Compressed revisit</p>
                  <div className="mt-3 grid gap-2">
                    {compressedRecap.slice(0, 3).map((line) => (
                      <p key={line} className="rounded-md bg-white/70 p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <GeographyLoopActions activeDay={activeSession.day} labSlug={labSlug} current="talk" onSelectDay={selectDay} />
          </div>
        </section>
      </div>
    </div>
  );
}
