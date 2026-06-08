"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Gauge,
  ListChecks,
  Target,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  allPracticeQuestionBank,
  buildQuestionBankQuestionsFromPyqImports,
  buildRecommendedQuestionBankMix,
  emptyQuestionBankMix,
  getQuestionBankSubject,
  questionBankCoverageRows,
  questionBankCoverageSummary,
  questionDifficulties,
  questionBankSubjects,
  readLocalQuestionBankAttempts,
  readLocalQuestionBankProgress,
  saveLocalQuestionBankAttempt,
  selectCustomQuestionBankSet,
  selectQuestionBankSet,
  type QuestionBankAttempt,
  type QuestionBankCustomMix,
  type QuestionBankProgressInput,
  type QuestionDifficulty,
  type PracticeQuestion,
  type QuestionOption,
} from "@/lib/upsc/questionBankEngine";
import { readLocalPyqImportRecords, type PyqImportRecord } from "@/lib/upsc/pyqImportLedger";
import { readStudentProfile, type StudentProfile } from "@/lib/upsc/studentProfile";
import { cn } from "@/lib/utils";

const questionCounts = [5, 8, 10, 15] as const;

type RecommendationMetric = {
  label: string;
  value: string | number;
  Icon: LucideIcon;
};

function scoreText(value: number | null, suffix: string) {
  return value === null ? "Not measured" : `${value}${suffix}`;
}

