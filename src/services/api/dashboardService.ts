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
    // Backend wraps all responses: { success, message, data: <payload> }
    const payload = response.data?.data ?? response.data;
    return {
      totalTestsTaken: payload?.totalTestsTaken ?? 0,
      averageScore: payload?.averageScore ?? 0,
      recentTests: payload?.recentTests ?? [],
    };
  },

  getHistory: async (): Promise<HistoryItem[]> => {
    const response = await apiClient.get('/attempts/history');
    const payload = response.data?.data ?? response.data;
    if (!Array.isArray(payload)) return [];
    // Backend uses status "SUBMITTED" — normalise to "COMPLETED" for the UI
    return payload.map((item: Record<string, unknown>) => ({
      ...item,
      status: item.status === 'SUBMITTED' ? 'COMPLETED' : item.status,
    })) as HistoryItem[];
  },

  getReport: async (attemptId?: string): Promise<PerformanceReport> => {
    const url = attemptId ? `/reports/${attemptId}` : '/reports/aggregate';
    const response = await apiClient.get(url);
    const payload = response.data?.data ?? response.data;
    return {
      subjectScores: payload?.subjectScores ?? [],
      confidenceAnalytics: Array.isArray(payload?.confidenceAnalytics)
        ? payload.confidenceAnalytics
        : [],
      scoreTrends: payload?.scoreTrends ?? [],
    };
  },
};
