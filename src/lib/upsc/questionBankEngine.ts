import { geographySessions } from "@/lib/upsc/plan";
import type { PyqImportRecord } from "@/lib/upsc/pyqImportLedger";
import type { StudentLevel, StudentProfile } from "@/lib/upsc/studentProfile";
import { subjectPlans } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD" | "PYQ_STYLE";
export type QuestionSource =
  | "NCERT_BASE"
  | "REFERENCE_ADVANCED"
  | "PYQ_PATTERN"
  | "CURRENT_AFFAIRS_BRIDGE"
  | "EXACT_PYQ_IMPORT";
export type QuestionOption = "A" | "B" | "C" | "D";

export type QuestionBankSession = {
  day: number;
  week: number;
  title: string;
  chapter: string;
  anchor: string;
};

export type QuestionBankSubject = {
  slug: string;
  title: string;
  window: string;
  route: string;
  sessions: QuestionBankSession[];
};

export type PracticeQuestion = {
  id: string;
  subjectSlug: string;
  subjectTitle?: string;
  linkedDay: number;
  topic: string;
  difficulty: QuestionDifficulty;
  stem: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  correctOption: QuestionOption;
  explanation: string;
  trap: string;
  source: QuestionSource;
  sourceHref?: string;
  officialSourceTitle?: string;
  sourceYear?: number;
  questionNumber?: string;
  answerDemand?: string;
  isExactPyqImport?: boolean;
};

export type QuestionBankAttempt = {
  questionId: string;
  subjectSlug: string;
  linkedDay: number;
  topic: string;
  difficulty: QuestionDifficulty;
  source: QuestionSource;
  selectedOption: QuestionOption;
  correctOption: QuestionOption;
  isCorrect: boolean;
  solvedAt: string;
};

export type QuestionBankRecommendation = {
  learnerLevel: StudentLevel;
  adaptiveLevel: StudentLevel;
  adaptiveReadinessScore: number;
  adaptiveSignals: {
    recallPoints: number;
    consistencyPoints: number;
    mcqPoints: number;
    ledgerPoints: number;
    commandBonus: number;
    recoveryPenalty: number;
  };
  recommendedDifficulty: QuestionDifficulty;
  recommendedCount: number;
  averageRecall: number | null;
  averageMcq: number | null;
  consistencyPercent: number;
  recoveryCount: number;
  commandCount: number;
  teacherDoubtCount: number;
  solvedCount: number;
  solvedAccuracyPercent: number | null;
  unresolvedIncorrectCount: number;
  teacherDoubt: {
    day: number;
    category: string;
    reason: string;
    repairAction: string;
    masteryCheck: string;
  } | null;
  reason: string;
  targetDays: number[];
};

export type QuestionBankSelection = {
  recommendation: QuestionBankRecommendation;
  questions: PracticeQuestion[];
};

export type QuestionBankCustomMix = Record<QuestionDifficulty, number>;

export type QuestionBankCustomSelection = QuestionBankSelection & {
  mix: QuestionBankCustomMix;
  requestedTotal: number;
};

export type QuestionBankCoverageRow = {
  subjectSlug: string;
  subjectTitle: string;
  totalDays: number;
  expectedDifficultySlots: number;
  coveredDifficultySlots: number;
  totalQuestions: number;
  curatedQuestions: number;
  generatedQuestions: number;
  fullCoverage: boolean;
  availableByDifficulty: Record<QuestionDifficulty, number>;
};

export type QuestionBankCoverageSummary = {
  subjectCount: number;
  totalDays: number;
  expectedDifficultySlots: number;
  coveredDifficultySlots: number;
  totalQuestions: number;
  curatedQuestions: number;
  generatedQuestions: number;
  fullCoverageSubjects: number;
};

export type QuestionBankProgress = SubjectDayProgress & {
  meTimeCompletedAt?: string;
};

