"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Database,
  FileCheck2,
  FileSearch,
  Filter,
  Gauge,
  Layers3,
  LineChart as LineChartIcon,
  Map,
  PieChart as PieChartIcon,
  Radar,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar as RadarShape,
  RadarChart,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ShowcaseQuestionEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";

type SubjectCoverage = {
  subject: string;
  short: string;
  questions: number;
  direct: number;
  partial: number;
  avgScore: number;
  built: string;
  appeared: string;
  gap: string;
  action: string;
  color: string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    color?: string;
    dataKey?: string | number;
    name?: string | number;
    value?: string | number;
  }>;
};

type QuestionStatusFilter = "all" | ShowcaseQuestionEvidence["status"];

const theme = {
  ink: "#12251d",
  leaf: "#1b6b4a",
  mint: "#dff3e9",
  teal: "#0f8b8d",
  blue: "#276fbf",
  amber: "#d8891c",
  coral: "#d95f43",
  plum: "#805ad5",
  paper: "#fffaf1",
  wash: "#f5f8f4",
  line: "#ccd8cd",
};

const corpusStats = [
  { label: "Archive files", value: "1,504", detail: "year-long local content index", icon: Database },
  { label: "Supported documents", value: "1,247", detail: "PDF, DOCX, TXT, CSV, HTML, MD", icon: FileCheck2 },
  { label: "Search chunks", value: "24,131", detail: "evidence slices used by audit", icon: SearchCheck },
  { label: "Manual proof lock", value: "100", detail: "questions still need page proof", icon: ShieldCheck },
];

const subjectCoverage: SubjectCoverage[] = [
  {
    subject: "Ancient India",
    short: "Ancient",
    questions: 10,
    direct: 1,
    partial: 9,
    avgScore: 0.434,
    built: "Master sheet and foundation material covered chronology, texts, archaeology and settlement themes.",
    appeared: "UPSC leaned on analytical statement checks around Vedic, Jain, Pali and early settlement ideas.",
    gap: "Coverage was broad, but many matches are conceptual rather than exact page-proof hits.",
    action: "Convert static themes into multi-statement traps with source-backed explanation.",
    color: "#805ad5",
  },
  {
    subject: "Art and Culture",
    short: "Culture",
    questions: 6,
    direct: 3,
    partial: 3,
    avgScore: 0.555,
    built: "Art, architecture, music systems, Buddhist traditions and fast-track culture revision were present.",
    appeared: "The paper revived visual and tradition-based culture: iconography, Amaravati, gharanas and caves.",
    gap: "Students still need more image-led identification and cross-school comparison practice.",
    action: "Add visual flashcards, temple-map anchors and one-image three-statement MCQs.",
    color: "#d8891c",
  },
  {
    subject: "Modern History",
    short: "Modern",
    questions: 5,
    direct: 4,
    partial: 1,
    avgScore: 0.609,
    built: "Modern History MCQs and modules directly touched Bose, peasant movements and constitutional phases.",
    appeared: "Forward Bloc, annexation, commissions and movements appeared in analytical statement form.",
    gap: "The topic hit was strong; the remaining upgrade is reasoning format and option elimination.",
    action: "Rewrite recall MCQs as motive, sequence, policy-effect and assertion-reason sets.",
    color: "#1b6b4a",
  },
  {
    subject: "Geography",
    short: "Geo",
    questions: 8,
    direct: 1,
    partial: 7,
    avgScore: 0.554,
    built: "The Geography plan, Indian physical geography and 400-question batches formed the core archive.",
    appeared: "The exam mixed peninsular block, rivers, islands, ports, strategic straits and places in news.",
    gap: "Indian physical geography was supported, but international map intelligence needs a dedicated layer.",
    action: "Launch map radar: straits, lakes, geoparks, ports, corridors, borders and resource routes.",
    color: "#0f8b8d",
  },
  {
    subject: "Environment",
    short: "Env",
    questions: 9,
    direct: 4,
    partial: 5,
    avgScore: 0.542,
    built: "Environment modules, ecology capsule and species-policy content were heavily represented.",
    appeared: "Species, protected areas, mangroves, climate frameworks, FAO language and rainfed agriculture appeared.",
    gap: "The content direction was right; current-linked reports and schemes need tighter evidence tagging.",
    action: "Build a species-policy-report tracker with exact source dates and habitat maps.",
    color: "#2f9e44",
  },
  {
    subject: "Indian Economy",
    short: "Economy",
    questions: 17,
    direct: 7,
    partial: 10,
    avgScore: 0.61,
    built: "Economy module and graph intelligence now exist, including cycles and cross-subject anchors.",
    appeared: "Digital finance, poverty index, RBI tools, bonds, MSME finance and inclusion dominated the audit ledger.",
    gap: "The graph is strong, but the student-facing MCQ bank must target digital economy and data triggers.",
    action: "Convert graph loops into practice: CBDC, tokenisation, UPI, NBFCs, bonds and indices.",
    color: "#276fbf",
  },
  {
    subject: "Current Affairs",
    short: "Current",
    questions: 17,
    direct: 4,
    partial: 13,
    avgScore: 0.678,
    built: "Current affairs magazines, schemes matrix and international organisations radar are indexed.",
    appeared: "The paper converted current facts into applied governance, technology, economy and map questions.",
    gap: "The issue is integration: current affairs should not stay as monthly notes.",
    action: "Attach every current topic to syllabus nodes, maps, reports and likely statement traps.",
    color: "#d95f43",
  },
  {
    subject: "Science and Technology",
    short: "S&T",
    questions: 16,
    direct: 8,
    partial: 8,
    avgScore: 0.596,
    built: "S&T full module, part-two gap filler and decoder material gave strong candidate hits.",
    appeared: "AI, genetics, defence tech, quantum, space, hydrogen, drones and deep ocean themes appeared.",
    gap: "The next layer is live technology explainers with everyday application and risk framing.",
    action: "Build applied tech capsules for AI, biotech, quantum, defence, space and clean energy.",
    color: "#805ad5",
  },
  {
    subject: "Indian Polity",
    short: "Polity",
    questions: 12,
    direct: 5,
    partial: 7,
    avgScore: 0.521,
    built: "Polity modules, memory material and portal questions support constitutional fundamentals.",
    appeared: "Article 13, committees, social justice provisions, disability rights and new criminal law appeared.",
    gap: "UPSC is moving toward governance-ethics caselets inside GS Paper 1 style framing.",
    action: "Add BNSS, rights, committees and ethics-governance mini-case question drills.",
    color: "#6f42c1",
  },
];

const evidencePie = [
  { name: "Direct source leads", value: 37, color: theme.leaf },
  { name: "Conceptual leads", value: 63, color: theme.amber },
];

const questionFormatData = [
  { name: "3+ statements", value: 61, color: theme.leaf },
  { name: "2 statements", value: 8, color: theme.blue },
  { name: "No explicit list", value: 31, color: theme.coral },
];

const natureData = [
  { name: "Applied", value: 61, color: theme.teal },
  { name: "Fundamental", value: 22, color: theme.leaf },
  { name: "CA advanced", value: 14, color: theme.amber },
  { name: "CA basic", value: 3, color: theme.coral },
];

const trendData = [
  { year: "2023", history: 13, science: 15, economy: 14, polity: 12, environment: 12, geography: 16, current: 18 },
  { year: "2024", history: 12, science: 13, economy: 14, polity: 15, environment: 15, geography: 18, current: 13 },
  { year: "2025", history: 12, science: 15, economy: 21, polity: 15, environment: 10, geography: 14, current: 13 },
  { year: "2026", history: 21, science: 16, economy: 17, polity: 12, environment: 9, geography: 8, current: 17 },
];

