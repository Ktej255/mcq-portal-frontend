import { geographySessions } from "@/lib/upsc/plan";
import { subjectPlans } from "@/lib/upsc/subjectPlans";

export type ProductPlan = {
  id: string;
  title: string;
  months: number;
  listPrice: number;
  launchPrice: number;
  discountPercent: number;
  effectiveMonthly: number;
  audience: string;
  promise: string;
};

export type YearlyPlannerBlock = {
  window: string;
  title: string;
  days: string;
  route: string;
  focus: string;
  output: string;
};

export type CoverageLayer =
  | "Syllabus"
  | "Prelims PYQ"
  | "Mains PYQ"
  | "10-year trend"
  | "NCERT basics"
  | "Reference advanced"
  | "Current affairs";

export type CoreSubjectBlueprint = {
  slug: string;
  title: string;
  route: string;
  plannerWindow: string;
  totalDays: number;
  primaryPaper: string;
  coverageLayers: CoverageLayer[];
  syllabusDemand: string;
  pyqPreloadTarget: string;
  currentAffairsRule: string;
};

export type OptionalSubject = {
  slug: string;
  title: string;
  group: "Academic" | "Engineering" | "Medical" | "Literature";
  papers: ["Paper I", "Paper II"];
  route: string;
  preloadTarget: string;
  firstBuildAction: string;
};

export type ProductEngineFeature = {
  title: string;
  status: "ready" | "building" | "planned";
  ownerSurface: string;
  studentOutcome: string;
};

export type ThreeDayLaunchItem = {
  day: string;
  title: string;
  mustShip: string[];
  proof: string;
};

const monthlyRate = 399;

function pricingPlan(id: string, title: string, months: number, launchPrice: number, audience: string, promise: string): ProductPlan {
  const listPrice = monthlyRate * months;
  return {
    id,
    title,
    months,
    listPrice,
    launchPrice,
    discountPercent: Math.round(((listPrice - launchPrice) / listPrice) * 100),
    effectiveMonthly: Math.round(launchPrice / months),
    audience,
    promise,
  };
}

export const productPricingPlans: ProductPlan[] = [
  pricingPlan("monthly", "Monthly", 1, 399, "Trial and short-cycle learners", "No lock-in. Best for first validation batches."),
  pricingPlan("yearly", "Yearly", 12, 3999, "One full prelims-to-mains cycle", "Covers the planned yearly path with revision and reports."),
  pricingPlan("eighteen-month", "18 Month", 18, 5499, "Late starters and mains carry-forward learners", "Keeps the student through mains, revision, and next prelims reset."),
  pricingPlan("three-year", "Three Year", 36, 8999, "Foundation learners and college students", "Lowest effective monthly price for complete UPSC foundation plus optional."),
];

export const recommendedProductPlanId = "eighteen-month";

export function getProductPricingPlan(planId?: string | null) {
  return productPricingPlans.find((plan) => plan.id === planId) ?? productPricingPlans[0];
}

export function pricingCheckoutPath(planId: string) {
  return `/upsc/pricing/checkout?plan=${encodeURIComponent(planId)}`;
}

export const yearlyPlannerBlocks: YearlyPlannerBlock[] = [
  {
    window: "June",
    title: "Geography",
    days: "30 days",
    route: "/upsc/geography",
    focus: "Map-first GS geography, physical geography, India geography, and PYQ pattern reading.",
    output: "Student completes one topic loop per day: recall, focused lesson, AI discussion, MCQ, and revisit if needed.",
  },
  {
    window: "July 1-20",
    title: "Environment",
    days: "20 days",
    route: "/upsc/environment",
    focus: "Ecology, biodiversity, pollution, climate agreements, laws, institutions, and current affairs.",
    output: "Environment current affairs attach only after the related static topic is covered.",
  },
  {
    window: "July 21-31",
    title: "Disaster Management",
    days: "11 days",
    route: "/upsc/disaster-management",
    focus: "Risk, vulnerability, NDMA architecture, hazards, response chain, and case-study answer writing.",
    output: "Disaster concepts connect with geography, environment, governance, and GS-III mains questions.",
  },
  {
    window: "August",
    title: "Economy",
    days: "30 days",
    route: "/upsc/economy",
    focus: "NCERT basics to reference-level macro, budget, banking, external sector, schemes, and survey links.",
    output: "Student moves from definitions to policy logic and data-backed mains framing.",
  },
  {
    window: "September",
    title: "Science and Technology",
    days: "30 days",
    route: "/upsc/science-tech",
    focus: "Space, biotech, health, defence, AI, cyber, energy, and applied current affairs.",
    output: "Each current technology update is linked to a solved static concept instead of a news dump.",
  },
  {
    window: "October",
    title: "Polity and Governance",
    days: "31 days",
    route: "/upsc/polity-governance",
    focus: "Constitution, institutions, rights, federalism, Parliament, judiciary, governance, and schemes.",
    output: "Prelims provisions and mains governance application are kept in one integrated path.",
  },
  {
    window: "November",
    title: "Internal Security and Indian Society",
    days: "30 days",
    route: "/upsc/internal-security-society",
    focus: "Security frameworks, society themes, vulnerable sections, social change, and governance linkages.",
    output: "Student learns issue mapping, answer structure, and case examples without route clutter.",
  },
  {
    window: "December-January",
    title: "History",
    days: "60 days",
    route: "/upsc/history",
    focus: "15 days each for modern, ancient, medieval, and art and culture.",
    output: "Timeline, source, map, culture, PYQ, and revision logic become the history command board.",
  },
  {
    window: "February onward",
    title: "Revision and Command Phase",
    days: "Open revision cycle",
    route: "/upsc/revision-command",
    focus: "All-subject spaced revision, weak-topic repair, mocks, CSAT, essay, and mains answer consolidation.",
    output: "Weekly and monthly reports show where the student started, where they improved, and what remains.",
  },
];

