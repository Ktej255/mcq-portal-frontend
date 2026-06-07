"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  TimerReset,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectLoopActions } from "@/components/upsc/SubjectLoopActions";
import { getHistoryVisualCommandDeck } from "@/lib/upsc/historyLearningDecks";
import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import {
  getSubjectLabProofCompletion,
  getSubjectLearningGate,
  getSubjectWatchCompletion,
  isSubjectTalkReadyForMcq,
} from "@/lib/upsc/subjectProgressGates";
import { getSubjectThemeStyle } from "@/lib/upsc/subjectTheme";
import { useSubjectProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

type RecoveryStep = {
  label: string;
  instruction: string;
  check: string;
};

function buildRecoverySteps(session: SubjectSession): RecoveryStep[] {
  return [
    {
      label: "Recall",
      instruction: `Without notes, write the core idea of ${session.title} in three lines.`,
      check: "Can you name the variables before reading your old reflection?",
    },
    {
      label: "Explain",
      instruction: session.talk,
      check: "Can you explain the cause, mechanism, impact, and response without memorized phrasing?",
    },
    {
      label: "Apply",
      instruction: `Attach ${session.title} to a map, case study, institution, report, species, place, law, or policy.`,
      check: "Can you connect the concept to a visible exam-ready example?",
    },
    {
      label: "Trap",
      instruction: `Create one wrong UPSC-style statement about ${session.title}, then correct it.`,
      check: "Can you spot the exception or overgeneralization?",
    },
    {
      label: "Retest",
      instruction: session.test,
      check: "Can you now face a fresh MCQ or short answer without hesitation?",
    },
  ];
}

export function SubjectRevisitRoom({ plan, initialDay }: { plan: SubjectSprintPlan; initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress, stats } = useSubjectProgress(plan.slug, plan.sessions);
  const boundedInitialDay =
    initialDay && Number.isFinite(initialDay) ? Math.min(Math.max(initialDay, 1), plan.sessions.length) : undefined;
  const suggestedDay =
    boundedInitialDay ??
    stats.revisitDays[0]?.day ??
    stats.spacedRevisionDays[0]?.day ??
    stats.shakyDays[0]?.day ??
    Math.min(10, plan.sessions.length);
  const [activeDay, setActiveDay] = useState(suggestedDay);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [recoveryNote, setRecoveryNote] = useState("");
  const [justRecovered, setJustRecovered] = useState(false);
  const [recoveredFromMcq, setRecoveredFromMcq] = useState(false);
  const userSelectedDayRef = useRef(false);

  const activeSession = plan.sessions.find((session) => session.day === activeDay) ?? plan.sessions[0];
  const activeLab = plan.labs.find((lab) => lab.title === activeSession.lab) ?? plan.labs[0];
  const activeProgress = getDayProgress(activeSession.day);
  const recoverySteps = useMemo(() => buildRecoverySteps(activeSession), [activeSession]);
  const historyRecoveryDeck = useMemo(
    () => (plan.slug === "history" && activeLab ? getHistoryVisualCommandDeck(activeLab.slug, activeSession) : null),
    [activeLab, activeSession, plan.slug]
  );
  const activeStep = recoverySteps[activeStepIndex];
  const queueDays = stats.revisitDays.length > 0 ? stats.revisitDays : stats.shakyDays;
  const basePath = `/upsc/${plan.slug}`;
  const watchCompletion = getSubjectWatchCompletion(activeProgress);
  const labProofCompletion = getSubjectLabProofCompletion(activeProgress);
  const talkMcqReady = isSubjectTalkReadyForMcq(activeProgress);
  const nextGate = getSubjectLearningGate(plan, activeSession, activeProgress);
  const isMcqTriggeredRevisit =
    activeProgress?.mcqOutcome === "Revisit" ||
    Boolean(
      activeProgress?.revisitQueued &&
        (activeProgress?.activePromptLabel === "MCQ Practice" || activeProgress?.activePromptLabel === "MCQ Retest")
    );
  const isMcqRecoveryFlow = justRecovered ? recoveredFromMcq : isMcqTriggeredRevisit;
  const showHistoryMcqRecoveryCommand =
    plan.slug === "history" &&
    (isMcqRecoveryFlow ||
      Boolean(activeProgress?.mcqRecoveryCompleted) ||
      activeProgress?.mcqRecoveryRetestOutcome === "Revisit" ||
      activeProgress?.mcqReadinessStatus === "revisit");
  const mcqRecoverySourceOutcome =
    activeProgress?.mcqRecoverySourceOutcome ??
    (activeProgress?.mcqTotal
      ? `${activeProgress.mcqCorrectCount ?? 0}/${activeProgress.mcqTotal} correct (${activeProgress.mcqScorePercent ?? 0}%)`
      : "Fresh MCQ attempt pending");
  const historyMcqRecoverySteps = [
    {
      label: "Attempt evidence",
      value: mcqRecoverySourceOutcome,
      detail:
        activeProgress?.mcqRecoveryRetestSummary ??
        activeProgress?.mcqReviewSummary ??
        activeProgress?.mcqRecoverySummary ??
        "Capture the failed trap before clearing the queue.",
      complete: Boolean(activeProgress?.mcqAttempted || activeProgress?.mcqRecoveryCompleted),
    },
    {
      label: "Trap isolated",
      value: activeProgress?.mcqRecoveryCompleted ? "Saved" : "Repair now",
      detail: "Write the exact chronology, source-map, personality, or feature trap that caused the wrong answer.",
      complete: Boolean(activeProgress?.mcqRecoveryCompleted),
    },
    {
      label: "Proof rebuilt",
      value: `${labProofCompletion.completed}/${labProofCompletion.target}`,
      detail: "Rebuild the History proof with timeline, map/source, actor, consequence, and UPSC exception.",
      complete: labProofCompletion.complete,
    },
    {
      label: "Retest route",
      value: activeProgress?.mcqRecoveryCompleted ? "Unlocked" : "Locked",
      detail: activeProgress?.mcqRecoveryCompleted
        ? "Recovery saved. Retest the same fresh practice batch."
        : "Mark recovered only after the repair note is written.",
      complete: Boolean(activeProgress?.mcqRecoveryCompleted),
    },
  ];
  const recoveryReturnHref = isMcqRecoveryFlow
    ? `${basePath}/mcq-readiness?day=${activeSession.day}`
    : `${basePath}/talk?day=${activeSession.day}`;
  const recoveryReturnLabel = isMcqRecoveryFlow ? "Retest fresh MCQs" : "Return to AI teacher";
  const recoveryWeakPoint = isMcqRecoveryFlow
    ? "Fresh MCQ trap"
    : activeProgress?.activePromptLabel ?? activeProgress?.talkBand ?? nextGate.label;
  const recoveryFocus =
    activeProgress?.mcqReviewSummary ??
    activeProgress?.assessmentSummary ??
    activeProgress?.talkVerdict ??
    activeStep.instruction;
  const themeStyle = getSubjectThemeStyle(plan);

  useEffect(() => {
    if (!isLoaded || userSelectedDayRef.current) return;
    setActiveDay(suggestedDay);
  }, [isLoaded, suggestedDay]);

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), plan.sessions.length);
    userSelectedDayRef.current = true;
    setActiveDay(boundedDay);
    setActiveStepIndex(0);
    setRecoveryNote("");
    setJustRecovered(false);
    setRecoveredFromMcq(false);
    router.replace(`${basePath}/revisit?day=${boundedDay}`, { scroll: false });
  };

  const markRecovered = () => {
    setRecoveredFromMcq(isMcqTriggeredRevisit);
    const trimmedRecoveryNote = recoveryNote.trim();
    const recoverySourceOutcome = activeProgress?.mcqTotal
      ? `${activeProgress.mcqCorrectCount ?? 0}/${activeProgress.mcqTotal} correct (${activeProgress.mcqScorePercent ?? 0}%)`
      : activeProgress?.mcqRecoverySourceOutcome ?? "Fresh MCQ revisit";
    const recoverySummary = isMcqTriggeredRevisit
      ? `${recoverySourceOutcome}. Recovery proof saved; retest fresh MCQs for ${activeSession.title}.`
      : undefined;
    saveDayProgress(activeSession.day, {
      revisitQueued: false,
      confidence: "Working",
      reflection: trimmedRecoveryNote
        ? `${activeProgress?.reflection ?? ""}\n\nRecovery note: ${trimmedRecoveryNote}`.trim()
        : activeProgress?.reflection,
      activePromptLabel: isMcqTriggeredRevisit ? "MCQ Revisit" : "Revisit",
      ...(isMcqTriggeredRevisit
        ? {
            mcqRecoveryCompleted: true,
            mcqRecoveryNote: trimmedRecoveryNote || "History MCQ recovery marked from Revisit room.",
            mcqRecoverySummary: recoverySummary,
            mcqRecoverySourceOutcome: recoverySourceOutcome,
            mcqRecoveryCompletedAt: new Date().toISOString(),
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
            mcqReadinessStatus: "practice-ready",
            mcqNextRoute: `${basePath}/mcq-readiness?day=${activeSession.day}`,
            mcqNextActionLabel: "Retest fresh MCQs",
            mcqPreflightSummary: recoverySummary,
          }
        : {
            talkScore: undefined,
            talkBand: undefined,
            assessmentSummary: undefined,
            talkUnlockStage: undefined,
            talkVerdict: undefined,
            talkChallengeResponse: undefined,
            talkDiscussionStep: "explain",
          }),
    });
    setJustRecovered(true);
  };

  if (!isLoaded) {
    return (
      <div style={themeStyle} className="flex min-h-screen items-center justify-center bg-[var(--subject-bg)] text-[var(--subject-text)]">
        <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-6 text-sm font-black">
          Loading {plan.title} revisit queue...
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="subject-room-shell"
      data-room="revisit"
      data-subject={plan.slug}
      data-subject-accent={plan.accent}
      style={themeStyle}
      className="min-h-screen bg-[var(--subject-bg)] text-[var(--subject-text)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section data-testid="revisit-simple-step" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link href={basePath} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
                <ArrowLeft className="h-4 w-4" /> {plan.title} command room
              </Link>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">Revisit</Badge>
                <span className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] px-3 py-1 text-xs font-black text-[var(--subject-heading)]">
                  Day {activeSession.day}
                </span>
                <span className="rounded-md border border-[var(--subject-border)] bg-white px-3 py-1 text-xs font-bold text-[#5d675f]">
                  {isMcqRecoveryFlow ? "MCQ repair" : "Concept repair"}
                </span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--subject-accent)]">{activeSession.chapter}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
                {activeSession.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Repair the weak point once, then return to the next gate.
              </p>
              <div className="mt-4 rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Weak point</p>
                <p className="mt-1 text-base font-black leading-6 text-[var(--subject-heading)]">{recoveryWeakPoint}</p>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[#49675e]">{recoveryFocus}</p>
              </div>
            </div>

            {justRecovered ? (
              <div className="w-full rounded-lg border border-[var(--subject-accent)] bg-[var(--subject-light)] p-4 lg:max-w-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Next room</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--subject-heading)]">{recoveryReturnLabel}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                  {isMcqRecoveryFlow
                    ? "Retest the same fresh MCQ batch."
                    : `Return to ${nextGate.label}.`}
                </p>
                <Link
                  href={recoveryReturnHref}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90"
                >
                  {recoveryReturnLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>

          {activeProgress?.mcqReviewSummary ? (
            <details data-testid="revisit-mcq-summary" className="mt-5 rounded-md border border-[#ef9f27]/45 bg-[#fff4df] p-4">
              <summary className="cursor-pointer text-sm font-black text-[#6f4a12]">Why this was queued</summary>
              <p className="mt-3 text-sm font-bold leading-6 text-[#6f4a12]">{activeProgress.mcqReviewSummary}</p>
            </details>
          ) : null}

          <div className="mt-5 grid gap-5">
            <div className="rounded-lg border border-[var(--subject-border)] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Repair note</p>
              <h3 className="mt-1 text-lg font-black text-[var(--subject-heading)]">What was corrected?</h3>
              <textarea
                data-testid="subject-revisit-repair-note"
                value={recoveryNote}
                onChange={(event) => {
                  setRecoveryNote(event.target.value);
                  setJustRecovered(false);
                }}
                placeholder="Write the recovery note or corrected explanation here."
                className="mt-4 min-h-36 w-full resize-y rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4 text-sm font-semibold leading-6 text-[var(--subject-heading)] outline-none transition placeholder:text-[#8d8579] focus:border-[var(--subject-accent)] focus:ring-2 focus:ring-[var(--subject-ring)]"
              />
              <button
                type="button"
                data-testid="subject-revisit-mark-recovered"
                onClick={markRecovered}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90 sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4" /> Mark recovered
              </button>
              {justRecovered ? (
                <div data-testid="revisit-return-gate" className="mt-4 rounded-lg border border-[var(--subject-accent)] bg-[var(--subject-light)] p-4">
                  <p className="text-sm font-black text-[var(--subject-dark)]">Recovery saved locally.</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-[#49675e]">
                    {isMcqRecoveryFlow ? "Retest the fresh MCQ batch now." : `Next gate: ${nextGate.label}.`}
                  </p>
                  <Link
                    data-testid="revisit-primary-route"
                    href={recoveryReturnHref}
                    className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--subject-dark)] px-3 text-sm font-black text-white transition hover:brightness-90"
                  >
                    {recoveryReturnLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>

            <details data-testid="revisit-repair-gates" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
              <summary className="flex cursor-pointer list-none flex-col gap-3 text-sm font-black text-[var(--subject-dark)] sm:flex-row sm:items-center sm:justify-between">
                <span>Optional gate snapshot</span>
                <span className="rounded-md bg-white px-3 py-2 text-[11px] font-black text-[var(--subject-heading)] ring-1 ring-[var(--subject-ring)]">
                  Open proof gates
                </span>
              </summary>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  {
                    label: "Watch",
                    value: `${watchCompletion.completed}/${watchCompletion.target}`,
                    complete: watchCompletion.complete,
                    icon: Video,
                  },
                  {
                    label: "Talk",
                    value: activeProgress?.talkScore ? `${activeProgress.talkScore}%` : "Not scored",
                    complete: talkMcqReady,
                    icon: BrainCircuit,
                  },
                  {
                    label: "Lab",
                    value: `${labProofCompletion.completed}/${labProofCompletion.target}`,
                    complete: labProofCompletion.complete,
                    icon: LockKeyhole,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-md border bg-white p-3",
                      item.complete ? "border-[var(--subject-accent)]" : "border-[#ef9f27]/40"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <item.icon className={cn("h-4 w-4", item.complete ? "text-[var(--subject-accent)]" : "text-[#9a6a16]")} />
                      {item.complete ? <CheckCircle2 className="h-4 w-4 text-[var(--subject-accent)]" /> : null}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--subject-accent)]">{item.label}</p>
                    <p className="mt-1 text-sm font-black text-[var(--subject-heading)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>

          <details data-testid="subject-revisit-recovery-checklist" className="mt-5 rounded-lg border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
            <summary className="cursor-pointer text-sm font-black text-[var(--subject-dark)]">
              Optional recovery checklist
            </summary>
            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {recoverySteps.map((step, index) => {
                const isActive = activeStepIndex === index;
                return (
                  <button
                    key={step.label}
                    type="button"
                    aria-pressed={isActive}
                    data-testid={`subject-revisit-step-${step.label.toLowerCase()}`}
                    onClick={() => setActiveStepIndex(index)}
                    className={cn(
                      "min-h-16 rounded-md border p-2 text-left text-xs font-black transition",
                      isActive
                        ? "border-[var(--subject-dark)] bg-[var(--subject-dark)] text-white"
                        : "border-[var(--subject-border)] bg-white text-[var(--subject-heading)] hover:border-[var(--subject-accent)]"
                    )}
                  >
                    <span className="block text-[10px] uppercase tracking-[0.12em]">Step {index + 1}</span>
                    <span className="mt-1 block">{step.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-md bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--subject-accent)]">Do this now</p>
              <p className="mt-2 text-base font-black leading-7 text-[var(--subject-heading)]">{activeStep.instruction}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">{activeStep.check}</p>
            </div>
          </details>
        </section>

        <details data-testid="revisit-advanced-tools" className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[var(--subject-dark)]">
            Advanced recovery queue and saved context
          </summary>
          <div className="mt-5 space-y-6">
        <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-lg border border-[var(--subject-border)] bg-[var(--subject-card)] p-5 shadow-sm md:p-7">
            <Link href={basePath} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--subject-dark)]">
              <ArrowLeft className="h-4 w-4" /> {plan.title} command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[var(--subject-accent)] px-3 py-1 text-white">Revisit</Badge>
              <span className="text-sm font-bold text-[#776f64]">Focused recovery</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--subject-accent)]">Day {activeSession.day}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--subject-heading)] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Confidence", activeProgress?.confidence ?? "Not marked"],
                ["Queue", activeProgress?.revisitQueued ? "Revisit queued" : "Not queued"],
                ["MCQ", activeProgress?.mcqAttempted ? `${activeProgress.mcqScorePercent ?? 0}% ${activeProgress.mcqOutcome ?? "Pending"}` : "Not attempted"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[var(--subject-border)] bg-[var(--subject-bg)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--subject-accent)]">{label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[var(--subject-heading)]">{value}</p>
                </div>
              ))}
            </div>

            {activeProgress?.mcqReviewSummary && (
              <div data-testid="revisit-mcq-summary-detail" className="mt-4 rounded-md border border-[#ef9f27]/45 bg-[#fff4df] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6f4a12]">MCQ trigger</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#6f4a12]">{activeProgress.mcqReviewSummary}</p>
              </div>
            )}

            {showHistoryMcqRecoveryCommand ? (
              <div
                data-testid="history-mcq-recovery-command"
                className="mt-4 rounded-lg border border-[#ef9f27]/45 bg-[#fff8ea] p-4"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">
                      History MCQ recovery command
                    </p>
                    <h2 className="mt-2 text-xl font-black tracking-tight text-[#332514]">
                      Repair the failed trap before retest
                    </h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#6f4a12]">
                      {activeProgress?.mcqRecoverySummary ??
                        activeProgress?.mcqReviewSummary ??
                        "Use the wrong MCQ attempt to rebuild chronology, source-map proof, actor, consequence, and UPSC exception."}
                    </p>
                  </div>
                  <span className="max-w-full break-words rounded-md bg-white px-3 py-2 text-xs font-black text-[#6f4a12] ring-1 ring-[#ef9f27]/30 sm:shrink-0">
                    {mcqRecoverySourceOutcome}
                  </span>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {historyMcqRecoverySteps.map((step) => (
                    <div
                      key={step.label}
                      className={cn(
                        "rounded-md border bg-white p-3",
                        step.complete ? "border-[#1d9e75]/35" : "border-[#ef9f27]/35"
                      )}
                    >
                      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9a6a16]">{step.label}</p>
                        <span className="max-w-full break-words rounded-md bg-[#f7f4ee] px-2 py-1 text-[11px] font-black text-[#332514]">
                          {step.value}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold leading-5 text-[#6f4a12]">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`${basePath}/talk?day=${activeSession.day}`}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[var(--subject-dark)] transition hover:bg-[var(--subject-light)] sm:w-auto"
              >
                <BrainCircuit className="h-4 w-4" /> Talk room
              </Link>
              <div
                className={cn(
                  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-bold ring-1 sm:w-auto",
                  isMcqRecoveryFlow
                    ? "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/40"
                    : "bg-[#f7f4ee] text-[#776f64] ring-[#dcd5c7]"
                )}
                title={
                  isMcqRecoveryFlow
                    ? "This recovery was triggered by fresh MCQ practice. Recovered students should retest the batch."
                    : "Fresh practice opens after Watch scenes, AI teacher command, and Lab proof are complete."
                }
              >
                <LockKeyhole className="h-4 w-4" /> {isMcqRecoveryFlow ? "MCQ retest after recovery" : "MCQ after proof gates"}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Recovery queue</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Choose a weak day</h2>
              </div>
              <TimerReset className="h-6 w-6 text-[#085041]" />
            </div>

            {queueDays.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#dcd5c7] bg-[#fdfaf3] p-6">
                <Sparkles className="mb-4 h-6 w-6 text-[#ef9f27]" />
                <p className="text-base font-black text-[#13251d]">No revisit queue yet.</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#657066]">
                  Mark a day as shaky or queue it from the Talk room. Until then, this page opens Day {activeSession.day} as a sample recovery session.
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {queueDays.map((session) => {
                  const item = getDayProgress(session.day);
                  const isActive = activeSession.day === session.day;
                  return (
                    <button
                      key={session.day}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => selectDay(session.day)}
                      className={cn(
                        "min-h-20 rounded-md border p-3 text-left transition",
                        isActive
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                      )}
                    >
                      <span className="block text-xs font-black uppercase tracking-[0.16em]">
                        Day {session.day} / {item?.confidence ?? "Working"}
                      </span>
                      <span className="mt-2 block text-sm font-bold leading-5">{session.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Recovery drill</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">{activeStep.label}</h2>
              </div>
              <RotateCcw className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-2 sm:grid-cols-5">
              {recoverySteps.map((step, index) => {
                const isActive = activeStepIndex === index;
                return (
                  <button
                    key={step.label}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveStepIndex(index)}
                    className={cn(
                      "min-h-14 rounded-md border px-3 text-left text-xs font-black transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    {index + 1}. {step.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Instruction</p>
              <p className="mt-3 text-lg font-black leading-8 text-[#13251d]">{activeStep.instruction}</p>
              <div className="mt-4 flex items-start gap-3 rounded-md bg-white/75 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                <p className="text-sm font-semibold leading-6 text-[#49675e]">{activeStep.check}</p>
              </div>
            </div>

            {historyRecoveryDeck ? (
              <div
                data-testid="history-revisit-retest-protocol"
                className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
              >
                <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#be123c]">
                      History retest protocol
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">
                      {historyRecoveryDeck.title}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#657066]">
                      {historyRecoveryDeck.prompt}
                    </p>
                  </div>
                  <span className="max-w-full break-words rounded-md bg-white px-3 py-2 text-xs font-black text-[#4c0519] ring-1 ring-[#fecdd3] sm:shrink-0">
                    {activeSession.chapter}
                  </span>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  {historyRecoveryDeck.rails.map((rail, index) => (
                    <div key={`${rail.label}-${index}`} className="rounded-md border border-[#e5d6c7] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#be123c]">
                        {rail.marker}
                      </p>
                      <p className="mt-2 text-sm font-black leading-5 text-[#13251d]">{rail.label}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-[#657066]">{rail.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <div className="rounded-md bg-[#fff4df] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9a6a16]">Trap clinic</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#6f4a12]">
                      {historyRecoveryDeck.trapClinic.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#e7f5ee] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Recognition proof</p>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#085041]">
                      {historyRecoveryDeck.recognition.map((item) => item.value).join(" / ")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div data-testid="revisit-repair-gates-detail" className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                {
                  label: "Watch scenes",
                  value: `${watchCompletion.completed}/${watchCompletion.target}`,
                  complete: watchCompletion.complete,
                  icon: Video,
                },
                {
                  label: "95% recall",
                  value: activeProgress?.talkScore ? `${activeProgress.talkScore}%` : "Not scored",
                  complete: talkMcqReady,
                  icon: BrainCircuit,
                },
                {
                  label: "Visual support",
                  value: `${labProofCompletion.completed}/${labProofCompletion.target}`,
                  complete: labProofCompletion.complete,
                  icon: LockKeyhole,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-md border p-3",
                    item.complete ? "border-[#1d9e75]/40 bg-[#e7f5ee]" : "border-[#ef9f27]/40 bg-[#fff4df]"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <item.icon className={cn("h-4 w-4", item.complete ? "text-[#085041]" : "text-[#9a6a16]")} />
                    {item.complete ? <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" /> : null}
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                  <p className="mt-1 text-sm font-black text-[#13251d]">{item.value}</p>
                </div>
              ))}
            </div>

            <textarea
              value={recoveryNote}
              onChange={(event) => {
                setRecoveryNote(event.target.value);
                setJustRecovered(false);
              }}
              placeholder="Write the recovery note or corrected explanation here."
              className="mt-5 min-h-40 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
            />

            <button
              type="button"
              onClick={markRecovered}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d] sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark recovered
            </button>

            {justRecovered && (
              <div data-testid="revisit-return-gate-detail" className="mt-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <div>
                    <p className="text-sm font-black text-[#085041]">Recovery saved locally.</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#49675e]">
                      {isMcqRecoveryFlow
                        ? "The revisit queue is cleared. Watch, Talk, and Lab proof stay intact. Retest the fresh MCQ batch now."
                        : `The revisit queue is cleared. Next gate: ${nextGate.label}. Return to the AI teacher and score command-level before MCQs reopen.`}
                    </p>
                  </div>
                </div>
                <Link
                  data-testid="revisit-primary-route-detail"
                  href={recoveryReturnHref}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d] sm:w-auto"
                >
                  {recoveryReturnLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Saved context</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">Original reflection</h2>
              <div className="mt-5 whitespace-pre-wrap rounded-md bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#657066]">
                {activeProgress?.reflection?.trim() || "No reflection saved yet. Use the Talk room first for richer recovery."}
              </div>
            </div>

            <SubjectLoopActions plan={plan} activeDay={activeSession.day} current="revisit" />
          </div>
        </section>
          </div>
        </details>
      </div>
    </div>
  );
}
