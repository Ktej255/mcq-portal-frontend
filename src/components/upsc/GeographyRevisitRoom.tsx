"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCcw,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import { useGeographyProgress, type GeographyRecoveryProofStage } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

type RecoveryStep = {
  id: GeographyRecoveryProofStage;
  label: string;
  prompt: string;
};

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function buildRecoverySteps(session: GeographySession): RecoveryStep[] {
  return [
    { id: "recall", label: "Recall", prompt: `Say the core idea of ${session.title} without notes.` },
    { id: "explain", label: "Explain", prompt: session.talk },
    { id: "map", label: "Map", prompt: "Attach the concept to one place, pattern, region, or example." },
    { id: "trap", label: "Trap", prompt: "Write one UPSC-style wrong statement and fix it." },
    { id: "retest", label: "Retest", prompt: "Return to Talk and explain again." },
  ];
}

function proofId(day: number, stage: GeographyRecoveryProofStage) {
  return `${day}-recovery-${stage}`;
}

export function GeographyRevisitRoom({ initialDay }: { initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress, stats } = useGeographyProgress();
  const suggestedDay = initialDay ?? stats.revisitDays[0]?.day ?? stats.spacedRevisionDays[0]?.day ?? stats.shakyDays[0]?.day ?? 1;
  const [activeDay] = useState(resolveSession(suggestedDay).day);
  const activeSession = resolveSession(activeDay);
  const progress = getDayProgress(activeSession.day);
  const recoverySteps = buildRecoverySteps(activeSession);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const allIds = recoverySteps.map((step) => proofId(activeSession.day, step.id));
  const completedCount = completedIds.filter((id) => allIds.includes(id)).length;
  const isComplete = completedCount >= recoverySteps.length || Boolean(progress?.recoveryCompleted);
  const noteReady = note.trim().length >= 24;
  const talkHref = `/upsc/geography/talk?day=${activeSession.day}`;
  const weakSkill =
    progress?.recoveryWeakSkill ??
    progress?.talkRubric?.find((item) => item.status !== "Ready")?.label ??
    (progress?.talkBand === "Revisit" ? "Core explanation" : "Concept clarity");
  const repairFocus =
    progress?.recoveryDiagnosisSummary ??
    progress?.assessmentSummary ??
    progress?.talkRepairHints?.[0] ??
    `Repair ${weakSkill} before attempting the topic again.`;

  useEffect(() => {
    if (!isLoaded || hydrated) return;

    const timer = window.setTimeout(() => {
      const savedProgress = getDayProgress(activeSession.day);
      setCompletedIds(savedProgress?.recoveryCompleted ? allIds : savedProgress?.recoveryProofCompletedIds ?? []);
      setNote(savedProgress?.recoverySummary ?? "");
      setSaved(false);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeSession.day, allIds, getDayProgress, hydrated, isLoaded]);

  const persistRecovery = (nextIds = completedIds, nextNote = note, goTalk = false) => {
    const done = nextIds.filter((id) => allIds.includes(id)).length >= recoverySteps.length;
    saveDayProgress(activeSession.day, {
      revisitQueued: !done,
      recoveryCompleted: done,
      recoveryProofCompletedIds: nextIds,
      recoveryProofNotes: {
        ...(progress?.recoveryProofNotes ?? {}),
        [`${activeSession.day}-recovery-summary`]: nextNote,
      },
      recoverySummary: nextNote || `Recovered ${activeSession.title} through recall, map, trap, and retest.`,
      recoveryWeakSkill: weakSkill,
      recoveryDiagnosisSummary: repairFocus,
      recoveryStatus: done ? "talk-ready" : "recovery-pending",
      recoveryEvidenceAnchor: `${activeSession.title} recovery`,
      recoveryNextRoute: done ? talkHref : `/upsc/geography/revisit?day=${activeSession.day}`,
      recoveryNextActionLabel: done ? "Return to discussion" : "Write one repair note",
      mcqRecommendedRoute: done ? talkHref : progress?.mcqRecommendedRoute,
      mcqNextRoute: done ? talkHref : progress?.mcqNextRoute,
      mcqNextActionLabel: done ? "Explain corrected answer" : progress?.mcqNextActionLabel,
      talkScore: done ? undefined : progress?.talkScore,
      talkBand: done ? undefined : progress?.talkBand,
      talkUnlockStage: done ? undefined : progress?.talkUnlockStage,
    });
    setSaved(true);
    if (goTalk && done) router.push(talkHref);
  };

  const toggleStep = (stage: GeographyRecoveryProofStage) => {
    const id = proofId(activeSession.day, stage);
    const next = completedIds.includes(id) ? completedIds.filter((item) => item !== id) : [...completedIds, id];
    setCompletedIds(next);
    persistRecovery(next);
  };

  const completeRecovery = () => {
    if (!noteReady) return;
    setCompletedIds(allIds);
    persistRecovery(allIds, note, true);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Opening Revisit...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section
          data-testid="geography-revisit-simple-panel"
          data-visible-mode="one-note-one-action"
          data-student-surface="repair-first"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-6"
        >
          <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
            <ArrowLeft className="h-4 w-4" /> Day funnel
          </Link>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Revise</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span className="text-sm font-semibold text-[#746f66]">Weak-point repair</span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{activeSession.title}</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Repair only this weak point, then explain again. No full class repeat.
              </p>

              <div data-testid="geography-revisit-focus" className="mt-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Learning gap</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">{weakSkill}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">{repairFocus}</p>
              </div>

              <div data-testid="geography-revisit-note-surface" className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                    <Save className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Repair note</p>
                    <h2 className="text-base font-black tracking-tight">What did you correct?</h2>
                  </div>
                </div>
                <textarea
                  data-testid="revisit-repair-note"
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                    setSaved(false);
                  }}
                  onBlur={() => {
                    if (note.trim()) persistRecovery(completedIds, note);
                  }}
                  placeholder="Example: I confused latitude with longitude. Now I can explain direction, climate link, and time-zone logic."
                  className="min-h-32 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                />
                {saved && <p className="mt-3 text-sm font-black text-[#1d9e75]">Repair note saved.</p>}
              </div>
            </div>

            <div
              data-testid="geography-revisit-action-card"
              data-student-surface="primary-action"
              className={cn("rounded-lg border p-4", isComplete ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#ef9f27]/55 bg-[#fff4df]")}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Do now</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{isComplete ? "Return to discussion" : "Write one repair note"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {isComplete ? "Weak point repair is saved. Explain the corrected idea again." : "Name the mistake and the corrected idea. Then return to Talk."}
              </p>
              {isComplete ? (
                <Link
                  data-testid="revisit-primary-route"
                  href={talkHref}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  Open discussion <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  data-testid="revisit-complete-and-talk"
                  onClick={completeRecovery}
                  disabled={!noteReady}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Save note and discuss <RefreshCcw className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <details
            data-testid="geography-revisit-path-strip"
            className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-xs font-black text-[#31443a]"
          >
            <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.16em] text-[#085041]">
              Route logic
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {[
                ["1", "Gap", "Only this weak point"],
                ["2", "Repair note", "One corrected idea"],
                ["3", "Talk 95%", "Explain again"],
                ["4", "MCQ", "Then next topic"],
              ].map(([number, label, detail]) => (
                <div key={number} className="rounded-md bg-white px-3 py-2">
                  <span className="text-[#1d9e75]">{number}.</span> {label}
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#746f66]">{detail}</span>
                </div>
              ))}
            </div>
          </details>
          <p
            data-testid="geography-revisit-one-action-rule"
            className="mt-3 text-xs font-bold leading-5 text-[#49675e]"
          >
            Write one corrected idea and press the green button. The portal returns you to Talk.
          </p>
        </section>

        <details data-testid="geography-revisit-checklist" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
            Recovery checklist
          </summary>
          <div className="mt-4 space-y-2">
            {recoverySteps.map((step, index) => {
              const id = proofId(activeSession.day, step.id);
              const done = completedIds.includes(id) || isComplete;
              return (
                <button
                  key={step.id}
                  type="button"
                  data-testid={`revisit-proof-${step.id}`}
                  onClick={() => toggleStep(step.id)}
                  className={cn(
                    "grid w-full grid-cols-[34px_1fr] gap-3 rounded-md border p-3 text-left transition",
                    done ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#f7f4ee] hover:border-[#1d9e75]"
                  )}
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-md text-xs font-black", done ? "bg-[#1d9e75] text-white" : "bg-white text-[#1a3a2a]")}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-[#13251d]">{step.label}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[#657066]">{step.prompt}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </details>
      </div>
    </main>
  );
}
