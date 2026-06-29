import { apiClient } from './client';

/**
 * API client for the GS LMS answer-writing + evaluation endpoints
 * (`/api/v1/gs-lms/{subject}/answers/*`).
 *
 * Mirrors the `gsLmsService` pattern: single exported object, shared
 * `apiClient`, `unwrap` helper. Auth is handled centrally by the request
 * interceptor.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GsPaper = 'GS1' | 'GS2' | 'GS3' | 'GS4';

export type AnswerEvalStatus =
  | 'in_progress'
  | 'completed'
  | 'degraded'
  | 'failed'
  | 'review_required'
  | 'draft';

export interface TypedAnswerIn {
  raw_text?: string;
  intro_text?: string;
  body_text?: string;
  conclusion_text?: string;
  pyq_id?: number;
  question_text?: string;
  gs_paper?: GsPaper;
  max_marks?: number;
}

export interface AnswerAck {
  attempt_id: number;
  status: AnswerEvalStatus;
  message?: string | null;
  review_required?: boolean;
}

export interface PageUploadOut {
  attempt_id: number;
  image_id: number;
  page_order: number;
  total_pages: number;
}

export interface EvaluationSection {
  feedback: string;
  score: number | null;
}

export interface EvaluationReportOut {
  report_id: number;
  attempt_id: number;
  sections: Record<string, EvaluationSection>;
  incomplete_sections: string[];
  is_complete: boolean;
  overall_score: number | null;
  marks_awarded: number | null;
  max_marks: number | null;
  word_count: number | null;
  word_limit: number | null;
  value_addition: Record<string, unknown> | null;
  factual_accuracy: Record<string, unknown> | null;
  overridden: boolean;
}

export interface AnswerStatusOut {
  attempt_id: number;
  status: AnswerEvalStatus;
  report: EvaluationReportOut | null;
  message?: string | null;
}

export interface OverrideIn {
  sections: Record<string, EvaluationSection>;
  incomplete_sections: string[];
  overall_score?: number;
  marks_awarded?: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const unwrap = <T>(data: unknown): T => {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  return (record.data ?? record) as T;
};

export const gsAnswerService = {
  /** Submit a typed descriptive answer; returns the evaluation ack. */
  submitTyped: async (subject = 'geography', payload: TypedAnswerIn): Promise<AnswerAck> => {
    const response = await apiClient.post(`gs-lms/${subject}/answers/typed`, payload);
    return unwrap<AnswerAck>(response.data);
  },

  /** Create a handwritten attempt (then upload pages and submit). */
  createHandwritten: async (subject = 'geography', payload: TypedAnswerIn): Promise<AnswerAck> => {
    const response = await apiClient.post(`gs-lms/${subject}/answers/handwritten`, payload);
    return unwrap<AnswerAck>(response.data);
  },

  /** Upload one handwritten answer page (image). */
  uploadPage: async (
    subject = 'geography',
    attemptId: number,
    file: File,
    pageOrder: number,
    opts?: { ocrText?: string; ocrConfidence?: number },
  ): Promise<PageUploadOut> => {
    const form = new FormData();
    form.append('image', file);
    form.append('page_order', String(pageOrder));
    if (opts?.ocrText != null) form.append('ocr_text', opts.ocrText);
    if (opts?.ocrConfidence != null) form.append('ocr_confidence', String(opts.ocrConfidence));
    const response = await apiClient.post(
      `gs-lms/${subject}/answers/${attemptId}/pages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap<PageUploadOut>(response.data);
  },

  /** Submit a handwritten attempt for evaluation (optionally acknowledging review). */
  submitAttempt: async (
    subject = 'geography',
    attemptId: number,
    acknowledgeReview = false,
  ): Promise<AnswerAck> => {
    const form = new FormData();
    form.append('acknowledge_review', String(acknowledgeReview));
    const response = await apiClient.post(
      `gs-lms/${subject}/answers/${attemptId}/submit`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap<AnswerAck>(response.data);
  },

  /** Poll the evaluation job status (and report when ready). */
  getStatus: async (subject = 'geography', attemptId: number): Promise<AnswerStatusOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/answers/${attemptId}/status`);
    return unwrap<AnswerStatusOut>(response.data);
  },

  /** Fetch the persisted evaluation report (ownership-scoped). */
  getReport: async (subject = 'geography', attemptId: number): Promise<EvaluationReportOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/answers/${attemptId}/report`);
    return unwrap<EvaluationReportOut>(response.data);
  },

  /** Evaluator override of a report. */
  override: async (
    subject = 'geography',
    attemptId: number,
    payload: OverrideIn,
  ): Promise<EvaluationReportOut> => {
    const response = await apiClient.post(
      `gs-lms/${subject}/answers/${attemptId}/override`,
      payload,
    );
    return unwrap<EvaluationReportOut>(response.data);
  },

  /** URL for an access-controlled answer-sheet page image. */
  pageImageUrl: (subject = 'geography', attemptId: number, pageOrder: number): string =>
    `gs-lms/${subject}/answers/${attemptId}/pages/${pageOrder}`,
};
