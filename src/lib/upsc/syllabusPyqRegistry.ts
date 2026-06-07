import { coreSubjectBlueprints, optionalSubjects } from "@/lib/upsc/yearlyPlanner";

export type SourceStage = "Prelims" | "Mains" | "Optional";
export type ImportStatus = "source-indexed" | "topic-mapped" | "text-import-pending";
export type TrendWeight = "High" | "Medium" | "Selective";
export type TrendEvidenceLevel = "official-source-indexed" | "topic-pattern-model" | "full-text-pending";
export type OfficialPaperIndexStatus = "direct-paper-page-linked" | "official-index-linked";

export type OfficialSourceAnchor = {
  id: string;
  title: string;
  year?: number;
  stage: SourceStage | "Notification";
  href: string;
  note: string;
};

export type OfficialPaperIndexRow = {
  id: string;
  year: number;
  stage: SourceStage;
  exam: string;
  paper: string;
  subjectSlug?: string;
  subjectTitle?: string;
  sourceAnchorId: string;
  sourceHref: string;
  status: OfficialPaperIndexStatus;
  extractionPriority: "high" | "medium";
  studentUse: string;
  nextAction: string;
};

export type SyllabusNode = {
  id: string;
  title: string;
  demand: string;
  basicsLayer: string;
  advancedLayer: string;
  currentAffairsHook: string;
  trendSignal: string;
};

export type PyqImportRow = {
  year: number;
  stage: SourceStage;
  paper: string;
  sourceHref: string;
  status: ImportStatus;
  nextAction: string;
};

export type PyqTrendInsight = {
  id: string;
  label: string;
  syllabusArea: string;
  prelimsWeight: TrendWeight;
  mainsWeight: TrendWeight;
  trendWindow: string;
  pyqSignal: string;
  nextYearWatch: string;
  contentDesign: string;
  dailyPlannerUse: string;
  evidenceLevel: TrendEvidenceLevel;
};

export type SubjectSystematicPath = {
  basicsStart: string;
  advancedBridge: string;
  pyqTrendRule: string;
  nextYearFocusRule: string;
  currentAffairsRule: string;
  gapRule: string;
  revisionRule: string;
};

export type SubjectSourcePack = {
  slug: string;
  title: string;
  route: string;
  syllabusSource: string;
  syllabusNodes: SyllabusNode[];
  pyqRows: PyqImportRow[];
  trendInsights: PyqTrendInsight[];
  systematicPath: SubjectSystematicPath;
  readinessScore: number;
};

export type OptionalSourcePack = {
  slug: string;
  title: string;
  group: string;
  route: string;
  paperRows: PyqImportRow[];
  yearRows: OptionalYearPaperRow[];
  syllabusThemes: OptionalSyllabusTheme[];
  paperSummary: OptionalPaperSummary[];
  assemblyProof: OptionalAssemblyProof;
  readinessScore: number;
};

export type OptionalYearPaperRow = {
  year: number;
  paperI: PyqImportRow;
  paperII: PyqImportRow;
  indexedCount: number;
  importCount: number;
};

export type OptionalSyllabusTheme = {
  id: string;
  title: string;
  paper: "Paper I" | "Paper II" | "Both papers";
  syllabusDemand: string;
  trendUse: string;
  answerWritingUse: string;
};

export type OptionalPaperSummary = {
  paper: "Paper I" | "Paper II";
  totalRows: number;
  indexedRows: number;
  pendingRows: number;
  nextAction: string;
};

export type OptionalAssemblyProof = {
  yearWindow: string;
  totalYears: number;
  totalPaperRows: number;
  paperRowsPerYear: number;
  sourceIndexedYears: number;
  pendingTextYears: number;
  paperStructure: string;
  sourceRule: string;
  studentUse: string;
  nextImportStep: string;
};

export const officialSourceAnchors: OfficialSourceAnchor[] = [
  {
    id: "cse-2025-notification",
    title: "Civil Services Examination 2025 Notification",
    year: 2025,
    stage: "Notification",
    href: "https://upsc.gov.in/sites/default/files/Notif-CSP-2025-Engl-220125.pdf",
    note: "Primary syllabus and scheme anchor for Prelims, Mains GS, Essay, and optional-paper structure.",
  },
  {
    id: "upsc-previous-question-papers",
    title: "UPSC Previous Question Papers Index",
    stage: "Mains",
    href: "https://upsc.gov.in/examinations/previous-question-papers?field_exam_name_value=civil+services",
    note: "Official index for Civil Services preliminary, mains, GS, language, and optional question papers.",
  },
  {
    id: "csm-2025-papers",
    title: "Civil Services Main Examination 2025 Question Papers",
    year: 2025,
    stage: "Mains",
    href: "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202025",
    note: "Official page listing GS papers and optional Paper I/II entries for the 2025 mains cycle.",
  },
  {
    id: "csm-2024-papers",
    title: "Civil Services Main Examination 2024 Question Papers",
    year: 2024,
    stage: "Mains",
    href: "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202024",
    note: "Official page listing GS and optional papers for the 2024 mains cycle.",
  },
  {
    id: "csp-2024-papers",
    title: "Civil Services Preliminary Examination 2024 Question Papers",
    year: 2024,
    stage: "Prelims",
    href: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
    note: "Official page listing General Studies Paper I and CSAT for Prelims 2024.",
  },
];

const sourceYears = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];
const mainsSourceYears = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];
const prelimsPapers = ["General Studies Paper I", "CSAT Paper II"];
const mainsGeneralStudiesPapers = [
  "Essay",
  "General Studies Paper - I",
  "General Studies Paper - II",
  "General Studies Paper - III",
  "General Studies Paper - IV",
];

