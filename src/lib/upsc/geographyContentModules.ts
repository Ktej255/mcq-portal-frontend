export type GeographyModuleSectionKind =
  | "basic"
  | "ncert"
  | "advanced"
  | "trap"
  | "current"
  | "pyq"
  | "mcq"
  | "quick-recall"
  | "handoff";

export type GeographyModuleImage = {
  url?: string;
  alt: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

export type GeographyExpectedRecallPoint = {
  id: string;
  label: string;
  detail: string;
  keywords: string[];
  sectionId: string;
};

export type GeographyContentModuleSection = {
  id: string;
  order: number;
  kind: GeographyModuleSectionKind;
  title: string;
  eyebrow: string;
  estimatedMinutes: number;
  body: string;
  bullets: string[];
  expectedRecallPoints: GeographyExpectedRecallPoint[];
  image?: GeographyModuleImage;
  sourceNote?: string;
};

export type GeographyContentModule = {
  id: string;
  subjectSlug: "geography";
  day: number;
  cluster: string;
  title: string;
  subtitle: string;
  status: "sample-layout" | "draft" | "approved";
  topicIds: number[];
  sourceLabel: string;
  sections: GeographyContentModuleSection[];
};

export type GeographyKnownConcept = {
  id: string;
  label: string;
  detail: string;
  sectionId: string;
  evidence: string;
};

export type GeographyMissingConcept = {
  id: string;
  label: string;
  detail: string;
  sectionId: string;
  repairPrompt: string;
};

export type GeographyModuleRecallAssessment = {
  moduleId: string;
  sectionId: string;
  cumulativeSectionIds: string[];
  knownConcepts: GeographyKnownConcept[];
  missingConcepts: GeographyMissingConcept[];
  initialKnownPercent: number;
  currentMasteryPercent: number;
  gapFilledPercent: number;
  remainingGapPercent: number;
  nextUnlockedSectionId?: string;
  allSectionsCleared: boolean;
  summary: string;
  repairPrompt: string;
};

function point(
  sectionId: string,
  id: string,
  label: string,
  detail: string,
  keywords: string[]
): GeographyExpectedRecallPoint {
  return { id, label, detail, keywords, sectionId };
}

export const geographyContentModules: GeographyContentModule[] = [
  {
    id: "universe-cluster-1",
    subjectSlug: "geography",
    day: 2,
    cluster: "Cluster 1",
    title: "Universe and Solar System",
    subtitle: "Origin of Universe, evidence, traps, PYQ logic, and UPSC-ready recall.",
    status: "sample-layout",
    topicIds: [1],
    sourceLabel: "Universe_Cluster1_SaritClasses.pdf sample layout",
    sections: [
      {
        id: "why-it-matters",
        order: 1,
        kind: "basic",
        title: "Why This Topic Matters",
        eyebrow: "UPSC relevance",
        estimatedMinutes: 3,
        body:
          "Universe questions look simple, but UPSC tests evidence, terms, chronology, and statement traps. The student must connect Big Bang, expanding space, CMB, redshift, galaxies, solar system formation, and Earth evolution as one chain.",
        bullets: [
          "Static NCERT basics often become statement-based prelims traps.",
          "Current space missions make old Universe concepts newly testable.",
          "The exam punishes isolated facts such as age, discoverer, or object name when the mechanism is missing.",
        ],
        expectedRecallPoints: [
          point(
            "why-it-matters",
            "upsc-universe-relevance",
            "UPSC relevance",
            "Universe is a static topic that can be tested through evidence, terms, current missions, and statement traps.",
            ["upsc", "evidence", "statement", "trap", "current", "mission"]
          ),
          point(
            "why-it-matters",
            "connected-chain",
            "Connected chain",
            "The answer should connect Universe origin with solar-system and Earth evolution, not list disconnected facts.",
            ["connect", "chain", "solar", "earth", "origin", "evolution"]
          ),
        ],
        image: {
          alt: "Cosmic microwave background map representing early-universe evidence",
          credit: "NASA/WMAP Science Team",
          license: "NASA imagery generally available for educational use with attribution",
          sourceUrl: "https://map.gsfc.nasa.gov/media/121238/index.html",
          url: "https://map.gsfc.nasa.gov/media/121238/ilc_9yr_moll4096.png",
        },
      },
      {
        id: "basic-core",
        order: 2,
        kind: "basic",
        title: "Basic Core Concept",
        eyebrow: "Big Bang and evidence",
        estimatedMinutes: 4,
        body:
          "The Big Bang means the expansion of space from an extremely hot and dense early state. It was not an explosion into already empty space. As the Universe expanded and cooled, particles and light elements formed. CMB and redshift are the two evidence anchors students must remember.",
        bullets: [
          "Big Bang is expansion of space, not a blast inside space.",
          "Hydrogen and helium formed early as the Universe cooled.",
          "Redshift shows most galaxies are moving away from us.",
          "CMB is leftover heat from the early Universe.",
        ],
        expectedRecallPoints: [
          point(
            "basic-core",
            "big-bang-expansion",
            "Big Bang as expansion",
            "Big Bang should be described as expansion of space from a hot dense state.",
            ["big bang", "expansion", "space", "hot", "dense"]
          ),
          point(
            "basic-core",
            "not-explosion",
            "Not explosion into empty space",
            "The trap is saying Big Bang exploded into already existing empty space.",
            ["not", "explosion", "empty space", "trap"]
          ),
          point(
            "basic-core",
            "cmb-redshift",
            "CMB and redshift evidence",
            "CMB and redshift are core evidence anchors for an expanding Universe.",
            ["cmb", "cosmic microwave", "redshift", "evidence"]
          ),
        ],
      },
      {
        id: "ncert-reference",
        order: 3,
        kind: "ncert",
        title: "NCERT Reference Path",
        eyebrow: "What to read",
        estimatedMinutes: 3,
        body:
          "Use NCERT Class XI Fundamentals of Physical Geography, Chapter 2, for the Universe, solar system, and Earth-origin foundation. The web module should not replace source reading; it should tell the student exactly what to read and how UPSC may twist it.",
        bullets: [
          "Read the Universe and solar-system formation section first.",
          "Mark age of Universe, age of Earth, CMB, redshift, galaxies, and solar nebula.",
          "Convert every fact into one statement-trap possibility.",
        ],
        expectedRecallPoints: [
          point(
            "ncert-reference",
            "ncert-source",
            "NCERT source path",
            "Class XI Fundamentals of Physical Geography Chapter 2 is the base source for Universe and Earth origin.",
            ["ncert", "class xi", "fundamentals", "physical geography", "chapter 2"]
          ),
          point(
            "ncert-reference",
            "source-to-trap",
            "Source to trap conversion",
            "Source reading should become statement-trap logic, not passive rereading.",
            ["source", "read", "statement", "trap", "upsc"]
          ),
        ],
      },
      {
        id: "advanced-depth",
        order: 4,
        kind: "advanced",
        title: "Advanced Depth",
        eyebrow: "Beyond basic recall",
        estimatedMinutes: 5,
        body:
          "Advanced recall should compare Big Bang with Steady State theory, explain redshift and blueshift, recognize that CMB weakened Steady State, and avoid overclaiming terms like singularity, event horizon, string theory, and standard model.",
        bullets: [
          "Steady State proposed continuous creation and an unchanging large-scale Universe.",
          "CMB strongly supports the hot early Universe model.",
          "Redshift is common for distant galaxies; blueshift is possible for some nearby motion.",
          "Do not confuse black-hole singularity with the early-Universe singularity.",
        ],
        expectedRecallPoints: [
          point(
            "advanced-depth",
            "steady-state-comparison",
            "Steady State comparison",
            "Steady State differs from Big Bang because it keeps large-scale density steady through continuous creation.",
            ["steady state", "continuous", "creation", "big bang"]
          ),
          point(
            "advanced-depth",
            "redshift-blueshift",
            "Redshift and blueshift",
            "Redshift means stretching of wavelength; blueshift can occur for approaching objects.",
            ["redshift", "blueshift", "wavelength", "approach"]
          ),
          point(
            "advanced-depth",
            "singularity-precision",
            "Singularity precision",
            "Singularity language needs precision and should not be reduced only to black holes.",
            ["singularity", "black hole", "early universe", "precision"]
          ),
        ],
      },
      {
        id: "examiner-traps",
        order: 5,
        kind: "trap",
        title: "Examiner Traps",
        eyebrow: "Statement correction",
        estimatedMinutes: 4,
        body:
          "This section trains the student to reject almost-correct statements. The safest recall pattern is: identify the wrong word, correct it, and explain why UPSC may use it as a trap.",
        bullets: [
          "Big Bang was not an explosion into empty space.",
          "CMB supports Big Bang and weakens Steady State.",
          "Universe age and Earth age are not the same.",
          "Not all galaxies show redshift from every observer context.",
          "Hubble popularized expansion evidence, but Lemaitre proposed the expanding Universe idea earlier.",
        ],
        expectedRecallPoints: [
          point(
            "examiner-traps",
            "age-trap",
            "Universe age vs Earth age",
            "The Universe is much older than Earth; mixing their ages is a common trap.",
            ["universe age", "earth age", "older", "trap"]
          ),
          point(
            "examiner-traps",
            "hubble-lemaitre",
            "Hubble and Lemaitre precision",
            "Recall should avoid giving all expansion-credit simplistically to Hubble.",
            ["hubble", "lemaitre", "expansion", "credit"]
          ),
          point(
            "examiner-traps",
            "cmb-steady-state",
            "CMB weakens Steady State",
            "CMB is a strong reason Steady State lost ground against Big Bang.",
            ["cmb", "steady state", "big bang", "evidence"]
          ),
        ],
      },
      {
        id: "current-affairs-bridge",
        order: 6,
        kind: "current",
        title: "Current Affairs Bridge",
        eyebrow: "Covered news only",
        estimatedMinutes: 4,
        body:
          "Current affairs should open only after static basics are covered. JWST, solar storms, coronal mass ejections, satellite risk, and Earth-axis type statements can all test whether the student understands evidence and physical mechanisms.",
        bullets: [
          "JWST is useful for early-galaxy and deep-space context.",
          "Solar storms and CME questions test Sun-Earth interaction, not only space news.",
          "Axis-shift or polar-ice statements require mechanism and scale checks.",
        ],
        expectedRecallPoints: [
          point(
            "current-affairs-bridge",
            "jwst-link",
            "JWST static-current link",
            "JWST news should connect to early galaxies, deep space, and evidence-based Universe study.",
            ["jwst", "galaxy", "deep space", "early"]
          ),
          point(
            "current-affairs-bridge",
            "cme-link",
            "CME and solar storms",
            "CME and solar-storm news should be tied to Sun-Earth interaction and satellite risk.",
            ["cme", "solar storm", "sun", "earth", "satellite"]
          ),
        ],
      },
      {
        id: "pyq-mcq-practice",
        order: 7,
        kind: "pyq",
        title: "PYQ and MCQ Practice Logic",
        eyebrow: "Question formats",
        estimatedMinutes: 5,
        body:
          "The student should identify how the same content appears across direct recall, multi-statement, how-many-correct, match-pair, assertion-reason, NOT/exception, and scenario questions.",
        bullets: [
          "Direct recall checks terms like CMB, redshift, galaxy, nebula, and light-year.",
          "Multi-statement questions test one wrong qualifier.",
          "Assertion-reason asks whether evidence really supports the explanation.",
          "Scenario questions connect space events with Earth systems and technology.",
        ],
        expectedRecallPoints: [
          point(
            "pyq-mcq-practice",
            "format-awareness",
            "MCQ format awareness",
            "The same Universe content must be recalled across direct, multi-statement, match, assertion, NOT, and scenario formats.",
            ["direct", "multi", "match", "assertion", "not", "scenario"]
          ),
          point(
            "pyq-mcq-practice",
            "qualifier-trap",
            "Qualifier trap",
            "Almost-correct statements usually fail because of one qualifier such as all, only, always, same, or never.",
            ["all", "only", "always", "same", "never", "qualifier"]
          ),
        ],
      },
      {
        id: "quick-recall-handoff",
        order: 8,
        kind: "quick-recall",
        title: "Quick Recall and Next Handoff",
        eyebrow: "Speak before moving",
        estimatedMinutes: 3,
        body:
          "Before the next module opens, the student should speak the whole Universe cluster in one connected answer: origin, evidence, comparison, traps, current bridge, and MCQ format.",
        bullets: [
          "Universe age is about 13.8 billion years; Earth age is about 4.5 billion years.",
          "CMB is about 2.7 K and is key evidence for the hot early Universe.",
          "Redshift supports expansion; Steady State is weakened by CMB evidence.",
          "Next handoff: connect solar-system formation with Earth differentiation.",
        ],
        expectedRecallPoints: [
          point(
            "quick-recall-handoff",
            "key-facts",
            "Key facts",
            "Recall the rough age contrast, CMB temperature, redshift, and Steady State contrast.",
            ["13.8", "4.5", "2.7", "redshift", "steady state"]
          ),
          point(
            "quick-recall-handoff",
            "next-handoff",
            "Next handoff",
            "The next link is solar-system formation and Earth differentiation.",
            ["solar system", "earth", "differentiation", "handoff"]
          ),
        ],
      },
    ],
  },
];

export function getGeographyContentModule(moduleId?: string | null) {
  if (!moduleId) return null;
  return geographyContentModules.find((module) => module.id === moduleId) ?? null;
}

export function getPrimaryGeographyContentModuleForDay(day: number) {
  return geographyContentModules.find((module) => module.day === day) ?? null;
}

export function getGeographyModuleSection(module: GeographyContentModule, sectionId?: string | null) {
  if (!sectionId) return module.sections[0];
  return module.sections.find((section) => section.id === sectionId) ?? module.sections[0];
}

export function getCumulativeGeographyModuleSections(module: GeographyContentModule, sectionId: string) {
  const targetIndex = Math.max(
    0,
    module.sections.findIndex((section) => section.id === sectionId)
  );
  return module.sections.slice(0, targetIndex + 1);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, " ").replace(/\s+/g, " ").trim();
}

