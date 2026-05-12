import { apiClient } from './client';

export interface DashboardSummary {
  totalTestsTaken: number;
  averageScore: number;
  recentTests: {
    attemptId: string;
    testTitle: string;
    score: number;
    maxScore: number;
    date: string;
  }[];
}

export interface PerformanceReport {
  attemptId?: string;
  totalScore: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  subjectScores: { subject: string; score: number }[];
  confidenceAnalytics: { level: string; accuracy: number; count: number }[];
  topicWiseAnalysis?: Record<string, { correct: number; incorrect: number; unattempted: number; total: number }>;
  averageTimePerQuestion?: number;
  generatedAt?: string;
}

export interface HistoryItem {
  attemptId: string;
  title: string;
  date: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'ABANDONED';
  score: number | null;
  maxScore: number;
  accuracy: string;
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('dashboard/summary');
    const payload = response.data?.data ?? response.data;
    return {
      totalTestsTaken: payload?.totalTestsTaken ?? 0,
      averageScore: payload?.averageScore ?? 0,
      recentTests: payload?.recentTests ?? [],
    };
  },

  getHistory: async (): Promise<HistoryItem[]> => {
    const response = await apiClient.get('attempts/history');
    const payload = response.data?.data ?? response.data;
    if (!Array.isArray(payload)) return [];
    return payload.map((item: any) => ({
      ...item,
      status: item.status === 'SUBMITTED' ? 'COMPLETED' : item.status,
    })) as HistoryItem[];
  },

  getReport: async (attemptId?: string): Promise<PerformanceReport> => {
    const url = attemptId ? `reports/${attemptId}` : 'reports/aggregate';
    const response = await apiClient.get(url);
    return response.data?.data;
  },

  getReportReview: async (attemptId: string) => {
    const response = await apiClient.get(`reports/${attemptId}/review`);
    return response.data?.data;
  },

  getBehavioralAnalysis: async (attemptId: string) => {
    const response = await apiClient.get(`reports/${attemptId}/behavior`);
    return response.data?.data;
  }
};