const radarData = [
  { domain: "Map intel", current: 58, target: 92 },
  { domain: "Digital economy", current: 66, target: 90 },
  { domain: "Ethics caselets", current: 52, target: 84 },
  { domain: "Applied science", current: 71, target: 90 },
  { domain: "Source proof", current: 37, target: 100 },
  { domain: "Current links", current: 64, target: 92 },
];

const sourceBuckets = [
  { name: "Prelims", files: 925, docs: 834, color: theme.leaf },
  { name: "GS 3", files: 175, docs: 155, color: theme.blue },
  { name: "GS 4 Ethics", files: 153, docs: 66, color: theme.plum },
  { name: "GS 1 Mains", files: 89, docs: 47, color: theme.amber },
  { name: "30 day Plan", files: 84, docs: 80, color: theme.teal },
  { name: "GS 2 Mains", files: 54, docs: 48, color: theme.coral },
  { name: "CSAT", files: 23, docs: 16, color: "#607d8b" },
];

const uploadMonths = [
  { month: "Aug 25", files: 68 },
  { month: "Sep 25", files: 121 },
  { month: "Oct 25", files: 161 },
  { month: "Nov 25", files: 90 },
  { month: "Dec 25", files: 142 },
  { month: "Jan 26", files: 668 },
  { month: "Feb 26", files: 68 },
  { month: "Mar 26", files: 51 },
  { month: "Apr 26", files: 76 },
  { month: "May 26", files: 59 },
];

const sprintAssets = [
  {
    label: "Geography",
    value: "400 MCQs",
    detail: "Eight 50-question batches plus foundation, NCERT and map-oriented material.",
    icon: Map,
  },
  {
    label: "Value addition",
    value: "12 PDFs",
    detail: "Map intelligence, quick codes, economy triggers, ecology, schemes, IO radar and culture.",
    icon: Layers3,
  },
  {
    label: "Environment",
    value: "Full module",
    detail: "Ecology, species, climate frameworks, foundation scripts and probable MCQs.",
    icon: Compass,
  },
  {
    label: "History",
    value: "Multi-era bank",
    detail: "Ancient, medieval, modern and culture modules with MCQ material.",
    icon: BookOpenCheck,
  },
  {
    label: "S&T",
    value: "Gap filler",
    detail: "Full module, decoder and part-two gap filler for emerging technology areas.",
    icon: BrainCircuit,
  },
  {
    label: "Polity",
    value: "Memory layer",
    detail: "Foundation, memory modules, MCQs and overlay index for constitutional linkage.",
    icon: FileSearch,
  },
];

const patternCards = [
  {
    title: "Statement density",
    signal: "61 questions used 3+ statements",
    logic: "UPSC is testing elimination discipline, not one-line memory.",
    drill: "Force students to mark each statement as fact, scope, exception or trap.",
    icon: Filter,
  },
  {
    title: "Applied fundamentals",
    signal: "61 applied questions",
    logic: "Static knowledge is being pulled into situations, schemes, maps and reports.",
    drill: "Every topic needs a context bridge: why asked, where used, what confuses aspirants.",
    icon: Gauge,
  },
  {
    title: "Current-static fusion",
    signal: "17 current affairs questions",
    logic: "Current affairs works only when attached to syllabus nodes and concepts.",
    drill: "Attach reports, places, missions and indices to permanent concepts.",
    icon: Route,
  },
  {
    title: "Proof discipline",
    signal: "0 public claims unlocked yet",
    logic: "Automated matches are leads; website claims need retained page proof.",
    drill: "Separate exact source proof, concept support and rejected evidence.",
    icon: ShieldCheck,
  },
];

const nextPatternOpportunities = [
  {
    pattern: "Data sufficiency style",
    probability: "High",
    reason: "UPSC already uses statement sufficiency logic; the next step can ask whether information is enough, not just true.",
  },
  {
    pattern: "Map plus cause-effect",
    probability: "High",
    reason: "Geography and IR are moving toward places in news, logistics routes, resources and strategic straits.",
  },
  {
    pattern: "Ethics-governance mini caselet",
    probability: "High",
    reason: "Governance questions are beginning to test judgement, rights, procedure and institutional conduct.",
  },
  {
    pattern: "Report table interpretation",
    probability: "Medium",
    reason: "Economy, environment and social development can be tested through indices, ranks, trends and definitions.",
  },
  {
    pattern: "Technology risk comparison",
    probability: "Medium",
    reason: "AI, biotech, quantum and defence technology invite application, limitation and governance questions.",
  },
];

const finalAuditScorecard = [
  {
    label: "Direct hits",
    value: "44",
    share: "45%",
    detail: "Topic, depth and format were strong enough for confident attempt.",
    color: theme.leaf,
  },
  {
    label: "Partial hits",
    value: "30",
    share: "30%",
    detail: "Topic existed, but format, current link or depth still needed upgrade.",
    color: theme.amber,
  },
  {
    label: "Misses",
    value: "23",
    share: "23%",
    detail: "No meaningful preparation advantage in the final research audit.",
    color: theme.coral,
  },
  {
    label: "Dropped",
    value: "3",
    share: "UPSC",
    detail: "Cancelled questions kept out of the scorable denominator.",
    color: "#607d8b",
  },
];

const finalPatternShifts = [
  {
    title: "Recall is shrinking",
    metric: "13%",
    detail: "Direct recall fell sharply; memory-only MCQ banks no longer mirror the paper.",
    action: "Turn every fact into statement judgement, exception and application practice.",
    icon: AlertTriangle,
  },
  {
    title: "Statement logic dominates",
    metric: "67/100",
    detail: "Multi-statement plus how-many-correct questions now define the attempt strategy.",
    action: "Every subject bank needs statement architecture, not only one-line recall.",
    icon: Layers3,
  },
  {
    title: "Ethics entered GS-1",
    metric: "3 cases",
    detail: "Scenario-style governance questions appeared as a new format signal.",
    action: "Build caselets around rights, procedure, accountability and discretion.",
    icon: ShieldCheck,
  },
  {
    title: "Current became embedded",
    metric: "All subjects",
    detail: "Current affairs appeared inside Economy, Environment, Science, Polity, IR and Geography.",
    action: "Publish current notes as subject bridges, not date-wise news dumps.",
    icon: Route,
  },
];

const hitQualityLadder = [
  {
    stage: "Topic covered",
    proof: "The syllabus theme or keyword existed in our material.",
    unlock: "Good for awareness, weak for public accuracy claims.",
  },
  {
    stage: "Statement covered",
    proof: "A specific UPSC statement or equivalent concept can be mapped to content.",
    unlock: "Enough for teacher review and student explanation building.",
  },
  {
    stage: "Answerable from content",
    proof: "The material could reasonably lead to the correct option after elimination.",
    unlock: "Counts as real preparation advantage after source proof.",
  },
  {
    stage: "Same format practiced",
    proof: "The student practiced the same UPSC format: multi, how-many, pair, A-R or caselet.",
    unlock: "Counts as exam-readiness, not just content coverage.",
  },
  {
    stage: "Source proof verified",
    proof: "Exact page, screenshot or internal source note is retained.",
    unlock: "Only this stage should become a public accuracy claim.",
  },
];

