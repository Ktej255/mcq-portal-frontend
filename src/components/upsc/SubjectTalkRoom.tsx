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
  MessageCircle,
  RefreshCcw,
  Save,
  UnlockKeyhole,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import { getDisasterManagementLearningPack } from "@/lib/upsc/disasterManagementLearningDecks";
import { getEconomyLearningPack } from "@/lib/upsc/economyLearningDecks";
import { getEnvironmentLearningPack } from "@/lib/upsc/environmentLearningDecks";
import { getHistoryLearningPack } from "@/lib/upsc/historyLearningDecks";
import { getInternalSecuritySocietyLearningPack } from "@/lib/upsc/internalSecuritySocietyLearningDecks";
import { getPolityGovernanceLearningPack } from "@/lib/upsc/polityGovernanceLearningDecks";
import { getScienceTechLearningPack } from "@/lib/upsc/scienceTechLearningDecks";
import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import {
  assessSubjectExplanation,
  buildSubjectMaicDiscussion,
  getCompressedSubjectRecap,
  getSubjectSubtopics,
  getSubjectTalkUnlockStage,
  SubjectAssessment,
  SubjectMaicDiscussion,
} from "@/lib/upsc/subjectLearning";
import { getSubjectLabProofCompletion } from "@/lib/upsc/subjectProgressGates";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import {
  type SubjectConfidence,
  type SubjectMentorMode,
  type SubjectTalkClassroomStage,
  type SubjectTalkDiscussionStep,
  useSubjectProgress,
} from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

const confidenceOptions: SubjectConfidence[] = ["Shaky", "Working", "Command"];
const mentorModes: SubjectMentorMode[] = ["Concept logic", "Cause-effect", "UPSC trap"];

const classroomStageLabels: Record<SubjectTalkClassroomStage, string> = {
  "teacher-brief": "Teacher brief",
  "student-explain": "Student explain",
  "peer-challenge": "Peer challenge",
  "examiner-verdict": "Examiner verdict",
};

