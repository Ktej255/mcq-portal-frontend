"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  ListChecks,
  Layers3,
  LockKeyhole,
  MapPinned,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  UnlockKeyhole,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyLoopActions } from "@/components/upsc/GeographyLoopActions";
import { hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { geographySessions, GeographySession } from "@/lib/upsc/plan";
import {
  buildGeographyMcqCsv,
  buildGeographyMcqTemplateRow,
  geographyMcqContractColumns,
  getGeographyBatchCode,
} from "@/lib/upsc/mcqContract";
import { auditGeographyMcqBatch, type GeographyMcqQualityAudit } from "@/lib/upsc/geographyMcqQuality";
import {
  readLocalBulkQuestionDrafts,
  readLocalMcqCommandQuestionsForBatch,
  readMcqCommandBatchState,
  upsertMcqCommandBatchState,
} from "@/lib/upsc/mcqDraftBank";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import type { GeographyMcqReadinessStatus } from "@/lib/upsc/useGeographyProgress";
import type { QuestionPayload } from "@/services/api/adminService";
import { cn } from "@/lib/utils";

const difficulties = ["EASY", "MEDIUM", "HARD", "PYQ_STYLE"];
const MCQ_COMMAND_SCORE = 70;

type GeographyMcqReadinessLabel = "Ready" | "Needs MCQs" | "Needs content" | "Quality review";

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function readinessTone(status: GeographyMcqReadinessLabel) {
  return status === "Ready"
    ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
    : status === "Quality review"
      ? "border-[#d97b18] bg-[#fff4df] text-[#6f4a12]"
    : "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
}

function getQuestionIssueList(question: QuestionPayload) {
  const issues: string[] = [];
  const options = question.options_en && typeof question.options_en === "object" ? question.options_en as Record<string, unknown> : {};
  const correctOption = String(question.correct_option ?? "").toUpperCase();

  if (!String(question.text_en ?? "").trim() || String(question.text_en ?? "").trim().length < 30) {
    issues.push("stem");
  }

  for (const option of ["A", "B", "C", "D"]) {
    if (!String(options[option] ?? "").trim()) issues.push(`option ${option}`);
  }

  if (!["A", "B", "C", "D"].includes(correctOption)) {
    issues.push("answer key");
  }

  if (!String(question.explanation_en ?? "").trim() || String(question.explanation_en ?? "").trim().length < 25) {
    issues.push("explanation");
  }

  return issues;
}

function commandStatusClass(status: string) {
  if (status === "Done") return "bg-[#e7f5ee] text-[#085041] ring-[#1d9e75]/25";
  if (status === "Active") return "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/30";
  if (status === "Locked") return "bg-[#f7f4ee] text-[#776f64] ring-[#dcd5c7]";
  return "bg-white text-[#49675e] ring-[#dcd5c7]";
}

function labSlugForSession(labTitle: string) {
  if (labTitle === "Monsoon Simulator") return "monsoon";
  if (labTitle === "India Interactive Map") return "india-map";
  if (labTitle === "Disaster Link") return "disaster-link";
  if (labTitle === "Environment Bridge") return "environment-bridge";
  if (labTitle === "MCQ Engine") return "mcq-engine";
  return "earth-layers";
}

function getOptionText(question: QuestionPayload, option: "A" | "B" | "C" | "D") {
  const options = question.options_en;
  if (!options || typeof options !== "object") return "";
  return String((options as Record<string, unknown>)[option] ?? "");
}

export function GeographyMcqReadinessRoom({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded: isProgressLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay, setActiveDay] = useState(resolveSession(initialDay).day);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [plannedCount, setPlannedCount] = useState(25);
  const [draftedCount, setDraftedCount] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [localBatchQuestions, setLocalBatchQuestions] = useState<QuestionPayload[]>([]);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const syncedMcqSnapshotRef = useRef("");

  const activeSession = resolveSession(activeDay);
  const activeBatchCode = getGeographyBatchCode(activeSession);
  const templateRow = useMemo(
    () => buildGeographyMcqTemplateRow(activeSession, difficulty),
    [activeSession, difficulty]
  );
  const csvPreview = useMemo(() => buildGeographyMcqCsv(activeSession, difficulty), [activeSession, difficulty]);
  const localDraftImportCount = useMemo(
    () => readLocalBulkQuestionDrafts().filter((draft) => draft.importMode === "UPSC_MCQ_COMMAND").length,
    [activeBatchCode, localBatchQuestions.length]
  );
  const freshQuestionIssues = useMemo(
    () =>
      localBatchQuestions.flatMap((question, index) =>
        getQuestionIssueList(question).map((issue) => `Q${index + 1}: ${issue}`)
      ),
    [localBatchQuestions]
  );
  const mcqQualityAudit = useMemo<GeographyMcqQualityAudit>(
    () => auditGeographyMcqBatch(activeSession, activeBatchCode, localBatchQuestions, plannedCount),
    [activeBatchCode, activeSession, localBatchQuestions, plannedCount]
  );
  const isFreshCountReady = draftedCount >= plannedCount && plannedCount > 0;
  const isFreshContentAttached = localBatchQuestions.length > 0;
  const isFreshContentCountReady = plannedCount > 0 && localBatchQuestions.length >= plannedCount;
  const isFreshContentQualityReady = isFreshContentAttached && freshQuestionIssues.length === 0 && mcqQualityAudit.passed;
  const isFreshContentReady = isFreshContentCountReady && isFreshContentQualityReady;
  const readinessStatus: GeographyMcqReadinessLabel = isFreshCountReady && isFreshContentReady
    ? "Ready"
    : isFreshCountReady && isFreshContentAttached
      ? "Quality review"
      : isFreshCountReady
        ? "Needs content"
        : "Needs MCQs";
  const completion = plannedCount > 0 ? Math.min(100, Math.round((draftedCount / plannedCount) * 100)) : 0;
  const remainingQuestions = Math.max(0, plannedCount - draftedCount);
  const labSlug = labSlugForSession(activeSession.lab);
  const activeProgress = getDayProgress(activeSession.day);
  const isTalkGateUnlocked = hasGeographyTalkClearance(activeProgress);
  const labProofCount = Math.min(
    activeProgress?.labProofCompletedIds?.length ?? (activeProgress?.labCompleted ? 5 : 0),
    5
  );
  const isLabGateUnlocked = Boolean(activeProgress?.labCompleted) && labProofCount >= 5;
  const isStudentMcqUnlocked = isTalkGateUnlocked && isLabGateUnlocked;
  const learningGateStatus = !isProgressLoaded
    ? "Checking learning gate"
    : isStudentMcqUnlocked
      ? "Learning gate passed"
      : "Learning gate locked";
  const learningGateDetail = !isProgressLoaded
    ? "Reading local Talk Room and Visual Lab progress for this day."
    : !isTalkGateUnlocked
      ? "Ask the student to complete the AI teacher oral check first. Old-bank MCQs are intentionally not used here."
      : !isLabGateUnlocked
        ? `Talk proof is saved. Complete all five Visual Lab proof stages before student MCQ practice opens. Current proof: ${labProofCount}/5.`
        : `Talk score ${activeProgress?.talkScore ?? 0}% reached ${activeProgress?.talkBand}, and Visual Lab proof is ${labProofCount}/5. Fresh MCQ practice can proceed when authored questions are ready.`;
  const learningGateHref = !isTalkGateUnlocked
    ? `/upsc/geography/talk?day=${activeSession.day}`
    : !isLabGateUnlocked
      ? `/upsc/geography/lab?mode=${activeProgress?.labMode ?? labSlug}&day=${activeSession.day}`
      : `/upsc/geography/talk?day=${activeSession.day}`;
  const learningGateAction = !isTalkGateUnlocked
    ? "Open AI teacher"
    : !isLabGateUnlocked
      ? "Open visual lab"
      : "Review proof";
  const hasLocalQuestionContent = localBatchQuestions.length > 0;
  const isFreshBatchReady = readinessStatus === "Ready";
  const isPracticeReady = isStudentMcqUnlocked && isFreshBatchReady;
  const canStartPractice = isPracticeReady && hasLocalQuestionContent;
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
      ? `/upsc/geography/revisit?day=${activeSession.day}`
      : `/upsc/geography/track?day=${activeSession.day}`;
  const mcqRecommendedLabel = mcqOutcome === "Revisit" ? "Open revisit" : "Review track";
  const mcqOutcomeTitle =
    mcqOutcome === "Command" ? "Command retained" : mcqOutcome === "Revisit" ? "Revisit queued" : "Finish all questions";
  const mcqOutcomeDetail =
    mcqOutcome === "Command"
      ? `Fresh practice score is ${visiblePracticePercent}%, above the ${MCQ_COMMAND_SCORE}% command gate. This day can move forward.`
      : mcqOutcome === "Revisit"
        ? `Fresh practice score is ${visiblePracticePercent}%, below the ${MCQ_COMMAND_SCORE}% command gate. Repair the concept before the next topic.`
        : `Complete all ${visiblePracticeTotal || localBatchQuestions.length || plannedCount} fresh questions before this day is cleared.`;
  const practiceGateStatus = isPracticeReady ? "Student practice ready" : "Student practice blocked";
  const practiceGateDetail = !isStudentMcqUnlocked
    ? "Complete the Talk and Visual Lab gates before fresh MCQs become student-facing."
    : !isFreshBatchReady
      ? !isFreshCountReady
        ? `Learning proof is complete. Draft ${remainingQuestions} more fresh question${remainingQuestions === 1 ? "" : "s"} to reach the planned batch.`
        : !isFreshContentAttached
          ? "Fresh count is marked ready, but the local CSV content is not attached yet."
          : !isFreshContentCountReady
            ? `Only ${localBatchQuestions.length}/${plannedCount} local fresh questions are attached to this batch.`
            : `Fresh batch needs authoring cleanup: ${[
                ...freshQuestionIssues,
                ...mcqQualityAudit.warnings,
              ]
                .slice(0, 4)
                .join(", ")}.`
      : hasLocalQuestionContent
        ? `${localBatchQuestions.length} local fresh question${localBatchQuestions.length === 1 ? "" : "s"} found for this batch. Student practice can launch from this clean bank.`
        : "Batch count is ready. Upload the fresh CSV locally to preview actual question stems before class practice.";
  const mcqReadinessStatus: GeographyMcqReadinessStatus = !isStudentMcqUnlocked
    ? "learning-blocked"
    : !isFreshCountReady
      ? "batch-pending"
      : !isFreshContentAttached || !isFreshContentCountReady
        ? "content-pending"
        : !isFreshContentQualityReady
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
  const bulkUploadHref = `/admin/questions/bulk?mode=UPSC_MCQ_COMMAND&subject=geography&day=${activeSession.day}&batch=${activeBatchCode}&return=${encodeURIComponent(`/upsc/geography/mcq-readiness?day=${activeSession.day}`)}`;
  const mcqNextRoute = !isStudentMcqUnlocked
    ? learningGateHref
    : !isFreshCountReady || !isFreshContentAttached || !isFreshContentCountReady || !isFreshContentQualityReady
      ? bulkUploadHref
      : isPracticeComplete
        ? mcqRecommendedHref
        : `/upsc/geography/mcq-readiness?day=${activeSession.day}`;
  const mcqNextActionLabel = !isStudentMcqUnlocked
    ? learningGateAction
    : !isFreshCountReady
      ? "Draft fresh batch"
      : !isFreshContentAttached || !isFreshContentCountReady
        ? "Upload fresh CSV"
        : !isFreshContentQualityReady
          ? "Fix MCQ quality"
          : isPracticeComplete
            ? mcqRecommendedLabel
            : "Start local practice";
  const mcqEvidenceAnchor = `${activeBatchCode} / ${activeSession.title} / ${localBatchQuestions.length}/${plannedCount} fresh`;
  const mcqPreflightSummary = [
    `Learning: ${isStudentMcqUnlocked ? "ready" : "locked"}`,
    `Batch: ${draftedCount}/${plannedCount}`,
    `Content: ${localBatchQuestions.length}/${plannedCount}`,
    `Quality: ${isFreshContentQualityReady ? "clear" : `${mcqQualityAudit.score}% / ${mcqQualityAudit.warnings.join(", ") || "review"}`}`,
    `Next: ${mcqNextActionLabel}`,
  ].join(". ");
  const mcqBatchGateLabel = isFreshBatchReady
    ? "Fresh batch ready"
    : !isFreshCountReady
      ? "Fresh batch pending"
      : !isFreshContentAttached || !isFreshContentCountReady
        ? "Fresh content pending"
        : "Quality review";
  const mcqCommandItems = [
    {
      label: "Learning proof",
      status: isStudentMcqUnlocked ? "Done" : "Locked",
      detail: isStudentMcqUnlocked ? "Talk and Visual Lab passed" : learningGateAction,
    },
    {
      label: "Fresh count",
      status: isFreshCountReady ? "Done" : "Active",
      detail: `${draftedCount}/${plannedCount} drafted`,
    },
    {
      label: "CSV content",
      status: isFreshContentCountReady ? "Done" : isFreshContentAttached ? "Active" : "Pending",
      detail: `${localBatchQuestions.length}/${plannedCount} attached`,
    },
    {
      label: "Quality",
      status: isFreshContentQualityReady && isFreshContentCountReady ? "Done" : isFreshContentAttached ? "Active" : "Pending",
      detail: isFreshContentQualityReady
        ? `${mcqQualityAudit.score}% quality gate`
        : [...freshQuestionIssues, ...mcqQualityAudit.warnings].slice(0, 3).join(", "),
    },
    {
      label: "Route",
      status: isPracticeComplete ? "Done" : isPracticeReady ? "Active" : "Locked",
      detail: mcqNextActionLabel,
    },
  ];

  useEffect(() => {
    const batchState = readMcqCommandBatchState(activeBatchCode);
    setPlannedCount(batchState?.planned ?? 25);
    setDraftedCount(batchState?.drafted ?? 0);
    setDifficulty(batchState?.difficulty ?? "MEDIUM");
    setLocalBatchQuestions(readLocalMcqCommandQuestionsForBatch(activeBatchCode));
    setPracticeStarted(false);
    setCurrentPracticeIndex(0);
    setPracticeAnswers({});
  }, [activeBatchCode]);

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
      qualityScore: mcqQualityAudit.score,
      qualityWarnings: mcqQualityAudit.warnings,
      qualityPassed: mcqQualityAudit.passed,
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
      mcqQualityScore: mcqQualityAudit.score,
      mcqQualityWarnings: mcqQualityAudit.warnings,
      mcqQualityPassed: mcqQualityAudit.passed,
      mcqQualityGateLabel: "Geography MCQ quality gate",
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
    saveDayProgress,
  ]);

  const saveReadinessState = (patch: { planned?: number; drafted?: number; difficulty?: string }) => {
    const nextPlanned = patch.planned ?? plannedCount;
    const nextDrafted = patch.drafted ?? draftedCount;
    const nextDifficulty = patch.difficulty ?? difficulty;

    setPlannedCount(nextPlanned);
    setDraftedCount(nextDrafted);
    setDifficulty(nextDifficulty);
    setLocalBatchQuestions(readLocalMcqCommandQuestionsForBatch(activeBatchCode));
    const nextQualityAudit = auditGeographyMcqBatch(
      activeSession,
      activeBatchCode,
      readLocalMcqCommandQuestionsForBatch(activeBatchCode),
      nextPlanned
    );
    upsertMcqCommandBatchState(activeBatchCode, {
      planned: nextPlanned,
      drafted: nextDrafted,
      difficulty: nextDifficulty,
      status: nextDrafted >= nextPlanned && nextQualityAudit.passed ? "READY" : "DRAFT",
    });
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), geographySessions.length);
    setActiveDay(boundedDay);
    setDownloaded(false);
    router.replace(`/upsc/geography/mcq-readiness?day=${boundedDay}`, { scroll: false });
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvPreview], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeBatchCode}-mcq-template.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const startLocalPractice = () => {
    if (!canStartPractice) return;
    setPracticeStarted(true);
    setCurrentPracticeIndex(0);
  };

  const selectPracticeAnswer = (option: string) => {
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
        ? `/upsc/geography/revisit?day=${activeSession.day}`
        : nextOutcome === "Command"
          ? `/upsc/geography/track?day=${activeSession.day}`
          : `/upsc/geography/mcq-readiness?day=${activeSession.day}`;
    const nextReviewSummary = !nextIsComplete
      ? `${nextAnsweredCount}/${nextTotal} fresh questions completed for ${activeBatchCode}. Finish the batch before routing.`
      : nextOutcome === "Command"
        ? `${nextCorrectCount}/${nextTotal} correct (${nextScorePercent}%). Command gate cleared for ${activeBatchCode}.`
        : `${nextCorrectCount}/${nextTotal} correct (${nextScorePercent}%). Revisit queued for ${activeBatchCode}.`;

    setPracticeAnswers(nextAnswers);
    saveDayProgress(activeSession.day, {
      mcqAttempted: nextAnsweredCount > 0,
      mcqCompleted: nextIsComplete,
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
      revisitQueued: nextIsComplete && nextOutcome === "Revisit" ? true : activeProgress?.revisitQueued,
      confidence: nextIsComplete && nextOutcome === "Revisit" ? "Shaky" : nextIsComplete && nextOutcome === "Command" ? "Command" : activeProgress?.confidence,
      activePromptLabel: "MCQ Practice",
    });
  };

  const resetLocalPractice = () => {
    setPracticeStarted(false);
    setCurrentPracticeIndex(0);
    setPracticeAnswers({});
    saveDayProgress(activeSession.day, {
      mcqAttempted: undefined,
      mcqCompleted: undefined,
      mcqAnsweredCount: undefined,
      mcqCorrectCount: undefined,
      mcqTotal: undefined,
      mcqScorePercent: undefined,
      mcqLastBatchCode: undefined,
      mcqOutcome: undefined,
      mcqRecommendedRoute: undefined,
      mcqReviewSummary: undefined,
      mcqReadinessStatus: isPracticeReady ? "practice-ready" : mcqReadinessStatus,
      mcqEvidenceAnchor,
      mcqNextRoute: isPracticeReady ? `/upsc/geography/mcq-readiness?day=${activeSession.day}` : mcqNextRoute,
      mcqNextActionLabel: isPracticeReady ? "Start local practice" : mcqNextActionLabel,
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

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> Geography command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Fresh MCQ Mapping</Badge>
              <span className="text-sm font-bold text-[#776f64]">No old-bank import</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">
              {activeBatchCode}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">
              Fresh Geography MCQs should attach to this day, chapter, topic, and batch code so Test, Track, and Revisit stay connected.
            </p>

            <div
              data-testid="geography-mcq-day-test-command"
              className="mt-5 rounded-lg border border-[#dcd5c7] bg-white/75 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                    Daily test command
                  </p>
                  <p className="mt-2 break-words text-sm font-bold leading-6 text-[#34453b]">{activeSession.test}</p>
                  <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#746f66]">
                    Use this command to write the stem, answer explanation, distractors, and map or trap tag for this exact day.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Day", `${activeSession.day}/30`],
                ["Chapter", activeSession.chapter],
                ["Status", readinessStatus],
              ].map(([label, value]) => (
                <div key={label} className={cn("min-w-0 rounded-md border p-4", label === "Status" ? readinessTone(readinessStatus) : "border-[#dcd5c7] bg-[#f7f4ee]")}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
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

            <div
              data-testid="mcq-talk-gate"
              className={cn(
                "mt-5 rounded-lg border p-4",
                isStudentMcqUnlocked
                  ? "border-[#1d9e75]/45 bg-[#e7f5ee]"
                  : "border-[#ef9f27]/45 bg-[#fff4df]"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white",
                      isStudentMcqUnlocked ? "bg-[#1d9e75]" : "bg-[#9a6a16]"
                    )}
                  >
                    {isStudentMcqUnlocked ? <UnlockKeyhole className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Learning gate</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">{learningGateStatus}</h2>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{learningGateDetail}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <span
                        className={cn(
                          "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                          isTalkGateUnlocked ? "border-[#1d9e75]/40 bg-white/70 text-[#085041]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                        )}
                      >
                        <BrainCircuit className="h-4 w-4" /> {isTalkGateUnlocked ? "Talk passed" : "Talk pending"}
                      </span>
                      <span
                        data-testid="mcq-lab-gate"
                        className={cn(
                          "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                          isLabGateUnlocked ? "border-[#1d9e75]/40 bg-white/70 text-[#085041]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                        )}
                      >
                        <Layers3 className="h-4 w-4" /> {isLabGateUnlocked ? "Lab proof 5/5" : `Lab proof ${labProofCount}/5`}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  data-testid="mcq-talk-route"
                  href={learningGateHref}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black text-white transition",
                    isStudentMcqUnlocked ? "bg-[#1a3a2a] hover:bg-[#10291d]" : "bg-[#9a6a16] hover:bg-[#7f5410]"
                  )}
                >
                  {learningGateAction}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div data-testid="mcq-readiness-command-board" className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">MCQ readiness command board</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">Fresh-batch preflight is locally saved</h2>
                  <p data-testid="mcq-evidence-anchor" className="mt-2 break-words text-sm font-bold leading-6 text-[#657066]">
                    {mcqEvidenceAnchor}
                  </p>
                </div>
                <span
                  data-testid="mcq-preflight-status"
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-md px-3 text-xs font-black uppercase tracking-[0.12em] ring-1",
                    mcqReadinessStatus === "practice-ready" || mcqReadinessStatus === "command"
                      ? "bg-[#e7f5ee] text-[#085041] ring-[#1d9e75]/25"
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
                  <div key={item.label} className="min-w-0 rounded-md border border-[#ece4d6] bg-[#fdfaf3] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                      <span className={cn("rounded-md px-2 py-1 text-[10px] font-black uppercase ring-1", commandStatusClass(item.status))}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 break-words text-xs font-bold leading-5 text-[#49675e]">{item.detail || "Pending"}</p>
                  </div>
                ))}
              </div>

              {(freshQuestionIssues.length > 0 || (isFreshContentAttached && !mcqQualityAudit.passed)) && (
                <div data-testid="mcq-quality-review" className="mt-4 rounded-md border border-[#ef9f27]/45 bg-[#fff4df] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">Authoring cleanup</p>
                  <p className="mt-2 break-words text-sm font-bold leading-6 text-[#6f4a12]">
                    {[...freshQuestionIssues, ...mcqQualityAudit.warnings].slice(0, 6).join(", ")}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-md bg-white/70 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a6a16]">Quality score</p>
                      <p data-testid="geography-mcq-quality-review-score" className="mt-1 text-2xl font-black text-[#6f4a12]">
                        {mcqQualityAudit.score}%
                      </p>
                    </div>
                    <div className="rounded-md bg-white/70 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a6a16]">Checks passed</p>
                      <p className="mt-1 text-2xl font-black text-[#6f4a12]">
                        {mcqQualityAudit.readyCount}/{mcqQualityAudit.items.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isFreshContentAttached && (
                <div data-testid="geography-mcq-quality-gate" className="mt-4 rounded-md border border-[#cfe5dc] bg-white/75 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Geography MCQ quality gate</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-[#49675e]">
                        Count alone is not enough. Rows need map/atlas anchor, mechanism explanation, syllabus link, and UPSC trap language.
                      </p>
                    </div>
                    <span
                      data-testid="geography-mcq-quality-score"
                      className={cn(
                        "rounded-md px-3 py-2 text-xs font-black ring-1",
                        mcqQualityAudit.passed
                          ? "bg-[#e7f5ee] text-[#085041] ring-[#1d9e75]/25"
                          : "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/30"
                      )}
                    >
                      {mcqQualityAudit.passed ? `Passed ${mcqQualityAudit.score}%` : `${mcqQualityAudit.score}%`}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {mcqQualityAudit.items.map((check) => (
                      <div
                        key={check.id}
                        data-testid={`geography-mcq-quality-${check.id}`}
                        className={cn(
                          "rounded-md border bg-white p-3",
                          check.passed ? "border-[#1d9e75]/35" : "border-[#ef9f27]/45"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{check.label}</p>
                          <span
                            className={cn(
                              "rounded-md px-2 py-1 text-[10px] font-black uppercase",
                              check.passed ? "bg-[#e7f5ee] text-[#085041]" : "bg-[#fff4df] text-[#6f4a12]"
                            )}
                          >
                            {check.passed ? "Done" : "Fix"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-bold leading-5 text-[#49675e]">{check.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#f3fbf7] p-3">
                <p data-testid="mcq-next-decision" className="break-words text-sm font-black text-[#085041]">
                  Next: {mcqNextActionLabel}
                </p>
                <Link
                  href={mcqNextRoute}
                  className={cn(
                    "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition",
                    isPracticeReady || isPracticeComplete
                      ? "bg-[#1a3a2a] text-white hover:bg-[#10291d]"
                      : "border border-[#cfc6b6] bg-white text-[#1a3a2a] hover:bg-[#f2eadc]"
                  )}
                >
                  {mcqNextActionLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex min-h-8 items-center rounded-md bg-[#f7f4ee] px-3 text-xs font-black text-[#34453b]">
                  Local UPSC imports {localDraftImportCount}
                </span>
                <span className="inline-flex min-h-8 items-center rounded-md bg-[#f7f4ee] px-3 text-xs font-black text-[#34453b]">
                  Old-bank ignored
                </span>
              </div>
            </div>

            <div
              data-testid="mcq-practice-launcher"
              className={cn(
                "mt-5 rounded-lg border p-4",
                isPracticeReady
                  ? "border-[#1d9e75]/45 bg-[#e7f5ee]"
                  : "border-[#dcd5c7] bg-[#fdfaf3]"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white",
                      isPracticeReady ? "bg-[#1d9e75]" : "bg-[#1a3a2a]"
                    )}
                  >
                    {isPracticeReady ? <PlayCircle className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Student practice launcher</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">{practiceGateStatus}</h2>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{practiceGateDetail}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <span
                        className={cn(
                          "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                          isStudentMcqUnlocked ? "border-[#1d9e75]/40 bg-white/70 text-[#085041]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                        )}
                      >
                        <UnlockKeyhole className="h-4 w-4" /> {isStudentMcqUnlocked ? "Learning proof ready" : "Learning proof pending"}
                      </span>
                      <span
                        data-testid="mcq-batch-gate"
                        className={cn(
                          "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black",
                          isFreshBatchReady ? "border-[#1d9e75]/40 bg-white/70 text-[#085041]" : "border-[#ef9f27]/40 bg-white/70 text-[#6f4a12]"
                        )}
                      >
                        <ClipboardCheck className="h-4 w-4" /> {mcqBatchGateLabel}
                      </span>
                    </div>
                  </div>
                </div>
                {hasLocalQuestionContent ? (
                  <button
                    type="button"
                    data-testid="mcq-start-local-practice"
                    onClick={startLocalPractice}
                    disabled={!canStartPractice}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Start local practice
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href={bulkUploadHref}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                  >
                    Upload fresh CSV
                    <UploadCloud className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {hasLocalQuestionContent && (
                <div data-testid="mcq-local-question-preview" className="mt-4 grid gap-3">
                  {localBatchQuestions.slice(0, 3).map((question, index) => (
                    <div key={`${question.text_en}-${index}`} className="rounded-md border border-[#cfe5dc] bg-white/75 p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                          Fresh question {index + 1}
                        </p>
                        <span className="rounded-md bg-[#f7f4ee] px-2 py-1 text-[11px] font-black text-[#1a3a2a]">
                          Answer {question.correct_option}
                        </span>
                      </div>
                      <p className="break-words text-sm font-black leading-6 text-[#13251d]">{question.text_en}</p>
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
                <div data-testid="mcq-local-practice-runner" className="mt-4 rounded-lg border border-[#1d9e75]/35 bg-white/85 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                        Local practice
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#13251d]">
                        Question {currentPracticeIndex + 1} of {localBatchQuestions.length}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        data-testid="mcq-local-practice-score"
                        className="inline-flex min-h-9 items-center rounded-md bg-[#e7f5ee] px-3 text-xs font-black text-[#085041]"
                      >
                        Score {correctPracticeCount}/{localBatchQuestions.length} ({practicePercent}%)
                      </span>
                      <span className="inline-flex min-h-9 items-center rounded-md bg-[#f7f4ee] px-3 text-xs font-black text-[#34453b]">
                        Answered {answeredPracticeCount}/{localBatchQuestions.length}
                      </span>
                    </div>
                  </div>

                  <p className="break-words rounded-md bg-[#f7f4ee] p-3 text-base font-black leading-7 text-[#13251d]">
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
                          className={cn(
                            "min-h-14 rounded-md border px-3 py-2 text-left text-sm font-bold leading-6 transition",
                            showResult && isCorrect && "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
                            showResult && isSelected && !isCorrect && "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
                            !showResult && "border-[#dcd5c7] bg-white text-[#34453b] hover:border-[#1d9e75]"
                          )}
                        >
                          <span className="font-black">{option}.</span> {getOptionText(currentPracticeQuestion, option)}
                        </button>
                      );
                    })}
                  </div>

                  {currentPracticeAnswer && (
                    <div data-testid="mcq-practice-feedback" className="mt-4 rounded-md border border-[#cfe5dc] bg-[#f3fbf7] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#085041]">
                          {currentPracticeAnswer === currentPracticeQuestion.correct_option ? "Correct answer" : "Review this trap"}
                        </p>
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-[#1a3a2a]">
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

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPracticeIndex((current) => Math.max(0, current - 1))}
                      disabled={currentPracticeIndex === 0}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPracticeIndex((current) => Math.min(localBatchQuestions.length - 1, current + 1))}
                      disabled={currentPracticeIndex === localBatchQuestions.length - 1}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next question <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={resetLocalPractice}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                    >
                      <RotateCcw className="h-4 w-4" /> Reset
                    </button>
                  </div>
                </div>
              )}

              {visiblePracticeTotal > 0 && (practiceStarted || Boolean(hasPersistedMcqForBatch && activeProgress?.mcqAttempted)) && (
                <div
                  data-testid="mcq-practice-outcome-gate"
                  className={cn(
                    "mt-4 rounded-lg border p-4",
                    mcqOutcome === "Command" && "border-[#1d9e75]/45 bg-[#e7f5ee]",
                    mcqOutcome === "Revisit" && "border-[#ef9f27]/55 bg-[#fff4df]",
                    mcqOutcome === "Pending" && "border-[#dcd5c7] bg-[#fdfaf3]"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Practice outcome</p>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">{mcqOutcomeTitle}</h3>
                      <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{mcqOutcomeDetail}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex min-h-9 items-center rounded-md bg-white/75 px-3 text-xs font-black text-[#085041]">
                          Score {visibleCorrectCount}/{visiblePracticeTotal} ({visiblePracticePercent}%)
                        </span>
                        <span className="inline-flex min-h-9 items-center rounded-md bg-white/75 px-3 text-xs font-black text-[#34453b]">
                          Answered {visibleAnsweredCount}/{visiblePracticeTotal}
                        </span>
                        <span className="inline-flex min-h-9 items-center rounded-md bg-white/75 px-3 text-xs font-black text-[#34453b]">
                          Gate {MCQ_COMMAND_SCORE}%
                        </span>
                      </div>
                    </div>
                    {mcqOutcome === "Pending" ? (
                      <span className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#746f66]">
                        Route locked
                      </span>
                    ) : (
                      <Link
                        data-testid="mcq-practice-outcome-route"
                        href={mcqRecommendedHref}
                        className={cn(
                          "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black text-white transition",
                          mcqOutcome === "Revisit" ? "bg-[#9a6a16] hover:bg-[#7f5410]" : "bg-[#1a3a2a] hover:bg-[#10291d]"
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
          </div>

          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Readiness control</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Plan the fresh MCQ batch</h2>
              </div>
              <UploadCloud className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                  Planned questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={plannedCount}
                  onChange={(event) => saveReadinessState({ planned: Math.max(1, Number(event.target.value) || 1) })}
                  className="mt-3 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#13251d] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                />
              </div>

              <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                  Drafted questions
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draftedCount}
                  onChange={(event) => saveReadinessState({ drafted: Math.max(0, Number(event.target.value) || 0) })}
                  className="mt-3 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#13251d] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-[#085041]">Fresh batch completion</p>
                <p className="text-sm font-black text-[#085041]">{completion}%</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f2eadc]">
                <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${completion}%` }} />
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
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">30-day mapping</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Select the target class day</h2>
              </div>
              <MapPinned className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {geographySessions.map((session) => {
                const isActive = activeSession.day === session.day;
                return (
                  <button
                    key={session.day}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectDay(session.day)}
                    className={cn(
                      "min-w-0 min-h-24 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block break-words text-xs font-black uppercase tracking-[0.16em]">
                      {getGeographyBatchCode(session)}
                    </span>
                    <span className="mt-2 block break-words text-sm font-bold leading-5">{session.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid min-w-0 gap-5">
            <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">CSV template</p>
                  <p className="text-xs font-semibold text-[#746f66]">Generated from selected day mapping</p>
                </div>
              </div>

              <pre
                data-testid="mcq-csv-template-preview"
                className="max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-all rounded-md bg-[#13251d] p-4 text-xs font-semibold leading-5 text-[#e7f5ee]"
              >
                {csvPreview}
              </pre>

              <button
                type="button"
                data-testid="mcq-download-template"
                onClick={downloadTemplate}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
              >
                <Download className="h-4 w-4" /> Download CSV template
              </button>

              {downloaded && (
                <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <p className="text-sm font-bold leading-6 text-[#085041]">
                    Template generated for {activeBatchCode}.
                  </p>
                </div>
              )}
            </div>

            <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Upload action</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">Attach MCQ to learning</h2>
              <Link
                data-testid="mcq-bulk-upload-route"
                href={bulkUploadHref}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
              >
                <UploadCloud className="h-4 w-4" /> Open bulk upload
              </Link>
            </div>
            <GeographyLoopActions activeDay={activeSession.day} labSlug={labSlug} current="mcq" onSelectDay={selectDay} />
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Contract fields</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Fresh MCQ authoring rules</h2>
            </div>
            <ShieldCheck className="h-6 w-6 text-[#085041]" />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {geographyMcqContractColumns.map((column) => (
              <div key={column.key} className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#13251d]">{column.label}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md text-[10px] font-black",
                      column.required
                        ? "border-[#1d9e75]/40 text-[#085041]"
                        : "border-[#cfc6b6] text-[#746f66]"
                    )}
                  >
                    {column.required ? "Required" : "Optional"}
                  </Badge>
                </div>
                <p className="text-xs font-semibold leading-5 text-[#657066]">{column.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
            <p className="text-sm font-black text-[#085041]">Selected row summary</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Subject", templateRow.subject],
                ["Batch", templateRow.batch_code],
                ["Difficulty", templateRow.difficulty],
                ["Status", templateRow.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-white/75 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 text-sm font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
