import { apiClient } from './client';

/**
 * Operator content-coverage API.
 *
 * Read-only view of the exact review gates a learner hits: REVIEWED sections,
 * REVIEWED PYQs for demand, and the 15-question MCQ Lab threshold. ADMIN only.
 */

const unwrap = <T>(data: unknown): T => {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  return (record.data ?? record) as T;
};

export interface TopicCoverage {
  node_id: number;
  title: string;
  display_order: number;
  topic_reviewed: boolean;
  sections_reviewed: number;
  sections_expected: number;
  missing_sections: string[];
  sections_unreviewed: number;
  prelims_pyqs_reviewed: number;
  mains_pyqs_reviewed: number;
  pyqs_reviewed: number;
  mcqs_reviewed: number;
  mcq_lab_min: number;
  mcq_types: Record<string, number>;
  content_open: boolean;
  demand_measured: boolean;
  lab_open: boolean;
  full_depth: boolean;
  learner_ready: boolean;
  blockers: string[];
}

export interface CoverageTotals {
  topics: number;
  topics_hidden: number;
  learner_ready: number;
  content_open: number;
  demand_measured: number;
  lab_open: number;
  full_depth: number;
  sections_reviewed: number;
  sections_expected: number;
  pyqs_reviewed: number;
  mcqs_reviewed: number;
  blocker_counts: Record<string, number>;
}

export interface ContentCoverage {
  subject: string;
  subject_name: string;
  generated_at: string;
  mcq_lab_min: number;
  canonical_sections: string[];
  totals: CoverageTotals;
  topics: TopicCoverage[];
}

export const contentCoverageService = {
  getContentCoverage: async (subject = 'geography'): Promise<ContentCoverage> => {
    const response = await apiClient.get(`admin/gs-lms/content-coverage/${subject}`);
    return unwrap<ContentCoverage>(response.data);
  },
};
