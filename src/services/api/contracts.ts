export const OPTION_ID_SEPARATOR = '_opt_';

export type CanonicalOptionId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
  | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P'
  | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X'
  | 'Y' | 'Z';

export type CanonicalConfidence =
  | 'BLIND_GUESS'
  | 'FIFTY_FIFTY'
  | 'EDUCATED_GUESS'
  | 'FAIRLY_SURE'
  | 'HUNDRED_PERCENT';

const OPTION_KEYS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
const CONFIDENCE_KEYS = new Set([
  'BLIND_GUESS',
  'FIFTY_FIFTY',
  'EDUCATED_GUESS',
  'FAIRLY_SURE',
  'HUNDRED_PERCENT',
]);

const CONFIDENCE_ALIASES: Record<string, CanonicalConfidence> = {
  '50_50': 'FIFTY_FIFTY',
  '100_SURE': 'HUNDRED_PERCENT',
};

export function normalizeOptionId(value: string | null | undefined): CanonicalOptionId | null {
  if (!value) return null;
  const raw = String(value).trim();
  const key = (raw.includes(OPTION_ID_SEPARATOR) ? raw.split(OPTION_ID_SEPARATOR).pop() : raw)?.toUpperCase();
  if (!key || !OPTION_KEYS.has(key)) {
    throw new Error(`Invalid option id: ${value}`);
  }
  return key as CanonicalOptionId;
}

export function normalizeConfidence(value: string | null | undefined): CanonicalConfidence | null {
  if (!value) return null;
  const normalized = CONFIDENCE_ALIASES[value] ?? value;
  if (!CONFIDENCE_KEYS.has(normalized)) {
    throw new Error(`Invalid confidence level: ${value}`);
  }
  return normalized as CanonicalConfidence;
}

export function requireFiniteNumber(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid report payload: ${fieldName} must be a finite number`);
  }
  return parsed;
}

export function normalizeReportPayload(payload: any, attemptId?: string) {
  const inferredScore = Array.isArray(payload?.subjectScores)
    ? payload.subjectScores.reduce((sum: number, item: any) => sum + (Number(item.score) || 0), 0)
    : undefined;

  const scoreSource = payload?.totalScore ?? payload?.total_score ?? inferredScore;
  if (attemptId && scoreSource === undefined) {
    throw new Error('Invalid report payload: attempt report missing totalScore');
  }

  const accuracy = requireFiniteNumber(payload?.accuracy ?? 0, 'accuracy');
  if (accuracy < 0 || accuracy > 100) {
    throw new Error('Invalid report payload: accuracy must be between 0 and 100');
  }

  return {
    totalScore: requireFiniteNumber(scoreSource ?? 0, 'totalScore'),
    accuracy,
    correctCount: requireFiniteNumber(payload?.correctCount ?? payload?.correct_count ?? 0, 'correctCount'),
    incorrectCount: requireFiniteNumber(payload?.incorrectCount ?? payload?.incorrect_count ?? 0, 'incorrectCount'),
    unattemptedCount: requireFiniteNumber(payload?.unattemptedCount ?? payload?.unattempted_count ?? 0, 'unattemptedCount'),
    totalQuestions: requireFiniteNumber(payload?.totalQuestions ?? payload?.total_questions ?? 0, 'totalQuestions'),
  };
}
