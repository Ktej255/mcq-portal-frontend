import {
  buildPrelims2026ShowcaseEvidence,
  type ShowcaseQuestionEvidence,
} from "@/lib/upsc/prelims2026ShowcaseEvidence";
import type {
  SourceArchiveFileHit,
  SourceArchiveIntakeResponse,
  SourceArchiveTrackId,
  SourceArchiveTrackResult,
} from "@/lib/upsc/sourceArchiveIntake";

export type Prelims2026ArchiveCandidates = {
  tracks: SourceArchiveTrackResult[];
  files: SourceArchiveFileHit[];
};

function sourceArchiveQueryForQuestion(question: ShowcaseQuestionEvidence) {
  return [
    question.subject,
    question.sourceLead,
    question.conceptLead,
    question.matchScope,
    question.stemPreview,
    question.coveredSignals.join(" "),
    question.statementCoverage.map((statement) => statement.matchedSignals.join(" ")).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export function archiveTrackIdsForQuestion(question: ShowcaseQuestionEvidence): SourceArchiveTrackId[] {
  const query = sourceArchiveQueryForQuestion(question);
  const ids: SourceArchiveTrackId[] = [];
  const add = (id: SourceArchiveTrackId) => {
    if (!ids.includes(id)) ids.push(id);
  };

  if (/(environment|ecology|species|biodiversity|forest|wetland|climate)/.test(query)) add("environment-current");
  if (/(geography|map|atlas|river|country|location|geo)/.test(query)) add("geography-maps");
  if (/(polity|constitution|parliament|act|bill|court|judgement|governance|legal)/.test(query)) {
    add("polity-legal-ethics");
  }
  if (/(economy|rbi|bank|bond|tax|budget|finance|irdai|treds)/.test(query)) add("economy-maintenance");
  if (/(science|technology|space|quantum|semiconductor|blockchain|artificial intelligence|biotech)/.test(query)) {
    add("science-new-domains");
  }
  if (/(international|multilateral|asean|bimstec|g20|quad|sco|united nations|summit)/.test(query)) {
    add("ir-multilateral");
  }
  if (/(medieval|bhakti|sufi|mughal|sultanate)/.test(query)) add("medieval-reduction");
  if (/(ancient|tamilakam|tamil nadu|sangam|art and culture|culture|temple)/.test(query)) {
    add("ancient-tn-board");
  }

  return ids;
}

function scoreArchiveFileForQuestion(file: SourceArchiveFileHit, question: ShowcaseQuestionEvidence) {
  const fileText = `${file.name} ${file.relativePath}`.toLowerCase();
  const tokens = sourceArchiveQueryForQuestion(question)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);
  const uniqueTokens = Array.from(new Set(tokens));

  return uniqueTokens.reduce((score, token) => score + (fileText.includes(token) ? 1 : 0), 0);
}

export function buildArchiveCandidatesForQuestion(
  question: ShowcaseQuestionEvidence,
  sourceArchive: SourceArchiveIntakeResponse | null,
  options: { useFallback?: boolean } = {}
): Prelims2026ArchiveCandidates {
  if (!sourceArchive?.rootExists) {
    return { tracks: [], files: [] };
  }

  const useFallback = options.useFallback ?? true;
  const preferredIds = archiveTrackIdsForQuestion(question);
  const tracks = sourceArchive.tracks
    .filter((track) => preferredIds.includes(track.id))
    .sort((left, right) => right.hitCount - left.hitCount);
  const fallbackTracks = tracks.length
    ? tracks
    : useFallback
      ? sourceArchive.tracks.slice().sort((left, right) => right.hitCount - left.hitCount).slice(0, 2)
      : [];
  const files = fallbackTracks
    .flatMap((track) => track.sampleFiles)
    .map((file) => ({ file, score: scoreArchiveFileForQuestion(file, question) }))
    .sort((left, right) => right.score - left.score || Date.parse(right.file.lastModified) - Date.parse(left.file.lastModified))
    .map(({ file }) => file)
    .filter((file, index, allFiles) => allFiles.findIndex((item) => item.relativePath === file.relativePath) === index)
    .slice(0, 6);

  return { tracks: fallbackTracks, files };
}

export function buildPrelims2026QuestionFormatStats(questions = buildPrelims2026ShowcaseEvidence()) {
  const threePlusStatements = questions.filter((question) => question.statementCount >= 3).length;
  const twoStatements = questions.filter((question) => question.statementCount === 2).length;
  const noExplicitList = questions.filter((question) => question.statementCount < 2).length;
  const multiStatementQuestions = threePlusStatements + twoStatements;
  const statementCoverageRows = questions.reduce((total, question) => total + question.statementCoverage.length, 0);

  return {
    totalQuestions: questions.length,
    threePlusStatements,
    twoStatements,
    noExplicitList,
    multiStatementQuestions,
    statementCoverageRows,
    chartPolicy:
      "Use these live ledger counts for the public question-format chart. They describe MCQ structure, not accuracy.",
  };
}

export function buildPrelims2026ArchiveProofReadiness(
  sourceArchive: SourceArchiveIntakeResponse | null,
  questions = buildPrelims2026ShowcaseEvidence()
) {
  const rows = questions.map((question) => {
    const candidates = buildArchiveCandidatesForQuestion(question, sourceArchive, { useFallback: false });
    const decision = question.status === "none" ? "Build gap" : "Needs proof";

    return {
      question,
      decision,
      candidateCount: candidates.files.length,
      trackIds: candidates.tracks.map((track) => track.id),
    };
  });

  const candidateRows = rows.filter((row) => row.candidateCount > 0);
  const blindSpotRows = rows.filter((row) => row.candidateCount === 0);
  const strongestTrack = sourceArchive?.tracks
    .slice()
    .sort((left, right) => right.hitCount - left.hitCount)[0];

  return {
    sourceStatus: sourceArchive?.rootExists ? "ready" : "error",
    sourceConnected: Boolean(sourceArchive?.rootExists),
    totalQuestions: questions.length,
    candidateQuestions: candidateRows.length,
    needsProofWithCandidates: candidateRows.filter((row) => row.decision === "Needs proof").length,
    approvedWithArchive: 0,
    blindSpotQuestions: blindSpotRows.length,
    needsProofBlindSpots: blindSpotRows.filter((row) => row.decision === "Needs proof").length,
    buildGapBlindSpots: blindSpotRows.filter((row) => row.decision === "Build gap").length,
    rejectedBlindSpots: 0,
    blindSpotQuestionNumbers: blindSpotRows.map((row) => row.question.number),
    strongestCandidateTrackId: strongestTrack?.id ?? null,
    strongestCandidateTrackLabel: strongestTrack?.label ?? null,
    sourceGapWorkOrdersRequired: blindSpotRows.length,
    proofPolicy:
      "Archive candidate counts are internal triage signals. Public question claims remain locked until exact source, page/location and teacher validation are approved.",
  };
}
