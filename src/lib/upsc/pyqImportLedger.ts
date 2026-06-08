import {
  officialPaperIndexRows,
  officialPaperIndexSummary,
  optionalSourcePacks,
  subjectSourcePacks,
  type SourceStage,
} from "@/lib/upsc/syllabusPyqRegistry";

export const PYQ_IMPORT_LEDGER_KEY = "sarit-upsc-pyq-import-ledger-v1";

export type PyqQuestionKind = "GS_PRELIMS" | "GS_MAINS" | "OPTIONAL_MAINS";
export type PyqImportStatus = "MAPPED" | "NEEDS_REVIEW";
export type PyqTextStatus = "EXACT_VERIFIED" | "PATTERN_SEED";

export type PyqImportCsvRow = {
  year?: string;
  stage?: string;
  subject_slug?: string;
  paper?: string;
  question_number?: string;
  question_text?: string;
  syllabus_area?: string;
  syllabus_node_id?: string;
  topic_tags?: string;
  trend_insight_id?: string;
  source_href?: string;
  official_source_title?: string;
  answer_demand?: string;
};

export type PyqImportRecord = {
  id: string;
  year: number;
  stage: SourceStage;
  kind: PyqQuestionKind;
  subjectSlug: string;
  subjectTitle: string;
  paper: string;
  questionNumber: string;
  questionText: string;
  syllabusArea: string;
  syllabusNodeId?: string;
  topicTags: string[];
  trendInsightId?: string;
  sourceHref: string;
  officialSourceTitle?: string;
  answerDemand?: string;
  importStatus: PyqImportStatus;
  textStatus: PyqTextStatus;
  importedAt: string;
};

export type PyqImportValidationIssue = {
  rowNumber: number;
  reason: string;
  row: PyqImportCsvRow;
};

export type PyqImportParseResult = {
  accepted: PyqImportRecord[];
  rejected: PyqImportValidationIssue[];
};

export type PyqImportCoverageRow = {
  slug: string;
  title: string;
  route: string;
  sourceRows: number;
  importedQuestions: number;
  exactVerifiedQuestions: number;
  seededPatterns: number;
  mappedQuestions: number;
  needsReview: number;
  trendBoards: number;
  coveragePercent: number;
};

export type PyqImportPipelineStageStatus = "complete" | "active" | "pending";

export type PyqImportPipelineStage = {
  id: string;
  title: string;
  status: PyqImportPipelineStageStatus;
  rowCount: number;
  proof: string;
  nextAction: string;
  studentImpact: string;
};

export type ExactPyqImportReadiness = {
  proofRule: string;
  officialPaperIndexRows: number;
  directLinkedOfficialPapers: number;
  indexLinkedOfficialPapers: number;
  highPriorityPaperRows: number;
  exactQuestionTextRows: number;
  mappedExactQuestionRows: number;
  needsReviewRows: number;
  strictCoveragePercent: number;
  studentReady: boolean;
  studentReadyLabel: string;
  nextQueueRule: string;
  sourceLibraryPath: string;
  stages: PyqImportPipelineStage[];
};

function isSourceStage(value: unknown): value is SourceStage {
  return value === "Prelims" || value === "Mains" || value === "Optional";
}

function isQuestionKind(value: unknown): value is PyqQuestionKind {
  return value === "GS_PRELIMS" || value === "GS_MAINS" || value === "OPTIONAL_MAINS";
}

function isImportStatus(value: unknown): value is PyqImportStatus {
  return value === "MAPPED" || value === "NEEDS_REVIEW";
}

function isTextStatus(value: unknown): value is PyqTextStatus {
  return value === "EXACT_VERIFIED" || value === "PATTERN_SEED";
}

