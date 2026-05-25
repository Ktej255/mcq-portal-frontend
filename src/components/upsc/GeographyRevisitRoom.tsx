"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  const suggestedDay = initialDay ?? stats.revisitDays[0]?.day ?? stats.shakyDays[0]?.day ?? 1;
  const [activeDay] = useState(resolveSession(suggestedDay).day);
  const activeSession = resolveSession(activeDay);
  const progress = getDayProgress(activeSession.day);
  const recoverySteps = useMemo(() => buildRecoverySteps(activeSession), [activeSession]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const allIds = recoverySteps.map((step) => proofId(activeSession.day, step.id));
  const completedCount = completedIds.filter((id) => allIds.includes(id)).length;
  const isComplete = completedCount >= recoverySteps.length || Boolean(progress?.recoveryCompleted);
  const talkHref = `/upsc/geography/talk?day=${activeSession.day}`;

  useEffect(() => {
    if (!isLoaded || hydrated) return;
    setCompletedIds(progress?.recoveryCompleted ? allIds : progress?.recoveryProofCompletedIds ?? []);
    setNote(progress?.recoverySummary ?? "");
    setSaved(false);
    setHydrated(true);
  }, [allIds, hydrated, isLoaded, progress]);

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
      recoveryWeakSkill: progress?.recoveryWeakSkill ?? progress?.talkRubric?.find((item) => item.status !== "Ready")?.label ?? "Concept clarity",
      recoveryStatus: done ? "talk-ready" : "recovery-pending",
      recoveryEvidenceAnchor: `${activeSession.title} recovery`,
      recoveryNextRoute: done ? talkHref : `/upsc/geography/revisit?day=${activeSession.day}`,
      recoveryNextActionLabel: done ? "Return to Talk" : "Finish recovery",
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
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
            <ArrowLeft className="h-4 w-4" /> Day funnel
          </Link>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.86fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Revise</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span className="text-sm font-semibold text-[#746f66]">Weak-point repair</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{activeSession.title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Do a short recovery only. The aim is to return to Talk, not repeat the full class.
              </p>
            </div>

            <div className={cn("rounded-lg border p-4", isComplete ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#ef9f27]/55 bg-[#fff4df]")}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next room</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{isComplete ? "Return to Talk" : "Finish recovery"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {isComplete ? "Weak point repair is saved. Explain again to the AI teacher." : `${completedCount}/5 recovery checks saved.`}
              </p>
              {isComplete ? (
                <Link href={talkHref} className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  Open Talk <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  data-testid="revisit-complete-and-talk"
                  onClick={completeRecovery}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  Complete recovery <RefreshCcw className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Recovery checklist</p>
                <h2 className="text-lg font-black tracking-tight">Tap what is repaired</h2>
              </div>
            </div>
            <div className="space-y-2">
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
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                <Save className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Short repair note</p>
                <h2 className="text-lg font-black tracking-tight">What was the mistake?</h2>
              </div>
            </div>
            <textarea
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setSaved(false);
              }}
              placeholder="Example: I confused latitude with longitude. Now I can explain direction, climate link, and time-zone logic."
              className="min-h-44 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => persistRecovery(completedIds, note)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
              >
                <Save className="h-4 w-4" /> Save
              </button>
              {saved && <span className="text-sm font-black text-[#1d9e75]">Saved</span>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
