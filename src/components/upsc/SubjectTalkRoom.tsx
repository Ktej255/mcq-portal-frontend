"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Mic,
  MicOff,
  RefreshCcw,
  Save,
  UnlockKeyhole,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import type { AdaptiveTeacherCoach, AdaptiveTeacherDoubtDiagnosis } from "@/lib/upsc/adaptiveTeacher";
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
  SUBJECT_RECALL_TARGET,
  SubjectAssessment,
  SubjectMaicDiscussion,
} from "@/lib/upsc/subjectLearning";
import { getSubjectLabProofCompletion, getSubjectWatchCompletion } from "@/lib/upsc/subjectProgressGates";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import {
  type SubjectConfidence,
  type SubjectDayProgress,
  type SubjectMentorMode,
  type SubjectTalkClassroomStage,
  type SubjectTalkDiscussionStep,
  type SubjectTalkTeacherStatus,
  useSubjectProgress,
} from "@/lib/upsc/useSubjectProgress";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { requestAdaptiveTeacherDiscussion } from "@/services/upscTeacherService";
import { requestUpscSpeechTranscription, requestUpscSpeechTranscriptionStatus } from "@/services/upscSpeechService";
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

type SpeechRecognitionResultLike = {
  readonly isFinal?: boolean;
  0?: { transcript?: string };
};

type SpeechRecognitionEventLike = {
  resultIndex?: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechState = "idle" | "listening" | "recording" | "unsupported" | "blocked" | "error";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getSpeechErrorMessage(error?: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone permission is blocked. Allow microphone access for this site, then try again.";
  }

  if (error === "audio-capture") {
    return "No working microphone was detected. Check the input device, then try again.";
  }

  if (error === "network") {
    return "Browser speech recognition could not reach its speech service. Type the answer or try Chrome with microphone access.";
  }

  if (error === "no-speech") {
    return "No speech was heard. Click Speak answer again and start speaking immediately.";
  }

  return "Voice capture stopped before recording. Allow microphone access or type your answer here.";
}

function appendSpeechTranscript(current: string, transcript: string) {
  const cleanedTranscript = transcript.replace(/\s+/g, " ").trim();
  if (!cleanedTranscript) return current;
  return `${current}${current.trim() ? " " : ""}${cleanedTranscript}`.trim();
}

function collectSpeechTranscripts(event: SpeechRecognitionEventLike) {
  const startIndex =
    typeof event.resultIndex === "number"
      ? Math.max(0, Math.min(event.resultIndex, event.results.length))
      : 0;
  const finalSegments: string[] = [];
  const interimSegments: string[] = [];

  for (let index = startIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result?.[0]?.transcript?.replace(/\s+/g, " ").trim();
    if (!transcript) continue;

    if (result.isFinal === false) {
      interimSegments.push(transcript);
    } else {
      finalSegments.push(transcript);
    }
  }

  return {
    finalTranscript: finalSegments.join(" ").trim(),
    interimTranscript: interimSegments.join(" ").trim(),
  };
}

async function requestMicrophonePermission() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