export type QuestionBankProgressInput = Record<string, QuestionBankProgress | undefined>;
export type QuestionBankAttemptInput = QuestionBankAttempt[];

export const questionDifficulties: QuestionDifficulty[] = ["EASY", "MEDIUM", "HARD", "PYQ_STYLE"];
export const questionBankAttemptStorageKey = "sarit-upsc-question-bank-attempts-v1";

export const emptyQuestionBankMix: QuestionBankCustomMix = {
  EASY: 0,
  MEDIUM: 0,
  HARD: 0,
  PYQ_STYLE: 0,
};

export const questionBankSubjects: QuestionBankSubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
    route: "/upsc/geography",
    sessions: geographySessions,
  },
  ...[
    subjectPlans.environment,
    subjectPlans["disaster-management"],
    subjectPlans.economy,
    subjectPlans["science-tech"],
    subjectPlans["polity-governance"],
    subjectPlans["internal-security-society"],
    subjectPlans.history,
  ].map((plan) => ({
    slug: plan.slug,
    title: plan.title,
    window: plan.window,
    route: `/upsc/${plan.slug}`,
    sessions: plan.sessions,
  })),
];

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

const sourceByDifficulty: Record<QuestionDifficulty, QuestionSource> = {
  EASY: "NCERT_BASE",
  MEDIUM: "REFERENCE_ADVANCED",
  HARD: "CURRENT_AFFAIRS_BRIDGE",
  PYQ_STYLE: "PYQ_PATTERN",
};

function generatedStem(subject: QuestionBankSubject, session: QuestionBankSession, difficulty: QuestionDifficulty) {
  if (difficulty === "EASY") {
    return `In ${subject.title}, which foundation idea should a student first connect with "${session.anchor}"?`;
  }
  if (difficulty === "MEDIUM") {
    return `For ${session.title}, what is the most useful reference-level bridge after NCERT basics are clear?`;
  }
  if (difficulty === "HARD") {
    return `A current-affairs update is linked to ${session.title}. Which approach best converts it into UPSC-ready understanding?`;
  }
  return `A PYQ-style question from ${subject.title} asks about ${session.chapter}. Which method gives the strongest elimination base?`;
}

function generatedExplanation(subject: QuestionBankSubject, session: QuestionBankSession, difficulty: QuestionDifficulty) {
  if (difficulty === "EASY") {
    return `Start with the NCERT-level meaning of ${session.chapter}, then attach the anchor: ${session.anchor}.`;
  }
  if (difficulty === "MEDIUM") {
    return `The reference layer should move from definition to cause, mechanism, example, and limitation for ${session.title}.`;
  }
  if (difficulty === "HARD") {
    return `Current affairs become useful only when the static base, institution or process, and consequence are connected.`;
  }
  return `PYQ-style practice is strongest when syllabus line, repeated pattern, trap, and answer demand are read together.`;
}

function generatedTrap(subject: QuestionBankSubject, difficulty: QuestionDifficulty) {
  if (difficulty === "EASY") return `Do not jump to advanced ${subject.title} facts before the basic concept is stable.`;
  if (difficulty === "MEDIUM") return "Do not memorize one reference-book line without the cause-effect chain.";
  if (difficulty === "HARD") return "Do not treat a news item as useful unless it links to an already-covered static topic.";
  return "Do not solve PYQs as isolated facts; read the repeated demand and elimination trap.";
}

function buildGeneratedSubjectQuestion(
  subject: QuestionBankSubject,
  session: QuestionBankSession,
  difficulty: QuestionDifficulty
): PracticeQuestion {
  return {
    id: `${subject.slug}-d${String(session.day).padStart(2, "0")}-${difficulty.toLowerCase()}`,
    subjectSlug: subject.slug,
    subjectTitle: subject.title,
    linkedDay: session.day,
    topic: session.title,
    difficulty,
    stem: generatedStem(subject, session, difficulty),
    options: {
      A: "Connect syllabus demand, concept logic, example, and trap type",
      B: "Memorize the heading without examples",
      C: "Skip the static topic and read only news headlines",
      D: "Treat every question as a one-line factual recall",
    },
    correctOption: "A",
    explanation: generatedExplanation(subject, session, difficulty),
    trap: generatedTrap(subject, difficulty),
    source: sourceByDifficulty[difficulty],
  };
}

