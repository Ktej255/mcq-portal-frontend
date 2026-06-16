"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Layers3,
  ListChecks,
  LockKeyhole,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  UnlockKeyhole,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import { McqUsageMeter } from "@/components/upsc/McqUsageMeter";
import { McqUsageNudge } from "@/components/upsc/McqUsageNudge";
import { recordMcqUsage } from "@/lib/upsc/dailyUsage";
import { getDisasterManagementMcqTemplateHints } from "@/lib/upsc/disasterManagementLearningDecks";
import { getEconomyMcqTemplateHints } from "@/lib/upsc/economyLearningDecks";
import { getHistoryMcqTemplateHints } from "@/lib/upsc/historyLearningDecks";
import { getInternalSecuritySocietyMcqTemplateHints } from "@/lib/upsc/internalSecuritySocietyLearningDecks";
import { getPolityGovernanceMcqTemplateHints } from "@/lib/upsc/polityGovernanceLearningDecks";
import { getScienceTechMcqTemplateHints } from "@/lib/upsc/scienceTechLearningDecks";
import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import { getSubjectBatchCode } from "@/lib/upsc/subjectPlans";
import {
  readLocalMcqCommandQuestionsForBatch,
  readMcqCommandBatchState,
  upsertMcqCommandBatchState,
} from "@/lib/upsc/mcqDraftBank";
import {
  auditEnvironmentMcqBatch,
  getEnvironmentMcqTemplateHints,
  type EnvironmentMcqQualityAudit,
} from "@/lib/upsc/environmentMcqQuality";
import { auditHistoryMcqBatch, type HistoryMcqQualityAudit } from "@/lib/upsc/historyMcqQuality";
import {
  getSubjectLabProofCompletion,
  getSubjectWatchCompletion,
  isSubjectTalkReadyForMcq,
} from "@/lib/upsc/subjectProgressGates";
import { SUBJECT_RECALL_TARGET } from "@/lib/upsc/subjectLearning";
import { useSubjectProgress } from "@/lib/upsc/useSubjectProgress";
import type { SubjectMcqReadinessStatus } from "@/lib/upsc/useSubjectProgress";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { awardGamificationRewards } from "@/lib/upsc/gamification";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { QuestionPayload } from "@/services/api/adminService";

const difficulties = ["EASY", "MEDIUM", "HARD", "PYQ_STYLE"];
const MCQ_COMMAND_SCORE = 70;

type SubjectMcqQualityAudit = EnvironmentMcqQualityAudit | HistoryMcqQualityAudit;

const contractColumns = [
  ["subject", "Subject", "Required", "Subject name for reporting and filtering."],
  ["day", "Day", "Required", "Maps the MCQ to the subject sprint day."],
  ["chapter", "Chapter", "Required", "Uses the selected session chapter."],
  ["topic", "Topic", "Required", "Uses the exact daily session title."],
  ["batch_code", "Batch Code", "Required", "Stable code such as ENV-D11."],
  ["difficulty", "Difficulty", "Required", "EASY, MEDIUM, HARD, or PYQ_STYLE."],
  ["question_text_en", "Question", "Required", "Fresh MCQ stem authored for this topic."],
  ["correct_option", "Correct Option", "Required", "A, B, C, or D."],
  ["explanation_en", "Explanation", "Required", "Reasoning is mandatory because MCQ remains part of learning."],
  ["source", "Source", "Optional", "Fresh authoring, PYQ-style, class note, or current affairs."],
  ["map_or_case_tag", "Map/Case Tag", "Optional", "Place, species, report, policy, case study, or map hook."],
];

function csvEscape(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildTemplateRow(plan: SubjectSprintPlan, session: SubjectSession, difficulty: string) {
  const environmentHints = plan.slug === "environment" ? getEnvironmentMcqTemplateHints(plan, session) : null;
  const economyHints = plan.slug === "economy" ? getEconomyMcqTemplateHints(plan, session) : null;
  const disasterManagementHints =
    plan.slug === "disaster-management" ? getDisasterManagementMcqTemplateHints(plan, session) : null;
  const scienceTechHints = plan.slug === "science-tech" ? getScienceTechMcqTemplateHints(plan, session) : null;
  const polityGovernanceHints =
    plan.slug === "polity-governance" ? getPolityGovernanceMcqTemplateHints(plan, session) : null;
  const internalSecuritySocietyHints =
    plan.slug === "internal-security-society" ? getInternalSecuritySocietyMcqTemplateHints(plan, session) : null;
  const historyHints = plan.slug === "history" ? getHistoryMcqTemplateHints(plan, session) : null;
  const specialHints =
    environmentHints ??
    economyHints ??
    disasterManagementHints ??
    scienceTechHints ??
    polityGovernanceHints ??
    internalSecuritySocietyHints ??
    historyHints;
  return {
    subject: plan.title,
    day: session.day,
    week: session.week,
    chapter: session.chapter,
    topic: session.title,
    batch_code: getSubjectBatchCode(plan.slug, session.day),
    test_title: `${plan.title} Day ${session.day}: ${session.title}`,
    difficulty,
    question_text_en: specialHints
      ? "questionSeed" in specialHints
        ? specialHints.questionSeed
        : `Consider the following statements about ${session.title}: build a fresh UPSC trap around ${specialHints.trapSeed}.`
      : `Fresh MCQ stem for ${session.title}`,
    option_a: "Option A",
    option_b: "Option B",
    option_c: "Option C",
    option_d: "Option D",
    correct_option: "A",
    explanation_en: specialHints
      ? `${specialHints.explanationSeed} Mention mechanism, case/map anchor, and why the distractors fail.`
      : `Explain the concept, example, and UPSC trap for ${session.title}.`,
    source: specialHints ? ("source" in specialHints ? specialHints.source : "FRESH_ENVIRONMENT_AUTHORING") : "FRESH_AUTHORING",
    map_or_case_tag: specialHints?.caseTag ?? session.lab,
    pyq_linked: "No",
    status: "DRAFT",
  };
}

function buildCsv(plan: SubjectSprintPlan, session: SubjectSession, difficulty: string) {
  const row = buildTemplateRow(plan, session, difficulty);
  const headers = Object.keys(row) as Array<keyof typeof row>;
  return `${headers.join(",")}\n${headers.map((header) => csvEscape(row[header])).join(",")}\n`;
}

function getOptionText(question: QuestionPayload, option: "A" | "B" | "C" | "D") {
  const options = question.options_en;
  if (!options || typeof options !== "object") return "";
  return String((options as Record<string, unknown>)[option] ?? "");
}

function sanitizePracticeAnswers(value: unknown, questionCount: number): Record<number, string> {
  if (!value || typeof value !== "object") return {};
  const candidate = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(candidate)
      .map(([key, option]) => [Number(key), option])
      .filter(
        ([index, option]) =>
          Number.isInteger(index) &&
          (index as number) >= 0 &&
          (index as number) < questionCount &&
          typeof option === "string" &&
          ["A", "B", "C", "D"].includes(option)
      )
  ) as Record<number, string>;
}

function commandStatusClass(status: string) {
  if (status === "Done") return "bg-[var(--subject-light)] text-[var(--subject-dark)] ring-[var(--subject-ring)]";
  if (status === "Active") return "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/30";
  if (status === "Locked") return "bg-[var(--subject-bg)] text-[#776f64] ring-[var(--subject-border)]";
  return "bg-white text-[#49675e] ring-[#dcd5c7]";
}