export const productEngineFeatures: ProductEngineFeature[] = [
  {
    title: "Systematic subject path",
    status: "building",
    ownerSurface: "/upsc/yearly-planner",
    studentOutcome: "Every topic is justified by syllabus demand, PYQ pattern, trend, basics, advanced layer, and current affairs.",
  },
  {
    title: "Dynamic daily planner",
    status: "building",
    ownerSurface: "/dashboard",
    studentOutcome: "Yesterday's recall, MCQ result, consistency, and mood signals decide today's next action.",
  },
  {
    title: "Recall-first gap analysis",
    status: "building",
    ownerSurface: "Talk rooms",
    studentOutcome: "Before a lesson starts, the student explains what they know and receives one precise gap.",
  },
  {
    title: "Revision system",
    status: "building",
    ownerSurface: "/revision",
    studentOutcome: "Weak topics and spaced-revision items return automatically instead of relying on student memory.",
  },
  {
    title: "Report system",
    status: "ready",
    ownerSurface: "/reports",
    studentOutcome: "Tests, MCQs, recall attempts, consistency, mood, and me-time signals become weekly and monthly reports.",
  },
  {
    title: "Question bank and custom MCQ builder",
    status: "ready",
    ownerSurface: "/upsc/question-bank",
    studentOutcome: "Easy, moderate, and tough practice is selected by level, recall, marks, and consistency.",
  },
  {
    title: "AI discussion and doubt solving",
    status: "building",
    ownerSurface: "Talk rooms and teacher API",
    studentOutcome: "AI teacher asks, listens, scores, repairs, and reopens the loop only after 95 percent recall.",
  },
  {
    title: "Covered-topic current affairs",
    status: "ready",
    ownerSurface: "/upsc/current-affairs",
    studentOutcome: "Only current affairs attached to already-covered topics appear, reducing noise for beginners.",
  },
  {
    title: "Growth scale and me-time session",
    status: "ready",
    ownerSurface: "/upsc/daily-command and /reports",
    studentOutcome: "The student saves a pre-class mind-state reset, then reports include growth and me-time evidence.",
  },
];

export const coverageLayers: CoverageLayer[] = [
  "Syllabus",
  "Prelims PYQ",
  "Mains PYQ",
  "10-year trend",
  "NCERT basics",
  "Reference advanced",
  "Current affairs",
];

export const coreSubjectBlueprints: CoreSubjectBlueprint[] = [
  {
    slug: "geography",
    title: "Geography",
    route: "/upsc/geography",
    plannerWindow: "June",
    totalDays: geographySessions.length,
    primaryPaper: "GS Paper I and Prelims GS",
    coverageLayers,
    syllabusDemand: "Physical, Indian, human, economic, map, and environmental geography with applied distribution logic.",
    pyqPreloadTarget: "Prelims and mains Geography-linked questions from the last 10 years, plus 2025/2026 trend audit when available.",
    currentAffairsRule: "Attach maps, disasters, monsoon, resources, environment, and places only after the static hook is covered.",
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
    route: `/upsc/${plan.slug}`,
    plannerWindow: plan.window,
    totalDays: plan.sessions.length,
    primaryPaper:
      plan.slug === "history"
        ? "GS Paper I and Prelims GS"
        : plan.slug === "polity-governance"
          ? "GS Paper II and Prelims GS"
          : plan.slug === "economy" || plan.slug === "science-tech" || plan.slug === "disaster-management"
            ? "GS Paper III and Prelims GS"
            : "GS and Prelims integrated",
    coverageLayers,
    syllabusDemand: plan.description,
    pyqPreloadTarget: "Subject-wise prelims and mains PYQs from the last 10 years, tagged by topic, subtopic, and trap type.",
    currentAffairsRule: "Current affairs appear only after the underlying static topic is opened in the student's subject path.",
  })),
];