function subjectQuestionSlot(question: Pick<PracticeQuestion, "linkedDay" | "difficulty">) {
  return `${question.linkedDay}:${question.difficulty}`;
}

function buildGeneratedSubjectBank(subject: QuestionBankSubject) {
  const existingSlots = new Set(
    geographyQuestionBank
      .filter((question) => question.subjectSlug === subject.slug)
      .map(subjectQuestionSlot)
  );

  return subject.sessions
    .flatMap((session) =>
      questionDifficulties
        .filter((difficulty) => !existingSlots.has(subjectQuestionSlot({ linkedDay: session.day, difficulty })))
        .map((difficulty) => buildGeneratedSubjectQuestion(subject, session, difficulty))
    );
}

export const allPracticeQuestionBank: PracticeQuestion[] = [
  ...geographyQuestionBank.map((question) => ({ ...question, subjectTitle: "Geography" })),
  ...questionBankSubjects.flatMap(buildGeneratedSubjectBank),
];

function countByDifficulty(questions: PracticeQuestion[]) {
  return questionDifficulties.reduce(
    (counts, difficulty) => ({
      ...counts,
      [difficulty]: questions.filter((question) => question.difficulty === difficulty).length,
    }),
    {} as Record<QuestionDifficulty, number>
  );
}

export const questionBankCoverageRows: QuestionBankCoverageRow[] = questionBankSubjects.map((subject) => {
  const subjectQuestions = allPracticeQuestionBank.filter((question) => question.subjectSlug === subject.slug);
  const coveredSlots = new Set(subjectQuestions.map(subjectQuestionSlot));
  const expectedDifficultySlots = subject.sessions.length * questionDifficulties.length;
  const curatedQuestions = geographyQuestionBank.filter((question) => question.subjectSlug === subject.slug).length;
  const coveredDifficultySlots = subject.sessions.reduce(
    (sum, session) =>
      sum +
      questionDifficulties.filter((difficulty) =>
        coveredSlots.has(subjectQuestionSlot({ linkedDay: session.day, difficulty }))
      ).length,
    0
  );

  return {
    subjectSlug: subject.slug,
    subjectTitle: subject.title,
    totalDays: subject.sessions.length,
    expectedDifficultySlots,
    coveredDifficultySlots,
    totalQuestions: subjectQuestions.length,
    curatedQuestions,
    generatedQuestions: subjectQuestions.length - curatedQuestions,
    fullCoverage: coveredDifficultySlots === expectedDifficultySlots,
    availableByDifficulty: countByDifficulty(subjectQuestions),
  };
});

export const questionBankCoverageSummary: QuestionBankCoverageSummary = questionBankCoverageRows.reduce(
  (summary, row) => ({
    subjectCount: summary.subjectCount + 1,
    totalDays: summary.totalDays + row.totalDays,
    expectedDifficultySlots: summary.expectedDifficultySlots + row.expectedDifficultySlots,
    coveredDifficultySlots: summary.coveredDifficultySlots + row.coveredDifficultySlots,
    totalQuestions: summary.totalQuestions + row.totalQuestions,
    curatedQuestions: summary.curatedQuestions + row.curatedQuestions,
    generatedQuestions: summary.generatedQuestions + row.generatedQuestions,
    fullCoverageSubjects: summary.fullCoverageSubjects + (row.fullCoverage ? 1 : 0),
  }),
  {
    subjectCount: 0,
    totalDays: 0,
    expectedDifficultySlots: 0,
    coveredDifficultySlots: 0,
    totalQuestions: 0,
    curatedQuestions: 0,
    generatedQuestions: 0,
    fullCoverageSubjects: 0,
  }
);

