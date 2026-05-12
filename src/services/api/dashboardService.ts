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
  percentile: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  subjectScores: { subject: string; score: number; total: number }[];
  confidenceAnalytics: { level: string; accuracy: number; count: number }[];
  topicWiseAnalysis: Record<string, { correct: number; incorrect: number; unattempted: number; total: number }>;
  averageTimePerQuestion: number;
  generatedAt?: string;
  strengths: string[];
  weaknesses: string[];
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
    const payload = response.data?.data ?? response.data ?? {};
    const topicWiseAnalysis = payload.topicWiseAnalysis ?? payload.topic_wise_analysis ?? {};
    const subjectWise = payload.subjectWisePerformance ?? payload.subject_wise_performance ?? {};
    const confidenceRaw = payload.confidenceAnalytics ?? payload.confidence_analysis ?? [];
    const subjectScores = Array.isArray(payload.subjectScores)
      ? payload.subjectScores.map((item: any) => ({ ...item, total: item.total ?? item.score ?? 0 }))
      : Object.entries(subjectWise).map(([subject, value]: [string, any]) => ({
          subject,
          score: value.correct ?? 0,
          total: value.total ?? ((value.correct ?? 0) + (value.incorrect ?? 0) + (value.unattempted ?? 0)),
        }));
    const confidenceAnalytics = Array.isArray(confidenceRaw)
      ? confidenceRaw
      : Object.entries(confidenceRaw).map(([level, value]: [string, any]) => ({
          level,
          accuracy: value.total ? ((value.correct ?? 0) / value.total) * 100 : 0,
          count: value.total ?? 0,
        }));
    const totalScore = payload.totalScore ?? payload.total_score ?? 0;
    const accuracy = payload.accuracy ?? 0;
    const strengths = Object.entries(topicWiseAnalysis)
      .filter(([, value]: [string, any]) => value.total && ((value.correct ?? 0) / value.total) >= 0.7)
      .map(([topic]) => topic);
    const weaknesses = Object.entries(topicWiseAnalysis)
      .filter(([, value]: [string, any]) => value.total && ((value.correct ?? 0) / value.total) < 0.5)
      .map(([topic]) => topic);

    return {
      attemptId: String(payload.attemptId ?? payload.attempt_id ?? attemptId ?? ''),
      totalScore,
      accuracy,
      percentile: payload.percentile ?? Math.max(5, Math.min(99, Math.round(accuracy * 0.9 + 10))),
      correctCount: payload.correctCount ?? payload.correct_count ?? 0,
      incorrectCount: payload.incorrectCount ?? payload.incorrect_count ?? 0,
      unattemptedCount: payload.unattemptedCount ?? payload.unattempted_count ?? 0,
      subjectScores,
      confidenceAnalytics,
      topicWiseAnalysis,
      averageTimePerQuestion: payload.averageTimePerQuestion ?? payload.average_time_per_question ?? 0,
      generatedAt: payload.generatedAt ?? payload.generated_at,
      strengths,
      weaknesses,
    };
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
