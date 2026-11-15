import { apiClient } from './client';
import { ConfidenceLevel, QuestionStatus } from '@/lib/store/useExamStore';
import { normalizeConfidence, normalizeOptionId } from './contracts';

export interface TestMetadata {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions?: number;
  canStart?: boolean;
  subject: string;
  attemptCount?: number;
  lastAttemptStatus?: 'IN_PROGRESS' | 'SUBMITTED' | null;
  lastAttemptDate?: string | null;
  correct_marks?: number;
  negative_marking_value?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface QuestionData {
  id: string;
  textEn: string;
  textHi: string | null;
  subject: string;
  topic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  positiveMarks: number;
  negativeMarks: number;
  correct_option?: string;
  options: {
    id: string;
    textEn: string;
    textHi: string | null;
  }[];
}

export interface AttemptData {
  attemptId: string;
  testId: string;
  startTime: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
}

export interface SaveAnswerPayload {
  questionId: string;
  selectedOptionId: string | null;
  confidence: ConfidenceLevel | null;
  status: QuestionStatus;
  timeSpentSeconds: number;
  lastAction?: 'VISITED' | 'ANSWER_SELECTED' | 'CLEARED' | 'MARKED_FOR_REVIEW';
}

export type ExamQuestionResponseErrorKind = 'INVALID_RESPONSE' | 'EMPTY_QUESTION_BANK';

export class ExamQuestionResponseError extends Error {
  readonly kind: ExamQuestionResponseErrorKind;

  constructor(kind: ExamQuestionResponseErrorKind) {
    super(
      kind === 'EMPTY_QUESTION_BANK'
        ? 'No published questions are available for this test.'
        : 'The exam questions response was invalid.'
    );
    this.name = 'ExamQuestionResponseError';
    this.kind = kind;
  }
}

export class TestCatalogResponseError extends Error {
  constructor() {
    super("The available-tests response was invalid.");
    this.name = "TestCatalogResponseError";
  }
}

function isTestMetadata(value: unknown): value is TestMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" && Boolean(record.id.trim()) &&
    typeof record.title === "string" && Boolean(record.title.trim()) &&
    typeof record.subject === "string" && Boolean(record.subject.trim()) &&
    typeof record.durationMinutes === "number" && Number.isFinite(record.durationMinutes) && record.durationMinutes > 0 &&
    typeof record.totalQuestions === "number" && Number.isInteger(record.totalQuestions) && record.totalQuestions >= 0 &&
    typeof record.canStart === "boolean"
  );
}

function isQuestionData(value: unknown): value is QuestionData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const difficulty = record.difficulty;
  const options = record.options;

  return (
    typeof record.id === 'string' && Boolean(record.id.trim()) &&
    typeof record.textEn === 'string' && Boolean(record.textEn.trim()) &&
    (record.textHi === null || typeof record.textHi === 'string') &&
    typeof record.subject === 'string' && Boolean(record.subject.trim()) &&
    (record.topic === undefined || typeof record.topic === 'string') &&
    (difficulty === 'Easy' || difficulty === 'Medium' || difficulty === 'Hard') &&
    typeof record.positiveMarks === 'number' && Number.isFinite(record.positiveMarks) &&
    typeof record.negativeMarks === 'number' && Number.isFinite(record.negativeMarks) &&
    Array.isArray(options) && options.length > 0 && options.every(option => {
      if (!option || typeof option !== 'object' || Array.isArray(option)) return false;
      const optionRecord = option as Record<string, unknown>;
      return (
        typeof optionRecord.id === 'string' && Boolean(optionRecord.id.trim()) &&
        typeof optionRecord.textEn === 'string' && Boolean(optionRecord.textEn.trim()) &&
        (optionRecord.textHi === null || typeof optionRecord.textHi === 'string')
      );
    })
  );
}

export const examService = {
  getAvailableTests: async (): Promise<TestMetadata[]> => {
    const response = await apiClient.get('tests/available');
    // Backend wraps: { success, message, data: <payload> }
    const payload = response.data?.data ?? response.data;
    if (!Array.isArray(payload) || !payload.every(isTestMetadata)) {
      throw new TestCatalogResponseError();
    }
    return payload;
  },
  
  getTestById: async (testId: string): Promise<TestMetadata> => {
    const response = await apiClient.get(`tests/${testId}`);
    return response.data?.data ?? response.data;
  },

  startAttempt: async (testId: string): Promise<AttemptData> => {
    const response = await apiClient.post(`attempts/start`, { test_id: parseInt(testId) });
    const payload = response.data?.data ?? response.data;
    // Backend returns attempt_id (snake_case) — normalise to camelCase
    return {
      attemptId: String(payload?.attempt_id ?? payload?.attemptId ?? ''),
      testId: String(payload?.test?.id ?? testId),
      startTime: payload?.start_time ?? payload?.startTime ?? '',
      status: payload?.status ?? 'IN_PROGRESS',
    };
  },

  startSimulation: async (testId: string): Promise<AttemptData> => {
    const response = await apiClient.post(`simulation/start/${parseInt(testId)}`);
    const payload = response.data?.data ?? response.data;
    return {
      attemptId: String(payload?.attempt_id ?? payload?.attemptId ?? ''),
      testId: String(payload?.test?.id ?? testId),
      startTime: payload?.start_time ?? payload?.startTime ?? '',
      status: payload?.status === 'RESUMED' ? 'IN_PROGRESS' : (payload?.status ?? 'IN_PROGRESS'),
    };
  },

  getQuestions: async (testId: string): Promise<QuestionData[]> => {
    const response = await apiClient.get(`tests/${testId}/questions`);
    const payload = response.data?.data ?? response.data;
    if (!Array.isArray(payload) || !payload.every(isQuestionData)) {
      throw new ExamQuestionResponseError('INVALID_RESPONSE');
    }
    return payload;
  },

  saveAnswers: async (attemptId: string, answers: SaveAnswerPayload[]) => {
    // Backend expects a single answer per request — send the last answer
    const saveableAnswers = answers.filter(answer => {
      if (answer.status === 'NOT_VISITED') return false;
      if (answer.lastAction === 'VISITED') return false;
      return Boolean(answer.selectedOptionId) || answer.lastAction === 'CLEARED' || answer.lastAction === 'MARKED_FOR_REVIEW';
    });
    if (saveableAnswers.length === 0) return;

    const responses = [];
    for (const answer of saveableAnswers) {
      const response = await apiClient.put(`attempts/${attemptId}/answers`, {
        question_id: parseInt(answer.questionId),
        selected_option: normalizeOptionId(answer.selectedOptionId),
        time_taken_seconds: answer.timeSpentSeconds,
        confidence_level: normalizeConfidence(answer.confidence),
        is_skipped: answer.status === 'UNANSWERED',
        marked_for_review: answer.status === 'MARKED_FOR_REVIEW' || answer.status === 'ANSWERED_AND_MARKED',
        clear_response: answer.lastAction === 'CLEARED',
      });
      responses.push(response.data?.data ?? response.data);
    }
    return responses;
  },

  submitTest: async (attemptId: string) => {
    const response = await apiClient.post(`attempts/${attemptId}/submit`);
    return response.data?.data ?? response.data;
  }
};