export function SubjectMcqReadinessRoom({ plan, initialDay }: { plan: SubjectSprintPlan; initialDay?: number }) {
  const router = useRouter();
  const themeStyle = getSubjectThemeStyle(plan);
  const { getDayProgress, isLoaded: isProgressLoaded, saveDayProgress } = useSubjectProgress(plan.slug, plan.sessions);
  const [activeDay, setActiveDay] = useState(initialDay ?? 1);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [plannedCount, setPlannedCount] = useState(25);
  const [draftedCount, setDraftedCount] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [localBatchQuestions, setLocalBatchQuestions] = useState<QuestionPayload[]>([]);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const syncedMcqSnapshotRef = useRef("");

  const activeSession = plan.sessions.find((session) => session.day === activeDay) ?? plan.sessions[0];
  const activeBatchCode = getSubjectBatchCode(plan.slug, activeSession.day);
  const templateRow = useMemo(() => buildTemplateRow(plan, activeSession, difficulty), [activeSession, difficulty, plan]);
  const csvPreview = useMemo(() => buildCsv(plan, activeSession, difficulty), [activeSession, difficulty, plan]);
  const mcqQualityAudit = useMemo<SubjectMcqQualityAudit | null>(() => {
    if (plan.slug === "history") {
      return auditHistoryMcqBatch(plan, activeSession, activeBatchCode, localBatchQuestions, plannedCount);
    }
    if (plan.slug !== "environment") return null;
    return auditEnvironmentMcqBatch(plan, activeSession, activeBatchCode, localBatchQuestions, plannedCount);
  }, [activeBatchCode, activeSession, localBatchQuestions, plan, plannedCount]);
  const qualityGateLabel = plan.slug === "history" ? "History MCQ quality gate" : "Environment MCQ quality gate";
  const qualityGateTitle =
    plan.slug === "history"
      ? "Fresh History traps before student practice"
      : "Fresh authoring proof before student practice";
  const qualityGateDetail =
    plan.slug === "history"
      ? "Count alone is not enough for History. The batch must carry chronology, source/map/personality proof, explanation depth, and UPSC statement-trap logic."
      : "Count alone is not enough for Environment. The batch must be mapped to the day, carry syllabus/case anchors, include UPSC trap language, and explain the mechanism.";
  const qualityGateTestId = plan.slug === "history" ? "history-mcq-quality-gate" : "environment-mcq-quality-gate";
  const qualityScoreTestId = plan.slug === "history" ? "history-mcq-quality-score" : "environment-mcq-quality-score";
  const qualityItemTestPrefix = plan.slug === "history" ? "history-mcq-quality" : "environment-mcq-quality";
  const isFreshCountReady = draftedCount >= plannedCount && plannedCount > 0;
  const hasLocalQuestionContent = localBatchQuestions.length > 0;
  const isFreshContentCountReady = plannedCount > 0 && localBatchQuestions.length >= plannedCount;
  const isMcqQualityReady = mcqQualityAudit ? mcqQualityAudit.passed : true;
  const isFreshContentReady = isFreshContentCountReady && isMcqQualityReady;
  const readinessStatus = isFreshCountReady && isFreshContentReady
    ? "Ready"
    : isFreshCountReady && hasLocalQuestionContent && !isMcqQualityReady
      ? "Quality review"
      : isFreshCountReady
        ? "Needs content"
        : "Needs MCQs";
  const completion = plannedCount > 0 ? Math.min(100, Math.round((draftedCount / plannedCount) * 100)) : 0;
  const basePath = `/upsc/${plan.slug}`;
  const activeProgress = getDayProgress(activeSession.day);
  const hasRecoveryRetestContext = Boolean(activeProgress?.mcqRecoveryCompleted || activeProgress?.mcqRecoveryRetestSummary);
  const isRecoveryRetestMode = Boolean(activeProgress?.mcqRecoveryCompleted && activeProgress?.mcqRecoveryResolved !== true);
  const isFreshBatchReady = isFreshCountReady && isFreshContentReady;
  const watchCompletion = getSubjectWatchCompletion(activeProgress);
  const labProofCompletion = getSubjectLabProofCompletion(activeProgress);
  const isWatchGateUnlocked = watchCompletion.complete;
  const isTalkMcqGateUnlocked = isSubjectTalkReadyForMcq(activeProgress);
  const isStudentMcqUnlocked = isWatchGateUnlocked && isTalkMcqGateUnlocked && isFreshBatchReady;
  const canStartPractice = isStudentMcqUnlocked && hasLocalQuestionContent;
  const currentPracticeQuestion = localBatchQuestions[currentPracticeIndex];
  const currentPracticeAnswer = practiceAnswers[currentPracticeIndex];
  const answeredPracticeCount = localBatchQuestions.filter((_, index) => Boolean(practiceAnswers[index])).length;
  const correctPracticeCount = localBatchQuestions.filter(
    (question, index) => practiceAnswers[index] === question.correct_option
  ).length;
  const practicePercent = localBatchQuestions.length > 0 ? Math.round((correctPracticeCount / localBatchQuestions.length) * 100) : 0;
  const hasPersistedMcqForBatch = activeProgress?.mcqLastBatchCode === activeBatchCode;
  const visibleAnsweredCount =
    answeredPracticeCount > 0 ? answeredPracticeCount : hasPersistedMcqForBatch ? activeProgress?.mcqAnsweredCount ?? 0 : 0;
  const visibleCorrectCount =
    answeredPracticeCount > 0 ? correctPracticeCount : hasPersistedMcqForBatch ? activeProgress?.mcqCorrectCount ?? 0 : 0;
  const visiblePracticeTotal =
    localBatchQuestions.length > 0 ? localBatchQuestions.length : hasPersistedMcqForBatch ? activeProgress?.mcqTotal ?? 0 : 0;
  const visiblePracticePercent =
    visiblePracticeTotal > 0
      ? answeredPracticeCount > 0
        ? practicePercent
        : hasPersistedMcqForBatch
          ? activeProgress?.mcqScorePercent ?? 0
          : 0
      : 0;
  const isPracticeComplete =
    visiblePracticeTotal > 0 &&
    (visibleAnsweredCount >= visiblePracticeTotal || Boolean(hasPersistedMcqForBatch && activeProgress?.mcqCompleted));
  const mcqOutcome = !isPracticeComplete ? "Pending" : visiblePracticePercent >= MCQ_COMMAND_SCORE ? "Command" : "Revisit";
  const mcqRecommendedHref =
    mcqOutcome === "Revisit"
      ? `${basePath}/revisit?day=${activeSession.day}`
      : `${basePath}/track?day=${activeSession.day}`;
  const mcqRecommendedLabel = mcqOutcome === "Revisit" ? "Open revisit" : "Review track";
  const mcqOutcomeTitle =
    activeProgress?.mcqRecoveryRetestOutcome === "Command" || (isRecoveryRetestMode && mcqOutcome === "Command")
      ? "Recovery command cleared"
      : activeProgress?.mcqRecoveryRetestOutcome === "Revisit" || (isRecoveryRetestMode && mcqOutcome === "Revisit")
        ? "Recovery retest still shaky"
        : mcqOutcome === "Command"
          ? "Command retained"
          : mcqOutcome === "Revisit"
            ? "Revisit queued"
            : "Finish all questions";
  const mcqOutcomeDetail =
    activeProgress?.mcqRecoveryRetestSummary ??
    (isRecoveryRetestMode && mcqOutcome === "Command"
      ? `Recovery retest score is ${visiblePracticePercent}%, above the ${MCQ_COMMAND_SCORE}% command gate. The recovery loop is closed.`
      : isRecoveryRetestMode && mcqOutcome === "Revisit"
        ? `Recovery retest score is ${visiblePracticePercent}%, still below the ${MCQ_COMMAND_SCORE}% command gate. Queue another targeted repair before moving ahead.`
        : mcqOutcome === "Command"
      ? `Fresh practice score is ${visiblePracticePercent}%, above the ${MCQ_COMMAND_SCORE}% command gate. This day can move forward.`
      : mcqOutcome === "Revisit"
        ? `Fresh practice score is ${visiblePracticePercent}%, below the ${MCQ_COMMAND_SCORE}% command gate. Repair this day before the next topic.`
        : `Complete all ${visiblePracticeTotal || localBatchQuestions.length || plannedCount} fresh questions before this day is cleared.`);
  const practiceGateStatus = isStudentMcqUnlocked ? "Student practice ready" : "Student practice blocked";
  const practiceGateDetail = !isStudentMcqUnlocked
    ? `Complete Watch, ${SUBJECT_RECALL_TARGET}% Talk recall, attached fresh rows, and MCQ quality before practice becomes student-facing. Visual Lab remains optional support.`
    : hasLocalQuestionContent
      ? `${localBatchQuestions.length} approved fresh question${localBatchQuestions.length === 1 ? "" : "s"} found for ${activeBatchCode}.`
      : "The batch is marked ready, but no local question content is attached. Practice opens after the reviewed questions are added.";
  const studentFallbackHref = `${basePath}?day=${activeSession.day}`;
  const learningGateStatus = !isProgressLoaded
    ? "Checking learning gate"
    : isStudentMcqUnlocked
      ? "Practice unlock ready"
      : "Practice unlock blocked";
  const learningGateDetail = !isProgressLoaded
    ? `Reading local Watch, ${SUBJECT_RECALL_TARGET}% Talk recall, optional Visual Lab, and fresh MCQ authoring progress for this day.`
    : !isWatchGateUnlocked
      ? `Complete the Watch room first. Current scene proof: ${watchCompletion.completed}/${watchCompletion.target}.`
      : !isTalkMcqGateUnlocked
        ? `Ask the student to complete the AI teacher oral check until recall reaches ${SUBJECT_RECALL_TARGET}%. Old-bank MCQs are intentionally not used here. Optional Visual Lab proof: ${labProofCompletion.completed}/${labProofCompletion.target}.`
          : !isFreshBatchReady
            ? !isFreshCountReady
              ? `Learning gates are clear. Author the fresh batch before student MCQ practice opens: ${draftedCount}/${plannedCount} drafted.`
              : !isFreshContentCountReady
                ? `Fresh count is ready, but attached local content is ${localBatchQuestions.length}/${plannedCount}. Upload the fresh CSV rows.`
              : mcqQualityAudit
                ? `Fresh count is ready, but ${plan.title} quality is ${mcqQualityAudit.score}%. Fix: ${mcqQualityAudit.warnings.join(", ")}.`
                : `Fresh count is ready, but quality review is still pending.`
            : `Watch, ${SUBJECT_RECALL_TARGET}% Talk recall, and ${draftedCount}/${plannedCount} fresh MCQs are ready.`;
  const learningGateHref = !isWatchGateUnlocked
    ? `${basePath}/watch?day=${activeSession.day}`
    : !isTalkMcqGateUnlocked
      ? `${basePath}/talk?day=${activeSession.day}`
        : !isFreshBatchReady
          ? studentFallbackHref
          : `${basePath}/track`;
  const learningGateAction = !isWatchGateUnlocked
    ? "Open class"
    : !isTalkMcqGateUnlocked
      ? "Open AI teacher"
      : !isFreshBatchReady
          ? "Return to Today"
          : "Track progress";
  const mcqReadinessStatus: SubjectMcqReadinessStatus = !isWatchGateUnlocked || !isTalkMcqGateUnlocked
    ? "learning-blocked"
    : !isFreshCountReady
      ? "batch-pending"
      : !isFreshContentCountReady
        ? "content-pending"
        : !isMcqQualityReady
          ? "quality-review"
          : isPracticeComplete
            ? mcqOutcome === "Command"
              ? "command"
              : mcqOutcome === "Revisit"
                ? "revisit"
                : "practice-ready"
            : answeredPracticeCount > 0 || Boolean(hasPersistedMcqForBatch && activeProgress?.mcqAttempted)
              ? "practice-active"
              : "practice-ready";
  const mcqReadinessLabel = {
    "learning-blocked": "Learning blocked",
    "batch-pending": "Batch pending",
    "content-pending": "Content pending",
    "quality-review": "Quality review",
    "practice-ready": "Practice ready",
    "practice-active": "Practice active",
    command: "Command",
    revisit: "Revisit",
  }[mcqReadinessStatus];
  const mcqNextRoute = !isWatchGateUnlocked || !isTalkMcqGateUnlocked
    ? learningGateHref
    : !isFreshCountReady || !isFreshContentCountReady || !isMcqQualityReady
      ? `${basePath}/mcq-readiness?day=${activeSession.day}`
      : isPracticeComplete
        ? mcqRecommendedHref
        : `${basePath}/mcq-readiness?day=${activeSession.day}`;
  const mcqNextActionLabel = !isWatchGateUnlocked || !isTalkMcqGateUnlocked
    ? learningGateAction
    : !isFreshCountReady
      ? "Plan fresh MCQs"
      : !isFreshContentCountReady
        ? "Upload fresh CSV"
      : !isMcqQualityReady
          ? "Fix MCQ quality"
          : isPracticeComplete
            ? mcqRecommendedLabel
            : isRecoveryRetestMode
              ? "Retest fresh MCQs"
              : "Start fresh MCQs";
  const mcqStudentNextDetail =
    !isWatchGateUnlocked || !isTalkMcqGateUnlocked
      ? learningGateDetail
      : !isFreshBatchReady
        ? "Fresh reviewed MCQs are not ready yet. Attach the fresh CSV rows and clear quality review; practice opens automatically after the set is approved."
        : isPracticeComplete
          ? mcqOutcomeDetail
          : "Answer the fresh topic questions once. Your score decides the next step automatically: Track if clear, Revisit if weak.";
  const mcqPrimaryPracticeLabel = isRecoveryRetestMode ? "Retest fresh MCQs" : "Start fresh MCQs";
  const mcqStudentReadinessCopy = !isWatchGateUnlocked
    ? "First complete the short class. MCQs stay hidden until the concept is watched."
    : !isTalkMcqGateUnlocked
      ? `Explain the topic to the AI teacher until recall reaches ${SUBJECT_RECALL_TARGET}%.`
      : !isFreshBatchReady
        ? "Fresh MCQs are being prepared for this topic. The student can wait here without touching authoring tools."
        : isPracticeComplete
          ? mcqOutcomeDetail
          : "You are clear to solve the fresh MCQ set. No old question bank is used in this step.";
  const mcqStudentFlowItems = [
    {
      label: `${SUBJECT_RECALL_TARGET}% recall`,
      value: activeProgress?.talkScore ? `${activeProgress.talkScore}% AI teacher score` : "AI teacher pending",
      complete: isTalkMcqGateUnlocked,
    },
    {
      label: "Fresh MCQ",
      value: `${localBatchQuestions.length}/${plannedCount} topic questions`,
      complete: isFreshBatchReady,
    },
    {
      label: "Command score",
      value: `${MCQ_COMMAND_SCORE}% needed`,
      complete: isPracticeComplete && mcqOutcome === "Command",
    },
    {
      label: "Next topic",
      value: isPracticeComplete ? mcqRecommendedLabel : "opens after score",
      complete: isPracticeComplete && mcqOutcome === "Command",
    },
  ];
  const mcqEvidenceAnchor = `${activeBatchCode} / ${activeSession.title} / ${localBatchQuestions.length}/${plannedCount} fresh`;
  const mcqPreflightSummary = [
    `Learning: ${isWatchGateUnlocked && isTalkMcqGateUnlocked ? "ready" : "locked"}`,
    `Batch: ${draftedCount}/${plannedCount}`,
    `Content: ${localBatchQuestions.length}/${plannedCount}`,
    `Quality: ${isMcqQualityReady ? "clear" : "review"}`,
    `Next: ${mcqNextActionLabel}`,
  ].join(". ");
  const mcqBatchGateLabel = isFreshBatchReady
    ? "Fresh batch ready"
    : !isFreshCountReady
      ? "Fresh batch pending"
      : !isFreshContentCountReady
        ? "Fresh content pending"
        : "Quality review";
  const mcqCommandItems = [
    {
      label: "Learning proof",
      status: isWatchGateUnlocked && isTalkMcqGateUnlocked ? "Done" : "Locked",
      detail: isWatchGateUnlocked && isTalkMcqGateUnlocked
        ? `Watch and ${SUBJECT_RECALL_TARGET}% Talk passed`
        : learningGateAction,
    },
    {
      label: "Fresh count",
      status: isFreshCountReady ? "Done" : "Active",
      detail: `${draftedCount}/${plannedCount} drafted`,
    },
    {
      label: "CSV content",
      status: isFreshContentCountReady ? "Done" : hasLocalQuestionContent ? "Active" : "Pending",
      detail: `${localBatchQuestions.length}/${plannedCount} attached`,
    },
    {
      label: "Quality",
      status: isMcqQualityReady && isFreshContentCountReady ? "Done" : hasLocalQuestionContent ? "Active" : "Pending",
      detail: mcqQualityAudit ? `${mcqQualityAudit.score}% quality` : "Required fields clear",
    },
    {
      label: "Route",
      status: isPracticeComplete ? "Done" : isStudentMcqUnlocked ? "Active" : "Locked",
      detail: mcqNextActionLabel,
    },
  ];

  // Local batch metadata is browser-storage backed, so it hydrates after mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isProgressLoaded) return;
    const batchState = readMcqCommandBatchState(activeBatchCode);
    const questions = readLocalMcqCommandQuestionsForBatch(activeBatchCode);
    const draftedFromStorage = Math.max(batchState?.drafted ?? 0, questions.length);
    const savedProgress = getDayProgress(activeSession.day);
    const canRestorePractice = savedProgress?.mcqLastBatchCode === activeBatchCode && !savedProgress?.mcqCompleted;
    const restoredAnswers = canRestorePractice
      ? sanitizePracticeAnswers(savedProgress?.mcqAnswerMap, questions.length)
      : {};
    const restoredAnsweredCount = Object.keys(restoredAnswers).length;
    const firstUnansweredIndex = questions.findIndex((_, index) => !restoredAnswers[index]);
    const restoredIndex =
      canRestorePractice && typeof savedProgress?.mcqCurrentQuestionIndex === "number"
        ? savedProgress.mcqCurrentQuestionIndex
        : firstUnansweredIndex >= 0
          ? firstUnansweredIndex
          : 0;
    setPlannedCount(batchState?.planned ?? 25);
    setDraftedCount(draftedFromStorage);
    setDifficulty(batchState?.difficulty ?? "MEDIUM");
    setLocalBatchQuestions(questions);
    setPracticeStarted(canRestorePractice && (restoredAnsweredCount > 0 || savedProgress?.mcqAttempted === true));
    setCurrentPracticeIndex(Math.max(0, Math.min(questions.length - 1, restoredIndex)));
    setPracticeAnswers(restoredAnswers);
  }, [activeBatchCode, activeSession.day, getDayProgress, isProgressLoaded]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isProgressLoaded) return;
    const snapshot = JSON.stringify({
      day: activeSession.day,
      activeBatchCode,
      mcqReadinessStatus,
      mcqEvidenceAnchor,
      mcqNextRoute,
      mcqNextActionLabel,
      mcqPreflightSummary,
      localCount: localBatchQuestions.length,
      plannedCount,
      qualityScore: mcqQualityAudit?.score,
      qualityWarnings: mcqQualityAudit?.warnings,
    });

    if (syncedMcqSnapshotRef.current === snapshot) return;
    syncedMcqSnapshotRef.current = snapshot;

    saveDayProgress(activeSession.day, {
      mcqReadinessStatus,
      mcqEvidenceAnchor,
      mcqNextRoute,
      mcqNextActionLabel,
      mcqPreflightSummary,
      mcqFreshQuestionCount: localBatchQuestions.length,
      mcqPlannedCount: plannedCount,
      mcqQualityScore: mcqQualityAudit?.score,
      mcqQualityWarnings: mcqQualityAudit?.warnings,
      mcqQualityPassed: mcqQualityAudit?.passed,
      mcqQualityGateLabel: mcqQualityAudit ? qualityGateLabel : undefined,
    });
  }, [
    activeBatchCode,
    activeSession.day,
    isProgressLoaded,
    localBatchQuestions.length,
    mcqEvidenceAnchor,
    mcqNextActionLabel,
    mcqNextRoute,
    mcqPreflightSummary,
    mcqReadinessStatus,
    mcqQualityAudit,
    plannedCount,
    qualityGateLabel,
    saveDayProgress,
  ]);

  const saveReadinessState = (patch: { planned?: number; drafted?: number; difficulty?: string }) => {
    const nextPlanned = patch.planned ?? plannedCount;
    const nextDrafted = patch.drafted ?? draftedCount;
    const nextDifficulty = patch.difficulty ?? difficulty;

    setPlannedCount(nextPlanned);
    setDraftedCount(nextDrafted);
    setDifficulty(nextDifficulty);
    const nextQualityAudit =
      plan.slug === "history"
        ? auditHistoryMcqBatch(plan, activeSession, activeBatchCode, localBatchQuestions, nextPlanned)
        : plan.slug === "environment"
          ? auditEnvironmentMcqBatch(plan, activeSession, activeBatchCode, localBatchQuestions, nextPlanned)
          : null;
    upsertMcqCommandBatchState(activeBatchCode, {
      planned: nextPlanned,
      drafted: nextDrafted,
      difficulty: nextDifficulty,
      status: nextDrafted >= nextPlanned && (!nextQualityAudit || nextQualityAudit.passed) ? "READY" : "DRAFT",
    });
  };

  const startLocalPractice = () => {
    if (!canStartPractice) return;
    setPracticeStarted(true);
    recordMcqUsage(localBatchQuestions.length);
    const firstUnansweredIndex = localBatchQuestions.findIndex((_, index) => !practiceAnswers[index]);
    const nextIndex = firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
    setCurrentPracticeIndex(nextIndex);
    saveDayProgress(activeSession.day, {
      mcqAttempted: true,
      mcqAnswerMap: practiceAnswers,
      mcqCurrentQuestionIndex: nextIndex,
      mcqAnsweredCount: answeredPracticeCount,
      mcqCorrectCount: correctPracticeCount,
      mcqTotal: localBatchQuestions.length,
      mcqScorePercent: practicePercent,
      mcqLastBatchCode: activeBatchCode,
      mcqOutcome: "Pending",
      mcqReadinessStatus: "practice-active",
      mcqReviewSummary: `${answeredPracticeCount}/${localBatchQuestions.length} fresh questions answered for ${activeBatchCode}.`,
    });
  };

  const selectPracticeAnswer = (option: string) => {
    const isRecoveryRetestAttempt = Boolean(activeProgress?.mcqRecoveryCompleted && activeProgress?.mcqRecoveryResolved !== true);
    const nextAnswers = {
      ...practiceAnswers,
      [currentPracticeIndex]: option,
    };
    const nextAnsweredCount = localBatchQuestions.filter((_, index) => Boolean(nextAnswers[index])).length;
    const nextCorrectCount = localBatchQuestions.filter(
      (question, index) => nextAnswers[index] === question.correct_option
    ).length;
    const nextTotal = localBatchQuestions.length;
    const nextScorePercent = nextTotal > 0 ? Math.round((nextCorrectCount / nextTotal) * 100) : 0;
    const nextIsComplete = nextTotal > 0 && nextAnsweredCount === nextTotal;
    const nextOutcome = !nextIsComplete ? "Pending" : nextScorePercent >= MCQ_COMMAND_SCORE ? "Command" : "Revisit";
    const nextRecommendedRoute =
      nextOutcome === "Revisit"
        ? `${basePath}/revisit?day=${activeSession.day}`
        : nextOutcome === "Command"
          ? `${basePath}/track?day=${activeSession.day}`
          : `${basePath}/mcq-readiness?day=${activeSession.day}`;
    const nextReviewSummary = isRecoveryRetestAttempt
      ? !nextIsComplete
        ? `${nextAnsweredCount}/${nextTotal} recovery retest questions completed for ${activeBatchCode}. Finish the retest before routing.`
        : nextOutcome === "Command"
          ? `${nextCorrectCount}/${nextTotal} correct (${nextScorePercent}%). Recovery retest cleared for ${activeBatchCode}.`
          : `${nextCorrectCount}/${nextTotal} correct (${nextScorePercent}%). Recovery retest still below command gate for ${activeBatchCode}.`
      : !nextIsComplete
        ? `${nextAnsweredCount}/${nextTotal} fresh questions completed for ${activeBatchCode}. Finish the batch before routing.`
        : nextOutcome === "Command"
          ? `${nextCorrectCount}/${nextTotal} correct (${nextScorePercent}%). Command gate cleared for ${activeBatchCode}.`
          : `${nextCorrectCount}/${nextTotal} correct (${nextScorePercent}%). Revisit queued for ${activeBatchCode}.`;

    setPracticeAnswers(nextAnswers);
    saveDayProgress(activeSession.day, {
      mcqAttempted: nextAnsweredCount > 0,
      mcqCompleted: nextIsComplete,
      mcqAnswerMap: nextAnswers,
      mcqCurrentQuestionIndex: currentPracticeIndex,
      mcqAnsweredCount: nextAnsweredCount,
      mcqCorrectCount: nextCorrectCount,
      mcqTotal: nextTotal,
      mcqScorePercent: nextScorePercent,
      mcqLastBatchCode: activeBatchCode,
      mcqOutcome: nextOutcome,
      mcqRecommendedRoute: nextRecommendedRoute,
      mcqReviewSummary: nextReviewSummary,
      mcqReadinessStatus: !nextIsComplete ? "practice-active" : nextOutcome === "Command" ? "command" : "revisit",
      mcqEvidenceAnchor: `${activeBatchCode} / ${activeSession.title} / ${nextCorrectCount}/${nextTotal} correct`,
      mcqNextRoute: nextRecommendedRoute,
      mcqNextActionLabel: nextOutcome === "Revisit" ? "Open revisit" : nextOutcome === "Command" ? "Review track" : "Finish practice",
      mcqPreflightSummary: nextReviewSummary,
      mcqFreshQuestionCount: localBatchQuestions.length,
      mcqPlannedCount: plannedCount,
      mcqRecoveryRetestCompleted: isRecoveryRetestAttempt && nextIsComplete ? true : activeProgress?.mcqRecoveryRetestCompleted,
      mcqRecoveryRetestOutcome:
        isRecoveryRetestAttempt && nextIsComplete ? nextOutcome : activeProgress?.mcqRecoveryRetestOutcome,
      mcqRecoveryRetestSummary:
        isRecoveryRetestAttempt && nextIsComplete ? nextReviewSummary : activeProgress?.mcqRecoveryRetestSummary,
      mcqRecoveryRetestCompletedAt:
        isRecoveryRetestAttempt && nextIsComplete ? new Date().toISOString() : activeProgress?.mcqRecoveryRetestCompletedAt,
      mcqRecoveryResolved:
        isRecoveryRetestAttempt && nextIsComplete ? nextOutcome === "Command" : activeProgress?.mcqRecoveryResolved,
      revisitQueued: nextIsComplete && nextOutcome === "Revisit" ? true : activeProgress?.revisitQueued,
      confidence:
        nextIsComplete && nextOutcome === "Revisit"
          ? "Shaky"
          : nextIsComplete && nextOutcome === "Command"
            ? "Command"
            : activeProgress?.confidence,
      activePromptLabel: isRecoveryRetestAttempt ? "MCQ Retest" : "MCQ Practice",
    });

    if (nextIsComplete) {
      try {
        const action = nextScorePercent === 100 ? "perfect-score" : "mcq-complete";
        const rewardResult = awardGamificationRewards(action);
        if (rewardResult.addedPoints > 0) {
          toast.success(action === "perfect-score" ? "Perfect MCQ Practice!" : "MCQ Practice Complete!", {
            description: `Earned +${rewardResult.addedPoints} XP and +${rewardResult.addedCoins} Coins!`,
          });
          if (rewardResult.unlockedBadge) {
            toast.message(`Milestone Unlocked: ${rewardResult.unlockedBadge.title}`, {
              description: rewardResult.unlockedBadge.description,
              icon: rewardResult.unlockedBadge.icon,
            });
          }
        }
      } catch (e) {
        console.error("Failed to award rewards", e);
      }
    }
  };

  const movePracticeIndex = (nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(localBatchQuestions.length - 1, nextIndex));
    setCurrentPracticeIndex(boundedIndex);
    saveDayProgress(activeSession.day, {
      mcqAttempted: true,
      mcqAnswerMap: practiceAnswers,
      mcqCurrentQuestionIndex: boundedIndex,
      mcqAnsweredCount: answeredPracticeCount,
      mcqCorrectCount: correctPracticeCount,
      mcqTotal: localBatchQuestions.length,
      mcqScorePercent: practicePercent,
      mcqLastBatchCode: activeBatchCode,
      mcqOutcome: "Pending",
      mcqReadinessStatus: "practice-active",
      mcqReviewSummary: `${answeredPracticeCount}/${localBatchQuestions.length} fresh questions answered for ${activeBatchCode}.`,
    });
  };

  const resetLocalPractice = () => {
    setPracticeStarted(false);
    setCurrentPracticeIndex(0);
    setPracticeAnswers({});
    saveDayProgress(activeSession.day, {
      mcqAttempted: undefined,
      mcqCompleted: undefined,
      mcqAnswerMap: undefined,
      mcqCurrentQuestionIndex: undefined,
      mcqAnsweredCount: undefined,
      mcqCorrectCount: undefined,
      mcqTotal: undefined,
      mcqScorePercent: undefined,
      mcqLastBatchCode: undefined,
      mcqOutcome: undefined,
      mcqRecommendedRoute: undefined,
      mcqReviewSummary: undefined,
      mcqReadinessStatus: isStudentMcqUnlocked ? "practice-ready" : mcqReadinessStatus,
      mcqEvidenceAnchor,
      mcqNextRoute: isStudentMcqUnlocked ? `${basePath}/mcq-readiness?day=${activeSession.day}` : mcqNextRoute,
      mcqNextActionLabel: isStudentMcqUnlocked ? "Start fresh MCQs" : mcqNextActionLabel,
      mcqPreflightSummary,
      mcqFreshQuestionCount: localBatchQuestions.length,
      mcqPlannedCount: plannedCount,
      revisitQueued: activeProgress?.mcqOutcome === "Revisit" ? false : activeProgress?.revisitQueued,
      confidence:
        activeProgress?.mcqOutcome === "Revisit"
          ? activeProgress?.talkBand === "Command"
            ? "Command"
            : "Working"
          : activeProgress?.confidence,
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvPreview], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${templateRow.batch_code}-mcq-template.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), plan.sessions.length);
    setActiveDay(boundedDay);
    setDownloaded(false);
    router.replace(`${basePath}/mcq-readiness?day=${boundedDay}`, { scroll: false });
  };

  return (
    <div
      data-testid="subject-mcq-shell"
      data-room="mcq"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <McqUsageMeter />
        <McqUsageNudge />
        <section data-testid="mcq-simple-step" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link href={basePath} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
                <ArrowLeft className="h-4 w-4" /> {plan.title} command room
              </Link>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">MCQ</Badge>
                <span className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] px-3 py-1 text-xs font-black text-[var(--subject-heading)]">
                  Day {activeSession.day}
                </span>
                <span className="rounded-md border border-[var(--subject-border)] bg-white px-3 py-1 text-xs font-bold text-[#5d675f]">
                  {activeBatchCode}
                </span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">{activeSession.chapter}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
                {activeSession.title}
              </h1>
              <p data-testid="mcq-student-readiness-copy" className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                {mcqStudentReadinessCopy}
              </p>
            </div>

            <div data-testid="mcq-primary-action" className="w-full rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4 lg:max-w-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Next action</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--subject-heading)]">{mcqNextActionLabel}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{mcqStudentNextDetail}</p>
              {hasLocalQuestionContent && !practiceStarted && !isPracticeComplete ? (
                <div data-testid="mcq-top-start-practice" className="mt-4">
                  <button
                    type="button"
                    data-testid="mcq-start-local-practice"
                    onClick={startLocalPractice}
                    disabled={!canStartPractice}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {canStartPractice ? mcqPrimaryPracticeLabel : mcqNextActionLabel} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href={mcqNextRoute}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90"
                >
                  {mcqNextActionLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div data-testid="mcq-student-flow" className="mt-5 grid gap-3 md:grid-cols-4">
            {mcqStudentFlowItems.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-lg border bg-white p-3",
                  item.complete ? "border-[var(--subject-accent)]" : "border-[var(--subject-border)]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--subject-heading)]">{item.label}</p>
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md text-xs font-black",
                      item.complete ? "bg-[var(--subject-light)] text-[var(--subject-dark)]" : "bg-[var(--subject-bg)] text-[#746f66]"
                    )}
                  >
                    {item.complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-[#5d675f]">{item.value}</p>
              </div>
            ))}
          </div>

          <details
            data-testid="mcq-readiness-command-board"
            className="group mt-5 rounded-lg border border-[var(--subject-border)] bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Readiness checks</p>
                <h3 className="text-lg font-black text-[var(--subject-heading)]">{practiceGateStatus}</h3>
              </div>
              <span
                data-testid="mcq-preflight-status"
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ring-1",
                  mcqReadinessStatus === "practice-ready" || mcqReadinessStatus === "command"
                    ? "bg-[var(--subject-light)] text-[var(--subject-dark)] ring-[var(--subject-ring)]"
                    : "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/30"
                )}
              >
                {mcqReadinessLabel}
              </span>
            </summary>
            <div className="hidden border-t border-[var(--subject-border)] p-4 group-open:block">
              <p data-testid="mcq-evidence-anchor" className="break-words rounded-md bg-[var(--subject-light)] p-3 text-xs font-bold leading-5 text-[var(--subject-dark)]">
                {mcqEvidenceAnchor}
              </p>
              <p data-testid="mcq-next-decision" className="mt-3 rounded-md bg-[var(--subject-bg)] p-3 text-sm font-black text-[var(--subject-heading)]">
                Next: {mcqNextActionLabel}
              </p>
              <div data-testid="mcq-gate-checklist" className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  { label: "Watch", value: `${watchCompletion.completed}/${watchCompletion.target}`, complete: isWatchGateUnlocked },
                  { label: "Talk", value: activeProgress?.talkScore ? `${activeProgress.talkScore}% / ${SUBJECT_RECALL_TARGET}%` : "Pending", complete: isTalkMcqGateUnlocked },
                  { label: "Visual support", value: `${labProofCompletion.completed}/${labProofCompletion.target} optional proofs`, complete: true },
                  { label: "Fresh MCQ", value: `${localBatchQuestions.length}/${plannedCount}`, complete: isFreshBatchReady },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-md border p-3",
                      item.complete ? "border-[var(--subject-accent)] bg-white text-[var(--subject-heading)]" : "border-[#ef9f27]/40 bg-[#fff4df] text-[#6f4a12]"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-black">{item.label}</p>
                      {item.complete ? <CheckCircle2 className="h-4 w-4 text-[var(--subject-accent)]" /> : <LockKeyhole className="h-4 w-4" />}
                    </div>
                    <p className="text-xs font-bold leading-5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>

          <div
            data-testid="mcq-practice-launcher"
            className={cn(
              "mt-5 rounded-lg border p-4",
              isStudentMcqUnlocked ? "border-[var(--subject-accent)] bg-[var(--subject-light)]" : "border-[var(--subject-border)] bg-[var(--subject-bg)]"
            )}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Practice</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--subject-heading)]">{practiceGateStatus}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">{practiceGateDetail}</p>
              </div>
              {hasLocalQuestionContent ? (
                <span
                  data-testid="mcq-single-start-note"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-black text-[var(--subject-dark)] lg:w-auto"
                >
                  {practiceStarted
                    ? "Practice in progress"
                    : isPracticeComplete
                      ? mcqOutcomeTitle
                      : isRecoveryRetestMode
                        ? "Use the next action to retest"
                        : "Use the next action to start"}
                </span>
              ) : (
                <span
                  data-testid="mcq-fresh-content-pending"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-black text-[#6f4a12] lg:w-auto"
                >
                  Fresh MCQs not attached yet
                </span>
              )}
            </div>

            {practiceStarted && currentPracticeQuestion ? (
              <div data-testid="mcq-local-practice-runner" className="mt-4 rounded-lg border border-[var(--subject-accent)] bg-white/85 p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Question</p>
                    <h3 className="mt-1 text-xl font-black text-[var(--subject-heading)]">
                      {currentPracticeIndex + 1} of {localBatchQuestions.length}
                    </h3>
                  </div>
                  <span data-testid="mcq-local-practice-score" className="rounded-md bg-[var(--subject-light)] px-3 py-2 text-xs font-black text-[var(--subject-dark)]">
                    Score {correctPracticeCount}/{localBatchQuestions.length} ({practicePercent}%)
                  </span>
                </div>
                <p className="rounded-md bg-[var(--subject-bg)] p-3 text-base font-black leading-7 text-[var(--subject-heading)]">
                  {currentPracticeQuestion.text_en}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(["A", "B", "C", "D"] as const).map((option) => {
                    const isSelected = currentPracticeAnswer === option;
                    const isCorrect = currentPracticeQuestion.correct_option === option;
                    const showResult = Boolean(currentPracticeAnswer);
                    return (
                      <button
                        key={option}
                        type="button"
                        data-testid={`mcq-practice-option-${option}`}
                        onClick={() => selectPracticeAnswer(option)}
                        disabled={Boolean(currentPracticeAnswer)}
                        className={cn(
                          "min-h-14 rounded-md border px-3 py-2 text-left text-sm font-bold leading-6 transition disabled:cursor-not-allowed",
                          showResult && isCorrect && "border-[var(--subject-accent)] bg-[var(--subject-light)] text-[var(--subject-dark)]",
                          showResult && isSelected && !isCorrect && "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
                          !showResult && "border-[var(--subject-border)] bg-white text-[#34453b] hover:border-[var(--subject-accent)]"
                        )}
                      >
                        <span className="font-black">{option}.</span> {getOptionText(currentPracticeQuestion, option)}
                      </button>
                    );
                  })}
                </div>
                {currentPracticeAnswer ? (
                  <div data-testid="mcq-practice-feedback" className="mt-4 rounded-md border border-[var(--subject-accent)] bg-[var(--subject-light)] p-3">
                    <p className="text-sm font-black text-[var(--subject-dark)]">
                      {currentPracticeAnswer === currentPracticeQuestion.correct_option ? "Correct answer" : "Review this trap"}
                    </p>
                    {currentPracticeQuestion.explanation_en ? (
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">{currentPracticeQuestion.explanation_en}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    data-testid="mcq-previous-question"
                    onClick={() => movePracticeIndex(currentPracticeIndex - 1)}
                    disabled={currentPracticeIndex === 0}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-bold text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <button
                    type="button"
                    data-testid="mcq-next-question"
                    onClick={() => movePracticeIndex(currentPracticeIndex + 1)}
                    disabled={currentPracticeIndex === localBatchQuestions.length - 1}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-bold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetLocalPractice}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-bold text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)]"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>
                </div>
              </div>
            ) : null}

            {visiblePracticeTotal > 0 && (practiceStarted || Boolean(hasPersistedMcqForBatch && activeProgress?.mcqAttempted)) ? (
              <div data-testid="mcq-practice-outcome-gate" className="mt-4 rounded-lg border border-[var(--subject-accent)] bg-white/75 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Practice outcome</p>
                <h3 className="mt-1 text-xl font-black text-[var(--subject-heading)]">{mcqOutcomeTitle}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-[#49675e]">{mcqOutcomeDetail}</p>
                {mcqOutcome !== "Pending" ? (
                  <span data-testid="mcq-local-practice-score" className="mt-3 inline-flex rounded-md bg-[var(--subject-light)] px-3 py-2 text-xs font-black text-[var(--subject-dark)]">
                    Score {visibleCorrectCount}/{visiblePracticeTotal} ({visiblePracticePercent}%)
                  </span>
                ) : null}
                {mcqOutcome !== "Pending" ? (
                  <Link
                    data-testid="mcq-practice-outcome-route"
                    href={mcqRecommendedHref}
                    className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90"
                  >
                    {mcqRecommendedLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <details data-testid="mcq-advanced-tools" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[var(--subject-dark)]">
            Advanced MCQ authoring and quality controls
          </summary>
          <div className="mt-5 space-y-6">
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
            <Link href={basePath} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
              <ArrowLeft className="h-4 w-4" /> {plan.title} command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">Fresh MCQ Mapping</Badge>
              <span className="text-sm font-bold text-[#776f64]">Subject-specific authoring contract</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--subject-accent)]">{templateRow.batch_code}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">
              Fresh {plan.title} MCQs should attach to this day, chapter, topic, and batch code so Test, Track, and Revisit stay connected.
            </p>

            <div
              data-testid="mcq-day-test-command"
              className="mt-5 rounded-lg border border-[var(--subject-border)] bg-white/70 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--subject-light)] text-[var(--subject-dark)]">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                    Daily test command
                  </p>
                  <p className="mt-2 break-words text-sm font-bold leading-6 text-[#34453b]">{activeSession.test}</p>
                  <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#746f66]">
                    Use this line to author the CSV stem, explanation, distractor logic, and local practice gate for this day.
                  </p>
                </div>
              </div>
            </div>

            <div
              data-testid="mcq-talk-gate"
              className={cn(
                "mt-5 rounded-lg border p-4",
                isStudentMcqUnlocked
                  ? "border-[var(--subject-accent)] bg-[var(--subject-light)]"
                  : "border-[#ef9f27]/45 bg-[#fff4df]"
              )}
            >
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white",
                      isStudentMcqUnlocked ? "bg-[var(--subject-accent)]" : "bg-[#9a6a16]"
                    )}
                  >
                    {isStudentMcqUnlocked ? <UnlockKeyhole className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">Learning gate</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--subject-heading)]">{learningGateStatus}</h2>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{learningGateDetail}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <span
                        className={cn(
                          "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                          isWatchGateUnlocked ? "border-[var(--subject-accent)] bg-white/70 text-[var(--subject-dark)]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" /> {isWatchGateUnlocked ? "Watch complete" : "Watch pending"}
                      </span>
                      <span
                        className={cn(
                          "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                          isTalkMcqGateUnlocked ? "border-[var(--subject-accent)] bg-white/70 text-[var(--subject-dark)]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" /> {isTalkMcqGateUnlocked ? "95% Talk cleared" : "Talk below 95%"}
                      </span>
                      <span
                        data-testid="mcq-lab-gate"
                        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[var(--subject-accent)] bg-white/70 px-3 text-xs font-black text-[var(--subject-dark)]"
                      >
                        <Layers3 className="h-4 w-4" /> Visual support optional
                      </span>
                      <span
                        className={cn(
                          "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                          isFreshCountReady ? "border-[var(--subject-accent)] bg-white/70 text-[var(--subject-dark)]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                        )}
                      >
                        <FileSpreadsheet className="h-4 w-4" /> {isFreshCountReady ? "Fresh count ready" : "Fresh count pending"}
                      </span>
                      {mcqQualityAudit && (
                        <span
                          className={cn(
                            "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                            isMcqQualityReady ? "border-[var(--subject-accent)] bg-white/70 text-[var(--subject-dark)]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                          )}
                        >
                          <ShieldCheck className="h-4 w-4" /> {isMcqQualityReady ? "MCQ quality passed" : "MCQ quality review"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  data-testid="mcq-talk-route"
                  href={learningGateHref}
                  className={cn(
                    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-black text-white transition sm:w-auto",
                    isStudentMcqUnlocked ? "bg-[var(--subject-dark)] hover:brightness-90" : "bg-[#9a6a16] hover:bg-[#7f5410]"
                  )}
                >
                  {learningGateAction}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div data-testid="mcq-gate-checklist-detail" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm xl:col-span-2">
            <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Student unlock checklist</p>
                <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Practice unlock proof</h2>
              </div>
              <ShieldCheck className="h-6 w-6 text-[var(--subject-dark)]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Watch room",
                  detail: `${watchCompletion.completed}/${watchCompletion.target} scenes completed`,
                  complete: isWatchGateUnlocked,
                },
                {
                  label: "AI teacher",
                  detail: activeProgress?.talkScore
                    ? `${activeProgress.talkScore}% score / ${SUBJECT_RECALL_TARGET}% target`
                    : "No Talk clearance yet",
                  complete: isTalkMcqGateUnlocked,
                },
                {
                  label: "Visual support",
                  detail: `${labProofCompletion.completed}/${labProofCompletion.target} optional proof stages saved`,
                  complete: true,
                },
                {
                  label: "Fresh MCQs",
                  detail: `${draftedCount}/${plannedCount} drafted`,
                  complete: isFreshCountReady,
                },
                ...(mcqQualityAudit
                  ? [
                      {
                        label: "Environment quality",
                        detail: `${mcqQualityAudit.score}% score, ${mcqQualityAudit.readyCount}/${mcqQualityAudit.items.length} checks passed`,
                        complete: isMcqQualityReady,
                      },
                    ]
                  : []),
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-md border p-4",
                    item.complete ? "border-[var(--subject-accent)] bg-[var(--subject-light)]" : "border-[#ef9f27]/40 bg-[#fff4df]"
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[var(--subject-heading)]">{item.label}</p>
                    {item.complete ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--subject-accent)]" />
                    ) : (
                      <LockKeyhole className="h-5 w-5 text-[#9a6a16]" />
                    )}
                  </div>
                  <p className="text-xs font-bold leading-5 text-[#49675e]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="mcq-readiness-command-board-detail" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">MCQ readiness command board</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--subject-heading)]">Fresh-batch preflight is locally saved</h2>
                <p data-testid="mcq-evidence-anchor-detail" className="mt-2 break-words text-sm font-bold leading-6 text-[#657066]">
                  {mcqEvidenceAnchor}
                </p>
              </div>
              <span
                data-testid="mcq-preflight-status-detail"
                className={cn(
                  "inline-flex min-h-9 max-w-full items-center break-words rounded-md px-3 text-xs font-black uppercase tracking-[0.12em] ring-1 sm:shrink-0",
                  mcqReadinessStatus === "practice-ready" || mcqReadinessStatus === "command"
                    ? "bg-[var(--subject-light)] text-[var(--subject-dark)] ring-[var(--subject-ring)]"
                    : mcqReadinessStatus === "revisit" || mcqReadinessStatus === "quality-review"
                      ? "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/30"
                      : "bg-[#f7f4ee] text-[#49675e] ring-[#dcd5c7]"
                )}
              >
                {mcqReadinessLabel}
              </span>
            </div>

            <div className="grid gap-2 md:grid-cols-5">
              {mcqCommandItems.map((item) => (
                <div key={item.label} className="min-w-0 rounded-md border border-[var(--subject-border)] bg-[var(--subject-soft)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">{item.label}</p>
                    <span className={cn("rounded-md px-2 py-1 text-[10px] font-black uppercase ring-1", commandStatusClass(item.status))}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-xs font-bold leading-5 text-[#49675e]">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-[var(--subject-light)] p-3">
              <p data-testid="mcq-next-decision-detail" className="break-words text-sm font-black text-[var(--subject-dark)]">
                Next: {mcqNextActionLabel}
              </p>
              <Link
                href={mcqNextRoute}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition",
                  isStudentMcqUnlocked || isPracticeComplete
                    ? "bg-[var(--subject-dark)] text-white hover:brightness-90"
                    : "border border-[var(--subject-border)] bg-white text-[var(--subject-dark)] hover:bg-[var(--subject-light)]"
                )}
              >
                {mcqNextActionLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div
            data-testid="mcq-practice-launcher-detail"
            className={cn(
              "rounded-lg border p-5 shadow-sm xl:col-span-2",
              isStudentMcqUnlocked ? "border-[var(--subject-accent)] bg-[var(--subject-light)]" : "border-[var(--subject-border)] bg-[var(--subject-card)]"
            )}
          >
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white",
                    isStudentMcqUnlocked ? "bg-[var(--subject-accent)]" : "bg-[var(--subject-dark)]"
                  )}
                >
                  {isStudentMcqUnlocked ? <PlayCircle className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">Student practice launcher</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--subject-heading)]">{practiceGateStatus}</h2>
                  <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{practiceGateDetail}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <span
                      className={cn(
                        "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                        isStudentMcqUnlocked ? "border-[var(--subject-accent)] bg-white/70 text-[var(--subject-dark)]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                      )}
                    >
                      <UnlockKeyhole className="h-4 w-4" /> {isStudentMcqUnlocked ? "Gates passed" : "Gates pending"}
                    </span>
                    <span
                      data-testid="mcq-batch-gate"
                      className={cn(
                        "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                        isFreshBatchReady ? "border-[var(--subject-accent)] bg-white/70 text-[var(--subject-dark)]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                      )}
                    >
                      <ClipboardCheck className="h-4 w-4" /> {mcqBatchGateLabel}
                    </span>
                    <span
                      className={cn(
                        "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                        hasLocalQuestionContent ? "border-[var(--subject-accent)] bg-white/70 text-[var(--subject-dark)]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                      )}
                    >
                      <FileSpreadsheet className="h-4 w-4" /> {hasLocalQuestionContent ? `${localBatchQuestions.length} loaded` : "No local rows"}
                    </span>
                  </div>
                </div>
              </div>

              {hasLocalQuestionContent ? (
                <button
                  type="button"
                  data-testid="mcq-start-local-practice-detail"
                  onClick={startLocalPractice}
                  disabled={!canStartPractice}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {isRecoveryRetestMode ? "Retest fresh MCQs" : "Start local practice"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  href="/admin/questions/bulk"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] sm:w-auto"
                >
                  Upload fresh CSV
                  <UploadCloud className="h-4 w-4" />
                </Link>
              )}
            </div>

            {hasRecoveryRetestContext && (
              <div
                data-testid="mcq-recovery-retest-banner"
                className={cn(
                  "mt-4 rounded-lg border p-4",
                  activeProgress?.mcqRecoveryResolved
                    ? "border-[var(--subject-accent)] bg-white/75"
                    : "border-[#ef9f27]/45 bg-[#fff8ea]"
                )}
              >
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">
                      Recovery retest mode
                    </p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-[var(--subject-heading)]">
                      {activeProgress?.mcqRecoveryResolved ? "Recovery loop closed" : "Retest after recovery"}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#49675e]">
                      {activeProgress?.mcqRecoveryRetestSummary ??
                        activeProgress?.mcqRecoverySummary ??
                        "A recovery proof exists. This next MCQ run decides whether the day is command-ready or needs another repair."}
                    </p>
                  </div>
                  <span className="max-w-full break-words rounded-md bg-white px-3 py-2 text-xs font-black text-[var(--subject-dark)] ring-1 ring-[var(--subject-ring)] sm:shrink-0">
                    {activeProgress?.mcqRecoveryResolved ? "Closed" : "Retest pending"}
                  </span>
                </div>
              </div>
            )}

            {hasLocalQuestionContent && (
              <div data-testid="mcq-local-question-preview" className="mt-4 grid gap-3">
                {localBatchQuestions.slice(0, 3).map((question, index) => (
                  <div key={`${question.text_en}-${index}`} className="rounded-md border border-[var(--subject-accent)] bg-white/75 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">
                        Fresh question {index + 1}
                      </p>
                      <span className="rounded-md bg-[var(--subject-bg)] px-2 py-1 text-[11px] font-black text-[var(--subject-dark)]">
                        Answer {question.correct_option}
                      </span>
                    </div>
                    <p className="break-words text-sm font-black leading-6 text-[var(--subject-heading)]">{question.text_en}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(["A", "B", "C", "D"] as const).map((option) => (
                        <p key={option} className="rounded-md bg-[#f7f4ee] px-3 py-2 text-xs font-bold leading-5 text-[#34453b]">
                          {option}. {getOptionText(question, option)}
                        </p>
                      ))}
                    </div>
                    {question.explanation_en ? (
                      <p className="mt-3 break-words text-xs font-semibold leading-5 text-[#657066]">
                        {question.explanation_en}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {practiceStarted && currentPracticeQuestion && (
              <div data-testid="mcq-local-practice-runner-detail" className="mt-4 rounded-lg border border-[var(--subject-accent)] bg-white/85 p-4">
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Local practice</p>
                    <h3 className="mt-1 text-xl font-black text-[var(--subject-heading)]">
                      Question {currentPracticeIndex + 1} of {localBatchQuestions.length}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <span
                      data-testid="mcq-local-practice-score-detail"
                      className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-[var(--subject-light)] px-3 text-xs font-black text-[var(--subject-dark)] sm:w-auto"
                    >
                      Score {correctPracticeCount}/{localBatchQuestions.length} ({practicePercent}%)
                    </span>
                    <span className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-[#f7f4ee] px-3 text-xs font-black text-[#34453b] sm:w-auto">
                      Answered {answeredPracticeCount}/{localBatchQuestions.length}
                    </span>
                  </div>
                </div>

                <p className="break-words rounded-md bg-[var(--subject-bg)] p-3 text-base font-black leading-7 text-[var(--subject-heading)]">
                  {currentPracticeQuestion.text_en}
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(["A", "B", "C", "D"] as const).map((option) => {
                    const isSelected = currentPracticeAnswer === option;
                    const isCorrect = currentPracticeQuestion.correct_option === option;
                    const showResult = Boolean(currentPracticeAnswer);
                    return (
                      <button
                        key={option}
                        type="button"
                        data-testid={`mcq-practice-option-detail-${option}`}
                        onClick={() => selectPracticeAnswer(option)}
                        disabled={Boolean(currentPracticeAnswer)}
                        className={cn(
                          "min-h-14 rounded-md border px-3 py-2 text-left text-sm font-bold leading-6 transition disabled:cursor-not-allowed",
                          showResult && isCorrect && "border-[var(--subject-accent)] bg-[var(--subject-light)] text-[var(--subject-dark)]",
                          showResult && isSelected && !isCorrect && "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
                          !showResult && "border-[var(--subject-border)] bg-white text-[#34453b] hover:border-[var(--subject-accent)]"
                        )}
                      >
                        <span className="font-black">{option}.</span> {getOptionText(currentPracticeQuestion, option)}
                      </button>
                    );
                  })}
                </div>

                {currentPracticeAnswer && (
                  <div data-testid="mcq-practice-feedback-detail" className="mt-4 rounded-md border border-[var(--subject-accent)] bg-[var(--subject-light)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-black text-[var(--subject-dark)]">
                        {currentPracticeAnswer === currentPracticeQuestion.correct_option ? "Correct answer" : "Review this trap"}
                      </p>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-[var(--subject-dark)]">
                        Correct option {currentPracticeQuestion.correct_option}
                      </span>
                    </div>
                    {currentPracticeQuestion.explanation_en ? (
                      <p className="mt-2 break-words text-sm font-semibold leading-6 text-[#49675e]">
                        {currentPracticeQuestion.explanation_en}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    data-testid="mcq-previous-question-detail"
                    onClick={() => movePracticeIndex(currentPracticeIndex - 1)}
                    disabled={currentPracticeIndex === 0}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-bold text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <button
                    type="button"
                    data-testid="mcq-next-question-detail"
                    onClick={() => movePracticeIndex(currentPracticeIndex + 1)}
                    disabled={currentPracticeIndex === localBatchQuestions.length - 1}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-bold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    Next question <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetLocalPractice}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-bold text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] sm:w-auto"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>
                </div>
              </div>
            )}

            {visiblePracticeTotal > 0 && (practiceStarted || Boolean(hasPersistedMcqForBatch && activeProgress?.mcqAttempted)) && (
              <div
                data-testid="mcq-practice-outcome-gate-detail"
                className={cn(
                  "mt-4 rounded-lg border p-4",
                  mcqOutcome === "Command" && "border-[var(--subject-accent)] bg-[var(--subject-light)]",
                  mcqOutcome === "Revisit" && "border-[#ef9f27]/55 bg-[#fff4df]",
                  mcqOutcome === "Pending" && "border-[#dcd5c7] bg-[#fdfaf3]"
                )}
              >
                <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">Practice outcome</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--subject-heading)]">{mcqOutcomeTitle}</h3>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{mcqOutcomeDetail}</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <span className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-white/75 px-3 text-xs font-black text-[var(--subject-dark)] sm:w-auto">
                        Score {visibleCorrectCount}/{visiblePracticeTotal} ({visiblePracticePercent}%)
                      </span>
                      <span className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-white/75 px-3 text-xs font-black text-[#34453b] sm:w-auto">
                        Answered {visibleAnsweredCount}/{visiblePracticeTotal}
                      </span>
                      <span className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-white/75 px-3 text-xs font-black text-[#34453b] sm:w-auto">
                        Gate {MCQ_COMMAND_SCORE}%
                      </span>
                    </div>
                  </div>
                  {mcqOutcome === "Pending" ? (
                    <span className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#746f66] sm:w-auto">
                      Route locked
                    </span>
                  ) : (
                    <Link
                      data-testid="mcq-practice-outcome-route-detail"
                      href={mcqRecommendedHref}
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-black text-white transition sm:w-auto",
                        mcqOutcome === "Revisit" ? "bg-[#9a6a16] hover:bg-[#7f5410]" : "bg-[var(--subject-dark)] hover:brightness-90"
                      )}
                    >
                      {mcqRecommendedLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {mcqQualityAudit && (
            <div
              data-testid={qualityGateTestId}
              className={cn(
                "rounded-lg border p-5 shadow-sm xl:col-span-2",
                isMcqQualityReady ? "border-[var(--subject-accent)] bg-[var(--subject-light)]" : "border-[#ef9f27]/50 bg-[#fff8ea]"
              )}
            >
              <div className="mb-5 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">{qualityGateLabel}</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--subject-heading)]">
                    {qualityGateTitle}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[#49675e]">
                    {qualityGateDetail}
                  </p>
                </div>
                <div className="w-full rounded-md border border-[#dcd5c7] bg-white px-4 py-3 text-left sm:w-auto sm:min-w-40 sm:text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#746f66]">Quality score</p>
                  <p data-testid={qualityScoreTestId} className="mt-1 text-3xl font-black text-[var(--subject-heading)]">
                    {mcqQualityAudit.score}%
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {mcqQualityAudit.items.map((check) => (
                  <div
                    key={check.id}
                    data-testid={`${qualityItemTestPrefix}-${check.id}`}
                    className={cn(
                      "rounded-md border bg-white p-4",
                      check.passed ? "border-[var(--subject-accent)]" : "border-[#ef9f27]/45"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[var(--subject-heading)]">{check.label}</p>
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--subject-accent)]" />
                      ) : (
                        <LockKeyhole className="h-4 w-4 text-[#9a6a16]" />
                      )}
                    </div>
                    <p className="text-xs font-bold leading-5 text-[#5d675f]">{check.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-[#dcd5c7] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Required case anchors</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#49675e]">
                    {mcqQualityAudit.requiredCaseTags.slice(0, 6).join(" | ") || "Use the day lab and map/case hook."}
                  </p>
                </div>
                <div className="rounded-md border border-[#dcd5c7] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Keyword anchors</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#49675e]">
                    {mcqQualityAudit.requiredKeywords.slice(0, 8).join(" | ") || "Use the session topic and syllabus terms."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm xl:col-start-2 xl:row-start-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Readiness control</p>
                <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Plan the fresh MCQ batch</h2>
              </div>
              <UploadCloud className="h-6 w-6 text-[var(--subject-dark)]" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Planned questions", plannedCount],
                ["Drafted questions", draftedCount],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-soft)] p-4">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">{label as string}</label>
                  <input
                    type="number"
                    min={label === "Planned questions" ? 1 : 0}
                    max={100}
                    value={value as number}
                    onChange={(event) => {
                      const nextValue = Math.max(label === "Planned questions" ? 1 : 0, Number(event.target.value) || 0);
                      saveReadinessState(
                        label === "Planned questions"
                          ? { planned: nextValue }
                          : { drafted: nextValue }
                      );
                    }}
                    className="mt-3 h-11 w-full rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-black text-[var(--subject-heading)] outline-none focus:border-[var(--subject-accent)] focus:ring-2 focus:ring-[var(--subject-ring)]"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-[var(--subject-dark)]">{readinessStatus}</p>
                <p className="text-sm font-black text-[var(--subject-dark)]">{completion}%</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f2eadc]">
                <div className="h-full rounded-full bg-[var(--subject-accent)]" style={{ width: `${completion}%` }} />
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              {difficulties.map((item) => {
                const isActive = difficulty === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      saveReadinessState({ difficulty: item });
                      setDownloaded(false);
                    }}
                    className={cn(
                      "min-h-11 rounded-md border px-3 text-xs font-black transition",
                      isActive
                        ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                        : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[#34453b] hover:border-[var(--subject-accent)]"
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">{plan.sessions.length}-day mapping</p>
              <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Select the target class day</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {plan.sessions.map((session) => {
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
                        : "border-[var(--subject-border)] bg-[var(--subject-bg)] text-[#34453b] hover:border-[var(--subject-accent)]"
                    )}
                  >
                    <span className="block text-xs font-black uppercase tracking-[0.16em]">
                      {getSubjectBatchCode(plan.slug, session.day)}
                    </span>
                    <span className="mt-2 block text-sm font-bold leading-5">{session.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--subject-heading)]">CSV template</p>
                  <p className="text-xs font-semibold text-[#746f66]">Generated from selected day mapping</p>
                </div>
              </div>
              <pre className="max-h-72 overflow-auto rounded-md bg-[var(--subject-dark)] p-4 text-xs font-semibold leading-5 text-[var(--subject-light)]">
                {csvPreview}
              </pre>
              <button
                type="button"
                onClick={downloadTemplate}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-bold text-white transition hover:brightness-90"
              >
                <Download className="h-4 w-4" /> Download CSV template
              </button>
              {downloaded && (
                <div className="mt-4 flex items-start gap-3 rounded-md bg-[var(--subject-light)] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--subject-accent)]" />
                  <p className="text-sm font-bold leading-6 text-[var(--subject-dark)]">
                    Template generated for {templateRow.batch_code}.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Upload action</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--subject-heading)]">Attach MCQs to the batch</h2>
              <Link href="/admin/questions/bulk" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-bold text-white transition hover:brightness-90">
                <UploadCloud className="h-4 w-4" /> Open bulk upload
              </Link>
            </div>

            <SubjectLoopActions plan={plan} activeDay={activeSession.day} current="mcq" />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">Contract fields</p>
              <h2 className="text-2xl font-black tracking-tight text-[var(--subject-heading)]">Fresh MCQ authoring rules</h2>
            </div>
            <ShieldCheck className="h-6 w-6 text-[var(--subject-dark)]" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {contractColumns.map(([key, label, required, detail]) => (
              <div key={key} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-soft)] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--subject-heading)]">{label}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md text-[10px] font-black",
                      required === "Required" ? "border-[var(--subject-accent)] text-[var(--subject-dark)]" : "border-[#cfc6b6] text-[#746f66]"
                    )}
                  >
                    {required}
                  </Badge>
                </div>
                <p className="text-xs font-semibold leading-5 text-[#657066]">{detail}</p>
              </div>
            ))}
          </div>
        </section>
          </div>
        </details>
      </div>
    </div>
  );
}
