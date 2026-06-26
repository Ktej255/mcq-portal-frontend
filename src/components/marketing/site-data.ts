import type { LucideIcon } from "lucide-react";
import {
  Map,
  Leaf,
  IndianRupee,
  Landmark,
  ScrollText,
  Palette,
  FlaskConical,
  Globe2,
  Scale,
  Calculator,
  Newspaper,
  PenLine,
  Users2,
  Building2,
  Brain,
  Sigma,
  BookMarked,
  Briefcase,
  Languages,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Navigation + footer                                                 */
/* ------------------------------------------------------------------ */

export const navLinks: { href: string; label: string }[] = [
  { href: "/subjects", label: "Subjects" },
  { href: "/current-affairs", label: "Current Affairs" },
  { href: "/pyqs", label: "Free PYQs" },
  { href: "/tests", label: "Tests" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
];

export const footerColumns: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Daily loop", href: "/#loop" },
      { label: "Features", href: "/features" },
      { label: "Live demo", href: "/demo" },
      { label: "Tests & practice", href: "/tests" },
      { label: "Pricing", href: "/pricing" },
      { label: "Results", href: "/upsc-prelims-2026-showcase" },
    ],
  },
  {
    heading: "Subjects",
    links: [
      { label: "Geography", href: "/subjects/geography" },
      { label: "Environment", href: "/subjects/environment" },
      { label: "Economy", href: "/subjects/economy" },
      { label: "All subjects", href: "/subjects" },
    ],
  },
  {
    heading: "Free",
    links: [
      { label: "Previous year questions", href: "/pyqs" },
      { label: "Study resources", href: "/resources" },
      { label: "Current affairs", href: "/current-affairs" },
      { label: "UPSC guides", href: "/guides" },
      { label: "Optional subjects", href: "/subjects#optional" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How we measure", href: "/methodology" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Subjects (GS + Optional)                                            */
/* ------------------------------------------------------------------ */

export type SubjectStatus = "Live" | "Building" | "Planned";

export type Subject = {
  slug: string;
  name: string;
  category: "GS" | "Optional";
  icon: LucideIcon;
  tagline: string;
  status: SubjectStatus;
  topics?: string[];
};

export const subjects: Subject[] = [
  // ---- General Studies ----
  {
    slug: "geography",
    name: "Geography",
    category: "GS",
    icon: Map,
    tagline: "Physical, Indian & world geography taught through interactive maps.",
    status: "Live",
    topics: [
      "Geomorphology & plate tectonics",
      "Climatology & oceanography",
      "Indian physiography & drainage",
      "Resources, agriculture & industries",
      "Map-based & location questions",
    ],
  },
  {
    slug: "environment",
    name: "Environment & Ecology",
    category: "GS",
    icon: Leaf,
    tagline: "Ecology, biodiversity, climate change and the conventions that matter.",
    status: "Building",
    topics: [
      "Ecosystems & biodiversity",
      "Climate change & conventions",
      "Pollution & environmental laws",
      "Conservation efforts & species in news",
    ],
  },
  {
    slug: "economy",
    name: "Indian Economy",
    category: "GS",
    icon: IndianRupee,
    tagline: "Macro concepts linked to the Budget, Economic Survey and current data.",
    status: "Planned",
    topics: [
      "Growth, inflation & national income",
      "Money, banking & financial markets",
      "Fiscal policy, Budget & taxation",
      "External sector & trade",
    ],
  },
  {
    slug: "polity",
    name: "Polity & Governance",
    category: "GS",
    icon: Landmark,
    tagline: "Constitution, institutions and governance, the mega scoring chapter.",
    status: "Planned",
    topics: [
      "Constitutional framework & rights",
      "Union & state government",
      "Judiciary & constitutional bodies",
      "Governance, transparency & schemes",
    ],
  },
  {
    slug: "history",
    name: "History",
    category: "GS",
    icon: ScrollText,
    tagline: "Ancient, medieval, modern India and the freedom struggle.",
    status: "Planned",
  },
  {
    slug: "art-culture",
    name: "Art & Culture",
    category: "GS",
    icon: Palette,
    tagline: "Architecture, art forms, literature and India's cultural heritage.",
    status: "Planned",
  },
  {
    slug: "science-tech",
    name: "Science & Technology",
    category: "GS",
    icon: FlaskConical,
    tagline: "Applied science, space, defence, biotech and tech in the news.",
    status: "Planned",
  },
  {
    slug: "international-relations",
    name: "International Relations",
    category: "GS",
    icon: Globe2,
    tagline: "India and the world, groupings, treaties and foreign policy.",
    status: "Planned",
  },
  {
    slug: "ethics",
    name: "Ethics (GS-IV)",
    category: "GS",
    icon: Scale,
    tagline: "Ethics, integrity, aptitude and case studies for Mains Paper IV.",
    status: "Planned",
  },
  {
    slug: "csat",
    name: "CSAT (Paper II)",
    category: "GS",
    icon: Calculator,
    tagline: "Comprehension, reasoning and quantitative aptitude for the qualifying paper.",
    status: "Planned",
  },
  {
    slug: "current-affairs",
    name: "Current Affairs",
    category: "GS",
    icon: Newspaper,
    tagline: "Daily news filtered to the exam, with monthly consolidations.",
    status: "Live",
    topics: [
      "Daily current affairs + editorials",
      "Daily current-affairs MCQs",
      "Monthly magazine & revision",
      "Government schemes tracker",
    ],
  },
  {
    slug: "essay",
    name: "Essay",
    category: "GS",
    icon: PenLine,
    tagline: "Structured essay practice with model frameworks and feedback.",
    status: "Planned",
  },

  // ---- Optional subjects ----
  {
    slug: "psir",
    name: "Political Science & IR",
    category: "Optional",
    icon: Globe2,
    tagline: "One of the most popular optionals, strong GS-II overlap.",
    status: "Planned",
  },
  {
    slug: "sociology",
    name: "Sociology",
    category: "Optional",
    icon: Users2,
    tagline: "Concise syllabus, high overlap with Essay and GS-I society.",
    status: "Planned",
  },
  {
    slug: "public-administration",
    name: "Public Administration",
    category: "Optional",
    icon: Building2,
    tagline: "Administrative theory and Indian administration.",
    status: "Planned",
  },
  {
    slug: "anthropology",
    name: "Anthropology",
    category: "Optional",
    icon: Brain,
    tagline: "Science-flavoured optional favoured for its diagram-friendly answers.",
    status: "Planned",
  },
  {
    slug: "geography-optional",
    name: "Geography (Optional)",
    category: "Optional",
    icon: Map,
    tagline: "Deep geography with strong GS overlap and map-based answers.",
    status: "Planned",
  },
  {
    slug: "history-optional",
    name: "History (Optional)",
    category: "Optional",
    icon: ScrollText,
    tagline: "Comprehensive history optional with GS-I synergy.",
    status: "Planned",
  },
  {
    slug: "philosophy",
    name: "Philosophy",
    category: "Optional",
    icon: BookMarked,
    tagline: "Short syllabus optional with strong Ethics overlap.",
    status: "Planned",
  },
  {
    slug: "economics-optional",
    name: "Economics (Optional)",
    category: "Optional",
    icon: IndianRupee,
    tagline: "Analytical optional for candidates with a quantitative bent.",
    status: "Planned",
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    category: "Optional",
    icon: Sigma,
    tagline: "Scoring, deterministic optional for strong math backgrounds.",
    status: "Planned",
  },
  {
    slug: "commerce-accountancy",
    name: "Commerce & Accountancy",
    category: "Optional",
    icon: Briefcase,
    tagline: "Specialised optional for commerce graduates.",
    status: "Planned",
  },
  {
    slug: "literature",
    name: "Literature optionals",
    category: "Optional",
    icon: Languages,
    tagline: "Hindi, English and regional-language literature optionals.",
    status: "Planned",
  },
];

export function getSubject(slug: string): Subject | undefined {
  return subjects.find((s) => s.slug === slug);
}

export const gsSubjects = subjects.filter((s) => s.category === "GS");
export const optionalSubjects = subjects.filter((s) => s.category === "Optional");

/* ------------------------------------------------------------------ */
/* Previous Year Questions (free hub)                                  */
/* ------------------------------------------------------------------ */

export const pyqYears: { year: string; prelims: string; mains: string }[] = [
  { year: "2025", prelims: "GS Paper I + CSAT", mains: "GS I–IV + Essay" },
  { year: "2024", prelims: "GS Paper I + CSAT", mains: "GS I–IV + Essay" },
  { year: "2023", prelims: "GS Paper I + CSAT", mains: "GS I–IV + Essay" },
  { year: "2022", prelims: "GS Paper I + CSAT", mains: "GS I–IV + Essay" },
  { year: "2021", prelims: "GS Paper I + CSAT", mains: "GS I–IV + Essay" },
  { year: "2020", prelims: "GS Paper I + CSAT", mains: "GS I–IV + Essay" },
];

export const pyqBySubject: { subject: string; count: string }[] = [
  { subject: "Polity & Governance", count: "10 yrs" },
  { subject: "History & Culture", count: "10 yrs" },
  { subject: "Geography", count: "10 yrs" },
  { subject: "Economy", count: "10 yrs" },
  { subject: "Environment & Ecology", count: "10 yrs" },
  { subject: "Science & Technology", count: "10 yrs" },
  { subject: "Current Affairs", count: "10 yrs" },
  { subject: "CSAT", count: "10 yrs" },
];

/* ------------------------------------------------------------------ */
/* Free study resources                                                */
/* ------------------------------------------------------------------ */

export const resourceGroups: { heading: string; items: { title: string; detail: string }[] }[] = [
  {
    heading: "Foundation reading",
    items: [
      { title: "NCERT booklist (6–12)", detail: "Subject-wise NCERT order with what to read and what to skip." },
      { title: "Standard reference books", detail: "The trusted standard book for each GS subject." },
      { title: "UPSC syllabus (Prelims & Mains)", detail: "The official syllabus, annotated topic by topic." },
    ],
  },
  {
    heading: "Current affairs",
    items: [
      { title: "Daily current affairs", detail: "Exam-filtered news and editorial gist, every day." },
      { title: "Monthly magazine", detail: "Consolidated monthly current affairs for revision." },
      { title: "Government schemes tracker", detail: "Flagship schemes with objectives and outcomes." },
    ],
  },
  {
    heading: "Revision & practice",
    items: [
      { title: "Mind maps", detail: "One-glance visual summaries for fast revision." },
      { title: "Daily MCQ quiz", detail: "Free daily practice with instant explanations." },
      { title: "Previous year questions", detail: "Year-wise and subject-wise PYQ browser." },
    ],
  },
  {
    heading: "Mains toolkit",
    items: [
      { title: "Answer-writing frameworks", detail: "Intro–body–conclusion templates by question type." },
      { title: "Model answers", detail: "Sample answers showing structure and value addition." },
      { title: "Essay frameworks", detail: "Thematic essay structures with fodder material." },
    ],
  },
];


/* ------------------------------------------------------------------ */
/* Current Affairs segment                                             */
/* ------------------------------------------------------------------ */

export const currentAffairsDailyFormat: { title: string; detail: string }[] = [
  { title: "Prelims bytes", detail: "Crisp factual pointers likely to be tested in Prelims." },
  { title: "Mains articles", detail: "Issue-based analysis structured for GS Mains answers." },
  { title: "Editorial gist", detail: "The day's key editorials distilled to exam-relevant points." },
  { title: "PIB & schemes", detail: "Government releases and schemes that matter for the exam." },
  { title: "Daily CA quiz", detail: "A short quiz to lock in the day's current affairs." },
];

export const currentAffairsCategories: { name: string; detail: string }[] = [
  { name: "Polity & Governance", detail: "Bills, judgments, institutions and governance moves." },
  { name: "Economy", detail: "RBI, Budget, schemes, indicators and key reports." },
  { name: "Environment", detail: "Climate, biodiversity, conventions and species in news." },
  { name: "International Relations", detail: "Summits, groupings, treaties and India's diplomacy." },
  { name: "Science & Technology", detail: "Space, defence, biotech and emerging technology." },
  { name: "Government Schemes", detail: "Flagship schemes with objectives and outcomes." },
];

// Evergreen, recurring exam themes shown to illustrate the daily format
// (not real-time news headlines).
export const currentAffairsSamples: { tag: string; title: string; summary: string }[] = [
  { tag: "Economy", title: "RBI Monetary Policy: repo rate & stance", summary: "What a rate decision signals and how to frame it for Prelims and Mains." },
  { tag: "Environment", title: "Wetlands & Ramsar site designations", summary: "Why wetland conservation and Ramsar recur across GS-I and GS-III." },
  { tag: "Polity", title: "Landmark Supreme Court judgments", summary: "Linking key judgments to fundamental rights and governance." },
  { tag: "IR", title: "Multilateral groupings (G20, BRICS, QUAD)", summary: "India's role and recent outcomes relevant to GS-II." },
];

export const monthlyMagazineMonths: string[] = [
  "June 2026",
  "May 2026",
  "April 2026",
  "March 2026",
  "February 2026",
  "January 2026",
];

/* ------------------------------------------------------------------ */
/* PYQ practice guidance                                               */
/* ------------------------------------------------------------------ */

export const pyqTips: { title: string; detail: string }[] = [
  { title: "Solve before you study", detail: "Attempt PYQs first to see how a topic is actually tested." },
  { title: "Map every question to a topic", detail: "Tag each question so you can spot high-yield areas." },
  { title: "Revisit your mistakes", detail: "Re-attempt wrong questions after a spaced interval." },
  { title: "Read the pattern, not predictions", detail: "Use trends to prioritise — never to guess the paper." },
];


/* ------------------------------------------------------------------ */
/* Tests & Daily Practice segment                                      */
/* ------------------------------------------------------------------ */

export const testFormats: { title: string; detail: string }[] = [
  { title: "Daily quiz", detail: "A short daily set on static topics + current affairs to build the habit." },
  { title: "Prelims test series", detail: "Full-length and sectional Prelims mocks on the real UPSC pattern." },
  { title: "CSAT practice", detail: "Comprehension, reasoning and quantitative aptitude for the qualifying paper." },
  { title: "Mains answer writing", detail: "GS and essay prompts with structured, criteria-based evaluation." },
];

export const testFeatures: { title: string; detail: string }[] = [
  { title: "Instant scoring & solutions", detail: "Detailed explanations the moment you submit — learn while it's fresh." },
  { title: "Weakness analytics", detail: "Accuracy by subject and micro-topic, not just a single score." },
  { title: "All-India percentile", detail: "See where you stand against other aspirants on each test." },
  { title: "Spaced re-tests", detail: "Missed questions resurface at the right interval for retention." },
];


/* ------------------------------------------------------------------ */
/* Pricing (mirrors the in-app UPSC Pricing Command)                   */
/* ------------------------------------------------------------------ */

export const pricingStats: { label: string; value: string }[] = [
  { label: "Base monthly", value: "₹399" },
  { label: "GS subjects", value: "8" },
  { label: "Optional pages", value: "48" },
];

export const billingOptions: { label: string; save?: string }[] = [
  { label: "Monthly" },
  { label: "Yearly", save: "-15%" },
  { label: "2-Year", save: "-25%" },
  { label: "3-Year", save: "-35%" },
];

export type PricingTier = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  usage: string;
  features: string[];
  featured?: boolean;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Foundation",
    price: "₹399",
    cadence: "/mo effective",
    tagline: "Build baseline habits before you commit to higher tiers.",
    usage: "1 hour daily AI interaction. Generous rate limits apply.",
    features: [
      "Core UPSC GS Subject Path",
      "Daily Planner & Workspace notes",
      "Standard MCQ Generator (50/day limit)",
      "1 Spaced Weak-Topic run",
      "Basic Syllabus check sheet",
    ],
  },
  {
    name: "Plus",
    price: "₹699",
    cadence: "/mo effective",
    tagline: "Structural prep including optional subject libraries.",
    usage: "3 hours daily AI interaction. Generous rate limits apply.",
    features: [
      "Everything in Foundation",
      "Full Optional Subject Catalog (Academic/Lit)",
      "Advanced MCQ Generator (200/day limit)",
      "5 Spaced Weak-Topics repair runs",
      "Priority Syllabus & PYQ library",
    ],
  },
  {
    name: "Pro",
    price: "₹999",
    cadence: "/mo effective",
    tagline: "Priority AI queues, unlimited testing, and mains uploading.",
    usage: "6 hours daily AI interaction. Generous rate limits apply.",
    features: [
      "Everything in Plus",
      "Unlimited MCQ Generator & practice tests",
      "Unlimited Weak-Topic diagnostic analytics",
      "Spaced Revision priority queueing",
      "Auto-Stitched Mobile Mains Uploads",
    ],
    featured: true,
  },
  {
    name: "Ultimate",
    price: "₹1,299",
    cadence: "/mo effective",
    tagline: "No limits whatsoever. Complete command and direct support.",
    usage: "Unlimited everything. Zero limits apply.",
    features: [
      "Everything in Pro",
      "Unlimited AI interaction hours",
      "No hourly or daily rate limits at all",
      "Priority AI text and talk model response",
      "Direct guidance channel with Sarit Classes",
    ],
  },
];
