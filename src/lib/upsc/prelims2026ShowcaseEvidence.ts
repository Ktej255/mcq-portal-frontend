import auditData from "@/lib/upsc/audits/prelims-2026-audit-v2.json";

type AuditStatus = "direct" | "partial" | "none";

type AuditQuestion = {
  number: number;
  subject: string;
  difficulty: string;
  nature: string;
  answer: string;
  stem: string;
  statements: string[];
  instruction: string;
  options: Array<{
    letter: string;
    text: string;
  }>;
};

type AuditMatch = {
  questionNumber: number;
  status: AuditStatus;
  bestScore: number;
  topMatches: Array<{
    matchedTerms: string[];
    phraseHits: string[];
    source: {
      relativePath?: string;
      page?: number | null;
      extension?: string;
    };
  }>;
};

type AuditData = {
  questions: AuditQuestion[];
  matches: AuditMatch[];
};

export type ShowcaseQuestionEvidence = {
  number: number;
  subject: string;
  difficulty: string;
  nature: string;
  answer: string;
  statementCount: number;
  status: AuditStatus;
  statusLabel: string;
  bestScore: number;
  stemPreview: string;
  stemFull: string;
  statementsFull: string[];
  instruction: string;
  options: Array<{
    letter: string;
    text: string;
  }>;
  sourceLead: string;
  coveredSignals: string[];
  formatLabel: string;
  trapStyle: string;
  whyAsked: string;
  depthTest: string;
  matchScope: string;
  statementCoverage: Array<{
    label: string;
    text: string;
    coverage: "source-signal" | "concept-signal" | "manual-check";
    coverageLabel: string;
    matchedSignals: string[];
  }>;
  conceptLead: string;
  researchNote: string;
  nextAction: string;
};

const audit = auditData as AuditData;

const stopWords = new Set([
  "about",
  "above",
  "after",
  "also",
  "among",
  "being",
  "both",
  "consider",
  "correct",
  "following",
  "from",
  "given",
  "have",
  "into",
  "only",
  "statement",
  "statements",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "which",
  "with",
]);

const institutionPatterns = [
  /\bVajiram\s+and\s+Ravi\b/gi,
  /\bVision\s*IAS\b/gi,
  /\bForum\s*IAS\b/gi,
  /\bInsights\s*IAS\b/gi,
  /\bNext\s*IAS\b/gi,
  /\bDrishti\s*IAS\b/gi,
  /\bIAS\s*Baba\b/gi,
  /\bThe\s+Recitals\b/gi,
  /\b[A-Z][A-Za-z']+(?:\s+(?:and\s+)?[A-Z][A-Za-z']+){0,2}\s*IAS\b/g,
  /\b[A-Z][A-Za-z']*IAS\b/g,
  /\bIAS\s+[A-Z][A-Za-z']+\b/g,
];

function sanitizeText(value: string) {
  return institutionPatterns
    .reduce((text, pattern) => text.replace(pattern, "reference material"), value)
    .replace(/\s+/g, " ")
    .trim();
}

function preview(value: string, maxLength = 160) {
  const cleanValue = sanitizeText(value);
  if (cleanValue.length <= maxLength) return cleanValue;
  return `${cleanValue.slice(0, maxLength - 1).trim()}...`;
}

function tokensFor(value: string) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 3 && !stopWords.has(token));
}

function sourceLeadFromPath(relativePath = "") {
  const normalizedPath = relativePath.toLowerCase();

  if (normalizedPath.includes("value")) return "30-day value-addition PDF";
  if (normalizedPath.includes("geography")) return "Geography module or MCQ batch";
  if (normalizedPath.includes("environment") || normalizedPath.includes("environement")) {
    return "Environment module or ecology capsule";
  }
  if (normalizedPath.includes("history")) return "History module or MCQ bank";
  if (normalizedPath.includes("polity")) return "Polity module or memory layer";
  if (normalizedPath.includes("s & t") || normalizedPath.includes("sci")) return "Science and technology pack";
  if (normalizedPath.includes("economy") || normalizedPath.includes("gs 3")) return "Economy or GS 3 source pack";
  if (normalizedPath.includes("current affairs")) return "Current affairs reference pack";
  if (normalizedPath.includes("gs 4")) return "Ethics and governance source pack";
  if (normalizedPath.includes("gs 2")) return "Governance or IR source pack";

  return "Indexed archive source";
}

