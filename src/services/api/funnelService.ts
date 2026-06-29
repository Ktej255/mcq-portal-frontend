import { apiClient } from './client';

/**
 * API client for the Interactive Learning Funnel.
 *
 * Wraps all `/api/v1/gs-lms/{subject}/funnel/*` backend endpoints with typed
 * request/response interfaces. Follows the established `gsLmsService.ts`
 * pattern: single exported object, shared `apiClient`, `unwrap` helper.
 *
 * Requirements: 13.2, 13.6
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FunnelStateOut {
  node_id: number;
  current_step: number;        // 1-14
  completed_steps: number[];
  started_at: string | null;
  last_activity_at: string | null;
}

export interface ConceptMatchOut {
  concept: string;
  matched: boolean;
  matched_fragment: string | null;
}

export interface RecallCheckOut {
  recall_score: number;         // 0-100
  confidence_score: number;     // 0-100
  concepts: ConceptMatchOut[];
  total_concepts: number;
  matched_count: number;
  stt_confidence: number | null;
}

export interface McqLabQuestionOut {
  question_id: number;
  question_type: string;
  question_text: string;
  statements: string[];
  options: Array<{ label: string; text: string }>;
  display_order: number;
}

export interface McqLabAttemptOut {
  question_id: number;
  chosen_answer: string;
  correct_answer: string;
  is_correct: boolean;
  question_type: string;
  explanation: string | null;
}

export interface McqLabTypeBreakdownOut {
  question_type: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface McqLabResultOut {
  total_questions: number;
  correct_count: number;
  score: number;                // 0-100 percentage
  attempts: McqLabAttemptOut[];
  type_breakdown: McqLabTypeBreakdownOut[];
}

export interface MainsQuestionOut {
  question_id: number;
  gs_paper: string;             // "GS1" | "GS2" | "GS3" | "GS4"
  year: number;
  marks: number;
  word_limit: number;           // 150 or 250
  question_text: string;
}

export interface MainsSubmitPayload {
  introduction: string;
  body: string;
  conclusion: string;
  mode: 'TYPED' | 'HANDWRITTEN' | 'SPEECH';
}

export interface MainsEvalStatusOut {
  job_id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'DEGRADED';
  report: EvaluationReportOut | null;
}

export interface EvaluationReportOut {
  marks_awarded: number;
  max_marks: number;
  word_count: number;
  word_limit: number;
  sections: Record<string, { feedback: string; score: number }>;
  incomplete_sections: string[];
  is_complete: boolean;
}

export interface GrowthReportOut {
  topic_title: string;
  generated_at: string;
  section_metrics: Array<{
    section_label: string;
    reading_time_seconds: number;
    recall_score: number;       // 0-100
    confidence_score: number;   // 0-100
    is_rushed: boolean;
  }>;
  mcq_total_score: number;      // 0-100
  mcq_type_breakdown: Array<{
    question_type: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  mains_score: number | null;
  mains_max_marks: number | null;
  next_recall_date: string;
  recall_interval_days: number;
  comparison: {
    avg_recall_trend: number[];
    mcq_accuracy_trend: number[];
    report_count: number;
  } | null;
  weaknesses: Array<{
    category: 'rushed_section' | 'low_recall' | 'weak_type';
    label: string;
    value: number;
    recommended_action: string;
  }>;
}

export interface UpcomingRecallOut {
  node_id: number;
  title: string;
  due_date: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const unwrap = <T>(data: unknown): T => {
  const record = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {});
  return (record.data ?? record) as T;
};

export const funnelService = {
  // -------------------------------------------------------------------------
  // Funnel State
  // -------------------------------------------------------------------------

  getFunnelState: async (subject = "geography", nodeId: number): Promise<FunnelStateOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/funnel/${nodeId}/state`);
    return unwrap<FunnelStateOut>(response.data);
  },

  completeStep: async (subject = "geography", nodeId: number, step: number): Promise<FunnelStateOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/funnel/${nodeId}/complete-step`, { step });
    return unwrap<FunnelStateOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Reading Time
  // -------------------------------------------------------------------------

  submitReadingTime: async (subject = "geography", nodeId: number, sectionId: number, durationSeconds: number): Promise<void> => {
    await apiClient.post(`gs-lms/${subject}/funnel/${nodeId}/reading-time`, {
      section_id: sectionId,
      duration_seconds: durationSeconds,
    });
  },

  // -------------------------------------------------------------------------
  // Recall Check
  // -------------------------------------------------------------------------

  submitRecallText: async (subject = "geography", nodeId: number, sectionLabel: string, text: string): Promise<RecallCheckOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/funnel/${nodeId}/recall/text`, {
      section_label: sectionLabel,
      text,
    });
    return unwrap<RecallCheckOut>(response.data);
  },

  submitRecallAudio: async (subject = "geography", nodeId: number, sectionLabel: string, audioBlob: Blob): Promise<RecallCheckOut> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recall.webm');
    formData.append('section_label', sectionLabel);
    const response = await apiClient.post(`gs-lms/${subject}/funnel/${nodeId}/recall/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<RecallCheckOut>(response.data);
  },

  getRecallAttempt: async (subject = "geography", nodeId: number, sectionLabel: string): Promise<RecallCheckOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/funnel/${nodeId}/recall/${sectionLabel}`);
    return unwrap<RecallCheckOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // MCQ Lab
  // -------------------------------------------------------------------------

  getMcqLabQuestions: async (subject = "geography", nodeId: number): Promise<McqLabQuestionOut[]> => {
    const response = await apiClient.get(`gs-lms/${subject}/funnel/${nodeId}/mcq-lab/questions`);
    return unwrap<McqLabQuestionOut[]>(response.data);
  },

  submitMcqLab: async (subject = "geography", nodeId: number, answers: Array<{ question_id: number; chosen_answer: string; time_taken_seconds?: number }>): Promise<McqLabResultOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/funnel/${nodeId}/mcq-lab/submit`, { answers });
    return unwrap<McqLabResultOut>(response.data);
  },

  getMcqLabResult: async (subject = "geography", nodeId: number): Promise<McqLabResultOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/funnel/${nodeId}/mcq-lab/result`);
    return unwrap<McqLabResultOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Mains Practice
  // -------------------------------------------------------------------------

  getMainsQuestions: async (subject = "geography", nodeId: number): Promise<MainsQuestionOut[]> => {
    const response = await apiClient.get(`gs-lms/${subject}/funnel/${nodeId}/mains/questions`);
    return unwrap<MainsQuestionOut[]>(response.data);
  },

  submitMainsAnswer: async (subject = "geography", nodeId: number, questionId: number, payload: MainsSubmitPayload): Promise<{ job_id: string }> => {
    const response = await apiClient.post(`gs-lms/${subject}/funnel/${nodeId}/mains/submit`, {
      question_id: questionId,
      ...payload,
    });
    return unwrap<{ job_id: string }>(response.data);
  },

  pollMainsEvaluation: async (subject = "geography", nodeId: number, jobId: string): Promise<MainsEvalStatusOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/funnel/${nodeId}/mains/status/${jobId}`);
    return unwrap<MainsEvalStatusOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Growth Report
  // -------------------------------------------------------------------------

  getGrowthReport: async (subject = "geography", nodeId: number): Promise<GrowthReportOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/funnel/${nodeId}/growth-report`);
    return unwrap<GrowthReportOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Spaced Repetition
  // -------------------------------------------------------------------------

  getUpcomingRecalls: async (subject = "geography"): Promise<UpcomingRecallOut[]> => {
    const response = await apiClient.get(`gs-lms/${subject}/spaced-rep/upcoming`);
    return unwrap<UpcomingRecallOut[]>(response.data);
  },

  // -------------------------------------------------------------------------
  // Weakness Pattern
  // -------------------------------------------------------------------------

  getWeaknessPattern: async (subject = "geography"): Promise<Array<{ question_type: string; accuracy: number; total_attempts: number; is_weak: boolean }>> => {
    const response = await apiClient.get(`gs-lms/${subject}/weakness-pattern`);
    return unwrap<Array<{ question_type: string; accuracy: number; total_attempts: number; is_weak: boolean }>>(response.data);
  },
};
