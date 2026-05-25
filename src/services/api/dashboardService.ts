import { apiClient } from './client';
import { normalizeReportPayload } from './contracts';

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord => (
  value && typeof value === 'object' ? value as ApiRecord : {}
);

const asNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

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
  totalQuestions: number;
  totalTime: number;
  subjectScores: { subject: string; score: number; total: number }[];
  confidenceAnalytics: { level: string; accuracy: number; count: number }[];
  topicWiseAnalysis: Record<string, { correct: number; incorrect: number; unattempted?: number; skipped?: number; total: number; time?: number }>;
  averageTimePerQuestion: number;
  generatedAt?: string;
  strengths: string[];
  weaknesses: string[];
  narrative?: string;
  behavioral_analysis?: ApiRecord;
  telemetry_summary?: ApiRecord;
  processingStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | string;
  processing_status?: 'PENDING' | 'COMPLETED' | 'FAILED' | string;
  truth_status?: 'VERIFIED' | 'FAILED' | 'UNVERIFIED'; // Phase 8: Forensic integrity gate
  reliability_score?: number;
  report_version?: string;
  rendering_version?: string;
  evaluation_version?: string;
  telemetry_version?: string;
}

export interface ReportReadinessOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onStatus?: (report: PerformanceReport, elapsedMs: number) => void;
}

