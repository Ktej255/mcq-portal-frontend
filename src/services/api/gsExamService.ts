import { apiClient } from './client';
import type { LearnerProfile } from './gsLmsService';

/**
 * (Named gsExamService because examService.ts is the mock-test service.)
 * Exam catalogue + the student's chosen exam (UPSC / NEET / JEE).
 *
 * Kept apart from gsLmsService; same shared `apiClient`. Exams are rows in
 * `gs_exams`; only active exams are listed, so an exam the owner has not
 * switched on yet can neither be seen nor picked (see docs/EXAMS.md).
 */

export interface ExamOut {
  code: string;
  name: string;
  display_order: number;
  /** Student-facing name of the content levels for this exam. */
  content_level_label?: string | null;
}

const unwrap = <T>(data: unknown): T => {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  return (record.data ?? record) as T;
};

export const gsExamService = {
  /** Active exams, in display order. */
  getExams: async (): Promise<ExamOut[]> => {
    const response = await apiClient.get('gs-lms/exams', { skipUpgradePrompt: true });
    return unwrap<ExamOut[]>(response.data);
  },

  /**
   * Save the student's exam. PUT replaces the profile's style/level/path/books,
   * so those are sent back unchanged from `current`; only `exam_code` changes.
   */
  saveExam: async (current: LearnerProfile, examCode: string): Promise<LearnerProfile> => {
    const response = await apiClient.put('gs-lms/profile', {
      preferred_style: current.preferred_style,
      preferred_level: current.preferred_level,
      study_path: current.study_path,
      book_ids: current.book_ids,
      exam_code: examCode,
    });
    return unwrap<LearnerProfile>(response.data);
  },
};