function buildPromptLadder(session: SubjectSession, mode: SubjectMentorMode) {
  const modeLens = {
    "Concept logic": "Keep answering through definition, relationship, example, and exception.",
    "Cause-effect": "Keep answering through cause, mechanism, consequence, and response.",
    "UPSC trap": "Keep answering through statement traps, pair matching, and overgeneralization risk.",
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
      question: `Give one India, world, policy, report, map, or current-affairs example where "${session.title}" appears.`,
      nudge: "Force the idea into a place, institution, species, report, rule, event, or policy.",
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

export function SubjectTalkRoom({ plan, initialDay }: { plan: SubjectSprintPlan; initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useSubjectProgress(plan.slug, plan.sessions);
  const [activeDay, setActiveDay] = useState(initialDay ?? 1);
  const [mentorMode, setMentorMode] = useState<SubjectMentorMode>("Cause-effect");
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [confidence, setConfidence] = useState<SubjectConfidence>("Working");
  const [answerDraft, setAnswerDraft] = useState("");
  const [challengeDraft, setChallengeDraft] = useState("");
  const [discussionStep, setDiscussionStep] = useState<SubjectTalkDiscussionStep>("explain");
  const [assessment, setAssessment] = useState<SubjectAssessment | null>(null);
  const [maicDiscussion, setMaicDiscussion] = useState<SubjectMaicDiscussion | null>(null);
  const [savedReflection, setSavedReflection] = useState(false);
  const [revisionQueued, setRevisionQueued] = useState(false);
  const [hydratedDay, setHydratedDay] = useState<number | null>(null);

  const activeSession = plan.sessions.find((session) => session.day === activeDay) ?? plan.sessions[0];
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
  const learningPack =
    environmentPack ??
    economyPack ??
    disasterManagementPack ??
    scienceTechPack ??
    polityGovernancePack ??
    internalSecuritySocietyPack ??
    historyPack;
  const promptLadder = useMemo(() => buildPromptLadder(activeSession, mentorMode), [activeSession, mentorMode]);
  const activePrompt = promptLadder[activePromptIndex];
  const subtopics = useMemo(() => getSubjectSubtopics(activeSession), [activeSession]);
  const compressedRecap = useMemo(() => getCompressedSubjectRecap(activeSession), [activeSession]);
  const peerChallenge = maicDiscussion?.turns.find((turn) => turn.role === "Peer Challenger");
  const examinerTurn = maicDiscussion?.turns.find((turn) => turn.role === "UPSC Examiner");
  const progress = Math.round(((activePromptIndex + 1) / promptLadder.length) * 100);
  const basePath = `/upsc/${plan.slug}`;
  const revisitHref = `${basePath}/revisit?day=${activeSession.day}`;
  const activeLab = plan.labs.find((lab) => lab.title === activeSession.lab) ?? plan.labs[0];
  const labHref = `${basePath}/lab?mode=${getDayProgress(activeSession.day)?.labMode ?? activeLab?.slug ?? ""}&day=${activeSession.day}`;
  const mcqHref = `${basePath}/mcq-readiness?day=${activeSession.day}`;
  const labProofCompletion = getSubjectLabProofCompletion(getDayProgress(activeSession.day));
  const isLabCompleted = labProofCompletion.complete;
  const unlockStage = assessment ? getSubjectTalkUnlockStage(assessment) : null;
  const isChallengePending = Boolean(assessment && maicDiscussion && discussionStep === "challenge");
  const isLabUnlocked = unlockStage === "lab" || unlockStage === "mcq";
  const isMcqScoreReady = unlockStage === "mcq";
  const isMcqUnlocked = isMcqScoreReady && isLabCompleted;
  const routeGateTitle = !assessment
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
          : "Revisit required";
  const routeGateDetail = !assessment
    ? "The student must explain the topic in their own words before the next room opens."
    : isChallengePending
      ? "The AI teacher has created the counter-question. The student must answer the peer challenge before the final examiner verdict opens the next room."
    : unlockStage === "mcq"
      ? isLabCompleted
        ? "Teacher, peer challenger, and examiner checks are strong enough for fresh MCQ readiness. Old low-quality MCQs stay out of this loop."
        : `The explanation is strong, but the Visual Lab proof engine is still required before MCQ readiness opens: ${labProofCompletion.completed}/${labProofCompletion.target} proofs saved.`
      : unlockStage === "lab"
        ? "The explanation crossed the 70 percent floor. Complete the Visual Lab and save one applied insight before MCQ readiness."
        : unlockStage === "retry"
          ? "The answer has partial logic, but it needs a compressed recap and another oral attempt before the lab opens."
          : "The explanation is below the required floor. Send the student to compressed recap, then bring them back for another oral check.";
  const routeGateTone = !assessment ? "neutral" : isChallengePending ? "locked" : isLabUnlocked ? "unlocked" : "locked";
  const primaryRouteHref = isLabUnlocked ? (isMcqUnlocked ? mcqHref : labHref) : revisitHref;
  const primaryRouteLabel = isLabUnlocked ? (isMcqUnlocked ? "Open MCQ readiness" : "Open visual lab") : "Open compressed recap";
  const talkClassroomStage: SubjectTalkClassroomStage = assessment
    ? isChallengePending
      ? "peer-challenge"
      : "examiner-verdict"
    : answerDraft.trim().length > 0
      ? "student-explain"
      : "teacher-brief";
  const talkNextRoute = !assessment || isChallengePending ? `${basePath}/talk?day=${activeSession.day}` : primaryRouteHref;
  const talkNextActionLabel = !assessment
    ? "Assess explanation first"
    : isChallengePending
      ? "Answer peer challenge"
      : primaryRouteLabel;
  const themeStyle = getSubjectThemeStyle(plan);

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
      setAnswerDraft(saved?.reflection ?? "");
      setChallengeDraft(saved?.talkChallengeResponse ?? "");
      setDiscussionStep(saved?.talkDiscussionStep ?? (typeof saved?.talkScore === "number" ? "verdict" : "explain"));
      const savedAssessment =
        typeof saved?.talkScore === "number"
          ? {
              score: saved.talkScore,
              band: saved.talkBand ?? "Practice",
              matchedKeywords: [],
              missingKeywords: [],
              summary: saved.assessmentSummary ?? "Saved local assessment.",
              nextAction:
                saved.talkUnlockStage === "revisit" || saved.talkBand === "Revisit"
                  ? "Rewatch compressed recap"
                  : saved.talkUnlockStage === "mcq"
                    ? "Proceed to MCQs"
                    : "Open visual lab",
            }
          : null;

      setAssessment(savedAssessment);
      setMaicDiscussion(
        savedAssessment
          ? {
              turns: saved?.talkTranscript ?? buildSubjectMaicDiscussion(activeSession, saved?.reflection ?? "", savedAssessment).turns,
              verdict: saved?.talkVerdict ?? buildSubjectMaicDiscussion(activeSession, saved?.reflection ?? "", savedAssessment).verdict,
              unlockStage: saved?.talkUnlockStage ?? getSubjectTalkUnlockStage(savedAssessment),
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
    const boundedDay = Math.min(Math.max(day, 1), plan.sessions.length);
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
    router.replace(`${basePath}/talk?day=${boundedDay}`, { scroll: false });
  };

  const persistCurrentState = (patch: {
    confidence?: SubjectConfidence;
    mentorMode?: SubjectMentorMode;
    reflection?: string;
    challengeResponse?: string;
    revisitQueued?: boolean;
    assessment?: SubjectAssessment | null;
    discussion?: SubjectMaicDiscussion | null;
    discussionStep?: SubjectTalkDiscussionStep;
    classroomStage?: SubjectTalkClassroomStage;
    nextRoute?: string;
    nextActionLabel?: string;
    preliminaryScore?: number;
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
      talkClassroomStage: patch.classroomStage ?? talkClassroomStage,
      talkNextRoute: patch.nextRoute ?? talkNextRoute,
      talkNextActionLabel: patch.nextActionLabel ?? talkNextActionLabel,
      talkPreliminaryScore: patch.preliminaryScore,
      savedCount: patch.incrementSavedCount ? (existing?.savedCount ?? 0) + 1 : existing?.savedCount,
    });
  };

  const assessCurrentAnswer = (includeChallenge = false) => {
    const assessmentText = [answerDraft, includeChallenge ? challengeDraft : ""]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\nPeer challenge response:\n");
    const nextAssessment = assessSubjectExplanation(
      activeSession,
      assessmentText,
      learningPack
        ? {
            extraKeywords: learningPack.keywords,
            appliedSignals: [...learningPack.caseAnchors, ...learningPack.causeChain],
          }
        : undefined
    );
    const baseDiscussion = buildSubjectMaicDiscussion(activeSession, assessmentText, nextAssessment);
    const nextDiscussion = learningPack
      ? {
          ...baseDiscussion,
          turns: baseDiscussion.turns.map((turn) => {
            if (turn.role === "AI Teacher") {
              return {
                ...turn,
                message:
                  plan.slug === "history"
                    ? `${turn.message} Run the History oral check through chronology, source or map proof, actor or institution, consequence, and trap. Chain: ${learningPack.causeChain.join(" -> ")}.`
                    : `${turn.message} Use the ${plan.title} chain: ${learningPack.causeChain.join(" -> ")}.`,
              };
            }
            if (turn.role === "Peer Challenger") {
              return {
                ...turn,
                message:
                  plan.slug === "history"
                    ? `Challenge through ${learningPack.lens}: force one source-map-personality proof from ${learningPack.caseAnchors.join(", ")} and expose this trap: ${learningPack.trapBank[0]}`
                    : `Challenge through ${learningPack.lens}: attach one of ${learningPack.caseAnchors.join(", ")} and avoid this trap: ${learningPack.trapBank[0]}`,
              };
            }
            if (turn.role === "UPSC Examiner" && plan.slug === "history") {
              return {
                ...turn,
                message: `${turn.message} History score gate requires chronology, source/map, actor/institution, consequence, and one almost-correct UPSC trap before forward movement.`,
              };
            }
            if (turn.role === "Learning Summarizer" && plan.slug === "history") {
              return {
                ...turn,
                message: `${turn.message} Compress this into a six-minute revision loop before the next History room.`,
              };
            }
            return turn;
          }),
        }
      : baseDiscussion;
    const nextUnlockStage = getSubjectTalkUnlockStage(nextAssessment);
    const nextDiscussionStep: SubjectTalkDiscussionStep =
      includeChallenge || nextUnlockStage === "revisit" ? "verdict" : "challenge";
    const nextClassroomStage: SubjectTalkClassroomStage =
      nextDiscussionStep === "challenge" ? "peer-challenge" : "examiner-verdict";
    const nextIsLabUnlocked = nextUnlockStage === "lab" || nextUnlockStage === "mcq";
    const nextIsMcqUnlocked = nextUnlockStage === "mcq" && isLabCompleted;
    const nextRoute = nextDiscussionStep === "challenge"
      ? `${basePath}/talk?day=${activeSession.day}`
      : nextIsLabUnlocked
        ? nextIsMcqUnlocked
          ? mcqHref
          : labHref
        : revisitHref;
    const nextActionLabel = nextDiscussionStep === "challenge"
      ? "Answer peer challenge"
      : nextIsLabUnlocked
        ? nextIsMcqUnlocked
          ? "Open MCQ readiness"
          : "Open visual lab"
        : "Open compressed recap";
    const nextConfidence: SubjectConfidence =
      nextUnlockStage === "mcq" ? "Command" : nextUnlockStage === "revisit" ? "Shaky" : "Working";
    const nextRevisionQueued = nextUnlockStage === "revisit" || nextUnlockStage === "retry";

    setAssessment(nextAssessment);
    setMaicDiscussion(nextDiscussion);
    setConfidence(nextConfidence);
    setRevisionQueued(nextRevisionQueued);
    setDiscussionStep(nextDiscussionStep);
    setSavedReflection(true);
    persistCurrentState({
      confidence: nextConfidence,
      challengeResponse: challengeDraft,
      revisitQueued: nextRevisionQueued,
      assessment: nextAssessment,
      discussion: nextDiscussion,
      discussionStep: nextDiscussionStep,
      classroomStage: nextClassroomStage,
      nextRoute,
      nextActionLabel,
      preliminaryScore: nextDiscussionStep === "challenge" ? nextAssessment.score : undefined,
      incrementSavedCount: true,
    });
  };

  if (!isLoaded) {
    return (
      <div style={themeStyle} className="flex min-h-screen items-center justify-center bg-[var(--subject-bg)] text-[var(--subject-text)]">
        <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-6 text-sm font-black">
          Loading {plan.title} Talk room...
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="subject-room-shell"
      data-room="talk"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
            <Link href={basePath} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
              <ArrowLeft className="h-4 w-4" /> {plan.title} command room
            </Link>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">Socratic Talk</Badge>
              <span className="text-sm font-bold text-[#776f64]">Day {activeSession.day} conversation</span>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--subject-accent)]">{activeSession.chapter}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Day", `${activeSession.day}/${plan.sessions.length}`],
                ["Mode", mentorMode],
                ["Confidence", confidence],
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

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
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
                  Explain the topic back with concept, mechanism, example, and one UPSC trap. I will decide whether MCQs open or revision starts.
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
            {learningPack ? (
              <div
                data-testid={`${plan.slug}-talk-teacher-pack`}
                className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">
                      {plan.title} oral rubric
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">
                      {learningPack.lens}
                    </h3>
                  </div>
                  <span className="max-w-full break-words rounded-md bg-[#e7f5ee] px-3 py-2 text-xs font-black text-[#085041] ring-1 ring-[#1d9e75]/20 sm:shrink-0">
                    AI teacher focus
                  </span>
                </div>
                <p className="text-sm font-bold leading-6 text-[#49675e]">{learningPack.teacherFocus}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-[#f7f4ee] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                      Student must speak
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {learningPack.oralChecklist.map((item) => (
                        <span
                          key={item}
                          className="rounded-md bg-white px-2 py-1 text-xs font-black text-[#1a3a2a] ring-1 ring-[#dcd5c7]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md bg-[#fff4df] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a6a16]">
                      Peer challenge bank
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#6f4a12]">
                      {learningPack.trapBank[0]}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {historyPack ? (
              <div
                data-testid="history-talk-classroom-protocol"
                className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#f6fbf8] p-4"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">
                      Interactive History classroom protocol
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">
                      Teacher, peer, examiner, memory loop
                    </h3>
                  </div>
                  <span
                    data-testid="history-talk-stage"
                    className="max-w-full break-words rounded-md bg-white px-3 py-2 text-xs font-black text-[#085041] ring-1 ring-[#1d9e75]/20 sm:shrink-0"
                  >
                    {classroomStageLabels[talkClassroomStage]}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    ["AI Teacher", "Ask chronology, source/map, actor, consequence, trap."],
                    ["Peer Challenger", "Force one missing proof or counter-example."],
                    ["UPSC Examiner", "Score only after the challenge response."],
                    ["Memory Loop", "Send weak answers to compressed revisit."],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-md border border-[#dcd5c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{title}</p>
                      <p className="mt-2 text-xs font-bold leading-5 text-[#34453b]">{detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-md bg-[#f7f4ee] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                      Source-map proof gate
                    </p>
                    <div className="mt-2 grid gap-2">
                      {historyPack.caseAnchors.slice(0, 4).map((anchor) => (
                        <p key={anchor} className="rounded-md bg-white px-3 py-2 text-xs font-black leading-5 text-[#1a3a2a] ring-1 ring-[#dcd5c7]">
                          {anchor}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md bg-[#fff4df] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a6a16]">
                      Trap clinic
                    </p>
                    <div className="mt-2 grid gap-2">
                      {historyPack.trapBank.slice(0, 3).map((trap) => (
                        <p key={trap} className="rounded-md bg-white/80 p-2 text-xs font-bold leading-5 text-[#6f4a12]">
                          {trap}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
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

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Discussion gate</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">AI teacher oral check</h2>
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
                      First explain the mechanism. Then attach an example. End with one UPSC statement trap.
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
              {maicDiscussion && (
                <div data-testid="subject-maic-discussion-turns" className="grid gap-3 md:grid-cols-2">
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
                <div data-testid="subject-talk-peer-challenge" className="rounded-lg border border-[#d9d4f0] bg-[#f8f6ff] p-4">
                  <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5b4ba8]">Peer challenge round</p>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">
                        Answer the counter-question
                      </h3>
                    </div>
                    <span className="max-w-full break-words rounded-md bg-white px-3 py-2 text-xs font-black text-[#5b4ba8] ring-1 ring-[#d9d4f0] sm:shrink-0">
                      {discussionStep === "verdict" ? "Examiner verdict saved" : "Challenge pending"}
                    </span>
                  </div>
                  <p className="rounded-md bg-white/80 p-3 text-sm font-bold leading-6 text-[#34453b]">
                    {peerChallenge?.message ?? "Connect the weak concept to one applied example and one UPSC trap."}
                  </p>
                  <textarea
                    data-testid="subject-talk-challenge-response"
                    value={challengeDraft}
                    onChange={(event) => {
                      setChallengeDraft(event.target.value);
                      setDiscussionStep("challenge");
                      setSavedReflection(false);
                    }}
                    placeholder="Answer the peer challenge. Add the missing applied example, institution, map, report, or trap, then ask the examiner to reassess."
                    className="mt-4 min-h-28 w-full resize-y rounded-lg border border-[#d9d4f0] bg-white p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#5b4ba8] focus:ring-2 focus:ring-[#5b4ba8]/20"
                  />
                  <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-xs font-bold leading-5 text-[#5f5b73]">
                      {examinerTurn?.message ?? "The examiner will combine the first answer and this challenge response for the final local score."}
                    </p>
                    <button
                      type="button"
                      data-testid="subject-talk-reassess-challenge"
                      onClick={() => assessCurrentAnswer(true)}
                      disabled={challengeDraft.trim().length < 20}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#5b4ba8] px-3 text-sm font-bold text-white transition hover:bg-[#46398b] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
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
                        {isMcqUnlocked
                          ? "Good. You may move to fresh MCQ readiness for this topic."
                          : isLabUnlocked
                            ? "Good. Move to the Visual Lab and prove the idea through an applied example."
                            : "Pause. Revisit the compressed recap, then return and explain again."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
              placeholder="Write the explanation in your own words. Start with concept, then mechanism, then example."
              className="min-h-48 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => {
                  persistCurrentState({ incrementSavedCount: true });
                  setSavedReflection(true);
                }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d] sm:w-auto"
              >
                <Save className="h-4 w-4" /> Save reflection
              </button>
              <button
                type="button"
                onClick={() => assessCurrentAnswer(false)}
                disabled={answerDraft.trim().length < 20}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-3 text-sm font-bold text-white transition hover:bg-[#087a59] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <Gauge className="h-4 w-4" /> Assess explanation
              </button>
              <button
                type="button"
                onClick={() => setActivePromptIndex((current) => Math.max(current - 1, 0))}
                disabled={activePromptIndex === 0}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setActivePromptIndex((current) => Math.min(current + 1, promptLadder.length - 1))}
                disabled={activePromptIndex === promptLadder.length - 1}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Next prompt <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {savedReflection && (
              <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                <p className="text-sm font-bold leading-6 text-[#085041]">Reflection saved locally for this {plan.title} day.</p>
              </div>
            )}
            {assessment && (
              <div className="mt-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">AI teacher assessment</p>
                    <h3 className="mt-2 text-2xl font-black text-[#13251d]">{assessment.score}% / {assessment.band}</h3>
                  </div>
                  <div className="max-w-full break-words rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white sm:shrink-0">
                    {assessment.nextAction}
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-[#49675e]">{assessment.summary}</p>
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
            {historyPack && assessment ? (
              <div
                data-testid="history-talk-score-gate"
                className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">
                      History examiner score gate
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">
                      Chronology plus proof before movement
                    </h3>
                  </div>
                  <span className="max-w-full break-words rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black text-white sm:shrink-0">
                    {discussionStep === "challenge" ? "Peer challenge active" : "Final verdict saved"}
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-5">
                  {["Chronology", "Source/map", "Actor/institution", "Consequence", "UPSC trap"].map((gate) => (
                    <div key={gate} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{gate}</p>
                      <p className="mt-2 text-xs font-bold leading-5 text-[#34453b]">
                        {assessment.matchedKeywords.some((keyword) => gate.toLowerCase().includes(keyword) || keyword.includes(gate.toLowerCase().split("/")[0]))
                          ? "Detected in response"
                          : "Check explicitly"}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 rounded-md bg-[#fff4df] p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                  {discussionStep === "challenge"
                    ? "The route is intentionally paused. Answer the peer challenge, then ask the examiner to reassess."
                    : "The examiner verdict is now saved locally and the route decision can move forward."}
                </p>
              </div>
            ) : null}

            <div
              data-testid="talk-route-gate"
              className={cn(
                "mt-4 rounded-lg border p-4",
                routeGateTone === "unlocked" && "border-[#1d9e75]/45 bg-[#e7f5ee]",
                routeGateTone === "locked" && "border-[#ef9f27]/45 bg-[#fff4df]",
                routeGateTone === "neutral" && "border-[#dcd5c7] bg-[#fdfaf3]"
              )}
            >
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {assessment && !isChallengePending ? (
                    <Link
                      data-testid="talk-primary-route"
                      href={primaryRouteHref}
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-black text-white transition sm:w-auto",
                        isMcqUnlocked && isLabCompleted ? "bg-[#1a3a2a] hover:bg-[#10291d]" : "bg-[#9a6a16] hover:bg-[#7f5410]"
                      )}
                    >
                      {primaryRouteLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-[#d6cec0] px-3 text-sm font-black text-[#7b7164] sm:w-auto"
                    >
                      {!assessment ? "Route locked" : talkNextActionLabel}
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
                  revisionQueued ? "bg-[#e7f5ee] text-[#085041] ring-1 ring-[#1d9e75]/30" : "bg-[#1a3a2a] text-white hover:bg-[#10291d]"
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

            <SubjectLoopActions plan={plan} activeDay={activeSession.day} current="talk" />
          </div>
        </section>
      </div>
    </div>
  );
}