function readSavedDoubtDiagnosis(progress?: SubjectDayProgress): AdaptiveTeacherDoubtDiagnosis | null {
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
  const [learnerLevel, setLearnerLevel] = useState<StudentLevel>("beginner");
  const [submittedInCurrentVisit, setSubmittedInCurrentVisit] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognitionLike | null>(null);
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [speechMessage, setSpeechMessage] = useState("");
  const [speechInterimDraft, setSpeechInterimDraft] = useState("");
  const [speechTranscribing, setSpeechTranscribing] = useState(false);
  const [serverTranscriptionAvailable, setServerTranscriptionAvailable] = useState<boolean | null>(null);
  const [audioNoteUrl, setAudioNoteUrl] = useState("");
  const [teacherCoach, setTeacherCoach] = useState<AdaptiveTeacherCoach | null>(null);
  const [teacherConnection, setTeacherConnection] = useState<"idle" | "checking" | "ready" | "local" | "unavailable">("idle");
  const teacherRequestId = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechManualStopRef = useRef(false);
  const speechCapturedTextRef = useRef(false);

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
  const activeProgress = getDayProgress(activeSession.day);
  const savedDoubtDiagnosis = readSavedDoubtDiagnosis(activeProgress);
  const teacherDoubtDiagnosis = teacherCoach?.doubtDiagnosis ?? savedDoubtDiagnosis;
  const labHref = `${basePath}/lab?mode=${activeProgress?.labMode ?? activeLab?.slug ?? ""}&day=${activeSession.day}`;
  const mcqHref = `${basePath}/mcq-readiness?day=${activeSession.day}`;
  const watchCompletion = getSubjectWatchCompletion(activeProgress);
  const labProofCompletion = getSubjectLabProofCompletion(activeProgress);
  const isWatchComplete = watchCompletion.complete;
  const unlockStage = assessment ? getSubjectTalkUnlockStage(assessment) : null;
  const isChallengePending = Boolean(assessment && maicDiscussion && discussionStep === "challenge");
  const isLabUnlocked = unlockStage === "lab" || unlockStage === "mcq";
  const isMcqScoreReady = unlockStage === "mcq";
  const isMcqUnlocked = isMcqScoreReady;
  const watchHref = `${basePath}/watch?day=${activeSession.day}`;
  const shouldOpenWatchAfterTalk = Boolean(assessment && !isChallengePending && !isWatchComplete);
  const routeGateTitle = !assessment
    ? "Awaiting MAIC oral check"
    : isChallengePending
      ? "Peer challenge pending"
    : shouldOpenWatchAfterTalk
      ? "Watch the exact gap"
    : unlockStage === "mcq"
      ? "Practice open"
      : unlockStage === "lab"
        ? "Recall support"
        : unlockStage === "retry"
          ? "Retry talk after compressed recap"
          : "Revisit required";
  const routeGateDetail = !assessment
    ? "The student must explain the topic in their own words before the next room opens."
    : isChallengePending
      ? "The AI teacher has created the counter-question. The student must answer the peer challenge before the final examiner verdict opens the next room."
    : shouldOpenWatchAfterTalk
      ? `Your recall is saved at ${assessment?.score ?? 0}%. Now use the class only to repair the missing concepts before returning to Talk.`
    : unlockStage === "mcq"
      ? `Teacher, peer challenger, and examiner checks reached the ${SUBJECT_RECALL_TARGET}% recall target. Fresh practice can open now; Visual Lab stays optional support.`
      : unlockStage === "lab"
        ? `The explanation crossed the 70 percent floor but is below ${SUBJECT_RECALL_TARGET}%. Use the Visual Lab as support or retry Talk until MCQ opens. Current lab support: ${labProofCompletion.completed}/${labProofCompletion.target} proofs.`
        : unlockStage === "retry"
          ? "The answer has partial logic, but it needs a compressed recap and another oral attempt before forward movement."
          : "The explanation is below the required floor. Send the student to compressed recap, then bring them back for another oral check.";
  const routeGateStudentLine = !assessment
    ? "Write your explanation, then assess it."
    : isChallengePending
      ? "Answer the counter-question."
    : shouldOpenWatchAfterTalk
      ? "Open the class for the missing pieces."
    : unlockStage === "mcq"
        ? "Practice is open."
        : unlockStage === "lab"
          ? "Use support, then explain again."
          : "Revise, then try again.";
  const routeGateTone = !assessment ? "neutral" : isChallengePending ? "locked" : shouldOpenWatchAfterTalk || isLabUnlocked ? "unlocked" : "locked";
  const primaryRouteHref = shouldOpenWatchAfterTalk
    ? watchHref
    : isMcqUnlocked
      ? mcqHref
      : isLabUnlocked
        ? labHref
        : revisitHref;
  const primaryRouteLabel = shouldOpenWatchAfterTalk
    ? "Open class"
    : isMcqUnlocked
      ? "Open practice"
      : isLabUnlocked
        ? "Use visual support"
        : "Open compressed recap";
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
  const teacherPromptLabel = isChallengePending ? "Repair check" : "AI teacher question";
  const teacherPromptTitle = isChallengePending
    ? "Answer one counter-question"
    : learnerLevel === "beginner"
      ? "Explain what you learned"
      : learnerLevel === "advanced"
        ? "Explain the attempt gap"
        : "Explain what you already know";
  const teacherPromptQuestion =
    isChallengePending ? peerChallenge?.message ?? "Add one applied example and one UPSC trap." : activePrompt.question;
  const learnerModeCopy =
    learnerLevel === "beginner"
      ? {
          label: "Beginner discussion after lesson",
          detail: `Explain the lesson, repair gaps, and clear ${SUBJECT_RECALL_TARGET}% recall before MCQs.`,
        }
      : learnerLevel === "advanced"
        ? {
            label: "Advanced attempt diagnosis",
            detail: "Speak first. The AI teacher finds the attempt-level gap before any class.",
          }
        : {
            label: "Intermediate gap diagnosis",
            detail: "Speak what coaching covered. The AI teacher finds missing UPSC links before repair.",
          };
  const themeStyle = getSubjectThemeStyle(plan);
  const isHydratedForActiveDay = hydratedDay === activeDay;
  const isPreRepairTalkAssessment = Boolean(activeProgress?.talkNextRoute?.includes("/watch"));
  const talkFlowGate =
    !isHydratedForActiveDay
      ? null
      : (activeProgress?.revisitQueued || (!isPreRepairTalkAssessment && activeProgress?.talkBand === "Revisit")) &&
          !isChallengePending &&
          !submittedInCurrentVisit
        ? {
            eyebrow: "Revision required",
            title: "Repair the weak point first",
            detail: "The previous explanation identified a weak point. Complete the short revision, then explain again.",
            href: revisitHref,
            cta: "Open short revision",
          }
        : learnerLevel === "beginner" && !isWatchComplete
          ? {
              eyebrow: "Lesson required",
              title: "Finish the lesson first",
              detail: "The beginner path starts with one short lesson. Discussion opens immediately after the lesson handoff.",
              href: watchHref,
              cta: "Open lesson",
            }
          : learnerLevel !== "beginner" &&
              typeof activeProgress?.talkScore === "number" &&
              activeProgress.talkScore < SUBJECT_RECALL_TARGET &&
              !isWatchComplete &&
              !submittedInCurrentVisit
            ? {
                eyebrow: "Repair required",
                title: "Complete the diagnosed repair",
                detail: "Your first explanation is saved. Use the short lesson selected for the missing concepts, then return here.",
                href: watchHref,
                cta: "Open repair lesson",
            }
            : null;
  const mcqReady = Boolean(
    assessment &&
      assessment.score >= SUBJECT_RECALL_TARGET &&
      isMcqUnlocked &&
      !shouldOpenWatchAfterTalk &&
      !isChallengePending
  );
  const talkState = talkFlowGate
    ? "gated"
    : isChallengePending
      ? "repair-answer"
      : assessment
        ? "route-ready"
        : "answer-required";
  const primaryActionLabel = assessment
    ? primaryRouteLabel
    : teacherConnection === "checking"
      ? "Checking answer"
      : "Send to AI teacher";
  const primaryActionHref = assessment && !isChallengePending ? primaryRouteHref : "";
  const teacherStatus: SubjectTalkTeacherStatus = !assessment || isChallengePending
    ? "answer-required"
    : mcqReady
      ? "mcq-ready"
      : "repair-required";
  const teacherGapCategory =
    teacherDoubtDiagnosis?.category ??
    (assessment?.score && assessment.score >= SUBJECT_RECALL_TARGET ? "Mastery" : "Pending");
  const teacherGapReason =
    teacherDoubtDiagnosis?.reason ??
    (assessment
      ? assessment.score >= SUBJECT_RECALL_TARGET
        ? "Recall target is clear enough for fresh MCQs."
        : assessment.summary
      : "Submit one explanation to let the teacher diagnose the gap.");
  const teacherRepairAction =
    teacherDoubtDiagnosis?.repairAction ??
    (assessment
      ? assessment.score >= SUBJECT_RECALL_TARGET
        ? "Move into fresh MCQs and watch for statement traps."
        : teacherCoach?.nextPrompt ?? assessment.nextAction
      : "Write the explanation in your own words.");
  const teacherMasteryCheck =
    teacherDoubtDiagnosis?.masteryCheck ??
    (assessment?.score && assessment.score >= SUBJECT_RECALL_TARGET
      ? "Can the learner create one almost-correct UPSC statement and reject it?"
      : "Can the learner repeat the concept with cause, example, and trap?");

  useEffect(() => {
    if (!isLoaded || hydratedDay === activeDay) return;

    const timer = window.setTimeout(() => {
      const saved = getDayProgress(activeDay);
      const savedMode = saved?.mentorMode ?? "Cause-effect";
      const savedPromptIndex = saved?.activePromptLabel
        ? buildPromptLadder(activeSession, savedMode).findIndex((prompt) => prompt.label === saved.activePromptLabel)
        : 0;

      setLearnerLevel(readStudentProfile()?.level ?? "beginner");
      setMentorMode(savedMode);
      setConfidence(saved?.confidence ?? "Working");
      setAnswerDraft(saved?.reflection ?? "");
      setChallengeDraft(saved?.talkChallengeResponse ?? "");
      setDiscussionStep(
        saved?.talkDiscussionStep === "challenge"
          ? "verdict"
          : saved?.talkDiscussionStep ?? (typeof saved?.talkScore === "number" ? "verdict" : "explain")
      );
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
                    : "Repair toward 95%",
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
      setTeacherCoach(
        saved?.teacherCoachSummary || saved?.teacherCoachNextPrompt
          ? {
              summary: saved.teacherCoachSummary ?? savedAssessment?.summary ?? "Saved teacher guidance.",
              nextPrompt: saved.teacherCoachNextPrompt ?? saved.talkTeacherFollowUpPrompt ?? savedAssessment?.nextAction ?? "Continue with the recommended step.",
              focusConcepts: [],
              doubtDiagnosis: readSavedDoubtDiagnosis(saved) ?? {
                category: "Mastery",
                reason: savedAssessment?.summary ?? "Saved teacher guidance is available.",
                repairAction: saved.talkTeacherFollowUpPrompt ?? savedAssessment?.nextAction ?? "Continue with the recommended step.",
                masteryCheck: "Can the learner explain the concept again without notes?",
              },
              providerScore: saved.teacherProviderScore,
            }
          : null
      );
      setTeacherConnection(
        saved?.teacherMode === "nvidia-teacher" || saved?.teacherMode === "gemini"
          ? "ready"
          : saved?.teacherMode === "local-fallback"
            ? "local"
            : "idle"
      );
      setRevisionQueued(saved?.revisitQueued ?? false);
      setActivePromptIndex(savedPromptIndex >= 0 ? savedPromptIndex : 0);
      setSavedReflection(false);
      setHydratedDay(activeDay);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeDay, activeSession, getDayProgress, hydratedDay, isLoaded]);

  useEffect(() => {
    return () => speechRecognition?.stop();
  }, [speechRecognition]);

  useEffect(() => {
    let cancelled = false;
    void requestUpscSpeechTranscriptionStatus()
      .then((status) => {
        if (!cancelled) setServerTranscriptionAvailable(status.configured);
      })
      .catch(() => {
        if (!cancelled) setServerTranscriptionAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioNoteUrl) URL.revokeObjectURL(audioNoteUrl);
    };
  }, [audioNoteUrl]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder?.state !== "inactive") {
        recorder?.stop();
      }
      recorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      teacherRequestId.current += 1;
    };
  }, []);

  const clearAudioNote = () => {
    setAudioNoteUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), plan.sessions.length);
    speechRecognition?.stop();
    setActiveDay(boundedDay);
    setHydratedDay(null);
    setActivePromptIndex(0);
    setAnswerDraft("");
    setChallengeDraft("");
    setDiscussionStep("explain");
    setAssessment(null);
    setMaicDiscussion(null);
    setTeacherCoach(null);
    setTeacherConnection("idle");
    teacherRequestId.current += 1;
    setSavedReflection(false);
    setRevisionQueued(false);
    setSubmittedInCurrentVisit(false);
    setSpeechRecognition(null);
    setSpeechState("idle");
    setSpeechMessage("");
    setSpeechInterimDraft("");
    clearAudioNote();
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
    teacherStatus?: SubjectTalkTeacherStatus;
    teacherTurnCount?: number;
    teacherFollowUpAnswer?: string;
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
      talkTeacherStatus: patch.teacherStatus ?? teacherStatus,
      talkTeacherTurnCount: patch.teacherTurnCount ?? existing?.talkTeacherTurnCount,
      talkTeacherFollowUpAnswer: patch.teacherFollowUpAnswer ?? existing?.talkTeacherFollowUpAnswer,
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
    const nextDiscussionStep: SubjectTalkDiscussionStep = "verdict";
    const nextClassroomStage: SubjectTalkClassroomStage = "examiner-verdict";
    const nextIsLabUnlocked = nextUnlockStage === "lab" || nextUnlockStage === "mcq";
    const nextIsMcqUnlocked = nextUnlockStage === "mcq";
    const nextShouldOpenWatch = !isWatchComplete;
    const nextRoute = nextShouldOpenWatch
      ? watchHref
      : nextIsMcqUnlocked
        ? mcqHref
        : nextIsLabUnlocked
          ? labHref
        : revisitHref;
    const nextActionLabel = nextShouldOpenWatch
      ? "Open class"
      : nextIsMcqUnlocked
        ? "Open practice"
        : nextIsLabUnlocked
          ? "Use visual support"
        : "Open compressed recap";
    const nextConfidence: SubjectConfidence =
      nextUnlockStage === "mcq" ? "Command" : nextUnlockStage === "revisit" ? "Shaky" : "Working";
    const nextRevisionQueued = isWatchComplete && (nextUnlockStage === "revisit" || nextUnlockStage === "retry");

    setAssessment(nextAssessment);
    setMaicDiscussion(nextDiscussion);
    setConfidence(nextConfidence);
    setRevisionQueued(nextRevisionQueued);
    setDiscussionStep(nextDiscussionStep);
    setSavedReflection(true);
    setSubmittedInCurrentVisit(true);
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
      preliminaryScore: undefined,
      teacherStatus: nextAssessment.score >= SUBJECT_RECALL_TARGET && nextIsMcqUnlocked && isWatchComplete ? "mcq-ready" : "repair-required",
      teacherTurnCount: includeChallenge ? 2 : 1,
      teacherFollowUpAnswer: includeChallenge ? challengeDraft.trim() : undefined,
      incrementSavedCount: true,
    });
    setTeacherCoach(null);
    setTeacherConnection("checking");
    const requestId = teacherRequestId.current + 1;
    teacherRequestId.current = requestId;
    void requestAdaptiveTeacherDiscussion({
      subjectSlug: plan.slug,
      day: activeSession.day,
      answer: answerDraft,
      challengeAnswer: includeChallenge ? challengeDraft : undefined,
      learnerLevel,
    })
      .then((response) => {
        if (teacherRequestId.current !== requestId) return;
        setTeacherCoach(response.coach);
        setTeacherConnection(response.mode === "local-fallback" ? "local" : "ready");
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

  const stopAudioRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return false;
    if (recorder.state !== "inactive") {
      recorder.stop();
      setSpeechMessage("Stopping voice note...");
      return true;
    }
    return false;
  };

  const startAudioFallbackRecording = async (reason: string) => {
    setSpeechInterimDraft("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setSpeechState("unsupported");
      setSpeechMessage(`${reason} Audio-note recording is unavailable in this browser. Type your answer here.`);
      return;
    }

    try {
      clearAudioNote();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setSpeechState("idle");

        if (blob.size === 0) {
          setSpeechMessage("Voice note stopped, but no audio was captured. Try again or type the answer.");
          return;
        }

        const nextUrl = URL.createObjectURL(blob);
        setAudioNoteUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
        if (serverTranscriptionAvailable === false) {
          setSpeechMessage(
            "Voice note recorded. Automatic transcription is not configured yet. Play it back, then type the key points for AI checking."
          );
          return;
        }

        setSpeechMessage("Voice note recorded. Uploading for server transcription...");
        setSpeechTranscribing(true);
        void requestUpscSpeechTranscription(blob)
          .then((result) => {
            if (!result.transcript) {
              setSpeechMessage("Voice note recorded. Play it back, then type the transcript for AI checking.");
              return;
            }
            setAnswerDraft((current) => appendSpeechTranscript(current, result.transcript));
            clearAudioNote();
            setChallengeDraft("");
            setDiscussionStep("explain");
            setAssessment(null);
            setMaicDiscussion(null);
            setTeacherCoach(null);
            setTeacherConnection("idle");
            teacherRequestId.current += 1;
            setSavedReflection(false);
            setSubmittedInCurrentVisit(false);
            setSpeechMessage("Voice note transcribed into the answer box. Review it, then send to the AI teacher.");
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : "Server transcription failed.";
            setSpeechMessage(`Voice note recorded. ${message} Play it back, then type the transcript for AI checking.`);
          })
          .finally(() => {
            setSpeechTranscribing(false);
          });
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setSpeechState("error");
        setSpeechMessage("Audio-note recording failed. Type your answer here, or retry after refreshing.");
      };

      recorder.start();
      setSpeechRecognition(null);
      setSpeechState("recording");
      setSpeechMessage(`${reason} Recording audio note now. Stop when you finish.`);
    } catch {
      setSpeechState("blocked");
      setSpeechMessage("Microphone recording is blocked. Allow microphone access for this site, then try again.");
    }
  };

  const toggleSpeechCapture = async () => {
    if (speechState === "recording") {
      stopAudioRecording();
      return;
    }

    if (speechState === "listening" && speechRecognition) {
      speechManualStopRef.current = true;
      speechRecognition.stop();
      setSpeechRecognition(null);
      setSpeechState("idle");
      setSpeechInterimDraft("");
      setSpeechMessage("Recording stopped.");
      return;
    }

    setSpeechMessage("");
    setSpeechInterimDraft("");
    clearAudioNote();
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      await startAudioFallbackRecording("Speech-to-text is unavailable in this browser.");
      return;
    }

    try {
      await requestMicrophonePermission();
    } catch {
      setSpeechRecognition(null);
      setSpeechState("blocked");
      setSpeechMessage("Microphone permission is blocked. Allow microphone access for this site, then try again.");
      return;
    }

    const recognition = new Recognition();
    let stoppedByError = false;
    speechManualStopRef.current = false;
    speechCapturedTextRef.current = false;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onstart = () => {
      setSpeechRecognition(recognition);
      setSpeechState("listening");
      setSpeechInterimDraft("");
      setSpeechMessage("Listening now. Speak your full answer in one flow.");
    };
    recognition.onresult = (event) => {
      const { finalTranscript, interimTranscript } = collectSpeechTranscripts(event);
      setSpeechInterimDraft(interimTranscript);

      if (interimTranscript && !finalTranscript) {
        setSpeechMessage("Transcribing live. Keep speaking, then pause for the final text.");
      }

      if (finalTranscript) {
        speechCapturedTextRef.current = true;
        setAnswerDraft((current) => appendSpeechTranscript(current, finalTranscript));
        clearAudioNote();
        setSpeechMessage("Speech captured as text. You can continue speaking or stop recording.");
        setChallengeDraft("");
        setDiscussionStep("explain");
        setAssessment(null);
        setMaicDiscussion(null);
        setTeacherCoach(null);
        setTeacherConnection("idle");
        teacherRequestId.current += 1;
        setSavedReflection(false);
        setSubmittedInCurrentVisit(false);
      }
    };
    recognition.onend = () => {
      setSpeechRecognition(null);
      setSpeechInterimDraft("");
      if (!stoppedByError) {
        if (!speechManualStopRef.current && !speechCapturedTextRef.current) {
          void startAudioFallbackRecording("Live speech did not return text.");
          return;
        }
        setSpeechState("idle");
        setSpeechMessage((current) =>
          current && !current.startsWith("Listening") && !current.startsWith("Transcribing")
            ? current
            : "Recording stopped. If no text appeared, try again or type the answer."
        );
      }
    };
    recognition.onerror = (event) => {
      stoppedByError = true;
      setSpeechRecognition(null);
      setSpeechInterimDraft("");
      if (event.error === "network" || event.error === "no-speech") {
        void startAudioFallbackRecording(
          event.error === "network"
            ? "Browser speech recognition could not reach its speech service."
            : "Live speech did not return text."
        );
        return;
      }
      setSpeechState(event.error === "not-allowed" || event.error === "service-not-allowed" ? "blocked" : "error");
      setSpeechMessage(getSpeechErrorMessage(event.error));
    };
    try {
      recognition.start();
    } catch {
      setSpeechRecognition(null);
      setSpeechState("error");
      setSpeechInterimDraft("");
      setSpeechMessage("Voice capture could not start. Refresh once or type your answer here.");
    }
  };

  if (!isLoaded || !isHydratedForActiveDay) {
    return (
      <div style={themeStyle} className="flex min-h-screen items-center justify-center bg-[var(--subject-bg)] text-[var(--subject-text)]">
        <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-6 text-sm font-black">
          Loading {plan.title} Talk room...
        </div>
      </div>
    );
  }

  if (talkFlowGate) {
    return (
      <div
        data-testid="subject-room-shell"
        data-room="talk-gate"
        data-subject={plan.slug}
        data-subject-accent={plan.accent}
        style={themeStyle}
        className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
          <Link href={basePath} className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <section
            data-testid="subject-talk-flow-gate"
            data-proof-rule="ai-teacher-recall-score-doubt-repair-route"
            data-learner-level={learnerLevel}
            data-flow-state="gated"
            data-gate-href={talkFlowGate.href}
            data-recall-target={SUBJECT_RECALL_TARGET}
            className="rounded-lg border border-[#ef9f27]/55 bg-[#fff4df] p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#9a6a16] text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">{talkFlowGate.eyebrow}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--subject-heading)]">{talkFlowGate.title}</h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f4a12]">{talkFlowGate.detail}</p>
                <Link
                  data-testid="subject-talk-flow-gate-action"
                  href={talkFlowGate.href}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90"
                >
                  {talkFlowGate.cta}
                  <ArrowRight className="h-4 w-4" />
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
      data-room="talk"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={basePath} className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">Talk</Badge>
            <span className="text-sm font-black text-[var(--subject-accent)]">Day {activeSession.day}</span>
            <span className="text-sm font-semibold text-[#746f66]">{activeSession.chapter}</span>
          </div>
        </div>

        <section
          data-testid="subject-talk-simple-step"
          data-proof-rule="ai-teacher-recall-score-doubt-repair-route"
          data-student-flow="single-answer"
          data-learner-level={learnerLevel}
          data-flow-state={talkState}
          data-recall-target={SUBJECT_RECALL_TARGET}
          data-primary-action-label={primaryActionLabel}
          data-primary-action-href={primaryActionHref}
          data-watch-complete={isWatchComplete ? "true" : "false"}
          data-mcq-ready={mcqReady ? "true" : "false"}
          className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5">
            <h1 className="text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
              {learnerLevel === "beginner"
                ? `Explain the lesson in your own words. The AI teacher keeps the discussion focused until recall reaches ${SUBJECT_RECALL_TARGET}%.`
                : learnerLevel === "advanced"
                  ? `Speak your attempt-level gap first. The AI teacher diagnoses what is blocking command and repairs it toward ${SUBJECT_RECALL_TARGET}% recall.`
                  : `Speak what coaching already covered. The AI teacher identifies the missing UPSC links and repairs them toward ${SUBJECT_RECALL_TARGET}% recall.`}
            </p>
            <div
              data-testid="subject-talk-learner-mode"
              className="mt-4 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                {learnerModeCopy.label}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{learnerModeCopy.detail}</p>
            </div>
            <div
              data-testid="subject-talk-simple-loop"
              className="mt-4 grid gap-2 text-xs font-black uppercase tracking-[0.1em] text-[var(--subject-dark)] sm:grid-cols-4"
            >
              {["Speak", "AI teacher check", `${SUBJECT_RECALL_TARGET}% recall`, "Next room"].map((step, index) => (
                <div
                  key={step}
                  className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--subject-accent)] text-[11px] text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="talk-discussion-window" className="rounded-lg border border-[var(--subject-ring)] bg-[var(--subject-light)] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--subject-accent)] text-white">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">{teacherPromptLabel}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--subject-heading)]">
                  {teacherPromptTitle}
                </h2>
                <p className="mt-3 text-lg font-black leading-8 text-[var(--subject-heading)]">{teacherPromptQuestion}</p>
              </div>
            </div>
          </div>

          {!isChallengePending && (
            <>
              <textarea
                data-testid="talk-answer-draft"
                value={answerDraft}
                onChange={(event) => {
                  setAnswerDraft(event.target.value);
                  setChallengeDraft("");
                  setDiscussionStep("explain");
                  setAssessment(null);
                  setMaicDiscussion(null);
                  setTeacherCoach(null);
                  setTeacherConnection("idle");
                  teacherRequestId.current += 1;
                  setSavedReflection(false);
                  setSubmittedInCurrentVisit(false);
                }}
                placeholder="Write the explanation in your own words: concept, mechanism, example, and one UPSC trap."
                className="mt-5 min-h-40 w-full resize-y rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[var(--subject-accent)] focus:ring-2 focus:ring-[var(--subject-accent)]/20"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  data-testid="talk-speak-answer"
                  onClick={toggleSpeechCapture}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-4 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] sm:w-auto"
                >
                  {speechState === "listening" || speechState === "recording" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {speechState === "listening" ? "Stop speaking" : speechState === "recording" ? "Stop recording" : "Speak answer"}
                </button>
                <button
                  type="button"
                  data-testid="talk-assess-answer"
                  aria-label="Assess explanation"
                  onClick={() => assessCurrentAnswer(false)}
                  disabled={answerDraft.trim().length < 20 || teacherConnection === "checking"}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <Gauge className="h-4 w-4" /> {teacherConnection === "checking" ? "Checking answer..." : "Check answer"}
                </button>
                {speechMessage ? (
                  <span
                    aria-live="polite"
                    className={cn(
                      "flex min-h-11 items-center text-xs font-bold",
                      speechState === "blocked" || speechState === "error" || speechState === "unsupported"
                        ? "text-[#9a4b0f]"
                        : "text-[#756f64]"
                    )}
                  >
                    {speechMessage}
                  </span>
                ) : null}
                {speechInterimDraft ? (
                  <span
                    aria-live="polite"
                    data-testid="talk-speech-interim"
                    className="w-full max-w-full rounded-md border border-[var(--subject-border)] bg-white px-3 py-2 text-xs font-bold leading-5 text-[var(--subject-dark)]"
                  >
                    Transcribing: {speechInterimDraft}
                  </span>
                ) : null}
                {audioNoteUrl ? (
                  <audio
                    aria-label="Recorded answer voice note"
                    className="h-10 w-full max-w-xs"
                    controls
                    src={audioNoteUrl}
                  />
                ) : null}
                {speechTranscribing ? (
                  <span className="inline-flex min-h-10 items-center rounded-md border border-[var(--subject-border)] bg-white px-3 text-xs font-black text-[var(--subject-dark)]">
                    Transcribing voice note...
                  </span>
                ) : null}
              </div>
            </>
          )}

          {savedReflection && (
            <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
              <p className="text-sm font-bold leading-6 text-[#085041]">Saved for this day.</p>
            </div>
          )}

          {assessment && !isChallengePending && (
            <div
              data-testid="talk-score-card"
              data-proof-rule="ai-teacher-recall-score-doubt-repair-route"
              data-score={assessment.score}
              data-band={assessment.band}
              data-teacher-status={teacherStatus}
              className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">AI teacher score</p>
                  <h3 className="mt-2 text-3xl font-black text-[#13251d]">{assessment.score}%</h3>
                  <p className="mt-1 text-sm font-black text-[#085041]">{assessment.band}</p>
                </div>
                <span className="rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white">
                  {assessment.nextAction}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-[#49675e]">{assessment.summary}</p>

              <div data-testid="talk-recall-target" className="mt-4 rounded-md border border-[#cfe5dc] bg-white/80 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#085041]">
                    Target {SUBJECT_RECALL_TARGET}% recall
                  </p>
                  <span className="rounded-md bg-[#eef8f3] px-3 py-1 text-xs font-black text-[#085041]">
                    {assessment.score >= SUBJECT_RECALL_TARGET
                      ? `${SUBJECT_RECALL_TARGET}% recall cleared`
                      : `${Math.max(SUBJECT_RECALL_TARGET - assessment.score, 0)}% gap remains`}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                  {assessment.score >= SUBJECT_RECALL_TARGET
                    ? "Practice opens because the explanation is strong enough for fresh MCQs."
                    : assessment.missingKeywords.length
                      ? `Repair these missing anchors before MCQ: ${assessment.missingKeywords.slice(0, 3).join(", ")}.`
                      : "Explain one clearer cause-effect chain, one example, and one UPSC trap before MCQ."}
                </p>
              </div>

              <div
                data-testid="subject-talk-command-summary"
                data-proof-rule="ai-teacher-gap-repair-mastery-next"
                data-gap-category={teacherGapCategory}
                data-teacher-status={teacherStatus}
                data-score={assessment.score}
                data-recall-target={SUBJECT_RECALL_TARGET}
                data-next-action-route={primaryRouteHref}
                data-next-action-label={primaryRouteLabel}
                data-mcq-ready={mcqReady ? "true" : "false"}
                className="mt-4 rounded-md border border-[#cfe5dc] bg-white/85 p-3"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#085041]">Teacher command</p>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  {[
                    ["Gap", teacherGapCategory],
                    ["Repair", teacherRepairAction],
                    ["Check", teacherMasteryCheck],
                    ["Next", primaryRouteLabel],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-[#f7f4ee] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">{label}</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-[#34453b]">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs font-bold leading-5 text-[#49675e]">{teacherGapReason}</p>
              </div>

              {teacherDoubtDiagnosis ? (
                <div data-testid="subject-talk-doubt-diagnosis" className="mt-4 rounded-md border border-[#d7e8df] bg-white/80 p-3">
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

              <div data-testid="subject-talk-teacher-coach" className="mt-4 rounded-md border border-[#cfe5dc] bg-white/75 p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#085041]">Your mastery plan</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                  {teacherCoach?.nextPrompt ??
                    (assessment.score >= SUBJECT_RECALL_TARGET
                      ? "Recall target cleared. Apply the concept in fresh MCQs."
                      : assessment.missingKeywords.length
                        ? `Repair ${assessment.missingKeywords.slice(0, 3).join(", ")} through one cause-effect chain, one applied example, and one UPSC trap.`
                        : "Repair the weakest concept, then explain once more.")}
                </p>
                {(teacherCoach?.focusConcepts.length ? teacherCoach.focusConcepts : assessment.missingKeywords).length ? (
                  <p className="mt-2 text-xs font-bold leading-5 text-[#657066]">
                    Focus concepts: {(teacherCoach?.focusConcepts.length ? teacherCoach.focusConcepts : assessment.missingKeywords).slice(0, 4).join(", ")}
                  </p>
                ) : null}
                {teacherConnection !== "idle" ? (
                  <p
                    data-testid="subject-talk-teacher-connection"
                    aria-live="polite"
                    className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#1d9e75]"
                  >
                    {teacherConnection === "checking"
                      ? "Teacher is refining the next question..."
                      : teacherConnection === "ready"
                        ? "AI teacher guidance active."
                        : teacherConnection === "local"
                          ? "Local teacher guidance active."
                          : "Local score is active. Teacher service will retry later."}
                  </p>
                ) : null}
              </div>

              <div
                data-testid="talk-route-gate"
                data-proof-rule="ai-teacher-recall-score-doubt-repair-route"
                data-day={activeSession.day}
                data-learner-level={learnerLevel}
                data-flow-state={talkState}
                data-score={assessment.score}
                data-band={assessment.band}
                data-recall-target={SUBJECT_RECALL_TARGET}
                data-next-action-route={primaryRouteHref}
                data-next-action-label={primaryRouteLabel}
                data-mcq-ready={mcqReady ? "true" : "false"}
                data-watch-complete={isWatchComplete ? "true" : "false"}
                data-teacher-status={teacherStatus}
                className={cn(
                  "mt-4 rounded-lg border p-4",
                  routeGateTone === "unlocked" && "border-[#1d9e75]/45 bg-white/70",
                  routeGateTone === "locked" && "border-[#ef9f27]/45 bg-[#fff4df]",
                  routeGateTone === "neutral" && "border-[#dcd5c7] bg-[#fdfaf3]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white",
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
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">Next</p>
                    <h2 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">{routeGateTitle}</h2>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#49675e]">{routeGateStudentLine}</p>
                  </div>
                </div>
                <details className="mt-3 rounded-md bg-white/60 p-2">
                  <summary className="cursor-pointer text-xs font-black text-[#1a3a2a]">Why this gate?</summary>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#49675e]">{routeGateDetail}</p>
                </details>
                <Link
                  data-testid="talk-primary-route"
                  data-next-action-route={primaryRouteHref}
                  data-next-action-label={primaryRouteLabel}
                  data-recall-target={SUBJECT_RECALL_TARGET}
                  data-score={assessment.score}
                  data-mcq-ready={mcqReady ? "true" : "false"}
                  href={primaryRouteHref}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  {primaryRouteLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {isChallengePending && (
            <div data-testid="subject-talk-peer-challenge" className="mt-5 rounded-lg border border-[#d9d4f0] bg-[#f8f6ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5b4ba8]">Peer Challenger</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">One repair answer</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-[#5f5b73]">
                Write only the missing link. The final route opens after this check.
              </p>
              <textarea
                data-testid="subject-talk-challenge-response"
                value={challengeDraft}
                onChange={(event) => {
                  setChallengeDraft(event.target.value);
                  setDiscussionStep("challenge");
                  setTeacherCoach(null);
                  setTeacherConnection("idle");
                  teacherRequestId.current += 1;
                  setSavedReflection(false);
                }}
                placeholder="Answer the challenge in 2-3 precise lines."
                className="mt-4 min-h-28 w-full resize-y rounded-lg border border-[#d9d4f0] bg-white p-3 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#5b4ba8] focus:ring-2 focus:ring-[#5b4ba8]/20"
              />
              <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-xs font-bold leading-5 text-[#5f5b73]">
                  {examinerTurn?.message ?? "The examiner will combine both answers before opening the next room."}
                </p>
                <button
                  type="button"
                  data-testid="subject-talk-reassess-challenge"
                  onClick={() => assessCurrentAnswer(true)}
                  disabled={challengeDraft.trim().length < 20 || teacherConnection === "checking"}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#5b4ba8] px-3 text-sm font-bold text-white transition hover:bg-[#46398b] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <Gauge className="h-4 w-4" /> {teacherConnection === "checking" ? "Checking answer..." : "Recheck"}
                </button>
              </div>
            </div>
          )}
        </section>

        <details data-testid="subject-talk-details" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
            Optional learning details
          </summary>
          <div className="mt-5 grid gap-5">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#ef9f27]" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Hint</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">{activePrompt.nudge}</p>
                </div>
              </div>
            </div>
            {maicDiscussion && (
              <details data-testid="subject-maic-discussion-turns" className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
                  AI teacher, peer, and examiner transcript
                </summary>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Discussion record</p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">
                      {isChallengePending ? "Challenge in progress" : "Verdict saved"}
                    </h3>
                  </div>
                  <span className="rounded-md bg-[#f2eadc] px-3 py-2 text-xs font-black text-[#1a3a2a]">
                    {maicDiscussion.score}%
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {maicDiscussion.turns.map((turn) => (
                    <div key={`details-${turn.role}-${turn.title}`} className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{turn.role}</p>
                      <p className="mt-1 text-sm font-black text-[#13251d]">{turn.title}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
            <div
              data-testid="subject-talk-single-answer-rule"
              className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                Single answer rule
              </p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-[var(--subject-heading)]">
                Explain once in the main answer box
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                The AI teacher uses the main explanation above as the diagnosis. Beginner students explain after the lesson;
                intermediate and advanced students explain before any repair class opens.
              </p>
              {answerDraft.trim() ? (
                <p className="mt-3 line-clamp-3 rounded-md bg-white p-3 text-sm font-bold leading-6 text-[#34453b]">
                  {answerDraft}
                </p>
              ) : null}
            </div>
            <details
              data-testid="subject-talk-teacher-controls"
              className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-3"
            >
              <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-[var(--subject-dark)]">
                Teacher tools
              </summary>
              <div className="mt-3 grid gap-4">
            <details data-testid="subject-talk-more-controls" className="rounded-md border border-[var(--subject-border)] bg-white p-3">
              <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-[var(--subject-dark)]">More controls</summary>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    persistCurrentState({ incrementSavedCount: true });
                    setSavedReflection(true);
                  }}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] sm:w-auto"
                >
                  <Save className="h-4 w-4" /> Save draft
                </button>
                <button
                  type="button"
                  onClick={() => setActivePromptIndex((current) => Math.min(current + 1, promptLadder.length - 1))}
                  disabled={activePromptIndex === promptLadder.length - 1}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  Next question <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </details>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                      "min-h-12 rounded-md border px-3 text-left text-xs font-black transition",
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
            <div className="h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${progress}%` }} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Must cover</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {subtopics.map((topic) => (
                    <span key={topic} className="rounded-md border border-[#cfc6b6] bg-white px-2 py-1 text-xs font-black text-[#1a3a2a]">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Mentor lens</p>
                <div className="mt-3 grid gap-2">
                  {mentorModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={mentorMode === mode}
                      onClick={() => {
                        setMentorMode(mode);
                        persistCurrentState({ mentorMode: mode });
                      }}
                      className={cn(
                        "rounded-md border px-3 py-2 text-left text-xs font-black transition",
                        mentorMode === mode
                          ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                          : "border-[#dcd5c7] bg-white text-[#5f665f] hover:border-[#1d9e75]"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Confidence</p>
                <div className="mt-3 grid gap-2">
                  {confidenceOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={confidence === option}
                      onClick={() => {
                        setConfidence(option);
                        persistCurrentState({ confidence: option });
                      }}
                      className={cn(
                        "flex min-h-10 items-center justify-between rounded-md border px-3 text-left text-xs font-black transition",
                        confidence === option
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : "border-[#dcd5c7] bg-white text-[#34453b] hover:border-[#1d9e75]"
                      )}
                    >
                      {option}
                      {confidence === option && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {learningPack ? (
              <div data-testid={`${plan.slug}-talk-teacher-pack`} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{plan.title} oral rubric</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">{learningPack.lens}</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-[#49675e]">{learningPack.teacherFocus}</p>
              </div>
            ) : null}
            {historyPack ? (
              <div data-testid="history-talk-classroom-protocol" className="rounded-lg border border-[#cfe5dc] bg-[#f6fbf8] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">History classroom protocol</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">Teacher, peer, examiner, memory loop</h3>
                  </div>
                  <span data-testid="history-talk-stage" className="rounded-md bg-white px-3 py-2 text-xs font-black text-[#085041] ring-1 ring-[#1d9e75]/20">
                    {classroomStageLabels[talkClassroomStage]}
                  </span>
                </div>
              </div>
            ) : null}
              </div>
            </details>
            {maicDiscussion && (
              <div data-testid="subject-maic-discussion-turns-detail" className="grid gap-3 md:grid-cols-2">
                {maicDiscussion.turns.map((turn) => (
                  <div key={`${turn.role}-${turn.title}`} className="rounded-lg border border-[#dcd5c7] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{turn.role}</p>
                    <h3 className="mt-2 text-sm font-black text-[#13251d]">{turn.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#34453b]">{turn.message}</p>
                  </div>
                ))}
              </div>
            )}
            {assessment?.band === "Revisit" && (
              <div className="rounded-lg border border-[#ef9f27]/40 bg-[#fff4df] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">Compressed revisit</p>
                <div className="mt-3 grid gap-2">
                  {compressedRecap.slice(0, 3).map((line) => (
                    <p key={line} className="rounded-md bg-white/70 p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => selectDay(activeSession.day - 1)}
                disabled={activeSession.day === 1}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" /> Previous day
              </button>
              <button
                type="button"
                onClick={() => selectDay(activeSession.day + 1)}
                disabled={activeSession.day === plan.sessions.length}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Next day <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextValue = !revisionQueued;
                  setRevisionQueued(nextValue);
                  persistCurrentState({ revisitQueued: nextValue });
                }}
                className={cn(
                  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition sm:w-auto",
                  revisionQueued ? "bg-[#e7f5ee] text-[#085041] ring-1 ring-[#1d9e75]/30" : "bg-[#1a3a2a] text-white hover:bg-[#10291d]"
                )}
              >
                <RefreshCcw className="h-4 w-4" />
                {revisionQueued ? "Queued for revisit" : "Queue revisit"}
              </button>
            </div>
            <SubjectLoopActions plan={plan} activeDay={activeSession.day} current="talk" />
          </div>
        </details>
      </div>
    </div>
  );
}