function previousQuestionPapersHref(year: number) {
  if (year === 2025) return officialSourceAnchors.find((source) => source.id === "csm-2025-papers")!.href;
  if (year === 2024) return officialSourceAnchors.find((source) => source.id === "csm-2024-papers")!.href;
  return officialSourceAnchors.find((source) => source.id === "upsc-previous-question-papers")!.href;
}

function paperId(parts: Array<string | number>) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function prelimsPaperSource(year: number) {
  const sourceAnchorId = year === 2024 ? "csp-2024-papers" : "upsc-previous-question-papers";
  const sourceHref = officialSourceAnchors.find((source) => source.id === sourceAnchorId)!.href;

  return {
    sourceAnchorId,
    sourceHref,
    status: sourceAnchorId === "csp-2024-papers" ? ("direct-paper-page-linked" as const) : ("official-index-linked" as const),
  };
}

function mainsPaperSource(year: number) {
  const sourceAnchorId = year === 2025 ? "csm-2025-papers" : year === 2024 ? "csm-2024-papers" : "upsc-previous-question-papers";
  const sourceHref = officialSourceAnchors.find((source) => source.id === sourceAnchorId)!.href;

  return {
    sourceAnchorId,
    sourceHref,
    status:
      sourceAnchorId === "upsc-previous-question-papers" ? ("official-index-linked" as const) : ("direct-paper-page-linked" as const),
  };
}

function buildOfficialPaperIndexRows(): OfficialPaperIndexRow[] {
  const prelimsRows = sourceYears.flatMap((year) => {
    const source = prelimsPaperSource(year);

    return prelimsPapers.map((paper) => ({
      id: paperId(["official", "prelims", year, paper]),
      year,
      stage: "Prelims" as const,
      exam: "Civil Services Preliminary Examination",
      paper,
      ...source,
      extractionPriority: paper === "General Studies Paper I" ? ("high" as const) : ("medium" as const),
      studentUse:
        paper === "General Studies Paper I"
          ? "Tag subject-wise prelims concepts, elimination traps, map/current hooks, and static-current bridges."
          : "Keep CSAT source availability visible without mixing it into GS subject trend claims.",
      nextAction: "Extract exact question text from the official paper, then tag topic, syllabus line, and demand type.",
    }));
  });

  const mainsGsRows = mainsSourceYears.flatMap((year) => {
    const source = mainsPaperSource(year);

    return mainsGeneralStudiesPapers.map((paper) => ({
      id: paperId(["official", "mains", year, paper]),
      year,
      stage: "Mains" as const,
      exam: "Civil Services Main Examination",
      paper,
      ...source,
      extractionPriority: paper === "Essay" ? ("medium" as const) : ("high" as const),
      studentUse: "Map answer-writing demand, syllabus line, examples, data hooks, and repeated UPSC command verbs.",
      nextAction: "Extract exact question text, classify command verb, tag GS paper, and connect to the daily planner.",
    }));
  });

  const optionalRows = optionalSubjects.flatMap((subject) =>
    mainsSourceYears.flatMap((year) => {
      const source = mainsPaperSource(year);

      return (["Paper I", "Paper II"] as const).map((paper) => ({
        id: paperId(["official", "optional", year, subject.slug, paper]),
        year,
        stage: "Optional" as const,
        exam: "Civil Services Optional Mains",
        paper: `${subject.title} ${paper}`,
        subjectSlug: subject.slug,
        subjectTitle: subject.title,
        ...source,
        extractionPriority: "medium" as const,
        studentUse: "Build optional-specific year-wise paper pages, syllabus-unit tags, and answer-writing trend boards.",
        nextAction: "Extract optional Paper I/II questions year-wise and map each question to optional syllabus themes.",
      }));
    })
  );

  return [...prelimsRows, ...mainsGsRows, ...optionalRows];
}

export const officialPaperIndexRows = buildOfficialPaperIndexRows();

export const officialPaperIndexSummary = {
  proofRule: "official-paper-index-before-exact-question-import",
  yearWindow: `${sourceYears[sourceYears.length - 1]}-${sourceYears[0]}`,
  prelimsPaperRows: officialPaperIndexRows.filter((row) => row.stage === "Prelims").length,
  gsMainsPaperRows: officialPaperIndexRows.filter((row) => row.stage === "Mains").length,
  optionalPaperIndexRows: officialPaperIndexRows.filter((row) => row.stage === "Optional").length,
  totalPaperIndexRows: officialPaperIndexRows.length,
  directLinkedPaperRows: officialPaperIndexRows.filter((row) => row.status === "direct-paper-page-linked").length,
  indexPagePaperRows: officialPaperIndexRows.filter((row) => row.status === "official-index-linked").length,
  exactQuestionTextRows: 0,
  exactImportRule:
    "No exact question-text claim is made from this index. Exact PYQ rows become live only after verified question text is imported and reviewed.",
  nextAction:
    "Use the direct-linked 2024/2025 paper pages first, then work backwards through the official UPSC previous-question-papers index.",
};

