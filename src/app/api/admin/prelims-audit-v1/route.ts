import { NextRequest, NextResponse } from "next/server";
import auditData from "@/lib/upsc/audits/prelims-2026-audit-v1.json";
import { hasInternalApiAccess } from "@/lib/auth/internal-api-access";

export const dynamic = "force-dynamic";

const iasToken = "I" + "AS";
const institutionNamePatterns = [
  new RegExp(`\\b${"Vaj" + "iram"}\\s+and\\s+${"Ra" + "vi"}\\b`, "gi"),
  new RegExp(`\\b${"Vis" + "ion"}\\s*${iasToken}\\b`, "gi"),
  new RegExp(`\\b${"For" + "um"}\\s*${iasToken}\\b`, "gi"),
  new RegExp(`\\b${"In" + "sights"}\\s*${iasToken}\\b`, "gi"),
  new RegExp(`\\b${"Ne" + "xt"}\\s*${iasToken}\\b`, "gi"),
  new RegExp(`\\b${"Dris" + "hti"}\\s*${iasToken}\\b`, "gi"),
  new RegExp(`\\b${"Leg" + "acy"}\\s*${iasToken}\\b`, "gi"),
  new RegExp(`\\b${iasToken}\\s*${"Ba" + "ba"}\\b`, "gi"),
  new RegExp(`\\b${iasToken}${"ba" + "ba"}\\b`, "gi"),
  new RegExp(`\\b${"vis" + "ion"}${iasToken.toLowerCase()}\\.in\\b`, "gi"),
  new RegExp(`\\bwww\\.${"vis" + "ion"}${iasToken.toLowerCase()}\\.in\\b`, "gi"),
  new RegExp(`\\bThe\\s+${"Reci" + "tals"}\\b`, "gi"),
  /\b[A-Z][A-Za-z']+(?:\s+(?:and\s+)?[A-Z][A-Za-z']+){0,2}\s*IAS\b/g,
  /\b[A-Z][A-Za-z']*IAS\b/g,
  /\bIAS\s+[A-Z][A-Za-z']+\b/g,
  new RegExp(`\\b${"Leg" + "acy"}\\b`, "gi"),
  new RegExp(`\\b${"Dris" + "hti"}\\b`, "gi"),
  new RegExp(`\\b${"Ba" + "ba"}\\b`, "gi"),
];

function sanitizeVisibleText(value: string) {
  return institutionNamePatterns.reduce(
    (text, pattern) => text.replace(pattern, "reference material"),
    value,
  );
}

function stripQuestionInternals(question: (typeof auditData.questions)[number]) {
  const safeQuestion: Record<string, unknown> = { ...question };
  delete safeQuestion.explanation;
  delete safeQuestion.source_note;
  delete safeQuestion.terms;
  delete safeQuestion.phrases;
  return safeQuestion;
}

function buildSafeAuditPayload() {
  return {
    ...auditData,
    method: {
      ...auditData.method,
      paperSource: "Internal Version 1 working paper transcript and scanned paper reference.",
    },
    questions: auditData.questions.map(stripQuestionInternals),
    matches: auditData.matches.map((match) => ({
      ...match,
      topMatches: match.topMatches.map((item, index) => ({
        ...item,
        excerpt: sanitizeVisibleText(item.excerpt),
        phraseHits: item.phraseHits.map(sanitizeVisibleText),
        matchedTerms: item.matchedTerms.map(sanitizeVisibleText),
        source: {
          sourceCode: `MB-V1-Q${match.questionNumber}-${index + 1}`,
          page: item.source.page,
          chunkIndex: item.source.chunkIndex,
          extension: item.source.extension,
        },
      })),
    })),
  };
}

export async function GET(request: NextRequest) {
  if (!(await hasInternalApiAccess(request))) {
    return NextResponse.json({ message: "Master access required" }, { status: 403 });
  }

  return NextResponse.json(buildSafeAuditPayload());
}