function requiredRecordText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parsePyqImportRecord(input: unknown): PyqImportRecord | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const year = Number(record.year);
  const stage = record.stage;
  const kind = record.kind;
  const importStatus = record.importStatus;
  const textStatus = record.textStatus;
  const topicTags = Array.isArray(record.topicTags)
    ? record.topicTags.map(requiredRecordText).filter(Boolean)
    : [];

  if (!Number.isInteger(year) || year < 2010 || year > 2026) return null;
  if (!isSourceStage(stage) || !isQuestionKind(kind) || !isImportStatus(importStatus) || !isTextStatus(textStatus)) {
    return null;
  }

  const parsed: PyqImportRecord = {
    id: requiredRecordText(record.id),
    year,
    stage,
    kind,
    subjectSlug: requiredRecordText(record.subjectSlug).toLowerCase(),
    subjectTitle: requiredRecordText(record.subjectTitle),
    paper: requiredRecordText(record.paper),
    questionNumber: requiredRecordText(record.questionNumber),
    questionText: requiredRecordText(record.questionText),
    syllabusArea: requiredRecordText(record.syllabusArea),
    syllabusNodeId: requiredRecordText(record.syllabusNodeId) || undefined,
    topicTags,
    trendInsightId: requiredRecordText(record.trendInsightId) || undefined,
    sourceHref: requiredRecordText(record.sourceHref),
    officialSourceTitle: requiredRecordText(record.officialSourceTitle) || undefined,
    answerDemand: requiredRecordText(record.answerDemand) || undefined,
    importStatus,
    textStatus,
    importedAt: requiredRecordText(record.importedAt),
  };

  if (
    !parsed.id ||
    !parsed.subjectSlug ||
    !parsed.subjectTitle ||
    !parsed.paper ||
    !parsed.questionNumber ||
    !parsed.questionText ||
    !parsed.syllabusArea ||
    !parsed.sourceHref ||
    !parsed.importedAt
  ) {
    return null;
  }

  return parsed;
}

export function parsePyqImportRecords(input: unknown) {
  if (!Array.isArray(input)) return [];
  return dedupePyqImportRecords(input.map(parsePyqImportRecord).filter(Boolean) as PyqImportRecord[]);
}

export const pyqImportCsvColumns: Array<{
  key: keyof PyqImportCsvRow;
  label: string;
  required: boolean;
  detail: string;
}> = [
  {
    key: "year",
    label: "Year",
    required: true,
    detail: "Official paper year, normally 2015-2026 for the current 10-year window.",
  },
  {
    key: "stage",
    label: "Stage",
    required: true,
    detail: "Prelims, Mains, or Optional.",
  },
  {
    key: "subject_slug",
    label: "Subject Slug",
    required: true,
    detail: "GS slug such as geography/economy or optional slug such as anthropology.",
  },
  {
    key: "paper",
    label: "Paper",
    required: true,
    detail: "General Studies Paper I, General Studies Paper III, Anthropology Paper I, etc.",
  },
  {
    key: "question_number",
    label: "Question Number",
    required: true,
    detail: "Stable paper position such as Q1, Q12(a), or GS1-2024-Q3.",
  },
  {
    key: "question_text",
    label: "Question Text",
    required: true,
    detail: "Exact official question text copied from the UPSC paper after verification.",
  },
  {
    key: "syllabus_area",
    label: "Syllabus Area",
    required: true,
    detail: "Human-readable syllabus demand area that the question tests.",
  },
  {
    key: "topic_tags",
    label: "Topic Tags",
    required: true,
    detail: "Pipe-separated tags such as monsoon|ITCZ|jet stream.",
  },
  {
    key: "source_href",
    label: "Official Source URL",
    required: true,
    detail: "Official UPSC paper or source page URL.",
  },
  {
    key: "syllabus_node_id",
    label: "Syllabus Node ID",
    required: false,
    detail: "Optional internal node such as geo-physical or eco-core.",
  },
  {
    key: "trend_insight_id",
    label: "Trend Insight ID",
    required: false,
    detail: "Optional trend board id such as geo-map-process.",
  },
  {
    key: "official_source_title",
    label: "Official Source Title",
    required: false,
    detail: "Optional display name of the official paper/source.",
  },
  {
    key: "answer_demand",
    label: "Answer Demand",
    required: false,
    detail: "For mains: explain/analyse/discuss/evaluate. For prelims: concept/pair/map/elimination.",
  },
];

function csvEscape(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStage(value: string): SourceStage | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "prelims" || normalized === "preliminary") return "Prelims";
  if (normalized === "mains" || normalized === "main") return "Mains";
  if (normalized === "optional") return "Optional";
  return null;
}

