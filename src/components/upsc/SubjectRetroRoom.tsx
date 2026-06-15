"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CornerDownRight,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { readStudentProfile, saveStudentProfile } from "@/lib/upsc/studentProfile";
import {
  type SubjectDayProgress,
  useSubjectProgress,
} from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";
import { getSubjectBatchCode } from "@/lib/upsc/subjectPlans";
import { readLocalMcqCommandQuestionsForBatch } from "@/lib/upsc/mcqDraftBank";
import { awardGamificationRewards } from "@/lib/upsc/gamification";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

type RetroQuestionType = "trap" | "concept" | "mental-model";

type RetroQuestion = {
  index: number;
  type: RetroQuestionType;
  frameLabel: string;
  aiPrompt: string;
  aiCorrection: string;
};

// ─────────────────────────────────────────────────────────────────────
// Client-side interview builder
// ─────────────────────────────────────────────────────────────────────

function buildTrapCorrection(session: SubjectSession, reviewSummary: string): string {
  const parts: string[] = [
    `The correct mental frame starts from the boundary of "${session.title}": "${session.anchor}".`,
    `UPSC traps in this area exploit overgeneralisation — a statement that is almost-correct but misses one defining exception or reverses the direction of causality.`,
    `Repair: Before selecting an answer, ask "Does this statement hold in all contexts, or is there a hidden exception?" If you can name the exception, you own the concept.`,
  ];
  if (reviewSummary) parts.push(`Your last MCQ review flagged: "${reviewSummary}"`);
  return parts.join(" ");
}

function buildConceptCorrection(session: SubjectSession, assessmentSummary: string): string {
  const parts: string[] = [
    `The complete mechanism for "${session.title}" is: "${session.talk}".`,
    `The most common gap is skipping the middle — jumping from cause directly to consequence without tracing the process step.`,
    `Lock in the chain: Cause → Mechanism → Consequence → UPSC signal. If you need the exact wording from a textbook, the concept is still fragile.`,
  ];
  if (assessmentSummary) parts.push(`Your talk-room AI diagnosis noted: "${assessmentSummary}"`);
  return parts.join(" ");
}

function buildMentalModelCorrection(session: SubjectSession): string {
  return [
    `A strong memory anchor for "${session.title}" connects the abstract concept to something concrete and visible — a place, institution, policy, species, or event.`,
    `Sharp anchor structure: "If I see [X signal], I know this question tests [Y mechanism], not [Z trap]."`,
    `This 3-second pattern-match is what fast UPSC scorers use to reject distractors before reading all four options fully.`,
    `Final self-test: "${session.test}"`,
  ].join(" ");
}

function getOptionText(question: any, option: string) {
  const options = question.options_en;
  if (!options || typeof options !== "object") return "";
  return String(options[option] ?? "");
}

