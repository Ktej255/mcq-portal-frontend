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
  Clipboard,
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
import {
  formatRebuildRules as strategyFormatRebuildRules,
  prelims2027Priorities,
  strategyEvidenceLedger,
  strategyExecutionTasks,
  strategyPracticeBlueprints,
  strategyReallocationPlan,
} from "@/lib/upsc/prelims2027Strategy";
import {
  parsePrelims2026PublicProofFeed,
  prelims2026PublicProofFeedLocalStorageKey,
  type Prelims2026PublicProofFeed,
} from "@/lib/upsc/prelims2026PublicProofFeed";
import {
  prelims2026ShowcaseRequirementTracker as requirementTracker,
  prelims2026ShowcaseWebsiteCopyBlocks as websiteCopyBlocks,
  prelims2026ShowcaseWebsiteIntegrationMap as websiteIntegrationMap,
} from "@/lib/upsc/prelims2026ShowcasePublicContract";

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

type ProofFeedPreviewState = {
  status: "loading" | "ready" | "error";
  mode: string;
  claimCount: number;
  message: string;
  feed: Prelims2026PublicProofFeed | null;
};

type ShowcaseManifestPreview = {
  version: string;
  generatedAt: string;
  publicRoute: string;
  dashboardRoute: string;
  strategyRoute: string;
  reviewCommandRoute: string;
  proofPolicy: string;
  audit: {
    corrected: {
      direct: number;
      partial: number;
      misses: number;
      dropped: number;
      scorableQuestions: number;
      preparedQuestions: number;
      effectiveCoveragePercent: number;
    };
    sourceLead: {
      directTextLeads: number;
      conceptualLeads: number;
      totalQuestions: number;
      interpretation: string;
    };
  };
  questionLedger: {
    totalQuestions: number;
    completeQuestionCards: number;
    optionSets: number;
    statementCoverageRows: number;
    multiStatementQuestions: number;
    directTextLeadCards: number;
    conceptualLeadCards: number;
    noIndexedLeadCards: number;
    proofLocked: boolean;
    publicAnchor: string;
  };
  website: {
    copyBlocks: unknown[];
    integrationMap: unknown[];
    requirements: unknown[];
  };
  strategy: {
    priorityCount: number;
    taskCount: number;
    practiceBlueprintCount: number;
    formatRuleCount: number;
    phaseCounts: Record<string, number>;
    tracks: unknown[];
  };
  api: {
    reviewCommand: string;
    releaseDecision: string;
    mainSiteHandoff: string;
    manifest: string;
    matchAccountability: string;
    questionLedger: string;
    proofFeed: string;
    courseAction: string;
    sourceArchiveSummary: string;
    buildReadiness: string;
  };
};

type ManifestPreviewState = {
  status: "loading" | "ready" | "error";
  message: string;
  manifest: ShowcaseManifestPreview | null;
};

type QuestionLedgerApiQuestion = {
  number: number;
  subject: string;
  difficulty: string;
  nature: string;
  answer: string;
  status: "direct" | "partial" | "none";
  statusLabel: string;
  sourceLead: string;
  proofLocked: boolean;
  question: {
    stem: string;
    statements: string[];
    instruction: string;
    options: Array<{
      letter: string;
      text: string;
    }>;
  };
  match: {
    coveredSignals: string[];
    formatLabel: string;
    trapStyle: string;
    whyAsked: string;
    depthTest: string;
    matchScope: string;
    conceptLead: string;
    researchNote: string;
    nextAction: string;
    statementCoverage: Array<{
      label: string;
      text: string;
      coverage: "source-signal" | "concept-signal" | "manual-check";
      coverageLabel: string;
      matchedSignals: string[];
    }>;
  };
};

type QuestionLedgerApiPreview = {
  version: string;
  publicAnchor: string;
  proofPolicy: string;
  sourceLeadLedger: {
    directTextLeads: number;
    conceptualLeads: number;
    noIndexedLeads: number;
    totalQuestions: number;
  };
  summary: {
    totalQuestions: number;
    completeQuestionCards: number;
    optionSets: number;
    statementCoverageRows: number;
    sourceSignalRows: number;
    conceptSignalRows: number;
    manualCheckRows: number;
    multiStatementQuestions: number;
    subjects: Array<{ subject: string; count: number }>;
  };
  questions: QuestionLedgerApiQuestion[];
};

type QuestionLedgerPreviewState = {
  status: "loading" | "ready" | "error";
  message: string;
  ledger: QuestionLedgerApiPreview | null;
};

type MatchAccountabilityQuestion = {
  number: number;
  subject: string;
  difficulty: string;
  nature: string;
  status: "direct" | "partial" | "none";
  statusLabel: string;
  answer: string;
  proofLocked: boolean;
  question: {
    stem: string;
    statements: string[];
    instruction: string;
    options: Array<{
      letter: string;
      text: string;
    }>;
  };
  match: {
    sourceLead: string;
    formatLabel: string;
    trapStyle: string;
    matchScope: string;
    highestMatchedPortion: string;
    matchedPortionLabels: string[];
    manualCheckPortionLabels: string[];
    coverageScorePercent: number;
    coveredSignals: string[];
    nextProofAction: string;
    researchNote: string;
    portionCoverage: Array<{
      label: string;
      text: string;
      coverage: "source-signal" | "concept-signal" | "manual-check";
      coverageLabel: string;
      matchedSignals: string[];
    }>;
  };
};

type MatchAccountabilityPreview = {
  version: string;
  publicAnchor: string;
  strategyAnchor: string;
  proofPolicy: string;
  summary: {
    totalQuestions: number;
    completeQuestionCards: number;
    optionSets: number;
    portionRows: number;
    matchedPortionRows: number;
    sourceSignalRows: number;
    conceptSignalRows: number;
    manualCheckRows: number;
    fullyMatchedQuestions: number;
    partialMatchQuestions: number;
    manualOnlyQuestions: number;
    highlightedQuestions: number;
    proofLockedQuestions: number;
    directTextLeads: number;
    conceptualLeads: number;
    noIndexedLeads: number;
  };
  questions: MatchAccountabilityQuestion[];
  api: {
    releaseDecision: string;
    matchAccountability: string;
    questionLedger: string;
    proofFeed: string;
    manifest: string;
  };
};

type MatchAccountabilityState = {
  status: "loading" | "ready" | "error";
  message: string;
  accountability: MatchAccountabilityPreview | null;
};

type CourseActionApiPreview = {
  version: string;
  strategyRoute: string;
  publicAnchor: string;
  proofPolicy: string;
  summary: {
    priorityCount: number;
    criticalPriorityCount: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
    minimalPriorityCount: number;
    taskCount: number;
    sprintCount: number;
    practiceBlueprintCount: number;
    formatRuleCount: number;
    reallocationDecisionCount: number;
    evidenceLedgerCount: number;
    launchStepCount: number;
    phaseCounts: Record<string, number>;
  };
  priorities: Array<{
    id: string;
    subject: string;
    priority: string;
    window: string;
    ownerSurface: string;
    action: string;
    taskCount: number;
    blueprintCount: number;
    proofStatus: string;
    releaseGate: string;
    nextProofAction: string;
  }>;
  api: {
    reviewCommand: string;
    manifest: string;
    questionLedger: string;
    proofFeed: string;
    courseAction: string;
  };
};

type CourseActionPreviewState = {
  status: "loading" | "ready" | "error";
  message: string;
  courseAction: CourseActionApiPreview | null;
};

type SourceArchiveSummaryPreview = {
  version: string;
  sourceLabel: string;
  publicAnchor: string;
  internalIntakeRoute: string;
  proofPolicy: string;
  scan: {
    ok: boolean;
    rootConnected: boolean;
    totalFiles: number;
    totalDirectories: number;
    totalBytes: number;
    pdfCount: number;
    docxCount: number;
    imageCount: number;
    extensionTypeCount: number;
    folderBucketCount: number;
    trackCount: number;
    strongestTrackId: string;
    strongestTrackLabel: string;
    message: string;
  };
  extensions: Array<{
    extension: string;
    count: number;
  }>;
  topFolders: Array<{
    name: string;
    fileCount: number;
  }>;
  tracks: Array<{
    id: string;
    label: string;
    decision: string;
    hitCount: number;
    sampleCount: number;
    nextAction: string;
  }>;
  api: {
    sourceArchiveSummary: string;
  };
};

type SourceArchiveSummaryState = {
  status: "loading" | "ready" | "error";
  message: string;
  summary: SourceArchiveSummaryPreview | null;
};

type BuildReadinessPreview = {
  version: string;
  status: string;
  publicRoute: string;
  strategyRoute: string;
  proofPolicy: string;
  summary: {
    requirementCount: number;
    completeCount: number;
    proofLockedCount: number;
    portalOwnedCount: number;
    websiteCopyBlockCount: number;
    integrationRowCount: number;
    originalTrackerCount: number;
    questionCount: number;
    completeQuestionCards: number;
    optionSetCount: number;
    statementCoverageRows: number;
    priorityCount: number;
    strategyTaskCount: number;
    practiceBlueprintCount: number;
    formatRuleCount: number;
    apiEndpointCount: number;
    verifierCount: number;
  };
  gates: Array<{
    id: string;
    label: string;
    status: string;
    rule: string;
  }>;
  requirements: Array<{
    id: string;
    label: string;
    status: string;
    publicAnchor: string;
    portalOwner: string;
    apiEvidence: string;
    verifier: string;
    proof: string;
  }>;
  api: {
    reviewCommand: string;
    releaseDecision: string;
    mainSiteHandoff: string;
    manifest: string;
    matchAccountability: string;
    questionLedger: string;
    proofFeed: string;
    courseAction: string;
    sourceArchiveSummary: string;
    buildReadiness: string;
  };
};

type BuildReadinessState = {
  status: "loading" | "ready" | "error";
  message: string;
  readiness: BuildReadinessPreview | null;
};

type ReleaseDecisionPreview = {
  version: string;
  status: string;
  publicRoute: string;
  publicAnchor: string;
  strategyRoute: string;
  strategyAnchor: string;
  proofPolicy: string;
  decision: {
    headline: string;
    publicStatus: string;
    allowedNow: string[];
    proofLocked: string[];
    internalOnly: string[];
  };
  summary: {
    effectiveCoveragePercent: number;
    preparedQuestions: number;
    scorableQuestions: number;
    correctedDirect: number;
    correctedPartial: number;
    correctedMisses: number;
    correctedDropped: number;
    completeQuestionCards: number;
    proofLockedQuestionCount: number;
    releasedClaimCount: number;
    sourceArchiveFileCount: number;
    sourceArchivePdfCount: number;
    sourceArchiveTrackCount: number;
    strategyPriorityCount: number;
    strategyTaskCount: number;
    practiceBlueprintCount: number;
    apiEndpointCount: number;
  };
  gates: Array<{
    id: string;
    title: string;
    status: string;
    metric: string;
    evidence: string;
    publicAction: string;
    softwareOwner: string;
  }>;
  api: {
    reviewCommand: string;
    releaseDecision: string;
    mainSiteHandoff: string;
    manifest: string;
    matchAccountability: string;
    questionLedger: string;
    proofFeed: string;
    courseAction: string;
    sourceArchiveSummary: string;
    buildReadiness: string;
  };
};

type ReleaseDecisionState = {
  status: "loading" | "ready" | "error";
  message: string;
  decision: ReleaseDecisionPreview | null;
};

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

const auditLedgerComparison = [
  {
    title: "Automated source-lead ledger",
    metric: "37 direct / 63 conceptual",
    purpose: "Used for discovery: which archive chunks, terms and source leads may support each UPSC question.",
    publicUse: "Show as candidate evidence only. It should not be marketed as final accuracy.",
    nextStep: "Teacher verifies exact page/source proof before accepting a question-level claim.",
    tone: theme.amber,
  },
  {
    title: "Corrected final PDF audit",
    metric: "44 direct / 30 partial / 23 misses",
    purpose: "Used for public interpretation: the final human research conclusion after correcting Economy and dropped questions.",
    publicUse: "This is the main website number: 74 of 97 scorable questions, or 76% effective coverage.",
    nextStep: "Use it for the showcase headline while keeping the expanded MCQ ledger proof-locked.",
    tone: theme.leaf,
  },
];