function normalizeTopicTags(value: string) {
  return value
    .split(/[|,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sourcePackForSlug(slug: string) {
  const gs = subjectSourcePacks.find((subject) => subject.slug === slug);
  if (gs) return { title: gs.title, route: gs.route, type: "gs" as const };

  const optional = optionalSourcePacks.find((subject) => subject.slug === slug);
  if (optional) return { title: optional.title, route: optional.route, type: "optional" as const };

  return null;
}

function resolveQuestionKind(stage: SourceStage, sourceType: "gs" | "optional"): PyqQuestionKind | null {
  if (stage === "Prelims" && sourceType === "gs") return "GS_PRELIMS";
  if (stage === "Mains" && sourceType === "gs") return "GS_MAINS";
  if (stage === "Optional" && sourceType === "optional") return "OPTIONAL_MAINS";
  return null;
}

function stablePyqId({
  year,
  stage,
  subjectSlug,
  paper,
  questionNumber,
}: {
  year: number;
  stage: SourceStage;
  subjectSlug: string;
  paper: string;
  questionNumber: string;
}) {
  return [year, stage, subjectSlug, paper, questionNumber]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isReviewRecord(record: Omit<PyqImportRecord, "importStatus">) {
  return (
    record.questionText.length < 30 ||
    record.topicTags.length === 0 ||
    !record.syllabusArea ||
    !record.sourceHref.startsWith("http")
  );
}

function buildSeedRecord(input: Omit<PyqImportRecord, "id" | "importStatus" | "importedAt" | "textStatus">): PyqImportRecord {
  return {
    ...input,
    id: stablePyqId({
      year: input.year,
      stage: input.stage,
      subjectSlug: input.subjectSlug,
      paper: input.paper,
      questionNumber: input.questionNumber,
    }),
    importStatus: "MAPPED",
    textStatus: "PATTERN_SEED",
    importedAt: "2026-06-07T00:00:00.000Z",
  };
}

export const seededPyqPatternRecords: PyqImportRecord[] = [
  buildSeedRecord({
    year: 2024,
    stage: "Prelims",
    kind: "GS_PRELIMS",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    paper: "General Studies Paper I",
    questionNumber: "CSP-2024-GEO-MAP-SEED",
    questionText:
      "Pattern seed for an official prelims geography item: map/location reasoning, nearby physical feature, and elimination logic.",
    syllabusArea: "Indian geography and mapping",
    syllabusNodeId: "geo-india",
    topicTags: ["map", "location", "physical feature", "elimination"],
    trendInsightId: "geo-map-process",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Preliminary Examination 2024 Question Papers",
    answerDemand: "Prelims map elimination",
  }),
  buildSeedRecord({
    year: 2024,
    stage: "Mains",
    kind: "GS_MAINS",
    subjectSlug: "geography",
    subjectTitle: "Geography",
    paper: "General Studies Paper - I",
    questionNumber: "CSM-2024-GS1-GEO-PROCESS-SEED",
    questionText:
      "Pattern seed for an official mains geography item: explain a physical or human-geography process with spatial examples.",
    syllabusArea: "Physical and human geography application",
    syllabusNodeId: "geo-physical",
    topicTags: ["process", "spatial example", "mains explanation"],
    trendInsightId: "geo-map-process",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Main Examination 2024 Question Papers",
    answerDemand: "Explain with examples",
  }),
  buildSeedRecord({
    year: 2024,
    stage: "Prelims",
    kind: "GS_PRELIMS",
    subjectSlug: "environment",
    subjectTitle: "Environment",
    paper: "General Studies Paper I",
    questionNumber: "CSP-2024-ENV-SPECIES-SEED",
    questionText:
      "Pattern seed for an official prelims environment item: species, habitat, protected-area or convention-based elimination.",
    syllabusArea: "Ecology and biodiversity",
    syllabusNodeId: "env-ecology",
    topicTags: ["species", "habitat", "protected area", "convention"],
    trendInsightId: "env-convention-species",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Preliminary Examination 2024 Question Papers",
    answerDemand: "Prelims pair matching",
  }),
  buildSeedRecord({
    year: 2024,
    stage: "Prelims",
    kind: "GS_PRELIMS",
    subjectSlug: "economy",
    subjectTitle: "Economy",
    paper: "General Studies Paper I",
    questionNumber: "CSP-2024-ECO-MACRO-SEED",
    questionText:
      "Pattern seed for an official prelims economy item: concept, institution, data signal, and policy consequence.",
    syllabusArea: "Macro and public finance",
    syllabusNodeId: "eco-core",
    topicTags: ["macro", "institution", "policy", "data"],
    trendInsightId: "eco-macro-policy",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Preliminary Examination 2024 Question Papers",
    answerDemand: "Prelims concept application",
  }),
  buildSeedRecord({
    year: 2024,
    stage: "Mains",
    kind: "GS_MAINS",
    subjectSlug: "polity-governance",
    subjectTitle: "Polity and Governance",
    paper: "General Studies Paper - II",
    questionNumber: "CSM-2024-GS2-GOVERNANCE-SEED",
    questionText:
      "Pattern seed for an official mains governance item: institution, accountability, implementation gap, and reform direction.",
    syllabusArea: "Governance delivery and accountability",
    syllabusNodeId: "polity-governance",
    topicTags: ["governance", "accountability", "implementation", "reform"],
    trendInsightId: "governance-delivery",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Main Examination 2024 Question Papers",
    answerDemand: "Discuss with reform measures",
  }),
  buildSeedRecord({
    year: 2024,
    stage: "Prelims",
    kind: "GS_PRELIMS",
    subjectSlug: "science-tech",
    subjectTitle: "Science and Tech",
    paper: "General Studies Paper I",
    questionNumber: "CSP-2024-SNT-APPLICATION-SEED",
    questionText:
      "Pattern seed for an official prelims science-tech item: mechanism, application, risk, and governance implication.",
    syllabusArea: "Applied science and emerging tech",
    syllabusNodeId: "snt-applied",
    topicTags: ["mechanism", "application", "risk", "governance"],
    trendInsightId: "snt-application-risk",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Preliminary Examination 2024 Question Papers",
    answerDemand: "Prelims mechanism application",
  }),
  buildSeedRecord({
    year: 2024,
    stage: "Mains",
    kind: "GS_MAINS",
    subjectSlug: "disaster-management",
    subjectTitle: "Disaster Management",
    paper: "General Studies Paper - III",
    questionNumber: "CSM-2024-GS3-DM-SEED",
    questionText:
      "Pattern seed for an official mains disaster-management item: hazard, vulnerability, response, mitigation and institutional readiness.",
    syllabusArea: "Risk, hazards, and institutions",
    syllabusNodeId: "dm-risk",
    topicTags: ["hazard", "vulnerability", "mitigation", "institution"],
    trendInsightId: "dm-risk-governance",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Main Examination 2024 Question Papers",
    answerDemand: "Analyse risk reduction",
  }),
  buildSeedRecord({
    year: 2024,
    stage: "Mains",
    kind: "GS_MAINS",
    subjectSlug: "internal-security-society",
    subjectTitle: "Internal Security and Indian Society",
    paper: "General Studies Paper - I/III",
    questionNumber: "CSM-2024-SOCIETY-SECURITY-SEED",
    questionText:
      "Pattern seed for an official mains society/security item: cause, stakeholder, institution, legal tool and policy response.",
    syllabusArea: "Security and Indian society",
    syllabusNodeId: "security-society",
    topicTags: ["society", "security", "stakeholder", "policy response"],
    trendInsightId: "security-society-issue-map",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Main Examination 2024 Question Papers",
    answerDemand: "Analyse with stakeholders",
  }),
  buildSeedRecord({
    year: 2024,
    stage: "Prelims",
    kind: "GS_PRELIMS",
    subjectSlug: "history",
    subjectTitle: "History",
    paper: "General Studies Paper I",
    questionNumber: "CSP-2024-HIS-CULTURE-SEED",
    questionText:
      "Pattern seed for an official prelims history/culture item: source, period, place, art form or chronology-based elimination.",
    syllabusArea: "Modern, ancient, medieval, art and culture",
    syllabusNodeId: "history-blocks",
    topicTags: ["source", "period", "culture", "chronology"],
    trendInsightId: "history-source-culture",
    sourceHref: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
    officialSourceTitle: "Civil Services Preliminary Examination 2024 Question Papers",
    answerDemand: "Prelims source/culture elimination",
  }),
];

export function buildPyqImportCsvTemplate() {
  const headers = pyqImportCsvColumns.map((column) => column.key);
  const rows: PyqImportCsvRow[] = [
    {
      year: "2024",
      stage: "Prelims",
      subject_slug: "geography",
      paper: "General Studies Paper I",
      question_number: "Q1",
      question_text: "Paste exact verified UPSC question text here.",
      syllabus_area: "Indian geography and mapping",
      syllabus_node_id: "geo-india",
      topic_tags: "map|location|elimination",
      trend_insight_id: "geo-map-process",
      source_href: "https://upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202024",
      official_source_title: "Civil Services Preliminary Examination 2024 Question Papers",
      answer_demand: "Prelims elimination and map logic",
    },
    {
      year: "2025",
      stage: "Optional",
      subject_slug: "anthropology",
      paper: "Anthropology Paper I",
      question_number: "Q1(a)",
      question_text: "Paste exact verified UPSC optional question text here.",
      syllabus_area: "Paper I syllabus unit",
      topic_tags: "optional|paper-i|topic",
      source_href: "https://upsc.gov.in/examinations/Civil%20Services%20%28Main%29%20Examination%2C%202025",
      official_source_title: "Civil Services Main Examination 2025 Question Papers",
      answer_demand: "Mains explanation",
    },
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ].join("\n");
}

export function buildPyqImportRecordsFromCsvRows(rows: PyqImportCsvRow[]): PyqImportParseResult {
  const accepted: PyqImportRecord[] = [];
  const rejected: PyqImportValidationIssue[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const year = Number(normalize(row.year));
    const stage = normalizeStage(normalize(row.stage));
    const subjectSlug = normalize(row.subject_slug).toLowerCase();
    const subjectPack = sourcePackForSlug(subjectSlug);
    const paper = normalize(row.paper);
    const questionNumber = normalize(row.question_number);
    const questionText = normalize(row.question_text);
    const syllabusArea = normalize(row.syllabus_area);
    const sourceHref = normalize(row.source_href);
    const topicTags = normalizeTopicTags(normalize(row.topic_tags));

    if (!Number.isInteger(year) || year < 2010 || year > 2026) {
      rejected.push({ rowNumber, reason: "Year must be a valid UPSC paper year between 2010 and 2026.", row });
      return;
    }

    if (!stage) {
      rejected.push({ rowNumber, reason: "Stage must be Prelims, Mains, or Optional.", row });
      return;
    }

    if (!subjectPack) {
      rejected.push({ rowNumber, reason: "Subject slug is not present in the GS or optional source catalog.", row });
      return;
    }

    const kind = resolveQuestionKind(stage, subjectPack.type);
    if (!kind) {
      rejected.push({
        rowNumber,
        reason: "Stage and subject type do not match. GS subjects use Prelims/Mains; optional subjects use Optional.",
        row,
      });
      return;
    }

    if (!paper || !questionNumber || !questionText || !syllabusArea || !sourceHref) {
      rejected.push({
        rowNumber,
        reason: "Paper, question number, question text, syllabus area, and source URL are required.",
        row,
      });
      return;
    }

    const baseRecord: Omit<PyqImportRecord, "importStatus"> = {
      id: stablePyqId({ year, stage, subjectSlug, paper, questionNumber }),
      year,
      stage,
      kind,
      subjectSlug,
      subjectTitle: subjectPack.title,
      paper,
      questionNumber,
      questionText,
      syllabusArea,
      syllabusNodeId: normalize(row.syllabus_node_id) || undefined,
      topicTags,
      trendInsightId: normalize(row.trend_insight_id) || undefined,
      sourceHref,
      officialSourceTitle: normalize(row.official_source_title) || undefined,
      answerDemand: normalize(row.answer_demand) || undefined,
      textStatus: "EXACT_VERIFIED",
      importedAt: new Date().toISOString(),
    };

    accepted.push({
      ...baseRecord,
      importStatus: isReviewRecord(baseRecord) ? "NEEDS_REVIEW" : "MAPPED",
    });
  });

  return { accepted, rejected };
}

export function dedupePyqImportRecords(records: PyqImportRecord[]) {
  const byId = new Map<string, PyqImportRecord>();
  records.forEach((record) => byId.set(record.id, record));
  return Array.from(byId.values()).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return `${a.subjectSlug}-${a.paper}-${a.questionNumber}`.localeCompare(
      `${b.subjectSlug}-${b.paper}-${b.questionNumber}`
    );
  });
}

export function readLocalPyqImportRecords(): PyqImportRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(PYQ_IMPORT_LEDGER_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalPyqImportRecords(records: PyqImportRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PYQ_IMPORT_LEDGER_KEY, JSON.stringify(dedupePyqImportRecords(records)));
}

export function appendLocalPyqImportRecords(records: PyqImportRecord[]) {
  const next = dedupePyqImportRecords([...readLocalPyqImportRecords(), ...records]);
  writeLocalPyqImportRecords(next);
  return next;
}

export function clearLocalPyqImportRecords() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PYQ_IMPORT_LEDGER_KEY);
}