function keywordMatches(answer: string, keyword: string) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return false;
  return answer.includes(normalizedKeyword);
}

function evidenceFor(answer: string, point: GeographyExpectedRecallPoint) {
  const normalizedAnswer = normalizeText(answer);
  const keyword = point.keywords.find((item) => keywordMatches(normalizedAnswer, item));
  if (!keyword) return "Matched from the submitted recall.";
  return `Student mentioned "${keyword}".`;
}

export function assessGeographyModuleRecall(
  module: GeographyContentModule,
  sectionId: string,
  answer: string,
  previousInitialKnownPercent?: number
): GeographyModuleRecallAssessment {
  const cumulativeSections = getCumulativeGeographyModuleSections(module, sectionId);
  const cumulativeSectionIds = cumulativeSections.map((section) => section.id);
  const expectedPoints = cumulativeSections.flatMap((section) => section.expectedRecallPoints);
  const normalizedAnswer = normalizeText(answer);
  const knownConcepts = expectedPoints
    .filter((point) => point.keywords.some((keyword) => keywordMatches(normalizedAnswer, keyword)))
    .map<GeographyKnownConcept>((point) => ({
      id: point.id,
      label: point.label,
      detail: point.detail,
      sectionId: point.sectionId,
      evidence: evidenceFor(answer, point),
    }));
  const missingConcepts = expectedPoints
    .filter((point) => !knownConcepts.some((known) => known.id === point.id))
    .map<GeographyMissingConcept>((point) => ({
      id: point.id,
      label: point.label,
      detail: point.detail,
      sectionId: point.sectionId,
      repairPrompt: `Reopen ${module.sections.find((section) => section.id === point.sectionId)?.title ?? "this section"} and speak: ${point.detail}`,
    }));
  const currentMasteryPercent = expectedPoints.length
    ? Math.round((knownConcepts.length / expectedPoints.length) * 100)
    : 0;
  const initialKnownPercent =
    typeof previousInitialKnownPercent === "number"
      ? previousInitialKnownPercent
      : currentMasteryPercent;
  const remainingGapPercent = Math.max(0, 100 - currentMasteryPercent);
  const fillableGap = Math.max(100 - initialKnownPercent, 1);
  const gapFilledPercent = Math.max(
    0,
    Math.min(100, Math.round(((currentMasteryPercent - initialKnownPercent) / fillableGap) * 100))
  );
  const targetIndex = module.sections.findIndex((section) => section.id === sectionId);
  const nextSection = module.sections[targetIndex + 1];
  const cleared = currentMasteryPercent >= 95;

  return {
    moduleId: module.id,
    sectionId,
    cumulativeSectionIds,
    knownConcepts,
    missingConcepts,
    initialKnownPercent,
    currentMasteryPercent,
    gapFilledPercent,
    remainingGapPercent,
    nextUnlockedSectionId: cleared ? nextSection?.id : sectionId,
    allSectionsCleared: cleared && !nextSection,
    summary: cleared
      ? `Cumulative recall cleared for ${cumulativeSections.length} section${cumulativeSections.length === 1 ? "" : "s"}.`
      : `${missingConcepts.length} concept${missingConcepts.length === 1 ? "" : "s"} still missing across the cumulative section set.`,
    repairPrompt:
      missingConcepts[0]?.repairPrompt ??
      (nextSection
        ? `Open ${nextSection.title} and keep recalling all previous sections.`
        : "Move to fresh MCQs and keep the full cluster connected."),
  };
}