const gapTypes = [
  {
    type: "Content gap",
    signal: "IR bodies, AI, blockchain, semiconductors, rare earths.",
    softwareAction: "Create new topic capsules and first-principles explainers.",
    color: theme.coral,
  },
  {
    type: "Format gap",
    signal: "How-many-correct, assertion-reason and GS-1 caselets were under-practiced.",
    softwareAction: "Auto-rebuild old MCQs into UPSC 2026-style formats.",
    color: theme.amber,
  },
  {
    type: "Current bridge gap",
    signal: "Static notes did not always carry current examples, reports or agencies.",
    softwareAction: "Attach every current item to a syllabus node and predicted question frame.",
    color: theme.blue,
  },
  {
    type: "Map and place gap",
    signal: "Lake Turkana, Hormuz, geoparks and strategic geography need a live layer.",
    softwareAction: "Launch map radar with atlas drills, places in news and route logic.",
    color: theme.teal,
  },
  {
    type: "Source depth gap",
    signal: "TN Board, act text, official frameworks and regulatory bodies need deeper tagging.",
    softwareAction: "Add source ROI tags and proof-lock workflow before public claims.",
    color: theme.plum,
  },
  {
    type: "Revision gap",
    signal: "Covered content can still fail if not practiced in the exam's logic.",
    softwareAction: "Schedule weak-format revision loops for each student profile.",
    color: theme.leaf,
  },
];

const priorityMatrix2027 = [
  {
    subject: "IR / Multilateral",
    priority: "Critical",
    accuracy: "About 10%",
    evidence: "Zero dedicated module; 11 questions exposed ASEAN, BIMSTEC, UN, G20, SCO, QUAD and trade gaps.",
    action: "Build from scratch with bodies, charters, members, summits, conventions and India links.",
  },
  {
    subject: "S&T new domains",
    priority: "Critical",
    accuracy: "About 45%",
    evidence: "AI, blockchain, semiconductors, weather models and rare earths created the main misses.",
    action: "Add 100+ applied questions across AI, blockchain, quantum, semiconductor, defence and space policy.",
  },
  {
    subject: "Polity legal + ethics",
    priority: "High",
    accuracy: "About 55%",
    evidence: "BNSS, RPwD and ethics-GS1 caselets were underbuilt.",
    action: "Add act-text drills and 40 scenario questions around procedure, rights and accountability.",
  },
  {
    subject: "Environment current layer",
    priority: "Medium",
    accuracy: "About 70%",
    evidence: "Species were supported, but climate-policy frameworks and FAO-style language need tagging.",
    action: "Reduce raw volume and add LT-LEDS, REDD+, Blue Transformation, NDC and report bridges.",
  },
  {
    subject: "Geography international",
    priority: "Medium",
    accuracy: "About 55%",
    evidence: "Indian physical geography was supported; international places-in-news were weaker.",
    action: "Add map radar for straits, lakes, ports, geoparks, corridors and resource routes.",
  },
  {
    subject: "Ancient History TN Board",
    priority: "Medium",
    accuracy: "About 80%",
    evidence: "History performed well, but Vedic, Sangam and Tamilakam questions show TN Board depth is useful.",
    action: "Add TN Board source tags and convert deep-source facts into multi-statement traps.",
  },
  {
    subject: "Economy maintenance",
    priority: "Low",
    accuracy: "About 75%",
    evidence: "Corrected PDF audit shows Economy was a strength after the 10-cluster module.",
    action: "Patch M1xchange/TReDS, bond taxonomy, crowdfunding and IRDAI; keep the core module.",
  },
  {
    subject: "Medieval History reduction",
    priority: "Minimal",
    accuracy: "0 questions",
    evidence: "Medieval produced zero questions in 2026 for the first time in the report's six-year lens.",
    action: "Reduce effort to maintenance coverage and shift build time to IR, S&T and legal-current gaps.",
  },
];

const sourceRoiRows = [
  {
    source: "Economy Master Module",
    supported: "9 direct + 5 partial",
    returnSignal: "Strongest corrected audit improvement.",
    nextDecision: "Keep as model format; add targeted financial-regulation patches.",
  },
  {
    source: "NCERT + RS Sharma / TN Board",
    supported: "Ancient and culture base",
    returnSignal: "High value, but deep text citations need TN Board tagging.",
    nextDecision: "Build TN Board micro-source layer and statement traps.",
  },
  {
    source: "Art and Culture bank",
    supported: "Near full coverage",
    returnSignal: "Visual and tradition-based content paid off.",
    nextDecision: "Add image-led practice and match-pair drills.",
  },
  {
    source: "Polity bank",
    supported: "Parliament + Article base",
    returnSignal: "Static foundation worked, current legal layer weaker.",
    nextDecision: "Add BNSS, RPwD, SC/ST act text and ethics caselets.",
  },
  {
    source: "Environment bank",
    supported: "Species and protected areas",
    returnSignal: "Good base, but policy-framework language needs upgrade.",
    nextDecision: "Shift from volume to current-framework tagging.",
  },
  {
    source: "Missing IR module",
    supported: "Almost none",
    returnSignal: "Largest structural weakness.",
    nextDecision: "Create dedicated IR command path before 2027 prelims cycle.",
  },
];

const softwareBuildModules = [
  {
    title: "Evidence Ledger",
    route: "/upsc/prelims-2026-showcase",
    status: "Started",
    detail: "Question-wise proof board with complete MCQ, source lead, matched portions and public claim lock.",
  },
  {
    title: "Gap Radar",
    route: "/upsc/content-command",
    status: "Next build",
    detail: "Tag every weakness as content, format, current bridge, map, source depth or revision gap.",
  },
  {
    title: "2027 Build Planner",
    route: "/upsc/yearly-planner",
    status: "Next build",
    detail: "Convert the PDF priority matrix into monthly work: IR, S&T domains, legal current and map intelligence.",
  },
  {
    title: "Format Rebuilder",
    route: "/upsc/mcq-command",
    status: "Next build",
    detail: "Transform old recall MCQs into multi-statement, how-many-correct, pair, A-R, NOT and caselet formats.",
  },
  {
    title: "Student Readiness Simulator",
    route: "/upsc/readiness-audit",
    status: "Next build",
    detail: "Student selects completed modules; software returns advantage, exposed topics and 2027 risk score.",
  },
  {
    title: "2027 Practice Engine",
    route: "/upsc/question-bank",
    status: "Next build",
    detail: "Generate practice by subject, gap type, format type, difficulty and trend relevance.",
  },
];

const formatRebuildRules = [
  { format: "Multi-statement", target: "50%", reason: "Dominant UPSC style after 2026." },
  { format: "How-many-correct", target: "15%", reason: "Rising format that students faced cold." },
  { format: "Match-pair", target: "10%", reason: "Stable across years and useful for maps, indices and culture." },
  { format: "NOT / Exception", target: "10%", reason: "Persistent trap style that rewards elimination discipline." },
  { format: "Assertion-reason", target: "5%", reason: "Returning format that tests why, not just what." },
  { format: "Scenario / Caselet", target: "10%", reason: "New GS-1 signal and a first-mover opportunity." },
];