export const isReportReadyForStudent = (report: PerformanceReport): boolean => {
  const processingStatus = report.processingStatus ?? report.processing_status;
  const reliability = Number(report.reliability_score);

  return (
    processingStatus === 'COMPLETED' &&
    report.truth_status === 'VERIFIED' &&
    Number.isFinite(reliability) &&
    reliability > 0 &&
    !!report.behavioral_analysis &&
    !!report.telemetry_summary
  );
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    return payload.map((rawItem: unknown) => {
      const item = asRecord(rawItem);
      return {
      ...item,
      status: item.status === 'SUBMITTED' ? 'COMPLETED' : item.status,
    };
    }) as HistoryItem[];
  },

  getReport: async (attemptId?: string): Promise<PerformanceReport> => {
    const url = attemptId ? `reports/${attemptId}` : 'reports/aggregate';
    const response = await apiClient.get(url);
    const payload = asRecord(response.data?.data ?? response.data ?? {});
    const rawTopicWiseAnalysis = asRecord(payload.topicWiseAnalysis ?? payload.topic_wise_analysis);
    const topicWiseAnalysis = Object.fromEntries(
      Object.entries(rawTopicWiseAnalysis).map(([topic, rawValue]) => {
        const value = asRecord(rawValue);
        return [topic, {
          correct: asNumber(value.correct),
          incorrect: asNumber(value.incorrect),
          unattempted: asNumber(value.unattempted ?? value.skipped),
          skipped: asNumber(value.skipped ?? value.unattempted),
          total: asNumber(value.total),
          time: asNumber(value.time),
        }];
      })
    );
    const subjectWise = payload.subjectWisePerformance ?? payload.subject_wise_performance ?? {};
    const confidenceRaw = payload.confidenceAnalytics ?? payload.confidence_analysis ?? [];
    const subjectScores = Array.isArray(payload.subjectScores)
      ? payload.subjectScores.map((rawItem: unknown) => {
          const item = asRecord(rawItem);
          return {
            subject: typeof item.subject === 'string' ? item.subject : 'General',
            score: asNumber(item.score),
            total: asNumber(item.total, asNumber(item.score)),
          };
        })
      : Object.entries(asRecord(subjectWise)).map(([subject, rawValue]) => {
        const value = asRecord(rawValue);
        return {
          subject,
          score: asNumber(value.correct),
          total: asNumber(value.total, asNumber(value.correct) + asNumber(value.incorrect) + asNumber(value.unattempted)),
        };
      });
    const confidenceAnalytics = Array.isArray(confidenceRaw)
      ? confidenceRaw.map((rawItem: unknown) => {
          const item = asRecord(rawItem);
          return {
            level: typeof item.level === 'string' ? item.level : 'UNKNOWN',
            accuracy: asNumber(item.accuracy),
            count: asNumber(item.count),
          };
        })
      : Object.entries(asRecord(confidenceRaw)).map(([level, rawValue]) => {
        const value = asRecord(rawValue);
        const total = asNumber(value.total);
        return {
          level,
          accuracy: total ? (asNumber(value.correct) / total) * 100 : 0,
          count: total,
        };
      });
    const strictReport = normalizeReportPayload(payload, attemptId);
    const totalScore = strictReport.totalScore;
    const accuracy = strictReport.accuracy;
    const strengths = Object.entries(topicWiseAnalysis)
      .filter(([, rawValue]) => {
        const value = asRecord(rawValue);
        const total = asNumber(value.total);
        return total && (asNumber(value.correct) / total) >= 0.7;
      })
      .map(([topic]) => topic);
    const weaknesses = Object.entries(topicWiseAnalysis)
      .filter(([, rawValue]) => {
        const value = asRecord(rawValue);
        const total = asNumber(value.total);
        return total && (asNumber(value.correct) / total) < 0.5;
      })
      .map(([topic]) => topic);
    const generatedAt = payload.generatedAt ?? payload.generated_at;
    const processingStatus = payload.processingStatus ?? payload.processing_status;
    const processingStatusSnake = payload.processing_status ?? payload.processingStatus;

    return {
      attemptId: String(payload.attemptId ?? payload.attempt_id ?? attemptId ?? ''),
      totalScore,
      accuracy,
      percentile: asNumber(payload.percentile, Math.max(5, Math.min(99, Math.round(accuracy * 0.9 + 10)))),
      correctCount: strictReport.correctCount,
      incorrectCount: strictReport.incorrectCount,
      unattemptedCount: strictReport.unattemptedCount,
      totalQuestions: strictReport.totalQuestions,
      totalTime: asNumber(payload.totalTime ?? payload.total_time),
      subjectScores,
      confidenceAnalytics,
      topicWiseAnalysis,
      averageTimePerQuestion: asNumber(payload.averageTimePerQuestion ?? payload.average_time_per_question),
      generatedAt: typeof generatedAt === 'string' ? generatedAt : undefined,
      strengths,
      weaknesses,
      narrative: typeof payload.narrative === 'string' ? payload.narrative : undefined,
      behavioral_analysis: asRecord(payload.behavioral_analysis),
      telemetry_summary: asRecord(payload.telemetry_summary),
      processingStatus: typeof processingStatus === 'string' ? processingStatus : 'PENDING',
      processing_status: typeof processingStatusSnake === 'string' ? processingStatusSnake : 'PENDING',
      truth_status: payload.truth_status === 'VERIFIED' || payload.truth_status === 'FAILED' || payload.truth_status === 'UNVERIFIED' ? payload.truth_status : 'UNVERIFIED',
      reliability_score: asNumber(payload.reliability_score),
      report_version: typeof payload.report_version === 'string' ? payload.report_version : '1.0.0',
      rendering_version: typeof payload.rendering_version === 'string' ? payload.rendering_version : '1.0.0',
      evaluation_version: typeof payload.evaluation_version === 'string' ? payload.evaluation_version : '1.0.0',
      telemetry_version: typeof payload.telemetry_version === 'string' ? payload.telemetry_version : '1.0.0',
    };
  },

  waitForReportReady: async (attemptId: string, options: ReportReadinessOptions = {}): Promise<PerformanceReport> => {
    const intervalMs = options.intervalMs ?? 1200;
    const timeoutMs = options.timeoutMs ?? 90000;
    const startedAt = Date.now();

    while (Date.now() - startedAt <= timeoutMs) {
      const report = await dashboardService.getReport(attemptId);
      const elapsedMs = Date.now() - startedAt;
      options.onStatus?.(report, elapsedMs);

      const processingStatus = report.processingStatus ?? report.processing_status;
      if (processingStatus === 'FAILED' || report.truth_status === 'FAILED') {
        throw new Error(`Report integrity processing failed for attempt ${attemptId}.`);
      }

      if (isReportReadyForStudent(report)) {
        return report;
      }

      await wait(intervalMs);
    }

    throw new Error(`Timed out waiting for finalized report truth for attempt ${attemptId}.`);
  },

  getReportReview: async (attemptId: string) => {
    const response = await apiClient.get(`reports/${attemptId}/review`);
    return response.data?.data;
  },

  getBehavioralAnalysis: async (attemptId: string) => {
    const response = await apiClient.get(`reports/${attemptId}/behavior`);
    return response.data?.data;
  },

  getEvolution: async (): Promise<ApiRecord> => {
    const response = await apiClient.get('dashboard/evolution');
    return response.data?.data;
  },

  getRecommendations: async (): Promise<ApiRecord> => {
    const response = await apiClient.get('dashboard/recommendations');
    return response.data?.data;
  },

  exportJourney: async (): Promise<ApiRecord> => {
    const response = await apiClient.get('dashboard/export-journey');
    return response.data?.data;
  }
};