function subjectNodes(slug: string): SyllabusNode[] {
  const commonTrend = "Map the last 10 years of prelims and mains questions, then tag repeated demand and trap style.";

  const nodes: Record<string, SyllabusNode[]> = {
    geography: [
      {
        id: "geo-physical",
        title: "Physical geography",
        demand: "Geomorphology, climatology, oceanography, earth structure, and process-based explanation.",
        basicsLayer: "Class 6-12 NCERT earth, climate, water, and landform foundations.",
        advancedLayer: "GC Leong, Savindra Singh-style process depth, and atlas-supported examples.",
        currentAffairsHook: "Monsoon variation, earthquakes, cyclones, landslides, heatwaves, and water stress.",
        trendSignal: commonTrend,
      },
      {
        id: "geo-india",
        title: "Indian geography and mapping",
        demand: "Relief, rivers, monsoon, resources, agriculture, settlements, industries, and regional distribution.",
        basicsLayer: "NCERT India physical environment and atlas orientation.",
        advancedLayer: "Majid Husain-style regional logic plus map-based resource and agriculture analysis.",
        currentAffairsHook: "Places in news, river disputes, disasters, crops, minerals, and infrastructure corridors.",
        trendSignal: commonTrend,
      },
      {
        id: "geo-human",
        title: "Human and economic geography",
        demand: "Population, migration, settlement, economic activities, transport, trade, and regional development.",
        basicsLayer: "NCERT human geography concepts and India economic geography basics.",
        advancedLayer: "Models, location theory, regional planning, and mains answer examples.",
        currentAffairsHook: "Census, urbanisation, logistics, regional inequality, and economic geography of schemes.",
        trendSignal: commonTrend,
      },
    ],
    environment: [
      {
        id: "env-ecology",
        title: "Ecology and biodiversity",
        demand: "Ecosystems, cycles, protected areas, species, conventions, and conservation institutions.",
        basicsLayer: "NCERT biology ecology units plus environment basics.",
        advancedLayer: "Shankar IAS-style ecology, species, conventions, and applied conservation traps.",
        currentAffairsHook: "Species in news, Ramsar, CITES, COP, reports, protected-area notifications.",
        trendSignal: commonTrend,
      },
      {
        id: "env-climate",
        title: "Climate, pollution, and governance",
        demand: "Climate science, agreements, pollution, EIA, environmental institutions, and India policy.",
        basicsLayer: "NCERT environment and chemistry basics for pollution and climate.",
        advancedLayer: "Convention articles, policy mechanisms, institutional mandates, and case studies.",
        currentAffairsHook: "COP decisions, air quality, waste rules, climate finance, and carbon markets.",
        trendSignal: commonTrend,
      },
    ],
    "polity-governance": [
      {
        id: "polity-constitution",
        title: "Constitution and institutions",
        demand: "Constitutional provisions, Parliament, judiciary, federalism, rights, DPSP, and bodies.",
        basicsLayer: "NCERT political science and Constitution basics.",
        advancedLayer: "Laxmikanth-style provisions, landmark cases, committees, and constitutional debates.",
        currentAffairsHook: "Judgments, bills, appointments, federal disputes, commissions, and governance reforms.",
        trendSignal: commonTrend,
      },
      {
        id: "polity-governance",
        title: "Governance and schemes",
        demand: "Transparency, accountability, e-governance, welfare delivery, social justice, and institutions.",
        basicsLayer: "NCERT social and political life plus basic public administration vocabulary.",
        advancedLayer: "ARC reports, committee recommendations, case studies, and mains frameworks.",
        currentAffairsHook: "Schemes, reports, portals, DBT, social audit, and rights-based governance.",
        trendSignal: commonTrend,
      },
    ],
    economy: [
      {
        id: "eco-core",
        title: "Macro and public finance",
        demand: "GDP, inflation, banking, monetary policy, fiscal policy, budget, external sector, and growth.",
        basicsLayer: "NCERT economics and basic macro vocabulary.",
        advancedLayer: "Ramesh Singh-style macro logic, budget, Economic Survey, RBI, and policy analysis.",
        currentAffairsHook: "Budget, Survey, RBI updates, inflation data, trade, employment, and schemes.",
        trendSignal: commonTrend,
      },
      {
        id: "eco-sector",
        title: "Sectoral and inclusive economy",
        demand: "Agriculture, industry, services, infrastructure, welfare, poverty, employment, and reforms.",
        basicsLayer: "NCERT Indian economy and sector basics.",
        advancedLayer: "Schemes, committees, data trends, sectoral constraints, and mains-ready examples.",
        currentAffairsHook: "MSP, PLI, logistics, startups, welfare delivery, jobs, and global shocks.",
        trendSignal: commonTrend,
      },
    ],
    "science-tech": [
      {
        id: "snt-applied",
        title: "Applied science and emerging tech",
        demand: "Space, biotech, health, IT, AI, defence, energy, nuclear, and environmental science.",
        basicsLayer: "NCERT science basics from biology, physics, chemistry, and general science.",
        advancedLayer: "Technology mechanisms, mission objectives, applications, risks, ethics, and governance.",
        currentAffairsHook: "ISRO, biotech, AI regulation, cyber, defence tech, diseases, and energy transitions.",
        trendSignal: commonTrend,
      },
    ],
    "disaster-management": [
      {
        id: "dm-risk",
        title: "Risk, hazards, and institutions",
        demand: "Hazard, exposure, vulnerability, NDMA architecture, early warning, response, and recovery.",
        basicsLayer: "NCERT disaster geography and environment hazard basics.",
        advancedLayer: "Sendai Framework, DM Act, NDMA guidelines, case studies, and answer frameworks.",
        currentAffairsHook: "Cyclones, floods, landslides, earthquakes, heatwaves, urban risk, and industrial accidents.",
        trendSignal: commonTrend,
      },
    ],
    "internal-security-society": [
      {
        id: "security-society",
        title: "Security and Indian society",
        demand: "Internal security threats, border management, cyber, society themes, vulnerable sections, and social change.",
        basicsLayer: "NCERT sociology and polity basics for society and state response.",
        advancedLayer: "Security doctrines, committees, social-issue frameworks, and mains answer examples.",
        currentAffairsHook: "Cyber incidents, border issues, social justice updates, migration, and community conflict.",
        trendSignal: commonTrend,
      },
    ],
    history: [
      {
        id: "history-blocks",
        title: "Modern, ancient, medieval, art and culture",
        demand: "Freedom movement, sources, polity, society, religion, economy, culture, architecture, and chronology.",
        basicsLayer: "NCERT ancient, medieval, modern, and art-culture base.",
        advancedLayer: "Bipan Chandra, old NCERT, Nitin Singhania-style culture, source and chronology depth.",
        currentAffairsHook: "GI tags, UNESCO, excavations, personalities, anniversaries, and culture schemes.",
        trendSignal: commonTrend,
      },
    ],
  };

  return nodes[slug] ?? [
    {
      id: `${slug}-integrated`,
      title: "Integrated syllabus demand",
      demand: "Convert syllabus lines into topic, subtopic, PYQ pattern, and current-affairs linkage.",
      basicsLayer: "NCERT foundation layer.",
      advancedLayer: "Reference-book and report layer.",
      currentAffairsHook: "Only linked current affairs after the topic is covered.",
      trendSignal: commonTrend,
    },
  ];
}