const portalTabs = [
  {
    value: "evidence",
    label: "Evidence Ledger",
    title: "Question-wise proof board",
    icon: FileCheck2,
    bullets: [
      "One row per UPSC question with exact, conceptual or gap status.",
      "Source screenshot/page reference before any public claim is unlocked.",
      "Teacher note field for why the match is valid or rejected.",
    ],
  },
  {
    value: "pattern",
    label: "Pattern Lab",
    title: "Question asking method engine",
    icon: BrainCircuit,
    bullets: [
      "Classify every question by statement type, logic, depth and trap style.",
      "Convert official questions into 5 practice variants.",
      "Train elimination, assertion-reason, map logic and data sufficiency.",
    ],
  },
  {
    value: "gap",
    label: "Gap Radar",
    title: "Untapped and underbuilt domains",
    icon: Radar,
    bullets: [
      "Track Economy digital finance, international map intelligence and ethics caselets.",
      "Connect weak domains to modules, MCQs, lecture clips and revision PDFs.",
      "Separate content gap from format gap so the fix is precise.",
    ],
  },
  {
    value: "planner",
    label: "2027 Planner",
    title: "Build planner and execution calendar",
    icon: ClipboardCheck,
    bullets: [
      "Turn the priority matrix into weekly content tasks for IR, S&T, legal current and maps.",
      "Track owner, deadline, source proof, MCQ conversion and student-release readiness.",
      "Keep Economy in maintenance mode while critical gaps get more build time.",
    ],
  },
  {
    value: "rebuilder",
    label: "Format Rebuilder",
    title: "Old-bank to UPSC-format converter",
    icon: Layers3,
    bullets: [
      "Convert recall MCQs into multi-statement, how-many-correct, pair, A-R, NOT and caselet versions.",
      "Use the 2026 format formula as a hard rule for every subject bank.",
      "Send weak formats into the student practice engine automatically.",
    ],
  },
  {
    value: "simulator",
    label: "Simulator",
    title: "Student readiness and risk score",
    icon: Gauge,
    bullets: [
      "Let students select completed modules and show likely exposure in 2027 terms.",
      "Calculate advantage by source, format, subject and current-static bridge readiness.",
      "Recommend the next 7-day practice route from the student's own gap type.",
    ],
  },
  {
    value: "website",
    label: "Public Proof",
    title: "Public website view",
    icon: PieChartIcon,
    bullets: [
      "Large charts, trend sections and subject cards for the main website.",
      "Public-safe claims only: verified proof first, candidate leads second.",
      "Reusable sections for future PDF and deck reuse.",
    ],
  },
];

const requirementTracker = [
  {
    label: "Standalone page",
    status: "Complete",
    proof: "Public route exists at /upsc-prelims-2026-showcase with light geography styling.",
  },
  {
    label: "Portal-ready route",
    status: "Complete",
    proof: "Dashboard route exists at /upsc/prelims-2026-showcase and is linked from UPSC global controls.",
  },
  {
    label: "PDF/chat analysis uploaded",
    status: "Complete",
    proof: "The page carries the given analysis themes: 2026 pattern shift, coverage audit, gaps and next build.",
  },
  {
    label: "Year-long archive scan",
    status: "Complete",
    proof: "Morning Batch source index is summarized with 1,504 files, 1,247 supported documents and 24,131 chunks.",
  },
  {
    label: "What we built",
    status: "Complete",
    proof: "Subject and sprint asset sections show Geography, Environment, History, Polity, S&T, value-addition and current affairs work.",
  },
  {
    label: "What appeared",
    status: "Complete",
    proof: "Subject cards and the 100-question ledger map the 2026 paper into subject, nature, difficulty and format.",
  },
  {
    label: "Surprise elements",
    status: "Complete",
    proof: "Trend and gap sections call out History rebound, map pressure, economy-tech merger and Environment reset.",
  },
  {
    label: "Question asking pattern",
    status: "Complete",
    proof: "Format charts, pattern cards and each expanded question show statement architecture, trap style and depth tested.",
  },
  {
    label: "Statement/concept coverage",
    status: "Proof locked",
    proof: "Every expanded question includes a statement coverage map; public accuracy remains locked until manual source proof.",
  },
  {
    label: "Untapped domains and next actions",
    status: "Complete",
    proof: "Gap radar and per-question next actions identify map intelligence, digital economy, ethics caselets, applied science and source proof.",
  },
];

const statusFilterOptions: Array<{ value: QuestionStatusFilter; label: string }> = [
  { value: "all", label: "All evidence" },
  { value: "direct", label: "Direct leads" },
  { value: "partial", label: "Conceptual leads" },
  { value: "none", label: "Gaps only" },
];

const questionStatusTone: Record<ShowcaseQuestionEvidence["status"], string> = {
  direct: "border-[#1b6b4a] bg-[#e2f5ea] text-[#125239]",
  partial: "border-[#d8891c] bg-[#fff3dd] text-[#7b4d0d]",
  none: "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]",
};

const statementCoverageTone: Record<
  ShowcaseQuestionEvidence["statementCoverage"][number]["coverage"],
  string
> = {
  "source-signal": "border-[#1b6b4a] bg-[#e2f5ea] text-[#125239]",
  "concept-signal": "border-[#d8891c] bg-[#fff3dd] text-[#7b4d0d]",
  "manual-check": "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]",
};

