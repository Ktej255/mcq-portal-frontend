"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  Lock,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyRoomCompass } from "@/components/upsc/GeographyRoomCompass";
import { GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT } from "@/lib/upsc/geographyLaunchReadiness";
import { hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { GEOGRAPHY_RECALL_TARGET, getGuidedStudyEntryRoute } from "@/lib/upsc/guidedStudy";
import { getGeographyBatchCode } from "@/lib/upsc/mcqContract";
import { readLocalMcqCommandQuestionsForBatch, readMcqCommandBatchState } from "@/lib/upsc/mcqDraftBank";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import { readStudentProfile, type StudentLevel } from "@/lib/upsc/studentProfile";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import type { QuestionPayload } from "@/services/api/adminService";
import { cn } from "@/lib/utils";

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
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

function getMcqLevelCopy(learnerLevel: StudentLevel) {
  if (learnerLevel === "advanced") {
    return {
      badge: "Advanced practice",
      title: "Prove the gap is closed",
      heroDetail:
        "Answer a short fresh set. A strong score opens the next topic; a weak score opens a short repair.",
      readyDetail:
        "Answer one question at a time. The app will choose the next step.",
      pendingDetail:
        "Your diagnosis is saved. Practice will open when the next set is ready.",
    };
  }

  if (learnerLevel === "intermediate") {
    return {
      badge: "Intermediate practice",
      title: "Check the repaired gap",
      heroDetail:
        "Answer a short fresh set. A strong score opens the next topic; a weak score opens a short repair.",
      readyDetail:
        "Answer one question at a time. The app will choose the next step.",
      pendingDetail:
        "Your diagnosis is saved. Practice will open when the next set is ready.",
    };
  }

  return {
    badge: "Beginner practice",
    title: "Practice after 95% recall",
    heroDetail:
      "You cleared the discussion. Now answer a short set; the app will send you forward or into a short repair.",
    readyDetail:
      "Answer one question at a time. The app will choose the next step.",
    pendingDetail:
      "Your discussion is saved. Practice will open when the next set is ready.",
  };
}

export function GeographyMcqReadinessRoom({ initialDay }: { initialDay?: number }) {
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay] = useState(resolveSession(initialDay).day);
  const activeSession = resolveSession(activeDay);
  const progress = getDayProgress(activeSession.day);
  const batchCode = getGeographyBatchCode(activeSession);
  const [freshQuestions, setFreshQuestions] = useState<QuestionPayload[]>([]);
  const [batchStatus, setBatchStatus] = useState<"DRAFT" | "READY" | "EMPTY">("EMPTY");
  const [plannedQuestionCount, setPlannedQuestionCount] = useState(
    activeSession.day === 1 ? GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT : 1
  );
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const learnerLevel = readStudentProfile()?.level ?? "beginner";
  const mcqLevelCopy = getMcqLevelCopy(learnerLevel);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setTimeout(() => {
      const state = readMcqCommandBatchState(batchCode);
      const questions = readLocalMcqCommandQuestionsForBatch(batchCode);
      const requiredQuestionCount =
        activeSession.day === 1
          ? Math.max(
              state?.planned ?? GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT,
              GEOGRAPHY_DAY1_MINIMUM_FRESH_MCQ_COUNT
            )
          : Math.max(state?.planned ?? questions.length, 1);
      const savedProgress = getDayProgress(activeSession.day);
      const canRestorePractice = savedProgress?.mcqLastBatchCode === batchCode && !savedProgress?.mcqCompleted;
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
      setFreshQuestions(questions);
      setBatchStatus(state?.status ?? (questions.length > 0 ? "DRAFT" : "EMPTY"));
      setPlannedQuestionCount(requiredQuestionCount);
      setPracticeStarted(canRestorePractice && restoredAnsweredCount > 0);
      setCurrentPracticeIndex(Math.max(0, Math.min(questions.length - 1, restoredIndex)));
      setPracticeAnswers(restoredAnswers);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeSession.day, batchCode, getDayProgress, isLoaded]);

  const talkCleared = hasGeographyTalkClearance(progress);
  const labProofCount = Math.min(progress?.labProofCompletedIds?.length ?? (progress?.labCompleted ? 5 : 0), 5);
  const labCleared = Boolean(progress?.labCompleted) && labProofCount >= 5;
  const gatesCleared = talkCleared;
  const hasFreshQuestions = freshQuestions.length >= plannedQuestionCount;
  const isReady = gatesCleared && hasFreshQuestions && batchStatus === "READY";
  const currentPracticeQuestion = freshQuestions[currentPracticeIndex];
  const currentPracticeAnswer = practiceAnswers[currentPracticeIndex];
  const answeredCount = freshQuestions.filter((_, index) => Boolean(practiceAnswers[index])).length;
  const correctCount = freshQuestions.filter((question, index) => practiceAnswers[index] === question.correct_option).length;
  const scorePercent = freshQuestions.length > 0 ? Math.round((correctCount / freshQuestions.length) * 100) : 0;
  const isPracticeComplete = freshQuestions.length > 0 && answeredCount >= freshQuestions.length;
  const practiceOutcome = !isPracticeComplete ? "Pending" : scorePercent >= 70 ? "Command" : "Revisit";
  const hasSavedPracticeResult = Boolean(
    progress?.mcqCompleted &&
      progress.mcqLastBatchCode === batchCode &&
      progress.mcqOutcome &&
      progress.mcqOutcome !== "Pending"
  );
  const hasPracticeResult = isPracticeComplete || hasSavedPracticeResult;
  const resolvedCorrectCount = isPracticeComplete ? correctCount : (progress?.mcqCorrectCount ?? 0);
  const resolvedTotal = isPracticeComplete ? freshQuestions.length : (progress?.mcqTotal ?? freshQuestions.length);
  const resolvedScorePercent = isPracticeComplete ? scorePercent : (progress?.mcqScorePercent ?? 0);
  const resolvedOutcome = isPracticeComplete ? practiceOutcome : (progress?.mcqOutcome ?? "Pending");
  const revisitHref = `/upsc/geography/revisit?day=${activeSession.day}`;
  const nextDayHref =
    activeSession.day < geographySessions.length
      ? getGuidedStudyEntryRoute(learnerLevel, activeSession.day + 1)
      : "/upsc/geography/track";
  const commandActionTitle = activeSession.day < geographySessions.length ? "Continue to next topic" : "Open progress review";
  const nextActionTitle = hasPracticeResult
    ? resolvedOutcome === "Command"
      ? commandActionTitle
      : "Repair this topic"
    : !isReady
      ? "Practice is being prepared"
      : practiceStarted
        ? "Answer this question"
        : "Start practice";
  const nextActionDetail = hasPracticeResult
    ? resolvedOutcome === "Command"
      ? `${resolvedCorrectCount}/${resolvedTotal} correct (${resolvedScorePercent}%). Your next topic is ready.`
      : `${resolvedCorrectCount}/${resolvedTotal} correct (${resolvedScorePercent}%). Complete a short revision before trying again.`
    : !isReady
      ? `${mcqLevelCopy.pendingDetail} Fresh set status: ${freshQuestions.length}/${plannedQuestionCount} reviewed.`
      : mcqLevelCopy.readyDetail;
  const nextActionHref = hasPracticeResult
    ? resolvedOutcome === "Command"
      ? nextDayHref
      : revisitHref
    : `/upsc/geography/mcq-readiness?day=${activeSession.day}`;
  const visibleTalkScore =
    typeof progress?.talkScore === "number" ? progress.talkScore : GEOGRAPHY_RECALL_TARGET;
  const mcqFlowSteps = [
    {
      label: `Talk ${GEOGRAPHY_RECALL_TARGET}%`,
      detail: `Cleared at ${Math.max(visibleTalkScore, GEOGRAPHY_RECALL_TARGET)}% recall`,
    },
    {
      label: "Fresh MCQ",
      detail: isReady || hasPracticeResult ? "One question at a time" : `${freshQuestions.length}/${plannedQuestionCount} reviewed`,
    },
    {
      label: resolvedOutcome === "Revisit" ? "Repair" : "Next topic",
      detail:
        hasPracticeResult && resolvedOutcome === "Command"
          ? activeSession.day < geographySessions.length
            ? `Day ${activeSession.day + 1} opens automatically`
            : "Progress review opens"
          : hasPracticeResult
            ? "Short revision opens"
            : "Result decides route",
    },
  ];
  const freshSetState = isReady || hasPracticeResult ? "ready" : practiceStarted ? "active" : "preparing";
  const scoreSignalText = hasPracticeResult
    ? `${resolvedCorrectCount}/${resolvedTotal} correct`
    : practiceStarted
      ? `${answeredCount}/${freshQuestions.length} answered`
      : "Not started";
  const nextRouteSignalText = hasPracticeResult
    ? resolvedOutcome === "Command"
      ? commandActionTitle
      : "Open short revision"
    : isReady
      ? "Start practice"
      : "Wait for reviewed set";

  const persistPracticeAnswer = (option: string) => {
    const nextAnswers = {
      ...practiceAnswers,
      [currentPracticeIndex]: option,
    };
    const total = freshQuestions.length;
    const nextAnsweredCount = freshQuestions.filter((_, index) => Boolean(nextAnswers[index])).length;
    const nextCorrectCount = freshQuestions.filter((question, index) => nextAnswers[index] === question.correct_option).length;
    const nextScorePercent = total > 0 ? Math.round((nextCorrectCount / total) * 100) : 0;
    const nextComplete = total > 0 && nextAnsweredCount >= total;
    const nextOutcome = !nextComplete ? "Pending" : nextScorePercent >= 70 ? "Command" : "Revisit";
    const nextRoute =
      nextOutcome === "Revisit"
        ? revisitHref
        : nextOutcome === "Command"
          ? nextDayHref
          : `/upsc/geography/mcq-readiness?day=${activeSession.day}`;

    setPracticeAnswers(nextAnswers);
    saveDayProgress(activeSession.day, {
      mcqAttempted: total > 0,
      mcqCompleted: nextComplete,
      mcqAnswerMap: nextAnswers,
      mcqCurrentQuestionIndex: currentPracticeIndex,
      mcqAnsweredCount: nextAnsweredCount,
      mcqCorrectCount: nextCorrectCount,
      mcqTotal: total,
      mcqScorePercent: nextScorePercent,
      mcqLastBatchCode: batchCode,
      mcqOutcome: nextOutcome,
      mcqRecommendedRoute: nextRoute,
      mcqReviewSummary: nextComplete
        ? `${nextCorrectCount}/${total} correct (${nextScorePercent}%) for ${batchCode}.`
        : `${nextAnsweredCount}/${total} fresh questions answered for ${batchCode}.`,
      mcqReadinessStatus: !nextComplete ? "practice-active" : nextOutcome === "Command" ? "command" : "revisit",
      mcqEvidenceAnchor: `${activeSession.title} / ${batchCode} / ${nextCorrectCount}/${total} correct`,
      mcqNextRoute: nextRoute,
      mcqNextActionLabel:
        nextOutcome === "Revisit"
          ? "Open short revision"
          : nextOutcome === "Command"
            ? activeSession.day < geographySessions.length
              ? "Continue to next topic"
              : "Open progress review"
            : "Finish practice",
      mcqFreshQuestionCount: freshQuestions.length,
      mcqPlannedCount: plannedQuestionCount,
      mcqQualityPassed: batchStatus === "READY",
      mcqQualityGateLabel: batchStatus,
      revisitQueued: nextComplete && nextOutcome === "Revisit",
      confidence: nextComplete ? (nextOutcome === "Command" ? "Command" : "Shaky") : progress?.confidence,
    });
  };

  const resetPractice = () => {
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
      mcqReadinessStatus: isReady ? "practice-ready" : "batch-pending",
      revisitQueued: false,
      confidence: progress?.talkBand === "Command" ? "Command" : progress?.confidence,
    });
  };

  const movePracticeIndex = (nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(freshQuestions.length - 1, nextIndex));
    setCurrentPracticeIndex(boundedIndex);
    saveDayProgress(activeSession.day, {
      mcqAttempted: true,
      mcqAnswerMap: practiceAnswers,
      mcqCurrentQuestionIndex: boundedIndex,
      mcqAnsweredCount: answeredCount,
      mcqCorrectCount: correctCount,
      mcqTotal: freshQuestions.length,
      mcqScorePercent: scorePercent,
      mcqLastBatchCode: batchCode,
      mcqOutcome: "Pending",
      mcqReadinessStatus: "practice-active",
      mcqReviewSummary: `${answeredCount}/${freshQuestions.length} fresh questions answered.`,
    });
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Opening MCQ room...
        </div>
      </main>
    );
  }

  if (!gatesCleared) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <section className="rounded-lg border border-[#ef9f27]/55 bg-[#fff4df] p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#9a6a16] text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">MCQ locked</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">Explain first</h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4a12]">
                  MCQ opens after the discussion reaches the {GEOGRAPHY_RECALL_TARGET}% recall target.
                </p>
                <Link href={`/upsc/geography/talk?day=${activeSession.day}`} className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  Open discussion <ArrowRight className="ml-2 h-4 w-4" />
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
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <GeographyRoomCompass
          day={activeSession.day}
          room="MCQ"
          title={activeSession.title}
          detail={nextActionDetail}
          primaryHref={hasPracticeResult ? nextActionHref : isReady ? "#practice" : `/upsc/geography?day=${activeSession.day}`}
          primaryLabel={hasPracticeResult ? nextRouteSignalText : isReady ? "Start practice" : "Return to Today"}
        />
        <section
          data-testid="geography-mcq-level-shell"
          data-learner-level={learnerLevel}
          data-day={activeSession.day}
          data-next-day={activeSession.day < geographySessions.length ? activeSession.day + 1 : "track"}
          data-next-topic-route={nextDayHref}
          data-visible-mode="single-action-practice"
          data-student-surface="compact-one-action"
          data-signal-model="mcq-four-signal-one-action"
          data-essential-signal-count="4"
          data-essential-signals="recall-cleared|fresh-set|score-outcome|next-route"
          data-fresh-set-state={freshSetState}
          data-next-action-route={hasPracticeResult ? nextActionHref : isReady ? "#practice" : ""}
          data-next-action-label={nextRouteSignalText}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-6"
        >
          <div className={cn("grid gap-4 lg:items-start", practiceStarted && !hasPracticeResult ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_300px]")}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">MCQ</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span data-testid="geography-mcq-level-badge" className="text-sm font-semibold text-[#746f66]">
                  {mcqLevelCopy.badge}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{activeSession.title}</h1>
              <p data-testid="geography-mcq-level-copy" className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                {mcqLevelCopy.heroDetail}
              </p>
              <details
                data-testid="mcq-simple-flow-strip"
                className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-xs font-black text-[#31443a]"
              >
                <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.16em] text-[#085041]">
                  Route logic
                </summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {mcqFlowSteps.map((step, index) => (
                    <div key={step.label} className="rounded-md bg-white px-3 py-2">
                      <span className="text-[#1d9e75]">{index + 1}.</span> {step.label}
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#746f66]">
                        {step.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
              <p
                data-testid="mcq-talk-clearance-proof"
                className="mt-3 inline-flex rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#085041]"
              >
                Discussion cleared: {Math.max(visibleTalkScore, GEOGRAPHY_RECALL_TARGET)}% recall
              </p>

              <section
                data-testid="mcq-four-signal-grid"
                data-signal-count="4"
                data-fresh-set-state={freshSetState}
                data-visible-talk-score={Math.max(visibleTalkScore, GEOGRAPHY_RECALL_TARGET)}
                data-outcome={resolvedOutcome}
                data-score-percent={resolvedScorePercent}
                data-next-action-route={hasPracticeResult ? nextActionHref : isReady ? "#practice" : ""}
                data-next-action-label={nextRouteSignalText}
                className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
              >
                <div
                  data-testid="mcq-signal-recall-cleared"
                  data-signal="recall-cleared"
                  data-visible-talk-score={Math.max(visibleTalkScore, GEOGRAPHY_RECALL_TARGET)}
                  className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-3"
                >
                  <BrainCircuit className="h-5 w-5 text-[#1d9e75]" />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    Recall cleared
                  </p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">
                    {Math.max(visibleTalkScore, GEOGRAPHY_RECALL_TARGET)}%
                  </p>
                </div>

                <div
                  data-testid="mcq-signal-fresh-set"
                  data-signal="fresh-set"
                  data-fresh-set-state={freshSetState}
                  data-ready={isReady || hasPracticeResult ? "true" : "false"}
                  className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3"
                >
                  <ClipboardCheck className="h-5 w-5 text-[#1d9e75]" />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    Fresh set
                  </p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">
                    {isReady || hasPracticeResult ? "Ready" : `${freshQuestions.length}/${plannedQuestionCount} reviewed`}
                  </p>
                </div>

                <div
                  data-testid="mcq-signal-score-outcome"
                  data-signal="score-outcome"
                  data-outcome={resolvedOutcome}
                  data-score-percent={resolvedScorePercent}
                  className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3"
                >
                  <RotateCcw className="h-5 w-5 text-[#1d9e75]" />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    Score outcome
                  </p>
                  <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{scoreSignalText}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#66736b]">{resolvedOutcome}</p>
                </div>

                {hasPracticeResult ? (
                  <Link
                    href={nextActionHref}
                    data-testid="mcq-signal-next-route"
                    data-signal="next-route"
                    data-next-action-route={nextActionHref}
                    data-next-action-label={nextRouteSignalText}
                    className="rounded-lg border border-[#1d9e75] bg-[#e7f5ee] p-3 transition hover:border-[#1a3a2a] hover:bg-white"
                  >
                    <ArrowRight className="h-5 w-5 text-[#1d9e75]" />
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                      Next route
                    </p>
                    <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{nextRouteSignalText}</p>
                  </Link>
                ) : (
                  <div
                    data-testid="mcq-signal-next-route"
                    data-signal="next-route"
                    data-next-action-route={isReady ? "#practice" : ""}
                    data-next-action-label={nextRouteSignalText}
                    className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3"
                  >
                    <ArrowRight className="h-5 w-5 text-[#1d9e75]" />
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                      Next route
                    </p>
                    <p className="mt-2 text-sm font-black leading-6 text-[#13251d]">{nextRouteSignalText}</p>
                  </div>
                )}
              </section>
            </div>

            {!practiceStarted || hasPracticeResult ? (
              <div
                data-testid="mcq-student-next-action-panel"
                data-learner-level={learnerLevel}
                data-outcome={resolvedOutcome}
                data-next-action-route={nextActionHref}
                data-next-topic-day={resolvedOutcome === "Command" && activeSession.day < geographySessions.length ? activeSession.day + 1 : ""}
                data-visible-mode="single-action-practice"
                data-student-surface="primary-action"
                className={cn("rounded-lg border p-4", isReady || hasPracticeResult ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#ef9f27]/55 bg-[#fff4df]")}
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Do now</p>
                <h2 className="mt-2 text-xl font-black tracking-tight">{nextActionTitle}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{nextActionDetail}</p>
                {hasPracticeResult ? (
                  <Link
                    data-testid="mcq-student-next-action"
                    data-learner-level={learnerLevel}
                    data-outcome={resolvedOutcome}
                    data-next-action-route={nextActionHref}
                    data-next-topic-day={resolvedOutcome === "Command" && activeSession.day < geographySessions.length ? activeSession.day + 1 : ""}
                    href={nextActionHref}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    {resolvedOutcome === "Command" ? commandActionTitle : "Open short revision"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : isReady ? (
                  <button
                    type="button"
                    data-testid="mcq-start-local-practice"
                    onClick={() => setPracticeStarted(true)}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    Start practice <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                ) : (
                  <Link href={`/upsc/geography?day=${activeSession.day}`} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                    Return to Today <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </section>

        {practiceStarted && currentPracticeQuestion && !hasPracticeResult && (
          <section id="practice" data-testid="mcq-local-practice-runner" data-student-surface="question-first" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Fresh question</p>
                <h2 className="mt-1 text-lg font-black tracking-tight">
                  Question {currentPracticeIndex + 1} of {freshQuestions.length}
                </h2>
              </div>
              <span data-testid="mcq-local-practice-score" className="rounded-md bg-[#e7f5ee] px-3 py-2 text-xs font-black text-[#085041]">
                Progress {answeredCount}/{freshQuestions.length} answered
              </span>
            </div>
            <p className="mt-4 text-lg font-black leading-7 text-[#13251d]">{currentPracticeQuestion.text_en}</p>
            <div className="mt-4 grid gap-3">
              {(["A", "B", "C", "D"] as const).map((option) => {
                const isSelected = currentPracticeAnswer === option;
                const isCorrect = currentPracticeQuestion.correct_option === option;
                const showResult = Boolean(currentPracticeAnswer);
                return (
                  <button
                    key={option}
                    type="button"
                    data-testid={`mcq-practice-option-${option}`}
                    onClick={() => persistPracticeAnswer(option)}
                    disabled={Boolean(currentPracticeAnswer)}
                    className={cn(
                      "rounded-md border p-3 text-left text-sm font-bold leading-6 transition disabled:cursor-not-allowed",
                      showResult && isCorrect && "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
                      showResult && isSelected && !isCorrect && "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
                      !showResult && "border-[#dcd5c7] bg-[#f7f4ee] text-[#25382f] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="font-black">{option}.</span> {getOptionText(currentPracticeQuestion, option)}
                  </button>
                );
              })}
            </div>
            {currentPracticeAnswer && (
              <div data-testid="mcq-practice-feedback" className="mt-4 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <p className="text-sm font-black text-[#085041]">
                  {currentPracticeAnswer === currentPracticeQuestion.correct_option ? "Correct answer" : `Correct option ${currentPracticeQuestion.correct_option}`}
                </p>
                {currentPracticeQuestion.explanation_en ? (
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">{currentPracticeQuestion.explanation_en}</p>
                ) : null}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                data-testid="mcq-previous-question"
                onClick={() => movePracticeIndex(currentPracticeIndex - 1)}
                disabled={currentPracticeIndex === 0}
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Previous
              </button>
              <button
                type="button"
                data-testid="mcq-next-question"
                onClick={() => movePracticeIndex(currentPracticeIndex + 1)}
                disabled={!currentPracticeAnswer || currentPracticeIndex === freshQuestions.length - 1}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Next question <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {hasPracticeResult && (
          <section
            data-testid="mcq-practice-outcome-gate"
            data-learner-level={learnerLevel}
            data-outcome={resolvedOutcome}
            data-next-action-route={nextActionHref}
            data-next-topic-day={resolvedOutcome === "Command" && activeSession.day < geographySessions.length ? activeSession.day + 1 : ""}
            className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Result</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{resolvedOutcome === "Command" ? "Command cleared" : "Short revision required"}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
              {resolvedCorrectCount}/{resolvedTotal} correct ({resolvedScorePercent}%).
            </p>
            <p data-testid="mcq-next-topic-proof" className="mt-3 text-sm font-bold leading-6 text-[#49675e]">
              {resolvedOutcome === "Command"
                ? activeSession.day < geographySessions.length
                  ? `Next opens Day ${activeSession.day + 1}: ${nextActionHref}`
                  : `Next opens progress review: ${nextActionHref}`
                : `Next opens short revision: ${nextActionHref}`}
            </p>
          </section>
        )}

        <details data-testid="geography-mcq-advanced-tools" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
            Practice details
          </summary>
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Gate proof</p>
                <h2 className="text-lg font-black tracking-tight">Ready for practice</h2>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ["Discussion", talkCleared ? "Done" : "Pending"],
                ["Optional visual", labCleared ? "Used" : "Available"],
                ["Practice", isReady || hasPracticeResult ? "Ready" : "Preparing"],
                ["Next step", hasPracticeResult ? (resolvedOutcome === "Command" ? "Next topic" : "Short revision") : isReady ? "Answer MCQs" : "Return Today"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                  <span className="text-sm font-black text-[#13251d]">{label}</span>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice result</p>
                <h2 className="text-lg font-black tracking-tight">What happens after MCQ?</h2>
              </div>
            </div>
            <p className="text-sm font-semibold leading-6 text-[#5d675f]">
              A strong result opens your next topic. A weak result opens a short revision before you try again.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/upsc/geography/lab?day=${activeSession.day}`} className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]">
                Open optional visual
              </Link>
              {practiceStarted || hasPracticeResult ? (
                <button
                  type="button"
                  data-testid="mcq-reset-local-practice"
                  onClick={resetPractice}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  <RotateCcw className="h-4 w-4" /> Reset practice
                </button>
              ) : null}
            </div>
          </div>
          </div>
        </details>
      </div>
    </main>
  );
}
