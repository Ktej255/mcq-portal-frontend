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
  subjectScores: { subject: string; score: number; total: number }[];
  confidenceAnalytics: { level: string; accuracy: number; count: number }[];
  scoreTrends: { date: string; score: number }[];
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
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  },

  getHistory: async (): Promise<HistoryItem[]> => {
    const response = await apiClient.get('/attempts/history');
    return response.data;
  },

  getReport: async (attemptId?: string): Promise<PerformanceReport> => {
    const url = attemptId ? `/reports/${attemptId}` : '/reports/aggregate';
    const response = await apiClient.get(url);
    return response.data;
  }
};