function formatScore(value: number) {
  return value.toFixed(3);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({ text, signals }: { text: string; signals: string[] }) {
  const cleanSignals = Array.from(
    new Set(signals.map((signal) => signal.trim()).filter((signal) => signal.length > 2))
  ).sort((first, second) => second.length - first.length);

  if (!text || cleanSignals.length === 0) return <>{text}</>;

  const matcher = new RegExp(`(${cleanSignals.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(matcher).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = cleanSignals.some((signal) => signal.toLowerCase() === part.toLowerCase());

        return isMatch ? (
          <mark key={`${part}-${index}`} className="rounded-sm bg-[#fff0a6] px-1 font-black text-[#6a4b00]">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}

const containerMotion = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function ChartStage({
  height,
  children,
}: {
  height: number;
  children: (width: number, height: number) => ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      const nextWidth = Math.floor(stageRef.current?.clientWidth ?? 0);
      setWidth(nextWidth > 0 ? nextWidth : 0);
    };

    const timer = window.setTimeout(measure, 120);
    const observer = new ResizeObserver(measure);

    if (stageRef.current) {
      observer.observe(stageRef.current);
    }

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={stageRef} className="min-w-0" style={{ height, minHeight: height }}>
      {width > 0 ? (
        children(width, height)
      ) : (
        <div className="flex h-full items-center justify-center rounded-md bg-[#eef6f1]">
          <BarChart3 className="h-5 w-5 text-[#1b6b4a]" />
        </div>
      )}
    </div>
  );
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-[#cbd8ce] bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-black text-[#12251d]">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <p key={`${item.name}-${item.dataKey}`} className="flex items-center gap-2 font-semibold text-[#52645a]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color ?? theme.leaf }} />
            <span>{item.name}: {item.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#bfd8ca] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </div>
        <h2 className="text-3xl font-black leading-tight tracking-tight text-[#12251d] md:text-5xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#53645b] md:text-base">{body}</p>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <motion.div
      variants={itemMotion}
      className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <Icon className="h-5 w-5 text-[#1b6b4a]" />
        <span className="rounded-md bg-[#eef7f1] px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">
          Audit
        </span>
      </div>
      <p className="text-3xl font-black tracking-tight text-[#12251d]">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#819087]">{label}</p>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{detail}</p>
    </motion.div>
  );
}

function SubjectCard({ item }: { item: SubjectCoverage }) {
  const directWidth = percent(item.direct, item.questions);
  const partialWidth = percent(item.partial, item.questions);

  return (
    <motion.article
      variants={itemMotion}
      className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#819087]">{item.short}</p>
          <h3 className="mt-1 text-lg font-black text-[#12251d]">{item.subject}</h3>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-black text-white"
          style={{ backgroundColor: item.color }}
        >
          {item.questions}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.12em] text-[#6a786f]">
          <span>Candidate evidence</span>
          <span>{item.direct}D / {item.partial}P</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-[#edf2ee]">
          <span className="bg-[#1b6b4a]" style={{ width: `${directWidth}%` }} />
          <span className="bg-[#d8891c]" style={{ width: `${partialWidth}%` }} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm leading-6">
        <p className="font-semibold text-[#53645b]"><span className="font-black text-[#12251d]">Built:</span> {item.built}</p>
        <p className="font-semibold text-[#53645b]"><span className="font-black text-[#12251d]">Appeared:</span> {item.appeared}</p>
        <p className="font-semibold text-[#53645b]"><span className="font-black text-[#a75525]">Gap:</span> {item.gap}</p>
      </div>

      <div className="mt-5 rounded-md border border-[#d7e4da] bg-[#f7faf7] p-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1b6b4a]">Next build</p>
        <p className="mt-2 text-sm font-bold leading-6 text-[#34483d]">{item.action}</p>
      </div>
    </motion.article>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
      <p className="text-2xl font-black tracking-tight" style={{ color: tone }}>{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#6f7e75]">{label}</p>
    </div>
  );
}

function QuestionEvidenceCard({ item }: { item: ShowcaseQuestionEvidence }) {
  const distinctInstruction = item.instruction && item.instruction !== item.stemFull;
  const coreCoverage = item.statementCoverage[0];

  return (
    <details className="group rounded-lg border border-[#cbd8ce] bg-white shadow-sm">
      <summary className="grid cursor-pointer list-none gap-4 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#12251d] text-sm font-black text-white">
          Q{item.number}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#eef6f1] px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">
              {item.subject}
            </span>
            <span className="rounded-md bg-[#f7f1e6] px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#8c5b0f]">
              {item.nature}
            </span>
            <span className="rounded-md bg-[#eef3f7] px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#276fbf]">
              {item.statementCount >= 2 ? `${item.statementCount} statements` : "single frame"}
            </span>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-[#364b40]">{item.stemPreview}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <span className={`rounded-md border px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${questionStatusTone[item.status]}`}>
            {item.statusLabel}
          </span>
          <span className="rounded-md border border-[#cbd8ce] bg-[#f8fbf7] px-3 py-1 text-xs font-black text-[#53645b]">
            Score {formatScore(item.bestScore)}
          </span>
        </div>
      </summary>

      <div className="border-t border-[#d8e4db] p-4">
        <div className="rounded-md border border-[#bfd8ca] bg-[#f8fbf7] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">
                Complete MCQ with matched portions
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#2f4f3f]">{item.matchScope}</p>
            </div>
            <span className={`rounded-md border px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${questionStatusTone[item.status]}`}>
              {item.statusLabel}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-md border border-[#d8e4db] bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#53645b]">
                  {item.statementsFull.length > 0 ? "Question stem" : "Core question frame"}
                </p>
                {item.statementsFull.length === 0 && coreCoverage ? (
                  <span className={`rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${statementCoverageTone[coreCoverage.coverage]}`}>
                    {coreCoverage.coverageLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                <HighlightedText
                  text={item.stemFull}
                  signals={item.statementsFull.length === 0 ? coreCoverage?.matchedSignals ?? item.coveredSignals : item.coveredSignals}
                />
              </p>
              {item.statementsFull.length === 0 && coreCoverage ? (
                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#6f7e75]">
                  {coreCoverage.matchedSignals.length > 0
                    ? `Search hit in this portion: ${coreCoverage.matchedSignals.join(", ")}`
                    : "No searchable hit in this portion"}
                </p>
              ) : null}
            </div>

            {item.statementsFull.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {item.statementsFull.map((statement, index) => {
                  const coverage = item.statementCoverage[index];

                  return (
                    <div key={`${item.number}-full-statement-${index}`} className="rounded-md border border-[#d8e4db] bg-white p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#53645b]">
                          Statement {index + 1}
                        </p>
                        {coverage ? (
                          <span className={`rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${statementCoverageTone[coverage.coverage]}`}>
                            {coverage.coverageLabel}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                        <HighlightedText text={statement} signals={coverage?.matchedSignals ?? []} />
                      </p>
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#6f7e75]">
                        {coverage?.matchedSignals.length
                          ? `Search hit in this portion: ${coverage.matchedSignals.join(", ")}`
                          : "No searchable hit in this portion"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {distinctInstruction ? (
              <div className="rounded-md border border-[#d8e4db] bg-white p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#53645b]">Instruction</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                  <HighlightedText text={item.instruction} signals={item.coveredSignals} />
                </p>
              </div>
            ) : null}

            <div className="rounded-md border border-[#d8e4db] bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#53645b]">Options</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {item.options.map((option) => (
                  <div key={`${item.number}-option-${option.letter}`} className="flex gap-2 rounded-md bg-[#f8fbf7] p-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#12251d] text-xs font-black text-white">
                      {option.letter}
                    </span>
                    <p className="text-sm font-semibold leading-6 text-[#364b40]">
                      <HighlightedText text={option.text} signals={item.coveredSignals} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Question logic</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
              <span className="font-black text-[#12251d]">Instruction:</span> {item.instruction}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
              <span className="font-black text-[#12251d]">Answer:</span> {item.answer} ·{" "}
              <span className="font-black text-[#12251d]">Difficulty:</span> {item.difficulty}
            </p>
          </div>

          <div className="rounded-md border border-[#d8e4db] bg-[#fffaf1] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a75525]">Source lead</p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#6a4b26]">{item.sourceLead}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#6a4b26]">{item.researchNote}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-[#d8e4db] bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Why UPSC asked this</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{item.whyAsked}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-[#cbd8ce] bg-[#eef6f1] px-2 py-1 text-xs font-black text-[#245641]">
                {item.formatLabel}
              </span>
              <span className="rounded-md border border-[#d9c8a4] bg-[#fffaf1] px-2 py-1 text-xs font-black text-[#7b4d0d]">
                {item.trapStyle}
              </span>
            </div>
          </div>
          <div className="rounded-md border border-[#d8e4db] bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#276fbf]">Depth tested</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{item.depthTest}</p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Statement coverage map</p>
          <div className="mt-3 grid gap-3">
            {item.statementCoverage.map((statement) => (
              <div key={`${item.number}-${statement.label}`} className="rounded-md border border-[#d8e4db] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#53645b]">{statement.label}</p>
                  <span className={`rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${statementCoverageTone[statement.coverage]}`}>
                    {statement.coverageLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                  <HighlightedText text={statement.text} signals={statement.matchedSignals} />
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statement.matchedSignals.length > 0 ? (
                    statement.matchedSignals.map((signal) => (
                      <span
                        key={`${item.number}-${statement.label}-${signal}`}
                        className="rounded-md border border-[#cbd8ce] bg-[#eef6f1] px-2 py-1 text-xs font-black text-[#245641]"
                      >
                        {signal}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-md border border-[#f0c0b4] bg-[#fff0ec] px-2 py-1 text-xs font-black text-[#9d3824]">
                      no searchable hit
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-md border border-[#d8e4db] bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Covered statement or concept signals</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{item.conceptLead}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.coveredSignals.length > 0 ? (
              item.coveredSignals.map((signal) => (
                <span
                  key={`${item.number}-${signal}`}
                  className="rounded-md border border-[#cbd8ce] bg-[#eef6f1] px-2 py-1 text-xs font-black text-[#245641]"
                >
                  {signal}
                </span>
              ))
            ) : (
              <span className="rounded-md border border-[#f0c0b4] bg-[#fff0ec] px-2 py-1 text-xs font-black text-[#9d3824]">
                OCR or manual review needed
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-md border border-[#bfd8ca] bg-[#eef6f1] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Next action</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#2f4f3f]">{item.nextAction}</p>
        </div>
      </div>
    </details>
  );
}

function QuestionEvidenceSection({
  questionEvidence,
}: {
  questionEvidence: ShowcaseQuestionEvidence[];
}) {
  const [statusFilter, setStatusFilter] = useState<QuestionStatusFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState("All subjects");

  const subjects = useMemo(
    () => ["All subjects", ...Array.from(new Set(questionEvidence.map((item) => item.subject))).sort()],
    [questionEvidence]
  );
  const filteredEvidence = useMemo(
    () =>
      questionEvidence.filter((item) => {
        const statusMatches = statusFilter === "all" || item.status === statusFilter;
        const subjectMatches = subjectFilter === "All subjects" || item.subject === subjectFilter;

        return statusMatches && subjectMatches;
      }),
    [questionEvidence, statusFilter, subjectFilter]
  );
  const totals = useMemo(
    () => ({
      direct: questionEvidence.filter((item) => item.status === "direct").length,
      partial: questionEvidence.filter((item) => item.status === "partial").length,
      none: questionEvidence.filter((item) => item.status === "none").length,
      multiStatement: questionEvidence.filter((item) => item.statementCount >= 2).length,
    }),
    [questionEvidence]
  );

  return (
    <section id="question-ledger" className="border-y border-[#cbd8ce] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Question ledger"
          title="Every question gets a status, concept signal and next content action."
          body="This is the bridge between the PDF-style analysis and the final portal tab: it shows what was covered, what is only conceptual, and where OCR or manual page proof is still needed."
          icon={FileSearch}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MiniStat label="Direct candidate leads" value={String(totals.direct)} tone={theme.leaf} />
          <MiniStat label="Conceptual leads" value={String(totals.partial)} tone={theme.amber} />
          <MiniStat label="Search gaps" value={String(totals.none)} tone={theme.coral} />
          <MiniStat label="Multi-statement questions" value={String(totals.multiStatement)} tone={theme.blue} />
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Filter evidence</p>
            <p className="mt-1 text-sm font-semibold text-[#53645b]">
              Showing {filteredEvidence.length} of {questionEvidence.length} audited questions.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="showcase-status-filter">Evidence status</label>
            <select
              id="showcase-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as QuestionStatusFilter)}
              className="h-10 rounded-md border border-[#cbd8ce] bg-white px-3 text-sm font-bold text-[#12251d] outline-none focus:border-[#1b6b4a]"
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="showcase-subject-filter">Subject</label>
            <select
              id="showcase-subject-filter"
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="h-10 rounded-md border border-[#cbd8ce] bg-white px-3 text-sm font-bold text-[#12251d] outline-none focus:border-[#1b6b4a]"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {filteredEvidence.map((item) => (
            <QuestionEvidenceCard key={item.number} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function UpscPrelimsShowcase({
  questionEvidence,
}: {
  questionEvidence: ShowcaseQuestionEvidence[];
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f4] text-[#12251d]">
      <section className="relative border-b border-[#cbd8ce] bg-[#eef6f1]">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(0deg,rgba(18,37,29,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,37,29,0.05)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto grid min-h-[92vh] max-w-7xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerMotion}
            className="space-y-7"
          >
            <motion.div variants={itemMotion} className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#12251d] text-white">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xl font-black uppercase tracking-tight">UPSC Prelims 2026</p>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1b6b4a]">Morning Batch audit showcase</p>
              </div>
            </motion.div>

            <motion.div variants={itemMotion} className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#a75525]">Standalone public page</p>
              <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-[#12251d] md:text-7xl">
                What we built. What UPSC asked. What changes next.
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[#53645b]">
                A main-site-ready proof page that converts the year-long content archive into subject coverage,
                trend change, question-pattern logic and the next UPSC portal tab plan.
              </p>
            </motion.div>

            <motion.div variants={itemMotion} className="flex flex-wrap gap-3">
              <Link
                href="#coverage"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#1b6b4a] px-5 text-sm font-black text-white transition hover:bg-[#125239]"
              >
                View coverage map
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="#portal-plan"
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#1b6b4a]/35 bg-white px-5 text-sm font-black text-[#154f39] transition hover:bg-[#eef7f1]"
              >
                Portal tab plan
              </Link>
              <Link
                href="#question-ledger"
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#d8891c]/45 bg-[#fffaf1] px-5 text-sm font-black text-[#7b4d0d] transition hover:bg-[#fff3dd]"
              >
                Question ledger
              </Link>
            </motion.div>

            <motion.div variants={containerMotion} className="grid gap-3 sm:grid-cols-2">
              {corpusStats.map((stat) => (
                <MetricTile key={stat.label} {...stat} />
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55 }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1b6b4a]">Candidate evidence status</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">37 direct leads, 63 conceptual leads</h2>
                </div>
                <PieChartIcon className="h-5 w-5 text-[#d8891c]" />
              </div>
              <ChartStage height={280}>
                {(width, height) => (
                  <PieChart width={width} height={height}>
                    <Pie
                      data={evidencePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={68}
                      outerRadius={108}
                      paddingAngle={3}
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive
                    >
                      {evidencePie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                )}
              </ChartStage>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MiniStat label="Direct source leads" value="37%" tone={theme.leaf} />
              <MiniStat label="Conceptual leads" value="63%" tone={theme.amber} />
              <MiniStat label="Public claim unlocked" value="0%" tone={theme.coral} />
            </div>

            <div className="rounded-lg border border-[#d9c8a4] bg-[#fffaf1] p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-[#a75525]" />
                <p className="text-sm font-bold leading-6 text-[#6a4b26]">
                  Candidate matches are discovery leads. Public accuracy percentage should be published only after
                  exact source/page proof is retained for every accepted UPSC question.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-[#cbd8ce] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:px-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1b6b4a]">One-year build scan</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">The archive is not one PDF. It is a content system.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">
              The local scan found Prelims, GS 1, GS 2, GS 3, Ethics, CSAT, a 30-day sprint and a project status
              file. The showcase uses that archive as the proof base, while hiding raw file paths from students.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sprintAssets.map((asset) => (
              <div key={asset.label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                <asset.icon className="mb-5 h-5 w-5 text-[#1b6b4a]" />
                <p className="text-2xl font-black tracking-tight text-[#12251d]">{asset.value}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#6f7e75]">{asset.label}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{asset.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <motion.section
        id="coverage"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={containerMotion}
        className="mx-auto max-w-7xl px-4 py-12 md:px-8"
      >
        <SectionHeader
          eyebrow="Coverage map"
          title="Question by question, the evidence is strong but still needs proof locking."
          body="This section converts the audit ledger into a public-safe subject map: direct source leads, conceptual leads, what appeared, what was built and what must be upgraded."
          icon={Target}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {subjectCoverage.map((item) => (
            <SubjectCard key={item.subject} item={item} />
          ))}
        </div>
      </motion.section>

      <section className="border-y border-[#cbd8ce] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Trend shift"
            title="2026 rewarded applied reasoning more than static recall."
            body="The working comparison shows History and current-linked domains rising, while Environment and Geography became smaller but more integrated and map-aware."
            icon={TrendingUp}
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
            <div className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Four-year subject swing</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight">Question distribution trend</h3>
                </div>
                <LineChartIcon className="h-5 w-5 text-[#276fbf]" />
              </div>
              <ChartStage height={360}>
                {(width, height) => (
                  <LineChart width={width} height={height} data={trendData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="#d9e2db" strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                    <YAxis tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="history" name="History+Culture" stroke={theme.amber} strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="science" name="Science" stroke={theme.plum} strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="economy" name="Economy" stroke={theme.blue} strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="environment" name="Environment" stroke={theme.leaf} strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="geography" name="Geography" stroke={theme.teal} strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                )}
              </ChartStage>
            </div>

            <div className="grid gap-4">
              {[
                ["History rebound", "History plus culture rose to 21 in the working ledger, so visual culture and movement logic matter again."],
                ["Map pressure", "Geography count fell, but the asked geography became more strategic: ports, straits, places and boundaries."],
                ["Economy-tech merger", "Digital finance, AI, quantum, space and biotech are now part of the same applied reasoning layer."],
                ["Environment reset", "Environment is no longer the only anchor; it must be linked to current reports, schemes and agriculture."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                  <CheckCircle2 className="mb-4 h-5 w-5 text-[#1b6b4a]" />
                  <h3 className="text-lg font-black text-[#12251d]">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Final PDF research lens"
          title="The corrected audit changes the story: Economy is a strength, IR and new S&T are the real gaps."
          body="The PDF's final human audit sits above the automated source-lead ledger. It separates true direct hits, partial preparation advantage, real misses and dropped UPSC questions."
          icon={FileCheck2}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {finalAuditScorecard.map((item) => (
            <div key={item.label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-4xl font-black tracking-tight" style={{ color: item.color }}>
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#6f7e75]">{item.label}</p>
                </div>
                <span className="rounded-md border border-[#cbd8ce] bg-[#f8fbf7] px-2 py-1 text-xs font-black text-[#53645b]">
                  {item.share}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-[#d9c8a4] bg-[#fffaf1] p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a75525]">Corrected interpretation</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-[#12251d]">Effective preparation advantage: 74 of 97 scorable questions.</h3>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#6a4b26]">
                The page should show this as a corrected research outcome, while the expanded MCQ ledger keeps exact source
                proof locked until every accepted public claim is verified.
              </p>
            </div>
            <div className="rounded-md bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-3xl font-black text-[#1b6b4a]">76%</p>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6f7e75]">effective coverage</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {finalPatternShifts.map((item) => (
            <div key={item.title} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
              <item.icon className="mb-5 h-5 w-5 text-[#1b6b4a]" />
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black text-[#12251d]">{item.title}</h3>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-[#a75525] shadow-sm">{item.metric}</span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
              <p className="mt-3 rounded-md bg-white p-3 text-sm font-bold leading-6 text-[#2f4f3f]">{item.action}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Question logic"
          title="The asking style is the real battleground."
          body="The paper is testing whether a student can evaluate statements, scope, exceptions and applied context. The practice engine should mirror that logic."
          icon={BrainCircuit}
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Format split</p>
                <h3 className="mt-1 text-xl font-black tracking-tight">Statement architecture</h3>
              </div>
              <BarChart3 className="h-5 w-5 text-[#1b6b4a]" />
            </div>
            <ChartStage height={320}>
              {(width, height) => (
                <BarChart width={width} height={height} data={questionFormatData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#d9e2db" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} interval={0} />
                  <YAxis tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" name="Questions" radius={[6, 6, 0, 0]}>
                    {questionFormatData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ChartStage>
          </div>

          <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Depth split</p>
                <h3 className="mt-1 text-xl font-black tracking-tight">Why questions were framed</h3>
              </div>
              <Gauge className="h-5 w-5 text-[#d8891c]" />
            </div>
            <ChartStage height={320}>
              {(width, height) => (
                <PieChart width={width} height={height}>
                  <Pie
                    data={natureData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={106}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive
                  >
                    {natureData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              )}
            </ChartStage>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {patternCards.map((card) => (
            <div key={card.title} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <card.icon className="mb-5 h-5 w-5 text-[#1b6b4a]" />
              <h3 className="text-lg font-black text-[#12251d]">{card.title}</h3>
              <p className="mt-3 text-sm font-black leading-6 text-[#a75525]">{card.signal}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{card.logic}</p>
              <p className="mt-3 rounded-md bg-[#eef6f1] p-3 text-sm font-bold leading-6 text-[#2f4f3f]">{card.drill}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#cbd8ce] bg-[#f8fbf7]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Hit quality ladder"
            title="A hit should mature through five proof stages before it becomes a public claim."
            body="This solves the biggest audit risk: confusing topic overlap with actual answerability. The software should move every question through this ladder."
            icon={ShieldCheck}
          />

          <div className="mt-8 grid gap-3 lg:grid-cols-5">
            {hitQualityLadder.map((item, index) => (
              <div key={item.stage} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#12251d] text-xs font-black text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-black text-[#12251d]">{item.stage}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{item.proof}</p>
                <p className="mt-3 rounded-md bg-[#eef6f1] p-3 text-sm font-bold leading-6 text-[#2f4f3f]">{item.unlock}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <QuestionEvidenceSection questionEvidence={questionEvidence} />

      <section className="border-y border-[#cbd8ce] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Gap radar"
            title="The next content build should target pattern gaps, not only subject gaps."
            body="The highest-value upgrades are map intelligence, digital economy, ethics-governance caselets, applied science and source-proof workflow."
            icon={Radar}
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
              <ChartStage height={390}>
                {(width, height) => (
                  <RadarChart width={width} height={height} data={radarData} outerRadius={130}>
                    <PolarGrid stroke="#cdd9d0" />
                    <PolarAngleAxis dataKey="domain" tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <RadarShape name="Current readiness" dataKey="current" stroke={theme.amber} fill={theme.amber} fillOpacity={0.24} />
                    <RadarShape name="Target readiness" dataKey="target" stroke={theme.leaf} fill={theme.leaf} fillOpacity={0.18} />
                    <Legend />
                  </RadarChart>
                )}
              </ChartStage>
            </div>

            <div className="grid gap-3">
              {nextPatternOpportunities.map((item) => (
                <div key={item.pattern} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-[#12251d]">{item.pattern}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{item.reason}</p>
                    </div>
                    <span
                      className={
                        item.probability === "High"
                          ? "rounded-md bg-[#e2f5ea] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#1b6b4a]"
                          : "rounded-md bg-[#fff1d7] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#8c5b0f]"
                      }
                    >
                      {item.probability}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Gap classifier"
          title="Every weak question should become a tagged software action, not a vague content gap."
          body="The PDF shows that misses came from different causes. The portal should classify each gap so the fix is precise and assignable."
          icon={AlertTriangle}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gapTypes.map((gap) => (
            <div key={gap.type} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <div className="mb-4 h-1.5 rounded-full" style={{ backgroundColor: gap.color }} />
              <h3 className="text-lg font-black text-[#12251d]">{gap.type}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">
                <span className="font-black text-[#12251d]">Signal:</span> {gap.signal}
              </p>
              <p className="mt-3 rounded-md bg-[#f8fbf7] p-3 text-sm font-bold leading-6 text-[#2f4f3f]">
                {gap.softwareAction}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Source corpus"
          title="The page can defend the build story with archive-level evidence."
          body="For student-facing presentation we show categories and counts. For internal review, the portal can retain raw files, page references and screenshot proof."
          icon={Database}
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Top-level archive</p>
                <h3 className="mt-1 text-xl font-black tracking-tight">Files by learning area</h3>
              </div>
              <Database className="h-5 w-5 text-[#276fbf]" />
            </div>
            <ChartStage height={360}>
              {(width, height) => (
                <BarChart width={width} height={height} data={sourceBuckets} layout="vertical" margin={{ top: 8, right: 18, left: 22, bottom: 8 }}>
                  <CartesianGrid stroke="#d9e2db" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                  <YAxis type="category" dataKey="name" width={92} tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="files" name="Files" radius={[0, 6, 6, 0]}>
                    {sourceBuckets.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ChartStage>
          </div>

          <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Creation timeline</p>
                <h3 className="mt-1 text-xl font-black tracking-tight">Archive growth by month</h3>
              </div>
              <TrendingUp className="h-5 w-5 text-[#1b6b4a]" />
            </div>
            <ChartStage height={360}>
              {(width, height) => (
                <BarChart width={width} height={height} data={uploadMonths} margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#d9e2db" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} interval={0} />
                  <YAxis tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="files" name="Files added" fill={theme.teal} radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ChartStage>
          </div>
        </div>
      </section>

      <section className="border-y border-[#cbd8ce] bg-[#f8fbf7]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Source ROI"
            title="The 2027 plan should invest more where the source return is proven."
            body="This table translates the final PDF source mapping into course-design decisions: keep, patch, deepen or build from scratch."
            icon={Database}
          />

          <div className="mt-8 overflow-hidden rounded-lg border border-[#cbd8ce] bg-white shadow-sm">
            <div className="hidden text-xs font-black uppercase tracking-[0.14em] text-[#6f7e75] md:grid md:grid-cols-[1fr_0.8fr_1.2fr_1.3fr]">
              <div className="border-b border-[#d8e4db] p-3">Source</div>
              <div className="border-b border-[#d8e4db] p-3">Support</div>
              <div className="border-b border-[#d8e4db] p-3">Return signal</div>
              <div className="border-b border-[#d8e4db] p-3">2027 decision</div>
            </div>
            <div className="divide-y divide-[#d8e4db]">
              {sourceRoiRows.map((row) => (
                <div key={row.source} className="grid gap-3 p-4 md:grid-cols-[1fr_0.8fr_1.2fr_1.3fr] md:items-start">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] md:hidden">Source</p>
                    <p className="text-sm font-black leading-6 text-[#12251d]">{row.source}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] md:hidden">Support</p>
                    <p className="text-sm font-bold leading-6 text-[#1b6b4a]">{row.supported}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] md:hidden">Return signal</p>
                    <p className="text-sm font-semibold leading-6 text-[#53645b]">{row.returnSignal}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] md:hidden">2027 decision</p>
                    <p className="text-sm font-bold leading-6 text-[#2f4f3f]">{row.nextDecision}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="requirement-tracker" className="border-y border-[#cbd8ce] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Requirement tracker"
            title="The original 10-point brief is now visible on the page."
            body="This tracker turns the broad build request into public-facing proof points: what is complete, what is proof-locked, and where the portal route takes over."
            icon={FileCheck2}
          />

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {requirementTracker.map((item, index) => (
              <div key={item.label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#12251d] text-xs font-black text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-[#12251d]">{item.label}</h3>
                      <span
                        className={
                          item.status === "Proof locked"
                            ? "rounded-md border border-[#d8891c] bg-[#fff3dd] px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#7b4d0d]"
                            : "rounded-md border border-[#1b6b4a] bg-[#e2f5ea] px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#125239]"
                        }
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{item.proof}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="strategy-2027" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="2027 strategy"
          title="The next build is not more content everywhere. It is sharper allocation."
          body="The PDF's corrected priority matrix becomes the public explanation and the internal build queue for the software."
          icon={ClipboardCheck}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {priorityMatrix2027.map((item) => (
            <div key={item.subject} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#819087]">{item.accuracy}</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-[#12251d]">{item.subject}</h3>
                </div>
                <span
                  className={
                    item.priority === "Critical"
                      ? "rounded-md border border-[#d95f43] bg-[#fff0ec] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#9d3824]"
                      : item.priority === "High"
                        ? "rounded-md border border-[#d8891c] bg-[#fff3dd] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#7b4d0d]"
                        : "rounded-md border border-[#1b6b4a] bg-[#e2f5ea] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#125239]"
                  }
                >
                  {item.priority}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#53645b]">
                <span className="font-black text-[#12251d]">Evidence:</span> {item.evidence}
              </p>
              <p className="mt-3 rounded-md bg-[#f8fbf7] p-3 text-sm font-bold leading-6 text-[#2f4f3f]">
                {item.action}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="software-path" className="border-y border-[#cbd8ce] bg-[#f8fbf7]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Software execution path"
            title="The page becomes a working 2027 preparation engine through six modules."
            body="This connects the research page to the existing UPSC portal routes. The first layer is visible here; the next layer should store tasks, gap tags, student readiness and generated practice."
            icon={Gauge}
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {softwareBuildModules.map((module) => (
              <div key={module.title} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-[#12251d]">{module.title}</h3>
                  <span
                    className={
                      module.status === "Started"
                        ? "rounded-md border border-[#1b6b4a] bg-[#e2f5ea] px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#125239]"
                        : "rounded-md border border-[#d8891c] bg-[#fff3dd] px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#7b4d0d]"
                    }
                  >
                    {module.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{module.detail}</p>
                <Link
                  href={module.route}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-[#1b6b4a]/35 bg-[#eef6f1] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-white"
                >
                  Open path
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Format rebuild rule</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-[#12251d]">Every 2027 question bank should follow this mix.</h3>
              </div>
              <span className="rounded-md bg-[#fffaf1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#8c5b0f]">
                hard software rule
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {formatRebuildRules.map((rule) => (
                <div key={rule.format} className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#12251d]">{rule.format}</p>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-[#1b6b4a]">{rule.target}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{rule.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="portal-plan" className="border-t border-[#cbd8ce] bg-[#eef6f1]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Portal activation"
            title="This standalone page becomes one portal tab after proof review."
            body="The page should later connect to question-level evidence, student practice variants and a public proof view. The layout below is the functional plan."
            icon={ClipboardCheck}
          />

          <div className="mt-8 rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm md:p-5">
            <Tabs defaultValue="evidence" className="gap-5">
              <TabsList className="h-auto w-full flex-wrap justify-start rounded-md bg-[#edf4ef] p-1">
                {portalTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-10 flex-none rounded-md px-3 text-xs font-black uppercase tracking-[0.1em] data-active:bg-white data-active:text-[#1b6b4a]"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {portalTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="rounded-lg border border-[#d6e2d9] bg-[#f8fbf7] p-5">
                  <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                    <div>
                      <tab.icon className="mb-5 h-6 w-6 text-[#1b6b4a]" />
                      <h3 className="text-2xl font-black tracking-tight text-[#12251d]">{tab.title}</h3>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">
                        This tab keeps the public proof story connected to the operational portal, so every claim can become
                        practice, review, proof or a content task.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {tab.bullets.map((bullet) => (
                        <div key={bullet} className="flex gap-3 rounded-md border border-[#d6e2d9] bg-white p-3">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#1b6b4a]" />
                          <p className="text-sm font-bold leading-6 text-[#384b41]">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <Sparkles className="mb-5 h-5 w-5 text-[#d8891c]" />
              <h3 className="text-lg font-black">Website ready</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
                Charts and cards are main-site-first, with public-safe proof language.
              </p>
            </div>
            <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <ShieldCheck className="mb-5 h-5 w-5 text-[#1b6b4a]" />
              <h3 className="text-lg font-black">Claim safe</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
                Direct and partial matches are not marketed as final accuracy until proof is verified.
              </p>
            </div>
            <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <Route className="mb-5 h-5 w-5 text-[#276fbf]" />
              <h3 className="text-lg font-black">Portal ready</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
                The next step is wiring this to the existing UPSC audit ledger and practice engine.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