const questionFormatData = [
  { name: "3+ statements", value: 67, color: theme.leaf },
  { name: "2 statements", value: 8, color: theme.blue },
  { name: "No explicit list", value: 25, color: theme.coral },
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

const fifteenYearSubjectTrendData = [
  { subject: "History + Culture", early: 16, middle: 15, recent: 21, color: theme.amber },
  { subject: "Polity + Governance", early: 13, middle: 14, recent: 12, color: theme.plum },
  { subject: "Economy", early: 14, middle: 17, recent: 18, color: theme.blue },
  { subject: "Geography", early: 16, middle: 14, recent: 11, color: theme.teal },
  { subject: "Environment", early: 15, middle: 20, recent: 13, color: theme.leaf },
  { subject: "Science + Tech", early: 10, middle: 13, recent: 16, color: "#6f42c1" },
  { subject: "IR + Bodies", early: 3, middle: 5, recent: 8, color: theme.coral },
  { subject: "Current Affairs", early: 12, middle: 15, recent: 18, color: "#607d8b" },
];

const fifteenYearTrendRows = [
  {
    area: "Ancient History",
    early: "Sources, chronology, Buddhism-Jainism and basic civilisation facts.",
    middle: "More selective, usually linked with culture, texts and archaeology.",
    recent: "Analytical return: sources, Pali-Prakrit, Vedic/Jain ideas, settlement and art links.",
    action: "Build source-text and statement-trap MCQs instead of only timeline recall.",
  },
  {
    area: "Medieval History",
    early: "Dynasties, Sultanate-Mughal administration and Bhakti-Sufi basics.",
    middle: "Lower direct weight, mostly culture and architecture-linked.",
    recent: "Still selective, but culture synthesis and regional-art clues remain useful.",
    action: "Keep compact revision, then convert into culture, feature and comparison drills.",
  },
  {
    area: "Modern History",
    early: "National movement, reform movements, constitutional acts and personalities.",
    middle: "Continued weight with more movement-method and policy-effect questions.",
    recent: "Forward Bloc, commissions, annexation, peasant and constitutional logic returned.",
    action: "Push motive, sequence, actor, consequence and British-response MCQs.",
  },
  {
    area: "Art and Culture",
    early: "Classical art, architecture, literature and religious traditions.",
    middle: "Temple, cave, painting, music and Buddhism-linked questions became prominent.",
    recent: "Visual identification, school comparison and heritage-current linkage matter more.",
    action: "Add image-led culture cards, map anchors and one-image three-statement questions.",
  },
  {
    area: "Polity and Governance",
    early: "Constitutional articles, Parliament, judiciary, bodies and basics.",
    middle: "Institutional process, rights, governance schemes and accountability.",
    recent: "Procedure, social justice, disability rights, committees and new criminal laws.",
    action: "Move beyond article recall into caselet, process, exception and rights drills.",
  },
  {
    area: "International Relations",
    early: "Low direct share; mostly current-affairs fact support.",
    middle: "International bodies, conventions and bilateral events became selective traps.",
    recent: "Bodies, groupings, strategic geography, routes and places in news are rising.",
    action: "Build a separate IR-body, treaty, map-route and grouping tracker.",
  },
  {
    area: "Geography",
    early: "Physical geography, Indian geography, resources, agriculture and maps.",
    middle: "Map plus environment/disaster overlap grew; Indian geography stayed useful.",
    recent: "Count is lower, but questions are sharper: ports, straits, rivers, islands, resources.",
    action: "Shift to map intelligence: straits, lakes, ports, geoparks, corridors and borders.",
  },
  {
    area: "Environment",
    early: "Ecology basics, biodiversity, climate and protected areas rose steadily.",
    middle: "Peak phase: species, conventions, pollution, protected areas and ecology traps.",
    recent: "Still important, but embedded with agriculture, reports, policy and current affairs.",
    action: "Use species-policy-report trackers with exact source date and habitat map proof.",
  },
  {
    area: "Economy",
    early: "Macro, fiscal, banking, inflation, planning and core development basics.",
    middle: "Financial inclusion, schemes, sectoral economy and RBI tools became regular.",
    recent: "Digital finance, CBDC, tokenisation, bonds, poverty index and data triggers.",
    action: "Turn every graph and policy update into data, instrument and elimination MCQs.",
  },
  {
    area: "Science and Technology",
    early: "Basic biology, space, health, energy and everyday science.",
    middle: "Space, biotech, defence, materials, health and cyber appeared selectively.",
    recent: "AI, quantum, genetics, drones, deep ocean, hydrogen and defence tech expanded.",
    action: "Create live applied-tech explainers with use, limitation, risk and governance angle.",
  },
  {
    area: "Current Affairs",
    early: "More direct fact recall and monthly-event testing.",
    middle: "Static-current fusion became normal across Economy, Environment and Polity.",
    recent: "Current is embedded inside almost every subject rather than standing alone.",
    action: "Attach each current note to syllabus node, map, report, institution and trap format.",
  },
  {
    area: "Schemes, Society and Social Justice",
    early: "Welfare schemes, poverty, education, health and vulnerable sections.",
    middle: "Delivery, governance, DBT, indicators and rights-based approach grew.",
    recent: "Policy implementation, committees, disabilities, gender and data interpretation.",
    action: "Build scheme-to-rights-to-outcome caselets with report-backed answer logic.",
  },
];

const fifteenYearTakeaways = [
  {
    label: "2012-2016",
    title: "Foundation-heavy phase",
    detail: "History, Geography, Economy and Polity could still reward strong static base plus conventional current affairs.",
    tone: theme.amber,
  },
  {
    label: "2017-2021",
    title: "Environment and current fusion",
    detail: "Environment, schemes, reports, conventions and static-current linkage became a larger part of the prelims game.",
    tone: theme.leaf,
  },
  {
    label: "2022-2026",
    title: "Applied reasoning phase",
    detail: "The paper now asks through maps, data, bodies, technologies, reports, exceptions and multi-statement elimination.",
    tone: theme.blue,
  },
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
    label: "Geography archive",
    value: "400+ MCQs",
    detail: "The visible 400-question Geography layer is only one archive block; the Geography command room also has 30 daily MCQ batch slots.",
    icon: Map,
  },
  {
    label: "All-subject MCQ engine",
    value: "201 batch slots",
    detail: "Geography, Environment, Economy, S&T, Polity, History, Security and Disaster Management together create 5,025 planned MCQ authoring slots at the default batch size.",
    icon: ClipboardCheck,
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
    signal: "67 questions used 3+ statements",
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
    metric: "75/100",
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

const publicStrategyTracks = prelims2027Priorities.map((priority) => {
  const evidence = strategyEvidenceLedger.find((entry) => entry.priorityId === priority.id);
  const tasks = strategyExecutionTasks.filter((task) => task.priorityId === priority.id);
  const proofTasks = tasks.filter((task) => task.phase === "Source" || task.phase === "Proof");
  const blueprints = strategyPracticeBlueprints.filter((blueprint) => blueprint.priorityId === priority.id);
  const proofStatus = evidence?.proofStatus ?? "Needs page proof";
  const publicStatus =
    proofStatus === "Claim ready"
      ? "Public proof ready"
      : proofStatus === "Internal only"
        ? "Internal planning"
        : proofStatus;

  return {
    ...priority,
    evidenceEntry: evidence,
    priorityEvidence: priority.evidence,
    taskCount: tasks.length,
    proofTaskCount: proofTasks.length,
    blueprintCount: blueprints.length,
    publicStatus,
  };
});

const surpriseActionRows = prelims2027Priorities.map((priority) => {
  const evidence = strategyEvidenceLedger.find((entry) => entry.priorityId === priority.id);
  const reallocation = strategyReallocationPlan.find((entry) => entry.priorityId === priority.id);
  const tasks = strategyExecutionTasks.filter((task) => task.priorityId === priority.id);
  const sourceTasks = tasks.filter((task) => task.phase === "Source");
  const mcqTasks = tasks.filter((task) => task.phase === "MCQ");

  return {
    id: priority.id,
    subject: priority.subject,
    priority: priority.priority,
    window: priority.window,
    examSurprise: evidence?.examSurprise ?? priority.evidence,
    untappedDomain: evidence?.coverageRead ?? priority.evidence,
    softwareDecision: evidence?.softwareDecision ?? priority.action,
    nextProofAction: evidence?.nextProofAction ?? "Attach proof action before public release.",
    sourceStandard: evidence?.sourceStandard ?? reallocation?.sourceShift ?? "Source standard pending.",
    publicClaimRule: evidence?.publicClaimRule ?? reallocation?.releaseGate ?? "Keep proof-locked until validation.",
    reallocationDecision: reallocation?.decision ?? "Patch and tag",
    sourceTaskCount: sourceTasks.length,
    mcqTaskCount: mcqTasks.length,
    taskCount: tasks.length,
    route: evidence?.route ?? priority.targetRoute,
  };
});

const surpriseActionSummary = [
  {
    label: "Build-from-scratch zones",
    value: String(surpriseActionRows.filter((row) => row.reallocationDecision === "Build from scratch").length),
    detail: "IR bodies and new-domain S&T need fresh source packs before normal current-affairs expansion.",
    tone: theme.coral,
  },
  {
    label: "Proof/source tasks",
    value: String(surpriseActionRows.reduce((total, row) => total + row.sourceTaskCount, 0)),
    detail: "The software path begins with source rows, not public claims.",
    tone: theme.leaf,
  },
  {
    label: "MCQ rebuild lanes",
    value: String(surpriseActionRows.reduce((total, row) => total + row.mcqTaskCount, 0)),
    detail: "Each surprise becomes practice: match-pair, how-many-correct, caselet or applied traps.",
    tone: theme.blue,
  },
  {
    label: "Public proof rule",
    value: "Locked",
    detail: "The page can explain surprise and direction now; question-level hit claims wait for approved packets.",
    tone: theme.amber,
  },
];

const publicReleaseSummary = [
  {
    label: "Can show publicly now",
    value: "Corrected 76%",
    detail: "Use as the research outcome: 74 of 97 scorable questions had direct or partial preparation advantage.",
    tone: theme.leaf,
  },
  {
    label: "Show as proof-locked",
    value: "100 MCQs",
    detail: "Question-wise matches stay as candidate evidence until exact source/page proof is retained.",
    tone: theme.amber,
  },
  {
    label: "Keep internal",
    value: "Build logic",
    detail: "Source-pack gaps, Medieval reallocation and pending proof tasks should guide the portal, not marketing copy.",
    tone: theme.coral,
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
    title: "Prelims Review Command",
    route: "/upsc/prelims-review-command",
    status: "Started",
    detail: "Single operator board joining the 2026 audit, main-site release gate, source proof queue and 2027 action lanes.",
  },
  {
    title: "Evidence Ledger",
    route: "/upsc/prelims-2027-strategy#prelims-2027-evidence-ledger",
    status: "Started",
    detail: "Question-wise proof board plus 2027 source standard, public-claim rule and next proof action.",
  },
  {
    title: "Source Archive Intake",
    route: "/upsc/source-library#upsc-morning-batch-archive-intake",
    status: "Started",
    detail: "Internal scan of the Morning Batch content archive so proof packets and 2027 rebuild tracks can point back to actual course files.",
  },
  {
    title: "Question Proof Queue",
    route: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
    status: "Started",
    detail: "Operator review state for each 2026 MCQ match before any exact public claim is unlocked.",
  },
  {
    title: "Website Publish Packet",
    route: "/upsc/prelims-2027-strategy#prelims-2026-website-publish-packet",
    status: "Started",
    detail: "One copy-ready website block combining corrected audit language and released MCQ proof claims.",
  },
  {
    title: "Public Proof Feed",
    route: "/upsc/prelims-2027-strategy#prelims-2026-public-proof-feed",
    status: "Started",
    detail: "Structured JSON export and API publish boundary for released MCQ claims with full question text, matched portions and retained proof references.",
  },
  {
    title: "Public Claim Release Board",
    route: "/upsc/prelims-2027-strategy#prelims-2026-public-claim-release-board",
    status: "Started",
    detail: "Copy-ready website claims generated only from approved MCQs with complete proof packets.",
  },
  {
    title: "Gap Radar",
    route: "/upsc/prelims-2027-strategy#gap-radar",
    status: "Started",
    detail: "Tag every weakness as content, format, current bridge, map, source depth or revision gap.",
  },
  {
    title: "2027 Build Planner",
    route: "/upsc/prelims-2027-strategy#prelims-2027-sprint-calendar",
    status: "Started",
    detail: "Convert the PDF priority matrix into monthly work: IR, S&T domains, legal current and map intelligence.",
  },
  {
    title: "2027 Reallocation Board",
    route: "/upsc/prelims-2027-strategy#prelims-2027-reallocation-board",
    status: "Started",
    detail: "Show exactly what shifts for 2027: build from scratch, depth upgrade, patch, maintain or reduce.",
  },
  {
    title: "2027 Course Correction Packet",
    route: "/upsc/prelims-2027-strategy#prelims-2027-course-correction-packet",
    status: "Started",
    detail: "Copy-ready internal plan for changing course hours, source depth, MCQ targets and public claim boundaries after the 2026 audit.",
  },
  {
    title: "Format Rebuilder",
    route: "/upsc/prelims-2027-strategy#gap-radar",
    status: "Started",
    detail: "Transform old recall MCQs into multi-statement, how-many-correct, pair, A-R, NOT and caselet formats.",
  },
  {
    title: "Student Readiness Simulator",
    route: "/upsc/prelims-2027-strategy#simulator",
    status: "Started",
    detail: "Student selects completed modules; software returns advantage, exposed topics and 2027 risk score.",
  },
  {
    title: "2027 Practice Engine",
    route: "/upsc/question-bank",
    status: "Started",
    detail: "Strategy blueprints can generate practice handoffs, lock into MCQ Command and become student-solvable.",
  },
  {
    title: "Blueprint Delivery Dashboard",
    route: "/upsc/prelims-2027-strategy#prelims-2027-delivery-dashboard",
    status: "Started",
    detail: "Track every recommendation from queued blueprint to generated set, MCQ lock and student attempt.",
  },
];

const publicFormatRebuildRules = strategyFormatRebuildRules.map((rule) => ({
  format: rule.format,
  target: `${rule.targetPercent}%`,
  reason: rule.reason,
}));

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

function formatArchiveBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
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

function integrationStatusClass(status: string) {
  if (status === "Public safe") return "border-[#1b6b4a] bg-[#e2f5ea] text-[#125239]";
  if (status === "Proof locked") return "border-[#d8891c] bg-[#fff3dd] text-[#7b4d0d]";
  if (status === "Build queue") return "border-[#276fbf] bg-[#eef6ff] text-[#1f5d8f]";
  return "border-[#805ad5] bg-[#f2ecff] text-[#5b3aa5]";
}

function MainWebsiteIntegrationMap() {
  return (
    <section
      id="main-website-integration-map"
      data-testid="showcase-integration-map"
      className="border-b border-[#cbd8ce] bg-[#f8fbf7]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Main website integration"
          title="Every public block now has a software owner and proof gate."
          body="This map is the handoff plan for the main website: what visitors can see, which dashboard route owns the evidence, and which claim status controls the copy."
          icon={Route}
        />

        <div className="mt-8 grid gap-4">
          {websiteIntegrationMap.map((item, index) => (
            <article
              key={item.title}
              data-testid="showcase-integration-row"
              data-public-anchor={item.publicAnchor}
              data-dashboard-route={item.dashboardRoute}
              data-proof-status={item.proofStatus}
              className="grid gap-4 rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm lg:grid-cols-[0.7fr_1fr_0.85fr] lg:items-start"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#12251d] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${integrationStatusClass(
                      item.proofStatus
                    )}`}
                  >
                    {item.proofStatus}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-black tracking-tight text-[#12251d]">{item.title}</h3>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-[#6f7e75]">{item.proofOwner}</p>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold leading-6 text-[#53645b]">{item.publicUse}</p>
                <p className="mt-3 rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3 text-sm font-bold leading-6 text-[#34483d]">
                  {item.handoff}
                </p>
              </div>

              <div className="grid min-w-0 gap-3">
                <div className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">Public anchor</p>
                  <p className="mt-1 break-words text-sm font-black text-[#12251d]">{item.publicAnchor}</p>
                </div>
                <div className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">Portal owner</p>
                  <p className="mt-1 break-words text-sm font-black text-[#12251d]">{item.dashboardRoute}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={item.publicAnchor}
                    className="inline-flex min-h-10 items-center rounded-md border border-[#1b6b4a]/35 bg-[#eef6f1] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-white"
                  >
                    Public section
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={item.dashboardRoute}
                    className="inline-flex min-h-10 items-center rounded-md border border-[#d8891c]/45 bg-[#fffaf1] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#7b4d0d] transition hover:bg-white"
                  >
                    Portal owner
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PublicWebsiteCopyKit() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyBlock = async (id: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section id="website-copy-kit" data-testid="showcase-website-copy-kit" className="border-y border-[#cbd8ce] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Website copy kit"
          title="Public-safe blocks you can paste into the main website."
          body="These blocks remove internal planning language and keep proof discipline intact: the public page can talk about the corrected audit, while exact question-wise claims stay proof-locked."
          icon={Clipboard}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {websiteCopyBlocks.map((block) => (
            <article
              key={block.id}
              data-testid="showcase-copy-block"
              data-copy-id={block.id}
              className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">{block.label}</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-[#12251d]">{block.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => void copyBlock(block.id, block.body)}
                  className="inline-flex min-h-10 items-center rounded-md border border-[#1b6b4a]/35 bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-[#eef6f1]"
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  {copiedId === block.id ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[#d8e4db] bg-white p-4 text-sm font-semibold leading-6 text-[#364b40]">
                {block.body}
              </pre>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MainWebsiteManifestContract() {
  const [preview, setPreview] = useState<ManifestPreviewState>({
    status: "loading",
    message: "Reading public manifest endpoint.",
    manifest: null,
  });
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/upsc/prelims-2026/showcase-manifest", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as ShowcaseManifestPreview;
        if (!response.ok) {
          throw new Error("Showcase manifest endpoint is unavailable.");
        }

        setPreview({
          status: "ready",
          message: "Manifest endpoint is live for main website integration.",
          manifest: payload,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setPreview({
          status: "error",
          message: error instanceof Error ? error.message : "Showcase manifest endpoint is unavailable.",
          manifest: null,
        });
      });

    return () => controller.abort();
  }, []);

  const manifest = preview.manifest;
  const endpoint = manifest?.api.manifest ?? "/api/upsc/prelims-2026/showcase-manifest";
  const corrected = manifest?.audit.corrected;
  const sourceLead = manifest?.audit.sourceLead;
  const questionLedger = manifest?.questionLedger;
  const strategy = manifest?.strategy;

  const copyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopiedEndpoint(true);
      window.setTimeout(() => setCopiedEndpoint(false), 1800);
    } catch {
      setCopiedEndpoint(false);
    }
  };

  const contractRows = [
    ["Review command endpoint", manifest?.api.reviewCommand ?? "/api/upsc/prelims-2026/review-command"],
    ["Release-decision endpoint", manifest?.api.releaseDecision ?? "/api/upsc/prelims-2026/release-decision"],
    ["Main-site handoff endpoint", manifest?.api.mainSiteHandoff ?? "/api/upsc/prelims-2026/main-site-handoff"],
    ["Manifest endpoint", endpoint],
    ["Match-accountability endpoint", manifest?.api.matchAccountability ?? "/api/upsc/prelims-2026/match-accountability"],
    ["Question ledger endpoint", manifest?.api.questionLedger ?? "/api/upsc/prelims-2026/question-ledger"],
    ["Proof feed endpoint", manifest?.api.proofFeed ?? "/api/upsc/prelims-2026/public-proof-feed"],
    ["2027 course action endpoint", manifest?.api.courseAction ?? "/api/upsc/prelims-2027/course-action"],
    ["Source archive summary endpoint", manifest?.api.sourceArchiveSummary ?? "/api/upsc/prelims-2026/source-archive-summary"],
    ["Build readiness endpoint", manifest?.api.buildReadiness ?? "/api/upsc/prelims-2026/build-readiness"],
    ["Public page", manifest?.publicRoute ?? "/upsc-prelims-2026-showcase"],
    ["Review command", manifest?.reviewCommandRoute ?? "/upsc/prelims-review-command"],
    ["Portal route", manifest?.strategyRoute ?? "/upsc/prelims-2027-strategy"],
  ];

  const metricRows = [
    {
      label: "Corrected audit",
      value: corrected ? `${corrected.effectiveCoveragePercent}%` : "Checking",
      detail: corrected
        ? `${corrected.direct} direct, ${corrected.partial} partial, ${corrected.misses} misses, ${corrected.dropped} dropped.`
        : "Waiting for final audit counts.",
      tone: theme.leaf,
    },
    {
      label: "Source lead ledger",
      value: sourceLead ? `${sourceLead.directTextLeads}/${sourceLead.conceptualLeads}` : "Checking",
      detail: sourceLead
        ? `${sourceLead.directTextLeads} direct text leads and ${sourceLead.conceptualLeads} conceptual leads across ${sourceLead.totalQuestions} questions.`
        : "Waiting for source-lead split.",
      tone: theme.amber,
    },
    {
      label: "Question proof UI",
      value: questionLedger ? String(questionLedger.completeQuestionCards) : "Checking",
      detail: questionLedger
        ? `${questionLedger.statementCoverageRows} statement rows, ${questionLedger.multiStatementQuestions} multi-statement questions, proof locked.`
        : "Waiting for question-ledger counts.",
      tone: theme.blue,
    },
    {
      label: "2027 software tasks",
      value: strategy ? String(strategy.taskCount) : "Checking",
      detail: strategy
        ? `${strategy.priorityCount} priorities, ${strategy.practiceBlueprintCount} practice blueprints, ${strategy.formatRuleCount} format rules.`
        : "Waiting for strategy counts.",
      tone: theme.plum,
    },
  ];

  const phaseSummary = strategy
    ? ["Source", "Capsule", "MCQ", "Proof", "Release", "Planner"]
        .map((phase) => `${phase}: ${strategy.phaseCounts[phase] ?? 0}`)
        .join(" / ")
    : "Phase counts loading";

  return (
    <section
      id="main-website-manifest-contract"
      data-testid="showcase-manifest-contract"
      data-api-status={preview.status}
      data-version={manifest?.version ?? "loading"}
      data-review-command-endpoint={manifest?.api.reviewCommand ?? "/api/upsc/prelims-2026/review-command"}
      data-release-decision-endpoint={manifest?.api.releaseDecision ?? "/api/upsc/prelims-2026/release-decision"}
      data-main-site-handoff-endpoint={manifest?.api.mainSiteHandoff ?? "/api/upsc/prelims-2026/main-site-handoff"}
      data-match-accountability-endpoint={manifest?.api.matchAccountability ?? "/api/upsc/prelims-2026/match-accountability"}
      data-question-ledger-endpoint={manifest?.api.questionLedger ?? "/api/upsc/prelims-2026/question-ledger"}
      data-course-action-endpoint={manifest?.api.courseAction ?? "/api/upsc/prelims-2027/course-action"}
      data-source-archive-summary-endpoint={
        manifest?.api.sourceArchiveSummary ?? "/api/upsc/prelims-2026/source-archive-summary"
      }
      data-build-readiness-endpoint={manifest?.api.buildReadiness ?? "/api/upsc/prelims-2026/build-readiness"}
      data-effective-coverage={corrected?.effectiveCoveragePercent ?? 0}
      data-corrected-direct={corrected?.direct ?? 0}
      data-corrected-partial={corrected?.partial ?? 0}
      data-corrected-misses={corrected?.misses ?? 0}
      data-corrected-dropped={corrected?.dropped ?? 0}
      data-source-direct={sourceLead?.directTextLeads ?? 0}
      data-source-conceptual={sourceLead?.conceptualLeads ?? 0}
      data-question-count={questionLedger?.completeQuestionCards ?? 0}
      data-statement-coverage-rows={questionLedger?.statementCoverageRows ?? 0}
      data-strategy-task-count={strategy?.taskCount ?? 0}
      data-phase-source={strategy?.phaseCounts.Source ?? 0}
      data-phase-capsule={strategy?.phaseCounts.Capsule ?? 0}
      data-phase-mcq={strategy?.phaseCounts.MCQ ?? 0}
      data-phase-proof={strategy?.phaseCounts.Proof ?? 0}
      data-phase-release={strategy?.phaseCounts.Release ?? 0}
      data-phase-planner={strategy?.phaseCounts.Planner ?? 0}
      className="border-b border-[#cbd8ce] bg-[#f8fbf7]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Main website manifest"
          title="The public showcase now has a live API contract."
          body="Use this endpoint when the standalone page is connected to the main website. It carries the allowed public audit numbers, proof policy, website blocks, route map and software-action counts."
          icon={FileSearch}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3">
            {contractRows.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">{label}</p>
                <p className="mt-1 break-words text-base font-black text-[#12251d]">{value}</p>
              </div>
            ))}
            <button
              type="button"
              onClick={() => void copyEndpoint()}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1b6b4a]/35 bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-[#eef6f1]"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              {copiedEndpoint ? "Endpoint copied" : "Copy manifest endpoint"}
            </button>
          </div>

          <div className="grid gap-4">
            <div
              className={
                preview.status === "ready"
                  ? "rounded-lg border border-[#1b6b4a]/35 bg-[#eef6f1] p-4 text-sm font-bold leading-6 text-[#154f39]"
                  : preview.status === "error"
                    ? "rounded-lg border border-[#d95f43]/35 bg-[#fff0ec] p-4 text-sm font-bold leading-6 text-[#9d3824]"
                    : "rounded-lg border border-[#cbd8ce] bg-white p-4 text-sm font-bold leading-6 text-[#53645b]"
              }
            >
              {preview.message}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {metricRows.map((item) => (
                <div key={item.label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                  <p className="text-3xl font-black tracking-tight" style={{ color: item.tone }}>
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#6f7e75]">{item.label}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">Proof policy</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
                {manifest?.proofPolicy ??
                  "Use the corrected final audit for public summary. Keep question-level claims proof-locked until exact source, page and teacher validation are retained."}
              </p>
              <p className="mt-3 rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                {phaseSummary}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReleaseDecisionApiPreview() {
  const [preview, setPreview] = useState<ReleaseDecisionState>({
    status: "loading",
    message: "Reading release-decision endpoint.",
    decision: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/upsc/prelims-2026/release-decision", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as ReleaseDecisionPreview;
        if (!response.ok) {
          throw new Error("Release-decision endpoint is unavailable.");
        }

        setPreview({
          status: "ready",
          message: "Release-decision endpoint is live for main-site publish control.",
          decision: payload,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setPreview({
          status: "error",
          message: error instanceof Error ? error.message : "Release-decision endpoint is unavailable.",
          decision: null,
        });
      });

    return () => controller.abort();
  }, []);

  const decision = preview.decision;
  const summary = decision?.summary;
  const gates = decision?.gates ?? [];
  const decisionLists = [
    {
      label: "Publish now",
      rows: decision?.decision.allowedNow ?? [],
      tone: "border-[#1b6b4a] bg-[#e2f5ea] text-[#125239]",
    },
    {
      label: "Proof locked",
      rows: decision?.decision.proofLocked ?? [],
      tone: "border-[#d8891c] bg-[#fff3dd] text-[#7b4d0d]",
    },
    {
      label: "Internal only",
      rows: decision?.decision.internalOnly ?? [],
      tone: "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]",
    },
  ];

  return (
    <section
      id="release-decision"
      data-testid="showcase-release-decision-api-preview"
      data-api-status={preview.status}
      data-version={decision?.version ?? "loading"}
      data-release-status={decision?.status ?? "loading"}
      data-effective-coverage={summary?.effectiveCoveragePercent ?? 0}
      data-proof-locked-question-count={summary?.proofLockedQuestionCount ?? 0}
      data-released-claim-count={summary?.releasedClaimCount ?? 0}
      data-source-archive-file-count={summary?.sourceArchiveFileCount ?? 0}
      data-strategy-task-count={summary?.strategyTaskCount ?? 0}
      data-api-endpoint-count={summary?.apiEndpointCount ?? 0}
      data-gate-count={gates.length}
      className="border-b border-[#cbd8ce] bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Release decision API"
          title="This is the public-page publish control."
          body="The main website can read this contract before showing the page: what is public-safe today, what remains proof-locked, and which software route owns each next action."
          icon={ShieldCheck}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="grid gap-3">
            {[
              ["Endpoint", decision?.api.releaseDecision ?? "/api/upsc/prelims-2026/release-decision"],
              ["Review command API", decision?.api.reviewCommand ?? "/api/upsc/prelims-2026/review-command"],
              ["Status", decision?.decision.publicStatus ?? "Checking"],
              ["Coverage", summary ? `${summary.preparedQuestions}/${summary.scorableQuestions}` : "Checking"],
              ["Released claims", summary?.releasedClaimCount ?? 0],
              ["Proof-locked MCQs", summary?.proofLockedQuestionCount ?? 0],
              ["API endpoints", summary?.apiEndpointCount ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">{label}</p>
                <p className="mt-1 break-words text-base font-black text-[#12251d]">{value}</p>
              </div>
            ))}
            <div className="rounded-lg border border-[#d8891c]/35 bg-[#fffaf1] p-4 text-sm font-bold leading-6 text-[#6a4b26]">
              {decision?.proofPolicy ??
                "Publish the corrected audit and software path, while question-wise claims remain proof-locked."}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              {decisionLists.map((group) => (
                <article key={group.label} className={`rounded-lg border p-4 ${group.tone}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em]">{group.label}</p>
                  <div className="mt-3 grid gap-2">
                    {(group.rows.length ? group.rows : ["Waiting for release-decision API."]).map((row) => (
                      <p key={row} className="text-sm font-bold leading-6">
                        {row}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-3">
              {gates.map((gate) => (
                <article
                  key={gate.id}
                  data-testid="showcase-release-decision-gate"
                  data-gate-id={gate.id}
                  data-gate-status={gate.status}
                  className="grid gap-3 rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm lg:grid-cols-[0.75fr_1fr_0.9fr]"
                >
                  <div className="min-w-0">
                    <span className="rounded-md border border-[#1b6b4a]/30 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#154f39]">
                      {gate.status}
                    </span>
                    <h3 className="mt-3 text-base font-black tracking-tight text-[#12251d]">{gate.title}</h3>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#6f7e75]">{gate.metric}</p>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#53645b]">{gate.evidence}</p>
                  <div className="rounded-md border border-[#d8e4db] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">Software owner</p>
                    <p className="mt-1 break-words text-xs font-black leading-5 text-[#12251d]">{gate.softwareOwner}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#53645b]">{gate.publicAction}</p>
                  </div>
                </article>
              ))}
            </div>

            {preview.status === "error" ? (
              <div className="rounded-lg border border-[#d95f43]/40 bg-[#fff0ec] p-4 text-sm font-bold leading-6 text-[#9d3824]">
                {preview.message}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function BuildReadinessApiPreview() {
  const [preview, setPreview] = useState<BuildReadinessState>({
    status: "loading",
    message: "Reading build-readiness endpoint.",
    readiness: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/upsc/prelims-2026/build-readiness", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as BuildReadinessPreview;
        if (!response.ok) {
          throw new Error("Build-readiness endpoint is unavailable.");
        }

        setPreview({
          status: "ready",
          message: "Build-readiness endpoint is live for final integration review.",
          readiness: payload,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setPreview({
          status: "error",
          message: error instanceof Error ? error.message : "Build-readiness endpoint is unavailable.",
          readiness: null,
        });
      });

    return () => controller.abort();
  }, []);

  const readiness = preview.readiness;
  const summary = readiness?.summary;
  const requirements = readiness?.requirements ?? [];
  const gates = readiness?.gates ?? [];

  return (
    <section
      id="build-readiness"
      data-testid="showcase-build-readiness-api-preview"
      data-api-status={preview.status}
      data-version={readiness?.version ?? "loading"}
      data-build-status={readiness?.status ?? "loading"}
      data-requirement-count={summary?.requirementCount ?? 0}
      data-complete-count={summary?.completeCount ?? 0}
      data-proof-locked-count={summary?.proofLockedCount ?? 0}
      data-portal-owned-count={summary?.portalOwnedCount ?? 0}
      data-question-count={summary?.questionCount ?? 0}
      data-complete-question-cards={summary?.completeQuestionCards ?? 0}
      data-option-set-count={summary?.optionSetCount ?? 0}
      data-statement-coverage-rows={summary?.statementCoverageRows ?? 0}
      data-strategy-task-count={summary?.strategyTaskCount ?? 0}
      data-practice-blueprint-count={summary?.practiceBlueprintCount ?? 0}
      data-format-rule-count={summary?.formatRuleCount ?? 0}
      data-api-endpoint-count={summary?.apiEndpointCount ?? 0}
      data-verifier-count={summary?.verifierCount ?? 0}
      data-gate-count={gates.length}
      className="border-b border-[#cbd8ce] bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Build readiness API"
          title="The page now has a requirement-by-requirement integration ledger."
          body="Use this section as the final handoff checklist before connecting the standalone showcase to the main site: each deliverable has a public anchor, portal owner, API evidence and verifier."
          icon={ClipboardCheck}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="grid gap-3">
            {[
              ["Endpoint", readiness?.api.buildReadiness ?? "/api/upsc/prelims-2026/build-readiness"],
              ["Review command API", readiness?.api.reviewCommand ?? "/api/upsc/prelims-2026/review-command"],
              ["Release-decision API", readiness?.api.releaseDecision ?? "/api/upsc/prelims-2026/release-decision"],
              ["Main-site handoff API", readiness?.api.mainSiteHandoff ?? "/api/upsc/prelims-2026/main-site-handoff"],
              ["Match-accountability API", readiness?.api.matchAccountability ?? "/api/upsc/prelims-2026/match-accountability"],
              ["Public route", readiness?.publicRoute ?? "/upsc-prelims-2026-showcase"],
              ["Strategy owner", readiness?.strategyRoute ?? "/upsc/prelims-2027-strategy"],
              ["Status", readiness?.status ?? "checking"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">{label}</p>
                <p className="mt-1 break-words text-base font-black text-[#12251d]">{value}</p>
              </div>
            ))}
            <div
              className={
                preview.status === "ready"
                  ? "rounded-lg border border-[#1b6b4a]/35 bg-[#eef6f1] p-4 text-sm font-bold leading-6 text-[#154f39]"
                  : preview.status === "error"
                    ? "rounded-lg border border-[#d95f43]/35 bg-[#fff0ec] p-4 text-sm font-bold leading-6 text-[#9d3824]"
                    : "rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 text-sm font-bold leading-6 text-[#53645b]"
              }
            >
              {preview.message}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              {[
                {
                  label: "Requirements",
                  value: String(summary?.requirementCount ?? 0),
                  detail: `${summary?.completeCount ?? 0} complete / ${summary?.proofLockedCount ?? 0} proof locked`,
                  tone: theme.leaf,
                },
                {
                  label: "MCQ evidence",
                  value: String(summary?.completeQuestionCards ?? 0),
                  detail: `${summary?.statementCoverageRows ?? 0} statement rows`,
                  tone: theme.blue,
                },
                {
                  label: "2027 tasks",
                  value: String(summary?.strategyTaskCount ?? 0),
                  detail: `${summary?.practiceBlueprintCount ?? 0} blueprints / ${summary?.formatRuleCount ?? 0} format rules`,
                  tone: theme.plum,
                },
                {
                  label: "API and tests",
                  value: String(summary?.apiEndpointCount ?? 0),
                  detail: `${summary?.verifierCount ?? 0} verifier scripts`,
                  tone: theme.amber,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                  <p className="text-3xl font-black tracking-tight" style={{ color: item.tone }}>
                    {item.value}
                  </p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#6f7e75]">{item.label}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#cbd8ce] bg-[#fffaf1] p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b4d0d]">Integration proof policy</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#6a4b26]">
                {readiness?.proofPolicy ??
                  "The build is ready for website integration, but exact question-wise claims remain proof-locked until source, page and teacher validation are retained."}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {gates.map((gate) => (
                <article
                  key={`build-readiness-gate-${gate.id}`}
                  data-testid="showcase-build-readiness-gate"
                  data-gate-id={gate.id}
                  data-gate-status={gate.status}
                  className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1b6b4a]" />
                    <div>
                      <h3 className="text-base font-black text-[#12251d]">{gate.label}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{gate.rule}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] shadow-sm">
              <div className="hidden border-b border-[#d8e4db] text-[10px] font-black uppercase tracking-[0.12em] text-[#6f7e75] md:grid md:grid-cols-[0.9fr_0.5fr_0.95fr_0.95fr_0.95fr]">
                <div className="p-3">Deliverable</div>
                <div className="p-3">Status</div>
                <div className="p-3">Portal owner</div>
                <div className="p-3">API evidence</div>
                <div className="p-3">Verifier</div>
              </div>
              <div className="divide-y divide-[#d8e4db]">
                {requirements.map((requirement) => (
                  <div
                    key={`build-readiness-${requirement.id}`}
                    data-testid="showcase-build-readiness-requirement"
                    data-requirement-id={requirement.id}
                    data-status={requirement.status}
                    data-portal-owner={requirement.portalOwner}
                    data-api-evidence={requirement.apiEvidence}
                    data-verifier={requirement.verifier}
                    className="grid gap-3 p-4 md:grid-cols-[0.9fr_0.5fr_0.95fr_0.95fr_0.95fr] md:items-start"
                  >
                    <div>
                      <p className="text-sm font-black leading-6 text-[#12251d]">{requirement.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#53645b]">{requirement.proof}</p>
                      <Link
                        href={requirement.publicAnchor}
                        className="mt-2 inline-flex text-[10px] font-black uppercase tracking-[0.1em] text-[#1b6b4a] underline-offset-4 hover:underline"
                      >
                        Open public anchor
                      </Link>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#819087] md:hidden">Status</p>
                      <span
                        className={
                          requirement.status === "Complete"
                            ? "inline-flex rounded-md border border-[#1b6b4a] bg-[#e2f5ea] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#125239]"
                            : requirement.status === "Proof locked"
                              ? "inline-flex rounded-md border border-[#d8891c] bg-[#fff3dd] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#7b4d0d]"
                              : "inline-flex rounded-md border border-[#276fbf] bg-[#eef6ff] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1f5d8f]"
                        }
                      >
                        {requirement.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#819087] md:hidden">Portal owner</p>
                      <p className="break-words text-xs font-bold leading-5 text-[#31443a]">{requirement.portalOwner}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#819087] md:hidden">API evidence</p>
                      <p className="break-words text-xs font-bold leading-5 text-[#31443a]">{requirement.apiEvidence}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#819087] md:hidden">Verifier</p>
                      <p className="break-words text-xs font-bold leading-5 text-[#31443a]">{requirement.verifier}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuestionLedgerApiPreview() {
  const [preview, setPreview] = useState<QuestionLedgerPreviewState>({
    status: "loading",
    message: "Reading question-ledger endpoint.",
    ledger: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/upsc/prelims-2026/question-ledger", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as QuestionLedgerApiPreview;
        if (!response.ok) {
          throw new Error("Question ledger endpoint is unavailable.");
        }

        setPreview({
          status: "ready",
          message: "Question ledger endpoint is live with complete MCQ evidence cards.",
          ledger: payload,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setPreview({
          status: "error",
          message: error instanceof Error ? error.message : "Question ledger endpoint is unavailable.",
          ledger: null,
        });
      });

    return () => controller.abort();
  }, []);

  const ledger = preview.ledger;
  const summary = ledger?.summary;
  const sourceLead = ledger?.sourceLeadLedger;
  const previewQuestions = ledger?.questions.slice(0, 3) ?? [];

  return (
    <section
      id="main-website-question-ledger-preview"
      data-testid="showcase-question-ledger-api-preview"
      data-api-status={preview.status}
      data-version={ledger?.version ?? "loading"}
      data-question-count={summary?.completeQuestionCards ?? 0}
      data-option-set-count={summary?.optionSets ?? 0}
      data-statement-coverage-rows={summary?.statementCoverageRows ?? 0}
      data-source-signal-rows={summary?.sourceSignalRows ?? 0}
      data-concept-signal-rows={summary?.conceptSignalRows ?? 0}
      data-manual-check-rows={summary?.manualCheckRows ?? 0}
      data-multi-statement-count={summary?.multiStatementQuestions ?? 0}
      data-direct-text-leads={sourceLead?.directTextLeads ?? 0}
      data-conceptual-leads={sourceLead?.conceptualLeads ?? 0}
      data-preview-card-count={previewQuestions.length}
      className="border-b border-[#cbd8ce] bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Question ledger API preview"
          title="The main website can render complete MCQ evidence cards from JSON."
          body="This preview reads the public question-ledger endpoint. The endpoint carries every question stem, statement, option, answer, source lead, matched signal and proof-lock rule."
          icon={BookOpenCheck}
        />

        <div className="mt-8 grid gap-4 xl:grid-cols-[0.74fr_1.26fr]">
          <div className="grid gap-3">
            {[
              ["Endpoint", "/api/upsc/prelims-2026/question-ledger"],
              ["API status", preview.status],
              ["Question cards", summary?.completeQuestionCards ?? "Checking"],
              ["Statement rows", summary?.statementCoverageRows ?? "Checking"],
              ["Direct/conceptual", sourceLead ? `${sourceLead.directTextLeads}/${sourceLead.conceptualLeads}` : "Checking"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">{label}</p>
                <p className="mt-1 break-words text-base font-black text-[#12251d]">{value}</p>
              </div>
            ))}
            <div
              className={
                preview.status === "ready"
                  ? "rounded-lg border border-[#1b6b4a]/35 bg-[#eef6f1] p-4 text-sm font-bold leading-6 text-[#154f39]"
                  : preview.status === "error"
                    ? "rounded-lg border border-[#d95f43]/35 bg-[#fff0ec] p-4 text-sm font-bold leading-6 text-[#9d3824]"
                    : "rounded-lg border border-[#cbd8ce] bg-white p-4 text-sm font-bold leading-6 text-[#53645b]"
              }
            >
              {preview.message}
            </div>
            <Link
              href="/upsc-prelims-2026-showcase#question-ledger"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1b6b4a]/35 bg-white px-4 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-[#eef6f1]"
            >
              Open full public ledger
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3">
            {preview.status === "loading" ? (
              <div className="grid min-h-48 place-items-center rounded-lg border border-[#d8e4db] bg-[#f8fbf7] p-5 text-sm font-black uppercase tracking-[0.12em] text-[#53645b]">
                Reading question ledger
              </div>
            ) : previewQuestions.length ? (
              previewQuestions.map((question) => {
                const matchedSignals = question.match.statementCoverage.flatMap((coverage) => coverage.matchedSignals);

                return (
                  <article
                    key={`ledger-api-preview-${question.number}`}
                    data-testid="showcase-question-ledger-api-card"
                    data-question-number={question.number}
                    data-option-count={question.question.options.length}
                    data-statement-count={question.question.statements.length}
                    data-coverage-count={question.match.statementCoverage.length}
                    data-proof-locked={String(question.proofLocked)}
                    data-answer={question.answer}
                    className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#12251d] text-xs font-black text-white">
                        Q{question.number}
                      </span>
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${questionStatusTone[question.status]}`}>
                        {question.statusLabel}
                      </span>
                      <span className="rounded-md border border-[#d8891c]/35 bg-[#fffaf1] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#7b4d0d]">
                        Proof locked
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black tracking-tight text-[#12251d]">{question.subject}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                      <HighlightedText text={question.question.stem} signals={matchedSignals} />
                    </p>

                    {question.question.statements.length ? (
                      <div className="mt-3 grid gap-2">
                        {question.question.statements.map((statement, index) => {
                          const coverage = question.match.statementCoverage[index];

                          return (
                            <div
                              key={`${question.number}-ledger-api-statement-${index}`}
                              data-testid="showcase-question-ledger-api-statement"
                              className="rounded-md border border-[#d8e4db] bg-white p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f7e75]">
                                  {coverage?.label ?? `Statement ${index + 1}`}
                                </p>
                                {coverage ? (
                                  <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statementCoverageTone[coverage.coverage]}`}>
                                    {coverage.coverageLabel}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                                <HighlightedText text={statement} signals={coverage?.matchedSignals ?? []} />
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {question.question.instruction && question.question.instruction !== question.question.stem ? (
                      <div className="mt-3 rounded-md border border-[#d8e4db] bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f7e75]">Instruction</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">{question.question.instruction}</p>
                      </div>
                    ) : null}

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {question.question.options.map((option) => (
                        <div
                          key={`${question.number}-ledger-api-option-${option.letter}`}
                          data-testid="showcase-question-ledger-api-option"
                          className="flex gap-2 rounded-md border border-[#d8e4db] bg-white p-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#eef6f1] text-xs font-black text-[#154f39]">
                            {option.letter}
                          </span>
                          <p className="text-sm font-semibold leading-6 text-[#364b40]">{option.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <p className="rounded-md border border-[#1b6b4a]/25 bg-[#eef6f1] p-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39]">
                        Answer: {question.answer}
                      </p>
                      <p className="rounded-md border border-[#d8e4db] bg-white p-3 text-xs font-bold leading-5 text-[#53645b]">
                        {question.match.matchScope}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-lg border border-[#d8e4db] bg-[#f8fbf7] p-5 text-sm font-bold leading-6 text-[#53645b]">
                Question ledger preview is unavailable.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchAccountabilityApiPreview() {
  const [preview, setPreview] = useState<MatchAccountabilityState>({
    status: "loading",
    message: "Reading match-accountability endpoint.",
    accountability: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/upsc/prelims-2026/match-accountability", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as MatchAccountabilityPreview;
        if (!response.ok) {
          throw new Error("Match-accountability endpoint is unavailable.");
        }

        setPreview({
          status: "ready",
          message: "Match-accountability endpoint is live with portion-level proof locks.",
          accountability: payload,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setPreview({
          status: "error",
          message: error instanceof Error ? error.message : "Match-accountability endpoint is unavailable.",
          accountability: null,
        });
      });

    return () => controller.abort();
  }, []);

  const accountability = preview.accountability;
  const summary = accountability?.summary;
  const previewQuestions = accountability?.questions.slice(0, 5) ?? [];

  return (
    <section
      id="match-accountability"
      data-testid="showcase-match-accountability-api-preview"
      data-api-status={preview.status}
      data-version={accountability?.version ?? "loading"}
      data-question-count={summary?.totalQuestions ?? 0}
      data-complete-question-cards={summary?.completeQuestionCards ?? 0}
      data-option-set-count={summary?.optionSets ?? 0}
      data-portion-row-count={summary?.portionRows ?? 0}
      data-matched-portion-row-count={summary?.matchedPortionRows ?? 0}
      data-source-signal-rows={summary?.sourceSignalRows ?? 0}
      data-concept-signal-rows={summary?.conceptSignalRows ?? 0}
      data-manual-check-rows={summary?.manualCheckRows ?? 0}
      data-fully-matched-question-count={summary?.fullyMatchedQuestions ?? 0}
      data-partial-match-question-count={summary?.partialMatchQuestions ?? 0}
      data-manual-only-question-count={summary?.manualOnlyQuestions ?? 0}
      data-highlighted-question-count={summary?.highlightedQuestions ?? 0}
      data-proof-locked-question-count={summary?.proofLockedQuestions ?? 0}
      data-preview-card-count={previewQuestions.length}
      className="border-b border-[#cbd8ce] bg-[#f8fbf7]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Match accountability API"
          title="Which MCQ portion matched, and what still needs proof?"
          body="This public-safe contract converts the 100-question ledger into a compact accountability map: highest matched portion, pending manual-check portions, covered signals and next proof action."
          icon={SearchCheck}
        />

        <div className="mt-8 grid gap-4 xl:grid-cols-[0.74fr_1.26fr]">
          <div className="grid gap-3">
            {[
              ["Endpoint", accountability?.api.matchAccountability ?? "/api/upsc/prelims-2026/match-accountability"],
              ["API status", preview.status],
              ["Portion rows", summary?.portionRows ?? "Checking"],
              ["Matched portions", summary ? `${summary.matchedPortionRows}/${summary.portionRows}` : "Checking"],
              ["Manual-check portions", summary?.manualCheckRows ?? "Checking"],
              ["Proof-locked questions", summary?.proofLockedQuestions ?? "Checking"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">{label}</p>
                <p className="mt-1 break-words text-base font-black text-[#12251d]">{value}</p>
              </div>
            ))}
            <div
              className={
                preview.status === "ready"
                  ? "rounded-lg border border-[#1b6b4a]/35 bg-[#eef6f1] p-4 text-sm font-bold leading-6 text-[#154f39]"
                  : preview.status === "error"
                    ? "rounded-lg border border-[#d95f43]/35 bg-[#fff0ec] p-4 text-sm font-bold leading-6 text-[#9d3824]"
                    : "rounded-lg border border-[#cbd8ce] bg-white p-4 text-sm font-bold leading-6 text-[#53645b]"
              }
            >
              {preview.message}
            </div>
            <div className="rounded-lg border border-[#d8891c]/35 bg-[#fffaf1] p-4 text-sm font-bold leading-6 text-[#6a4b26]">
              {accountability?.proofPolicy ??
                "Matched portions are candidate signals until retained page proof and teacher validation unlock public claims."}
            </div>
          </div>

          <div className="grid gap-3">
            {preview.status === "loading" ? (
              <div className="grid min-h-48 place-items-center rounded-lg border border-[#d8e4db] bg-white p-5 text-sm font-black uppercase tracking-[0.12em] text-[#53645b]">
                Reading match accountability
              </div>
            ) : previewQuestions.length ? (
              previewQuestions.map((question) => {
                const allSignals = question.match.portionCoverage.flatMap((portion) => portion.matchedSignals);
                const distinctInstruction =
                  question.question.instruction && question.question.instruction !== question.question.stem;

                return (
                  <article
                    key={`match-accountability-${question.number}`}
                    data-testid="showcase-match-accountability-card"
                    data-question-number={question.number}
                    data-status={question.status}
                    data-highest-matched-portion={question.match.highestMatchedPortion}
                    data-matched-portion-count={question.match.matchedPortionLabels.length}
                    data-manual-check-portion-count={question.match.manualCheckPortionLabels.length}
                    data-coverage-score={question.match.coverageScorePercent}
                    data-proof-locked={String(question.proofLocked)}
                    className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#12251d] text-xs font-black text-white">
                        Q{question.number}
                      </span>
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${questionStatusTone[question.status]}`}>
                        {question.statusLabel}
                      </span>
                      <span className="rounded-md border border-[#d8891c]/35 bg-[#fffaf1] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#7b4d0d]">
                        {question.match.coverageScorePercent}% portion coverage
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black tracking-tight text-[#12251d]">{question.subject}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                      <HighlightedText text={question.question.stem} signals={allSignals} />
                    </p>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <div className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">Highest matched portion</p>
                        <p className="mt-1 text-sm font-black leading-5 text-[#12251d]">{question.match.highestMatchedPortion}</p>
                      </div>
                      <div className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">Matched portions</p>
                        <p className="mt-1 text-sm font-black leading-5 text-[#12251d]">
                          {question.match.matchedPortionLabels.length ? question.match.matchedPortionLabels.join(", ") : "None"}
                        </p>
                      </div>
                      <div className="rounded-md border border-[#d8e4db] bg-[#fffaf1] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7b4d0d]">Manual-check portions</p>
                        <p className="mt-1 text-sm font-black leading-5 text-[#12251d]">
                          {question.match.manualCheckPortionLabels.length ? question.match.manualCheckPortionLabels.join(", ") : "None"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {question.match.portionCoverage.map((portion) => (
                        <div
                          key={`${question.number}-match-portion-${portion.label}`}
                          data-testid="showcase-match-accountability-portion"
                          data-coverage={portion.coverage}
                          className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f7e75]">{portion.label}</p>
                            <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statementCoverageTone[portion.coverage]}`}>
                              {portion.coverageLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                            <HighlightedText text={portion.text} signals={portion.matchedSignals} />
                          </p>
                        </div>
                      ))}
                    </div>

                    {distinctInstruction ? (
                      <div className="mt-3 rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">Instruction</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                          <HighlightedText text={question.question.instruction} signals={allSignals} />
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-3 rounded-md border border-[#d8e4db] bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">Options</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {question.question.options.map((option) => (
                          <div
                            key={`${question.number}-match-option-${option.letter}`}
                            data-testid="showcase-match-accountability-option"
                            className="flex gap-2 rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#12251d] text-xs font-black text-white">
                              {option.letter}
                            </span>
                            <p className="text-sm font-semibold leading-6 text-[#364b40]">{option.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 rounded-md border border-[#d8e4db] bg-[#eef6f1] p-3 text-sm font-bold leading-6 text-[#31443a]">
                      {question.match.nextProofAction}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-lg border border-[#d8e4db] bg-white p-5 text-sm font-bold leading-6 text-[#53645b]">
                Match-accountability preview is unavailable.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatFeedDateLabel(value: string | null | undefined) {
  if (!value || value === "local-draft") return "Not published";

  const [date, time] = value.split("T");
  if (!date || !time) return value;

  return `${date} ${time.slice(0, 5)}`;
}

function readLocalPublicProofFeed() {
  if (typeof window === "undefined") return null;

  try {
    const rawFeed = window.localStorage.getItem(prelims2026PublicProofFeedLocalStorageKey);
    if (!rawFeed) return null;
    return parsePrelims2026PublicProofFeed(JSON.parse(rawFeed));
  } catch {
    return null;
  }
}

function MainWebsiteProofFeedPreview() {
  const [preview, setPreview] = useState<ProofFeedPreviewState>({
    status: "loading",
    mode: "checking",
    claimCount: 0,
    message: "Checking public proof feed endpoint.",
    feed: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/upsc/prelims-2026/public-proof-feed", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          mode?: string;
          claimCount?: number;
          message?: string;
          feed?: Prelims2026PublicProofFeed;
        };

        if (!response.ok) {
          throw new Error(payload.message ?? "Public proof feed endpoint is unavailable.");
        }

        const apiFeed = payload.feed ?? null;
        const localFeed = readLocalPublicProofFeed();
        const visibleFeed =
          apiFeed?.releasedClaims.length || !localFeed?.releasedClaims.length ? apiFeed : localFeed;
        const usingLocalMirror = Boolean(
          localFeed?.releasedClaims.length && (!apiFeed || apiFeed.releasedClaims.length === 0)
        );

        setPreview({
          status: "ready",
          mode: usingLocalMirror ? "local-cache" : payload.mode ?? "unknown",
          claimCount: visibleFeed?.releasedClaims.length ?? Number(payload.claimCount ?? 0),
          message: usingLocalMirror
            ? "Using browser-local approved proof feed mirror because external persistence is not configured."
            : payload.message ?? "Public proof feed endpoint responded.",
          feed: visibleFeed,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const localFeed = readLocalPublicProofFeed();
        if (localFeed?.releasedClaims.length) {
          setPreview({
            status: "ready",
            mode: "local-cache",
            claimCount: localFeed.releasedClaims.length,
            message: "Using browser-local approved proof feed mirror because the endpoint is unavailable.",
            feed: localFeed,
          });
          return;
        }

        setPreview({
          status: "error",
          mode: "unavailable",
          claimCount: 0,
          message: error instanceof Error ? error.message : "Public proof feed endpoint is unavailable.",
          feed: null,
        });
      });

    return () => controller.abort();
  }, []);

  const claims = preview.feed?.releasedClaims ?? [];
  const previewClaims = claims.slice(0, 3);
  const modeTone =
    preview.mode === "supabase"
      ? "border-[#1b6b4a] bg-[#e2f5ea] text-[#125239]"
      : preview.mode === "local-only" || preview.mode === "dry-run" || preview.mode === "local-cache"
        ? "border-[#d8891c] bg-[#fff3dd] text-[#7b4d0d]"
        : preview.status === "error"
          ? "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]"
          : "border-[#cbd8ce] bg-white text-[#53645b]";

  return (
    <section
      id="main-website-proof-feed-preview"
      data-testid="showcase-proof-feed-preview"
      data-api-status={preview.status}
      data-api-mode={preview.mode}
      data-claim-count={preview.claimCount}
      className="border-b border-[#cbd8ce] bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Main website proof feed"
          title="The public page can now read the same released-claim API."
          body="This preview reads the public proof-feed endpoint that the main website can later consume for verified MCQ claim cards."
          icon={Database}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="grid gap-3">
            {[
              ["Endpoint", "/api/upsc/prelims-2026/public-proof-feed"],
              ["API mode", preview.mode],
              ["Released claims", preview.claimCount],
              ["Last update", formatFeedDateLabel(preview.feed?.lastUpdatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">{label}</p>
                <p className="mt-1 break-words text-base font-black text-[#12251d]">{value}</p>
              </div>
            ))}
            <div className={`rounded-lg border p-4 text-sm font-bold leading-6 ${modeTone}`}>
              {preview.message}
            </div>
          </div>

          <div className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
            {preview.status === "loading" ? (
              <div className="grid min-h-48 place-items-center rounded-md border border-[#d8e4db] bg-white p-5 text-sm font-black uppercase tracking-[0.12em] text-[#53645b]">
                Reading proof feed
              </div>
            ) : previewClaims.length ? (
              <div className="grid gap-3">
                {previewClaims.map((claim, index) => (
                  <article
                    key={`feed-preview-${claim.questionNumber}`}
                    data-testid="showcase-proof-feed-claim"
                    data-question-number={claim.questionNumber}
                    className="rounded-md border border-[#d8e4db] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#12251d] text-xs font-black text-white">
                        Q{claim.questionNumber}
                      </span>
                      <span className="rounded-md border border-[#1b6b4a]/35 bg-[#eef6f1] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#154f39]">
                        {claim.statusLabel}
                      </span>
                      <span className="rounded-md border border-[#d8891c]/35 bg-[#fffaf1] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#7b4d0d]">
                        {claim.matchedPortions.length} matched
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black tracking-tight text-[#12251d]">{claim.subject}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{claim.publicClaim}</p>
                    <p className="mt-3 rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                      {claim.sourceRef} / {claim.pageRef}
                    </p>
                    <details
                      open={index === 0}
                      className="mt-3 rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3"
                    >
                      <summary className="cursor-pointer list-none text-xs font-black uppercase tracking-[0.12em] text-[#1b6b4a]">
                        Complete MCQ proof
                      </summary>
                      <div className="mt-3 grid gap-3">
                        <div className="rounded-md border border-[#d8e4db] bg-white p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f7e75]">Question stem</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                            <HighlightedText
                              text={claim.question.stem}
                              signals={claim.matchedPortions.flatMap((portion) => portion.matchedSignals)}
                            />
                          </p>
                        </div>

                        {claim.question.statements.length ? (
                          <div className="grid gap-2">
                            {claim.question.statements.map((statement, statementIndex) => {
                              const fallbackLabel = `Statement ${statementIndex + 1}`;
                              const portion = claim.matchedPortions.find(
                                (item) => item.label === fallbackLabel || item.text === statement
                              );
                              const manual = claim.manualCheckPortions.find(
                                (item) => item.label === fallbackLabel || item.text === statement
                              );
                              const rowLabel = portion?.label ?? manual?.label ?? fallbackLabel;

                              return (
                                <div
                                  key={`${claim.questionNumber}-preview-statement-${statementIndex}`}
                                  data-testid="showcase-proof-feed-statement"
                                  className="rounded-md border border-[#d8e4db] bg-white p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f7e75]">
                                      {rowLabel}
                                    </p>
                                    <span
                                      className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
                                        portion
                                          ? "border-[#1b6b4a]/35 bg-[#eef6f1] text-[#154f39]"
                                          : "border-[#d8891c]/35 bg-[#fffaf1] text-[#7b4d0d]"
                                      }`}
                                    >
                                      {portion?.coverageLabel ?? manual?.coverageLabel ?? "Manual check"}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">
                                    <HighlightedText text={statement} signals={portion?.matchedSignals ?? []} />
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {claim.question.instruction ? (
                          <div className="rounded-md border border-[#d8e4db] bg-white p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f7e75]">Instruction</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[#364b40]">{claim.question.instruction}</p>
                          </div>
                        ) : null}

                        <div className="grid gap-2 md:grid-cols-2">
                          {claim.question.options.map((option) => (
                            <div
                              key={`${claim.questionNumber}-preview-option-${option.letter}`}
                              className="flex gap-2 rounded-md border border-[#d8e4db] bg-white p-3"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#eef6f1] text-xs font-black text-[#154f39]">
                                {option.letter}
                              </span>
                              <p className="text-sm font-semibold leading-6 text-[#364b40]">{option.text}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          <p className="rounded-md border border-[#1b6b4a]/25 bg-[#eef6f1] p-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39]">
                            Answer: {claim.question.answer}
                          </p>
                          <p className="rounded-md border border-[#d8e4db] bg-white p-3 text-xs font-bold leading-5 text-[#53645b]">
                            {claim.teacherNote}
                          </p>
                        </div>
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-[#d8e4db] bg-white p-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7b4d0d]">No API claims published yet</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">
                  The main website endpoint is reachable, but released question cards will appear only after approved
                  proof packets are published from the strategy command.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseActionApiPreview() {
  const [preview, setPreview] = useState<CourseActionPreviewState>({
    status: "loading",
    message: "Reading 2027 course-action endpoint.",
    courseAction: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/upsc/prelims-2027/course-action", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as CourseActionApiPreview;
        if (!response.ok) {
          throw new Error("2027 course-action endpoint is unavailable.");
        }

        setPreview({
          status: "ready",
          message: "Course-action endpoint is live for 2027 portal integration.",
          courseAction: payload,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setPreview({
          status: "error",
          message: error instanceof Error ? error.message : "2027 course-action endpoint is unavailable.",
          courseAction: null,
        });
      });

    return () => controller.abort();
  }, []);

  const courseAction = preview.courseAction;
  const summary = courseAction?.summary;
  const previewPriorities = courseAction?.priorities.slice(0, 4) ?? [];
  const phaseSummary = summary
    ? ["Source", "Capsule", "MCQ", "Proof", "Release", "Planner"]
        .map((phase) => `${phase}: ${summary.phaseCounts[phase] ?? 0}`)
        .join(" / ")
    : "Phase counts loading";

  return (
    <section
      id="main-website-course-action-preview"
      data-testid="showcase-course-action-api-preview"
      data-api-status={preview.status}
      data-version={courseAction?.version ?? "loading"}
      data-priority-count={summary?.priorityCount ?? 0}
      data-critical-priority-count={summary?.criticalPriorityCount ?? 0}
      data-task-count={summary?.taskCount ?? 0}
      data-sprint-count={summary?.sprintCount ?? 0}
      data-practice-blueprint-count={summary?.practiceBlueprintCount ?? 0}
      data-format-rule-count={summary?.formatRuleCount ?? 0}
      data-reallocation-count={summary?.reallocationDecisionCount ?? 0}
      data-evidence-ledger-count={summary?.evidenceLedgerCount ?? 0}
      data-launch-step-count={summary?.launchStepCount ?? 0}
      data-phase-source={summary?.phaseCounts.Source ?? 0}
      data-phase-capsule={summary?.phaseCounts.Capsule ?? 0}
      data-phase-mcq={summary?.phaseCounts.MCQ ?? 0}
      data-phase-proof={summary?.phaseCounts.Proof ?? 0}
      data-phase-release={summary?.phaseCounts.Release ?? 0}
      data-phase-planner={summary?.phaseCounts.Planner ?? 0}
      className="border-b border-[#cbd8ce] bg-[#f8fbf7]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="2027 course-action API"
          title="The recommendation is now a structured software handoff."
          body="This endpoint lets the main website or portal read the 2027 course correction: priorities, sprint windows, execution tasks, practice blueprints, format rules and proof gates."
          icon={ClipboardCheck}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="grid gap-3">
            {[
              ["Endpoint", courseAction?.api.courseAction ?? "/api/upsc/prelims-2027/course-action"],
              ["Review command API", courseAction?.api.reviewCommand ?? "/api/upsc/prelims-2026/review-command"],
              ["Version", courseAction?.version ?? "checking"],
              ["Strategy owner", courseAction?.strategyRoute ?? "/upsc/prelims-2027-strategy"],
              ["Public anchor", courseAction?.publicAnchor ?? "/upsc-prelims-2026-showcase#software-path"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">{label}</p>
                <p className="mt-1 break-words text-base font-black text-[#12251d]">{value}</p>
              </div>
            ))}
            <div
              className={
                preview.status === "ready"
                  ? "rounded-lg border border-[#1b6b4a]/35 bg-[#eef6f1] p-4 text-sm font-bold leading-6 text-[#154f39]"
                  : preview.status === "error"
                    ? "rounded-lg border border-[#d95f43]/35 bg-[#fff0ec] p-4 text-sm font-bold leading-6 text-[#9d3824]"
                    : "rounded-lg border border-[#cbd8ce] bg-white p-4 text-sm font-bold leading-6 text-[#53645b]"
              }
            >
              {preview.message}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              {[
                {
                  label: "Priorities",
                  value: String(summary?.priorityCount ?? 0),
                  detail: `${summary?.criticalPriorityCount ?? 0} critical / ${summary?.highPriorityCount ?? 0} high`,
                  tone: theme.coral,
                },
                {
                  label: "Execution tasks",
                  value: String(summary?.taskCount ?? 0),
                  detail: `${summary?.sprintCount ?? 0} sprint windows`,
                  tone: theme.leaf,
                },
                {
                  label: "Practice blueprints",
                  value: String(summary?.practiceBlueprintCount ?? 0),
                  detail: `${summary?.formatRuleCount ?? 0} format rules`,
                  tone: theme.blue,
                },
                {
                  label: "Proof gates",
                  value: String(summary?.reallocationDecisionCount ?? 0),
                  detail: `${summary?.evidenceLedgerCount ?? 0} evidence rows`,
                  tone: theme.plum,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                  <p className="text-3xl font-black tracking-tight" style={{ color: item.tone }}>
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#6f7e75]">{item.label}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">Phase split</p>
              <p className="mt-2 text-sm font-black leading-6 text-[#31443a]">{phaseSummary}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">
                {courseAction?.proofPolicy ??
                  "This endpoint publishes the 2027 course-action plan without converting question-level evidence into public claims."}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {previewPriorities.map((priority) => (
                <article
                  key={`course-action-${priority.id}`}
                  data-testid="showcase-course-action-priority"
                  data-priority-id={priority.id}
                  data-priority-band={priority.priority}
                  data-task-count={priority.taskCount}
                  data-blueprint-count={priority.blueprintCount}
                  className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-black tracking-tight text-[#12251d]">{priority.subject}</h3>
                    <span className="rounded-md border border-[#d8891c]/35 bg-[#fffaf1] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#7b4d0d]">
                      {priority.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{priority.action}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <p className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                      {priority.taskCount} tasks / {priority.blueprintCount} blueprints
                    </p>
                    <p className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                      {priority.proofStatus}
                    </p>
                  </div>
                  <p className="mt-3 rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3 text-xs font-semibold leading-5 text-[#53645b]">
                    {priority.releaseGate}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceArchiveSummaryApiPreview() {
  const [preview, setPreview] = useState<SourceArchiveSummaryState>({
    status: "loading",
    message: "Reading source archive summary endpoint.",
    summary: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/upsc/prelims-2026/source-archive-summary", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as SourceArchiveSummaryPreview;
        if (!response.ok) {
          throw new Error("Source archive summary endpoint is unavailable.");
        }

        setPreview({
          status: "ready",
          message: payload.scan.message || "Source archive summary endpoint is live for website integration.",
          summary: payload,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setPreview({
          status: "error",
          message: error instanceof Error ? error.message : "Source archive summary endpoint is unavailable.",
          summary: null,
        });
      });

    return () => controller.abort();
  }, []);

  const summary = preview.summary;
  const scan = summary?.scan;
  const previewTracks = summary?.tracks.slice(0, 8) ?? [];
  const previewFolders = summary?.topFolders.slice(0, 6) ?? [];
  const previewExtensions = summary?.extensions.slice(0, 6) ?? [];

  return (
    <section
      id="source-archive-summary"
      data-testid="showcase-source-archive-summary-preview"
      data-api-status={preview.status}
      data-version={summary?.version ?? "loading"}
      data-root-connected={String(scan?.rootConnected ?? false)}
      data-total-files={scan?.totalFiles ?? 0}
      data-total-directories={scan?.totalDirectories ?? 0}
      data-total-bytes={scan?.totalBytes ?? 0}
      data-pdf-count={scan?.pdfCount ?? 0}
      data-docx-count={scan?.docxCount ?? 0}
      data-image-count={scan?.imageCount ?? 0}
      data-extension-type-count={scan?.extensionTypeCount ?? 0}
      data-folder-bucket-count={scan?.folderBucketCount ?? 0}
      data-track-count={scan?.trackCount ?? 0}
      data-strongest-track-id={scan?.strongestTrackId ?? "none"}
      data-rendered-track-count={previewTracks.length}
      data-rendered-folder-count={previewFolders.length}
      data-proof-policy="sanitized-summary-no-raw-paths"
      className="border-b border-[#cbd8ce] bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <SectionHeader
          eyebrow="Source archive summary API"
          title="The year-long source archive is now a safe website contract."
          body="This public block shows archive strength, track decisions and software actions without exposing raw file names, folder paths or page proof. The operator portal keeps the exact proof material."
          icon={Database}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="grid gap-3">
            {[
              ["Endpoint", summary?.api.sourceArchiveSummary ?? "/api/upsc/prelims-2026/source-archive-summary"],
              ["Source label", summary?.sourceLabel ?? "Morning Batch source archive"],
              ["Public anchor", summary?.publicAnchor ?? "/upsc-prelims-2026-showcase#source-archive-summary"],
              ["Internal intake", summary?.internalIntakeRoute ?? "/upsc/source-library#upsc-morning-batch-archive-intake"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">{label}</p>
                <p className="mt-1 break-words text-base font-black text-[#12251d]">{value}</p>
              </div>
            ))}
            <div
              className={
                preview.status === "ready"
                  ? "rounded-lg border border-[#1b6b4a]/35 bg-[#eef6f1] p-4 text-sm font-bold leading-6 text-[#154f39]"
                  : preview.status === "error"
                    ? "rounded-lg border border-[#d95f43]/35 bg-[#fff0ec] p-4 text-sm font-bold leading-6 text-[#9d3824]"
                    : "rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 text-sm font-bold leading-6 text-[#53645b]"
              }
            >
              {preview.message}
            </div>
            <Link
              href={summary?.internalIntakeRoute ?? "/upsc/source-library#upsc-morning-batch-archive-intake"}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#1b6b4a]/35 bg-[#eef6f1] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-white"
            >
              Open internal intake
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-5">
              {[
                {
                  label: "Archive files",
                  value: String(scan?.totalFiles ?? 0),
                  detail: `${scan?.totalDirectories ?? 0} folders`,
                  tone: theme.leaf,
                },
                {
                  label: "PDFs",
                  value: String(scan?.pdfCount ?? 0),
                  detail: `${scan?.docxCount ?? 0} DOCX files`,
                  tone: theme.blue,
                },
                {
                  label: "Archive size",
                  value: formatArchiveBytes(scan?.totalBytes ?? 0),
                  detail: `${scan?.extensionTypeCount ?? 0} file types`,
                  tone: theme.amber,
                },
                {
                  label: "Tracks",
                  value: String(scan?.trackCount ?? 0),
                  detail: scan?.strongestTrackLabel ?? "Scanning",
                  tone: theme.plum,
                },
                {
                  label: "Images",
                  value: String(scan?.imageCount ?? 0),
                  detail: `${scan?.folderBucketCount ?? 0} top folders`,
                  tone: theme.teal,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                  <p className="text-2xl font-black tracking-tight" style={{ color: item.tone }}>
                    {item.value}
                  </p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#6f7e75]">{item.label}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#cbd8ce] bg-[#fffaf1] p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b4d0d]">Proof boundary</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#6a4b26]">
                {summary?.proofPolicy ??
                  "This summary exposes archive counts and rebuild tracks only. Raw file paths, file names and page-level proof stay inside the operator portal."}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {previewTracks.map((track) => (
                <article
                  key={`source-archive-summary-${track.id}`}
                  data-testid="showcase-source-archive-summary-track"
                  data-track-id={track.id}
                  data-decision={track.decision}
                  data-hit-count={track.hitCount}
                  data-sample-count={track.sampleCount}
                  className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-black text-[#12251d]">{track.label}</h3>
                    <span className="rounded-md border border-[#d8891c]/35 bg-[#fffaf1] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#7b4d0d]">
                      {track.decision}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <p className="rounded-md border border-[#d8e4db] bg-white p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                      {track.hitCount} candidate files
                    </p>
                    <p className="rounded-md border border-[#d8e4db] bg-white p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                      {track.sampleCount} proof samples
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{track.nextAction}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">Top archive folders</p>
                <div className="mt-3 grid gap-2">
                  {previewFolders.map((folder) => (
                    <div
                      key={`source-summary-folder-${folder.name}`}
                      data-testid="showcase-source-archive-summary-folder"
                      data-folder-name={folder.name}
                      data-file-count={folder.fileCount}
                      className="flex items-center justify-between gap-3 rounded-md border border-[#d8e4db] bg-white p-3"
                    >
                      <span className="min-w-0 truncate text-sm font-black text-[#12251d]">{folder.name}</span>
                      <span className="shrink-0 text-sm font-black text-[#1b6b4a]">{folder.fileCount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1b6b4a]">File type mix</p>
                <div className="mt-3 grid gap-2">
                  {previewExtensions.map((extension) => (
                    <div
                      key={`source-summary-extension-${extension.extension}`}
                      data-testid="showcase-source-archive-summary-extension"
                      data-extension={extension.extension}
                      data-count={extension.count}
                      className="flex items-center justify-between gap-3 rounded-md border border-[#d8e4db] bg-white p-3"
                    >
                      <span className="text-sm font-black text-[#12251d]">{extension.extension}</span>
                      <span className="text-sm font-black text-[#1b6b4a]">{extension.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
    <details
      data-testid="showcase-question-evidence-card"
      data-question-number={item.number}
      data-subject={item.subject}
      data-status={item.status}
      data-statement-count={item.statementCount}
      data-option-count={item.options.length}
      data-coverage-count={item.statementCoverage.length}
      className="group rounded-lg border border-[#cbd8ce] bg-white shadow-sm"
    >
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
                          {coverage?.label ?? `Statement ${index + 1}`}
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
      statementCoverageRows: questionEvidence.reduce((total, item) => total + item.statementCoverage.length, 0),
    }),
    [questionEvidence]
  );

  return (
    <section
      id="question-ledger"
      data-testid="showcase-question-ledger"
      data-question-count={questionEvidence.length}
      data-direct-count={totals.direct}
      data-partial-count={totals.partial}
      data-gap-count={totals.none}
      data-multi-statement-count={totals.multiStatement}
      data-statement-coverage-rows={totals.statementCoverageRows}
      className="border-y border-[#cbd8ce] bg-white"
    >
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
                href="#coverage-map"
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
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1b6b4a]">Automated source-lead status</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">37 direct text leads, 63 conceptual leads</h2>
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
              <MiniStat label="Automated direct leads" value="37%" tone={theme.leaf} />
              <MiniStat label="Automated conceptual leads" value="63%" tone={theme.amber} />
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

      <section data-testid="showcase-dual-ledger-explainer" className="border-b border-[#cbd8ce] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <SectionHeader
            eyebrow="Audit number guide"
            title="Two ledgers are shown on purpose, and they answer different questions."
            body="The automated ledger finds archive source leads. The corrected PDF audit is the public research outcome. Keeping them separate prevents inflated claims and makes the page safer for the main website."
            icon={ShieldCheck}
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {auditLedgerComparison.map((ledger) => (
              <article
                key={ledger.title}
                data-testid="showcase-audit-ledger-card"
                className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm"
              >
                <div className="mb-4 h-1.5 rounded-full" style={{ backgroundColor: ledger.tone }} />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6f7e75]">Ledger</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-[#12251d]">{ledger.title}</h3>
                  </div>
                  <span className="rounded-md border border-[#cbd8ce] bg-white px-3 py-1 text-xs font-black text-[#12251d]">
                    {ledger.metric}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <p className="rounded-md border border-[#d8e4db] bg-white p-3 text-sm font-semibold leading-6 text-[#53645b]">
                    <span className="font-black text-[#12251d]">Purpose:</span> {ledger.purpose}
                  </p>
                  <p className="rounded-md border border-[#d8e4db] bg-white p-3 text-sm font-semibold leading-6 text-[#53645b]">
                    <span className="font-black text-[#12251d]">Public use:</span> {ledger.publicUse}
                  </p>
                  <p className="rounded-md border border-[#d8e4db] bg-[#eef6f1] p-3 text-sm font-bold leading-6 text-[#2f4f3f]">
                    {ledger.nextStep}
                  </p>
                </div>
              </article>
            ))}
          </div>
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

      <section id="gap-analysis" className="border-y border-[#cbd8ce] bg-white">
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

          <div
            id="fifteen-year-trend"
            data-testid="showcase-fifteen-year-trend"
            data-year-window="2012-2026"
            data-subtopic-count={fifteenYearTrendRows.length}
            data-subject-count={fifteenYearSubjectTrendData.length}
            className="mt-8 rounded-lg border border-[#cbd8ce] bg-[#fffdf8] p-4 shadow-sm md:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">15-year subject trend board</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-[#12251d]">
                  2012-2026 shows a shift from static weightage to applied, source-linked question design.
                </h3>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-[#53645b]">
                  This is a working preparation taxonomy, because UPSC does not publish official subject-wise buckets.
                  The point for students is the direction: Ancient, Medieval, Modern, IR, Geography, Environment,
                  Economy, S&T, Polity, Current Affairs and social-policy areas now need format-aware practice.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-md border border-[#d9c8a4] bg-[#fffaf1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#7b4d0d]">
                Window: 2012-2026
              </span>
            </div>

            <Tabs defaultValue="pressure" className="mt-6 gap-5">
              <TabsList className="h-auto w-full flex-wrap justify-start rounded-md bg-[#edf4ef] p-1">
                <TabsTrigger
                  value="pressure"
                  className="h-10 flex-none rounded-md px-3 text-xs font-black uppercase tracking-[0.1em] data-active:bg-white data-active:text-[#1b6b4a]"
                >
                  Subject pressure
                </TabsTrigger>
                <TabsTrigger
                  value="subtopics"
                  className="h-10 flex-none rounded-md px-3 text-xs font-black uppercase tracking-[0.1em] data-active:bg-white data-active:text-[#1b6b4a]"
                >
                  Subtopic shifts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pressure" className="rounded-lg border border-[#d6e2d9] bg-white p-4">
                <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1b6b4a]">Normalized pressure score</p>
                        <h4 className="mt-1 text-xl font-black tracking-tight">Early, middle and recent phases</h4>
                      </div>
                      <BarChart3 className="h-5 w-5 text-[#1b6b4a]" />
                    </div>
                    <ChartStage height={380}>
                      {(width, height) => (
                        <BarChart
                          width={width}
                          height={height}
                          data={fifteenYearSubjectTrendData}
                          layout="vertical"
                          margin={{ top: 8, right: 20, left: 24, bottom: 8 }}
                        >
                          <CartesianGrid stroke="#d9e2db" strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                          <YAxis type="category" dataKey="subject" width={126} tick={{ fill: "#53645b", fontSize: 12, fontWeight: 700 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="early" name="2012-16" fill="#d9c08a" radius={[0, 5, 5, 0]} />
                          <Bar dataKey="middle" name="2017-21" fill={theme.leaf} radius={[0, 5, 5, 0]} />
                          <Bar dataKey="recent" name="2022-26" fill={theme.blue} radius={[0, 5, 5, 0]} />
                        </BarChart>
                      )}
                    </ChartStage>
                  </div>

                  <div className="grid gap-3">
                    {fifteenYearTakeaways.map((item) => (
                      <div key={item.label} className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: item.tone }}>
                          {item.label}
                        </p>
                        <h4 className="mt-2 text-lg font-black text-[#12251d]">{item.title}</h4>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
                      </div>
                    ))}
                    <div className="rounded-lg border border-[#d9c8a4] bg-[#fffaf1] p-4 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a75525]">2027 correction</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#6a4b26]">
                        The course should allocate effort by trend pressure plus 2026 surprise: IR bodies, applied S&T,
                        map intelligence, digital economy, source proof and multi-statement formats.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subtopics" className="rounded-lg border border-[#d6e2d9] bg-white p-0">
                <div className="hidden grid-cols-[0.82fr_1fr_1fr_1fr_1.05fr] border-b border-[#d8e4db] text-xs font-black uppercase tracking-[0.12em] text-[#6f7e75] lg:grid">
                  <div className="p-3">Area</div>
                  <div className="p-3">2012-16</div>
                  <div className="p-3">2017-21</div>
                  <div className="p-3">2022-26</div>
                  <div className="p-3">2027 course action</div>
                </div>
                <div className="divide-y divide-[#d8e4db]">
                  {fifteenYearTrendRows.map((row) => (
                    <div
                      key={row.area}
                      data-testid="showcase-fifteen-year-trend-row"
                      data-area={row.area}
                      className="grid gap-3 p-4 lg:grid-cols-[0.82fr_1fr_1fr_1fr_1.05fr] lg:items-start"
                    >
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">Area</p>
                        <h4 className="text-sm font-black leading-6 text-[#12251d]">{row.area}</h4>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">2012-16</p>
                        <p className="text-sm font-semibold leading-6 text-[#53645b]">{row.early}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">2017-21</p>
                        <p className="text-sm font-semibold leading-6 text-[#53645b]">{row.middle}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">2022-26</p>
                        <p className="text-sm font-semibold leading-6 text-[#53645b]">{row.recent}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">2027 course action</p>
                        <p className="rounded-md bg-[#eef6f1] p-3 text-sm font-bold leading-6 text-[#2f4f3f]">{row.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <section id="coverage-map" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
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

      <section
        id="surprise-action-matrix"
        data-testid="showcase-surprise-action-matrix"
        data-row-count={surpriseActionRows.length}
        data-critical-count={surpriseActionRows.filter((row) => row.priority === "Critical").length}
        data-build-from-scratch-count={surpriseActionRows.filter((row) => row.reallocationDecision === "Build from scratch").length}
        data-source-task-count={surpriseActionRows.reduce((total, row) => total + row.sourceTaskCount, 0)}
        data-mcq-task-count={surpriseActionRows.reduce((total, row) => total + row.mcqTaskCount, 0)}
        className="border-y border-[#cbd8ce] bg-[#fffdf8]"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Surprise to software"
            title="Every 2026 surprise becomes a 2027 operating decision."
            body="This matrix is the public version of the course correction: what UPSC changed, which domain is still underbuilt, and exactly what the software must queue next."
            icon={Sparkles}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {surpriseActionSummary.map((item) => (
              <div key={item.label} className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm">
                <p className="text-3xl font-black tracking-tight" style={{ color: item.tone }}>
                  {item.value}
                </p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#6f7e75]">{item.label}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-lg border border-[#cbd8ce] bg-white shadow-sm">
            <div className="hidden text-xs font-black uppercase tracking-[0.14em] text-[#6f7e75] lg:grid lg:grid-cols-[0.8fr_1.15fr_1fr_1.05fr_0.85fr]">
              <div className="border-b border-[#d8e4db] p-3">Domain</div>
              <div className="border-b border-[#d8e4db] p-3">Surprise element</div>
              <div className="border-b border-[#d8e4db] p-3">Untapped read</div>
              <div className="border-b border-[#d8e4db] p-3">Software action</div>
              <div className="border-b border-[#d8e4db] p-3">Proof gate</div>
            </div>

            <div className="divide-y divide-[#d8e4db]">
              {surpriseActionRows.map((row) => (
                <div
                  key={row.id}
                  data-testid="showcase-surprise-action-row"
                  data-priority-id={row.id}
                  data-priority={row.priority}
                  data-reallocation-decision={row.reallocationDecision}
                  data-source-task-count={row.sourceTaskCount}
                  data-mcq-task-count={row.mcqTaskCount}
                  className="grid gap-4 p-4 lg:grid-cols-[0.8fr_1.15fr_1fr_1.05fr_0.85fr] lg:items-start"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">Domain</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black leading-6 text-[#12251d]">{row.subject}</h3>
                      <span
                        className={
                          row.priority === "Critical"
                            ? "rounded-md border border-[#d95f43] bg-[#fff0ec] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#9d3824]"
                            : row.priority === "High"
                              ? "rounded-md border border-[#d8891c] bg-[#fff3dd] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#7b4d0d]"
                              : "rounded-md border border-[#1b6b4a] bg-[#e2f5ea] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#125239]"
                        }
                      >
                        {row.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#1b6b4a]">{row.reallocationDecision}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{row.window}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">Surprise element</p>
                    <p className="text-sm font-semibold leading-6 text-[#53645b]">{row.examSurprise}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">Untapped read</p>
                    <p className="text-sm font-semibold leading-6 text-[#53645b]">{row.untappedDomain}</p>
                    <p className="mt-2 rounded-md bg-[#f8fbf7] p-2 text-xs font-bold leading-5 text-[#2f4f3f]">{row.sourceStandard}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">Software action</p>
                    <p className="text-sm font-bold leading-6 text-[#2f4f3f]">{row.softwareDecision}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1b6b4a]">
                        Source tasks: {row.sourceTaskCount}
                      </span>
                      <span className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#276fbf]">
                        MCQ tasks: {row.mcqTaskCount}
                      </span>
                    </div>
                    <Link
                      href={row.route}
                      className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-[#1b6b4a]/35 bg-[#eef6f1] px-3 text-[11px] font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-white"
                    >
                      Open route
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#819087] lg:hidden">Proof gate</p>
                    <p className="text-sm font-semibold leading-6 text-[#6a4b26]">{row.publicClaimRule}</p>
                    <p className="mt-2 rounded-md bg-[#fffaf1] p-2 text-xs font-bold leading-5 text-[#6a4b26]">{row.nextProofAction}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        data-testid="showcase-question-logic"
        data-format-three-plus={questionFormatData[0].value}
        data-format-two={questionFormatData[1].value}
        data-format-no-list={questionFormatData[2].value}
        data-format-multi-statement-total={questionFormatData[0].value + questionFormatData[1].value}
        className="mx-auto max-w-7xl px-4 py-12 md:px-8"
      >
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

      <section
        id="requirement-tracker"
        data-testid="showcase-requirement-tracker"
        data-requirement-count={requirementTracker.length}
        data-complete-count={requirementTracker.filter((item) => item.status === "Complete").length}
        data-proof-locked-count={requirementTracker.filter((item) => item.status === "Proof locked").length}
        data-portal-owned-count={requirementTracker.filter((item) => item.status === "Portal owned").length}
        data-proof-rule="original-brief-to-public-page-and-portal-handoff"
        className="border-y border-[#cbd8ce] bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Requirement tracker"
            title="The original build brief is now visible on the page."
            body="This tracker turns the broad build request into public-facing proof points: what is complete, what is proof-locked, and where the portal route takes over."
            icon={FileCheck2}
          />

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {requirementTracker.map((item, index) => (
              <div
                key={item.label}
                data-testid="showcase-requirement-row"
                data-requirement-id={item.id}
                data-category={item.category}
                data-status={item.status}
                data-owner={item.owner}
                className="rounded-lg border border-[#cbd8ce] bg-[#f8fbf7] p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#12251d] text-xs font-black text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-[#cbd8ce] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#53645b]">
                        {item.category}
                      </span>
                      <h3 className="text-base font-black text-[#12251d]">{item.label}</h3>
                      <span
                        className={
                          item.status === "Proof locked"
                            ? "rounded-md border border-[#d8891c] bg-[#fff3dd] px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#7b4d0d]"
                            : item.status === "Portal owned"
                              ? "rounded-md border border-[#276fbf] bg-[#eef6ff] px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#1f5d8f]"
                            : "rounded-md border border-[#1b6b4a] bg-[#e2f5ea] px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#125239]"
                        }
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#53645b]">{item.proof}</p>
                    <p className="mt-3 inline-flex rounded-md border border-[#d8e4db] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1b6b4a]">
                      Owner: {item.owner}
                    </p>
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
          body="The PDF's corrected priority matrix now feeds the public explanation and the operational build queue inside the software."
          icon={ClipboardCheck}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {publicReleaseSummary.map((item) => (
            <div
              key={item.label}
              data-testid="showcase-public-release-rule"
              className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm"
            >
              <p className="text-3xl font-black tracking-tight" style={{ color: item.tone }}>
                {item.value}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#6f7e75]">{item.label}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#53645b]">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {publicStrategyTracks.map((item) => (
            <div
              key={item.subject}
              data-testid="showcase-2027-strategy-track"
              data-priority-id={item.id}
              data-public-status={item.publicStatus}
              className="rounded-lg border border-[#cbd8ce] bg-white p-4 shadow-sm"
            >
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

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {[
                  ["Proof status", item.publicStatus],
                  ["Tasks", String(item.taskCount)],
                  ["Proof tasks", String(item.proofTaskCount)],
                  ["Practice plans", String(item.blueprintCount)],
                ].map(([label, value]) => (
                  <div key={`${item.id}-${label}`} className="rounded-md border border-[#d8e4db] bg-[#f8fbf7] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1b6b4a]">{label}</p>
                    <p className="mt-1 text-sm font-black leading-5 text-[#12251d]">{value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm font-semibold leading-6 text-[#53645b]">
                <span className="font-black text-[#12251d]">Evidence:</span> {item.evidenceEntry?.auditSignal ?? item.priorityEvidence}
              </p>
              {item.evidenceEntry ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <p className="rounded-md bg-[#fffaf1] p-3 text-sm font-bold leading-6 text-[#6a4b26]">
                    <span className="font-black text-[#12251d]">Public rule:</span> {item.evidenceEntry.publicClaimRule}
                  </p>
                  <p className="rounded-md bg-[#eef6f1] p-3 text-sm font-bold leading-6 text-[#2f4f3f]">
                    <span className="font-black text-[#12251d]">Proof action:</span> {item.evidenceEntry.nextProofAction}
                  </p>
                </div>
              ) : null}
              <p className="mt-3 rounded-md bg-[#f8fbf7] p-3 text-sm font-bold leading-6 text-[#2f4f3f]">
                {item.action}
              </p>
              <Link
                href="/upsc/prelims-2027-strategy"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-[#1b6b4a]/35 bg-[#eef6f1] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#154f39] transition hover:bg-white"
              >
                Open strategy command
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <PublicWebsiteCopyKit />

      <MainWebsiteIntegrationMap />

      <MainWebsiteManifestContract />

      <ReleaseDecisionApiPreview />

      <BuildReadinessApiPreview />

      <QuestionLedgerApiPreview />

      <MatchAccountabilityApiPreview />

      <MainWebsiteProofFeedPreview />

      <CourseActionApiPreview />

      <SourceArchiveSummaryApiPreview />

      <section id="software-path" className="border-y border-[#cbd8ce] bg-[#f8fbf7]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SectionHeader
            eyebrow="Software execution path"
            title="The page becomes a working 2027 preparation engine through connected modules."
            body="This connects the research page to existing UPSC portal routes: proof rules, gap tags, task execution, student readiness, generated practice and delivery tracking."
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
              {publicFormatRebuildRules.map((rule) => (
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
