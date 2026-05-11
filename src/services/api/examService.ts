import { apiClient } from './client';
import { ConfidenceLevel, QuestionStatus } from '@/lib/store/useExamStore';

export interface TestMetadata {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  subjects: string[];
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
    const response = await apiClient.get('/tests/available');
    return response.data;
  },
  
  getTestById: async (testId: string): Promise<TestMetadata> => {
    const response = await apiClient.get(`/tests/${testId}`);
    return response.data;
  },

  startAttempt: async (testId: string): Promise<AttemptData> => {
    const response = await apiClient.post(`/attempts/start`, { testId });
    return response.data;
  },

  getQuestions: async (testId: string): Promise<QuestionData[]> => {
    const response = await apiClient.get(`/tests/${testId}/questions`);
    return response.data;
  },

  saveAnswers: async (attemptId: string, answers: SaveAnswerPayload[]) => {
    const response = await apiClient.put(`/attempts/${attemptId}/answers`, { answers });
    return response.data;
  },

  submitTest: async (attemptId: string) => {
    const response = await apiClient.post(`/attempts/${attemptId}/submit`);
    return response.data;
  }
};
