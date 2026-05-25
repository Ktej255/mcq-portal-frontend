"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Lock,
  MapPinned,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { geographyLabs, geographySessions, type GeographySession } from "@/lib/upsc/plan";
import { useGeographyProgress, type GeographyLabProofStage } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

type LabSlug = "earth-layers" | "monsoon" | "india-map" | "disaster-link" | "environment-bridge" | "mcq-engine";

const proofStages: Array<{ id: GeographyLabProofStage; label: string; prompt: string }> = [
  { id: "concept", label: "Concept", prompt: "Say the idea in one clean sentence." },
  { id: "map", label: "Map", prompt: "Attach it to a place, layer, relief, river, coast, or climate pattern." },
  { id: "example", label: "Example", prompt: "Name one Indian or world example." },
  { id: "trap", label: "Trap", prompt: "Write one almost-correct UPSC statement and the exception." },
  { id: "answer", label: "Answer", prompt: "Compress it into two lines you can repeat in MCQ review." },
];

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function labSlugForSession(labTitle: string): LabSlug {
  if (labTitle === "Monsoon Simulator") return "monsoon";
  if (labTitle === "India Interactive Map") return "india-map";
  if (labTitle === "Disaster Link") return "disaster-link";
  if (labTitle === "Environment Bridge") return "environment-bridge";
  if (labTitle === "MCQ Engine") return "mcq-engine";
  return "earth-layers";
}

function getLab(slug: string | undefined, session: GeographySession) {
  const fallbackSlug = labSlugForSession(session.lab);
  return geographyLabs.find((lab) => lab.slug === slug) ?? geographyLabs.find((lab) => lab.slug === fallbackSlug) ?? geographyLabs[0];
}

function proofId(day: number, labSlug: string, stage: GeographyLabProofStage) {
  return `${day}-${labSlug}-${stage}`;
}