function gsPaperForSubject(slug: string) {
  if (slug === "geography" || slug === "history" || slug === "internal-security-society") return "General Studies Paper - I";
  if (slug === "polity-governance") return "General Studies Paper - II";
  if (slug === "economy" || slug === "science-tech" || slug === "disaster-management" || slug === "environment") {
    return "General Studies Paper - III";
  }
  return "General Studies mixed";
}

function subjectSystematicPath(slug: string): SubjectSystematicPath {
  const paths: Record<string, SubjectSystematicPath> = {
    geography: {
      basicsStart: "NCERT map, landform, climate, water, India physical environment, and human geography foundations.",
      advancedBridge: "Reference-book process depth, atlas drills, location theory, resources, agriculture, and regional development.",
      pyqTrendRule: "Read 2015-2025 questions by map anchor, process chain, location trap, and mains explanation demand.",
      nextYearFocusRule: "Treat monsoon, water stress, Himalayan risk, resources, corridors, disasters, and places in news as watch areas, not guaranteed predictions.",
      currentAffairsRule: "Unlock only after linked static topic: monsoon, disasters, rivers, minerals, crops, places in news, and climate events.",
      gapRule: "Student recall must expose missing mechanism, missing map anchor, or one-factor explanation before watch room opens.",
      revisionRule: "Revise weak map/process topics on Day +2, then retest with PYQ-style elimination.",
    },
    environment: {
      basicsStart: "NCERT ecology, biodiversity, pollution, biology, and basic climate vocabulary.",
      advancedBridge: "Conventions, protected-area logic, environment laws, reports, species, pollution standards, and policy instruments.",
      pyqTrendRule: "Read 2015-2025 questions by species, convention, protected-area category, pollutant, report, and institution traps.",
      nextYearFocusRule: "Watch climate finance, carbon markets, protected-area changes, species in news, pollution rules, and COP-linked updates without making exact-paper claims.",
      currentAffairsRule: "Unlock only where ecology, convention, species, or policy topic is already covered.",
      gapRule: "Student recall must separate term-definition memory from cause-impact-control reasoning.",
      revisionRule: "Revisit species, conventions, and pollution indicators through spaced mixed drills.",
    },
    "polity-governance": {
      basicsStart: "NCERT Constitution, rights, Parliament, federalism, local government, and basic governance language.",
      advancedBridge: "Laxmikanth provisions, landmark cases, committees, ARC, governance schemes, and mains frameworks.",
      pyqTrendRule: "Read 2015-2025 questions by article, body, procedure, limitation, case principle, and governance reform demand.",
      nextYearFocusRule: "Watch judgments, bills, federal disputes, elections, constitutional bodies, welfare delivery, and digital governance as focus zones only.",
      currentAffairsRule: "Unlock bills, judgments, appointments, federal disputes, and governance reforms after matching static chapter.",
      gapRule: "Student recall must cite provision, institution, accountability tool, or case principle.",
      revisionRule: "Revision alternates articles/institutions with application-based mains prompts.",
    },
    economy: {
      basicsStart: "NCERT macro, money, banking, budget, inflation, external sector, and development basics.",
      advancedBridge: "Budget, Economic Survey, RBI, fiscal policy, sector constraints, data interpretation, and reform logic.",
      pyqTrendRule: "Read 2015-2025 questions by concept, data source, institution, policy instrument, sector, and consequence.",
      nextYearFocusRule: "Watch inflation, fiscal choices, jobs, trade, banking, welfare, agriculture, logistics, and climate-economy links as priority signals.",
      currentAffairsRule: "Unlock fiscal, monetary, trade, jobs, agriculture, welfare, and infrastructure updates after static base.",
      gapRule: "Student recall must connect concept, data, institution, and policy consequence.",
      revisionRule: "Revise weak economy areas with data cards plus applied MCQs.",
    },
    "science-tech": {
      basicsStart: "NCERT physics, chemistry, biology, space, energy, health, and everyday science fundamentals.",
      advancedBridge: "Applications, mission objectives, mechanisms, risk, ethics, governance, and emerging-technology examples.",
      pyqTrendRule: "Read 2015-2025 questions by mechanism, application, institution, mission objective, risk, and governance angle.",
      nextYearFocusRule: "Watch AI governance, space missions, biotech, cyber, semiconductors, health tech, defence tech, and clean energy without overstating prediction certainty.",
      currentAffairsRule: "Unlock only technology-in-news items that match completed science mechanisms.",
      gapRule: "Student recall must explain mechanism, application, and risk in simple language.",
      revisionRule: "Revision uses mechanism diagrams, application traps, and current affairs bridges.",
    },
    "disaster-management": {
      basicsStart: "Hazard, exposure, vulnerability, capacity, early warning, and geography-linked disaster basics.",
      advancedBridge: "DM Act, NDMA guidelines, Sendai Framework, institutional flow, case studies, and response frameworks.",
      pyqTrendRule: "Read 2015-2025 questions by hazard-risk chain, institution, mitigation, preparedness, response, and case-study demand.",
      nextYearFocusRule: "Watch heatwaves, urban floods, landslides, earthquakes, cyclones, industrial accidents, and early-warning systems as risk themes.",
      currentAffairsRule: "Unlock disaster events after the relevant hazard and institution chain is covered.",
      gapRule: "Student recall must separate hazard from disaster risk and response from mitigation.",
      revisionRule: "Revision converts each disaster into risk-cause-impact-response-prevention grids.",
    },
    "internal-security-society": {
      basicsStart: "NCERT society, social change, diversity, state, borders, security vocabulary, and cyber basics.",
      advancedBridge: "Internal security doctrines, border management, cyber, extremism, society frameworks, and vulnerable-section themes.",
      pyqTrendRule: "Read 2015-2025 questions by cause, stakeholder, threat type, legal tool, institution, and social impact.",
      nextYearFocusRule: "Watch cyber security, border management, migration, vulnerable groups, social cohesion, extremism, and tech-enabled threats.",
      currentAffairsRule: "Unlock cases only after the social/security concept is covered.",
      gapRule: "Student recall must identify cause, stakeholder, institution, and policy response.",
      revisionRule: "Revision uses issue-maps and answer frameworks rather than isolated facts.",
    },
    history: {
      basicsStart: "NCERT ancient, medieval, modern, and art-culture chronology, personalities, sources, and institutions.",
      advancedBridge: "Old NCERT/Bipan Chandra/Nitin Singhania-style source, culture, movement, and theme depth.",
      pyqTrendRule: "Read 2015-2025 questions by source, period, region, personality, movement, art form, and chronology trap.",
      nextYearFocusRule: "Watch heritage sites, excavations, GI/culture themes, anniversaries, reform movements, and personalities as focus areas only.",
      currentAffairsRule: "Unlock culture/news links only after matching monument, movement, personality, or theme is covered.",
      gapRule: "Student recall must place event/source/art form in timeline, region, and theme.",
      revisionRule: "Revision rotates chronology, source-based traps, art-culture images, and movement themes.",
    },
  };

  return (
    paths[slug] ?? {
      basicsStart: "NCERT foundation layer before reference-book depth.",
      advancedBridge: "Reference material, PYQ traps, reports, and answer frameworks.",
      pyqTrendRule: "Read the last 10 years by repeated syllabus area, trap type, and answer demand.",
      nextYearFocusRule: "Use trend signals to choose watch areas, not to claim exact question prediction.",
      currentAffairsRule: "Unlock only after the static topic has been completed.",
      gapRule: "Student recall must expose concept, fact, application, or source gaps.",
      revisionRule: "Revision follows weak-topic evidence from recall and MCQ score.",
    }
  );
}