export function getQuestionBankSubject(slug: string) {
  return questionBankSubjects.find((subject) => subject.slug === slug) ?? questionBankSubjects[0];
}

export function getQuestionBankForSubject(subjectSlug: string) {
  return allPracticeQuestionBank.filter((question) => question.subjectSlug === subjectSlug);
}

function normalizeMatchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function resolvePyqLinkedDay(subject: QuestionBankSubject, record: PyqImportRecord) {
  const searchNeedles = [
    record.syllabusArea,
    record.syllabusNodeId ?? "",
    record.answerDemand ?? "",
    ...record.topicTags,
  ]
    .map(normalizeMatchText)
    .filter(Boolean);

  const matchedSession = subject.sessions.find((session) => {
    const haystack = normalizeMatchText(`${session.title} ${session.chapter} ${session.anchor}`);
    return searchNeedles.some((needle) => haystack.includes(needle) || needle.includes(haystack));
  });

  return matchedSession?.day ?? subject.sessions[0]?.day ?? 1;
}

export function buildQuestionBankQuestionsFromPyqImports(records: PyqImportRecord[]): PracticeQuestion[] {
  return records
    .filter((record) => record.textStatus === "EXACT_VERIFIED" && record.importStatus === "MAPPED")
    .map((record): PracticeQuestion | null => {
      const subject = questionBankSubjects.find((item) => item.slug === record.subjectSlug);
      if (!subject) return null;

      const linkedDay = resolvePyqLinkedDay(subject, record);
      const tags = record.topicTags.length ? record.topicTags.join(", ") : "untagged";

      return {
        id: `exact-pyq-${record.id}`,
        subjectSlug: record.subjectSlug,
        subjectTitle: record.subjectTitle,
        linkedDay,
        topic: record.syllabusArea,
        difficulty: "PYQ_STYLE" as const,
        stem: `Official PYQ (${record.year} ${record.paper} ${record.questionNumber}): ${record.questionText}`,
        options: {
          A: "Identify syllabus demand, topic tags, answer demand, and source before attempting the answer",
          B: "Treat the question as an isolated fact and skip the syllabus area",
          C: "Answer only from a current-affairs headline without static linkage",
          D: "Ignore the official source and practice it as an unverified memory item",
        },
        correctOption: "A" as const,
        explanation: `This is an exact verified PYQ row staged from the admin import ledger. Use ${record.syllabusArea}, tags (${tags}), and answer demand (${record.answerDemand || "demand not specified"}) before writing or selecting an answer.`,
        trap: "This drill verifies PYQ demand-reading. It does not claim an official answer key until options and key are separately imported.",
        source: "EXACT_PYQ_IMPORT" as const,
        sourceHref: record.sourceHref,
        officialSourceTitle: record.officialSourceTitle,
        sourceYear: record.year,
        questionNumber: record.questionNumber,
        answerDemand: record.answerDemand,
        isExactPyqImport: true,
      };
    })
    .filter((question): question is PracticeQuestion => Boolean(question));
}

export function readLocalQuestionBankProgress(subjectSlug: string): QuestionBankProgressInput {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(`sarit-upsc-${subjectSlug}-progress-v1`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as QuestionBankProgressInput) : {};
  } catch {
    return {};
  }
}

function readStoredQuestionBankAttempts() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(questionBankAttemptStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, QuestionBankAttempt>) : {};
  } catch {
    return {};
  }
}

export function readLocalQuestionBankAttempts(subjectSlug?: string): QuestionBankAttempt[] {
  const attempts = Object.values(readStoredQuestionBankAttempts()).filter((attempt) =>
    subjectSlug ? attempt.subjectSlug === subjectSlug : true
  );

  return attempts.sort((left, right) => Date.parse(right.solvedAt) - Date.parse(left.solvedAt));
}

