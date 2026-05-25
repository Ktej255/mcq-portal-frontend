"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CloudRain,
  Compass,
  Droplets,
  Earth,
  Gauge,
  LockKeyhole,
  Layers3,
  MapPinned,
  Mountain,
  PlayCircle,
  RefreshCcw,
  Route,
  ShieldAlert,
  Sun,
  Target,
  UnlockKeyhole,
  Wind,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GeographyLoopActions } from "@/components/upsc/GeographyLoopActions";
import {
  GeographyStudentHandoffStrip,
  type GeographyStudentHandoffStep,
} from "@/components/upsc/GeographyStudentHandoffStrip";
import { hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { geographyLabs, geographySessions } from "@/lib/upsc/plan";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import type { GeographyLabProofStage } from "@/lib/upsc/useGeographyProgress";
import { cn } from "@/lib/utils";

type LabSlug = "earth-layers" | "monsoon" | "india-map" | "disaster-link" | "environment-bridge" | "mcq-engine";

type LabMode = {
  slug: LabSlug;
  title: string;
  eyebrow: string;
  objective: string;
  prompt: string;
  checkpoints: string[];
};

type FocusItem = {
  label: string;
  detail: string;
  depth?: string;
  signal?: string;
};

type IndiaAtlasLayer = "physiography" | "rivers" | "national-parks" | "wildlife-sanctuaries" | "soils-climate";

type IndiaAtlasPoint = {
  label: string;
  layer: IndiaAtlasLayer;
  region: string;
  type: "relief" | "river" | "park" | "sanctuary" | "soil" | "climate" | "cyclone" | "mineral" | "rain";
  x: number;
  y: number;
  detail: string;
  proof: string;
  trap: string;
};

type GeographyLabProofConfig = {
  id: GeographyLabProofStage;
  label: string;
  prompt: string;
};

type LabEvidenceStatus = "Done" | "Active" | "Ready" | "Locked";

type LabEvidenceStep = {
  label: string;
  detail: string;
  status: LabEvidenceStatus;
  icon: LucideIcon;
};

const labModes: LabMode[] = [
  {
    slug: "earth-layers",
    title: "Earth Layers Lab",
    eyebrow: "Interior logic",
    objective: "Understand how crust, mantle, core, plates, and seismic waves explain tectonic events.",
    prompt: "Why does evidence from earthquake waves tell us more than direct observation?",
    checkpoints: ["Crust and lithosphere are not identical", "S-waves do not pass through liquid", "Plate margins explain hazard belts"],
  },
  {
    slug: "monsoon",
    title: "Monsoon Simulator",
    eyebrow: "Wind and rainfall",
    objective: "Connect heating, pressure, ITCZ shift, jet streams, and relief with monsoon rainfall.",
    prompt: "Why can a strong monsoon still produce regional drought or flood?",
    checkpoints: ["ITCZ movement matters", "Orography redistributes rainfall", "Break monsoon is a circulation shift"],
  },
  {
    slug: "india-map",
    title: "India Interactive Map",
    eyebrow: "Map command",
    objective: "Connect physiography, rivers, climate, soils, resources, and agriculture on one India map logic.",
    prompt: "How does relief explain river systems, rainfall, soils, crops, and disasters?",
    checkpoints: ["Himalayas shape drainage and climate", "Plateau controls minerals and black soil", "Coasts shape trade and cyclone risk"],
  },
  {
    slug: "disaster-link",
    title: "Disaster Link",
    eyebrow: "Hazard to risk",
    objective: "See how geography turns hazards into disasters through exposure and vulnerability.",
    prompt: "Why does the same cyclone become a different disaster across different coastlines?",
    checkpoints: ["Hazard is not the same as disaster", "Exposure changes impact", "Mitigation is geography-specific"],
  },
  {
    slug: "environment-bridge",
    title: "Environment Bridge",
    eyebrow: "Geography to ecology",
    objective: "Use climate, relief, and location to explain biomes, biodiversity, conservation, and climate change.",
    prompt: "Why do environment questions often begin as map or climate questions?",
    checkpoints: ["Biome depends on climate", "Conservation depends on location", "Climate change has spatial impacts"],
  },
  {
    slug: "mcq-engine",
    title: "MCQ Engine",
    eyebrow: "Practice layer",
    objective: "Map fresh Geography questions to the correct day, chapter, topic, difficulty, and batch.",
    prompt: "Which question metadata makes later revision and analytics useful?",
    checkpoints: ["Every MCQ needs chapter and topic", "Difficulty must be deliberate", "Explanation is part of learning"],
  },
];

const geographyLabProofStages: GeographyLabProofConfig[] = [
  {
    id: "concept",
    label: "Concept lock",
    prompt: "Write the core concept in one clean sentence without listing isolated facts.",
  },
  {
    id: "map",
    label: "Map mechanism",
    prompt: "Attach the concept to relief, river, coast, climate, layer, or visual mechanism.",
  },
  {
    id: "example",
    label: "India example",
    prompt: "Name one Indian region, river, protected area, soil belt, or hazard example.",
  },
  {
    id: "trap",
    label: "UPSC trap",
    prompt: "Write one almost-correct UPSC statement and the exception that makes it risky.",
  },
  {
    id: "answer",
    label: "Answer hook",
    prompt: "Compress the lab into a final two-line explanation the student can repeat in Talk or MCQ review.",
  },
];

function buildProofId(day: number, mode: string, stage: GeographyLabProofStage) {
  return `${day}-${mode}-${stage}`;
}

function normalizeProofIdsForMode(
  day: number,
  mode: string,
  proofIds: string[] | undefined,
  savedMode: string | undefined
) {
  if (!proofIds?.length || savedMode !== mode) return [];
  const prefix = `${day}-${mode}-`;
  const stageIds = new Set(geographyLabProofStages.map((stage) => stage.id));

  return proofIds
    .map((proofId) => {
      if (proofId.startsWith(prefix)) return proofId;
      if (stageIds.has(proofId as GeographyLabProofStage)) {
        return buildProofId(day, mode, proofId as GeographyLabProofStage);
      }
      return null;
    })
    .filter((proofId): proofId is string => Boolean(proofId));
}

function slugifyAtlasTestId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const earthFocus = [
  { label: "Crust", detail: "Thin outer shell; continental and oceanic differences matter.", depth: "5-70 km" },
  { label: "Mantle", detail: "Convection, heat transfer, and plate movement logic.", depth: "70-2,900 km" },
  { label: "Outer Core", detail: "Liquid iron-nickel layer; blocks S-waves.", depth: "2,900-5,150 km" },
  { label: "Inner Core", detail: "Solid core under pressure; deepest evidence is seismic.", depth: "5,150+ km" },
];

const earthDiagnostics: Record<string, { wave: string; hazard: string; trap: string; ray: string; proof: string }> = {
  Crust: {
    wave: "P and S waves both travel, but their speed changes with crustal density and rock type.",
    hazard: "Earthquake focus, faults, volcanoes and mountain belts become visible at plate boundaries.",
    trap: "Crust is not the full lithosphere; lithosphere includes uppermost mantle.",
    ray: "Direct waves",
    proof: "Use crustal thickness to separate continental shields, ocean basins and young fold belts.",
  },
  Mantle: {
    wave: "Velocity shifts and shadow behavior indicate denser material and convection below the lithosphere.",
    hazard: "Mantle convection supplies the movement logic behind plate drift, rifting and subduction.",
    trap: "Do not describe the mantle as fully molten; much of it behaves plastically over long time.",
    ray: "Refraction zone",
    proof: "Convection links heat transfer with plate margin distribution and hotspot exceptions.",
  },
  "Outer Core": {
    wave: "S-waves stop here because the outer core is liquid; P-waves bend and create shadow zones.",
    hazard: "The liquid metallic core explains magnetic-field logic that protects atmosphere and life.",
    trap: "S-wave absence does not mean there is empty space; it proves a liquid layer.",
    ray: "S-wave block",
    proof: "Wave shadow zones are the strongest evidence for a liquid outer core.",
  },
  "Inner Core": {
    wave: "P-wave behavior indicates a solid dense center despite extreme temperature.",
    hazard: "The inner core completes the density model used to explain Earth structure indirectly.",
    trap: "High temperature alone does not decide solid/liquid state; pressure is decisive.",
    ray: "Core proof",
    proof: "Pressure keeps the inner core solid, which is why wave evidence must be interpreted carefully.",
  },
};

const monsoonFocus = [
  { label: "Onset", detail: "ITCZ shifts north, cross-equatorial flow strengthens.", signal: "June" },
  { label: "Peak", detail: "Arabian Sea and Bay branches feed widespread rainfall.", signal: "July-Aug" },
  { label: "Break", detail: "Rainfall belt shifts; plains may dry while foothills intensify.", signal: "Variable" },
  { label: "Retreat", detail: "Pressure pattern reverses; Tamil Nadu gets retreating rainfall.", signal: "Oct-Nov" },
];

const indiaFocus = [
  {
    label: "Himalayas",
    detail: "Climate barrier, perennial rivers, landslide and earthquake risk.",
    signal: "Relief + drainage",
  },
  {
    label: "Northern Plains",
    detail: "Alluvial soils, dense population, floodplain agriculture and flood risk.",
    signal: "Alluvium + rivers",
  },
  {
    label: "Peninsular Plateau",
    detail: "Minerals, black soil, rain-shadow regions, older drainage and tiger landscapes.",
    signal: "Plateau + minerals",
  },
  {
    label: "Coasts and Islands",
    detail: "Ports, fisheries, cyclones, mangroves, marine biodiversity and island ecology.",
    signal: "Coast + hazard",
  },
];

const monsoonStageConfig: Record<string, { itcz: string; rain: string; branch: string; pressure: string }> = {
  Onset: { itcz: "57%", rain: "Kerala onset corridor", branch: "Arabian Sea branch strengthens", pressure: "Thermal low deepens over NW India" },
  Peak: { itcz: "38%", rain: "All-India rain belt active", branch: "Bay branch curves into Ganga plains", pressure: "Continental low pulls moisture inland" },
  Break: { itcz: "28%", rain: "Foothill rainfall spike", branch: "Moisture axis shifts north", pressure: "Weak trough over central India" },
  Retreat: { itcz: "63%", rain: "Tamil Nadu receives retreating rain", branch: "Northeast winds reverse flow", pressure: "High pressure builds over land" },
};

const indiaAtlasLayers: Record<IndiaAtlasLayer, { title: string; cue: string; icon: typeof MapPinned }> = {
  physiography: { title: "Physiography", cue: "Relief, plains, plateau, coast", icon: Mountain },
  rivers: { title: "Rivers", cue: "Drainage, delta, floodplain", icon: Droplets },
  "national-parks": { title: "National Parks", cue: "Protected area map anchors", icon: Earth },
  "wildlife-sanctuaries": { title: "Wildlife Sanctuaries", cue: "Habitat and species anchors", icon: ShieldAlert },
  "soils-climate": { title: "Soils and Climate", cue: "Rainfall, soil, crop logic", icon: CloudRain },
};

const indiaAtlasPoints: IndiaAtlasPoint[] = [
  {
    label: "Himalayan Arc",
    layer: "physiography",
    region: "Himalayas",
    type: "relief",
    x: 43,
    y: 17,
    detail: "Orographic wall, glacier source, seismic belt and climatic barrier.",
    proof: "Explains monsoon interception, perennial rivers and young fold mountain hazards.",
    trap: "Do not treat all Himalayan rivers as identical; glacier source and antecedent logic matter.",
  },
  {
    label: "Indo-Gangetic Plain",
    layer: "physiography",
    region: "Northern Plains",
    type: "river",
    x: 53,
    y: 35,
    detail: "Alluvium, floodplain agriculture, dense settlement and transport corridor.",
    proof: "Relief is low, deposition is high, and rivers create fertile but flood-prone belts.",
    trap: "High fertility does not remove flood, waterlogging and river-course change risk.",
  },
  {
    label: "Deccan Plateau",
    layer: "physiography",
    region: "Peninsular Plateau",
    type: "mineral",
    x: 45,
    y: 58,
    detail: "Ancient shield, basaltic areas, mineral belts and rain-shadow zones.",
    proof: "Older rocks explain mineral concentration; western relief explains rainfall contrast.",
    trap: "Peninsular rivers are not usually glacier-fed and many are seasonal compared with Himalayan rivers.",
  },
  {
    label: "Western Ghats",
    layer: "physiography",
    region: "Coasts and Islands",
    type: "rain",
    x: 31,
    y: 64,
    detail: "Windward rainfall, biodiversity hotspot and short west-flowing rivers.",
    proof: "Orography converts moisture-laden winds into heavy rainfall along the west coast.",
    trap: "High rainfall on the windward side can coexist with rain shadow east of the Ghats.",
  },
  {
    label: "East Coast",
    layer: "physiography",
    region: "Coasts and Islands",
    type: "cyclone",
    x: 61,
    y: 70,
    detail: "Deltas, cyclones, coastal erosion, ports and storm-surge exposure.",
    proof: "Wide deltas and Bay of Bengal cyclone tracks convert geography into disaster risk.",
    trap: "Coastal risk is not only cyclone wind; surge, salinity and exposure matter.",
  },
  {
    label: "Indus System",
    layer: "rivers",
    region: "Himalayas",
    type: "river",
    x: 32,
    y: 26,
    detail: "Trans-Himalayan and north-west drainage logic.",
    proof: "Antecedent drainage cuts across young mountains and links relief with geopolitics.",
    trap: "Do not assume every major Himalayan river drains into the Bay of Bengal.",
  },
  {
    label: "Ganga Basin",
    layer: "rivers",
    region: "Northern Plains",
    type: "river",
    x: 52,
    y: 38,
    detail: "Alluvial plain, tributary network, flood and food security belt.",
    proof: "Tributaries, deposition and monsoon rainfall make a high-productivity floodplain.",
    trap: "A productive floodplain can still be highly disaster-prone.",
  },
  {
    label: "Brahmaputra Bend",
    layer: "rivers",
    region: "Himalayas",
    type: "river",
    x: 76,
    y: 37,
    detail: "High discharge, braided channels and Assam floodplain dynamics.",
    proof: "Steep relief plus heavy rainfall creates erosion, silt and flood volatility.",
    trap: "River width and braided pattern are not the same as stable drainage.",
  },
  {
    label: "Narmada-Tapi",
    layer: "rivers",
    region: "Peninsular Plateau",
    type: "river",
    x: 39,
    y: 54,
    detail: "West-flowing rift valley rivers and estuarine mouths.",
    proof: "Structural control explains why these rivers do not follow the common east-flowing pattern.",
    trap: "Not all Peninsular rivers form large east-coast deltas.",
  },
  {
    label: "Godavari-Krishna",
    layer: "rivers",
    region: "Peninsular Plateau",
    type: "river",
    x: 55,
    y: 65,
    detail: "East-flowing drainage, deltas, irrigation and inter-state water issues.",
    proof: "Plateau slope and monsoon rainfall connect basin geography with agriculture.",
    trap: "Delta irrigation does not mean uniform water availability across the basin.",
  },
  {
    label: "Jim Corbett NP",
    layer: "national-parks",
    region: "Himalayas",
    type: "park",
    x: 46,
    y: 29,
    detail: "Terai-Bhabar landscape at the Himalayan foothills.",
    proof: "Relief transition creates forest, grassland and riverine habitat diversity.",
    trap: "Protected-area questions often test state, river and physiographic setting together.",
  },
  {
    label: "Kaziranga NP",
    layer: "national-parks",
    region: "Northern Plains",
    type: "park",
    x: 78,
    y: 39,
    detail: "Brahmaputra floodplain grassland and wetland system.",
    proof: "Annual floods sustain grasslands but also create conservation stress.",
    trap: "Flood is ecological process here, not only disaster.",
  },
  {
    label: "Ranthambore NP",
    layer: "national-parks",
    region: "Peninsular Plateau",
    type: "park",
    x: 39,
    y: 43,
    detail: "Dry deciduous Aravalli-Vindhyan transition landscape.",
    proof: "Semi-arid climate, rocky terrain and water bodies shape tiger habitat.",
    trap: "Do not map it to Himalaya or evergreen forest logic.",
  },
  {
    label: "Sundarbans NP",
    layer: "national-parks",
    region: "Coasts and Islands",
    type: "park",
    x: 70,
    y: 53,
    detail: "Mangrove delta, tidal channels and cyclone buffer.",
    proof: "Ganga-Brahmaputra delta ecology links river deposition with coastal protection.",
    trap: "Mangroves are not simply forests; salinity, tides and sediment drive the system.",
  },
  {
    label: "Gir NP",
    layer: "national-parks",
    region: "Peninsular Plateau",
    type: "park",
    x: 24,
    y: 54,
    detail: "Dry deciduous and scrub landscape of Gujarat.",
    proof: "Species distribution, semi-arid ecology and protected area geography converge.",
    trap: "Do not confuse national park, sanctuary and biosphere reserve status.",
  },
  {
    label: "Kutch WLS",
    layer: "wildlife-sanctuaries",
    region: "Coasts and Islands",
    type: "sanctuary",
    x: 20,
    y: 46,
    detail: "Salt desert, seasonal wetlands and arid-zone habitat.",
    proof: "Rann geography connects salinity, seasonal inundation and species adaptation.",
    trap: "Desert landscapes can include wetlands and seasonal water bodies.",
  },
  {
    label: "Vedanthangal WLS",
    layer: "wildlife-sanctuaries",
    region: "Coasts and Islands",
    type: "sanctuary",
    x: 51,
    y: 87,
    detail: "Tank ecosystem and bird habitat in Tamil Nadu.",
    proof: "Local water bodies and monsoon seasonality create migratory bird habitat.",
    trap: "Small sanctuaries can be high-yield map points because state-location traps are common.",
  },
  {
    label: "Wayanad WLS",
    layer: "wildlife-sanctuaries",
    region: "Coasts and Islands",
    type: "sanctuary",
    x: 40,
    y: 75,
    detail: "Western Ghats landscape connecting Nilgiri-Bandipur-Nagarhole belt.",
    proof: "Corridor geography matters for biodiversity movement and conservation.",
    trap: "Protected-area clusters often cross state boundaries.",
  },
  {
    label: "Chilika-Nalabana",
    layer: "wildlife-sanctuaries",
    region: "Coasts and Islands",
    type: "sanctuary",
    x: 65,
    y: 64,
    detail: "Brackish lagoon, wetland ecology and bird habitat.",
    proof: "Coastal geomorphology plus freshwater inflow creates a unique lagoon system.",
    trap: "Lagoon, lake and wetland terms are often used as statement traps.",
  },
  {
    label: "Black Soil Belt",
    layer: "soils-climate",
    region: "Peninsular Plateau",
    type: "soil",
    x: 42,
    y: 58,
    detail: "Regur soil over Deccan basalt, cotton suitability and moisture retention.",
    proof: "Parent rock and climate connect soil texture with crop geography.",
    trap: "Black soil is not a simple rainfall marker; parent material matters.",
  },
  {
    label: "Thar Arid Belt",
    layer: "soils-climate",
    region: "Northern Plains",
    type: "climate",
    x: 27,
    y: 39,
    detail: "Low rainfall, desert soils, high diurnal range and irrigation dependency.",
    proof: "Aridity explains sparse vegetation and canal-based agricultural change.",
    trap: "Desert does not mean no agriculture after irrigation and adaptation.",
  },
  {
    label: "Laterite Belt",
    layer: "soils-climate",
    region: "Coasts and Islands",
    type: "soil",
    x: 35,
    y: 72,
    detail: "Leached soils in high-rainfall tropical belts.",
    proof: "Heavy rainfall and leaching explain soil fertility limitations and plantation crops.",
    trap: "High rainfall does not automatically mean naturally fertile soil.",
  },
  {
    label: "Monsoon Core",
    layer: "soils-climate",
    region: "Northern Plains",
    type: "rain",
    x: 58,
    y: 44,
    detail: "Seasonal rainfall controls cropping calendar, flood and drought rhythm.",
    proof: "Same monsoon system produces different outcomes through relief and location.",
    trap: "A strong all-India monsoon can still leave regional rainfall deficits.",
  },
];

const systemModeNodes: Record<Exclude<LabSlug, "earth-layers" | "monsoon" | "india-map">, { label: string; icon: typeof ShieldAlert; tone: string }[]> = {
  "disaster-link": [
    { label: "Hazard", icon: ShieldAlert, tone: "bg-[#fee2d5] text-[#8a341f]" },
    { label: "Exposure", icon: MapPinned, tone: "bg-[#fef3c7] text-[#805000]" },
    { label: "Mitigation", icon: Target, tone: "bg-[#dff4ea] text-[#085041]" },
  ],
  "environment-bridge": [
    { label: "Climate", icon: CloudRain, tone: "bg-[#dff4ea] text-[#085041]" },
    { label: "Biome", icon: Earth, tone: "bg-[#e5f0ff] text-[#23406f]" },
    { label: "Conservation", icon: Target, tone: "bg-[#fef3c7] text-[#805000]" },
  ],
  "mcq-engine": [
    { label: "Metadata", icon: ClipboardCheck, tone: "bg-[#dff4ea] text-[#085041]" },
    { label: "Difficulty", icon: Gauge, tone: "bg-[#fee2d5] text-[#8a341f]" },
    { label: "Revision", icon: RefreshCcw, tone: "bg-[#e5f0ff] text-[#23406f]" },
  ],
};

function resolveMode(initialMode?: string): LabMode {
  return labModes.find((mode) => mode.slug === initialMode) ?? labModes[0];
}

function resolveSession(day?: number) {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

export function GeographyVisualLab({ initialMode, initialDay }: { initialMode?: string; initialDay?: number }) {
  const router = useRouter();
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeMode, setActiveMode] = useState<LabMode>(() => resolveMode(initialMode));
  const [activeDay, setActiveDay] = useState(resolveSession(initialDay).day);
  const [earthLayer, setEarthLayer] = useState(earthFocus[0]);
  const [monsoonStage, setMonsoonStage] = useState(monsoonFocus[0]);
  const [indiaRegion, setIndiaRegion] = useState(indiaFocus[0]);
  const [indiaLayer, setIndiaLayer] = useState<IndiaAtlasLayer>("physiography");
  const [indiaPointLabel, setIndiaPointLabel] = useState(indiaAtlasPoints[0].label);
  const [labInsight, setLabInsight] = useState("");
  const [labSaved, setLabSaved] = useState(false);
  const [activeProofIndex, setActiveProofIndex] = useState(0);

  const activeSession = resolveSession(activeDay);
  const activeLab = geographyLabs.find((lab) => lab.slug === activeMode.slug);
  const ActiveIcon = activeLab?.icon ?? Layers3;
  const activeProgress = getDayProgress(activeSession.day);
  const isTalkPassed = hasGeographyTalkClearance(activeProgress);
  const activeIndiaPoint = indiaAtlasPoints.find((point) => point.label === indiaPointLabel);
  const normalizedProofIds = normalizeProofIdsForMode(
    activeSession.day,
    activeMode.slug,
    activeProgress?.labProofCompletedIds,
    activeProgress?.labMode
  );
  const savedProofIds =
    normalizedProofIds.length > 0 || activeProgress?.labMode !== activeMode.slug || !activeProgress?.labCompleted
      ? normalizedProofIds
      : geographyLabProofStages.map((stage) => buildProofId(activeSession.day, activeMode.slug, stage.id));
  const savedProofCount = Math.min(savedProofIds.length, geographyLabProofStages.length);
  const labProofCompletion = Math.round((savedProofCount / geographyLabProofStages.length) * 100);
  const activeProofStage = geographyLabProofStages[activeProofIndex] ?? geographyLabProofStages[0];
  const activeProofId = buildProofId(activeSession.day, activeMode.slug, activeProofStage.id);
  const isActiveProofSaved = savedProofIds.includes(activeProofId);
  const isLabEvidenceComplete = savedProofCount >= geographyLabProofStages.length;
  const labSelfHref = `/upsc/geography/lab?mode=${activeMode.slug}&day=${activeSession.day}`;
  const talkHref = `/upsc/geography/talk?day=${activeSession.day}`;
  const mcqHref = `/upsc/geography/mcq-readiness?day=${activeSession.day}`;
  const nextRouteHref = isLabEvidenceComplete ? (isTalkPassed ? mcqHref : talkHref) : labSelfHref;
  const nextRouteLabel = isLabEvidenceComplete ? (isTalkPassed ? "Open MCQ readiness" : "Explain in Talk") : "Finish lab proof";
  const nextRouteDetail = !isLabEvidenceComplete
    ? `Save all five proof stages before leaving the Lab. Current proof: ${savedProofCount}/${geographyLabProofStages.length}.`
    : isTalkPassed
      ? "Talk proof and Lab proof are both saved. Fresh MCQ readiness is the next room."
      : "Lab proof is complete, but Talk proof is still pending. Return to the AI teacher before MCQ readiness.";
  const labEvidenceStatus = !isLabEvidenceComplete ? "proof-pending" : isTalkPassed ? "mcq-ready" : "talk-required";
  const isMcqDirectRouteUnlocked = isTalkPassed && isLabEvidenceComplete;
  const labEvidenceAnchor =
    activeMode.slug === "india-map" && activeIndiaPoint
      ? `${indiaAtlasLayers[indiaLayer].title}: ${activeIndiaPoint.label}`
      : activeMode.title;
  const talkProofDetail = isTalkPassed
    ? `${activeProgress?.talkScore ?? "Saved"}% ${activeProgress?.talkBand ?? "Talk"} proof`
    : "Talk proof still required";
  const labEvidenceSteps: LabEvidenceStep[] = [
    {
      label: "Talk verdict",
      detail: talkProofDetail,
      status: isTalkPassed ? "Done" : "Locked",
      icon: BrainCircuit,
    },
    {
      label: "Map anchor",
      detail: labEvidenceAnchor,
      status: "Active",
      icon: MapPinned,
    },
    {
      label: "Lab proof",
      detail: `${savedProofCount}/${geographyLabProofStages.length} stages saved`,
      status: isLabEvidenceComplete ? "Done" : "Active",
      icon: ClipboardCheck,
    },
    {
      label: "Next room",
      detail: nextRouteLabel,
      status: isLabEvidenceComplete ? (isTalkPassed ? "Ready" : "Locked") : "Locked",
      icon: isLabEvidenceComplete && isTalkPassed ? UnlockKeyhole : LockKeyhole,
    },
  ];
  const labNextLocked = !isLabEvidenceComplete;
  const studentHandoffSteps: GeographyStudentHandoffStep[] = [
    {
      label: "Talk verdict",
      detail: talkProofDetail,
      status: isTalkPassed ? "done" : "locked",
    },
    {
      label: "Visual proof",
      detail: `${savedProofCount}/${geographyLabProofStages.length} proof stages saved`,
      status: isLabEvidenceComplete ? "done" : "current",
    },
    {
      label: "MCQ readiness",
      detail: isMcqDirectRouteUnlocked ? "Fresh practice gate can open" : "Needs Talk and Lab proof together",
      status: isMcqDirectRouteUnlocked ? "next" : "locked",
    },
    {
      label: "Track outcome",
      detail: "Opens after MCQ practice",
      status: "locked",
    },
  ];

  const modeSummary = useMemo(() => {
    if (activeMode.slug === "earth-layers") return earthLayer.detail;
    if (activeMode.slug === "monsoon") return monsoonStage.detail;
    if (activeMode.slug === "india-map") return `${indiaAtlasLayers[indiaLayer].title}: ${activeIndiaPoint?.proof ?? indiaRegion.detail}`;
    return activeMode.objective;
  }, [activeMode, earthLayer, monsoonStage, indiaRegion, indiaLayer, activeIndiaPoint]);
  const proofSuggestion = useMemo(() => {
    if (activeMode.slug === "india-map" && activeIndiaPoint) {
      const atlasTitle = indiaAtlasLayers[indiaLayer].title;
      const mapLine = `${activeIndiaPoint.label} (${activeIndiaPoint.region}) - ${activeIndiaPoint.proof}`;
      const lines: Record<GeographyLabProofStage, string> = {
        concept: `Concept lock: ${activeSession.title} should be read through ${atlasTitle.toLowerCase()} and the selected atlas anchor ${activeIndiaPoint.label}.`,
        map: `Map mechanism: ${mapLine}`,
        example: `India example: ${activeIndiaPoint.label} shows ${activeIndiaPoint.detail}`,
        trap: `UPSC trap at ${activeIndiaPoint.label}: ${activeIndiaPoint.trap}`,
        answer: `Answer hook: Start with ${activeSession.title}, place ${activeIndiaPoint.label} on the map, explain ${activeIndiaPoint.proof}, then close with the trap: ${activeIndiaPoint.trap}`,
      };
      return lines[activeProofStage.id];
    }

    if (activeMode.slug === "monsoon") {
      const config = monsoonStageConfig[monsoonStage.label] ?? monsoonStageConfig.Onset;
      const lines: Record<GeographyLabProofStage, string> = {
        concept: `Concept lock: ${activeSession.title} is a pressure, wind, ITCZ and rainfall mechanism, not only seasonal rain.`,
        map: `Map mechanism: ${config.branch}; ${config.rain}; ${config.pressure}.`,
        example: `India example: ${monsoonStage.label} phase connects with ${monsoonStage.signal} and regional rainfall variation.`,
        trap: "UPSC trap: a strong monsoon can still produce regional drought, break conditions, or uneven rainfall.",
        answer: `Answer hook: Explain ${activeSession.title} through ITCZ shift, pressure gradient, moisture branch, relief and regional exception.`,
      };
      return lines[activeProofStage.id];
    }

    if (activeMode.slug === "earth-layers") {
      const lines: Record<GeographyLabProofStage, string> = {
        concept: `Concept lock: ${activeSession.title} is proved indirectly through seismic behavior and density differences.`,
        map: `Map mechanism: ${earthLayer.label} at ${earthLayer.depth} connects with ${earthLayer.detail}`,
        example: "India example: Himalayan seismicity and plate margins show why interior structure matters for hazards.",
        trap: "UPSC trap: crust, lithosphere and plates are related but not identical terms.",
        answer: `Answer hook: Use ${earthLayer.label}, seismic wave evidence and plate-margin hazard logic to explain the concept.`,
      };
      return lines[activeProofStage.id];
    }

    const lines: Record<GeographyLabProofStage, string> = {
      concept: `Concept lock: ${activeMode.objective}`,
      map: `Map mechanism: connect ${activeMode.title} to one location, exposure pattern, ecological zone, or MCQ metadata path.`,
      example: `India example: attach ${activeSession.title} to one local case before moving forward.`,
      trap: `UPSC trap: ${activeMode.prompt}`,
      answer: `Answer hook: ${activeMode.checkpoints.join(" -> ")}`,
    };
    return lines[activeProofStage.id];
  }, [activeMode, activeSession, activeProofStage.id, activeIndiaPoint, indiaLayer, monsoonStage, earthLayer]);

  useEffect(() => {
    if (!isLoaded) return;
    const saved = getDayProgress(activeSession.day);
    setLabInsight(saved?.labInsight ?? "");
    setLabSaved(Boolean(saved?.labCompleted && saved?.labMode === activeMode.slug));
    setActiveProofIndex(
      Math.min(saved?.labProofIndex ?? saved?.labProofCompletedIds?.length ?? 0, geographyLabProofStages.length - 1)
    );
  }, [activeMode.slug, activeSession.day, getDayProgress, isLoaded]);

  const selectMode = (slug: LabSlug) => {
    const nextMode = resolveMode(slug);
    setActiveMode(nextMode);
    setLabSaved(false);
    setActiveProofIndex(0);
    router.replace(`/upsc/geography/lab?mode=${nextMode.slug}&day=${activeSession.day}`, { scroll: false });
  };

  const selectDay = (day: number) => {
    const boundedDay = Math.min(Math.max(day, 1), geographySessions.length);
    setActiveDay(boundedDay);
    setLabInsight("");
    setLabSaved(false);
    setActiveProofIndex(0);
    router.replace(`/upsc/geography/lab?mode=${activeMode.slug}&day=${boundedDay}`, { scroll: false });
  };

  const saveLabProofStage = () => {
    const atlasAnchor =
      activeMode.slug === "india-map" && activeIndiaPoint
        ? `${indiaAtlasLayers[indiaLayer].title}: ${activeIndiaPoint.label}`
        : activeMode.title;
    const insight = labInsight.trim() || `${activeProofStage.label}: ${modeSummary}`;
    const nextProofIds = Array.from(new Set([...savedProofIds, activeProofId]));
    const nextProofIndex = Math.min(activeProofIndex + 1, geographyLabProofStages.length - 1);
    const isProofComplete = nextProofIds.length >= geographyLabProofStages.length;
    const nextLabEvidenceStatus = !isProofComplete ? "proof-pending" : isTalkPassed ? "mcq-ready" : "talk-required";
    const nextLabRoute = !isProofComplete ? labSelfHref : isTalkPassed ? mcqHref : talkHref;
    const nextLabAction = !isProofComplete ? "Finish lab proof" : isTalkPassed ? "Open MCQ readiness" : "Explain in Talk";

    saveDayProgress(activeSession.day, {
      labCompleted: isProofComplete,
      labMode: activeMode.slug,
      labInsight: insight,
      labFocus: modeSummary,
      labProofIndex: nextProofIndex,
      labProofCompletedIds: nextProofIds,
      labProofSummary: `${activeProofStage.label}: ${insight}`,
      labAtlasLayer: activeMode.slug === "india-map" ? indiaLayer : activeProgress?.labAtlasLayer,
      labAtlasPoint: activeMode.slug === "india-map" ? activeIndiaPoint?.label : activeProgress?.labAtlasPoint,
      labEvidenceStatus: nextLabEvidenceStatus,
      labEvidenceAnchor: atlasAnchor,
      labNextRoute: nextLabRoute,
      labNextActionLabel: nextLabAction,
      activePromptLabel: activeMode.title,
    });
    setLabInsight(isProofComplete ? insight : "");
    setActiveProofIndex(nextProofIndex);
    setLabSaved(isProofComplete);
  };

  const useProofSuggestion = () => {
    setLabInsight(proofSuggestion);
    setLabSaved(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> Geography command room
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Visual Lab</Badge>
              <span className="text-sm font-bold text-[#776f64]">Day {activeSession.day} / {activeMode.eyebrow}</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">{activeMode.title}</h1>
            <p className="mt-4 text-base font-medium leading-7 text-[#5d675f]">{activeMode.objective}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Topic", activeSession.title],
                ["Chapter", activeSession.chapter],
                ["Class lab", activeSession.lab],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-[#13251d]">{value}</p>
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

            <div className="mt-6 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <p className="text-sm font-black text-[#085041]">Talk prompt</p>
              </div>
              <p className="text-sm font-semibold leading-6 text-[#49675e]">{activeMode.prompt}</p>
            </div>

            <div className="mt-6 grid gap-2">
              {geographyLabs.map((lab) => {
                const isActive = lab.slug === activeMode.slug;
                return (
                  <button
                    key={lab.slug}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectMode(lab.slug as LabSlug)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-md border px-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <lab.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-black">{lab.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Interactive board</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">{activeMode.eyebrow}</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                <ActiveIcon className="h-5 w-5" />
              </div>
            </div>

            <VisualStage
              activeMode={activeMode}
              activeSessionDay={activeSession.day}
              earthLayer={earthLayer}
              onEarthLayerChange={setEarthLayer}
              monsoonStage={monsoonStage}
              onMonsoonStageChange={setMonsoonStage}
              indiaRegion={indiaRegion}
              onIndiaRegionChange={setIndiaRegion}
              indiaLayer={indiaLayer}
              onIndiaLayerChange={setIndiaLayer}
              indiaPointLabel={indiaPointLabel}
              onIndiaPointChange={setIndiaPointLabel}
            />

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { label: "Watch", icon: PlayCircle, text: "Visual concept board" },
                { label: "Talk", icon: BrainCircuit, text: modeSummary },
                { label: "Test", icon: ClipboardCheck, text: "Connect to fresh MCQ upload" },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <item.icon className="mb-3 h-4 w-4 text-[#1d9e75]" />
                  <p className="text-sm font-black text-[#13251d]">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#657066]">{item.text}</p>
                </div>
              ))}
            </div>

            <div data-testid="lab-proof-command-board" className="mt-5 rounded-lg border border-[#dcd5c7] bg-white p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d9e75]">Lab evidence command</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">Talk, map, proof, route</h3>
                  <p className="mt-2 break-words text-xs font-bold leading-5 text-[#49675e]">
                    The Lab only opens the next room after the selected visual anchor and all five proof stages are saved.
                  </p>
                </div>
                <span
                  data-testid="lab-evidence-status"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.14em]",
                    labEvidenceStatus === "mcq-ready" && "bg-[#1a3a2a] text-white",
                    labEvidenceStatus === "talk-required" && "bg-[#fff4df] text-[#6f4a12] ring-1 ring-[#ef9f27]/35",
                    labEvidenceStatus === "proof-pending" && "bg-[#f7f4ee] text-[#49675e] ring-1 ring-[#dcd5c7]"
                  )}
                >
                  {labEvidenceStatus.replace("-", " ")}
                </span>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                {labEvidenceSteps.map((step, index) => (
                  <div
                    key={step.label}
                    data-testid={`lab-evidence-step-${step.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                    className={cn(
                      "rounded-md border p-3",
                      step.status === "Done" && "border-[#1d9e75]/45 bg-[#e7f5ee]",
                      step.status === "Active" && "border-[#1a3a2a]/35 bg-[#f7f4ee]",
                      step.status === "Ready" && "border-[#1d9e75]/45 bg-[#e7f5ee]",
                      step.status === "Locked" && "border-[#dcd5c7] bg-[#fbf8f0]"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <step.icon className="h-4 w-4 text-[#1d9e75]" />
                      <span className="text-[11px] font-black text-[#8c5d14]">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{step.label}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#746f66]">{step.status}</p>
                    <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#5d675f]">{step.detail}</p>
                  </div>
                ))}
              </div>

              <div data-testid="lab-route-decision" className="mt-4 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#085041]">Next decision: {nextRouteLabel}</p>
                  <p className="text-xs font-bold text-[#49675e]">Saved route target: {nextRouteHref}</p>
                </div>
              </div>
            </div>

            <div data-testid="lab-completion-panel" className="mt-5 rounded-lg border border-[#cfe5dc] bg-[#f3fbf7] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Lab proof mission</p>
                  <h3 className="mt-1 text-lg font-black text-[#13251d]">
                    {savedProofCount}/{geographyLabProofStages.length} proof stages saved
                  </h3>
                  <p data-testid="lab-next-route-status" className="mt-2 text-xs font-bold leading-5 text-[#49675e]">
                    {labSaved ? nextRouteDetail : activeProofStage.prompt}
                  </p>
                </div>
                {labSaved ? (
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black text-white">
                    <CheckCircle2 className="h-4 w-4" /> Lab saved locally
                  </span>
                ) : null}
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${labProofCompletion}%` }} />
              </div>
              <div data-testid="geography-lab-proof-stages" className="mb-4 grid gap-2 md:grid-cols-5">
                {geographyLabProofStages.map((stage, index) => {
                  const proofId = buildProofId(activeSession.day, activeMode.slug, stage.id);
                  const isStageActive = activeProofIndex === index;
                  const isStageSaved = savedProofIds.includes(proofId);

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      aria-pressed={isStageActive}
                      onClick={() => {
                        setActiveProofIndex(index);
                        setLabInsight("");
                      }}
                      className={cn(
                        "min-h-16 rounded-md border px-3 py-2 text-left text-xs font-black transition",
                        isStageActive
                          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                          : isStageSaved
                            ? "border-[#1d9e75]/40 bg-white text-[#085041]"
                            : "border-[#dcd5c7] bg-white text-[#5f665f] hover:border-[#1d9e75]"
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        {index + 1}. {stage.label}
                        {isStageSaved ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div
                data-testid="geography-lab-proof-helper"
                className="mb-4 rounded-md border border-[#cfe5dc] bg-white/75 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Selected proof seed</p>
                    <p data-testid="geography-lab-proof-suggestion" className="mt-2 break-words text-sm font-bold leading-6 text-[#34453b]">
                      {proofSuggestion}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="geography-lab-use-proof-suggestion"
                    onClick={useProofSuggestion}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-[#f7f4ee] px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                  >
                    <Compass className="h-4 w-4" /> Load proof
                  </button>
                </div>
              </div>
              <textarea
                data-testid="geography-lab-proof-input"
                value={labInsight}
                onChange={(event) => {
                  setLabInsight(event.target.value);
                  setLabSaved(false);
                }}
                rows={4}
                placeholder={activeProofStage.prompt}
                className="w-full resize-none rounded-md border border-[#cfc6b6] bg-white px-3 py-2 text-sm font-semibold leading-6 text-[#13251d] outline-none transition placeholder:text-[#8d8579] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  data-testid="geography-lab-save-proof"
                  onClick={saveLabProofStage}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  <ClipboardCheck className="h-4 w-4" /> {isActiveProofSaved ? "Proof saved" : "Save proof"}
                </button>
                <Link
                  data-testid="lab-primary-route"
                  href={nextRouteHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  {isTalkPassed ? <ClipboardCheck className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                  {nextRouteLabel}
                </Link>
                {isMcqDirectRouteUnlocked ? (
                  <Link
                    data-testid="lab-direct-mcq-route"
                    href={`/upsc/geography/mcq-readiness?day=${activeSession.day}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-black text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                  >
                    <ClipboardCheck className="h-4 w-4" /> MCQ readiness
                  </Link>
                ) : (
                  <button
                    type="button"
                    data-testid="lab-direct-mcq-route"
                    disabled
                    aria-disabled="true"
                    title="MCQ readiness opens after Talk proof and all five Lab proof stages are complete."
                    className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] px-3 text-sm font-black text-[#8a8174]"
                  >
                    <LockKeyhole className="h-4 w-4" /> MCQ locked
                  </button>
                )}
              </div>
            </div>

            <GeographyLoopActions className="mt-5" activeDay={activeSession.day} labSlug={activeMode.slug} current="lab" onSelectDay={selectDay} />
          </div>
        </section>

        <GeographyStudentHandoffStrip
          testId="lab"
          activeDay={activeSession.day}
          title="You are in Visual Lab. Convert recall into proof."
          detail="Save five visual proof stages so the learner cannot jump from explanation to practice without map, example, trap, and answer evidence."
          previous={{
            label: "Talk room",
            detail: "Return to Talk if the AI teacher verdict is missing or the explanation needs repair.",
            href: talkHref,
          }}
          next={{
            label: nextRouteLabel,
            detail: labNextLocked
              ? `Save ${geographyLabProofStages.length - savedProofCount} more proof stage${geographyLabProofStages.length - savedProofCount === 1 ? "" : "s"} before leaving the Lab.`
              : nextRouteDetail,
            href: nextRouteHref,
            locked: labNextLocked,
          }}
          steps={studentHandoffSteps}
        />
      </div>
      <GeographyVisualLabStyles />
    </div>
  );
}

function VisualStage({
  activeMode,
  activeSessionDay,
  earthLayer,
  onEarthLayerChange,
  monsoonStage,
  onMonsoonStageChange,
  indiaRegion,
  onIndiaRegionChange,
  indiaLayer,
  onIndiaLayerChange,
  indiaPointLabel,
  onIndiaPointChange,
}: {
  activeMode: LabMode;
  activeSessionDay: number;
  earthLayer: (typeof earthFocus)[number];
  onEarthLayerChange: (item: (typeof earthFocus)[number]) => void;
  monsoonStage: (typeof monsoonFocus)[number];
  onMonsoonStageChange: (item: (typeof monsoonFocus)[number]) => void;
  indiaRegion: (typeof indiaFocus)[number];
  onIndiaRegionChange: (item: (typeof indiaFocus)[number]) => void;
  indiaLayer: IndiaAtlasLayer;
  onIndiaLayerChange: (layer: IndiaAtlasLayer) => void;
  indiaPointLabel: string;
  onIndiaPointChange: (label: string) => void;
}) {
  if (activeMode.slug === "earth-layers") {
    return <EarthLayerScene activeLayer={earthLayer} onLayerChange={onEarthLayerChange} />;
  }

  if (activeMode.slug === "monsoon") {
    return <MonsoonScene activeStage={monsoonStage} onStageChange={onMonsoonStageChange} />;
  }

  if (activeMode.slug === "india-map") {
    return (
      <IndiaMapScene
        activeLayer={indiaLayer}
        activeRegion={indiaRegion}
        activePointLabel={indiaPointLabel}
        onLayerChange={onIndiaLayerChange}
        onPointChange={onIndiaPointChange}
        onRegionChange={onIndiaRegionChange}
      />
    );
  }

  return <SystemBridgeScene activeMode={activeMode} activeSessionDay={activeSessionDay} />;
}

function EarthLayerScene({
  activeLayer,
  onLayerChange,
}: {
  activeLayer: (typeof earthFocus)[number];
  onLayerChange: (item: (typeof earthFocus)[number]) => void;
}) {
  const activeIndex = earthFocus.findIndex((layer) => layer.label === activeLayer.label);
  const activeDiagnostic = earthDiagnostics[activeLayer.label] ?? earthDiagnostics.Crust;

  return (
    <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_280px]">
      <div data-testid="earth-seismic-cutaway" className="geo-lab-stage geo-earth-stage min-h-[520px] rounded-lg border border-[#bfd9cd] bg-[#071d18] p-5 text-white">
        <div className="geo-atlas-label absolute left-5 top-5 z-10 rounded-md border border-white/15 bg-black/25 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#89f0c1]">Seismic cutaway</p>
          <p className="mt-1 text-sm font-black">{activeLayer.depth}</p>
        </div>

        <div className="geo-earth-orbit orbit-one" />
        <div className="geo-earth-orbit orbit-two" />
        <div className="geo-seismic-wave wave-one" />
        <div className="geo-seismic-wave wave-two" />

        <div className="geo-earth-tilt" aria-label="Animated Earth layer cutaway">
          <div className="geo-earth-sphere">
            <div className="geo-earth-grid" />
            <div className={cn("geo-earth-layer crust", activeLayer.label === "Crust" && "is-active")} />
            <div className={cn("geo-earth-layer mantle", activeLayer.label === "Mantle" && "is-active")} />
            <div className={cn("geo-earth-layer outer-core", activeLayer.label === "Outer Core" && "is-active")} />
            <div className={cn("geo-earth-layer inner-core", activeLayer.label === "Inner Core" && "is-active")} />
            <div className="geo-earth-slice" />
            <Mountain className="geo-earth-icon h-9 w-9" />
          </div>
        </div>

        <svg
          data-testid="earth-seismic-ray-map"
          className="geo-seismic-ray-map"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Seismic ray board showing P-wave refraction and S-wave blocking"
        >
          <path className="geo-seismic-ray p-wave" d="M6 76 C24 42 38 31 50 50 C62 69 76 58 94 24" />
          <path className={cn("geo-seismic-ray s-wave", activeLayer.label === "Outer Core" && "is-blocked")} d="M8 24 C28 44 39 48 50 50 C61 52 72 57 92 76" />
          <path className="geo-seismic-shadow" d="M63 17 C82 26 93 43 94 62" />
          <circle className="geo-ray-station station-one" cx="6" cy="76" r="2.2" />
          <circle className="geo-ray-station station-two" cx="94" cy="24" r="2.2" />
          <circle className="geo-ray-station station-three" cx="92" cy="76" r="2.2" />
        </svg>

        <div data-testid="earth-seismic-evidence-console" className="geo-seismic-console">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#89f0c1]">Ray logic</p>
            <p data-testid="earth-active-ray-label" className="mt-1 text-sm font-black text-white">{activeDiagnostic.ray}</p>
          </div>
          <div className="mt-3 grid gap-2">
            {[
              ["Wave behavior", activeDiagnostic.wave],
              ["Hazard link", activeDiagnostic.hazard],
              ["UPSC trap", activeDiagnostic.trap],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#89f0c1]">{label}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-white/78">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="geo-earth-layer-controls absolute bottom-5 left-5 right-5 z-10 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {earthFocus.map((layer, index) => {
            const isActive = layer.label === activeLayer.label;
            return (
              <button
                key={layer.label}
                type="button"
                data-testid={`earth-layer-${slugifyAtlasTestId(layer.label)}`}
                aria-pressed={isActive}
                onClick={() => onLayerChange(layer)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-xs font-black transition",
                  isActive ? "border-[#89f0c1] bg-[#89f0c1] text-[#071d18]" : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                )}
              >
                <span className="block">0{index + 1}. {layer.label}</span>
                <span className="mt-1 block text-[10px] font-bold opacity-75">{layer.depth}</span>
              </button>
            );
          })}
        </div>

        <div className="absolute right-5 top-5 z-10 w-44 rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#89f0c1]">Active evidence</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-white/80">
            Layer {activeIndex + 1}: {activeDiagnostic.proof}
          </p>
        </div>
      </div>

      <FocusPanel
        title={activeLayer.label}
        kicker={activeLayer.depth}
        detail={activeLayer.detail}
        items={earthFocus}
        active={activeLayer.label}
        onSelect={onLayerChange}
      />
    </div>
  );
}

function MonsoonScene({
  activeStage,
  onStageChange,
}: {
  activeStage: (typeof monsoonFocus)[number];
  onStageChange: (item: (typeof monsoonFocus)[number]) => void;
}) {
  const config = monsoonStageConfig[activeStage.label] ?? monsoonStageConfig.Onset;

  return (
    <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="geo-lab-stage geo-monsoon-stage min-h-[430px] rounded-lg border border-[#bfd9cd] bg-[#071d18] p-5 text-white">
        <div className="absolute left-5 top-5 z-10 rounded-md border border-white/15 bg-black/25 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#89f0c1]">Monsoon engine</p>
          <p className="mt-1 text-sm font-black">{activeStage.signal}</p>
        </div>

        <div className="geo-sun"><Sun className="h-8 w-8" /></div>
        <div className="geo-itcz-band" style={{ top: config.itcz }}>
          <span>ITCZ</span>
        </div>

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" role="img" aria-label="Animated monsoon wind paths">
          <path className="geo-ocean" d="M0 64 C16 56 24 63 34 54 C46 43 55 48 70 34 C82 22 92 28 100 18 L100 100 L0 100 Z" />
          <path className="geo-india-outline" d="M37 8 L42 10 L45 15 L51 17 L58 24 L66 28 L75 34 L72 42 L65 49 L62 58 L58 69 L54 79 L51 91 L47 97 L43 91 L39 80 L34 72 L29 61 L22 54 L15 49 L10 40 L15 32 L24 27 L30 18 Z" />
          <path className="geo-flow arabian" d="M5 82 C18 71 26 62 36 52 C43 45 49 40 57 34" />
          <path className="geo-flow bay" d="M91 76 C78 62 70 55 62 48 C56 42 52 36 49 28" />
          <path className="geo-flow retreat" d="M59 32 C69 42 78 54 91 66" />
          <path className="geo-rain-belt" d="M26 54 C37 42 50 38 67 40" />
        </svg>

        <div className="geo-pressure-marker low">L</div>
        <div className="geo-pressure-marker high">H</div>

        <div className="absolute bottom-5 left-5 right-5 z-10 grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
            <Wind className="mb-2 h-4 w-4 text-[#89f0c1]" />
            <p className="text-xs font-black">{config.branch}</p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
            <CloudRain className="mb-2 h-4 w-4 text-[#89f0c1]" />
            <p className="text-xs font-black">{config.rain}</p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
            <Gauge className="mb-2 h-4 w-4 text-[#89f0c1]" />
            <p className="text-xs font-black">{config.pressure}</p>
          </div>
        </div>
      </div>

      <FocusPanel
        title={activeStage.label}
        kicker={activeStage.signal}
        detail={activeStage.detail}
        items={monsoonFocus}
        active={activeStage.label}
        onSelect={onStageChange}
      />
    </div>
  );
}

function IndiaMapScene({
  activeLayer,
  activeRegion,
  activePointLabel,
  onLayerChange,
  onPointChange,
  onRegionChange,
}: {
  activeLayer: IndiaAtlasLayer;
  activeRegion: (typeof indiaFocus)[number];
  activePointLabel: string;
  onLayerChange: (layer: IndiaAtlasLayer) => void;
  onPointChange: (label: string) => void;
  onRegionChange: (item: (typeof indiaFocus)[number]) => void;
}) {
  const activeLayerMeta = indiaAtlasLayers[activeLayer];
  const activePoints = indiaAtlasPoints.filter((point) => point.layer === activeLayer);
  const activePoint =
    activePoints.find((point) => point.label === activePointLabel) ??
    activePoints.find((point) => point.region === activeRegion.label) ??
    activePoints[0];
  const LayerIcon = activeLayerMeta.icon;

  const resolveRegion = (regionLabel: string) => indiaFocus.find((region) => region.label === regionLabel) ?? indiaFocus[0];

  const selectLayer = (layer: IndiaAtlasLayer) => {
    const firstPoint = indiaAtlasPoints.find((point) => point.layer === layer) ?? indiaAtlasPoints[0];
    onLayerChange(layer);
    onPointChange(firstPoint.label);
    onRegionChange(resolveRegion(firstPoint.region));
  };

  const selectPoint = (point: IndiaAtlasPoint) => {
    onPointChange(point.label);
    onRegionChange(resolveRegion(point.region));
  };

  return (
    <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_280px]">
      <div data-testid="india-layered-atlas" className="geo-lab-stage geo-india-stage min-h-[520px] rounded-lg border border-[#bfd9cd] bg-[#071d18] p-5 text-white">
        <div className="absolute left-5 top-5 z-10 rounded-md border border-white/15 bg-black/25 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#89f0c1]">Layered atlas</p>
          <p className="mt-1 text-sm font-black">{activeLayerMeta.title}</p>
          <p className="mt-1 max-w-[190px] text-[10px] font-bold leading-4 text-white/65">{activeLayerMeta.cue}</p>
        </div>

        <div className="geo-atlas-layer-switcher absolute right-5 top-5 z-10 grid max-w-[250px] grid-cols-2 gap-2 rounded-md border border-white/15 bg-black/25 p-2 backdrop-blur md:grid-cols-1">
          {(Object.keys(indiaAtlasLayers) as IndiaAtlasLayer[]).map((layer) => {
            const layerMeta = indiaAtlasLayers[layer];
            const isActive = activeLayer === layer;
            const Icon = layerMeta.icon;
            return (
              <button
                key={layer}
                type="button"
                data-testid={`india-layer-${layer}`}
                aria-pressed={isActive}
                onClick={() => selectLayer(layer)}
                className={cn(
                  "flex min-h-9 items-center gap-2 rounded-md border px-2 text-left text-[10px] font-black transition",
                  isActive
                    ? "border-[#89f0c1] bg-[#89f0c1] text-[#071d18]"
                    : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{layerMeta.title}</span>
              </button>
            );
          })}
        </div>

        <div className="geo-atlas-board">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" role="img" aria-label="Interactive India physical map">
            <path className="geo-india-land" d="M36 4 L42 7 L48 13 L55 18 L63 24 L72 30 L82 36 L78 45 L70 52 L65 60 L61 72 L56 84 L51 96 L46 91 L42 81 L36 72 L30 63 L21 55 L13 49 L9 40 L14 31 L24 25 L30 15 Z" />
            <path className="geo-himalaya-line" d="M30 15 C42 12 57 17 77 34" />
            <path className="geo-river-line" d="M39 31 C50 36 59 38 71 43" />
            <path className="geo-river-line secondary" d="M53 45 C49 56 50 68 46 83" />
            <path className="geo-ghats-line" d="M32 52 C30 61 31 72 42 90" />
            {activeLayer === "rivers" ? (
              <>
                <path className="geo-major-river indus" d="M27 19 C31 25 31 33 25 41 C22 46 21 51 24 56" />
                <path className="geo-major-river ganga" d="M43 32 C52 36 61 38 73 43" />
                <path className="geo-major-river brahmaputra" d="M73 30 C80 35 80 42 72 47" />
                <path className="geo-major-river peninsular" d="M43 52 C49 58 57 63 66 66" />
              </>
            ) : null}
            {activeLayer === "soils-climate" ? (
              <>
                <path className="geo-soil-zone black" d="M32 48 C43 46 51 51 57 59 C48 65 40 64 32 57 Z" />
                <path className="geo-soil-zone arid" d="M16 32 C28 28 35 35 31 47 C22 48 15 42 16 32 Z" />
                <path className="geo-soil-zone laterite" d="M31 60 C37 66 39 77 45 89 C37 86 31 76 29 66 Z" />
              </>
            ) : null}
          </svg>

          {activePoints.map((marker) => {
            const isActive = marker.label === activePoint.label;
            const MarkerIcon =
              marker.type === "river"
                ? Droplets
                : marker.type === "cyclone"
                  ? Waves
                  : marker.type === "mineral"
                    ? Zap
                    : marker.type === "rain" || marker.type === "climate"
                      ? CloudRain
                      : marker.type === "park"
                        ? Earth
                        : marker.type === "sanctuary"
                          ? ShieldAlert
                          : marker.type === "soil"
                            ? Layers3
                            : Mountain;
            return (
              <button
                key={marker.label}
                type="button"
                data-testid={`india-atlas-marker-${slugifyAtlasTestId(marker.label)}`}
                onClick={() => selectPoint(marker)}
                className={cn("geo-map-marker", isActive && "is-active")}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                <MarkerIcon className="h-3.5 w-3.5" />
                <span>{marker.label}</span>
              </button>
            );
          })}
        </div>

        <div className="geo-atlas-readout absolute bottom-5 left-5 right-5 z-10 grid gap-3 lg:grid-cols-[0.9fr_1fr_1fr]">
          <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
            <LayerIcon className="mb-2 h-4 w-4 text-[#89f0c1]" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#89f0c1]">Selected point</p>
            <p className="mt-1 text-sm font-black">{activePoint.label}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-white/75">{activePoint.detail}</p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
            <CheckCircle2 className="mb-2 h-4 w-4 text-[#89f0c1]" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#89f0c1]">Map proof</p>
            <p className="mt-1 text-xs font-bold leading-5 text-white/80">{activePoint.proof}</p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
            <ShieldAlert className="mb-2 h-4 w-4 text-[#f5b75a]" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5b75a]">UPSC trap</p>
            <p className="mt-1 text-xs font-bold leading-5 text-white/80">{activePoint.trap}</p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4">
        <FocusPanel
          title={activeRegion.label}
          kicker={activeLayerMeta.title}
          detail={`${activeRegion.detail} Active marker: ${activePoint.label}.`}
          items={indiaFocus}
          active={activeRegion.label}
          onSelect={(region) => {
            const nextPoint = activePoints.find((point) => point.region === region.label) ?? activePoints[0];
            onRegionChange(region);
            onPointChange(nextPoint.label);
          }}
        />

        <div data-testid="india-atlas-drill-list" className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Route className="h-4 w-4 text-[#1d9e75]" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Atlas drill deck</p>
          </div>
          <div className="grid gap-2">
            {activePoints.map((point) => {
              const isActive = point.label === activePoint.label;
              return (
                <button
                  key={point.label}
                  type="button"
                  data-testid={`india-atlas-point-${slugifyAtlasTestId(point.label)}`}
                  aria-pressed={isActive}
                  onClick={() => selectPoint(point)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left transition",
                    isActive
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-white text-[#34453b] hover:border-[#1d9e75]"
                  )}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-black">
                    {point.label}
                    <span className="text-[10px] uppercase tracking-[0.12em] opacity-70">{point.region}</span>
                  </span>
                  <span className="mt-1 block text-xs font-semibold leading-5 opacity-75">{point.proof}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div data-testid="india-atlas-command-chain" className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#085041]" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#085041]">Command chain</p>
          </div>
          <div className="grid gap-2 text-xs font-bold leading-5 text-[#34453b]">
            <p>
              <span className="font-black text-[#085041]">Point:</span> {activePoint.label} / {activePoint.detail}
            </p>
            <p>
              <span className="font-black text-[#085041]">Proof:</span> {activePoint.proof}
            </p>
            <p>
              <span className="font-black text-[#085041]">Trap:</span> {activePoint.trap}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemBridgeScene({ activeMode, activeSessionDay }: { activeMode: LabMode; activeSessionDay: number }) {
  const nodes = systemModeNodes[activeMode.slug as Exclude<LabSlug, "earth-layers" | "monsoon" | "india-map">];

  return (
    <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="geo-lab-stage min-h-[430px] rounded-lg border border-[#bfd9cd] bg-[#071d18] p-5 text-white">
        <div className="absolute left-5 top-5 z-10 rounded-md border border-white/15 bg-black/25 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#89f0c1]">System flow</p>
          <p className="mt-1 text-sm font-black">Day {activeSessionDay}</p>
        </div>

        <div className="geo-system-orbit" />
        <div className="relative z-10 mx-auto flex min-h-[300px] max-w-2xl items-center justify-center">
          <div className="grid w-full gap-4 md:grid-cols-3">
            {nodes.map((node, index) => (
              <div key={node.label} className="geo-system-node rounded-lg border border-white/15 bg-white/10 p-4 text-center backdrop-blur">
                <div className={cn("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg", node.tone)}>
                  <node.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-black">{node.label}</p>
                <p className="mt-2 text-[11px] font-semibold leading-5 text-white/70">{activeMode.checkpoints[index]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-5 left-5 right-5 z-10 grid gap-2">
          {activeMode.checkpoints.map((checkpoint, index) => (
            <div key={checkpoint} className="flex items-start gap-3 rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#89f0c1]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#89f0c1]">Checkpoint {index + 1}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-white/80">{checkpoint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Mode summary</p>
        <p className="mt-3 text-sm font-bold leading-6 text-[#34453b]">{activeMode.objective}</p>
        <Link
          href={activeMode.slug === "mcq-engine" ? `/upsc/geography/mcq-readiness?day=${activeSessionDay}` : `/upsc/geography?day=${activeSessionDay}`}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white"
        >
          {activeMode.slug === "mcq-engine" ? <ClipboardCheck className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
          {activeMode.slug === "mcq-engine" ? "Open MCQ Engine" : "Back to session"}
        </Link>
      </div>
    </div>
  );
}

function FocusPanel<T extends FocusItem>({
  title,
  kicker,
  detail,
  items,
  active,
  onSelect,
}: {
  title: string;
  kicker: string;
  detail: string;
  items: T[];
  active: string;
  onSelect: (item: T) => void;
}) {
  return (
    <div className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{kicker}</p>
      <h3 className="mt-2 text-xl font-black text-[#13251d]">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#657066]">{detail}</p>

      <div className="mt-5 grid gap-2">
        {items.map((item) => {
          const isActive = item.label === active;
          return (
            <button
              key={item.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(item)}
              className={cn(
                "rounded-md border px-3 py-2 text-left transition",
                isActive
                  ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                  : "border-[#dcd5c7] bg-white text-[#34453b] hover:border-[#1d9e75]"
              )}
            >
              <span className="block text-sm font-black">{item.label}</span>
              <span className="mt-1 block text-xs font-semibold opacity-75">{item.depth ?? item.signal ?? "Focus point"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GeographyVisualLabStyles() {
  return (
    <style jsx global>{`
      .geo-lab-stage {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 22px 60px rgba(7, 29, 24, 0.18);
      }

      .geo-lab-stage::before {
        content: "";
        position: absolute;
        inset: -20%;
        z-index: 0;
        background:
          radial-gradient(circle at 28% 22%, rgba(137, 240, 193, 0.22), transparent 26%),
          radial-gradient(circle at 72% 24%, rgba(239, 159, 39, 0.18), transparent 28%),
          linear-gradient(135deg, rgba(255, 255, 255, 0.07), transparent 38%),
          #071d18;
      }

      .geo-lab-stage::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        background-image:
          linear-gradient(rgba(137, 240, 193, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(137, 240, 193, 0.06) 1px, transparent 1px);
        background-size: 34px 34px;
        mask-image: radial-gradient(circle at center, black, transparent 76%);
      }

      .geo-earth-tilt {
        position: absolute;
        inset: 72px 0 118px;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        perspective: 950px;
      }

      .geo-earth-sphere {
        position: relative;
        width: min(58vw, 320px);
        aspect-ratio: 1;
        border-radius: 999px;
        transform: rotateX(62deg) rotateZ(-18deg);
        transform-style: preserve-3d;
        animation: geo-sphere-drift 18s linear infinite;
        box-shadow:
          inset -30px -34px 56px rgba(0, 0, 0, 0.35),
          inset 20px 20px 35px rgba(255, 255, 255, 0.14),
          0 0 72px rgba(137, 240, 193, 0.2);
      }

      .geo-earth-grid,
      .geo-earth-layer,
      .geo-earth-slice,
      .geo-earth-icon {
        position: absolute;
        inset: 0;
        border-radius: inherit;
      }

      .geo-earth-grid {
        z-index: 6;
        background:
          repeating-linear-gradient(0deg, transparent 0 18px, rgba(255, 255, 255, 0.08) 19px 20px),
          repeating-linear-gradient(90deg, transparent 0 18px, rgba(255, 255, 255, 0.06) 19px 20px);
        mix-blend-mode: screen;
        opacity: 0.5;
      }

      .geo-earth-layer {
        transition: transform 240ms ease, filter 240ms ease, opacity 240ms ease;
      }

      .geo-earth-layer.crust {
        background: radial-gradient(circle, rgba(71, 121, 86, 0.6), rgba(23, 57, 44, 0.98) 67%, #0b2c22 100%);
      }

      .geo-earth-layer.mantle {
        inset: 13%;
        background: radial-gradient(circle, #f1b856, #b4652e 62%, #6d321d);
      }

      .geo-earth-layer.outer-core {
        inset: 29%;
        background: radial-gradient(circle, #ffdf6f, #ef9f27 58%, #a94a1f);
      }

      .geo-earth-layer.inner-core {
        inset: 42%;
        background: radial-gradient(circle, #fff7d8, #f3c04e 50%, #b3542c);
        box-shadow: 0 0 32px rgba(239, 159, 39, 0.45);
      }

      .geo-earth-layer.is-active {
        filter: saturate(1.45) brightness(1.18);
        transform: translateZ(22px) scale(1.035);
      }

      .geo-earth-slice {
        z-index: 7;
        background: conic-gradient(from 288deg, rgba(255, 255, 255, 0.78) 0 38deg, transparent 39deg 360deg);
        opacity: 0.22;
      }

      .geo-earth-icon {
        inset: 50% auto auto 50%;
        z-index: 8;
        color: #071d18;
        transform: translate(-50%, -50%) rotateZ(18deg);
      }

      .geo-earth-orbit,
      .geo-seismic-wave,
      .geo-system-orbit {
        position: absolute;
        z-index: 1;
        border-radius: 999px;
        pointer-events: none;
      }

      .geo-earth-orbit {
        inset: 86px 16%;
        border: 1px solid rgba(137, 240, 193, 0.2);
        transform: rotate(-12deg);
      }

      .geo-earth-orbit.orbit-two {
        inset: 110px 23%;
        border-color: rgba(239, 159, 39, 0.22);
        transform: rotate(28deg);
      }

      .geo-seismic-wave {
        left: 50%;
        top: 50%;
        height: 54px;
        width: 54px;
        border: 2px solid rgba(137, 240, 193, 0.5);
        transform: translate(-50%, -50%);
        animation: geo-wave 2.8s ease-out infinite;
      }

      .geo-seismic-wave.wave-two {
        animation-delay: 1.25s;
        border-color: rgba(239, 159, 39, 0.45);
      }

      .geo-seismic-ray-map {
        position: absolute;
        inset: 82px 8% 172px;
        z-index: 4;
        overflow: visible;
        pointer-events: none;
      }

      .geo-seismic-ray {
        fill: none;
        stroke-linecap: round;
        stroke-width: 1.4;
        stroke-dasharray: 5 7;
        filter: drop-shadow(0 0 6px rgba(137, 240, 193, 0.36));
        animation: geo-flow 2s linear infinite;
      }

      .geo-seismic-ray.p-wave {
        stroke: #89f0c1;
      }

      .geo-seismic-ray.s-wave {
        stroke: #f5b75a;
        animation-delay: -0.8s;
      }

      .geo-seismic-ray.s-wave.is-blocked {
        stroke: #fb7185;
        stroke-dasharray: 2 8;
        opacity: 0.9;
      }

      .geo-seismic-shadow {
        fill: none;
        stroke: rgba(251, 113, 133, 0.64);
        stroke-width: 5;
        stroke-linecap: round;
        stroke-dasharray: 3 6;
        opacity: 0.42;
        filter: blur(0.2px);
      }

      .geo-ray-station {
        fill: #f7f4ee;
        stroke: #071d18;
        stroke-width: 0.7;
      }

      .geo-seismic-console {
        position: absolute;
        right: 5%;
        top: 92px;
        z-index: 9;
        width: min(250px, 34%);
        max-height: 300px;
        overflow-y: auto;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(0, 0, 0, 0.32);
        padding: 14px;
        backdrop-filter: blur(14px);
      }

      .geo-earth-layer-controls {
        z-index: 12;
      }

      .geo-sun {
        position: absolute;
        right: 7%;
        top: 12%;
        z-index: 3;
        display: flex;
        height: 76px;
        width: 76px;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: radial-gradient(circle, #fff6bd, #ef9f27 62%, rgba(239, 159, 39, 0));
        color: #4d2b00;
        box-shadow: 0 0 58px rgba(239, 159, 39, 0.48);
        animation: geo-pulse 4s ease-in-out infinite;
      }

      .geo-itcz-band {
        position: absolute;
        left: 8%;
        right: 8%;
        z-index: 4;
        height: 2px;
        border-top: 2px dashed rgba(255, 223, 111, 0.9);
        transition: top 300ms ease;
      }

      .geo-itcz-band span {
        position: absolute;
        right: 0;
        top: -16px;
        border-radius: 999px;
        background: rgba(255, 223, 111, 0.16);
        padding: 2px 8px;
        color: #ffdf6f;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.18em;
      }

      .geo-ocean {
        fill: rgba(42, 128, 148, 0.18);
      }

      .geo-india-outline,
      .geo-india-land {
        fill: rgba(247, 244, 238, 0.18);
        stroke: rgba(137, 240, 193, 0.75);
        stroke-width: 0.8;
      }

      .geo-flow,
      .geo-rain-belt {
        fill: none;
        stroke-linecap: round;
        stroke-width: 1.25;
        stroke-dasharray: 6 8;
        animation: geo-flow 1.8s linear infinite;
      }

      .geo-flow.arabian {
        stroke: #89f0c1;
      }

      .geo-flow.bay {
        stroke: #7dd3fc;
        animation-delay: -0.7s;
      }

      .geo-flow.retreat {
        stroke: #f5b75a;
        animation-delay: -1.2s;
      }

      .geo-rain-belt {
        stroke: #d9f99d;
        stroke-width: 2;
        opacity: 0.8;
      }

      .geo-pressure-marker {
        position: absolute;
        z-index: 5;
        display: flex;
        height: 36px;
        width: 36px;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        border: 2px solid currentColor;
        background: rgba(0, 0, 0, 0.3);
        font-size: 15px;
        font-weight: 900;
        backdrop-filter: blur(10px);
      }

      .geo-pressure-marker.low {
        left: 36%;
        top: 32%;
        color: #fb7185;
        box-shadow: 0 0 28px rgba(251, 113, 133, 0.32);
      }

      .geo-pressure-marker.high {
        left: 18%;
        top: 70%;
        color: #7dd3fc;
        box-shadow: 0 0 28px rgba(125, 211, 252, 0.28);
      }

      .geo-atlas-board {
        position: absolute;
        inset: 54px 6% 96px;
        z-index: 2;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: radial-gradient(circle at 52% 46%, rgba(137, 240, 193, 0.11), rgba(255, 255, 255, 0.04) 48%, rgba(0, 0, 0, 0.08));
      }

      .geo-india-stage .geo-atlas-board {
        inset: 98px 6% 194px;
      }

      .geo-himalaya-line,
      .geo-river-line,
      .geo-ghats-line {
        fill: none;
        stroke-linecap: round;
        stroke-width: 1.4;
        stroke-dasharray: 4 5;
        animation: geo-flow 2.2s linear infinite;
      }

      .geo-himalaya-line {
        stroke: #f7f4ee;
      }

      .geo-river-line {
        stroke: #7dd3fc;
      }

      .geo-river-line.secondary {
        opacity: 0.65;
      }

      .geo-ghats-line {
        stroke: #89f0c1;
      }

      .geo-major-river {
        fill: none;
        stroke: #7dd3fc;
        stroke-width: 1.5;
        stroke-linecap: round;
        stroke-dasharray: 5 6;
        filter: drop-shadow(0 0 4px rgba(125, 211, 252, 0.5));
        animation: geo-flow 2s linear infinite;
      }

      .geo-major-river.ganga {
        stroke: #89f0c1;
      }

      .geo-major-river.brahmaputra {
        stroke: #d9f99d;
      }

      .geo-major-river.peninsular {
        stroke: #f5b75a;
      }

      .geo-soil-zone {
        stroke-width: 0.5;
        stroke: rgba(255, 255, 255, 0.38);
        opacity: 0.46;
        animation: geo-soil-pulse 4.5s ease-in-out infinite;
      }

      .geo-soil-zone.black {
        fill: #5a3d2b;
      }

      .geo-soil-zone.arid {
        fill: #d8a64f;
      }

      .geo-soil-zone.laterite {
        fill: #b9532f;
      }

      .geo-map-marker {
        position: absolute;
        z-index: 5;
        display: inline-flex;
        max-width: 150px;
        transform: translate(-50%, -50%);
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.1);
        padding: 6px 8px;
        color: white;
        font-size: 10px;
        font-weight: 900;
        line-height: 1.1;
        text-align: left;
        backdrop-filter: blur(12px);
        transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
      }

      .geo-map-marker:hover,
      .geo-map-marker.is-active {
        transform: translate(-50%, -50%) scale(1.08);
        border-color: #89f0c1;
        background: #89f0c1;
        color: #071d18;
        box-shadow: 0 0 28px rgba(137, 240, 193, 0.35);
      }

      .geo-system-orbit {
        inset: 78px 18%;
        border: 1px dashed rgba(137, 240, 193, 0.24);
        animation: geo-orbit 18s linear infinite;
      }

      .geo-system-node {
        min-height: 176px;
        animation: geo-float 4.8s ease-in-out infinite;
      }

      .geo-system-node:nth-child(2) {
        animation-delay: -1.3s;
      }

      .geo-system-node:nth-child(3) {
        animation-delay: -2.6s;
      }

      @keyframes geo-sphere-drift {
        from {
          transform: rotateX(62deg) rotateZ(-18deg) rotateY(0deg);
        }
        to {
          transform: rotateX(62deg) rotateZ(-18deg) rotateY(360deg);
        }
      }

      @keyframes geo-wave {
        from {
          opacity: 0.65;
          transform: translate(-50%, -50%) scale(0.45);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(5.8);
        }
      }

      @keyframes geo-flow {
        to {
          stroke-dashoffset: -28;
        }
      }

      @keyframes geo-pulse {
        50% {
          transform: scale(1.08);
          box-shadow: 0 0 78px rgba(239, 159, 39, 0.62);
        }
      }

      @keyframes geo-orbit {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes geo-float {
        50% {
          transform: translateY(-8px);
        }
      }

      @keyframes geo-soil-pulse {
        50% {
          opacity: 0.68;
        }
      }

      @media (max-width: 760px) {
        .geo-earth-stage {
          min-height: 820px;
        }

        .geo-india-stage {
          min-height: 760px;
        }

        .geo-earth-tilt {
          inset: 92px 0 168px;
        }

        .geo-earth-sphere {
          width: min(76vw, 260px);
        }

        .geo-seismic-ray-map {
          inset: 172px 4% 412px;
        }

        .geo-seismic-console {
          left: 4%;
          right: 4%;
          top: auto;
          bottom: 152px;
          width: auto;
          max-height: 230px;
        }

        .geo-atlas-board {
          inset: 66px 4% 150px;
        }

        .geo-india-stage .geo-atlas-board {
          inset: 188px 4% 316px;
        }

        .geo-atlas-layer-switcher {
          left: 20px;
          right: 20px;
          top: 96px;
          max-width: none;
        }

        .geo-atlas-readout {
          grid-template-columns: 1fr;
        }

        .geo-map-marker {
          max-width: 112px;
          font-size: 9px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .geo-earth-sphere,
        .geo-seismic-wave,
        .geo-seismic-ray,
        .geo-flow,
        .geo-rain-belt,
        .geo-himalaya-line,
        .geo-river-line,
        .geo-ghats-line,
        .geo-major-river,
        .geo-soil-zone,
        .geo-sun,
        .geo-system-orbit,
        .geo-system-node {
          animation: none !important;
        }
      }
    `}</style>
  );
}