const academicOptionals = [
  "Agriculture",
  "Animal Husbandry and Veterinary Science",
  "Anthropology",
  "Botany",
  "Chemistry",
  "Commerce and Accountancy",
  "Economics",
  "Geography",
  "Geology",
  "History",
  "Law",
  "Management",
  "Mathematics",
  "Philosophy",
  "Physics",
  "Political Science and International Relations",
  "Psychology",
  "Public Administration",
  "Sociology",
  "Statistics",
  "Zoology",
] as const;

const engineeringOptionals = [
  "Civil Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
] as const;

const medicalOptionals = ["Medical Science"] as const;

const literatureOptionals = [
  "Assamese Literature",
  "Bengali Literature",
  "Bodo Literature",
  "Dogri Literature",
  "English Literature",
  "Gujarati Literature",
  "Hindi Literature",
  "Kannada Literature",
  "Kashmiri Literature",
  "Konkani Literature",
  "Maithili Literature",
  "Malayalam Literature",
  "Manipuri Literature",
  "Marathi Literature",
  "Nepali Literature",
  "Odia Literature",
  "Punjabi Literature",
  "Sanskrit Literature",
  "Santhali Literature",
  "Sindhi Literature",
  "Tamil Literature",
  "Telugu Literature",
  "Urdu Literature",
] as const;

function slugifyOptional(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function optionalSubject(title: string, group: OptionalSubject["group"]): OptionalSubject {
  const slug = slugifyOptional(title);
  return {
    slug,
    title,
    group,
    papers: ["Paper I", "Paper II"],
    route: `/upsc/optional-subjects/${slug}`,
    preloadTarget: "Syllabus, Paper I PYQs, Paper II PYQs, year-wise question papers, trend map, and answer-writing themes.",
    firstBuildAction: "Create paper-wise topic tree, attach 10-year PYQs, then build recall-first optional discussion loop.",
  };
}

export const optionalSubjects: OptionalSubject[] = [
  ...academicOptionals.map((title) => optionalSubject(title, "Academic")),
  ...engineeringOptionals.map((title) => optionalSubject(title, "Engineering")),
  ...medicalOptionals.map((title) => optionalSubject(title, "Medical")),
  ...literatureOptionals.map((title) => optionalSubject(title, "Literature")),
];

export function getOptionalSubject(slug: string) {
  return optionalSubjects.find((subject) => subject.slug === slug);
}

export const threeDayLaunchItems: ThreeDayLaunchItem[] = [
  {
    day: "Day 1",
    title: "Product backbone",
    mustShip: [
      "Yearly planner and pricing visible inside the portal.",
      "GS subject coverage map tied to syllabus, PYQ, trend, basics, advanced, and current affairs.",
      "Optional-subject catalog pages created for all listed optional subjects.",
    ],
    proof: "Routes, typecheck, and build confirm the product layer is present.",
  },
  {
    day: "Day 2",
    title: "Data preload and student simplicity",
    mustShip: [
      "Prelims and mains PYQ registers imported topic-wise.",
      "Daily planner uses previous-day recall, MCQ, consistency, and me-time signals.",
      "Current affairs are hidden until a related topic has been covered.",
    ],
    proof: "Subject pages show real preloaded PYQ counts and dashboard opens one next action.",
  },
  {
    day: "Day 3",
    title: "Live student proof",
    mustShip: [
      "Supabase auth and learner state pass live recovery checks.",
      "Geography Day 1 uses approved media, transcript, discussion, MCQ, report, and revisit.",
      "Weekly report and growth scale show honest student movement.",
    ],
    proof: "One real browser session completes the loop and one second session resumes the same state.",
  },
];

export const officialUpscSourceLinks = [
  {
    title: "UPSC Previous Question Papers",
    href: "https://upsc.gov.in/examinations/previous-question-papers",
  },
  {
    title: "Civil Services Main Examination 2025 Papers",
    href: "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202025",
  },
];
