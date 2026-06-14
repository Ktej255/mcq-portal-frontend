"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  KeyRound,
  Lightbulb,
  Lock,
  MapPinned,
  MessageCircle,
  Mic,
  MicOff,
  RefreshCcw,
  Save,
} from "lucide-react";

import { GeographyRoomCompass } from "@/components/upsc/GeographyRoomCompass";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import {
  assessGeographyModuleRecall,
  getCumulativeGeographyModuleSections,
  getGeographyContentModule,
  getGeographyModuleSection,
  getPrimaryGeographyContentModuleForDay,
  type GeographyContentModule,
  type GeographyContentModuleSection,
  type GeographyModuleRecallAssessment,
} from "@/lib/upsc/geographyContentModules";
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
import { isLocalMockMasterSession, isMasterEmail } from "@/lib/auth/master-access";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { AdaptiveTeacherCoach, AdaptiveTeacherDoubtDiagnosis } from "@/lib/upsc/adaptiveTeacher";
import { requestAdaptiveTeacherDiscussion } from "@/services/upscTeacherService";
import { requestUpscSpeechTranscription, requestUpscSpeechTranscriptionStatus } from "@/services/upscSpeechService";
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

function moduleWatchHref(day: number, module: GeographyContentModule, section: GeographyContentModuleSection) {
  return `/upsc/geography/watch?day=${day}&module=${module.id}&section=${section.id}`;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function moduleRouteFor(
  session: GeographySession,
  module: GeographyContentModule | null,
  section: GeographyContentModuleSection | null,
  moduleRecall: GeographyModuleRecallAssessment | null
) {
  if (!module || !section || !moduleRecall) return null;
  const targetIndex = module.sections.findIndex((item) => item.id === section.id);
  const nextSection = module.sections[targetIndex + 1];

  if (moduleRecall.currentMasteryPercent < GEOGRAPHY_RECALL_TARGET) {
    return {
      href: moduleWatchHref(session.day, module, section),
      label: "Reopen missing slide",
      title: "Cumulative recall is incomplete",
      detail: moduleRecall.repairPrompt,
      tone: "border-[#8db7d8] bg-[#edf7ff] text-[#23406f]",
    };
  }

  if (nextSection) {
    return {
      href: moduleWatchHref(session.day, module, nextSection),
      label: "Open next slide",
      title: "Next module slide unlocked",
      detail: `Slide ${targetIndex + 2} opens now. Discussion will still include slides 1-${targetIndex + 2}.`,
      tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
    };
  }

  return {
    href: `/upsc/geography/mcq-readiness?day=${session.day}`,
    label: "Open MCQ",
    title: "Module cleared",
    detail: "All module sections are recalled cumulatively. Fresh MCQ practice is next.",
    tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
  };
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

type GeographyTalkRoomProps = {
  initialDay?: number;
  initialModuleId?: string;
  initialSectionId?: string;
  dayStartReturnDay?: number;
};

export function GeographyTalkRoom({ initialDay, initialModuleId, initialSectionId, dayStartReturnDay }: GeographyTalkRoomProps) {
  const { user } = useAuth();
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
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [speechMessage, setSpeechMessage] = useState("");
  const [speechInterimDraft, setSpeechInterimDraft] = useState("");
  const [speechTranscribing, setSpeechTranscribing] = useState(false);
  const [serverTranscriptionAvailable, setServerTranscriptionAvailable] = useState<boolean | null>(null);
  const [audioNoteUrl, setAudioNoteUrl] = useState("");
  const [teacherCoach, setTeacherCoach] = useState<AdaptiveTeacherCoach | null>(null);
  const [moduleRecall, setModuleRecall] = useState<GeographyModuleRecallAssessment | null>(null);
  const [activeLedgerTab, setActiveLedgerTab] = useState<"known" | "need">("known");
  const [teacherConnection, setTeacherConnection] = useState<"idle" | "checking" | "ready" | "local" | "unavailable">("idle");
  const [submittedInCurrentVisit, setSubmittedInCurrentVisit] = useState(false);
  const teacherRequestId = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const answerDraftRef = useRef<HTMLTextAreaElement | null>(null);
  const speechManualStopRef = useRef(false);
  const speechCapturedTextRef = useRef(false);

  const activeSession = resolveSession(activeDay);
  const dayStartReturnSession =
    dayStartReturnDay && dayStartReturnDay > activeSession.day ? resolveSession(dayStartReturnDay) : null;
  const requestedModule = getGeographyContentModule(initialModuleId);
  const dayModule = getPrimaryGeographyContentModuleForDay(activeSession.day);
  const activeModule = requestedModule?.day === activeSession.day ? requestedModule : dayModule;
  const activeModuleSection = activeModule ? getGeographyModuleSection(activeModule, initialSectionId) : null;
  const activeModuleSections =
    activeModule && activeModuleSection
      ? getCumulativeGeographyModuleSections(activeModule, activeModuleSection.id)
      : [];
  const activeModuleSectionIds = activeModuleSections.map((section) => section.id);
  const activeExpectedRecallPoints = activeModuleSections.flatMap((section) =>
    section.expectedRecallPoints.map((point) => `${point.label}: ${point.detail}`)
  );
  const hasMasterAccess = isMasterEmail(user?.email) || isLocalMockMasterSession();
  const progress = getDayProgress(activeSession.day);
  const activeModuleProgress = activeModule ? progress?.moduleProgress?.[activeModule.id] : undefined;
  const activeModuleSectionRead = Boolean(
    activeModuleSection && activeModuleProgress?.readSectionIds?.includes(activeModuleSection.id)
  );
  const activeModuleSectionPassed = Boolean(
    activeModuleSection && activeModuleProgress?.passedSectionIds?.includes(activeModuleSection.id)
  );
  const savedDoubtDiagnosis = readSavedDoubtDiagnosis(progress);
  const teacherDoubtDiagnosis = teacherCoach?.doubtDiagnosis ?? savedDoubtDiagnosis;
  const watchScenes = buildGeographyWatchScenes(activeSession);
  const watchProofCount = Math.min(progress?.watchSceneCompletedIds?.length ?? (progress?.watched ? watchScenes.length : 0), watchScenes.length);
  const isWatchComplete = Boolean(progress?.watched) && watchProofCount >= watchScenes.length;
  const isTalkContentReady = isWatchComplete || activeModuleSectionRead || activeModuleSectionPassed;
  const recap = getCompressedGeographyRecap(activeSession);
  const watchHandoff = progress?.watchHandoffSummary?.trim() ?? "";
  const dayStartRecallRoute =
    dayStartReturnSession && assessment?.score && assessment.score >= GEOGRAPHY_RECALL_TARGET
      ? {
          href: `/upsc/geography?day=${dayStartReturnSession.day}`,
          label: `Open Day ${dayStartReturnSession.day}`,
          title: `Day ${dayStartReturnSession.day} can start`,
          detail: `Previous-day recall is clear. Continue with ${dayStartReturnSession.title}.`,
          tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
        }
      : null;
  const route = assessment
    ? dayStartRecallRoute ??
      moduleRouteFor(activeSession, activeModule, activeModuleSection, moduleRecall) ??
      nextRouteFor(activeSession, assessment, isTalkContentReady, learnerLevel)
    : null;
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
    moduleRecall?.currentMasteryPercent ?? assessment?.score ?? (typeof progress?.talkScore === "number" ? progress.talkScore : 0);
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
      : learnerLevel === "beginner" && !isTalkContentReady
        ? {
            eyebrow: "Lesson required",
            title: activeModule ? "Read this module slide first" : "Finish the lesson first",
            detail: activeModule
              ? "Read the current slide, save it, then discuss every unlocked slide cumulatively."
              : "Your beginner path starts with one 10-15 minute topic. The discussion opens immediately after it.",
            href:
              activeModule && activeModuleSection
                ? moduleWatchHref(activeSession.day, activeModule, activeModuleSection)
                : `/upsc/geography/watch?day=${activeSession.day}`,
            cta: activeModule ? "Open slide" : "Open lesson",
          }
        : learnerLevel !== "beginner" &&
            typeof progress?.talkScore === "number" &&
            progress.talkScore < GEOGRAPHY_RECALL_TARGET &&
            !isTalkContentReady &&
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
  const teacherStatus =
    !assessment || challengeOpen ? "answer-required" : mcqReady ? "mcq-ready" : "repair-required";
  const teacherGapCategory =
    teacherDoubtDiagnosis?.category ??
    (assessment?.score && assessment.score >= GEOGRAPHY_RECALL_TARGET ? "Mastery" : "Pending");
  const teacherGapReason =
    teacherDoubtDiagnosis?.reason ??
    (assessment
      ? assessment.score >= GEOGRAPHY_RECALL_TARGET
        ? "Recall target is clear enough for fresh MCQs."
        : assessment.summary
      : "Submit one explanation to let the teacher diagnose the gap.");
  const teacherRepairAction =
    teacherDoubtDiagnosis?.repairAction ??
    (assessment
      ? assessment.score >= GEOGRAPHY_RECALL_TARGET
        ? "Move into fresh MCQs and watch for statement traps."
        : teacherCoach?.nextPrompt ?? assessment.nextAction
      : "Write the explanation in your own words.");
  const teacherMasteryCheck =
    teacherDoubtDiagnosis?.masteryCheck ??
    (assessment?.score && assessment.score >= GEOGRAPHY_RECALL_TARGET
      ? "Can the learner create one almost-correct UPSC statement and reject it?"
      : "Can the learner repeat the concept with cause, map example, and trap?");

  useEffect(() => {
    if (!isLoaded || hydrated) return;

    const timer = window.setTimeout(() => {
      const savedSession = resolveSession(activeDay);
      const savedProgress = getDayProgress(savedSession.day);
      const savedModuleProgress = activeModule ? savedProgress?.moduleProgress?.[activeModule.id] : undefined;
      setLearnerLevel(readStudentProfile()?.level ?? "beginner");
      setAnswerDraft(savedProgress?.reflection?.trim() || "");
      setChallengeDraft(savedProgress?.talkChallengeResponse ?? "");
      setSaved(false);
      setChallengeOpen(savedProgress?.talkDiscussionStep === "challenge");
      if (
        activeModule &&
        activeModuleSection &&
        typeof savedModuleProgress?.currentMasteryPercent === "number"
      ) {
        const savedAttempt = savedModuleProgress.sectionRecallAttempts
          ?.filter((attempt) => attempt.sectionId === activeModuleSection.id)
          .at(-1);
        const targetIndex = activeModule.sections.findIndex((section) => section.id === activeModuleSection.id);
        setModuleRecall({
          moduleId: activeModule.id,
          sectionId: activeModuleSection.id,
          cumulativeSectionIds: savedAttempt?.cumulativeSectionIds ?? activeModuleSectionIds,
          knownConcepts: savedModuleProgress.knownConcepts ?? [],
          missingConcepts: savedModuleProgress.missingConcepts ?? [],
          initialKnownPercent: savedModuleProgress.initialKnownPercent ?? savedModuleProgress.currentMasteryPercent,
          currentMasteryPercent: savedModuleProgress.currentMasteryPercent,
          gapFilledPercent: savedModuleProgress.gapFilledPercent ?? 0,
          remainingGapPercent: savedModuleProgress.remainingGapPercent ?? Math.max(0, 100 - savedModuleProgress.currentMasteryPercent),
          nextUnlockedSectionId: savedModuleProgress.nextUnlockedSectionId,
          allSectionsCleared:
            (savedModuleProgress.passedSectionIds?.length ?? 0) >= activeModule.sections.length &&
            targetIndex === activeModule.sections.length - 1,
          summary:
            savedModuleProgress.currentMasteryPercent >= GEOGRAPHY_RECALL_TARGET
              ? "Saved cumulative module recall is clear."
              : "Saved cumulative module recall still has gaps.",
          repairPrompt:
            savedModuleProgress.missingConcepts?.[0]?.repairPrompt ??
            "Repeat the cumulative section recall before opening new content.",
        });
      } else {
        setModuleRecall(null);
      }

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
        setTeacherConnection(
          savedProgress.teacherMode === "nvidia-teacher" || savedProgress.teacherMode === "gemini"
            ? "ready"
            : savedProgress.teacherMode === "local-fallback"
              ? "local"
              : "idle"
        );
      }

      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeDay, activeModule, activeModuleSection, activeModuleSectionIds, getDayProgress, hydrated, isLoaded]);

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

  const clearAudioNote = () => {
    setAudioNoteUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  };

  const persistTalk = (
    nextAssessment: GeographyAssessment | null = assessment,
    nextDiscussion: GeographyMaicDiscussion | null = discussion,
    nextChallengeOpen = challengeOpen,
    nextModuleRecall: GeographyModuleRecallAssessment | null = moduleRecall,
    nextReflection = answerDraft
  ) => {
    const now = new Date().toISOString();
    const dayStartRecallCleared = Boolean(
      dayStartReturnSession && nextAssessment && nextAssessment.score >= GEOGRAPHY_RECALL_TARGET
    );
    const nextRoute = nextAssessment
      ? dayStartRecallCleared && dayStartReturnSession
        ? {
            href: `/upsc/geography?day=${dayStartReturnSession.day}`,
            label: `Open Day ${dayStartReturnSession.day}`,
            title: `Day ${dayStartReturnSession.day} can start`,
            detail: `Previous-day recall is clear. Continue with ${dayStartReturnSession.title}.`,
            tone: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
          }
        : moduleRouteFor(activeSession, activeModule, activeModuleSection, nextModuleRecall) ??
        nextRouteFor(activeSession, nextAssessment, isTalkContentReady, learnerLevel)
      : null;
    const stage = nextAssessment ? getGeographyTalkUnlockStage(nextAssessment) : undefined;
    const moduleAttempt =
      nextModuleRecall && activeModule && activeModuleSection
        ? {
            moduleId: activeModule.id,
            sectionId: activeModuleSection.id,
            cumulativeSectionIds: nextModuleRecall.cumulativeSectionIds,
            answer: [nextReflection, challengeDraft.trim() ? challengeDraft : ""]
              .map((part) => part.trim())
              .filter(Boolean)
              .join("\n\nChallenge repair:\n"),
            score: nextModuleRecall.currentMasteryPercent,
            knownConcepts: nextModuleRecall.knownConcepts,
            missingConcepts: nextModuleRecall.missingConcepts,
            attemptedAt: now,
          }
        : null;
    const existingModuleProgress =
      nextModuleRecall && activeModule ? progress?.moduleProgress?.[activeModule.id] : undefined;
    const nextPassedSectionIds =
      nextModuleRecall && activeModuleSection && nextModuleRecall.currentMasteryPercent >= GEOGRAPHY_RECALL_TARGET
        ? uniqueValues([...(existingModuleProgress?.passedSectionIds ?? []), activeModuleSection.id])
        : existingModuleProgress?.passedSectionIds;
    const nextModuleProgress =
      nextModuleRecall && activeModule
        ? {
            ...(progress?.moduleProgress ?? {}),
            [activeModule.id]: {
              ...existingModuleProgress,
              moduleId: activeModule.id,
              activeSectionId: activeModuleSection?.id,
              readSectionIds: existingModuleProgress?.readSectionIds ?? [],
              passedSectionIds: nextPassedSectionIds ?? [],
              nextUnlockedSectionId: nextModuleRecall.nextUnlockedSectionId,
              knownConcepts: nextModuleRecall.knownConcepts,
              missingConcepts: nextModuleRecall.missingConcepts,
              initialKnownPercent: nextModuleRecall.initialKnownPercent,
              currentMasteryPercent: nextModuleRecall.currentMasteryPercent,
              gapFilledPercent: nextModuleRecall.gapFilledPercent,
              remainingGapPercent: nextModuleRecall.remainingGapPercent,
              sectionRecallAttempts: moduleAttempt
                ? [...(existingModuleProgress?.sectionRecallAttempts ?? []), moduleAttempt]
                : existingModuleProgress?.sectionRecallAttempts,
              updatedAt: now,
            },
          }
        : undefined;
    saveDayProgress(activeSession.day, {
      learnerLevel: progressLearnerLevelLabel(learnerLevel),
      reflection: nextReflection,
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
      ...(nextModuleRecall
        ? {
            moduleProgress: nextModuleProgress,
            sectionRecallAttempts: moduleAttempt
              ? [...(progress?.sectionRecallAttempts ?? []), moduleAttempt]
              : progress?.sectionRecallAttempts,
            knownConcepts: nextModuleRecall.knownConcepts,
            missingConcepts: nextModuleRecall.missingConcepts,
            initialKnownPercent: nextModuleRecall.initialKnownPercent,
            currentMasteryPercent: nextModuleRecall.currentMasteryPercent,
            gapFilledPercent: nextModuleRecall.gapFilledPercent,
            nextUnlockedSectionId: nextModuleRecall.nextUnlockedSectionId,
            watched: nextModuleRecall.allSectionsCleared ? true : progress?.watched,
            watchState: nextModuleRecall.allSectionsCleared ? "Watched" : progress?.watchState,
            watchHandoffReady: nextModuleRecall.allSectionsCleared ? true : progress?.watchHandoffReady,
            watchHandoffSummary: nextModuleRecall.allSectionsCleared
              ? `${activeModule?.title ?? activeSession.title} module cleared through cumulative recall.`
              : progress?.watchHandoffSummary,
          }
        : {}),
    });
    if (dayStartRecallCleared && dayStartReturnSession && nextAssessment) {
      saveDayProgress(dayStartReturnSession.day, {
        dayStartRecallSourceDay: activeSession.day,
        dayStartRecallClearedAt: now,
        dayStartRecallScore: nextAssessment.score,
      });
    }
    setSaved(true);
  };

  const assess = (includeChallenge: boolean, overrideAnswer?: string) => {
    if (teacherConnection === "checking") return;
    const answerForAssessment = overrideAnswer ?? answerDraft;
    const combinedAnswer = [answerForAssessment, includeChallenge ? challengeDraft : ""]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\nChallenge repair:\n");
    const baseAssessment = assessGeographyExplanation(activeSession, combinedAnswer);
    const nextModuleRecall =
      activeModule && activeModuleSection
        ? assessGeographyModuleRecall(
            activeModule,
            activeModuleSection.id,
            combinedAnswer,
            progress?.moduleProgress?.[activeModule.id]?.initialKnownPercent
          )
        : null;
    const nextAssessment: GeographyAssessment = nextModuleRecall
      ? {
          ...baseAssessment,
          score: nextModuleRecall.currentMasteryPercent,
          band:
            nextModuleRecall.currentMasteryPercent >= 85
              ? "Command"
              : nextModuleRecall.currentMasteryPercent >= 40
                ? "Practice"
                : "Revisit",
          matchedKeywords: nextModuleRecall.knownConcepts.map((concept) => concept.label).slice(0, 25),
          missingKeywords: nextModuleRecall.missingConcepts.map((concept) => concept.label).slice(0, 5),
          summary: nextModuleRecall.summary,
          nextAction: nextModuleRecall.repairPrompt,
          repairHints: nextModuleRecall.missingConcepts.map((concept) => concept.repairPrompt).slice(0, 5),
        }
      : baseAssessment;
    const nextDiscussion = buildGeographyMaicDiscussion(activeSession, combinedAnswer, nextAssessment);
    const nextChallengeOpen =
      !includeChallenge &&
      isTalkContentReady &&
      getGeographyTalkUnlockStage(nextAssessment) === "retry";
    setAssessment(nextAssessment);
    setModuleRecall(nextModuleRecall);
    setSubmittedInCurrentVisit(true);
    setDiscussion(nextDiscussion);
    setChallengeOpen(nextChallengeOpen);
    persistTalk(nextAssessment, nextDiscussion, nextChallengeOpen, nextModuleRecall, answerForAssessment);
    setTeacherCoach(null);
    setTeacherConnection("checking");
    const requestId = teacherRequestId.current + 1;
    teacherRequestId.current = requestId;
    void requestAdaptiveTeacherDiscussion({
      day: activeSession.day,
      answer: answerForAssessment,
      challengeAnswer: includeChallenge ? challengeDraft : undefined,
      learnerLevel,
      moduleId: activeModule?.id,
      sectionId: activeModuleSection?.id,
      cumulativeSectionIds: activeModuleSectionIds.length ? activeModuleSectionIds : undefined,
      expectedRecallPoints: activeExpectedRecallPoints.length ? activeExpectedRecallPoints : undefined,
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

  const runMasterOnePassCheck = () => {
    const recallProof = activeExpectedRecallPoints
      .slice(0, 6)
      .join("; ");
    const onePassAnswer = [
      `Master pass flow check for ${activeModule?.title ?? activeSession.title}.`,
      `Core command: explain the concept, mechanism, map or example, exception, and UPSC trap in one answer.`,
      recallProof ? `Covered recall points: ${recallProof}.` : `Covered focus: ${activeSession.title}.`,
      `Applied proof: connect location, process, cause-effect chain, and one statement trap so the teacher can unlock the next room.`,
    ].join(" ");

    setAnswerDraft(onePassAnswer);
    setChallengeDraft("");
    setChallengeOpen(false);
    setSpeechRecognition(null);
    setSpeechState("idle");
    setSpeechInterimDraft("");
    setSpeechMessage("Master pass filled and checked this answer.");
    clearAudioNote();
    assess(false, onePassAnswer);
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
            "Voice note recorded. Current build uses browser live speech first; play this note back and type the key points for AI checking."
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
            setAssessment(null);
            setDiscussion(null);
            setSaved(false);
            setSpeechMessage("Voice note transcribed into the answer box. Review it, then send to the AI teacher.");
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : "Server transcription failed.";
            setSpeechMessage(`Voice note recorded. ${message} Play it back, then type the key points for AI checking.`);
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
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
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
        setAssessment(null);
        setDiscussion(null);
        setSaved(false);
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
    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
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
        <GeographyRoomCompass
          day={activeSession.day}
          room="Talk"
          title={activeSession.title}
          detail={talkLevelCopy.panelDetail}
          primaryHref={primaryActionHref}
          primaryLabel={primaryActionLabel}
        />

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
            data-signal-model="talk-four-signal-one-answer"
            data-essential-signal-count="4"
            data-essential-signals="teacher-question|recall-gap|repair-focus|next-route"
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
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#5d675f]/5 rounded px-1 -mx-1" title="Hover to reveal full details">
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
                      <p className="mt-3 text-base font-black leading-7 text-[#13251d] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#13251d]/5 rounded px-1 -mx-1" title="Hover to reveal full prompt">{activeSession.talk}</p>
                      {activeModule && activeModuleSection ? (
                        <div
                          data-testid="geography-talk-module-cumulative-prompt"
                          data-module-id={activeModule.id}
                          data-section-id={activeModuleSection.id}
                          data-cumulative-section-count={activeModuleSectionIds.length}
                          className="mt-3 rounded-md border border-[#b9dacf] bg-white p-3"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">
                            Module recall rule
                          </p>
                          <p className="mt-1 text-sm font-bold leading-5 text-[#34453b] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#34453b]/5 rounded px-1 -mx-1" title="Hover to reveal all slides">
                            Recall slides 1-{activeModuleSectionIds.length}:{" "}
                            {activeModuleSections.map((section) => section.title).join(", ")}.
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#657066] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#657066]/5 rounded px-1 -mx-1">
                            If an earlier slide is skipped, the next slide stays locked.
                          </p>
                        </div>
                      ) : null}
                      <p data-testid="talk-level-teacher-hint" className="mt-3 text-sm font-semibold leading-6 text-[#49675e] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#49675e]/5 rounded px-1 -mx-1" title="Hover to reveal hint">
                        {talkLevelCopy.teacherHint}
                      </p>
                      <p data-testid="talk-level-repair-frame" className="mt-2 text-xs font-bold leading-5 text-[#657066] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#657066]/5 rounded px-1 -mx-1">
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
              value={
                speechState === "listening" && speechInterimDraft
                  ? `${answerDraft}${answerDraft ? "\n" : ""}${speechInterimDraft}`
                  : answerDraft
              }
              readOnly={speechState === "listening"}
              onChange={(event) => {
                if (speechState === "listening") return;
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
              className={cn(
                "min-h-72 w-full flex-1 resize-y rounded-lg border p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:ring-2",
                speechState === "listening"
                  ? "cursor-default border-[#1d9e75] bg-[#f4fbf7] focus:border-[#1d9e75] focus:ring-[#1d9e75]/20"
                  : "border-[#dcd5c7] bg-white focus:border-[#1d9e75] focus:ring-[#1d9e75]/20",
              )}
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="talk-speak-answer"
                onClick={toggleSpeechCapture}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                {speechState === "listening" || speechState === "recording" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {speechState === "listening" ? "Stop speaking" : speechState === "recording" ? "Stop recording" : "Speak answer"}
              </button>
              {hasMasterAccess ? (
                <button
                  type="button"
                  data-testid="talk-master-one-pass"
                  onClick={runMasterOnePassCheck}
                  disabled={teacherConnection === "checking"}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] px-4 text-sm font-black text-[#085041] transition hover:bg-[#d7efe4] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <KeyRound className="h-4 w-4" /> One-pass check
                </button>
              ) : null}
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
              {speechMessage ? (
                <span
                  aria-live="polite"
                  className={cn(
                    "text-xs font-bold",
                    speechState === "blocked" || speechState === "error" || speechState === "unsupported"
                      ? "text-[#9a4b0f]"
                      : "text-[#756f64]"
                  )}
                >
                  {speechMessage}
                </span>
              ) : null}
              {speechState === "listening" && speechInterimDraft ? (
                <span
                  aria-live="polite"
                  data-testid="talk-speech-interim"
                  className="flex min-h-8 items-center gap-2 text-xs font-bold text-[#1d9e75]"
                >
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#1d9e75]" />
                  Listening — words appearing in the box above
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
                <span className="inline-flex min-h-10 items-center rounded-md border border-[#cfc6b6] bg-white px-3 text-xs font-black text-[#1a3a2a]">
                  Transcribing voice note...
                </span>
              ) : null}
            </div>
            </div>
            </div>

            <section
              data-testid="talk-four-signal-grid"
              data-signal-count="4"
              data-flow-state={talkState}
              data-recall-target={GEOGRAPHY_RECALL_TARGET}
              data-visible-recall-score={visibleRecallScore}
              data-next-action-route={primaryActionHref}
              data-next-action-label={primaryActionLabel}
              className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
            >
              <div
                data-testid="talk-signal-teacher-question"
                data-signal="teacher-question"
                className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-3"
              >
                <MessageCircle className="h-5 w-5 text-[#1d9e75]" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                  Teacher question
                </p>
                <p className="mt-2 text-sm font-black leading-6 text-[#13251d] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#13251d]/5 rounded px-1 -mx-1" title="Hover to reveal question">{talkLevelCopy.question}</p>
              </div>

              <div
                data-testid="talk-signal-recall-gap"
                data-signal="recall-gap"
                data-score={visibleRecallScore}
                data-gap={recallGap}
                className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3"
              >
                <Gauge className="h-5 w-5 text-[#1d9e75]" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                  Recall gap
                </p>
                <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">
                  {visibleRecallScore >= GEOGRAPHY_RECALL_TARGET
                    ? "Target cleared"
                    : visibleRecallScore > 0
                      ? `${recallGap}% more needed`
                      : "Answer once"}
                </p>
              </div>

              <div
                data-testid="talk-signal-repair-focus"
                data-signal="repair-focus"
                data-gap-category={teacherGapCategory}
                data-teacher-status={teacherStatus}
                className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3"
              >
                <Lightbulb className="h-5 w-5 text-[#1d9e75]" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                  Repair focus
                </p>
                <p className="mt-2 text-sm font-black leading-6 text-[#13251d] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#13251d]/5 rounded px-1 -mx-1">{teacherGapCategory}</p>
                <p className="mt-1 line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#66736b]/5 rounded px-1 -mx-1">{teacherRepairAction}</p>
              </div>

              {route ? (
                <Link
                  href={route.href}
                  data-testid="talk-signal-next-route"
                  data-signal="next-route"
                  data-next-action-route={route.href}
                  data-next-action-label={route.label}
                  className="rounded-lg border border-[#1d9e75] bg-[#e7f5ee] p-3 transition hover:border-[#1a3a2a] hover:bg-white"
                >
                  <ArrowRight className="h-5 w-5 text-[#1d9e75]" />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    Next route
                  </p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{route.label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b] line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-pointer hover:bg-[#66736b]/5 rounded px-1 -mx-1">{route.title}</p>
                </Link>
              ) : (
                <div
                  data-testid="talk-signal-next-route"
                  data-signal="next-route"
                  data-next-action-route=""
                  data-next-action-label={primaryActionLabel}
                  className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3"
                >
                  <ArrowRight className="h-5 w-5 text-[#1d9e75]" />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    Next route
                  </p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">
                    Submit answer first
                  </p>
                </div>
              )}
            </section>

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

            {assessment && (
              <div data-testid="talk-score-card" className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recall score</p>
                <p className="mt-2 text-4xl font-black text-[#13251d]">{assessment.score}%</p>
                <p className="mt-2 text-sm font-black text-[#085041]">{assessment.band}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#49675e]">{assessment.summary}</p>
                {moduleRecall && activeModule ? (
                  <div
                    data-testid="geography-talk-known-gap-ledger"
                    data-module-id={moduleRecall.moduleId}
                    data-section-id={moduleRecall.sectionId}
                    data-cumulative-section-count={moduleRecall.cumulativeSectionIds.length}
                    data-known-count={moduleRecall.knownConcepts.length}
                    data-missing-count={moduleRecall.missingConcepts.length}
                    data-initial-known-percent={moduleRecall.initialKnownPercent}
                    data-current-mastery-percent={moduleRecall.currentMasteryPercent}
                    data-gap-filled-percent={moduleRecall.gapFilledPercent}
                    className="mt-4 rounded-lg border border-[#b9dacf] bg-white/85 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#085041]">
                          Cumulative module recall
                        </p>
                        <h4 className="mt-1 text-sm font-black text-[#13251d]">
                          {activeModule.title}: {moduleRecall.cumulativeSectionIds.length} slide
                          {moduleRecall.cumulativeSectionIds.length === 1 ? "" : "s"} checked together
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          ["Known first", `${moduleRecall.initialKnownPercent}%`],
                          ["Now", `${moduleRecall.currentMasteryPercent}%`],
                          ["Gap filled", `${moduleRecall.gapFilledPercent}%`],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md bg-[#f7f4ee] px-2 py-1.5">
                            <p className="text-xs font-black text-[#13251d]">{value}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#657066]">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        ["known", "Known to student", moduleRecall.knownConcepts.length],
                        ["need", "Need to cover", moduleRecall.missingConcepts.length],
                      ].map(([id, label, count]) => (
                        <button
                          key={id}
                          type="button"
                          data-testid={`geography-talk-ledger-tab-${id}`}
                          onClick={() => setActiveLedgerTab(id as "known" | "need")}
                          className={cn(
                            "rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                            activeLedgerTab === id
                              ? "bg-[#1a3a2a] text-white"
                              : "border border-[#cfe5dc] bg-white text-[#085041] hover:bg-[#e7f5ee]"
                          )}
                        >
                          {label} ({count})
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2">
                      {activeLedgerTab === "known" ? (
                        moduleRecall.knownConcepts.length ? (
                          moduleRecall.knownConcepts.map((concept) => (
                            <div key={concept.id} className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3">
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#085041]">
                                {concept.label}
                              </p>
                              <p className="mt-1 text-sm font-bold leading-5 text-[#34453b]">{concept.detail}</p>
                              <p className="mt-1 text-xs font-semibold leading-5 text-[#49675e]">{concept.evidence}</p>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-sm font-bold text-[#657066]">
                            Nothing is proven yet. Speak the cumulative slide set once.
                          </p>
                        )
                      ) : moduleRecall.missingConcepts.length ? (
                        moduleRecall.missingConcepts.map((concept) => {
                          const sourceSection = activeModule.sections.find((section) => section.id === concept.sectionId);
                          return (
                            <div key={concept.id} className="rounded-md border border-[#ef9f27]/45 bg-[#fff8e8] p-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6f4a12]">
                                    {concept.label}
                                  </p>
                                  <p className="mt-1 text-sm font-bold leading-5 text-[#5d3a05]">{concept.detail}</p>
                                  <p className="mt-1 text-xs font-semibold leading-5 text-[#6f4a12]">
                                    {concept.repairPrompt}
                                  </p>
                                </div>
                                {sourceSection ? (
                                  <Link
                                    href={moduleWatchHref(activeSession.day, activeModule, sourceSection)}
                                    className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black uppercase tracking-[0.12em] text-white"
                                  >
                                    Open slide
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3 text-sm font-bold text-[#085041]">
                          No missing concept in the cumulative set. Continue to the next unlocked step.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
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
                <div
                  data-testid="geography-talk-command-summary"
                  data-proof-rule="ai-teacher-gap-repair-mastery-next"
                  data-gap-category={teacherGapCategory}
                  data-teacher-status={teacherStatus}
                  data-score={assessment.score}
                  data-recall-target={GEOGRAPHY_RECALL_TARGET}
                  data-next-action-route={primaryActionHref}
                  data-next-action-label={primaryActionLabel}
                  data-mcq-ready={mcqReady ? "true" : "false"}
                  className="mt-4 rounded-md border border-[#cfe5dc] bg-white/85 p-3"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#085041]">Teacher command</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    {[
                      ["Gap", teacherGapCategory],
                      ["Repair", teacherRepairAction],
                      ["Check", teacherMasteryCheck],
                      ["Next", primaryActionLabel],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-[#f7f4ee] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">{label}</p>
                        <p className="mt-1 text-xs font-bold leading-5 text-[#34453b]">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-bold leading-5 text-[#49675e]">{teacherGapReason}</p>
                </div>
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
