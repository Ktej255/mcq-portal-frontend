"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Lock,
  MapPinned,
  MessageCircle,
  Mic,
  MicOff,
  RefreshCcw,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import {
  assessGeographyExplanation,
  buildGeographyChallengeScaffold,
  buildGeographyMaicDiscussion,
  buildGeographyWatchScenes,
  getCompressedGeographyRecap,
  getGeographyTalkUnlockStage,
  type GeographyAssessment,
  type GeographyMaicDiscussion,
} from "@/lib/upsc/geographyLearning";
import { GEOGRAPHY_RECALL_TARGET } from "@/lib/upsc/guidedStudy";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { useGeographyProgress, type GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";
import type { AdaptiveTeacherCoach, AdaptiveTeacherDoubtDiagnosis } from "@/lib/upsc/adaptiveTeacher";
import { requestAdaptiveTeacherDiscussion } from "@/services/upscTeacherService";
import { cn } from "@/lib/utils";

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function nextRouteFor(
  session: GeographySession,
  assessment: GeographyAssessment,
  watchComplete: boolean,
  learnerLevel: StudentLevel
) {
  const stage = getGeographyTalkUnlockStage(assessment);

  if (assessment.score >= GEOGRAPHY_RECALL_TARGET) {
    return {
      href: `/upsc/geography/mcq-readiness?day=${session.day}`,
      label: "Open MCQ",
      title: "MCQ is next",
      detail: `Recall reached ${GEOGRAPHY_RECALL_TARGET}%. Clear the fresh questions, then continue to the next topic.`,
      tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
    };
  }

  if (!watchComplete && learnerLevel !== "beginner") {
    return {
      href: `/upsc/geography/watch?day=${session.day}`,
      label: "Open repair lesson",
      title: "Repair the diagnosed gap",
      detail: "Your explanation is saved. Now use the short lesson only for the concepts the first answer missed.",
      tone: "border-[#8db7d8] bg-[#edf7ff] text-[#23406f]",
    };
  }

  if (stage === "revisit") {
    return {
      href: `/upsc/geography/revisit?day=${session.day}`,
      label: "Open short revision",
      title: "Revise before moving ahead",
      detail: "The explanation needs a smaller recap before MCQ opens.",
      tone: "border-[#ef9f27]/55 bg-[#fff4df] text-[#6f4a12]",
    };
  }

  return null;
}

function getTalkLevelCopy(learnerLevel: StudentLevel) {
  if (learnerLevel === "beginner") {
    return {
      modeLabel: "Beginner lesson recall",
      question: "What did you learn?",
      panelDetail: `Explain the lesson in your own words. The teacher keeps the discussion focused until recall reaches ${GEOGRAPHY_RECALL_TARGET}%.`,
      teacherHint: "Speak in one answer: concept, mechanism, map or example, and one UPSC trap.",
      firstStep: "Explain lesson",
      inputPlaceholder: "Explain the taught topic in your own words: concept, mechanism, map/example, and one UPSC trap.",
      repairFrame: "The teacher repairs the exact lesson gap before MCQ opens.",
    };
  }

  if (learnerLevel === "advanced") {
    return {
      modeLabel: "Advanced attempt-gap diagnosis",
      question: "Why did this topic still cost marks?",
      panelDetail: `Explain the topic like a repeated-attempt learner. The teacher searches for PYQ pattern gaps, map/proof precision, and UPSC statement traps until recall reaches ${GEOGRAPHY_RECALL_TARGET}%.`,
      teacherHint: "Speak in one answer: concept command, where past attempts failed, map/proof, exception, and one UPSC trap.",
      firstStep: "Diagnose attempt gap",
      inputPlaceholder: "Explain what you know, where your past attempts failed, the map/proof, and the UPSC trap.",
      repairFrame: "The teacher opens only the precision repair needed for repeated-attempt gaps.",
    };
  }

  return {
    modeLabel: "Intermediate self-study diagnosis",
    question: "What do you already know?",
    panelDetail: `Explain first. The teacher identifies which coaching-to-self-study UPSC concepts are missing and opens only the repair needed to reach ${GEOGRAPHY_RECALL_TARGET}% recall.`,
    teacherHint: "Speak in one answer: known concept, missing link, mechanism, applied example, and one UPSC trap.",
    firstStep: "Diagnose self-study gap",
    inputPlaceholder: "Explain what you already know from coaching, the missing link, mechanism, applied example, and one UPSC trap.",
    repairFrame: "The teacher repairs only the self-study gap, not the full class.",
  };
}

function progressLearnerLevelLabel(learnerLevel: StudentLevel) {
  if (learnerLevel === "advanced") return "Advanced";
  if (learnerLevel === "intermediate") return "Intermediate";
  return "Beginner";
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function readSavedDoubtDiagnosis(progress?: GeographyDayProgress): AdaptiveTeacherDoubtDiagnosis | null {
  if (
    !progress?.teacherDoubtCategory ||
    !progress.teacherDoubtReason ||
    !progress.teacherDoubtRepairAction ||
    !progress.teacherDoubtMasteryCheck
  ) {
    return null;
  }

  return {
    category: progress.teacherDoubtCategory as AdaptiveTeacherDoubtDiagnosis["category"],
    reason: progress.teacherDoubtReason,
    repairAction: progress.teacherDoubtRepairAction,
    masteryCheck: progress.teacherDoubtMasteryCheck,
  };
}

export function GeographyTalkRoom({ initialDay }: { initialDay?: number }) {
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay] = useState(resolveSession(initialDay).day);
  const [answerDraft, setAnswerDraft] = useState("");
  const [challengeDraft, setChallengeDraft] = useState("");
  const [assessment, setAssessment] = useState<GeographyAssessment | null>(null);
  const [discussion, setDiscussion] = useState<GeographyMaicDiscussion | null>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [learnerLevel, setLearnerLevel] = useState<StudentLevel>("beginner");
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognitionLike | null>(null);
  const [speechState, setSpeechState] = useState<"idle" | "listening" | "unsupported">("idle");
  const [teacherCoach, setTeacherCoach] = useState<AdaptiveTeacherCoach | null>(null);
  const [teacherConnection, setTeacherConnection] = useState<"idle" | "checking" | "ready" | "local" | "unavailable">("idle");
  const [submittedInCurrentVisit, setSubmittedInCurrentVisit] = useState(false);
  const teacherRequestId = useRef(0);
  const answerDraftRef = useRef<HTMLTextAreaElement | null>(null);

  const activeSession = resolveSession(activeDay);
  const progress = getDayProgress(activeSession.day);
  const savedDoubtDiagnosis = readSavedDoubtDiagnosis(progress);
  const teacherDoubtDiagnosis = teacherCoach?.doubtDiagnosis ?? savedDoubtDiagnosis;
  const watchScenes = buildGeographyWatchScenes(activeSession);
  const watchProofCount = Math.min(progress?.watchSceneCompletedIds?.length ?? (progress?.watched ? watchScenes.length : 0), watchScenes.length);
  const isWatchComplete = Boolean(progress?.watched) && watchProofCount >= watchScenes.length;
  const recap = getCompressedGeographyRecap(activeSession);
  const watchHandoff = progress?.watchHandoffSummary?.trim() ?? "";
  const route = assessment ? nextRouteFor(activeSession, assessment, isWatchComplete, learnerLevel) : null;
  const talkLevelCopy = getTalkLevelCopy(learnerLevel);
  const challengeScaffold = assessment ? buildGeographyChallengeScaffold(activeSession, assessment) : "";
  const teacherFollowUpPrompt =
    teacherCoach?.nextPrompt ??
    progress?.talkTeacherFollowUpPrompt ??
    challengeScaffold;
  const repeatTo95Prompt =
    teacherCoach?.nextPrompt ??
    (assessment?.repairHints[0] || challengeScaffold || "Repair the weakest concept, then explain once more.");
  const visibleRecallScore =
    assessment?.score ?? (typeof progress?.talkScore === "number" ? progress.talkScore : 0);
  const recallMeterWidth = Math.max(0, Math.min(100, visibleRecallScore));
  const recallGap = Math.max(GEOGRAPHY_RECALL_TARGET - visibleRecallScore, 0);
  const teacherLoopSteps = [
    { label: talkLevelCopy.firstStep, detail: "Student answer" },
    { label: "AI check", detail: "Concept, mechanism, example, trap" },
    { label: "Repair", detail: `Only until ${GEOGRAPHY_RECALL_TARGET}%` },
    { label: "MCQ", detail: "Fresh practice unlock" },
  ];
  const talkFlowGate =
    (progress?.revisitQueued || progress?.talkBand === "Revisit") &&
    !challengeOpen &&
    !submittedInCurrentVisit
      ? {
          eyebrow: "Revision required",
          title: "Repair the weak point first",
          detail: "The previous explanation identified a weak point. Complete the short revision, then explain again.",
          href: `/upsc/geography/revisit?day=${activeSession.day}`,
          cta: "Open short revision",
        }
      : learnerLevel === "beginner" && !isWatchComplete
        ? {
            eyebrow: "Lesson required",
            title: "Finish the lesson first",
            detail: "Your beginner path starts with one 10-15 minute topic. The discussion opens immediately after it.",
            href: `/upsc/geography/watch?day=${activeSession.day}`,
            cta: "Open lesson",
          }
        : learnerLevel !== "beginner" &&
            typeof progress?.talkScore === "number" &&
            progress.talkScore < GEOGRAPHY_RECALL_TARGET &&
            !isWatchComplete &&
            !submittedInCurrentVisit
          ? {
              eyebrow: "Repair required",
              title: "Complete the diagnosed repair",
              detail: "Your first explanation is saved. Use the short lesson selected for the missing concepts, then return here.",
              href: `/upsc/geography/watch?day=${activeSession.day}`,
              cta: "Open repair lesson",
          }
          : null;
  const talkState = talkFlowGate
    ? "gated"
    : challengeOpen
      ? "repair-answer"
      : route
        ? "route-ready"
        : assessment
          ? "assessed"
          : "answer-required";
  const primaryActionLabel = route?.label ?? (teacherConnection === "checking" ? "Checking answer" : "Send to AI teacher");
  const primaryActionHref = route?.href ?? "";
  const mcqReady = Boolean(route?.href.includes("/mcq-readiness") && visibleRecallScore >= GEOGRAPHY_RECALL_TARGET);

  useEffect(() => {
    if (!isLoaded || hydrated) return;

    const timer = window.setTimeout(() => {
      const savedSession = resolveSession(activeDay);
      const savedProgress = getDayProgress(savedSession.day);
      setLearnerLevel(readStudentProfile()?.level ?? "beginner");
      setAnswerDraft(savedProgress?.reflection?.trim() || "");
      setChallengeDraft(savedProgress?.talkChallengeResponse ?? "");
      setSaved(false);
      setChallengeOpen(savedProgress?.talkDiscussionStep === "challenge");

      if (typeof savedProgress?.talkScore === "number") {
        const restoredAssessment: GeographyAssessment = {
          score: savedProgress.talkScore,
          band: savedProgress.talkBand ?? "Practice",
          matchedKeywords: [],
          missingKeywords: [],
          summary: savedProgress.assessmentSummary ?? "Saved local assessment.",
          nextAction: savedProgress.talkNextActionLabel ?? "Continue",
          rubric: savedProgress.talkRubric ?? [],
          repairHints: savedProgress.talkRepairHints ?? [],
        };
        setAssessment(restoredAssessment);
        setDiscussion(
          savedProgress.talkTranscript
            ? {
                turns: savedProgress.talkTranscript,
                verdict: savedProgress.talkVerdict ?? restoredAssessment.summary,
                unlockStage: savedProgress.talkUnlockStage ?? getGeographyTalkUnlockStage(restoredAssessment),
                score: restoredAssessment.score,
              }
            : buildGeographyMaicDiscussion(savedSession, savedProgress.reflection ?? "", restoredAssessment)
        );
        setTeacherCoach(
          savedProgress.teacherCoachSummary || savedProgress.teacherCoachNextPrompt || savedProgress.teacherDoubtCategory
            ? {
                summary: savedProgress.teacherCoachSummary ?? restoredAssessment.summary,
                nextPrompt: savedProgress.teacherCoachNextPrompt ?? savedProgress.talkTeacherFollowUpPrompt ?? restoredAssessment.nextAction,
                focusConcepts: [],
                doubtDiagnosis: readSavedDoubtDiagnosis(savedProgress) ?? {
                  category: "Mastery",
                  reason: restoredAssessment.summary,
                  repairAction: savedProgress.talkTeacherFollowUpPrompt ?? restoredAssessment.nextAction,
                  masteryCheck: "Can the learner explain the concept again without notes?",
                },
                providerScore: savedProgress.teacherProviderScore,
              }
            : null
        );
        setTeacherConnection(savedProgress.teacherMode === "gemini" ? "ready" : savedProgress.teacherMode === "local-fallback" ? "local" : "idle");
      }

      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeDay, getDayProgress, hydrated, isLoaded]);

  useEffect(() => {
    return () => speechRecognition?.stop();
  }, [speechRecognition]);

  const persistTalk = (
    nextAssessment: GeographyAssessment | null = assessment,
    nextDiscussion: GeographyMaicDiscussion | null = discussion,
    nextChallengeOpen = challengeOpen
  ) => {
    const nextRoute = nextAssessment ? nextRouteFor(activeSession, nextAssessment, isWatchComplete, learnerLevel) : null;
    const stage = nextAssessment ? getGeographyTalkUnlockStage(nextAssessment) : undefined;
    saveDayProgress(activeSession.day, {
      learnerLevel: progressLearnerLevelLabel(learnerLevel),
      reflection: answerDraft,
      talkChallengeResponse: challengeDraft,
      talkScore: nextAssessment?.score,
      talkBand: nextAssessment?.band,
      assessmentSummary: nextAssessment?.summary,
      talkTranscript: nextDiscussion?.turns,
      talkUnlockStage: stage,
      talkVerdict: nextDiscussion?.verdict,
      talkRubric: nextAssessment?.rubric,
      talkRepairHints: nextAssessment?.repairHints,
      talkNextRoute: nextRoute?.href,
      talkNextActionLabel: nextRoute?.label,
      talkDiscussionStep: nextChallengeOpen ? "challenge" : nextAssessment ? "verdict" : "explain",
      talkTeacherFollowUpPrompt: nextChallengeOpen
        ? progress?.talkTeacherFollowUpPrompt || (nextAssessment ? buildGeographyChallengeScaffold(activeSession, nextAssessment) : undefined)
        : nextAssessment?.score && nextAssessment.score >= GEOGRAPHY_RECALL_TARGET
          ? "Apply the concept in fresh MCQs, then continue to the next topic."
          : progress?.talkTeacherFollowUpPrompt,
      talkTeacherFollowUpAnswer: challengeDraft.trim() || undefined,
      talkTeacherTurnCount: nextAssessment ? (challengeDraft.trim() ? 2 : 1) : undefined,
      talkTeacherStatus: nextChallengeOpen
        ? "answer-required"
        : nextAssessment?.score && nextAssessment.score >= GEOGRAPHY_RECALL_TARGET
          ? "mcq-ready"
          : nextAssessment
            ? "repair-required"
            : undefined,
      revisitQueued: isWatchComplete && stage === "revisit",
      confidence: nextAssessment?.score && nextAssessment.score >= 85 ? "Command" : nextAssessment?.score && nextAssessment.score < 40 ? "Shaky" : "Working",
      mentorMode: "Cause-effect",
      activePromptLabel: "Explain",
    });
    setSaved(true);
  };

  const assess = (includeChallenge: boolean) => {
    if (teacherConnection === "checking") return;
    const combinedAnswer = [answerDraft, includeChallenge ? challengeDraft : ""]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\nChallenge repair:\n");
    const nextAssessment = assessGeographyExplanation(activeSession, combinedAnswer);
    const nextDiscussion = buildGeographyMaicDiscussion(activeSession, combinedAnswer, nextAssessment);
    const nextChallengeOpen =
      !includeChallenge &&
      isWatchComplete &&
      getGeographyTalkUnlockStage(nextAssessment) === "retry";
    setAssessment(nextAssessment);
    setSubmittedInCurrentVisit(true);
    setDiscussion(nextDiscussion);
    setChallengeOpen(nextChallengeOpen);
    persistTalk(nextAssessment, nextDiscussion, nextChallengeOpen);
    setTeacherCoach(null);
    setTeacherConnection("checking");
    const requestId = teacherRequestId.current + 1;
    teacherRequestId.current = requestId;
    void requestAdaptiveTeacherDiscussion({
      day: activeSession.day,
      answer: answerDraft,
      challengeAnswer: includeChallenge ? challengeDraft : undefined,
      learnerLevel,
    })
      .then((response) => {
        if (teacherRequestId.current !== requestId) return;
        setTeacherCoach(response.coach);
        setTeacherConnection(response.mode === "gemini" ? "ready" : "local");
        saveDayProgress(activeSession.day, {
          teacherMode: response.mode,
          teacherPromptVersion: response.trace.promptVersion,
          teacherRubricVersion: response.trace.rubricVersion,
          teacherRecallTarget: response.trace.recallTarget,
          teacherCoachSummary: response.coach.summary,
          teacherCoachNextPrompt: response.coach.nextPrompt,
          teacherDoubtCategory: response.coach.doubtDiagnosis.category,
          teacherDoubtReason: response.coach.doubtDiagnosis.reason,
          teacherDoubtRepairAction: response.coach.doubtDiagnosis.repairAction,
          teacherDoubtMasteryCheck: response.coach.doubtDiagnosis.masteryCheck,
          teacherProviderScore: response.coach.providerScore,
          talkTeacherFollowUpPrompt: response.coach.nextPrompt,
        });
      })
      .catch(() => {
        if (teacherRequestId.current !== requestId) return;
        setTeacherCoach(null);
        setTeacherConnection("unavailable");
      });
  };

  const toggleSpeechCapture = () => {
    if (speechState === "listening" && speechRecognition) {
      speechRecognition.stop();
      setSpeechRecognition(null);
      setSpeechState("idle");
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setSpeechState("unsupported");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (!transcript) return;
      setAnswerDraft((current) => `${current}${current.trim() ? " " : ""}${transcript}`.trim());
      setAssessment(null);
      setDiscussion(null);
      setSaved(false);
    };
    recognition.onend = () => {
      setSpeechRecognition(null);
      setSpeechState("idle");
    };
    recognition.onerror = () => {
      setSpeechRecognition(null);
      setSpeechState("idle");
    };
    recognition.start();
    setSpeechRecognition(recognition);
    setSpeechState("listening");
  };

  const focusRepeatAnswer = () => {
    setChallengeOpen(false);
    window.setTimeout(() => {
      answerDraftRef.current?.focus();
      answerDraftRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  if (!isLoaded || !hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Opening discussion...
        </div>
      </main>
    );
  }

  if (talkFlowGate) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <section
            data-testid="talk-flow-gate"
            data-day={activeSession.day}
            data-learner-level={learnerLevel}
            data-flow-state={talkState}
            data-gate-href={talkFlowGate.href}
            data-recall-target={GEOGRAPHY_RECALL_TARGET}
            className="rounded-lg border border-[#ef9f27]/55 bg-[#fff4df] p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#9a6a16] text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">{talkFlowGate.eyebrow}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">{talkFlowGate.title}</h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4a12]">{talkFlowGate.detail}</p>
                <Link
                  data-testid="talk-flow-gate-action"
                  data-next-action-route={talkFlowGate.href}
                  href={talkFlowGate.href}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  {talkFlowGate.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:px-8 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/upsc/geography?day=${activeSession.day}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-[#085041]">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Talk</Badge>
            <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
            <span className="text-sm font-semibold text-[#746f66]">Discussion checkpoint</span>
          </div>
        </div>

        <section className="space-y-5">
          <div
            data-testid="geography-talk-simple-panel"
            data-student-flow="single-answer-conditional-repair"
            data-day={activeSession.day}
            data-learner-level={learnerLevel}
            data-teacher-mode={talkLevelCopy.modeLabel}
            data-flow-state={talkState}
            data-watch-complete={isWatchComplete ? "true" : "false"}
            data-recall-target={GEOGRAPHY_RECALL_TARGET}
            data-visible-recall-score={visibleRecallScore}
            data-recall-gap={recallGap}
            data-primary-action-label={primaryActionLabel}
            data-primary-action-href={primaryActionHref}
            data-mcq-ready={mcqReady ? "true" : "false"}
            data-visible-mode="one-question-one-answer"
            className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-5"
          >
            <div className="mb-4">
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">{activeSession.title}</h1>
              <p
                data-testid="talk-level-mode"
                className="mt-3 inline-flex rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#085041]"
              >
                {talkLevelCopy.modeLabel}
              </p>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                {talkLevelCopy.panelDetail}
              </p>
            </div>

            <div data-testid="talk-discussion-surface" className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
            <div data-testid="talk-teacher-question" className="h-full rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="grid gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#085041]">AI teacher</p>
                      <h2 className="mt-2 text-xl font-black tracking-tight">
                        {talkLevelCopy.question}
                      </h2>
                      <p className="mt-3 text-base font-black leading-7 text-[#13251d]">{activeSession.talk}</p>
                      <p data-testid="talk-level-teacher-hint" className="mt-3 text-sm font-semibold leading-6 text-[#49675e]">
                        {talkLevelCopy.teacherHint}
                      </p>
                      <p data-testid="talk-level-repair-frame" className="mt-2 text-xs font-bold leading-5 text-[#657066]">
                        {talkLevelCopy.repairFrame}
                      </p>
                    </div>
                    <div
                      data-testid="talk-recall-target-meter"
                      data-recall-target={GEOGRAPHY_RECALL_TARGET}
                      data-visible-recall-score={visibleRecallScore}
                      data-recall-gap={recallGap}
                      data-mcq-ready={mcqReady ? "true" : "false"}
                      className="rounded-lg border border-[#b9d9cd] bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">Recall target</p>
                        <p className="text-xs font-black text-[#1d9e75]">{GEOGRAPHY_RECALL_TARGET}%</p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dbe8df]">
                        <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${recallMeterWidth}%` }} />
                      </div>
                      <p className="mt-3 text-xs font-bold leading-5 text-[#49675e]">
                        {visibleRecallScore >= GEOGRAPHY_RECALL_TARGET
                          ? "MCQ can open now."
                          : visibleRecallScore > 0
                            ? `${recallGap}% more recall needed.`
                            : "Answer once to measure recall."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div data-testid="talk-answer-surface" className="flex h-full flex-col rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Your answer</p>
            <textarea
              ref={answerDraftRef}
              data-testid="talk-answer-draft"
              value={answerDraft}
              onChange={(event) => {
                teacherRequestId.current += 1;
                setAnswerDraft(event.target.value);
                setAssessment(null);
                setDiscussion(null);
                setChallengeOpen(false);
                setTeacherCoach(null);
                setTeacherConnection("idle");
                setSaved(false);
              }}
              placeholder={talkLevelCopy.inputPlaceholder}
              className="min-h-72 w-full flex-1 resize-y rounded-lg border border-[#dcd5c7] bg-white p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="talk-speak-answer"
                onClick={toggleSpeechCapture}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                {speechState === "listening" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {speechState === "listening" ? "Stop speaking" : "Speak answer"}
              </button>
              <button
                type="button"
                data-testid="talk-assess-answer"
                data-next-action="assess"
                data-learner-level={learnerLevel}
                data-recall-target={GEOGRAPHY_RECALL_TARGET}
                disabled={answerDraft.trim().length < 20 || teacherConnection === "checking"}
                onClick={() => assess(false)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Gauge className="h-4 w-4" /> {teacherConnection === "checking" ? "Checking answer..." : "Send to AI teacher"}
              </button>
              {speechState === "unsupported" ? (
                <span className="text-xs font-bold text-[#756f64]">Voice capture is unavailable in this browser. Type your answer here.</span>
              ) : null}
            </div>
            </div>
            </div>

            <details
              data-testid="talk-recall-loop-strip"
              className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-2 text-xs font-black text-[#31443a]"
            >
              <summary className="cursor-pointer list-none rounded-md bg-white px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-[#5d675f]">
                How this answer will be checked
              </summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                {teacherLoopSteps.map((step, index) => (
                  <div key={step.label} className="rounded-md bg-white px-3 py-2">
                    <span className="text-[#1d9e75]">{index + 1}.</span> {step.label}
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#746f66]">{step.detail}</span>
                  </div>
                ))}
              </div>
            </details>

            {assessment && !challengeOpen && (
              <div data-testid="talk-score-card" className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recall score</p>
                <p className="mt-2 text-4xl font-black text-[#13251d]">{assessment.score}%</p>
                <p className="mt-2 text-sm font-black text-[#085041]">{assessment.band}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#49675e]">{assessment.summary}</p>
                {teacherDoubtDiagnosis ? (
                  <div data-testid="geography-talk-doubt-diagnosis" className="mt-4 rounded-md border border-[#cfe5dc] bg-white/75 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#085041]">Doubt diagnosis</p>
                        <h4 className="mt-1 text-sm font-black text-[#13251d]">{teacherDoubtDiagnosis.category}</h4>
                      </div>
                      <span className="rounded-md bg-[#eef8f3] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#085041]">
                        Solving path
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">{teacherDoubtDiagnosis.reason}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <p className="rounded-md bg-[#f7f4ee] p-3 text-xs font-bold leading-5 text-[#34453b]">
                        <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">Repair action</span>
                        {teacherDoubtDiagnosis.repairAction}
                      </p>
                      <p className="rounded-md bg-[#f7f4ee] p-3 text-xs font-bold leading-5 text-[#34453b]">
                        <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">Mastery check</span>
                        {teacherDoubtDiagnosis.masteryCheck}
                      </p>
                    </div>
                  </div>
                ) : null}
                {assessment.score < GEOGRAPHY_RECALL_TARGET && !route ? (
                <div data-testid="talk-mastery-plan" className="mt-4 rounded-md border border-[#cfe5dc] bg-white/75 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#085041]">Repair to {GEOGRAPHY_RECALL_TARGET}%</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                    {teacherCoach?.nextPrompt ??
                    (assessment.score >= GEOGRAPHY_RECALL_TARGET
                      ? "Recall target cleared. Apply the concept in fresh MCQs."
                      : assessment.repairHints[0] ?? "Repair the weakest concept, then explain once more.")}
                  </p>
                  {(teacherCoach?.focusConcepts.length ? teacherCoach.focusConcepts : assessment.missingKeywords).length ? (
                    <p className="mt-2 text-xs font-bold leading-5 text-[#657066]">
                      Focus concepts: {(teacherCoach?.focusConcepts.length ? teacherCoach.focusConcepts : assessment.missingKeywords).slice(0, 4).join(", ")}
                    </p>
                  ) : null}
                  {teacherConnection === "checking" || teacherConnection === "unavailable" ? (
                    <p
                      data-testid="talk-teacher-connection"
                      aria-live="polite"
                      className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#1d9e75]"
                    >
                      {teacherConnection === "checking"
                        ? "Checking your answer..."
                        : "Local guidance active. Continue with the recommended step."}
                    </p>
                  ) : null}
                  <div
                    data-testid="talk-repeat-to-95"
                    className="mt-3 rounded-md border border-[#ef9f27]/45 bg-[#fff8e8] p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6f4a12]">
                          Repeat inside Talk until {GEOGRAPHY_RECALL_TARGET}%
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#5d3a05]">
                          Current recall is {assessment.score}%. MCQ stays locked until recall is {GEOGRAPHY_RECALL_TARGET}%.
                        </p>
                        <p data-testid="talk-repeat-prompt" className="mt-2 text-sm font-bold leading-6 text-[#25382f]">
                          {repeatTo95Prompt}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="talk-repeat-answer"
                        onClick={focusRepeatAnswer}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#10291d]"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
                ) : null}
                {route && (
                  <div
                    data-testid="talk-route-gate"
                    data-day={activeSession.day}
                    data-learner-level={learnerLevel}
                    data-score={assessment.score}
                    data-recall-target={GEOGRAPHY_RECALL_TARGET}
                    data-next-action-route={route.href}
                    data-next-action-label={route.label}
                    data-mcq-ready={mcqReady ? "true" : "false"}
                    className={cn("mt-4 rounded-lg border p-4", route.tone)}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em]">Next</p>
                    <h2 className="mt-2 text-xl font-black tracking-tight">{route.title}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 opacity-85">{route.detail}</p>
                    <Link
                      data-testid="talk-primary-route"
                      data-next-action-route={route.href}
                      data-next-action-label={route.label}
                      data-recall-target={GEOGRAPHY_RECALL_TARGET}
                      data-score={assessment.score}
                      href={route.href}
                      className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                    >
                      {route.label} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {challengeOpen && assessment && (
              <div
                data-testid="talk-teacher-follow-up"
                data-day={activeSession.day}
                data-learner-level={learnerLevel}
                data-flow-state={talkState}
                data-score={assessment.score}
                data-recall-target={GEOGRAPHY_RECALL_TARGET}
                className="mt-5 rounded-lg border border-[#d9d4f0] bg-[#f5f2ff] p-4"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#5b4ba8] text-white">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5b4ba8]">Teacher follow-up</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">Answer one repair question</h3>
                    <p data-testid="talk-teacher-follow-up-prompt" className="mt-2 text-sm font-bold leading-6 text-[#5f5b73]">
                      {teacherFollowUpPrompt}
                    </p>
                    {teacherConnection === "checking" ? (
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#5b4ba8]">
                        Teacher is refining the question...
                      </p>
                    ) : null}
                  </div>
                </div>
                <div
                  data-testid="talk-repeat-to-95"
                  className="mb-3 rounded-md border border-[#d9d4f0] bg-white/75 p-3"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5b4ba8]">
                    Repeat inside Talk until {GEOGRAPHY_RECALL_TARGET}%
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5b73]">
                    Current recall is {assessment.score}%. MCQ stays locked until recall is {GEOGRAPHY_RECALL_TARGET}%.
                  </p>
                </div>
                <textarea
                  data-testid="talk-challenge-response"
                  value={challengeDraft}
                  onChange={(event) => {
                    teacherRequestId.current += 1;
                    setChallengeDraft(event.target.value);
                    setTeacherConnection("idle");
                    setSaved(false);
                  }}
                  placeholder="Answer the teacher in 2-3 lines: cause-effect, one map example, and one UPSC trap."
                  className="min-h-24 w-full resize-y rounded-lg border border-[#d9d4f0] bg-white p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#5b4ba8] focus:ring-2 focus:ring-[#5b4ba8]/20"
                />
                <button
                  type="button"
                  data-testid="talk-reassess-challenge"
                  data-next-action="reassess"
                  data-recall-target={GEOGRAPHY_RECALL_TARGET}
                  disabled={challengeDraft.trim().length < 20 || teacherConnection === "checking"}
                  onClick={() => assess(true)}
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-md bg-[#5b4ba8] px-3 text-sm font-black text-white transition hover:bg-[#46398b] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {teacherConnection === "checking" ? "Checking answer..." : "Send repair answer"}
                </button>
                <details className="mt-3 rounded-md border border-[#d9d4f0] bg-white/70 p-3">
                  <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.12em] text-[#5b4ba8]">
                    Need a speaking scaffold?
                  </summary>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#5f5b73]">{challengeScaffold}</p>
                </details>
              </div>
            )}

          </div>

          <details data-testid="geography-talk-details" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
              Optional learning details
            </summary>
            <div className="mt-5 grid gap-5">
            <div
              data-testid="geography-talk-single-answer-rule"
              className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Single answer rule
              </p>
              <h2 className="mt-1 text-lg font-black tracking-tight">Explain once in the main answer box</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                Beginners answer after the lesson. Intermediate and advanced learners answer before the repair lesson.
                The teacher uses that one explanation to diagnose gaps, raise recall to {GEOGRAPHY_RECALL_TARGET}%, and
                unlock MCQs.
              </p>
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Extra controls</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">Use these only when you need support.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {watchHandoff && (
                    <button
                      type="button"
                      data-testid="talk-use-watch-recap"
                      onClick={() => setAnswerDraft(watchHandoff)}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 text-sm font-black text-[#085041] transition hover:bg-[#d7efe4]"
                    >
                      Use Watch recap
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => persistTalk()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                  >
                    <Save className="h-4 w-4" /> Save draft
                  </button>
                  {saved && (
                    <span className="inline-flex h-10 items-center gap-2 text-sm font-black text-[#1d9e75]">
                      <CheckCircle2 className="h-4 w-4" /> Saved
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recall check</p>
                  <h2 className="text-lg font-black tracking-tight">What the teacher measured</h2>
                </div>
              </div>

              {assessment ? (
                <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Score</p>
                  <p className="mt-2 text-4xl font-black text-[#13251d]">{assessment.score}%</p>
                  <p className="mt-2 text-sm font-black text-[#085041]">{assessment.band}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#49675e]">{assessment.summary}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-sm font-semibold leading-6 text-[#5d675f]">
                    The answer must include a concept, mechanism, map/example, and one UPSC trap. Then the app will open the next room.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Quick recap</p>
                  <h2 className="text-lg font-black tracking-tight">Use if stuck</h2>
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
              <Link href={`/upsc/geography/watch?day=${activeSession.day}`} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]">
                <RefreshCcw className="h-4 w-4" /> Reopen Watch
              </Link>
            </div>
          </div>
          </div>
          </details>
        </section>
      </div>
    </main>
  );
}