function subjectTrendInsights(slug: string): PyqTrendInsight[] {
  const trendWindow = "2015-2025";
  const evidenceLevel: TrendEvidenceLevel = "topic-pattern-model";
  const commonDailyUse = "Use this signal to choose recall prompts, watch-room examples, MCQ difficulty, and revision spacing.";

  const insights: Record<string, PyqTrendInsight[]> = {
    geography: [
      {
        id: "geo-map-process",
        label: "Map plus process explanation",
        syllabusArea: "Physical and Indian geography",
        prelimsWeight: "High",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Questions repeatedly reward location, mechanism, and elimination rather than isolated place memory.",
        nextYearWatch: "Monsoon variability, rivers, minerals, disasters, crops, corridors, and places in news.",
        contentDesign: "Start with NCERT map logic, then add atlas proof, process animation, and PYQ-style traps.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
      {
        id: "geo-human-economic",
        label: "Human and economic geography application",
        syllabusArea: "Population, settlement, industry, transport, regional development",
        prelimsWeight: "Medium",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Mains demand often asks why a pattern occurs and how geography shapes policy or development.",
        nextYearWatch: "Urbanisation, migration, logistics, regional inequality, resource security, and climate adaptation.",
        contentDesign: "Convert each topic into cause-factor-map-example-answer chain.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ],
    environment: [
      {
        id: "env-convention-species",
        label: "Species, protected areas, and conventions",
        syllabusArea: "Ecology, biodiversity, conservation governance",
        prelimsWeight: "High",
        mainsWeight: "Medium",
        trendWindow,
        pyqSignal: "Prelims repeatedly tests category, habitat, treaty, institution, and location traps.",
        nextYearWatch: "Ramsar, CITES, CMS, COP decisions, invasive species, protected-area changes, and species in news.",
        contentDesign: "Build species-habitat-map-institution cards after ecology basics.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
      {
        id: "env-climate-policy",
        label: "Climate and pollution governance",
        syllabusArea: "Climate science, pollution, EIA, environmental institutions",
        prelimsWeight: "High",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Questions blend science terms with policy instruments and institutional mandates.",
        nextYearWatch: "Carbon markets, climate finance, air quality, waste rules, EIA, and green transition debates.",
        contentDesign: "Teach mechanism first, then convention/policy, then current-affairs hook.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ],
    "polity-governance": [
      {
        id: "polity-institution-provision",
        label: "Institution and constitutional provision",
        syllabusArea: "Constitution, Parliament, judiciary, federalism, bodies",
        prelimsWeight: "High",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Prelims tests provisions and bodies; mains asks institutional balance, reform, and accountability.",
        nextYearWatch: "Judgments, bills, federal disputes, constitutional bodies, elections, and governance reforms.",
        contentDesign: "Pair every article/body with role, limitation, current trigger, and mains angle.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
      {
        id: "governance-delivery",
        label: "Governance delivery and accountability",
        syllabusArea: "Transparency, welfare, e-governance, social justice",
        prelimsWeight: "Medium",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Mains demand rewards examples, committees, case studies, and implementation logic.",
        nextYearWatch: "DBT, social audit, digital governance, public service delivery, and welfare outcomes.",
        contentDesign: "Convert schemes and governance tools into problem-tool-limitation-reform frameworks.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ],
    economy: [
      {
        id: "eco-macro-policy",
        label: "Macro policy and data interpretation",
        syllabusArea: "Growth, inflation, banking, fiscal policy, external sector",
        prelimsWeight: "High",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Questions reward concept plus institution plus consequence, especially around Budget, RBI, and Survey themes.",
        nextYearWatch: "Inflation, fiscal consolidation, trade, employment, banking, debt, and growth composition.",
        contentDesign: "Teach concept, then data, then policy implication, then MCQ trap.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
      {
        id: "eco-sectoral-inclusive",
        label: "Sectoral and inclusive growth",
        syllabusArea: "Agriculture, industry, infrastructure, poverty, employment, welfare",
        prelimsWeight: "Medium",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Mains asks constraints, reforms, outcomes, and inclusive-development tradeoffs.",
        nextYearWatch: "MSP, PLI, logistics, rural incomes, jobs, welfare delivery, and climate-economy linkages.",
        contentDesign: "Use sector dashboards: issue, data, scheme, bottleneck, reform.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ],
    "science-tech": [
      {
        id: "snt-application-risk",
        label: "Application, risk, and governance",
        syllabusArea: "Space, biotech, health, IT, AI, defence, energy",
        prelimsWeight: "Medium",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Questions usually test mechanism, application, benefit, risk, and ethical or regulatory angle.",
        nextYearWatch: "AI governance, space missions, biotech, vaccines, cyber, semiconductors, nuclear and clean energy.",
        contentDesign: "Explain mechanism visually, then ask application and risk questions.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ],
    "disaster-management": [
      {
        id: "dm-risk-governance",
        label: "Risk reduction and institutional response",
        syllabusArea: "Hazard, exposure, vulnerability, mitigation, response, recovery",
        prelimsWeight: "Selective",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Mains rewards risk-chain thinking and examples more than event narration.",
        nextYearWatch: "Heatwaves, floods, landslides, urban risk, earthquakes, industrial accidents, and early warning.",
        contentDesign: "Use hazard-risk-institution-case-study-answer grids.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ],
    "internal-security-society": [
      {
        id: "security-society-issue-map",
        label: "Issue-map and institutional response",
        syllabusArea: "Internal security, cyber, border management, Indian society",
        prelimsWeight: "Selective",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Mains asks causes, stakeholders, institutions, legal tools, and reforms.",
        nextYearWatch: "Cyber security, border management, social cohesion, migration, vulnerable groups, and extremism.",
        contentDesign: "Build every topic as cause-impact-stakeholder-response-reform.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ],
    history: [
      {
        id: "history-source-culture",
        label: "Source, culture, and chronology traps",
        syllabusArea: "Ancient, medieval, art and culture",
        prelimsWeight: "High",
        mainsWeight: "Medium",
        trendWindow,
        pyqSignal: "Prelims frequently rewards source-location-period matching and art-culture elimination.",
        nextYearWatch: "UNESCO, excavations, inscriptions, monuments, schools of art, GI/culture themes, and personalities.",
        contentDesign: "Pair timeline with map, source, image cue, and elimination trap.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
      {
        id: "history-modern-movement",
        label: "Modern movement themes",
        syllabusArea: "Freedom movement, reform, nationalism, post-1857 developments",
        prelimsWeight: "Medium",
        mainsWeight: "High",
        trendWindow,
        pyqSignal: "Mains rewards thematic explanation: causes, phases, methods, debates, and contributions.",
        nextYearWatch: "Personalities, constitutional development, social reform, peasant/tribal movements, and press/education themes.",
        contentDesign: "Move from chronology to theme to answer framework.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ],
  };

  return (
    insights[slug] ?? [
      {
        id: `${slug}-trend`,
        label: "Syllabus-PYQ-current affairs bridge",
        syllabusArea: "Integrated subject demand",
        prelimsWeight: "Medium",
        mainsWeight: "Medium",
        trendWindow,
        pyqSignal: "Use official papers to tag repeated concepts, traps, and answer demands.",
        nextYearWatch: "Track current-affairs hooks only after static coverage.",
        contentDesign: "Build basics, advanced layer, PYQ pattern, and revision rule together.",
        dailyPlannerUse: commonDailyUse,
        evidenceLevel,
      },
    ]
  );
}

function buildSubjectPyqRows(slug: string): PyqImportRow[] {
  const gsPaper = gsPaperForSubject(slug);
  const prelimsRows = sourceYears.map((year) => ({
    year,
    stage: "Prelims" as const,
    paper: "General Studies Paper I",
    sourceHref:
      year === 2024
        ? officialSourceAnchors.find((source) => source.id === "csp-2024-papers")!.href
        : officialSourceAnchors.find((source) => source.id === "upsc-previous-question-papers")!.href,
    status: year === 2024 ? ("source-indexed" as const) : ("text-import-pending" as const),
    nextAction: "Extract question text, tag subject and subtopic, then connect to daily planner.",
  }));

  const mainsRows = mainsSourceYears.map((year) => ({
    year,
    stage: "Mains" as const,
    paper: gsPaper,
    sourceHref: previousQuestionPapersHref(year),
    status: year === 2025 || year === 2024 ? ("source-indexed" as const) : ("text-import-pending" as const),
    nextAction: "Extract questions, tag syllabus line, trend signal, answer type, and current-affairs hook.",
  }));

  return [...prelimsRows, ...mainsRows];
}

export const subjectSourcePacks: SubjectSourcePack[] = coreSubjectBlueprints.map((subject) => {
  const rows = buildSubjectPyqRows(subject.slug);
  const indexedRows = rows.filter((row) => row.status !== "text-import-pending").length;

  return {
    slug: subject.slug,
    title: subject.title,
    route: subject.route,
    syllabusSource: officialSourceAnchors.find((source) => source.id === "cse-2025-notification")!.href,
    syllabusNodes: subjectNodes(subject.slug),
    pyqRows: rows,
    trendInsights: subjectTrendInsights(subject.slug),
    systematicPath: subjectSystematicPath(subject.slug),
    readinessScore: Math.round((indexedRows / rows.length) * 100),
  };
});

function optionalRows(title: string): PyqImportRow[] {
  return mainsSourceYears.flatMap((year) => [
    {
      year,
      stage: "Optional" as const,
      paper: `${title} Paper I`,
      sourceHref: previousQuestionPapersHref(year),
      status: year === 2025 || year === 2024 ? ("source-indexed" as const) : ("text-import-pending" as const),
      nextAction: "Extract Paper I questions year-wise and map them to optional syllabus units.",
    },
    {
      year,
      stage: "Optional" as const,
      paper: `${title} Paper II`,
      sourceHref: previousQuestionPapersHref(year),
      status: year === 2025 || year === 2024 ? ("source-indexed" as const) : ("text-import-pending" as const),
      nextAction: "Extract Paper II questions year-wise and map them to optional syllabus units.",
    },
  ]);
}

const optionalThemeProfiles: Record<string, OptionalSyllabusTheme[]> = {
  anthropology: [
    {
      id: "anthro-foundation",
      title: "Physical and social anthropology",
      paper: "Paper I",
      syllabusDemand: "Theory, evolution, biological anthropology, kinship, marriage, religion, and anthropological methods.",
      trendUse: "Separate concept-definition questions from theory-application questions before writing answers.",
      answerWritingUse: "Use thinkers, diagrams, tribal examples, and short comparative tables.",
    },
    {
      id: "anthro-india",
      title: "Indian anthropology and tribal issues",
      paper: "Paper II",
      syllabusDemand: "Indian society, tribal communities, constitutional safeguards, development, and contemporary challenges.",
      trendUse: "Map repeated tribal-development themes, vulnerability, policy, and case-study demand year-wise.",
      answerWritingUse: "Join syllabus terms with constitutional provisions, committee points, and field examples.",
    },
  ],
  geography: [
    {
      id: "geo-optional-physical",
      title: "Physical geography models and processes",
      paper: "Paper I",
      syllabusDemand: "Geomorphology, climatology, oceanography, biogeography, and environmental geography.",
      trendUse: "Track diagrams, theories, process explanation, and model-criticism questions separately.",
      answerWritingUse: "Use map, diagram, process chain, scholar/model, and contemporary example.",
    },
    {
      id: "geo-optional-india",
      title: "Indian geography and regional planning",
      paper: "Paper II",
      syllabusDemand: "Resources, agriculture, industry, population, settlements, regional planning, and contemporary India issues.",
      trendUse: "Tag India-specific location, development, regional inequality, and planning questions year-wise.",
      answerWritingUse: "Use India maps, data, committee/report hooks, and balanced regional analysis.",
    },
  ],
  "public-administration": [
    {
      id: "pubad-theory",
      title: "Administrative theory",
      paper: "Paper I",
      syllabusDemand: "Thinkers, theories, accountability, personnel, financial administration, and comparative administration.",
      trendUse: "Track theory-versus-application questions and repeated thinker clusters.",
      answerWritingUse: "Use thinker quote, administrative example, criticism, and reform angle.",
    },
    {
      id: "pubad-india",
      title: "Indian administration",
      paper: "Paper II",
      syllabusDemand: "Constitutional framework, civil services, district administration, local governance, welfare, and reforms.",
      trendUse: "Map governance issues to committees, ARC, case studies, and current administrative reforms.",
      answerWritingUse: "Use constitutional anchor, institution, issue, reform, and implementation examples.",
    },
  ],
  sociology: [
    {
      id: "sociology-theory",
      title: "Sociological theory and methods",
      paper: "Paper I",
      syllabusDemand: "Thinkers, concepts, stratification, mobility, religion, politics, economy, and research methods.",
      trendUse: "Separate theoretical comparison, concept application, and contemporary social-change demand.",
      answerWritingUse: "Use thinker, concept, Indian example, and balanced criticism.",
    },
    {
      id: "sociology-india",
      title: "Indian society",
      paper: "Paper II",
      syllabusDemand: "Caste, tribe, class, family, religion, social movements, population, and development issues.",
      trendUse: "Map repeated themes around caste, gender, rural change, urbanisation, and movements.",
      answerWritingUse: "Use sociological vocabulary, committee/data hooks, and grounded Indian examples.",
    },
  ],
};

function defaultOptionalThemes(title: string, group: string): OptionalSyllabusTheme[] {
  const paperIBase =
    group === "Literature"
      ? "Language history, literary criticism, major genres, movements, and prescribed-text context."
      : group === "Engineering"
        ? "Core principles, design logic, numerical concepts, systems, and technical fundamentals."
        : group === "Medical"
          ? "Basic medical science, systems, pathology, pharmacology, public health, and clinical foundations."
          : "Core theory, definitions, methods, foundational thinkers, and paper-specific concepts.";
  const paperIIBase =
    group === "Literature"
      ? "Prescribed authors, texts, themes, criticism, language-specific literary development, and answer interpretation."
      : group === "Engineering"
        ? "Applied systems, design problems, industrial application, infrastructure, and problem-solving patterns."
        : group === "Medical"
          ? "Clinical application, public health, medicine, surgery, community health, and case-oriented reasoning."
          : "Applied India-specific themes, case studies, contemporary issues, and paper-specific answer frameworks.";

  return [
    {
      id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-paper-i-theme`,
      title: `${title} Paper I demand`,
      paper: "Paper I",
      syllabusDemand: paperIBase,
      trendUse: "Track repeated units, question verbs, and answer-pattern demand year-wise.",
      answerWritingUse: "Use definitions, structure, examples, diagrams/tables where useful, and precise optional vocabulary.",
    },
    {
      id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-paper-ii-theme`,
      title: `${title} Paper II demand`,
      paper: "Paper II",
      syllabusDemand: paperIIBase,
      trendUse: "Track repeated applied themes, case-study demand, and paper-specific scoring areas.",
      answerWritingUse: "Use syllabus keywords, applied examples, concise evaluation, and year-wise trend awareness.",
    },
  ];
}

function optionalThemes(slug: string, title: string, group: string) {
  return optionalThemeProfiles[slug] ?? defaultOptionalThemes(title, group);
}

function optionalYearRows(rows: PyqImportRow[]): OptionalYearPaperRow[] {
  return mainsSourceYears.map((year) => {
    const yearRows = rows.filter((row) => row.year === year);
    const paperI = yearRows.find((row) => row.paper.endsWith("Paper I")) ?? yearRows[0];
    const paperII = yearRows.find((row) => row.paper.endsWith("Paper II")) ?? yearRows[1];
    const indexedCount = yearRows.filter((row) => row.status !== "text-import-pending").length;

    return {
      year,
      paperI,
      paperII,
      indexedCount,
      importCount: yearRows.length,
    };
  });
}

function optionalPaperSummary(rows: PyqImportRow[]): OptionalPaperSummary[] {
  return (["Paper I", "Paper II"] as const).map((paper) => {
    const paperRows = rows.filter((row) => row.paper.endsWith(paper));
    const indexedRows = paperRows.filter((row) => row.status !== "text-import-pending").length;

    return {
      paper,
      totalRows: paperRows.length,
      indexedRows,
      pendingRows: paperRows.length - indexedRows,
      nextAction:
        indexedRows > 0
          ? "Extract indexed papers first, then tag every question to syllabus units and answer themes."
          : "Connect official source rows before extracting paper text and topic tags.",
    };
  });
}

function optionalAssemblyProof(yearRows: OptionalYearPaperRow[]): OptionalAssemblyProof {
  const sortedYears = [...yearRows].sort((left, right) => left.year - right.year);
  const firstYear = sortedYears[0]?.year ?? mainsSourceYears[mainsSourceYears.length - 1];
  const latestYear = sortedYears[sortedYears.length - 1]?.year ?? mainsSourceYears[0];
  const sourceIndexedYears = yearRows.filter((row) => row.indexedCount === row.importCount).length;
  const totalPaperRows = yearRows.reduce((sum, row) => sum + row.importCount, 0);

  return {
    yearWindow: `${firstYear}-${latestYear}`,
    totalYears: yearRows.length,
    totalPaperRows,
    paperRowsPerYear: 2,
    sourceIndexedYears,
    pendingTextYears: yearRows.length - sourceIndexedYears,
    paperStructure: "Paper I and Paper II are assembled for every year in the optional mains window.",
    sourceRule: "Rows point to official UPSC paper sources; source-indexed years are ready for immediate extraction and topic mapping.",
    studentUse: "Student can open a year, compare Paper I and Paper II demand, then connect the paper to syllabus themes and answer-writing practice.",
    nextImportStep: "Extract question text year-wise, tag each question to Paper I or Paper II syllabus units, then build trend and answer prompts.",
  };
}

export const optionalSourcePacks: OptionalSourcePack[] = optionalSubjects.map((subject) => {
  const rows = optionalRows(subject.title);
  const yearRows = optionalYearRows(rows);
  const indexedRows = rows.filter((row) => row.status !== "text-import-pending").length;

  return {
    slug: subject.slug,
    title: subject.title,
    group: subject.group,
    route: subject.route,
    paperRows: rows,
    yearRows,
    syllabusThemes: optionalThemes(subject.slug, subject.title, subject.group),
    paperSummary: optionalPaperSummary(rows),
    assemblyProof: optionalAssemblyProof(yearRows),
    readinessScore: Math.round((indexedRows / rows.length) * 100),
  };
});

export function getSubjectSourcePack(slug: string) {
  return subjectSourcePacks.find((subject) => subject.slug === slug);
}

export function getOptionalSourcePack(slug: string) {
  return optionalSourcePacks.find((subject) => subject.slug === slug);
}

export const syllabusPyqRegistrySummary = {
  coreSubjectCount: subjectSourcePacks.length,
  optionalSubjectCount: optionalSourcePacks.length,
  gsPyqRows: subjectSourcePacks.reduce((sum, subject) => sum + subject.pyqRows.length, 0),
  optionalPyqRows: optionalSourcePacks.reduce((sum, subject) => sum + subject.paperRows.length, 0),
  trendInsightCount: subjectSourcePacks.reduce((sum, subject) => sum + subject.trendInsights.length, 0),
  officialAnchorCount: officialSourceAnchors.length,
  yearWindow: `${sourceYears[sourceYears.length - 1]}-${sourceYears[0]}`,
  sourceIndexedRows:
    subjectSourcePacks.reduce((sum, subject) => sum + subject.pyqRows.filter((row) => row.status !== "text-import-pending").length, 0) +
    optionalSourcePacks.reduce((sum, subject) => sum + subject.paperRows.filter((row) => row.status !== "text-import-pending").length, 0),
};

export const syllabusPyqPreloadAudit = {
  ...syllabusPyqRegistrySummary,
  totalPyqRows: syllabusPyqRegistrySummary.gsPyqRows + syllabusPyqRegistrySummary.optionalPyqRows,
  officialPaperIndexRows: officialPaperIndexSummary.totalPaperIndexRows,
  directlyLinkedOfficialPapers: officialPaperIndexSummary.directLinkedPaperRows,
  exactQuestionTextRows: officialPaperIndexSummary.exactQuestionTextRows,
  textImportPendingRows:
    syllabusPyqRegistrySummary.gsPyqRows +
    syllabusPyqRegistrySummary.optionalPyqRows -
    syllabusPyqRegistrySummary.sourceIndexedRows,
  proofRule: "core-and-optional-official-source-row-preload",
  statusRule:
    "Source-indexed rows point to official UPSC paper pages; text-import-pending rows still require PDF text extraction and topic mapping.",
};
