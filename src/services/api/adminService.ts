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
  status: string;
  reviewer_id?: number;
  explanation_quality_score?: number;
  bilingual_alignment_score?: number;
  is_current_affairs?: boolean;
  content_date?: string;
  is_outdated: boolean;
  question_number?: number;
  quality_notes?: any;
  created_at: string;
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
  getQuestions: async (testId?: number, skip = 0, limit = 100) => {
    const params = new URLSearchParams();
    if (testId) params.append('test_id', testId.toString());
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    const response = await apiClient.get(`admin/questions?${params.toString()}`);
    return response.data; // Return full PaginatedResponse
  },
  createQuestion: async (data: any) => {
    const response = await apiClient.post('admin/questions', data);
    return response.data?.data;
  },
  updateQuestion: async (id: number, data: any) => {
    const response = await apiClient.put(`admin/questions/${id}`, data);
    return response.data?.data;
  },
  deleteQuestion: async (id: number) => {
    const response = await apiClient.delete(`admin/questions/${id}`);
    return response.data?.data;
  },
  bulkCreateQuestions: async (questions: any[]) => {
    const response = await apiClient.post('admin/questions/bulk', { questions });
    return response.data?.data;
  },
  getPipelineObservability: async () => {
    const response = await apiClient.get('admin/observability/pipeline');
    return response.data?.data;
  },
  recalibrateBatches: async () => {
    const response = await apiClient.post('admin/recalibrate-batches');
    return response.data;
  }
};