export function buildPyqImportCoverage(records: PyqImportRecord[]): PyqImportCoverageRow[] {
  return subjectSourcePacks.map((subject) => {
    const subjectRecords = records.filter((record) => record.subjectSlug === subject.slug);
    const subjectSeeds = seededPyqPatternRecords.filter((record) => record.subjectSlug === subject.slug);
    const exactVerifiedQuestions = subjectRecords.filter((record) => record.textStatus === "EXACT_VERIFIED").length;
    const seededPatterns = subjectSeeds.length;
    const mappedQuestions = subjectRecords.filter((record) => record.importStatus === "MAPPED").length;
    const sourceRows = subject.pyqRows.length;

    return {
      slug: subject.slug,
      title: subject.title,
      route: subject.route,
      sourceRows,
      importedQuestions: subjectRecords.length,
      exactVerifiedQuestions,
      seededPatterns,
      mappedQuestions,
      needsReview: subjectRecords.length - mappedQuestions,
      trendBoards: subject.trendInsights.length,
      coveragePercent: sourceRows > 0 ? Math.round((mappedQuestions / sourceRows) * 100) : 0,
    };
  });
}

export function summarizePyqImportLedger(records: PyqImportRecord[]) {
  const mappedQuestions = records.filter((record) => record.importStatus === "MAPPED").length;
  const subjectsTouched = new Set(records.map((record) => record.subjectSlug)).size;
  const optionalQuestions = records.filter((record) => record.kind === "OPTIONAL_MAINS").length;
  const exactVerifiedQuestions = records.filter((record) => record.textStatus === "EXACT_VERIFIED").length;
  const seededSubjects = new Set(seededPyqPatternRecords.map((record) => record.subjectSlug)).size;

  return {
    importedQuestions: records.length,
    exactVerifiedQuestions,
    seededPatterns: seededPyqPatternRecords.length,
    seededSubjects,
    mappedQuestions,
    needsReview: records.length - mappedQuestions,
    subjectsTouched,
    optionalQuestions,
  };
}