function buildRetroInterview(
  subjectSlug: string,
  session: SubjectSession,
  progress?: SubjectDayProgress
): RetroQuestion[] {
  const scorePercent = progress?.mcqScorePercent ?? 0;
  const reviewSummary = progress?.mcqReviewSummary?.trim() ?? "";
  const assessmentSummary = progress?.assessmentSummary?.trim() ?? "";

  const batchCode = getSubjectBatchCode(subjectSlug, session.day);
  let questions: any[] = [];
  try {
    questions = readLocalMcqCommandQuestionsForBatch(batchCode) || [];
  } catch (e) {
    console.error(e);
  }

  const answers = progress?.mcqAnswerMap || {};
  const incorrectList = questions
    .map((q, idx) => ({ question: q, index: idx, studentAnswer: answers[idx] }))
    .filter((item) => item.studentAnswer && item.studentAnswer !== item.question.correct_option);

  const retroQuestions: RetroQuestion[] = [];

  // 1. Trap / incorrect options question(s)
  if (incorrectList.length > 0) {
    incorrectList.slice(0, 2).forEach((item) => {
      const q = item.question;
      const wrongOpt = item.studentAnswer;
      const correctOpt = q.correct_option;
      const wrongText = getOptionText(q, wrongOpt);
      const correctText = getOptionText(q, correctOpt);

      retroQuestions.push({
        index: retroQuestions.length,
        type: "trap",
        frameLabel: `MCQ wrong option analysis (Q${item.index + 1})`,
        aiPrompt: `In Question ${item.index + 1}: "${q.text_en}", you selected option ${wrongOpt} ("${wrongText}") instead of the correct option ${correctOpt} ("${correctText}"). What was your reasoning at the time? Why did you think option ${wrongOpt} was the right choice over option ${correctOpt}? Please explain the assumption or link you made.`,
        aiCorrection: `Correct option was ${correctOpt}: "${correctText}". ${q.explanation_en || buildTrapCorrection(session, reviewSummary)}`,
      });
    });
  } else {
    // Fallback if no wrong options or score is 100%
    const scoreVal = progress?.mcqScorePercent;
    const isPerfect = typeof scoreVal === "number" && scoreVal === 100;
    retroQuestions.push({
      index: 0,
      type: "trap",
      frameLabel: "MCQ trap check",
      aiPrompt: isPerfect
        ? `Amazing job on achieving a perfect 100% score for "${session.title}"! How did you identify the key UPSC trap option and anchor ("${session.anchor}") to avoid falling for it?`
        : `Your MCQ session on "${session.title}" scored ${scorePercent}%. A common wrong-answer trap here is to confuse the scope or direction of the core anchor: "${session.anchor}". When you chose the incorrect answer, what was the logical connection you believed was true?`,
      aiCorrection: buildTrapCorrection(session, reviewSummary),
    });
  }

  // 2. Concept gap question
  retroQuestions.push({
    index: retroQuestions.length,
    type: "concept",
    frameLabel: "Concept gap check",
    aiPrompt: `Reconstruct the cause-effect chain inside "${session.title}". The anchor is: "${session.anchor}". In your own words, trace the mechanism from cause through process to consequence. Where exactly does your reasoning break or slow down?`,
    aiCorrection: buildConceptCorrection(session, assessmentSummary),
  });

  // 3. Mental model audit
  retroQuestions.push({
    index: retroQuestions.length,
    type: "mental-model",
    frameLabel: "Mental model audit",
    aiPrompt: `Revisit prompt: "${session.revisit}" — Before your next MCQ session on "${session.title}", what one mental model or memory anchor will you build so you can instantly reject an almost-correct wrong statement? Describe the anchor in one specific, concrete sentence.`,
    aiCorrection: buildMentalModelCorrection(session),
  });

  return retroQuestions;
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function SubjectRetroRoom({ plan, initialDay }: { plan: SubjectSprintPlan; initialDay?: number }) {
  const { getDayProgress, isLoaded, saveDayProgress } = useSubjectProgress(plan.slug, plan.sessions);

  // Days with MCQ attempts are the retro queue
  const retroCandidateDays = useMemo(() => {
    return plan.sessions.filter((session) => {
      const progress = getDayProgress(session.day);
      return Boolean(progress?.mcqAttempted || progress?.mcqCompleted);
    });
  }, [plan.sessions, getDayProgress]);

  const fallbackDay =
    retroCandidateDays[0]?.day ?? initialDay ?? plan.sessions[0]?.day ?? 1;
  const [activeDay, setActiveDay] = useState(initialDay ?? fallbackDay);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [studentDraft, setStudentDraft] = useState("");
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, string>>({});
  const [retroSaved, setRetroSaved] = useState(false);
  const [hydratedDay, setHydratedDay] = useState<number | null>(null);

  const activeSession =
    plan.sessions.find((session) => session.day === activeDay) ?? plan.sessions[0];
  const activeProgress = getDayProgress(activeSession.day);
  const retroQuestions = useMemo(
    () => buildRetroInterview(plan.slug, activeSession, activeProgress),
    [plan.slug, activeSession, activeProgress],
  );
  const activeQuestion = retroQuestions[activeQuestionIndex];
  const isLastQuestion = activeQuestionIndex === retroQuestions.length - 1;
  const isCurrentAnswerSubmitted = submittedAnswers[activeQuestion.index] !== undefined;
  const basePath = `/upsc/${plan.slug}`;
  const themeStyle = getSubjectThemeStyle(plan);

  // Hydrate retro status from saved progress
  useEffect(() => {
    if (!isLoaded || hydratedDay === activeDay) return;
    if (activeProgress?.retroCompleted) setRetroSaved(true);
    else setRetroSaved(false);
    setHydratedDay(activeDay);
  }, [isLoaded, activeDay, activeProgress, hydratedDay]);

  const selectDay = (day: number) => {
    const bounded = Math.min(Math.max(day, 1), plan.sessions.length);
    setActiveDay(bounded);
    setActiveQuestionIndex(0);
    setStudentDraft("");
    setSubmittedAnswers({});
    setRetroSaved(false);
    setHydratedDay(null);
  };

  const submitAnswer = () => {
    if (!studentDraft.trim()) return;
    setSubmittedAnswers((prev) => ({
      ...prev,
      [activeQuestion.index]: studentDraft.trim(),
    }));
  };

  const nextQuestion = () => {
    if (isLastQuestion) {
      saveRetro();
    } else {
      setActiveQuestionIndex((prev) => prev + 1);
      setStudentDraft("");
    }
  };

  const saveRetro = () => {
    const retroNote = retroQuestions
      .map(
        (q, i) =>
          `Q${i + 1} [${q.frameLabel}]: ${submittedAnswers[q.index] ?? "(no response)"}`,
      )
      .join("\n\n");
    const retroAiCorrection = retroQuestions
      .map((q) => `${q.frameLabel}: ${q.aiCorrection}`)
      .join("\n\n");

    // Persist retro results into day progress
    saveDayProgress(activeSession.day, {
      retroCompleted: true,
      retroNote,
      retroAiCorrection,
      retroCompletedAt: new Date().toISOString(),
    });

    // Save behavioural reasoning patterns to student profile
    const profile = readStudentProfile();
    if (profile) {
      const patterns = retroQuestions.map((q, i) => ({
        frame: q.frameLabel,
        studentLogic: submittedAnswers[i] ?? "",
        correction: q.aiCorrection,
      }));
      
      let existingReflections: any[] = [];
      if (profile.retroReflections) {
        try {
          const parsed = JSON.parse(profile.retroReflections);
          existingReflections = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // Ignore
        }
      }
      
      const newReflection = {
        subject: plan.slug,
        day: activeSession.day,
        topic: activeSession.title,
        completedAt: new Date().toISOString(),
        patterns,
      };
      
      // Filter out duplicate reflection for same day and subject
      existingReflections = existingReflections.filter(
        (ref) => !(ref.subject === plan.slug && ref.day === activeSession.day)
      );
      existingReflections.push(newReflection);

      saveStudentProfile({
        ...profile,
        retroReflections: JSON.stringify(existingReflections),
        updatedAt: new Date().toISOString(),
      });
    }

    // Award gamification rewards
    try {
      const rewardResult = awardGamificationRewards("retro-complete");
      if (rewardResult.addedPoints > 0) {
        toast.success("Retrospective Saved!", {
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

    setRetroSaved(true);
  };

  // ── Loading state ──
  if (!isLoaded) {
    return (
      <div
        style={themeStyle}
        className="flex min-h-screen items-center justify-center bg-[var(--subject-bg)] text-[var(--subject-text)]"
      >
        <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-6 text-sm font-black">
          Loading {plan.title} retrospective...
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div
      data-testid="subject-room-shell"
      data-room="retro"
      data-subject={plan.slug}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">

        {/* ── Page header ── */}
        <section className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
          <Link
            href={basePath}
            className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]"
          >
            <ArrowLeft className="h-4 w-4" /> {plan.title} command room
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">
              Sunday Retro
            </Badge>
            <span className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] px-3 py-1 text-xs font-black text-[var(--subject-heading)]">
              Day {activeSession.day}
            </span>
            <span className="rounded-md border border-[var(--subject-border)] bg-white px-3 py-1 text-xs font-bold text-[#5d675f]">
              Mental frame repair
            </span>
          </div>

          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">
            {activeSession.chapter}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-4xl">
            {activeSession.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
            The AI teacher asks you to explain the logic behind your wrong answers — not the
            correct answer, but your mental frame at the time. This repairs the reasoning
            pattern, not just the fact.
          </p>

          {/* MCQ snapshot */}
          {activeProgress?.mcqAttempted && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                  MCQ score
                </p>
                <p className="mt-1 text-base font-black text-[var(--subject-heading)]">
                  {activeProgress.mcqScorePercent ?? 0}%{" "}
                  <span className="text-xs font-semibold text-[#776f64]">
                    ({activeProgress.mcqCorrectCount ?? 0}/{activeProgress.mcqTotal ?? 0} correct)
                  </span>
                </p>
              </div>
              {activeProgress.mcqOutcome && (
                <div
                  className={cn(
                    "rounded-md border px-3 py-2",
                    activeProgress.mcqOutcome === "Command"
                      ? "border-[#1d9e75]/35 bg-[#e7f5ee]"
                      : "border-[#ef9f27]/35 bg-[#fff4df]",
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9a6a16]">
                    Outcome
                  </p>
                  <p className="mt-1 text-base font-black text-[var(--subject-heading)]">
                    {activeProgress.mcqOutcome}
                  </p>
                </div>
              )}
              {activeProgress.retroCompleted && (
                <div className="rounded-md border border-[#1d9e75]/35 bg-[#e7f5ee] px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">
                    Retro
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-black text-[#085041]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Done
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Two-column layout ── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_0.38fr]">

          {/* ── Main interview panel ── */}
          <div className="flex flex-col gap-5">

            {retroSaved ? (
              /* ── Completion card ── */
              <section className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#1d9e75]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">
                      Retrospective complete
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
                      Behavioural patterns saved
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                      Your reasoning patterns for &ldquo;{activeSession.title}&rdquo; are recorded. The AI teacher
                      has noted where your mental frame broke and the repair anchor you committed
                      to. This loop closes your Sunday review.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`${basePath}/mcq-readiness?day=${activeSession.day}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:brightness-90"
                      >
                        Retry MCQs <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`${basePath}/talk?day=${activeSession.day}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--subject-border)] bg-white px-4 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)]"
                      >
                        <BrainCircuit className="h-4 w-4" /> Talk room
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Audit summary */}
                {Object.keys(submittedAnswers).length > 0 && (
                  <details className="mt-5 rounded-md border border-[#cfe5dc] bg-white p-4">
                    <summary className="cursor-pointer text-sm font-black text-[#085041]">
                      Review mental frame audit
                    </summary>
                    <div className="mt-4 space-y-3">
                      {retroQuestions.map((question) => (
                        <div
                          key={question.index}
                          className="rounded-md bg-[#f7f4ee] p-3"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">
                            {question.frameLabel}
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-5 text-[#5d675f]">
                            <span className="font-black text-[var(--subject-heading)]">Your logic:</span>{" "}
                            {submittedAnswers[question.index] ?? "—"}
                          </p>
                          <p className="mt-2 text-sm font-bold leading-5 text-[#13251d]">
                            <span className="text-[#1d9e75]">AI repair:</span>{" "}
                            {question.aiCorrection}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </section>
            ) : (
              /* ── Active interview ── */
              <>
                {/* Progress stepper */}
                <div className="flex items-center gap-3">
                  {retroQuestions.map((question, index) => (
                    <div key={question.index} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black transition",
                          index === activeQuestionIndex
                            ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                            : submittedAnswers[index] !== undefined
                              ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                              : "border-[var(--subject-border)] bg-white text-[#9a8d7d]",
                        )}
                      >
                        {submittedAnswers[index] !== undefined ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < retroQuestions.length - 1 && (
                        <div
                          className={cn(
                            "h-0.5 w-10",
                            submittedAnswers[index] !== undefined
                              ? "bg-[#1d9e75]"
                              : "bg-[var(--subject-border)]",
                          )}
                        />
                      )}
                    </div>
                  ))}
                  <span className="ml-2 text-xs font-semibold text-[#9a8d7d]">
                    Question {activeQuestionIndex + 1} of {retroQuestions.length}
                  </span>
                </div>

                {/* AI question card */}
                <section className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--subject-accent)] text-white">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">
                        {activeQuestion.frameLabel} — AI teacher
                      </p>
                      <p className="mt-2 text-base font-bold leading-7 text-[var(--subject-heading)]">
                        {activeQuestion.aiPrompt}
                      </p>
                    </div>
                  </div>

                  {!isCurrentAnswerSubmitted ? (
                    /* Student response input */
                    <>
                      <textarea
                        id={`retro-answer-${activeQuestion.index}`}
                        data-testid={`retro-answer-input-${activeQuestion.index}`}
                        value={studentDraft}
                        onChange={(e) => setStudentDraft(e.target.value)}
                        placeholder="Describe the logic or mental connection you made when answering. Be specific — name the variable, assumption, or frame you used."
                        className="min-h-32 w-full resize-y rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4 text-sm font-semibold leading-6 text-[var(--subject-heading)] outline-none transition placeholder:text-[#8d8579] focus:border-[var(--subject-accent)] focus:ring-2 focus:ring-[var(--subject-ring)]"
                      />
                      <button
                        type="button"
                        data-testid={`retro-submit-${activeQuestion.index}`}
                        onClick={submitAnswer}
                        disabled={!studentDraft.trim()}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90 disabled:opacity-40 sm:w-auto"
                      >
                        <CornerDownRight className="h-4 w-4" /> Submit to AI teacher
                      </button>
                    </>
                  ) : (
                    /* AI correction + next */
                    <div className="space-y-4">
                      <div className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#776f64]">
                          Your reasoning
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--subject-heading)]">
                          {submittedAnswers[activeQuestion.index]}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                        <div className="flex items-start gap-3">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                              AI mental frame correction
                            </p>
                            <p className="mt-2 text-sm font-bold leading-7 text-[#13251d]">
                              {activeQuestion.aiCorrection}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid={`retro-next-${activeQuestion.index}`}
                        onClick={nextQuestion}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-4 text-sm font-black text-white transition hover:brightness-90 sm:w-auto"
                      >
                        {isLastQuestion ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Save all patterns
                          </>
                        ) : (
                          <>
                            Next question <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </section>
              </>
            )}

            <SubjectLoopActions plan={plan} activeDay={activeSession.day} current="retro" />
          </div>

          {/* ── Sidebar: day picker + navigation ── */}
          <aside className="flex flex-col gap-5">
            {/* Retro queue */}
            <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">
                  Retro queue
                </p>
                <RotateCcw className="h-4 w-4 text-[var(--subject-dark)]" />
              </div>

              {retroCandidateDays.length > 0 ? (
                <div className="space-y-2">
                  {retroCandidateDays.map((session) => {
                    const dayProgress = getDayProgress(session.day);
                    const isActive = activeDay === session.day;
                    const isDone = Boolean(dayProgress?.retroCompleted);
                    return (
                      <button
                        key={session.day}
                        type="button"
                        data-testid={`retro-day-${session.day}`}
                        aria-pressed={isActive}
                        onClick={() => selectDay(session.day)}
                        className={cn(
                          "w-full min-h-16 rounded-md border p-3 text-left transition",
                          isActive
                            ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                            : isDone
                              ? "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041] hover:brightness-95"
                              : "border-[var(--subject-border)] bg-white text-[var(--subject-heading)] hover:border-[var(--subject-accent)]",
                        )}
                      >
                        <span className="block text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
                          Day {session.day} {isDone ? "· ✓ Done" : `· ${dayProgress?.mcqScorePercent ?? 0}%`}
                        </span>
                        <span className="mt-1.5 block text-sm font-black leading-5">
                          {session.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* No MCQ sessions yet — show demo days */
                <>
                  <div className="mb-3 rounded-md border border-dashed border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                    <Sparkles className="mb-2 h-5 w-5 text-[var(--subject-accent)]" />
                    <p className="text-sm font-black text-[var(--subject-heading)]">
                      No MCQ sessions yet.
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#776f64]">
                      Complete at least one MCQ readiness session to unlock the Sunday
                      retrospective. Showing demo topics below.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {plan.sessions.slice(0, 5).map((session) => {
                      const isActive = activeDay === session.day;
                      return (
                        <button
                          key={session.day}
                          type="button"
                          onClick={() => selectDay(session.day)}
                          className={cn(
                            "w-full min-h-12 rounded-md border p-2.5 text-left text-xs transition",
                            isActive
                              ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] font-black text-white"
                              : "border-[var(--subject-border)] bg-white font-semibold text-[var(--subject-heading)] hover:border-[var(--subject-accent)]",
                          )}
                        >
                          Day {session.day} — {session.title}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Next room navigation */}
            <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--subject-accent)]">
                Next rooms
              </p>
              <div className="space-y-2">
                {[
                  { label: "MCQ practice", href: `${basePath}/mcq-readiness?day=${activeSession.day}` },
                  { label: "Talk room", href: `${basePath}/talk?day=${activeSession.day}` },
                  { label: "Revisit room", href: `${basePath}/revisit?day=${activeSession.day}` },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-[var(--subject-border)] bg-white px-3 text-sm font-black text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)]"
                  >
                    <span>{label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
