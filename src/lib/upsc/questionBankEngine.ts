import { geographySessions } from "@/lib/upsc/plan";
import type { StudentLevel, StudentProfile } from "@/lib/upsc/studentProfile";
import type { GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD" | "PYQ_STYLE";

export type PracticeQuestion = {
  id: string;
  subjectSlug: "geography";
  linkedDay: number;
  topic: string;
  difficulty: QuestionDifficulty;
  stem: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  trap: string;
  source: "NCERT_BASE" | "REFERENCE_ADVANCED" | "PYQ_PATTERN" | "CURRENT_AFFAIRS_BRIDGE";
};

export type QuestionBankRecommendation = {
  learnerLevel: StudentLevel;
  recommendedDifficulty: QuestionDifficulty;
  recommendedCount: number;
  averageRecall: number | null;
  averageMcq: number | null;
  consistencyPercent: number;
  recoveryCount: number;
  commandCount: number;
  reason: string;
  targetDays: number[];
};

export type QuestionBankSelection = {
  recommendation: QuestionBankRecommendation;
  questions: PracticeQuestion[];
};

export type GeographyProgressInput = Record<string, GeographyDayProgress | undefined>;

export const questionDifficulties: QuestionDifficulty[] = ["EASY", "MEDIUM", "HARD", "PYQ_STYLE"];

export const geographyQuestionBank: PracticeQuestion[] = [
  {
    id: "geo-d02-easy-rotation",
    subjectSlug: "geography",
    linkedDay: 2,
    topic: "Earth, Universe, and Location",
    difficulty: "EASY",
    stem: "Which basic geographic idea explains why places at different longitudes experience different local times?",
    options: {
      A: "Earth's rotation",
      B: "Earth's revolution",
      C: "Seasonal migration of the ITCZ",
      D: "Ocean-current circulation",
    },
    correctOption: "A",
    explanation: "Local time differs mainly because Earth rotates from west to east, bringing different longitudes under the Sun at different times.",
    trap: "Do not confuse daily rotation with annual revolution.",
    source: "NCERT_BASE",
  },
  {
    id: "geo-d02-medium-gis-scale",
    subjectSlug: "geography",
    linkedDay: 2,
    topic: "Earth, Universe, and Location",
    difficulty: "MEDIUM",
    stem: "In remote-sensing interpretation, why is spatial resolution important for UPSC map-based questions?",
    options: {
      A: "It decides how small an object can be detected",
      B: "It decides the legal boundary of a state",
      C: "It eliminates the need for ground verification",
      D: "It fixes the latitude of the satellite",
    },
    correctOption: "A",
    explanation: "Spatial resolution describes the ground detail visible in imagery, so it affects whether small features can be identified.",
    trap: "Resolution is not the same as administrative jurisdiction.",
    source: "REFERENCE_ADVANCED",
  },
  {
    id: "geo-d03-hard-plate-boundary",
    subjectSlug: "geography",
    linkedDay: 3,
    topic: "Plate Tectonics",
    difficulty: "HARD",
    stem: "A deep ocean trench, volcanic arc, and strong earthquakes occur together most commonly in which tectonic setting?",
    options: {
      A: "Divergent continental rift",
      B: "Oceanic-continental or oceanic-oceanic subduction",
      C: "Stable shield region",
      D: "Passive continental margin",
    },
    correctOption: "B",
    explanation: "Subduction zones generate trenches, volcanic arcs, and earthquakes due to one plate descending beneath another.",
    trap: "Passive margins may have sediments and shelves, but not the trench-volcanic arc-earthquake package.",
    source: "REFERENCE_ADVANCED",
  },
  {
    id: "geo-d03-easy-rock-cycle",
    subjectSlug: "geography",
    linkedDay: 3,
    topic: "Geomorphology Foundations",
    difficulty: "EASY",
    stem: "Weathering, erosion, transportation, and deposition together most directly help explain which geographic process?",
    options: {
      A: "Landform development",
      B: "Only time-zone calculation",
      C: "Only ocean salinity",
      D: "Only electoral boundaries",
    },
    correctOption: "A",
    explanation: "External geomorphic processes shape landforms by breaking, moving, and depositing material.",
    trap: "Do not treat geomorphology as only tectonics; exogenic processes also matter.",
    source: "NCERT_BASE",
  },
  {
    id: "geo-d04-hard-volcanism",
    subjectSlug: "geography",
    linkedDay: 4,
    topic: "Volcanism and Earthquakes",
    difficulty: "HARD",
    stem: "A shield volcano is generally associated with which eruption style and landform logic?",
    options: {
      A: "Low-viscosity basaltic lava spreading over broad slopes",
      B: "Only explosive rhyolitic ash forming steep cones",
      C: "Only river deposition in floodplains",
      D: "Only wind erosion in deserts",
    },
    correctOption: "A",
    explanation: "Shield volcanoes commonly form from fluid basaltic lava that travels far and builds broad, gentle slopes.",
    trap: "Do not apply one volcano model to every volcanic landform.",
    source: "REFERENCE_ADVANCED",
  },
  {
    id: "geo-d02-pyq-latitude",
    subjectSlug: "geography",
    linkedDay: 2,
    topic: "Earth, Universe, and Location",
    difficulty: "PYQ_STYLE",
    stem: "If a question asks why the Sun appears overhead between the Tropics, which concept is most directly relevant?",
    options: {
      A: "Earth's axial tilt and apparent annual migration of the overhead Sun",
      B: "Only ocean tides",
      C: "Only magnetic declination",
      D: "Only international date line rules",
    },
    correctOption: "A",
    explanation: "The overhead Sun shifts between the Tropics because Earth's axis is tilted during its revolution around the Sun.",
    trap: "UPSC may mix latitude and season; do not solve it as a longitude-only time problem.",
    source: "PYQ_PATTERN",
  },
  {
    id: "geo-d05-easy-monsoon",
    subjectSlug: "geography",
    linkedDay: 5,
    topic: "Climatology",
    difficulty: "EASY",
    stem: "The seasonal reversal of winds over the Indian subcontinent is most directly associated with which phenomenon?",
    options: {
      A: "Monsoon circulation",
      B: "Tsunami propagation",
      C: "Tidal locking",
      D: "Laterite formation",
    },
    correctOption: "A",
    explanation: "Monsoon circulation is characterized by seasonal wind reversal linked with land-sea heating contrast and pressure changes.",
    trap: "Do not treat monsoon only as rainfall; it is a wind system first.",
    source: "NCERT_BASE",
  },
  {
    id: "geo-d05-medium-el-nino",
    subjectSlug: "geography",
    linkedDay: 5,
    topic: "Climatology",
    difficulty: "MEDIUM",
    stem: "Why can El Nino years create stress for Indian agriculture?",
    options: {
      A: "They may weaken monsoon rainfall distribution",
      B: "They stop all western disturbances permanently",
      C: "They shift India into the Southern Hemisphere",
      D: "They make tides disappear from the Indian Ocean",
    },
    correctOption: "A",
    explanation: "El Nino can weaken or disturb monsoon performance, although the relationship is probabilistic and interacts with other drivers.",
    trap: "Avoid absolute statements; El Nino influence is not a mechanical guarantee every year.",
    source: "CURRENT_AFFAIRS_BRIDGE",
  },
  {
    id: "geo-d05-pyq-jet-stream",
    subjectSlug: "geography",
    linkedDay: 5,
    topic: "Climatology",
    difficulty: "PYQ_STYLE",
    stem: "Consider the following: Tibetan heating, subtropical jet stream shift, ITCZ migration. Which of these are relevant to Indian monsoon onset logic?",
    options: {
      A: "1 and 2 only",
      B: "2 and 3 only",
      C: "1 and 3 only",
      D: "1, 2 and 3",
    },
    correctOption: "D",
    explanation: "Thermal contrast, jet-stream shift, and ITCZ migration all help explain monsoon onset and structure.",
    trap: "UPSC often combines mechanisms across scales; do not isolate one factor.",
    source: "PYQ_PATTERN",
  },
  {
    id: "geo-d06-easy-currents",
    subjectSlug: "geography",
    linkedDay: 6,
    topic: "Oceanography",
    difficulty: "EASY",
    stem: "Which factor is most directly responsible for generating large-scale surface ocean currents?",
    options: {
      A: "Planetary winds and Earth's rotation",
      B: "Only earthquakes",
      C: "Only river deposition",
      D: "Only volcanic ash",
    },
    correctOption: "A",
    explanation: "Surface currents are driven largely by winds and shaped by Coriolis force, basin shape, and density contrasts.",
    trap: "Earthquakes can trigger tsunamis, not regular surface-current systems.",
    source: "NCERT_BASE",
  },
  {
    id: "geo-d06-medium-coral",
    subjectSlug: "geography",
    linkedDay: 6,
    topic: "Oceanography",
    difficulty: "MEDIUM",
    stem: "Coral bleaching is best understood as a stress response linked mainly to which condition?",
    options: {
      A: "Sustained sea-surface temperature anomaly",
      B: "Complete absence of sunlight everywhere",
      C: "Permanent freezing of tropical oceans",
      D: "Replacement of tides by river flow",
    },
    correctOption: "A",
    explanation: "Warm-water stress can cause corals to expel symbiotic algae, resulting in bleaching.",
    trap: "Coral bleaching is not simply a color change; it signals ecological stress.",
    source: "CURRENT_AFFAIRS_BRIDGE",
  },
  {
    id: "geo-d08-hard-himalaya",
    subjectSlug: "geography",
    linkedDay: 8,
    topic: "India Relief and Physiography",
    difficulty: "HARD",
    stem: "Which combination makes the Himalayan region especially prone to landslides?",
    options: {
      A: "Young fold mountains, steep slopes, seismicity, and intense rainfall",
      B: "Ancient stable shield, flat relief, and no drainage",
      C: "Only desert winds and lack of settlement",
      D: "Only coastal wave erosion",
    },
    correctOption: "A",
    explanation: "The Himalaya's young geology, steep terrain, seismic activity, rainfall, and human intervention create high landslide vulnerability.",
    trap: "Do not explain Himalayan hazards through only one factor.",
    source: "REFERENCE_ADVANCED",
  },
  {
    id: "geo-d09-medium-basin",
    subjectSlug: "geography",
    linkedDay: 9,
    topic: "Drainage and River Systems",
    difficulty: "MEDIUM",
    stem: "A river basin with steep slopes and intense rainfall is more likely to show which flood behavior?",
    options: {
      A: "Rapid runoff and sharper flood peaks",
      B: "No runoff under any condition",
      C: "Permanent disappearance of tributaries",
      D: "Elimination of erosion",
    },
    correctOption: "A",
    explanation: "Slope and rainfall intensity can increase runoff speed, producing sharper flood peaks.",
    trap: "Flood risk depends on basin form and land use, not rainfall alone.",
    source: "REFERENCE_ADVANCED",
  },
  {
    id: "geo-d09-pyq-river",
    subjectSlug: "geography",
    linkedDay: 9,
    topic: "Drainage and River Systems",
    difficulty: "PYQ_STYLE",
    stem: "For a river-based prelims question, which pairing gives the strongest elimination base?",
    options: {
      A: "Source region and direction of flow",
      B: "Only the river name length",
      C: "Only whether the river appears in a news headline",
      D: "Only the nearest airport",
    },
    correctOption: "A",
    explanation: "Source, course, tributary relation, and direction of flow are high-value anchors for river map questions.",
    trap: "A familiar river name is not enough without spatial logic.",
    source: "PYQ_PATTERN",
  },
  {
    id: "geo-d12-easy-soil",
    subjectSlug: "geography",
    linkedDay: 12,
    topic: "Soils and Vegetation",
    difficulty: "EASY",
    stem: "Black soil is commonly associated with which major agricultural crop in India?",
    options: {
      A: "Cotton",
      B: "Tea only",
      C: "Coconut only",
      D: "Rubber only",
    },
    correctOption: "A",
    explanation: "Black cotton soils have moisture-retention properties and are strongly associated with cotton cultivation.",
    trap: "Do not map every cash crop to black soil.",
    source: "NCERT_BASE",
  },
  {
    id: "geo-d10-hard-groundwater",
    subjectSlug: "geography",
    linkedDay: 10,
    topic: "Water Resources",
    difficulty: "HARD",
    stem: "Why can groundwater stress be severe even in regions that receive seasonal rainfall?",
    options: {
      A: "Extraction, recharge limits, aquifer type, cropping pattern, and urban demand interact",
      B: "Rainfall automatically recharges every aquifer fully",
      C: "Groundwater is unrelated to crops or cities",
      D: "Only latitude decides aquifer storage",
    },
    correctOption: "A",
    explanation: "Groundwater stress depends on recharge, extraction, geology, crops, urban demand, and governance.",
    trap: "Do not assume annual rainfall alone proves water security.",
    source: "REFERENCE_ADVANCED",
  },
  {
    id: "geo-d13-hard-critical-minerals",
    subjectSlug: "geography",
    linkedDay: 13,
    topic: "Resources and Agriculture",
    difficulty: "HARD",
    stem: "Why is geographic distribution important in critical-mineral policy?",
    options: {
      A: "It shapes supply security, transport cost, geopolitics, and industrial location",
      B: "It makes all minerals equally available everywhere",
      C: "It removes the need for imports permanently",
      D: "It decides monsoon onset dates directly",
    },
    correctOption: "A",
    explanation: "Mineral geography influences supply chains, strategic dependence, processing clusters, and industrial policy.",
    trap: "Resource presence does not automatically mean domestic self-sufficiency.",
    source: "CURRENT_AFFAIRS_BRIDGE",
  },
  {
    id: "geo-d14-pyq-map",
    subjectSlug: "geography",
    linkedDay: 14,
    topic: "India Map Drill",
    difficulty: "PYQ_STYLE",
    stem: "A place-in-news question is best solved by first identifying which pair?",
    options: {
      A: "State/region and nearest physical feature",
      B: "Only the spelling of the capital city",
      C: "Only the year of newspaper publication",
      D: "Only the language spoken locally",
    },
    correctOption: "A",
    explanation: "Map-based UPSC questions often require state/region plus nearby river, mountain, coast, pass, or border logic.",
    trap: "Place-in-news preparation is not a memory list; it needs spatial anchoring.",
    source: "PYQ_PATTERN",
  },
  {
    id: "geo-d18-medium-transport",
    subjectSlug: "geography",
    linkedDay: 18,
    topic: "Transport and Trade",
    difficulty: "MEDIUM",
    stem: "Why do freight corridors affect regional development?",
    options: {
      A: "They reduce logistics friction and connect production regions with markets",
      B: "They make terrain irrelevant everywhere",
      C: "They stop all urbanization",
      D: "They remove the need for ports",
    },
    correctOption: "A",
    explanation: "Transport corridors influence market access, logistics cost, industrial location, and regional growth.",
    trap: "Corridors interact with terrain and markets; they do not erase geography.",
    source: "CURRENT_AFFAIRS_BRIDGE",
  },
  {
    id: "geo-d24-hard-disaster",
    subjectSlug: "geography",
    linkedDay: 24,
    topic: "Disaster Geography Bridge",
    difficulty: "HARD",
    stem: "In disaster geography, risk is best understood through which relationship?",
    options: {
      A: "Hazard, exposure, vulnerability, and capacity",
      B: "Only hazard magnitude",
      C: "Only population size",
      D: "Only rainfall in millimetres",
    },
    correctOption: "A",
    explanation: "Disaster risk emerges from the interaction between hazard, exposed assets/population, vulnerability, and coping capacity.",
    trap: "A strong hazard is not always a disaster if exposure and vulnerability are low.",
    source: "REFERENCE_ADVANCED",
  },
  {
    id: "geo-d25-pyq-ecosystem",
    subjectSlug: "geography",
    linkedDay: 25,
    topic: "Environment Geography Bridge",
    difficulty: "PYQ_STYLE",
    stem: "For a protected-area question, which sequence is most useful for UPSC elimination?",
    options: {
      A: "Locate ecosystem, identify state/region, connect flagship species or biome",
      B: "Ignore location and memorize only the notification year",
      C: "Assume every sanctuary is in the Himalaya",
      D: "Use only the nearest airport",
    },
    correctOption: "A",
    explanation: "Protected-area questions are usually solved through ecosystem-location-species logic.",
    trap: "Administrative names alone are weak unless tied to map and ecology.",
    source: "PYQ_PATTERN",
  },
];

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function hasStarted(progress?: GeographyDayProgress) {
  return Boolean(
    progress?.watched ||
      progress?.reflection?.trim() ||
      progress?.baselineSavedAt ||
      typeof progress?.talkScore === "number" ||
      progress?.labCompleted ||
      progress?.mcqAttempted ||
      progress?.mcqCompleted ||
      progress?.meTimeCompletedAt
  );
}

function needsRecovery(progress?: GeographyDayProgress) {
  return Boolean(
    progress?.revisitQueued ||
      progress?.talkBand === "Revisit" ||
      progress?.mcqOutcome === "Revisit" ||
      progress?.confidence === "Shaky"
  );
}

function hasCommand(progress?: GeographyDayProgress) {
  return Boolean(
    !needsRecovery(progress) &&
      (progress?.confidence === "Command" || progress?.mcqOutcome === "Command" || (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= 75))
  );
}

function resolveLearnerLevel(profile?: Pick<StudentProfile, "level"> | null): StudentLevel {
  return profile?.level ?? "beginner";
}

export function buildQuestionBankRecommendation(
  progress: GeographyProgressInput,
  profile?: Pick<StudentProfile, "level"> | null
): QuestionBankRecommendation {
  const learnerLevel = resolveLearnerLevel(profile);
  const dayStates = geographySessions.map((session) => progress[String(session.day)]);
  const startedDays = geographySessions.filter((session) => hasStarted(progress[String(session.day)]));
  const recoveryDays = geographySessions.filter((session) => needsRecovery(progress[String(session.day)]));
  const commandDays = geographySessions.filter((session) => hasCommand(progress[String(session.day)]));
  const recallScores = dayStates
    .map((state) => state?.talkScore)
    .filter((score): score is number => typeof score === "number");
  const mcqScores = dayStates
    .map((state) => state?.mcqScorePercent)
    .filter((score): score is number => typeof score === "number");
  const averageRecall = average(recallScores);
  const averageMcq = average(mcqScores);
  const consistencyPercent = Math.min(100, Math.round((startedDays.length / 7) * 100));
  const weakDays =
    recoveryDays.length > 0
      ? recoveryDays
      : geographySessions.filter((session) => {
          const state = progress[String(session.day)];
          return typeof state?.talkScore === "number" && state.talkScore < 95;
        });
  const targetDays = (weakDays.length ? weakDays : startedDays).map((session) => session.day);

  let recommendedDifficulty: QuestionDifficulty = "MEDIUM";
  let reason = "Balanced practice is recommended until recall and MCQ evidence mature.";

  if (
    recoveryDays.length > 0 ||
    (averageRecall !== null && averageRecall < 70) ||
    (averageMcq !== null && averageMcq < 50)
  ) {
    recommendedDifficulty = "EASY";
    reason = "Recovery or low-score evidence is active, so the next set should rebuild basics first.";
  } else if (
    averageRecall !== null &&
    averageRecall >= 95 &&
    averageMcq !== null &&
    averageMcq >= 80 &&
    commandDays.length >= 3
  ) {
    recommendedDifficulty = "HARD";
    reason = "Recall, MCQ score, and command days are strong enough for advanced traps.";
  } else if (averageRecall !== null && averageRecall >= 90 && commandDays.length >= 2) {
    recommendedDifficulty = "PYQ_STYLE";
    reason = "Recall is near command, so PYQ-style elimination practice is useful.";
  } else if (consistencyPercent < 45) {
    recommendedDifficulty = "MEDIUM";
    reason = "Consistency evidence is still thin; use moderate sets before heavy traps.";
  }

  const baseRecommendedCount =
    recommendedDifficulty === "EASY"
      ? 5
      : learnerLevel === "advanced"
        ? 10
        : learnerLevel === "intermediate"
          ? 8
          : 5;
  const availableQuestionCount = geographyQuestionBank.filter(
    (question) => question.difficulty === recommendedDifficulty
  ).length;
  const recommendedCount = Math.min(baseRecommendedCount, availableQuestionCount || baseRecommendedCount);

  return {
    learnerLevel,
    recommendedDifficulty,
    recommendedCount,
    averageRecall,
    averageMcq,
    consistencyPercent,
    recoveryCount: recoveryDays.length,
    commandCount: commandDays.length,
    reason,
    targetDays,
  };
}

export function selectQuestionBankSet({
  progress,
  profile,
  difficulty,
  count,
}: {
  progress: GeographyProgressInput;
  profile?: Pick<StudentProfile, "level"> | null;
  difficulty?: QuestionDifficulty;
  count?: number;
}): QuestionBankSelection {
  const recommendation = buildQuestionBankRecommendation(progress, profile);
  const selectedDifficulty = difficulty ?? recommendation.recommendedDifficulty;
  const selectedCount = count ?? recommendation.recommendedCount;
  const targetDaySet = new Set(recommendation.targetDays);
  const questionPool = geographyQuestionBank.filter((question) => question.difficulty === selectedDifficulty);
  const targeted = questionPool.filter((question) => targetDaySet.has(question.linkedDay));
  const fallback = questionPool.filter((question) => !targetDaySet.has(question.linkedDay));
  const questions = [...targeted, ...fallback].slice(0, selectedCount);

  return {
    recommendation,
    questions,
  };
}
