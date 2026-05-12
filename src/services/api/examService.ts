import { apiClient } from './client';
import { ConfidenceLevel, QuestionStatus } from '@/lib/store/useExamStore';
import { normalizeConfidence, normalizeOptionId } from './contracts';

export interface TestMetadata {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  subject: string;
  attemptCount: number;
  lastAttemptStatus: 'IN_PROGRESS' | 'SUBMITTED' | null;
  lastAttemptDate: string | null;
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
}

export const examService = {
  getAvailableTests: async (): Promise<TestMetadata[]> => {
    const response = await apiClient.get('tests/available');
    // Backend wraps: { success, message, data: <payload> }
    const payload = response.data?.data ?? response.data;
    if (!Array.isArray(payload)) return [];
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

  getQuestions: async (testId: string): Promise<QuestionData[]> => {
    const response = await apiClient.get(`tests/${testId}/questions`);
    const payload = response.data?.data ?? response.data;
    if (!Array.isArray(payload)) return [];
    return payload;
  },

  saveAnswers: async (attemptId: string, answers: SaveAnswerPayload[]) => {
    // Backend expects a single answer per request — send the last answer
    const saveableAnswers = answers.filter(answer => answer.status !== 'NOT_VISITED');
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