export function GeographyVisualLab({ initialMode, initialDay }: { initialMode?: string; initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay] = useState(resolveSession(initialDay).day);
  const activeSession = resolveSession(activeDay);
  const selectedLab = getLab(initialMode, activeSession);
  const labSlug = selectedLab.slug;
  const progress = getDayProgress(activeSession.day);
  const talkCleared = hasGeographyTalkClearance(progress);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [insight, setInsight] = useState("");
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const normalizedProofIds = useMemo(
    () => proofStages.map((stage) => proofId(activeSession.day, labSlug, stage.id)),
    [activeSession.day, labSlug]
  );
  const proofCount = completedIds.filter((id) => normalizedProofIds.includes(id)).length;
  const isComplete = proofCount >= proofStages.length || Boolean(progress?.labCompleted);
  const mcqHref = `/upsc/geography/mcq-readiness?day=${activeSession.day}`;

  useEffect(() => {
    if (!isLoaded || hydrated) return;
    const savedProgress = getDayProgress(activeSession.day);
    const stored = savedProgress?.labMode === labSlug ? savedProgress?.labProofCompletedIds ?? [] : [];
    setCompletedIds(savedProgress?.labCompleted ? normalizedProofIds : stored);
    setInsight(savedProgress?.labInsight ?? "");
    setSaved(false);
    setHydrated(true);
  }, [activeSession.day, getDayProgress, hydrated, isLoaded, labSlug, normalizedProofIds]);

  const persistLab = (nextIds = completedIds, nextInsight = insight, goNext = false) => {
    const done = nextIds.filter((id) => normalizedProofIds.includes(id)).length >= proofStages.length;
    saveDayProgress(activeSession.day, {
      labCompleted: done,
      labMode: labSlug,
      labFocus: selectedLab.title,
      labInsight: nextInsight,
      labProofCompletedIds: nextIds,
      labProofSummary: done ? nextInsight || `${selectedLab.title} proof saved for ${activeSession.title}.` : progress?.labProofSummary,
      labEvidenceStatus: done ? "mcq-ready" : talkCleared ? "proof-pending" : "talk-required",
      labEvidenceAnchor: `${activeSession.title} / ${selectedLab.title}`,
      labNextRoute: done ? mcqHref : `/upsc/geography/lab?mode=${labSlug}&day=${activeSession.day}`,
      labNextActionLabel: done ? "Open MCQ" : "Finish visual proof",
    });
    setSaved(true);
    if (goNext && done) router.push(mcqHref);
  };

  const toggleStage = (stage: GeographyLabProofStage) => {
    const id = proofId(activeSession.day, labSlug, stage);
    const next = completedIds.includes(id) ? completedIds.filter((item) => item !== id) : [...completedIds, id];
    setCompletedIds(next);
    persistLab(next);
  };

  const completeLab = () => {
    const nextIds = normalizedProofIds;
    setCompletedIds(nextIds);
    persistLab(nextIds, insight, true);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Opening Visual Lab...
        </div>
      </main>
    );
  }

  if (!talkCleared) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <section className="rounded-lg border border-[#ef9f27]/55 bg-[#fff4df] p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#9a6a16] text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">Visual locked</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">Explain the topic first</h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4a12]">
                  The Visual Lab opens after the AI teacher accepts the student explanation.
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
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
            <ArrowLeft className="h-4 w-4" /> Day funnel
          </Link>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.86fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Visual</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span className="text-sm font-semibold text-[#746f66]">{selectedLab.title}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{activeSession.title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Prove the concept visually once. No extra dashboard, no diagnostics, only the proof needed before MCQ.
              </p>
            </div>

            <div className={cn("rounded-lg border p-4", isComplete ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#8db7d8] bg-[#edf7ff]")}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Next room</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{isComplete ? "MCQ unlocked" : "Finish visual proof"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {isComplete ? "The visual proof is saved. Fresh MCQ practice is next." : `${proofCount}/5 proof points saved.`}
              </p>
              {isComplete ? (
                <Link href={mcqHref} className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  Open MCQ <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  data-testid="lab-complete-and-mcq"
                  onClick={completeLab}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  Complete Visual <ClipboardCheck className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <MapPinned className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Visual board</p>
                <h2 className="text-lg font-black tracking-tight">{selectedLab.title}</h2>
              </div>
            </div>

            <div className="rounded-lg bg-[#13251d] p-5 text-white">
              <div className="flex min-h-64 flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-[#13251d]">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedLab.title}</h3>
                  <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/72">{selectedLab.detail}</p>
                </div>
                <p className="text-sm font-black text-[#8ee8c8]">{activeSession.lab}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Proof checklist</p>
                <h2 className="text-lg font-black tracking-tight">Tap what is clear</h2>
              </div>
            </div>

            <div className="space-y-2">
              {proofStages.map((stage, index) => {
                const id = proofId(activeSession.day, labSlug, stage.id);
                const done = completedIds.includes(id) || isComplete;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    data-testid={`lab-proof-${stage.id}`}
                    onClick={() => toggleStage(stage.id)}
                    className={cn(
                      "grid w-full grid-cols-[34px_1fr] gap-3 rounded-md border p-3 text-left transition",
                      done ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#f7f4ee] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-md text-xs font-black", done ? "bg-[#1d9e75] text-white" : "bg-white text-[#1a3a2a]")}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-black text-[#13251d]">{stage.label}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#657066]">{stage.prompt}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
              <Save className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">One-line proof</p>
              <h2 className="text-lg font-black tracking-tight">What did the visual make clear?</h2>
            </div>
          </div>
          <textarea
            value={insight}
            onChange={(event) => {
              setInsight(event.target.value);
              setSaved(false);
            }}
            placeholder="Example: Latitude and Earth movement explain day length, seasons, and climate zones."
            className="min-h-24 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => persistLab(completedIds, insight)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
            >
              <Save className="h-4 w-4" /> Save
            </button>
            {saved && <span className="text-sm font-black text-[#1d9e75]">Saved</span>}
          </div>
        </section>
      </div>
    </main>
  );
}