export function buildQuestionBankAttempt(
  question: PracticeQuestion,
  selectedOption: QuestionOption,
  solvedAt = new Date().toISOString()
): QuestionBankAttempt {
  return {
    questionId: question.id,
    subjectSlug: question.subjectSlug,
    linkedDay: question.linkedDay,
    topic: question.topic,
    difficulty: question.difficulty,
    source: question.source,
    selectedOption,
    correctOption: question.correctOption,
    isCorrect: selectedOption === question.correctOption,
    solvedAt,
  };
}

export function saveLocalQuestionBankAttempt(question: PracticeQuestion, selectedOption: QuestionOption) {
  if (typeof window === "undefined") return [];

  const current = readStoredQuestionBankAttempts();
  const attempt = buildQuestionBankAttempt(question, selectedOption);
  const next = {
    ...current,
    [question.id]: attempt,
  };
  window.localStorage.setItem(questionBankAttemptStorageKey, JSON.stringify(next));
  return readLocalQuestionBankAttempts(question.subjectSlug);
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointsFromRecall(averageRecall: number | null) {
  if (averageRecall === null) return 0;
  if (averageRecall >= 95) return 35;
  if (averageRecall >= 85) return 26;
  if (averageRecall >= 70) return 16;
  return 6;
}

function pointsFromMcq(averageMcq: number | null) {
  if (averageMcq === null) return 0;
  if (averageMcq >= 80) return 30;
  if (averageMcq >= 65) return 22;
  if (averageMcq >= 50) return 12;
  return 4;
}

function pointsFromConsistency(consistencyPercent: number) {
  if (consistencyPercent >= 75) return 20;
  if (consistencyPercent >= 45) return 12;
  if (consistencyPercent > 0) return 6;
  return 0;
}

function pointsFromSolvedLedger(solvedAccuracyPercent: number | null) {
  if (solvedAccuracyPercent === null) return 0;
  if (solvedAccuracyPercent >= 80) return 10;
  if (solvedAccuracyPercent >= 60) return 6;
  return -4;
}

function adaptiveLevelFromScore(score: number): StudentLevel {
  if (score >= 75) return "advanced";
  if (score >= 45) return "intermediate";
  return "beginner";
}

function hasStarted(progress?: QuestionBankProgress) {
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

function needsRecovery(progress?: QuestionBankProgress) {
  return Boolean(
    progress?.revisitQueued ||
      progress?.talkBand === "Revisit" ||
      progress?.mcqOutcome === "Revisit" ||
      progress?.confidence === "Shaky" ||
      hasActiveTeacherDoubt(progress)
  );
}

function hasTeacherDoubtSignal(progress?: QuestionBankProgress) {
  return Boolean(
    progress?.teacherDoubtCategory?.trim() ||
      progress?.teacherDoubtReason?.trim() ||
      progress?.teacherDoubtRepairAction?.trim() ||
      progress?.teacherDoubtMasteryCheck?.trim()
  );
}

function hasActiveTeacherDoubt(progress?: QuestionBankProgress) {
  if (!hasTeacherDoubtSignal(progress)) return false;
  return !(
    progress?.confidence === "Command" ||
    progress?.talkBand === "Command" ||
    progress?.mcqOutcome === "Command" ||
    (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= 75)
  );
}

function hasCommand(progress?: QuestionBankProgress) {
  return Boolean(
    !needsRecovery(progress) &&
      (progress?.confidence === "Command" || progress?.mcqOutcome === "Command" || (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= 75))
  );
}

function resolveLearnerLevel(profile?: Pick<StudentProfile, "level"> | null): StudentLevel {
  return profile?.level ?? "beginner";
}

function normalizeQuestionBankMix(mix: Partial<QuestionBankCustomMix>) {
  return questionDifficulties.reduce(
    (normalized, difficulty) => ({
      ...normalized,
      [difficulty]: clamp(Math.round(Number(mix[difficulty]) || 0), 0, 20),
    }),
    { ...emptyQuestionBankMix }
  );
}

function questionBankMixTotal(mix: QuestionBankCustomMix) {
  return questionDifficulties.reduce((sum, difficulty) => sum + mix[difficulty], 0);
}

export function buildRecommendedQuestionBankMix(recommendation: Pick<QuestionBankRecommendation, "recommendedDifficulty" | "adaptiveLevel" | "teacherDoubtCount" | "recoveryCount" | "unresolvedIncorrectCount">): QuestionBankCustomMix {
  if (recommendation.teacherDoubtCount > 0 || recommendation.recoveryCount > 0 || recommendation.unresolvedIncorrectCount > 0) {
    return {
      EASY: 4,
      MEDIUM: 2,
      HARD: 0,
      PYQ_STYLE: 1,
    };
  }

  if (recommendation.adaptiveLevel === "advanced") {
    return {
      EASY: 1,
      MEDIUM: 2,
      HARD: recommendation.recommendedDifficulty === "HARD" ? 4 : 2,
      PYQ_STYLE: recommendation.recommendedDifficulty === "PYQ_STYLE" ? 4 : 3,
    };
  }

  if (recommendation.adaptiveLevel === "intermediate") {
    return {
      EASY: 2,
      MEDIUM: 4,
      HARD: 1,
      PYQ_STYLE: 2,
    };
  }

  return {
    EASY: 4,
    MEDIUM: 2,
    HARD: 0,
    PYQ_STYLE: 1,
  };
}

export function buildQuestionBankRecommendation(
  progress: QuestionBankProgressInput,
  profile?: Pick<StudentProfile, "level"> | null,
  subjectSlug = "geography",
  attempts: QuestionBankAttemptInput = [],
  questionBank: PracticeQuestion[] = allPracticeQuestionBank
): QuestionBankRecommendation {
  const subject = getQuestionBankSubject(subjectSlug);
  const subjectAttempts = attempts.filter((attempt) => attempt.subjectSlug === subject.slug);
  const incorrectAttempts = subjectAttempts.filter((attempt) => !attempt.isCorrect);
  const learnerLevel = resolveLearnerLevel(profile);
  const dayStates = subject.sessions.map((session) => progress[String(session.day)]);
  const startedDays = subject.sessions.filter((session) => hasStarted(progress[String(session.day)]));
  const teacherDoubtDays = subject.sessions.filter((session) => hasActiveTeacherDoubt(progress[String(session.day)]));
  const recoveryDays = subject.sessions.filter((session) => needsRecovery(progress[String(session.day)]));
  const commandDays = subject.sessions.filter((session) => hasCommand(progress[String(session.day)]));
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
    teacherDoubtDays.length > 0
      ? teacherDoubtDays
      : recoveryDays.length > 0
      ? recoveryDays
      : incorrectAttempts.length > 0
      ? subject.sessions.filter((session) => incorrectAttempts.some((attempt) => attempt.linkedDay === session.day))
      : subject.sessions.filter((session) => {
          const state = progress[String(session.day)];
          return typeof state?.talkScore === "number" && state.talkScore < 95;
        });
  const targetDays = (weakDays.length ? weakDays : startedDays).map((session) => session.day);
  const teacherDoubtSession = teacherDoubtDays[0];
  const teacherDoubtProgress = teacherDoubtSession ? progress[String(teacherDoubtSession.day)] : undefined;
  const teacherDoubt = teacherDoubtSession
    ? {
        day: teacherDoubtSession.day,
        category: teacherDoubtProgress?.teacherDoubtCategory?.trim() || "Concept",
        reason: teacherDoubtProgress?.teacherDoubtReason?.trim() || "The AI teacher found an unresolved explanation gap.",
        repairAction:
          teacherDoubtProgress?.teacherDoubtRepairAction?.trim() ||
          "Rebuild the missed link before attempting advanced traps.",
        masteryCheck:
          teacherDoubtProgress?.teacherDoubtMasteryCheck?.trim() ||
          "Can the learner explain the concept without skipping the cause-effect chain?",
      }
    : null;
  const solvedAccuracyPercent = subjectAttempts.length
    ? Math.round((subjectAttempts.filter((attempt) => attempt.isCorrect).length / subjectAttempts.length) * 100)
    : null;
  const adaptiveSignals = {
    recallPoints: pointsFromRecall(averageRecall),
    consistencyPoints: pointsFromConsistency(consistencyPercent),
    mcqPoints: pointsFromMcq(averageMcq),
    ledgerPoints: pointsFromSolvedLedger(solvedAccuracyPercent),
    commandBonus: Math.min(10, commandDays.length * 3),
    recoveryPenalty: recoveryDays.length * 12 + teacherDoubtDays.length * 15 + incorrectAttempts.length * 8,
  };
  const adaptiveReadinessScore = clamp(
    adaptiveSignals.recallPoints +
      adaptiveSignals.consistencyPoints +
      adaptiveSignals.mcqPoints +
      adaptiveSignals.ledgerPoints +
      adaptiveSignals.commandBonus -
      adaptiveSignals.recoveryPenalty,
    0,
    100
  );
  const adaptiveLevel = adaptiveLevelFromScore(adaptiveReadinessScore);

  let recommendedDifficulty: QuestionDifficulty = "MEDIUM";
  let reason = "Balanced practice is recommended until recall and MCQ evidence mature.";

  if (teacherDoubt) {
    recommendedDifficulty = "EASY";
    reason = `AI teacher gap is active on Day ${teacherDoubt.day}: repair ${teacherDoubt.category} before harder MCQs.`;
  } else if (
    recoveryDays.length > 0 ||
    incorrectAttempts.length > 0 ||
    (averageRecall !== null && averageRecall < 70) ||
    (averageMcq !== null && averageMcq < 50)
  ) {
    recommendedDifficulty = "EASY";
    reason = incorrectAttempts.length
      ? "Solved-question ledger has incorrect answers, so the next set should rebuild basics before harder traps."
      : "Recovery or low-score evidence is active, so the next set should rebuild basics first.";
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
      : adaptiveLevel === "advanced"
        ? 10
        : adaptiveLevel === "intermediate"
          ? 8
          : 5;
  const availableQuestionCount = questionBank.filter(
    (question) => question.subjectSlug === subject.slug && question.difficulty === recommendedDifficulty
  ).length;
  const recommendedCount = Math.min(baseRecommendedCount, availableQuestionCount || baseRecommendedCount);

  return {
    learnerLevel,
    adaptiveLevel,
    adaptiveReadinessScore,
    adaptiveSignals,
    recommendedDifficulty,
    recommendedCount,
    averageRecall,
    averageMcq,
    consistencyPercent,
    recoveryCount: recoveryDays.length,
    commandCount: commandDays.length,
    teacherDoubtCount: teacherDoubtDays.length,
    solvedCount: subjectAttempts.length,
    solvedAccuracyPercent,
    unresolvedIncorrectCount: incorrectAttempts.length,
    teacherDoubt,
    reason,
    targetDays,
  };
}

function exactImportFirst(questions: PracticeQuestion[]) {
  return [...questions].sort((left, right) => {
    if (left.isExactPyqImport !== right.isExactPyqImport) return left.isExactPyqImport ? -1 : 1;
    return left.id.localeCompare(right.id);
  });
}

export function selectQuestionBankSet({
  subjectSlug = "geography",
  progress,
  profile,
  difficulty,
  count,
  attempts = [],
  questionBank = allPracticeQuestionBank,
}: {
  subjectSlug?: string;
  progress: QuestionBankProgressInput;
  profile?: Pick<StudentProfile, "level"> | null;
  difficulty?: QuestionDifficulty;
  count?: number;
  attempts?: QuestionBankAttemptInput;
  questionBank?: PracticeQuestion[];
}): QuestionBankSelection {
  const subject = getQuestionBankSubject(subjectSlug);
  const recommendation = buildQuestionBankRecommendation(progress, profile, subject.slug, attempts, questionBank);
  const selectedDifficulty = difficulty ?? recommendation.recommendedDifficulty;
  const selectedCount = count ?? recommendation.recommendedCount;
  const targetDaySet = new Set(recommendation.targetDays);
  const solvedQuestionIds = new Set(attempts.filter((attempt) => attempt.subjectSlug === subject.slug).map((attempt) => attempt.questionId));
  const questionPool = questionBank.filter(
    (question) => question.subjectSlug === subject.slug && question.difficulty === selectedDifficulty
  );
  const exactImports = questionPool.filter((question) => question.isExactPyqImport);
  const nonExactPool = questionPool.filter((question) => !question.isExactPyqImport);
  const targeted = nonExactPool.filter((question) => targetDaySet.has(question.linkedDay));
  const fallback = nonExactPool.filter((question) => !targetDaySet.has(question.linkedDay));
  const prioritized = [...exactImportFirst(exactImports), ...targeted, ...fallback];
  const questions = [
    ...prioritized.filter((question) => !solvedQuestionIds.has(question.id)),
    ...prioritized.filter((question) => solvedQuestionIds.has(question.id)),
  ].slice(0, selectedCount);

  return {
    recommendation,
    questions,
  };
}

export function selectCustomQuestionBankSet({
  subjectSlug = "geography",
  progress,
  profile,
  mix,
  attempts = [],
  questionBank = allPracticeQuestionBank,
}: {
  subjectSlug?: string;
  progress: QuestionBankProgressInput;
  profile?: Pick<StudentProfile, "level"> | null;
  mix: Partial<QuestionBankCustomMix>;
  attempts?: QuestionBankAttemptInput;
  questionBank?: PracticeQuestion[];
}): QuestionBankCustomSelection {
  const subject = getQuestionBankSubject(subjectSlug);
  const recommendation = buildQuestionBankRecommendation(progress, profile, subject.slug, attempts, questionBank);
  const selectedMix = normalizeQuestionBankMix(mix);
  const targetDaySet = new Set(recommendation.targetDays);
  const solvedQuestionIds = new Set(attempts.filter((attempt) => attempt.subjectSlug === subject.slug).map((attempt) => attempt.questionId));
  const selectedIds = new Set<string>();
  const questions = questionDifficulties.flatMap((difficulty) => {
    const requestedCount = selectedMix[difficulty];
    if (requestedCount <= 0) return [];

    const pool = questionBank.filter(
      (question) => question.subjectSlug === subject.slug && question.difficulty === difficulty
    );
    const exactImports = pool.filter((question) => question.isExactPyqImport);
    const nonExactPool = pool.filter((question) => !question.isExactPyqImport);
    const targeted = nonExactPool.filter((question) => targetDaySet.has(question.linkedDay));
    const fallback = nonExactPool.filter((question) => !targetDaySet.has(question.linkedDay));
    const prioritized = [
      ...exactImportFirst(exactImports.filter((question) => !solvedQuestionIds.has(question.id))),
      ...targeted.filter((question) => !solvedQuestionIds.has(question.id)),
      ...fallback.filter((question) => !solvedQuestionIds.has(question.id)),
      ...exactImportFirst(exactImports.filter((question) => solvedQuestionIds.has(question.id))),
      ...targeted.filter((question) => solvedQuestionIds.has(question.id)),
      ...fallback.filter((question) => solvedQuestionIds.has(question.id)),
    ];

    return prioritized.filter((question) => {
      if (selectedIds.has(question.id)) return false;
      selectedIds.add(question.id);
      return true;
    }).slice(0, requestedCount);
  });

  return {
    recommendation,
    questions,
    mix: selectedMix,
    requestedTotal: questionBankMixTotal(selectedMix),
  };
}