export function UpscQuestionBankBuilder() {
  const searchParams = useSearchParams();
  const requestedSubject = searchParams.get("subject") ?? "geography";
  const [subjectSlug, setSubjectSlug] = useState(() => getQuestionBankSubject(requestedSubject).slug);
  const [progress, setProgress] = useState<QuestionBankProgressInput>({});
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attempts, setAttempts] = useState<QuestionBankAttempt[]>([]);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customMix, setCustomMix] = useState<QuestionBankCustomMix>(emptyQuestionBankMix);
  const [displayQuestionIds, setDisplayQuestionIds] = useState<string[]>([]);
  const [pyqRecords, setPyqRecords] = useState<PyqImportRecord[]>([]);

  useEffect(() => {
    const nextSubjectSlug = getQuestionBankSubject(requestedSubject).slug;
    setSubjectSlug(nextSubjectSlug);
    setDifficulty(null);
    setCount(null);
    setCustomMode(false);
    setCustomMix(emptyQuestionBankMix);
  }, [requestedSubject]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(readStudentProfile());
      setProgress(readLocalQuestionBankProgress(subjectSlug));
      setAttempts(readLocalQuestionBankAttempts(subjectSlug));
      setPyqRecords(readLocalPyqImportRecords());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [subjectSlug]);

  const selectedSubject = useMemo(() => getQuestionBankSubject(subjectSlug), [subjectSlug]);
  const exactPyqQuestions = useMemo(() => buildQuestionBankQuestionsFromPyqImports(pyqRecords), [pyqRecords]);
  const combinedQuestionBank = useMemo(
    () => [...exactPyqQuestions, ...allPracticeQuestionBank],
    [exactPyqQuestions]
  );
  const selectedExactPyqQuestions = useMemo(
    () => exactPyqQuestions.filter((question) => question.subjectSlug === selectedSubject.slug),
    [exactPyqQuestions, selectedSubject.slug]
  );
  const recommended = useMemo(
    () =>
      selectQuestionBankSet({
        subjectSlug: selectedSubject.slug,
        progress,
        profile,
        attempts,
        questionBank: combinedQuestionBank,
      }),
    [attempts, combinedQuestionBank, profile, progress, selectedSubject.slug]
  );
  const activeDifficulty = difficulty ?? recommended.recommendation.recommendedDifficulty;
  const activeCount = count ?? recommended.recommendation.recommendedCount;
  const recommendedMix = useMemo(
    () => buildRecommendedQuestionBankMix(recommended.recommendation),
    [recommended.recommendation]
  );
  const effectiveCustomMix = useMemo(
    () => (customMode ? customMix : recommendedMix),
    [customMix, customMode, recommendedMix]
  );
  const selection = useMemo(
    () => {
      if (customMode) {
        return selectCustomQuestionBankSet({
          subjectSlug: selectedSubject.slug,
          progress,
          profile,
          attempts,
          mix: customMix,
          questionBank: combinedQuestionBank,
        });
      }

      return selectQuestionBankSet({
        subjectSlug: selectedSubject.slug,
        progress,
        profile,
        attempts,
        difficulty: activeDifficulty,
        count: activeCount,
        questionBank: combinedQuestionBank,
      });
    },
    [activeCount, activeDifficulty, attempts, combinedQuestionBank, customMix, customMode, profile, progress, selectedSubject.slug]
  );
  const recommendation = selection.recommendation;
  const selectedCoverage = useMemo(
    () => questionBankCoverageRows.find((row) => row.subjectSlug === selectedSubject.slug),
    [selectedSubject.slug]
  );
  const targetDayKey = recommendation.targetDays.join(",");

  useEffect(() => {
    setDisplayQuestionIds(selection.questions.map((question) => question.id));
  }, [activeCount, activeDifficulty, customMode, effectiveCustomMix.EASY, effectiveCustomMix.HARD, effectiveCustomMix.MEDIUM, effectiveCustomMix.PYQ_STYLE, selectedSubject.slug, targetDayKey]);

  const displayedQuestions = useMemo(() => {
    if (!displayQuestionIds.length) return selection.questions;

    const subjectQuestionMap = new Map(
      combinedQuestionBank
        .filter((question) => question.subjectSlug === selectedSubject.slug)
        .map((question) => [question.id, question])
    );
    const lockedQuestions = displayQuestionIds
      .map((questionId) => subjectQuestionMap.get(questionId))
      .filter((question): question is PracticeQuestion => Boolean(question));

    return lockedQuestions.length ? lockedQuestions : selection.questions;
  }, [combinedQuestionBank, displayQuestionIds, selectedSubject.slug, selection.questions]);
  const customRequestedTotal = questionDifficulties.reduce((sum, item) => sum + effectiveCustomMix[item], 0);
  const displayedDifficultyCounts = questionDifficulties.reduce(
    (counts, item) => ({
      ...counts,
      [item]: displayedQuestions.filter((question) => question.difficulty === item).length,
    }),
    {} as QuestionBankCustomMix
  );
  const customMixLabel = questionDifficulties.map((item) => `${item}:${effectiveCustomMix[item]}`).join("|");
  const displayedMixLabel = questionDifficulties.map((item) => `${item}:${displayedDifficultyCounts[item]}`).join("|");
  const displayedExactPyqCount = displayedQuestions.filter((question) => question.isExactPyqImport).length;
  const totalVisibleQuestions = questionBankCoverageSummary.totalQuestions + exactPyqQuestions.length;
  const activeSubjectVisibleQuestions = (selectedCoverage?.totalQuestions ?? 0) + selectedExactPyqQuestions.length;

  const attemptByQuestionId = useMemo(
    () => new Map(attempts.map((attempt) => [attempt.questionId, attempt])),
    [attempts]
  );
  const solvedAccuracy = recommendation.solvedAccuracyPercent === null ? "Not measured" : `${recommendation.solvedAccuracyPercent}%`;
  const lastSolved = attempts[0]?.solvedAt ? new Date(attempts[0].solvedAt).toLocaleDateString("en-IN") : "No solved question";
  const recommendationMetrics: RecommendationMetric[] = [
    { label: "Subject", value: selectedSubject.title, Icon: ClipboardCheck },
    { label: "Consistency", value: `${recommendation.consistencyPercent}%`, Icon: Gauge },
    { label: "Recovery", value: recommendation.recoveryCount, Icon: Target },
    { label: "AI gaps", value: recommendation.teacherDoubtCount, Icon: CircleAlert },
    { label: "Command", value: recommendation.commandCount, Icon: CheckCircle2 },
    { label: "Profile", value: recommendation.learnerLevel, Icon: ClipboardCheck },
    { label: "Evidence level", value: recommendation.adaptiveLevel, Icon: BrainCircuit },
  ];
  const selectionProofRows = [
    {
      id: "recall",
      label: "Recall",
      value: scoreText(recommendation.averageRecall, "/100"),
      points: recommendation.adaptiveSignals.recallPoints,
      rule: "Talk recall moves the learner from basics toward PYQ traps.",
    },
    {
      id: "consistency",
      label: "Consistency",
      value: `${recommendation.consistencyPercent}%`,
      points: recommendation.adaptiveSignals.consistencyPoints,
      rule: "Recent started days decide how much load the next set can carry.",
    },
    {
      id: "mcq-marks",
      label: "MCQ marks",
      value: scoreText(recommendation.averageMcq, "%"),
      points: recommendation.adaptiveSignals.mcqPoints,
      rule: "Practice marks decide whether to repair basics or raise difficulty.",
    },
    {
      id: "solved-ledger",
      label: "Solved ledger",
      value: recommendation.solvedAccuracyPercent === null ? "No attempts" : `${recommendation.solvedAccuracyPercent}%`,
      points: recommendation.adaptiveSignals.ledgerPoints,
      rule: "Wrong answers stay in the repair queue and reduce difficulty.",
    },
    {
      id: "command",
      label: "Command days",
      value: recommendation.commandCount,
      points: recommendation.adaptiveSignals.commandBonus,
      rule: "Command evidence adds controlled permission for harder questions.",
    },
    {
      id: "recovery",
      label: "Recovery load",
      value: recommendation.recoveryCount + recommendation.teacherDoubtCount + recommendation.unresolvedIncorrectCount,
      points: -recommendation.adaptiveSignals.recoveryPenalty,
      rule: "Active recovery, AI teacher gaps, and incorrect answers block difficulty jumps.",
    },
  ];
  const enableCustomMix = (mix: QuestionBankCustomMix = effectiveCustomMix) => {
    setCustomMode(true);
    setCustomMix({ ...mix });
    setDifficulty(null);
    setCount(null);
  };
  const updateCustomMix = (item: QuestionDifficulty, value: string) => {
    const parsedValue = Math.round(Number(value) || 0);
    const nextValue = Math.max(0, Math.min(20, parsedValue));
    const baseMix = customMode ? customMix : effectiveCustomMix;

    setCustomMode(true);
    setCustomMix({
      ...baseMix,
      [item]: nextValue,
    });
    setDifficulty(null);
    setCount(null);
  };
  const markQuestionSolved = (question: PracticeQuestion, selectedOption: QuestionOption) => {
    setAttempts(saveLocalQuestionBankAttempt(question, selectedOption));
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        <section
          data-testid="upsc-question-bank-hero"
          data-active-subject={selectedSubject.slug}
          data-active-difficulty={customMode ? "CUSTOM_MIX" : activeDifficulty}
          data-active-count={customMode ? customRequestedTotal : activeCount}
          data-custom-mode={customMode ? "true" : "false"}
          data-custom-mix={customMixLabel}
          data-solved-count={recommendation.solvedCount}
          data-solved-accuracy={recommendation.solvedAccuracyPercent ?? "pending"}
          data-adaptive-level={recommendation.adaptiveLevel}
          data-adaptive-score={recommendation.adaptiveReadinessScore}
          data-total-question-rows={questionBankCoverageSummary.totalQuestions}
          data-visible-question-rows={totalVisibleQuestions}
          data-imported-exact-question-rows={exactPyqQuestions.length}
          data-active-subject-imported-exact-rows={selectedExactPyqQuestions.length}
          data-covered-difficulty-slots={questionBankCoverageSummary.coveredDifficultySlots}
          data-expected-difficulty-slots={questionBankCoverageSummary.expectedDifficultySlots}
          data-full-coverage-subjects={questionBankCoverageSummary.fullCoverageSubjects}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Custom MCQ builder
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                Practice adapts to recall, consistency, and marks.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                The builder selects easy, medium, hard, or PYQ-style questions from the selected subject bank. The
                default recommendation comes from Talk score, MCQ score, active recovery, command days, and study
                consistency.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Recommended", recommendation.recommendedDifficulty.replace("_", " ")],
                ["Set size", recommendation.recommendedCount],
                ["Subject", selectedSubject.title],
                ["Recall", scoreText(recommendation.averageRecall, "/100")],
                ["MCQ", scoreText(recommendation.averageMcq, "%")],
                ["Evidence level", `${recommendation.adaptiveLevel} / ${recommendation.adaptiveReadinessScore}`],
                ["Solved", recommendation.solvedCount],
                ["Accuracy", solvedAccuracy],
                ["Coverage", selectedCoverage?.fullCoverage ? "Full path" : "Partial"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-xl font-black capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-question-bank-coverage-proof"
          data-subject-count={questionBankCoverageSummary.subjectCount}
          data-total-days={questionBankCoverageSummary.totalDays}
          data-total-question-rows={questionBankCoverageSummary.totalQuestions}
          data-visible-question-rows={totalVisibleQuestions}
          data-imported-exact-question-rows={exactPyqQuestions.length}
          data-curated-question-rows={questionBankCoverageSummary.curatedQuestions}
          data-generated-question-rows={questionBankCoverageSummary.generatedQuestions}
          data-covered-difficulty-slots={questionBankCoverageSummary.coveredDifficultySlots}
          data-expected-difficulty-slots={questionBankCoverageSummary.expectedDifficultySlots}
          data-full-coverage-subjects={questionBankCoverageSummary.fullCoverageSubjects}
          data-active-subject={selectedCoverage?.subjectSlug}
          data-active-subject-days={selectedCoverage?.totalDays}
          data-active-subject-questions={selectedCoverage?.totalQuestions}
          data-active-subject-visible-questions={activeSubjectVisibleQuestions}
          data-active-subject-imported-exact-rows={selectedExactPyqQuestions.length}
          data-active-subject-slots={selectedCoverage?.coveredDifficultySlots}
          data-active-subject-expected-slots={selectedCoverage?.expectedDifficultySlots}
          data-active-subject-full-coverage={selectedCoverage?.fullCoverage ? "true" : "false"}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm"
        >
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["Full subjects", `${questionBankCoverageSummary.fullCoverageSubjects}/${questionBankCoverageSummary.subjectCount}`],
              ["Day slots", `${questionBankCoverageSummary.coveredDifficultySlots}/${questionBankCoverageSummary.expectedDifficultySlots}`],
              ["Question rows", totalVisibleQuestions],
              ["Exact imports", exactPyqQuestions.length],
              ["Active subject", selectedCoverage ? `${activeSubjectVisibleQuestions} rows` : "Pending"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                <p className="mt-1 text-lg font-black text-[#13251d]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-question-bank-exact-pyq-bridge"
          data-proof-rule="mapped-exact-pyq-imports-become-demand-drills"
          data-total-imported-exact-questions={exactPyqQuestions.length}
          data-active-subject={selectedSubject.slug}
          data-active-subject-exact-questions={selectedExactPyqQuestions.length}
          data-displayed-exact-questions={displayedExactPyqCount}
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                Exact PYQ bridge
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">
                Imported PYQs can now enter the PYQ-style practice lane.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#49675e]">
                Mapped exact rows from the admin import room are shown as demand-reading drills. The portal keeps the
                answer-key claim honest until official options and keys are imported separately.
              </p>
            </div>
            <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">
              {selectedExactPyqQuestions.length} active
            </Badge>
          </div>

          {selectedExactPyqQuestions.length > 0 ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {selectedExactPyqQuestions.slice(0, 4).map((question) => (
                <article
                  key={question.id}
                  data-testid="upsc-question-bank-exact-pyq-row"
                  data-question-id={question.id}
                  data-subject-slug={question.subjectSlug}
                  data-source-year={question.sourceYear}
                  data-question-number={question.questionNumber}
                  className="rounded-md border border-[#b9d9cd] bg-white/80 p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">
                    {question.sourceYear} / {question.questionNumber} / Day {question.linkedDay}
                  </p>
                  <h3 className="mt-2 text-sm font-black leading-6 text-[#13251d]">{question.stem}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#49675e]">
                    Demand: {question.answerDemand || "Review answer demand"}.
                  </p>
                  {question.sourceHref ? (
                    <a
                      href={question.sourceHref}
                      className="mt-3 inline-flex text-xs font-black text-[#085041] underline underline-offset-4"
                    >
                      Official source
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-[#b9d9cd] bg-white/70 p-4 text-sm font-bold leading-6 text-[#49675e]">
              No mapped exact PYQ rows are available for {selectedSubject.title} yet. Import rows in the admin PYQ room,
              then return here and choose PYQ STYLE.
            </div>
          )}
        </section>

        <section
          data-testid="upsc-question-bank-subjects"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            {questionBankSubjects.map((subject) => {
              const isActive = selectedSubject.slug === subject.slug;
              return (
                <button
                  key={subject.slug}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setSubjectSlug(subject.slug);
                    setDifficulty(null);
                    setCount(null);
                    setCustomMode(false);
                    setCustomMix(emptyQuestionBankMix);
                  }}
                  className={cn(
                    "min-h-10 rounded-md border px-3 text-sm font-black transition",
                    isActive
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                  )}
                >
                  {subject.title}
                </button>
              );
            })}
          </div>
        </section>

        <section
          data-testid="upsc-question-bank-recommendation"
          data-recommended-difficulty={recommendation.recommendedDifficulty}
          data-recommended-count={recommendation.recommendedCount}
          data-ai-gap-count={recommendation.teacherDoubtCount}
          data-target-days={recommendation.targetDays.join(",")}
          data-solved-count={recommendation.solvedCount}
          data-solved-accuracy={recommendation.solvedAccuracyPercent ?? "pending"}
          data-unresolved-incorrect-count={recommendation.unresolvedIncorrectCount}
          data-adaptive-level={recommendation.adaptiveLevel}
          data-adaptive-score={recommendation.adaptiveReadinessScore}
          data-recall-points={recommendation.adaptiveSignals.recallPoints}
          data-consistency-points={recommendation.adaptiveSignals.consistencyPoints}
          data-mcq-points={recommendation.adaptiveSignals.mcqPoints}
          data-ledger-points={recommendation.adaptiveSignals.ledgerPoints}
          data-command-bonus={recommendation.adaptiveSignals.commandBonus}
          data-recovery-penalty={recommendation.adaptiveSignals.recoveryPenalty}
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                  AI selection rule
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">{recommendation.reason}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Target days: {recommendation.targetDays.length ? recommendation.targetDays.join(", ") : "fresh baseline"}.
              </p>
              <div
                data-testid="upsc-question-bank-adaptive-level"
                className="mt-4 rounded-md border border-[#b9d9cd] bg-white/75 p-3"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">
                  Evidence-derived MCQ level
                </p>
                <p className="mt-1 text-sm font-black capitalize text-[#13251d]">
                  {recommendation.adaptiveLevel} / {recommendation.adaptiveReadinessScore}
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#49675e]">
                  Recall, consistency, marks, solved ledger, command days, and recovery penalties decide the default set.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {recommendationMetrics.map(({ label, value, Icon }) => (
                <div key={label} className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                  <Icon className="mb-3 h-4 w-4 text-[#085041]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">{label}</p>
                  <p className="mt-1 text-lg font-black capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div
            data-testid="upsc-question-bank-selection-proof"
            data-evidence-rule="recall-consistency-marks-ledger-command-recovery"
            data-active-difficulty={customMode ? "CUSTOM_MIX" : activeDifficulty}
            data-recommended-difficulty={recommendation.recommendedDifficulty}
            data-manual-override={difficulty ? "true" : "false"}
            data-custom-mode={customMode ? "true" : "false"}
            data-custom-requested-total={customRequestedTotal}
            data-custom-mix={customMixLabel}
            data-adaptive-score={recommendation.adaptiveReadinessScore}
            data-adaptive-level={recommendation.adaptiveLevel}
            className="mt-5 rounded-lg border border-[#b9d9cd] bg-white/75 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#085041]">
                  Selection proof
                </p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-[#13251d]">
                  Why this MCQ set opened
                </h3>
              </div>
              <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">
                {customMode ? "Custom mix" : activeDifficulty.replace("_", " ")}
              </Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {selectionProofRows.map((row) => (
                <div
                  key={row.id}
                  data-testid="upsc-question-bank-proof-row"
                  data-proof-id={row.id}
                  data-proof-value={row.value}
                  data-proof-points={row.points}
                  className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      {row.label}
                    </p>
                    <span
                      className={cn(
                        "rounded px-2 py-1 text-[10px] font-black",
                        row.points < 0 ? "bg-[#fff4df] text-[#6f4a12]" : "bg-white text-[#085041]"
                      )}
                    >
                      {row.points > 0 ? `+${row.points}` : row.points}
                    </span>
                  </div>
                  <p className="mt-1 text-base font-black text-[#13251d]">{row.value}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">{row.rule}</p>
                </div>
              ))}
            </div>
          </div>
          {recommendation.teacherDoubt ? (
            <div
              data-testid="upsc-question-bank-ai-gap"
              className="mt-5 rounded-lg border border-[#ef9f27] bg-[#fff4df] p-4 text-[#6f4a12]"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.16em]">AI teacher repair set</p>
                <Badge className="rounded-md bg-[#6f4a12] px-2 py-1 text-white">
                  Day {recommendation.teacherDoubt.day} / {recommendation.teacherDoubt.category}
                </Badge>
              </div>
              <p className="text-sm font-bold leading-6">{recommendation.teacherDoubt.reason}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <p className="rounded-md bg-white/80 p-3 text-xs font-bold leading-5">
                  Repair: {recommendation.teacherDoubt.repairAction}
                </p>
                <p className="rounded-md bg-white/80 p-3 text-xs font-bold leading-5">
                  Mastery check: {recommendation.teacherDoubt.masteryCheck}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <section data-testid="upsc-question-bank-controls" className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-[#1a3a2a]" />
              <h2 className="text-xl font-black tracking-tight">Choose difficulty</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {questionDifficulties.map((item) => {
                const isActive = activeDifficulty === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setCustomMode(false);
                      setDifficulty(item);
                    }}
                    className={cn(
                      "min-h-12 rounded-md border px-3 text-sm font-black transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    {item.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Gauge className="h-5 w-5 text-[#1a3a2a]" />
              <h2 className="text-xl font-black tracking-tight">Set size</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {questionCounts.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={activeCount === item}
                  onClick={() => {
                    setCustomMode(false);
                    setCount(item);
                  }}
                  className={cn(
                    "min-h-12 rounded-md border text-sm font-black transition",
                    activeCount === item
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-question-bank-custom-mix"
          data-custom-mode={customMode ? "true" : "false"}
          data-requested-total={customRequestedTotal}
          data-displayed-total={displayedQuestions.length}
          data-custom-mix={customMixLabel}
          data-displayed-mix={displayedMixLabel}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Mixed practice
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">Build a balanced MCQ set</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                Use this when one student needs basics, traps, and PYQ-style checks in the same sitting. The adaptive
                mix stays tied to the same recall, marks, recovery, and command evidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={customMode}
                onClick={() => enableCustomMix(recommendedMix)}
                className={cn(
                  "min-h-10 rounded-md border px-3 text-sm font-black transition",
                  customMode
                    ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                    : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                )}
              >
                Use adaptive mix
              </button>
              <button
                type="button"
                onClick={() => setCustomMix(recommendedMix)}
                className="min-h-10 rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                Load recommended mix
              </button>
              <button
                type="button"
                aria-pressed={!customMode}
                onClick={() => setCustomMode(false)}
                className={cn(
                  "min-h-10 rounded-md border px-3 text-sm font-black transition",
                  !customMode
                    ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                    : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                )}
              >
                Use single band
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {questionDifficulties.map((item) => (
              <label key={item} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                  {item.replace("_", " ")}
                </span>
                <input
                  data-testid={`upsc-question-bank-mix-${item.toLowerCase()}`}
                  type="number"
                  min={0}
                  max={20}
                  value={effectiveCustomMix[item]}
                  onChange={(event) => updateCustomMix(item, event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-base font-black text-[#13251d] outline-none transition focus:border-[#1d9e75]"
                />
                <span className="mt-2 block text-xs font-bold text-[#5d675f]">
                  Showing {displayedDifficultyCounts[item]} of {effectiveCustomMix[item]}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section
          data-testid="upsc-question-bank-ledger"
          data-solved-count={recommendation.solvedCount}
          data-solved-accuracy={recommendation.solvedAccuracyPercent ?? "pending"}
          data-unresolved-incorrect-count={recommendation.unresolvedIncorrectCount}
          className="grid gap-3 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:grid-cols-4"
        >
          {[
            ["Solved", recommendation.solvedCount],
            ["Accuracy", solvedAccuracy],
            ["Repair queue", recommendation.unresolvedIncorrectCount],
            ["Last solved", lastSolved],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
              <p className="mt-1 break-words text-lg font-black text-[#13251d]">{value}</p>
            </div>
          ))}
        </section>

        <section
          data-testid="upsc-question-bank-set"
          data-custom-mode={customMode ? "true" : "false"}
          data-question-mix={displayedMixLabel}
          data-displayed-exact-pyq-count={displayedExactPyqCount}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Selected set</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight" data-question-count={displayedQuestions.length}>
                {displayedQuestions.length} questions generated
              </h2>
            </div>
            <Link
              href={`/upsc/mcq-command?subject=${selectedSubject.slug}`}
              className="inline-flex min-h-10 items-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              Admin batch map <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3">
            {displayedQuestions.length ? (
              displayedQuestions.map((question, index) => {
                const attempt = attemptByQuestionId.get(question.id);

                return (
                <article
                  key={question.id}
                  data-testid="upsc-question-bank-question"
                  data-question-id={question.id}
                  data-subject-slug={question.subjectSlug}
                  data-question-difficulty={question.difficulty}
                  data-linked-day={question.linkedDay}
                  data-question-source={question.source}
                  data-exact-pyq-import={question.isExactPyqImport ? "true" : "false"}
                  data-source-year={question.sourceYear ?? ""}
                  data-question-number={question.questionNumber ?? ""}
                  data-solved-state={attempt ? (attempt.isCorrect ? "correct" : "incorrect") : "unsolved"}
                  className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">Q{index + 1}</Badge>
                      <Badge variant="outline" className="rounded-md border-[#1d9e75] text-[#085041]">
                        {question.subjectTitle ?? selectedSubject.title}
                      </Badge>
                      <Badge variant="outline" className="rounded-md border-[#1d9e75] text-[#085041]">
                        Day {question.linkedDay}
                      </Badge>
                      <Badge variant="outline" className="rounded-md border-[#dcd5c7] text-[#31443a]">
                        {question.difficulty.replace("_", " ")}
                      </Badge>
                      {attempt ? (
                        <Badge className={cn("rounded-md px-2 py-1 text-white", attempt.isCorrect ? "bg-[#1d9e75]" : "bg-[#ef9f27]")}>
                          {attempt.isCorrect ? "Solved correct" : "Repair saved"}
                        </Badge>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      {question.source.replaceAll("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-lg font-black leading-7 tracking-tight">{question.stem}</h3>
                  {question.isExactPyqImport ? (
                    <div className="mt-3 rounded-md border border-[#b9d9cd] bg-[#e7f5ee] p-3 text-xs font-bold leading-5 text-[#085041]">
                      Exact PYQ demand drill: official text and source are imported, but official answer options/key are
                      not claimed here.
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {Object.entries(question.options).map(([option, text]) => (
                      <button
                        key={option}
                        type="button"
                        data-testid="upsc-question-bank-option"
                        data-question-id={question.id}
                        data-option={option}
                        aria-pressed={attempt?.selectedOption === option}
                        onClick={() => markQuestionSolved(question, option as QuestionOption)}
                        className={cn(
                          "rounded-md border p-3 text-left text-sm font-semibold transition",
                          attempt?.selectedOption === option
                            ? attempt.isCorrect
                              ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                              : "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]"
                            : "border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]"
                        )}
                      >
                        <span className="font-black text-[#085041]">{option}.</span> {text}
                      </button>
                    ))}
                  </div>
                  {attempt ? (
                    <div
                      data-testid="upsc-question-bank-solved-proof"
                      className={cn(
                        "mt-4 rounded-md border p-3 text-sm font-bold leading-6",
                        attempt.isCorrect
                          ? "border-[#b9d9cd] bg-[#e7f5ee] text-[#085041]"
                          : "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]"
                      )}
                    >
                      Student selected {attempt.selectedOption}. {attempt.isCorrect ? "Correct evidence saved." : "Incorrect evidence saved for repair."}
                    </div>
                  ) : null}
                  <details className="mt-4 rounded-md border border-[#cfe5dc] bg-white p-3">
                    <summary className="cursor-pointer list-none text-sm font-black text-[#085041]">
                      Answer and UPSC trap
                    </summary>
                    <p className="mt-3 text-sm font-black text-[#13251d]">Correct: {question.correctOption}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#4f5e55]">{question.explanation}</p>
                    <p className="mt-2 rounded-md bg-[#fff4df] p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                      Trap: {question.trap}
                    </p>
                    {question.sourceHref ? (
                      <a
                        href={question.sourceHref}
                        className="mt-3 inline-flex text-xs font-black text-[#085041] underline underline-offset-4"
                      >
                        Official source
                      </a>
                    ) : null}
                  </details>
                </article>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-[#dcd5c7] bg-[#f7f4ee] p-5 text-sm font-semibold text-[#657066]">
                No question is available for this exact selection yet. Choose another difficulty or reduce the set size.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
