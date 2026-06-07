import { coreSubjectBlueprints, optionalSubjects } from "@/lib/upsc/yearlyPlanner";

export type SourceStage = "Prelims" | "Mains" | "Optional";
export type ImportStatus = "source-indexed" | "topic-mapped" | "text-import-pending";

export type OfficialSourceAnchor = {
  id: string;
  title: string;
  year?: number;
  stage: SourceStage | "Notification";
  href: string;
  note: string;
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

export type SubjectSourcePack = {
  slug: string;
  title: string;
  route: string;
  syllabusSource: string;
  syllabusNodes: SyllabusNode[];
  pyqRows: PyqImportRow[];
  readinessScore: number;
};

export type OptionalSourcePack = {
  slug: string;
  title: string;
  group: string;
  route: string;
  paperRows: PyqImportRow[];
  readinessScore: number;
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

function previousQuestionPapersHref(year: number) {
  if (year === 2025) return officialSourceAnchors.find((source) => source.id === "csm-2025-papers")!.href;
  if (year === 2024) return officialSourceAnchors.find((source) => source.id === "csm-2024-papers")!.href;
  return officialSourceAnchors.find((source) => source.id === "upsc-previous-question-papers")!.href;
}

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

export const optionalSourcePacks: OptionalSourcePack[] = optionalSubjects.map((subject) => {
  const rows = optionalRows(subject.title);
  const indexedRows = rows.filter((row) => row.status !== "text-import-pending").length;

  return {
    slug: subject.slug,
    title: subject.title,
    group: subject.group,
    route: subject.route,
    paperRows: rows,
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
  sourceIndexedRows:
    subjectSourcePacks.reduce((sum, subject) => sum + subject.pyqRows.filter((row) => row.status !== "text-import-pending").length, 0) +
    optionalSourcePacks.reduce((sum, subject) => sum + subject.paperRows.filter((row) => row.status !== "text-import-pending").length, 0),
};
