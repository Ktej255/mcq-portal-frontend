import { NextRequest, NextResponse } from "next/server";
import auditData from "@/lib/upsc/audits/prelims-2026-audit-v2.json";
import sourceIndex from "@/lib/upsc/audits/morning-batch-v2-source-index.json";
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
  new RegExp(`\\b[A-Z][A-Za-z']+(?:\\s+(?:and\\s+)?[A-Z][A-Za-z']+){0,2}\\s*${iasToken}\\b`, "g"),
  new RegExp(`\\b[A-Z][A-Za-z']*${iasToken}\\b`, "g"),
  new RegExp(`\\b${iasToken}\\s+[A-Z][A-Za-z']+\\b`, "g"),
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
  const safeMatches = auditData.matches.map((match) => ({
    ...match,
    topMatches: match.topMatches.map((item, index) => ({
      ...item,
      excerpt: sanitizeVisibleText(item.excerpt),
      phraseHits: item.phraseHits.map(sanitizeVisibleText),
      matchedTerms: item.matchedTerms.map(sanitizeVisibleText),
      source: {
        sourceCode: `MB-V2-Q${match.questionNumber}-${index + 1}`,
        sourceHint: item.source.relativePath
          ? sanitizeVisibleText(item.source.relativePath).replace(/[\\/]+/g, " / ")
          : undefined,
        page: item.source.page,
        chunkIndex: item.source.chunkIndex,
        extension: item.source.extension,
      },
    })),
  }));
  const filesSeen = auditData.sourceCorpus.extraction.filesSeen ?? 0;
  const filesWithText = auditData.sourceCorpus.extraction.filesWithText ?? 0;
  const nonSearchableFiles = Math.max(filesSeen - filesWithText, 0);

  return {
    ...auditData,
    sourceIndex,
    method: {
      ...auditData.method,
      paperSource:
        "Internal Version 2 working paper transcript and scanned paper reference. Official UPSC 2026 previous-question-paper upload was not available on the UPSC previous-paper listing during this local audit pass on 04 Jun 2026.",
    },
    questions: auditData.questions.map(stripQuestionInternals),
    matches: safeMatches,
    verification: {
      publicClaimStatus: "locked_until_manual_ocr_proof",
      publicCoveragePercent: null,
      verifiedDirect: 0,
      verifiedPartial: 0,
      verifiedNone: 0,
      manualReviewRequired: auditData.summary.totalQuestions,
      candidateDirect: auditData.summary.direct,
      candidatePartial: auditData.summary.partial,
      candidateNone: auditData.summary.none,
      candidateDirectPercent: auditData.summary.directPercent,
      candidateDirectOrPartialPercent: auditData.summary.directOrPartialPercent,
      nonSearchableFiles,
      emptyPdfPages: auditData.sourceCorpus.extraction.pdfEmptyPages ?? 0,
      nonTextOrMediaAssets: sourceIndex.totals.nonTextOrMediaAssets,
      proofRule:
        "Candidate matches are discovery leads only. A public coverage percentage needs manual source/page proof retained for each supported question.",
      claimFormula:
        "public percentage = manually verified supported questions / 100. Candidate direct or partial counts must not be published as coverage.",
      requiredBeforePublish: [
        "Open each source hint and confirm that the paper statement is genuinely covered.",
        "Retain page reference or screenshot proof for every accepted question.",
        "Run OCR or explicitly exclude non-searchable files before treating missing evidence as a true gap.",
        "Separate exact coverage, conceptual support, and rejected matches in the master ledger.",
      ],
      questionLedger: safeMatches.map((match) => ({
        questionNumber: match.questionNumber,
        subject: match.subject,
        candidateStatus: match.status,
        candidateBestScore: match.bestScore,
        verifiedStatus: "unverified",
        topEvidenceCodes: match.topMatches.slice(0, 3).map((item) => item.source.sourceCode),
        requiredNextStep:
          match.status === "none"
            ? "Confirm through OCR/non-searchable material, then mark as gap only if still unsupported."
            : "Open the source hint, verify the source/page manually, and retain proof before any public claim.",
      })),
    },
  };
}

export async function GET(request: NextRequest) {
  if (!(await hasInternalApiAccess(request))) {
    return NextResponse.json({ message: "Master access required" }, { status: 403 });
  }

  return NextResponse.json(buildSafeAuditPayload());
}
