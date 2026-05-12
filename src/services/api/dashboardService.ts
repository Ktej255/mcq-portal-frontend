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
  subjectScores: { subject: string; score: number; total: number }[];
  confidenceAnalytics: { level: string; accuracy: number; count: number }[];
  scoreTrends: { date: string; score: number }[];
  topicWiseAnalysis?: Record<string, { correct: number; incorrect: number; unattempted: number; total: number }>;
  subjectWisePerformance?: Record<string, { correct: number; incorrect: number; unattempted: number; total: number }>;
  averageTimePerQuestion?: number;
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
    // Backend wraps all responses: { success, message, data: <payload> }
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
    // Backend uses status "SUBMITTED" — normalise to "COMPLETED" for the UI
    return payload.map((item: Record<string, unknown>) => ({
      ...item,
      status: item.status === 'SUBMITTED' ? 'COMPLETED' : item.status,
    })) as HistoryItem[];
  },

  getReport: async (attemptId?: string): Promise<PerformanceReport> => {
    const url = attemptId ? `reports/${attemptId}` : 'reports/aggregate';
    const response = await apiClient.get(url);
    const payload = response.data?.data ?? response.data;
    return {
      attemptId: payload?.attemptId,
      totalScore: payload?.total_score ?? payload?.totalScore ?? 0,
      accuracy: payload?.accuracy ?? 0,
      correctCount: payload?.correct_count ?? payload?.correctCount ?? 0,
      incorrectCount: payload?.incorrect_count ?? payload?.incorrectCount ?? 0,
      unattemptedCount: payload?.unattempted_count ?? payload?.unattemptedCount ?? 0,
      subjectScores: payload?.subjectScores ?? [],
      confidenceAnalytics: Array.isArray(payload?.confidence_analysis || payload?.confidenceAnalytics)
        ? (payload.confidence_analysis || payload.confidenceAnalytics)
        : [],
      scoreTrends: payload?.scoreTrends ?? [],
      topicWiseAnalysis: payload?.topic_wise_analysis || payload?.topicWiseAnalysis,
      subjectWisePerformance: payload?.subject_wise_performance || payload?.subjectWisePerformance,
      averageTimePerQuestion: payload?.average_time_per_question || payload?.averageTimePerQuestion,
    };
  },
};
