"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  Lock,
  MapPinned,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyDay3PlateVisual } from "@/components/upsc/GeographyDay3PlateVisual";
import { GeographyDay4GeomorphicVisual } from "@/components/upsc/GeographyDay4GeomorphicVisual";
import { GeographyDay5ClimatologyVisual } from "@/components/upsc/GeographyDay5ClimatologyVisual";
import { GeographyDay6OceanVisual } from "@/components/upsc/GeographyDay6OceanVisual";
import { GeographyDay7ConsolidationVisual } from "@/components/upsc/GeographyDay7ConsolidationVisual";
import { GeographyDay8IndiaReliefVisual } from "@/components/upsc/GeographyDay8IndiaReliefVisual";
import { GeographyDay9DrainageVisual } from "@/components/upsc/GeographyDay9DrainageVisual";
import { GeographyDay10MonsoonVisual } from "@/components/upsc/GeographyDay10MonsoonVisual";
import { GeographyDay11ClimateRegionsVisual } from "@/components/upsc/GeographyDay11ClimateRegionsVisual";
import { GeographyDay12SoilsVegetationVisual } from "@/components/upsc/GeographyDay12SoilsVegetationVisual";
import { GeographyDay13ResourcesAgricultureVisual } from "@/components/upsc/GeographyDay13ResourcesAgricultureVisual";
import { GeographyDay14IndiaMapDrillVisual } from "@/components/upsc/GeographyDay14IndiaMapDrillVisual";
import { GeographyDay15PopulationVisual } from "@/components/upsc/GeographyDay15PopulationVisual";
import { GeographyDay16SettlementsVisual } from "@/components/upsc/GeographyDay16SettlementsVisual";
import { GeographyDay17EconomicActivitiesVisual } from "@/components/upsc/GeographyDay17EconomicActivitiesVisual";
import { GeographyDay18TransportTradeVisual } from "@/components/upsc/GeographyDay18TransportTradeVisual";
import { GeographyDay19IndustryLocationVisual } from "@/components/upsc/GeographyDay19IndustryLocationVisual";
import { GeographyDay20RegionalDevelopmentVisual } from "@/components/upsc/GeographyDay20RegionalDevelopmentVisual";
import { GeographyDay21HumanGeographyConsolidationVisual } from "@/components/upsc/GeographyDay21HumanGeographyConsolidationVisual";
import { GeographyDay22AtlasMasteryVisual } from "@/components/upsc/GeographyDay22AtlasMasteryVisual";
import { GeographyDay23PyqPatternReadingVisual } from "@/components/upsc/GeographyDay23PyqPatternReadingVisual";
import { GeographyDay24DisasterGeographyBridgeVisual } from "@/components/upsc/GeographyDay24DisasterGeographyBridgeVisual";
import { GeographyDay25EnvironmentGeographyBridgeVisual } from "@/components/upsc/GeographyDay25EnvironmentGeographyBridgeVisual";
import { GeographyDay26MainsGeographyApplicationVisual } from "@/components/upsc/GeographyDay26MainsGeographyApplicationVisual";
import { GeographyDay27FullGeographyDrillVisual } from "@/components/upsc/GeographyDay27FullGeographyDrillVisual";
import {
  GeographyDay28WeakAreaRepairVisual,
  GeographyDay29FinalMockReviewVisual,
  GeographyDay30GeographyCommandDayVisual,
} from "@/components/upsc/GeographyRevisionCloseoutVisual";
import { geographyDay1MapRelationshipDrills } from "@/lib/upsc/geographyDay1PortalLesson";
import { hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { geographyLabs, geographySessions, type GeographySession } from "@/lib/upsc/plan";
import { useGeographyProgress, type GeographyLabProofStage } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

type LabSlug = "universe" | "earth-layers" | "monsoon" | "india-map" | "disaster-link" | "environment-bridge" | "mcq-engine";

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
  if (labTitle === "Universe Foundation Visual") return "universe";
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
  const [proofDraft, setProofDraft] = useState("");
  const [selectedRelationshipId, setSelectedRelationshipId] = useState("");
  const [activeProofIndex, setActiveProofIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const normalizedProofIds = proofStages.map((stage) => proofId(activeSession.day, labSlug, stage.id));
  const proofCount = completedIds.filter((id) => normalizedProofIds.includes(id)).length;
  const isComplete = proofCount >= proofStages.length || Boolean(progress?.labCompleted);
  const mcqHref = `/upsc/geography/mcq-readiness?day=${activeSession.day}`;
  const activeProofStage = proofStages[Math.min(activeProofIndex, proofStages.length - 1)];
  const isDayOneMapDrill = activeSession.day === 1 && labSlug === "india-map";
  const isDayThreeEarthLayers = activeSession.day === 3 && labSlug === "earth-layers";
  const isDayFourDisasterLink = activeSession.day === 4 && labSlug === "disaster-link";
  const isDayFiveMonsoonBase = activeSession.day === 5 && labSlug === "monsoon";
  const isDaySixOceanSystem = activeSession.day === 6 && labSlug === "monsoon";
  const isDaySevenPhysicalConsolidation = activeSession.day === 7 && labSlug === "earth-layers";
  const isDayEightIndiaPhysiography = activeSession.day === 8 && labSlug === "india-map";
  const isDayNineIndianDrainage = activeSession.day === 9 && labSlug === "india-map";
  const isDayTenIndianMonsoon = activeSession.day === 10 && labSlug === "monsoon";
  const isDayElevenClimateRegions = activeSession.day === 11 && labSlug === "monsoon";
  const isDayTwelveSoilsVegetation = activeSession.day === 12 && labSlug === "environment-bridge";
  const isDayThirteenResourcesAgriculture = activeSession.day === 13 && labSlug === "india-map";
  const isDayFourteenIndiaMapDrill = activeSession.day === 14 && labSlug === "india-map";
  const isDayFifteenPopulationGeography = activeSession.day === 15 && labSlug === "india-map";
  const isDaySixteenSettlements = activeSession.day === 16 && labSlug === "india-map";
  const isDaySeventeenEconomicActivities = activeSession.day === 17 && labSlug === "india-map";
  const isDayEighteenTransportTrade = activeSession.day === 18 && labSlug === "india-map";
  const isDayNineteenIndustryLocation = activeSession.day === 19 && labSlug === "india-map";
  const isDayTwentyRegionalDevelopment = activeSession.day === 20 && labSlug === "environment-bridge";
  const isDayTwentyOneHumanGeographyConsolidation = activeSession.day === 21 && labSlug === "india-map";
  const isDayTwentyTwoAtlasMastery = activeSession.day === 22 && labSlug === "india-map";
  const isDayTwentyThreePyqPatternReading = activeSession.day === 23 && labSlug === "mcq-engine";
  const isDayTwentyFourDisasterGeographyBridge = activeSession.day === 24 && labSlug === "disaster-link";
  const isDayTwentyFiveEnvironmentGeographyBridge = activeSession.day === 25 && labSlug === "environment-bridge";
  const isDayTwentySixMainsGeographyApplication = activeSession.day === 26 && labSlug === "india-map";
  const isDayTwentySevenFullGeographyDrill = activeSession.day === 27 && labSlug === "mcq-engine";
  const isDayTwentyEightWeakAreaRepair = activeSession.day === 28 && labSlug === "mcq-engine";
  const isDayTwentyNineFinalMockReview = activeSession.day === 29 && labSlug === "mcq-engine";
  const isDayThirtyGeographyCommandDay = activeSession.day === 30 && labSlug === "india-map";
  const selectedRelationship = geographyDay1MapRelationshipDrills.find((drill) => drill.id === selectedRelationshipId);
  const nextActionLabel = isComplete ? "Return to MCQ practice" : "Save optional visual";
  const evidenceStatus = isComplete ? "mcq ready" : "proof pending";
  const labNoteReady = proofDraft.trim().length >= 24;
  const visualPanels = (
    <>
      {isDayOneMapDrill && (
        <section
          data-testid="day1-map-relationship-drill"
          className="rounded-lg border border-[#cfe5dc] bg-[#effaf5] p-5 shadow-sm md:p-7"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">India map drill</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">Choose one relationship.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#49675e]">
              Tap one example, say why the link matters, and notice the near-correct UPSC trap. The note is prepared for you to refine before MCQ practice.
            </p>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {geographyDay1MapRelationshipDrills.map((drill) => {
              const isSelected = selectedRelationshipId === drill.id;
              return (
                <button
                  key={drill.id}
                  type="button"
                  data-testid={`day1-map-drill-${drill.id}`}
                  aria-pressed={isSelected}
                  onClick={() => selectDayOneMapRelationship(drill.id)}
                  className={cn(
                    "rounded-md border p-4 text-left transition",
                    isSelected
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#cfe5dc] bg-white text-[#13251d] hover:border-[#1d9e75]"
                  )}
                >
                  <span className="block text-xs font-black uppercase tracking-[0.14em] opacity-70">{drill.category}</span>
                  <span className="mt-2 block text-sm font-black leading-5">{drill.label}</span>
                  <span className="mt-2 block text-xs font-semibold leading-5 opacity-75">{drill.cue}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {isDayThreeEarthLayers && <GeographyDay3PlateVisual />}
      {isDayFourDisasterLink && <GeographyDay4GeomorphicVisual />}
      {isDayFiveMonsoonBase && <GeographyDay5ClimatologyVisual />}
      {isDaySixOceanSystem && <GeographyDay6OceanVisual />}
      {isDaySevenPhysicalConsolidation && <GeographyDay7ConsolidationVisual />}
      {isDayEightIndiaPhysiography && <GeographyDay8IndiaReliefVisual />}
      {isDayNineIndianDrainage && <GeographyDay9DrainageVisual />}
      {isDayTenIndianMonsoon && <GeographyDay10MonsoonVisual />}
      {isDayElevenClimateRegions && <GeographyDay11ClimateRegionsVisual />}
      {isDayTwelveSoilsVegetation && <GeographyDay12SoilsVegetationVisual />}
      {isDayThirteenResourcesAgriculture && <GeographyDay13ResourcesAgricultureVisual />}
      {isDayFourteenIndiaMapDrill && <GeographyDay14IndiaMapDrillVisual />}
      {isDayFifteenPopulationGeography && <GeographyDay15PopulationVisual />}
      {isDaySixteenSettlements && <GeographyDay16SettlementsVisual />}
      {isDaySeventeenEconomicActivities && <GeographyDay17EconomicActivitiesVisual />}
      {isDayEighteenTransportTrade && <GeographyDay18TransportTradeVisual />}
      {isDayNineteenIndustryLocation && <GeographyDay19IndustryLocationVisual />}
      {isDayTwentyRegionalDevelopment && <GeographyDay20RegionalDevelopmentVisual />}
      {isDayTwentyOneHumanGeographyConsolidation && <GeographyDay21HumanGeographyConsolidationVisual />}
      {isDayTwentyTwoAtlasMastery && <GeographyDay22AtlasMasteryVisual />}
      {isDayTwentyThreePyqPatternReading && <GeographyDay23PyqPatternReadingVisual />}
      {isDayTwentyFourDisasterGeographyBridge && <GeographyDay24DisasterGeographyBridgeVisual />}
      {isDayTwentyFiveEnvironmentGeographyBridge && <GeographyDay25EnvironmentGeographyBridgeVisual />}
      {isDayTwentySixMainsGeographyApplication && <GeographyDay26MainsGeographyApplicationVisual />}
      {isDayTwentySevenFullGeographyDrill && <GeographyDay27FullGeographyDrillVisual />}
      {isDayTwentyEightWeakAreaRepair && <GeographyDay28WeakAreaRepairVisual />}
      {isDayTwentyNineFinalMockReview && <GeographyDay29FinalMockReviewVisual />}
      {isDayThirtyGeographyCommandDay && <GeographyDay30GeographyCommandDayVisual />}
    </>
  );

  useEffect(() => {
    if (!isLoaded || hydrated) return;

    const timer = window.setTimeout(() => {
      const savedProgress = getDayProgress(activeSession.day);
      const stored = savedProgress?.labMode === labSlug ? savedProgress?.labProofCompletedIds ?? [] : [];
      const savedProofIds = proofStages.map((stage) => proofId(activeSession.day, labSlug, stage.id));
      const nextIds = savedProgress?.labCompleted ? savedProofIds : stored;
      const firstPendingIndex = proofStages.findIndex((stage) => !nextIds.includes(proofId(activeSession.day, labSlug, stage.id)));

      setCompletedIds(nextIds);
      setInsight(savedProgress?.labInsight ?? "");
      setProofDraft(savedProgress?.labInsight ?? "");
      setSelectedRelationshipId(
        geographyDay1MapRelationshipDrills.find((drill) => drill.label === savedProgress?.labAtlasPoint)?.id ?? ""
      );
      setActiveProofIndex(firstPendingIndex >= 0 ? firstPendingIndex : proofStages.length - 1);
      setSaved(false);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeSession.day, getDayProgress, hydrated, isLoaded, labSlug]);

  const persistLab = (nextIds = completedIds, nextInsight = insight, goNext = false) => {
    const done = nextIds.filter((id) => normalizedProofIds.includes(id)).length >= proofStages.length;
    saveDayProgress(activeSession.day, {
      labCompleted: done,
      labMode: labSlug,
      labFocus: selectedLab.title,
      labInsight: nextInsight,
      labProofIndex: Math.min(activeProofIndex, proofStages.length - 1),
      labProofCompletedIds: nextIds,
      labProofSummary: done ? nextInsight || `${selectedLab.title} proof saved for ${activeSession.title}.` : progress?.labProofSummary,
      labAtlasLayer: selectedRelationship?.category,
      labAtlasPoint: selectedRelationship?.label,
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

  const useProofSuggestion = () => {
    setProofDraft(`${activeProofStage.label}: ${activeProofStage.prompt} Apply it to ${activeSession.title} through ${selectedLab.title}.`);
    setSaved(false);
  };

  const selectDayOneMapRelationship = (relationshipId: string) => {
    const relationship = geographyDay1MapRelationshipDrills.find((drill) => drill.id === relationshipId);
    if (!relationship) return;
    setSelectedRelationshipId(relationship.id);
    setProofDraft(relationship.proofPrompt);
    setSaved(false);
  };

  const completeVisualProof = (goNext = false) => {
    const nextIds = normalizedProofIds;
    const nextInsight =
      proofDraft.trim() ||
      `${selectedLab.title} proof saved for ${activeSession.title}: concept, map, example, trap and answer are linked.`;

    setCompletedIds(nextIds);
    setInsight(nextInsight);
    setProofDraft(nextInsight);
    setActiveProofIndex(proofStages.length - 1);
    persistLab(nextIds, nextInsight, goNext);
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
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section
          data-testid="geography-lab-simple-surface"
          data-visible-mode="one-optional-note-one-action"
          data-student-surface="optional-lab-first"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-6"
        >
          <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
            <ArrowLeft className="h-4 w-4" /> Day funnel
          </Link>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Visual</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span className="text-sm font-semibold text-[#746f66]">{selectedLab.title}</span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{activeSession.title}</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Use this only if a map, mechanism, or example needs one extra proof before MCQ.
              </p>
            </div>

            <div
              data-testid="geography-lab-action-card"
              data-student-surface="primary-action"
              className={cn("rounded-lg border p-4", isComplete ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#8db7d8] bg-[#edf7ff]")}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Do now</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{isComplete ? "Visual saved" : "Optional visual note"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {isComplete ? "The visual note is saved. Return to MCQ practice." : "Write one useful visual note, or skip this and go straight to MCQ."}
              </p>
              {isComplete ? (
                <Link data-testid="lab-primary-route" href={mcqHref} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  Open MCQ <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <Link
                  data-testid="lab-continue-without-visual"
                  href={mcqHref}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md border border-[#8db7d8] bg-white px-4 text-sm font-black text-[#23406f] transition hover:bg-[#f5fbff]"
                >
                  Skip visual and open MCQ <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        <section
          data-testid="lab-proof-command-board"
          data-visible-mode="one-visual-note"
          data-student-surface="note-first"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_240px] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Visual proof</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Write one visual note.</h2>
              <p className="mt-3 text-base font-semibold leading-7 text-[#49675e]">
                Connect the topic with one map, mechanism, example, or UPSC trap. If the visual is not needed, skip it and continue.
              </p>
            </div>
            <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">Status</p>
              <p data-testid="lab-evidence-status" className="mt-2 text-xl font-black tracking-tight text-[#085041]">{evidenceStatus}</p>
              <p data-testid="lab-route-decision" className="mt-2 text-sm font-bold leading-5 text-[#49675e]">{nextActionLabel}</p>
            </div>
          </div>

          <div data-testid="geography-lab-flow-strip" className="mt-5 grid gap-2 sm:grid-cols-3">
            {[
              ["1. Talk", "Cleared"],
              ["2. Visual", "Optional proof"],
              ["3. MCQ", "Continue next"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                <p className="mt-1 text-sm font-black text-[#13251d]">{value}</p>
              </div>
            ))}
          </div>
          <p data-testid="geography-lab-one-action-rule" className="mt-3 text-xs font-bold leading-5 text-[#49675e]">
            Write one useful note if the visual helps. Otherwise use Continue without visual and go to MCQ.
          </p>

          <textarea
            data-testid="geography-lab-proof-input"
            value={proofDraft}
            onChange={(event) => {
              setProofDraft(event.target.value);
              setSaved(false);
            }}
            placeholder={`Example: ${activeSession.title} becomes clear when I connect the map location, process, example and one UPSC trap.`}
            className="mt-5 min-h-32 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              data-testid="geography-lab-use-proof-suggestion"
              onClick={useProofSuggestion}
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc] sm:w-auto"
            >
              Use prompt starter
            </button>
            <button
              type="button"
              data-testid="geography-lab-save-proof"
              onClick={() => completeVisualProof(true)}
              disabled={!labNoteReady}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <Save className="h-4 w-4" /> Save and open MCQ
            </button>
            {saved && (
              <span className="inline-flex h-10 items-center gap-2 text-sm font-black text-[#1d9e75]">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div data-testid="lab-evidence-step-talk-verdict" className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">Talk verdict</p>
              <p className="mt-1 text-sm font-black text-[#085041]">Done</p>
            </div>
            <div data-testid="lab-evidence-step-lab-proof" className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">Lab proof</p>
              <p className="mt-1 text-sm font-black text-[#13251d]">{isComplete ? "1/1 note saved" : "Optional note pending"}</p>
            </div>
            <div className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">Map anchor</p>
              <p className="mt-1 text-sm font-black text-[#13251d]">{selectedLab.title}</p>
            </div>
          </div>
        </section>

        <details data-testid="geography-lab-visual-board" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
            Open visual board
          </summary>
          <div className="mt-5 flex flex-col gap-5">
            {visualPanels}
          </div>
        </details>

        <details data-testid="geography-lab-advanced-tools" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
            Visual board and manual proof controls
          </summary>
          <div data-testid="geography-lab-proof-stages" className="mt-5 grid gap-2 sm:grid-cols-5">
            {proofStages.map((stage, index) => {
              const id = proofId(activeSession.day, labSlug, stage.id);
              const done = completedIds.includes(id) || isComplete;
              const active = index === activeProofIndex && !isComplete;
              return (
                <button
                  key={stage.id}
                  type="button"
                  data-testid={`lab-proof-${stage.id}`}
                  onClick={() => setActiveProofIndex(index)}
                  className={cn(
                    "min-h-14 rounded-md border px-3 text-left text-xs font-black transition",
                    done && "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
                    active && !done && "border-[#1a3a2a] bg-[#1a3a2a] text-white",
                    !done && !active && "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                  )}
                >
                  {index + 1}. {stage.label}
                </button>
              );
            })}
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
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
          </div>
        </details>

        <details className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">Saved insight note</summary>
        <section className="mt-4">
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
        </details>
      </div>
    </main>
  );
}
