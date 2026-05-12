import { apiClient } from './client';

export interface Subject {
  id: number;
  name: string;
}

export interface Topic {
  id: number;
  name: string;
  subject_id: number;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  subject_id: number;
  duration_minutes: number;
}

export interface Question {
  id: number;
  test_id: number;
  topic_id: number;
  text_en: string;
  text_hi?: string;
  options_en: Record<string, string>;
  options_hi?: Record<string, string>;
  correct_option: string;
  explanation_en?: string;
  explanation_hi?: string;
  difficulty: string;
}

export const adminService = {
  // Subjects
  getSubjects: async () => {
    const response = await apiClient.get('admin/subjects');
    return response.data?.data || [];
  },
  createSubject: async (name: string) => {
    const response = await apiClient.post('admin/subjects', { name });
    return response.data?.data;
  },

  // Topics
  getTopics: async () => {
    const response = await apiClient.get('admin/topics');
    return response.data?.data || [];
  },
  createTopic: async (name: string, subjectId: number) => {
    const response = await apiClient.post('admin/topics', { name, subject_id: subjectId });
    return response.data?.data;
  },

  // Tests
  getTests: async () => {
    const response = await apiClient.get('admin/tests');
    return response.data?.data || [];
  },
  createTest: async (data: any) => {
    const response = await apiClient.post('admin/tests', data);
    return response.data?.data;
  },

  // Questions
  getQuestions: async (testId?: number) => {
    const url = testId ? `admin/questions?test_id=${testId}` : 'admin/questions';
    const response = await apiClient.get(url);
    return response.data?.data || [];
  },
  createQuestion: async (data: any) => {
    const response = await apiClient.post('admin/questions', data);
    return response.data?.data;
  },
  bulkCreateQuestions: async (questions: any[]) => {
    const response = await apiClient.post('admin/questions/bulk', { questions });
    return response.data?.data;
  },
  getPipelineObservability: async () => {
    const response = await apiClient.get('admin/observability/pipeline');
    return response.data?.data;
  }
};