function statusCopy(status: AuditStatus) {
  if (status === "direct") return "Strong candidate source lead";
  if (status === "partial") return "Conceptual source lead";
  return "No reliable text lead";
}

function formatLabelFor(question: AuditQuestion) {
  if (question.statements.length >= 3) return "Multi-statement elimination";
  if (question.statements.length === 2) return "Two-statement judgement";
  if (/match|paired|pairs/i.test(question.stem + question.instruction)) return "Pair matching";
  if (/identify/i.test(question.stem + question.instruction)) return "Identification frame";
  return "Single-concept application";
}

function trapStyleFor(question: AuditQuestion) {
  const combined = `${question.stem} ${question.instruction}`.toLowerCase();

  if (combined.includes("not correct") || combined.includes("incorrect")) return "Reverse elimination trap";
  if (combined.includes("basis") || combined.includes("assertion")) return "Evidence-basis trap";
  if (combined.includes("match") || combined.includes("paired") || combined.includes("pairs")) return "Pairing and location trap";
  if (combined.includes("identify")) return "Identity clue trap";
  if (question.statements.length >= 3) return "Scope and exception trap";
  return "Concept precision trap";
}

function whyAskedFor(question: AuditQuestion) {
  const subject = question.subject.toLowerCase();

  if (subject.includes("geography")) {
    return "UPSC is checking whether static geography is connected to maps, routes, physical processes and places in news.";
  }

  if (subject.includes("economy")) {
    return "UPSC is checking whether economic terms, institutions and data triggers can be applied instead of merely recalled.";
  }

  if (subject.includes("science")) {
    return "UPSC is checking applied science literacy: what the technology does, where it is used and what limits it has.";
  }

  if (subject.includes("environment")) {
    return "UPSC is checking species, habitat, schemes and climate-policy language through statement precision.";
  }

  if (subject.includes("polity")) {
    return "UPSC is checking constitutional and governance judgement, including provisions, institutions and rights language.";
  }

  if (subject.includes("current")) {
    return "UPSC is checking if current events are connected to durable syllabus concepts, reports, places and institutions.";
  }

  if (subject.includes("culture")) {
    return "UPSC is checking tradition, visual recognition and school-to-school comparison rather than isolated names.";
  }

  if (subject.includes("history")) {
    return "UPSC is checking chronology, motive, source interpretation and movement-level cause-effect reasoning.";
  }

  return "UPSC is checking whether the learner can move from fact memory to applied statement evaluation.";
}

function depthTestFor(question: AuditQuestion) {
  const format = formatLabelFor(question).toLowerCase();
  const nature = question.nature.toLowerCase();

  if (nature.includes("ca-advanced")) return "Advanced current-affairs integration with static syllabus anchors.";
  if (format.includes("multi")) return "Statement-level discrimination: fact, scope, exception and distractor control.";
  if (format.includes("two")) return "Binary judgement: whether two statements are independently correct and related.";
  if (format.includes("pair")) return "Association accuracy: pair, place, institution, feature or chronology.";
  if (nature.includes("fundamental")) return "Foundational clarity under UPSC wording pressure.";
  return "Applied concept transfer from classroom content to unfamiliar UPSC wording.";
}

function buildStatementCoverage(
  question: AuditQuestion,
  status: AuditStatus,
  coveredSignals: string[]
) {
  const signals = coveredSignals.flatMap(tokensFor);
  const signalSet = new Set(signals);
  const frames =
    question.statements.length > 0
      ? question.statements
      : [question.stem.replace(/^consider the following[^:]*:/i, "").trim() || question.stem];

  return frames.map((statement, index) => {
    const statementTokens = tokensFor(statement);
    const hits = statementTokens.filter((token) => signalSet.has(token));
    const uniqueHits = Array.from(new Set(hits)).slice(0, 6);
    const coverage: ShowcaseQuestionEvidence["statementCoverage"][number]["coverage"] =
      status === "direct" && uniqueHits.length >= 2
        ? "source-signal"
        : uniqueHits.length > 0
          ? "concept-signal"
          : "manual-check";
    const label =
      coverage === "source-signal"
        ? "Source signal found"
        : coverage === "concept-signal"
          ? "Concept signal found"
          : "Manual proof needed";

    return {
      label: question.statements.length > 0 ? `Statement ${index + 1}` : "Core question frame",
      text: sanitizeText(statement),
      coverage,
      coverageLabel: label,
      matchedSignals: uniqueHits,
    };
  });
}

