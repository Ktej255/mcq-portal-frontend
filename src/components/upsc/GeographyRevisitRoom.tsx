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
  LockKeyhole,
  MapPinned,
  PlayCircle,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  TimerReset,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyLoopActions } from "@/components/upsc/GeographyLoopActions";
import { geographySessions, GeographySession } from "@/lib/upsc/plan";
import type { GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import type { GeographyRecoveryProofStage } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

type RecoveryStep = {
  id: GeographyRecoveryProofStage;
  label: string;
  instruction: string;
  check: string;
};

function buildRecoverySteps(session: GeographySession): RecoveryStep[] {
  return [
    {
      id: "recall",
      label: "Recall",
      instruction: `Without notes, write the core idea of ${session.title} in three lines.`,
      check: "Can you name the variables before reading your old reflection?",
    },
    {
      id: "explain",
      label: "Explain",
      instruction: session.talk,
      check: "Can you explain the cause and mechanism without memorized phrasing?",
    },
    {
      id: "map",
      label: "Map",
      instruction: `Place ${session.title} on a map, region, river, coast, relief feature, or climate belt.`,
      check: "Can you connect the concept to a visible location pattern?",
    },
    {
      id: "trap",
      label: "Trap",
      instruction: `Create one wrong UPSC-style statement about ${session.title}, then correct it.`,
      check: "Can you spot the exception or overgeneralization?",
    },
    {
      id: "retest",
      label: "Retest",
      instruction: session.test,
      check: "Can you now face a fresh MCQ or short answer without hesitation?",
    },
  ];
}

function labSlugForSession(labTitle: string) {
  if (labTitle === "Monsoon Simulator") return "monsoon";
  if (labTitle === "India Interactive Map") return "india-map";
  if (labTitle === "Disaster Link") return "disaster-link";
  if (labTitle === "Environment Bridge") return "environment-bridge";
  if (labTitle === "MCQ Engine") return "mcq-engine";
  return "earth-layers";
}

function recoveryProofId(day: number, step: RecoveryStep) {
  return `${day}-recovery-${step.id}`;
}

function recoveryStatusClass(status: string) {
  if (status === "Done") return "bg-[#e7f5ee] text-[#085041] ring-[#1d9e75]/25";
  if (status === "Active") return "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/30";
  if (status === "Locked") return "bg-[#f7f4ee] text-[#776f64] ring-[#dcd5c7]";
  return "bg-white text-[#49675e] ring-[#dcd5c7]";
}

function buildRecoveryDiagnosis(session: GeographySession, progress?: GeographyDayProgress) {
  const rubric = progress?.talkRubric ?? progress?.talkPreliminaryRubric ?? [];
  const weakest = rubric.length
    ? [...rubric].sort((first, second) => first.score / first.max - second.score / second.max)[0]
    : null;
  const repairHints = progress?.talkRepairHints ?? progress?.talkPreliminaryRepairHints ?? [];
  const weakSkill = weakest?.label ?? (progress?.confidence === "Shaky" ? "Concept recall" : "General recovery");
  const scoreLine = weakest ? `${weakest.score}/${weakest.max} ${weakest.status}` : "No rubric captured";
  const primaryHint =
    repairHints[0] ??
    (weakest?.evidence || `Rebuild ${session.title} through concept, mechanism, map proof, and UPSC trap.`);

  return {
    weakSkill,
    scoreLine,
    primaryHint,
    repairHints,
    summary: `${weakSkill}: ${scoreLine}. ${primaryHint}`,
  };
}

function buildRecoveryScaffold(session: GeographySession, step: RecoveryStep, diagnosis: ReturnType<typeof buildRecoveryDiagnosis>) {
  const base = `${diagnosis.weakSkill} repair for ${session.title}`;
  const scaffolds: Record<GeographyRecoveryProofStage, string> = {
    recall: `${base}. Core recall: ${session.title} means ${session.anchor}. I will name the variables before adding detail.`,
    explain: `${base}. Mechanism: cause -> process -> effect -> exception. ${diagnosis.primaryHint}`,
    map: `${base}. Map proof: attach the idea to one region, river, coast, relief feature, climate belt, or Indian example.`,
    trap: `${base}. UPSC trap: write one almost-correct statement, then correct the exception or overgeneralization.`,
    retest: `${base}. Retest answer: concept, mechanism, map/example, trap. I am ready to explain again in Talk before MCQs.`,
  };

  return scaffolds[step.id];
}

export function GeographyRevisitRoom({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress, stats } = useGeographyProgress();
  const boundedInitialDay =
    initialDay && Number.isFinite(initialDay) ? Math.min(Math.max(initialDay, 1), geographySessions.length) : undefined;
  const suggestedDay = boundedInitialDay ?? stats.revisitDays[0]?.day ?? stats.shakyDays[0]?.day ?? 10;
  const [activeDay, setActiveDay] = useState(suggestedDay);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [recoveryNote, setRecoveryNote] = useState("");
  const [justRecovered, setJustRecovered] = useState(false);
  const userSelectedDayRef = useRef(false);

  const activeSession = geographySessions.find((session) => session.day === activeDay) ?? geographySessions[0];
  const activeProgress = getDayProgress(activeSession.day);
  const recoverySteps = useMemo(() => buildRecoverySteps(activeSession), [activeSession]);
  const activeStep = recoverySteps[activeStepIndex];
  const queueDays = stats.revisitDays.length > 0 ? stats.revisitDays : stats.shakyDays;
  const labSlug = labSlugForSession(activeSession.lab);
  const recoveryProofIds = activeProgress?.recoveryProofCompletedIds ?? [];
  const recoveryProofCount = Math.min(recoveryProofIds.length, recoverySteps.length);
  const recoveryCompletion = Math.round((recoveryProofCount / recoverySteps.length) * 100);
  const activeRecoveryProofId = recoveryProofId(activeSession.day, activeStep);
  const isActiveStepComplete = recoveryProofIds.includes(activeRecoveryProofId);
  const isRecoveryComplete = Boolean(activeProgress?.recoveryCompleted) && recoveryProofCount >= recoverySteps.length;
  const recoveryDiagnosis = useMemo(
    () => buildRecoveryDiagnosis(activeSession, activeProgress),
    [activeSession, activeProgress]
  );
  const recoveryScaffold = useMemo(
    () => buildRecoveryScaffold(activeSession, activeStep, recoveryDiagnosis),
    [activeSession, activeStep, recoveryDiagnosis]
  );
  const derivedRecoveryStatus = isRecoveryComplete ? "talk-ready" : "recovery-pending";
  const recoveryStatus = activeProgress?.recoveryStatus ?? derivedRecoveryStatus;
  const recoveryNextRoute =
    activeProgress?.recoveryNextRoute ??
    (isRecoveryComplete ? `/upsc/geography/talk?day=${activeSession.day}` : `/upsc/geography/revisit?day=${activeSession.day}`);
  const recoveryNextActionLabel =
    activeProgress?.recoveryNextActionLabel ?? (isRecoveryComplete ? "Return to AI teacher" : "Finish recovery proof");
  const recoveryEvidenceAnchor =
    activeProgress?.recoveryEvidenceAnchor ?? `${activeSession.title} / ${recoveryDiagnosis.weakSkill}`;
  const recoveryLedgerItems = [
    {
      label: "Diagnosis",
      status: "Done",
      detail: recoveryDiagnosis.weakSkill,
    },
    {
      label: "Recovery proof",
      status: isRecoveryComplete ? "Done" : "Active",
      detail: `${recoveryProofCount}/${recoverySteps.length} saved`,
    },
    {
      label: "Talk reset",
      status: isRecoveryComplete ? "Done" : "Locked",
      detail: isRecoveryComplete ? "Old Talk score cleared" : "Clears after all proofs",
    },
    {
      label: "Return route",
      status: isRecoveryComplete ? "Active" : "Pending",
      detail: recoveryNextActionLabel,
    },
  ];

  useEffect(() => {
    if (!isLoaded || userSelectedDayRef.current) return;
    setActiveDay(suggestedDay);
  }, [isLoaded, suggestedDay]);

  useEffect(() => {
    if (!isLoaded) return;
    const saved = getDayProgress(activeDay);
    setActiveStepIndex(Math.min(saved?.recoveryStepIndex ?? saved?.recoveryProofCompletedIds?.length ?? 0, recoverySteps.length - 1));
    setRecoveryNote("");
    setJustRecovered(false);
  }, [activeDay, getDayProgress, isLoaded, recoverySteps.length]);

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), geographySessions.length);
    userSelectedDayRef.current = true;
    setActiveDay(boundedDay);
    setActiveStepIndex(0);
    setRecoveryNote("");
    setJustRecovered(false);
    router.replace(`/upsc/geography/revisit?day=${boundedDay}`, { scroll: false });
  };

  const saveRecoveryProof = () => {
    const note = recoveryNote.trim();
    const nextProofIds = Array.from(new Set([...recoveryProofIds, activeRecoveryProofId]));
    const nextProofNotes = {
      ...(activeProgress?.recoveryProofNotes ?? {}),
      [activeRecoveryProofId]: note || activeStep.check,
    };
    const nextStepIndex = Math.min(activeStepIndex + 1, recoverySteps.length - 1);
    const allProofsComplete = nextProofIds.length >= recoverySteps.length;
    const recoveryLine = `${activeStep.label}: ${note || activeStep.check}`;
    const nextRecoveryStatus = allProofsComplete ? "talk-ready" : "recovery-pending";
    const nextRecoveryRoute = allProofsComplete
      ? `/upsc/geography/talk?day=${activeSession.day}`
      : `/upsc/geography/revisit?day=${activeSession.day}`;
    const nextRecoveryAction = allProofsComplete ? "Return to AI teacher" : "Finish recovery proof";
    const nextRecoveryAnchor = `${activeSession.title} / ${recoveryDiagnosis.weakSkill} / ${activeStep.label}`;
    const returnPrompt = [
      `Recovered weak skill: ${recoveryDiagnosis.weakSkill}.`,
      `Recovery proof: ${recoveryLine}`,
      `Now explain ${activeSession.title} in Talk through concept, mechanism, map/example, and UPSC trap.`,
    ].join(" ");

    saveDayProgress(activeSession.day, {
      revisitQueued: allProofsComplete ? false : activeProgress?.revisitQueued,
      confidence: allProofsComplete ? "Working" : activeProgress?.confidence,
      reflection: allProofsComplete
        ? `${activeProgress?.reflection ?? ""}\n\nRecovery proof: ${recoveryLine}`.trim()
        : activeProgress?.reflection,
      activePromptLabel: "Revisit",
      recoveryCompleted: allProofsComplete,
      recoveryStepIndex: nextStepIndex,
      recoveryProofCompletedIds: nextProofIds,
      recoveryProofNotes: nextProofNotes,
      recoverySummary: recoveryLine,
      recoveryWeakSkill: recoveryDiagnosis.weakSkill,
      recoveryDiagnosisSummary: recoveryDiagnosis.summary,
      recoveryReturnPrompt: allProofsComplete ? returnPrompt : activeProgress?.recoveryReturnPrompt,
      recoveryStatus: nextRecoveryStatus,
      recoveryEvidenceAnchor: nextRecoveryAnchor,
      recoveryNextRoute: nextRecoveryRoute,
      recoveryNextActionLabel: nextRecoveryAction,
      talkScore: allProofsComplete ? undefined : activeProgress?.talkScore,
      talkBand: allProofsComplete ? undefined : activeProgress?.talkBand,
      assessmentSummary: allProofsComplete ? undefined : activeProgress?.assessmentSummary,
      talkTranscript: allProofsComplete ? undefined : activeProgress?.talkTranscript,
      talkUnlockStage: allProofsComplete ? undefined : activeProgress?.talkUnlockStage,
      talkVerdict: allProofsComplete ? undefined : activeProgress?.talkVerdict,
      talkChallengeResponse: allProofsComplete ? undefined : activeProgress?.talkChallengeResponse,
      talkDiscussionStep: allProofsComplete ? "explain" : activeProgress?.talkDiscussionStep,
      talkRubric: allProofsComplete ? undefined : activeProgress?.talkRubric,
      talkRepairHints: allProofsComplete ? undefined : activeProgress?.talkRepairHints,
      talkPreliminaryScore: allProofsComplete ? undefined : activeProgress?.talkPreliminaryScore,
      talkPreliminaryBand: allProofsComplete ? undefined : activeProgress?.talkPreliminaryBand,
      talkPreliminarySummary: allProofsComplete ? undefined : activeProgress?.talkPreliminarySummary,
      talkPreliminaryUnlockStage: allProofsComplete ? undefined : activeProgress?.talkPreliminaryUnlockStage,
      talkPreliminaryRubric: allProofsComplete ? undefined : activeProgress?.talkPreliminaryRubric,
      talkPreliminaryRepairHints: allProofsComplete ? undefined : activeProgress?.talkPreliminaryRepairHints,
    });
    setActiveStepIndex(nextStepIndex);
    setRecoveryNote("");
    setJustRecovered(allProofsComplete);
  };

  const loadRecoveryScaffold = () => {
    setRecoveryNote(recoveryScaffold);
    setJustRecovered(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading Geography revisit queue...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> Geography command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Revisit</Badge>
              <span className="text-sm font-bold text-[#776f64]">Focused recovery</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">Day {activeSession.day}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              {activeSession.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Confidence", activeProgress?.confidence ?? "Not marked"],
                ["Queue", activeProgress?.revisitQueued ? "Revisit queued" : "Not queued"],
                ["Recovery proof", `${recoveryProofCount}/${recoverySteps.length}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
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
              <Link
                href={`/upsc/geography/talk?day=${activeSession.day}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                <BrainCircuit className="h-4 w-4" /> Talk room
              </Link>
              <div
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#f7f4ee] px-3 text-sm font-bold text-[#776f64] ring-1 ring-[#dcd5c7]"
                title="MCQ readiness opens after the Talk Room oral check reaches Practice or Command."
              >
                <LockKeyhole className="h-4 w-4" /> MCQ after Talk gate
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
                const isComplete = recoveryProofIds.includes(recoveryProofId(activeSession.day, step));
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
                        : isComplete
                          ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      {index + 1}. {step.label}
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <div data-testid="revisit-diagnosis-board" className="mt-5 rounded-lg border border-[#f0d5a8] bg-[#fff4df] p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a6a16]">AI teacher diagnosis</p>
                  <h3 className="mt-1 text-lg font-black text-[#332514]">{recoveryDiagnosis.weakSkill}</h3>
                  <p className="mt-2 break-words text-sm font-bold leading-6 text-[#6f4a12]">{recoveryDiagnosis.summary}</p>
                </div>
                <span className="inline-flex min-h-9 items-center rounded-md bg-white/75 px-3 text-xs font-black text-[#6f4a12] ring-1 ring-[#ef9f27]/30">
                  {recoveryDiagnosis.scoreLine}
                </span>
              </div>
              {recoveryDiagnosis.repairHints.length > 0 ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {recoveryDiagnosis.repairHints.slice(0, 4).map((hint) => (
                    <p key={hint} className="rounded-md bg-white/75 p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                      {hint}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

            <div data-testid="revisit-recovery-proof" className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#f3fbf7] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recovery proof gate</p>
                  <h3 className="mt-1 text-lg font-black text-[#13251d]">
                    {recoveryProofCount}/{recoverySteps.length} recovery steps complete
                  </h3>
                </div>
                {isRecoveryComplete ? (
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black text-white">
                    <CheckCircle2 className="h-4 w-4" /> Recovery complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#fff4df] px-3 py-2 text-xs font-black text-[#6f4a12] ring-1 ring-[#ef9f27]/30">
                    <LockKeyhole className="h-4 w-4" /> Queue stays locked
                  </span>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${recoveryCompletion}%` }} />
              </div>
            </div>

            <div data-testid="revisit-recovery-ledger" className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recovery evidence ledger</p>
                  <h3 className="mt-1 text-lg font-black text-[#13251d]">Return decision is locally saved</h3>
                  <p data-testid="revisit-recovery-anchor" className="mt-2 break-words text-sm font-bold leading-6 text-[#657066]">
                    {recoveryEvidenceAnchor}
                  </p>
                </div>
                <span
                  data-testid="revisit-recovery-status"
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-md px-3 text-xs font-black uppercase tracking-[0.12em] ring-1",
                    recoveryStatus === "talk-ready"
                      ? "bg-[#e7f5ee] text-[#085041] ring-[#1d9e75]/25"
                      : "bg-[#fff4df] text-[#6f4a12] ring-[#ef9f27]/30"
                  )}
                >
                  {recoveryStatus === "talk-ready" ? "Talk ready" : "Recovery pending"}
                </span>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                {recoveryLedgerItems.map((item) => (
                  <div key={item.label} className="rounded-md border border-[#ece4d6] bg-[#fdfaf3] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.label}</p>
                      <span className={cn("rounded-md px-2 py-1 text-[10px] font-black uppercase ring-1", recoveryStatusClass(item.status))}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 break-words text-xs font-bold leading-5 text-[#49675e]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#f3fbf7] p-3">
                <p data-testid="revisit-next-decision" className="text-sm font-black text-[#085041]">
                  Next: {recoveryNextActionLabel}
                </p>
                <Link
                  href={recoveryNextRoute}
                  className={cn(
                    "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition",
                    isRecoveryComplete
                      ? "bg-[#1a3a2a] text-white hover:bg-[#10291d]"
                      : "border border-[#cfc6b6] bg-white text-[#1a3a2a] hover:bg-[#f2eadc]"
                  )}
                >
                  {recoveryNextActionLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div data-testid="revisit-proof-scaffold" className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#f3fbf7] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recovery seed</p>
                  <p className="mt-2 break-words text-sm font-bold leading-6 text-[#49675e]">{recoveryScaffold}</p>
                </div>
                <button
                  type="button"
                  data-testid="revisit-load-proof-scaffold"
                  onClick={loadRecoveryScaffold}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  <Sparkles className="h-4 w-4" /> Load seed
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Instruction</p>
              <p className="mt-3 text-lg font-black leading-8 text-[#13251d]">{activeStep.instruction}</p>
              <div className="mt-4 flex items-start gap-3 rounded-md bg-white/75 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                <p className="text-sm font-semibold leading-6 text-[#49675e]">{activeStep.check}</p>
              </div>
            </div>

            <textarea
              data-testid="revisit-recovery-note"
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
              data-testid="revisit-save-proof"
              onClick={saveRecoveryProof}
              disabled={recoveryNote.trim().length < 20 && !isActiveStepComplete}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" /> {isActiveStepComplete ? "Proof saved" : "Save recovery proof"}
            </button>

            {(justRecovered || isRecoveryComplete) && (
              <div data-testid="revisit-return-gate" className="mt-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <div>
                    <p className="text-sm font-black text-[#085041]">Recovery saved locally.</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#49675e]">
                      The revisit queue is cleared. Now return to the AI teacher and explain again before MCQs reopen.
                    </p>
                  </div>
                </div>
                <Link
                  data-testid="revisit-primary-route"
                  href={`/upsc/geography/talk?day=${activeSession.day}`}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  Return to AI teacher <ArrowRight className="h-4 w-4" />
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

            <GeographyLoopActions activeDay={activeSession.day} labSlug={labSlug} current="revisit" onSelectDay={selectDay} />
          </div>
        </section>
      </div>
    </div>
  );
}