export function buildExactPyqImportReadiness(records: PyqImportRecord[]): ExactPyqImportReadiness {
  const exactRecords = records.filter((record) => record.textStatus === "EXACT_VERIFIED");
  const mappedExactRecords = exactRecords.filter((record) => record.importStatus === "MAPPED");
  const needsReviewRows = exactRecords.length - mappedExactRecords.length;
  const officialRows = officialPaperIndexSummary.totalPaperIndexRows;
  const strictCoveragePercent = officialRows > 0 ? Math.round((mappedExactRecords.length / officialRows) * 100) : 0;
  const studentReady = officialRows > 0 && mappedExactRecords.length >= officialRows;
  const highPriorityPaperRows = officialPaperIndexRows.filter((row) => row.extractionPriority === "high").length;

  return {
    proofRule: "admin-exact-pyq-import-before-student-drills",
    officialPaperIndexRows: officialRows,
    directLinkedOfficialPapers: officialPaperIndexSummary.directLinkedPaperRows,
    indexLinkedOfficialPapers: officialPaperIndexSummary.indexPagePaperRows,
    highPriorityPaperRows,
    exactQuestionTextRows: exactRecords.length,
    mappedExactQuestionRows: mappedExactRecords.length,
    needsReviewRows,
    strictCoveragePercent,
    studentReady,
    studentReadyLabel: studentReady
      ? "Exact PYQ bank can be exposed to student drills."
      : exactRecords.length > 0
        ? "Admin staging is active; student drills remain gated until the official queue is substantially mapped."
        : "Not student-ready: official source index exists, exact question text has not been imported.",
    nextQueueRule:
      "Extract direct-linked 2024/2025 GS papers first, then work backwards through the official UPSC index and optional Paper I/II rows.",
    sourceLibraryPath: "/upsc/source-library",
    stages: [
      {
        id: "source-indexed",
        title: "Official source index",
        status: "complete",
        rowCount: officialRows,
        proof: `${officialPaperIndexSummary.prelimsPaperRows} Prelims rows, ${officialPaperIndexSummary.gsMainsPaperRows} GS Mains rows, and ${officialPaperIndexSummary.optionalPaperIndexRows} optional paper rows are indexed.`,
        nextAction: "Keep official links visible and start extraction from direct-linked high-priority rows.",
        studentImpact: "Students can see source-backed planning, but not exact PYQ drills yet.",
      },
      {
        id: "text-extraction",
        title: "Exact text extraction",
        status: exactRecords.length > 0 ? "active" : "pending",
        rowCount: exactRecords.length,
        proof:
          exactRecords.length > 0
            ? `${exactRecords.length} exact verified rows are staged in the admin ledger.`
            : officialPaperIndexSummary.exactImportRule,
        nextAction: "Paste verified official question text using the import CSV, preserving the source URL beside every row.",
        studentImpact: "Exact PYQ claims stay off until text rows are imported and reviewed.",
      },
      {
        id: "review-verification",
        title: "Reviewer verification",
        status: exactRecords.length === 0 ? "pending" : needsReviewRows > 0 ? "active" : "complete",
        rowCount: needsReviewRows,
        proof:
          exactRecords.length === 0
            ? "No exact rows are waiting for review because no exact text has been imported yet."
            : needsReviewRows > 0
              ? `${needsReviewRows} imported rows still need review before student use.`
              : "All currently staged exact rows pass the local mapped/review gate.",
        nextAction: "Check question wording, paper, question number, and official source before marking rows mapped.",
        studentImpact: "Unreviewed rows remain admin-only.",
      },
      {
        id: "topic-tagging",
        title: "Syllabus and topic tagging",
        status: mappedExactRecords.length > 0 ? "active" : "pending",
        rowCount: mappedExactRecords.length,
        proof:
          mappedExactRecords.length > 0
            ? `${mappedExactRecords.length} exact rows have syllabus area, topic tags, and source references.`
            : "No exact row has reached mapped topic status yet.",
        nextAction: "Attach every row to syllabus node, trend insight, difficulty, and answer demand.",
        studentImpact: "Mapped rows can later feed gap analysis, recall, revision, and question-bank selection.",
      },
      {
        id: "planner-bank-connection",
        title: "Planner and question-bank connection",
        status: mappedExactRecords.length > 0 ? "active" : "pending",
        rowCount: mappedExactRecords.length,
        proof:
          mappedExactRecords.length > 0
            ? `${mappedExactRecords.length} rows are eligible for planner/question-bank wiring after operator review.`
            : "Planner uses source-pattern guidance only until exact mapped rows are available.",
        nextAction: "Route mapped exact rows into daily planner, custom MCQ bank, revision triggers, and report evidence.",
        studentImpact: "Student-facing drills remain honest while the exact bank is being assembled.",
      },
    ],
  };
}