function matchScopeFor(coverage: ShowcaseQuestionEvidence["statementCoverage"]) {
  const matchedPortions = coverage
    .filter((statement) => statement.coverage !== "manual-check")
    .map((statement) => statement.label);

  if (matchedPortions.length === 0) {
    return "No searchable portion of this MCQ matched in the automated pass; keep the whole question proof-locked for manual source review.";
  }

  const finalMatchedPortion = matchedPortions[matchedPortions.length - 1];
  const remainingPortions = coverage
    .filter((statement) => statement.coverage === "manual-check")
    .map((statement) => statement.label);

  if (remainingPortions.length === 0) {
    return `Match covers every MCQ portion through ${finalMatchedPortion}; still verify exact source page proof before public accuracy claims.`;
  }

  return `Match appears in ${matchedPortions.join(", ")}; highest matched portion is ${finalMatchedPortion}. Manual proof is still needed for ${remainingPortions.join(", ")}.`;
}

function nextActionFor(status: AuditStatus, question: AuditQuestion) {
  const format =
    question.statements.length >= 3
      ? "multi-statement elimination"
      : question.statements.length === 2
        ? "two-statement judgement"
        : "single-concept application";

  if (status === "direct") {
    return `Verify page proof, then convert into ${format} practice variants.`;
  }

  if (status === "partial") {
    return `Manually check whether the source teaches answerability, then build ${format} traps.`;
  }

  return `Run OCR and create a fresh micro-module before adding ${format} questions.`;
}

export function buildPrelims2026ShowcaseEvidence(): ShowcaseQuestionEvidence[] {
  const matchByQuestion = new Map(audit.matches.map((match) => [match.questionNumber, match]));

  return audit.questions.map((question) => {
    const match = matchByQuestion.get(question.number);
    const topMatch = match?.topMatches[0];
    const phraseSignals = topMatch?.phraseHits ?? [];
    const termSignals = topMatch?.matchedTerms ?? [];
    const coveredSignals = [...phraseSignals, ...termSignals]
      .map((signal) => sanitizeText(signal))
      .filter(Boolean)
      .filter((signal, index, list) => list.indexOf(signal) === index)
      .slice(0, 7);
    const status = match?.status ?? "none";
    const statementCoverage = buildStatementCoverage(question, status, coveredSignals);

    return {
      number: question.number,
      subject: question.subject,
      difficulty: question.difficulty,
      nature: question.nature,
      answer: question.answer,
      statementCount: question.statements.length,
      status,
      statusLabel: statusCopy(status),
      bestScore: match?.bestScore ?? 0,
      stemPreview: preview(question.stem),
      stemFull: sanitizeText(question.stem),
      statementsFull: question.statements.map((statement) => sanitizeText(statement)),
      instruction: sanitizeText(question.instruction),
      options: question.options.map((option) => ({
        letter: sanitizeText(option.letter),
        text: sanitizeText(option.text),
      })),
      sourceLead: topMatch
        ? `${sourceLeadFromPath(topMatch.source.relativePath)}${
            typeof topMatch.source.page === "number" ? `, page ${topMatch.source.page}` : ""
          }`
        : "No indexed source lead",
      coveredSignals,
      formatLabel: formatLabelFor(question),
      trapStyle: trapStyleFor(question),
      whyAsked: whyAskedFor(question),
      depthTest: depthTestFor(question),
      matchScope: matchScopeFor(statementCoverage),
      statementCoverage,
      conceptLead:
        coveredSignals.length > 0
          ? `Covered signals: ${coveredSignals.slice(0, 5).join(", ")}`
          : "No strong searchable concept signal in this pass.",
      researchNote:
        status === "direct"
          ? "Strong source proximity found. Keep it internal until the exact page/screenshot proof is retained."
          : status === "partial"
            ? "Concept overlap exists, but it must be checked for actual answerability before website claims."
            : "Treat as a gap unless OCR or manual source review finds hidden coverage.",
      nextAction: nextActionFor(status, question),
    };
  });
}
