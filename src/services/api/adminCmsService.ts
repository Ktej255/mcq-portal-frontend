import { apiClient } from './client';

/**
 * Admin CMS API service — manages CA items, threads, MCQs, Mains, bulk ops.
 * All endpoints require ADMIN role.
 *
 * Requirements: 10.1, 14.4, 14.7
 */

const unwrap = <T>(data: unknown): T => {
  const record = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {});
  return (record.data ?? record) as T;
};

export interface CAItemFormData {
  title: string;
  publish_date: string;
  subject: string;
  secondary_subjects: string[];
  gs_paper: string;
  exam_relevance: string;
  video_url: string;
  content_blocks: Array<{ type: string; content: string }>;
  source_authority: string;
  relevance_score: number;
  upsc_statement_frames: { prelims_statements: string[]; mains_angle: string } | null;
  so_what_analysis: { who_benefits: string; who_loses: string; what_changes_next: string; upsc_angle: string; connected_static_topic: string } | null;
  mcqs: Array<{ question_text: string; question_type: string; options: Array<{ label: string; text: string }>; correct_answer: string; explanation: string }>;
  mains_questions: Array<{ question_text: string; gs_paper: string; marks: number; word_limit: number; model_answer: string }>;
}

export interface AdminCAListItem {
  id: number;
  title: string;
  publish_date: string;
  subject: string;
  gs_paper: string;
  review_status: string;
  relevance_score: number;
}

export interface BulkImportResult {
  created: number;
  failed: number;
  errors: Array<{ index: number; message: string }>;
}

export const adminCmsService = {
  // CA Items
  getItems: async (filters?: { status?: string; subject?: string; page?: number }): Promise<{ items: AdminCAListItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.subject) params.set('subject', filters.subject);
    if (filters?.page) params.set('page', String(filters.page));
    const response = await apiClient.get(`admin/current-affairs/items?${params.toString()}`);
    return unwrap(response.data);
  },

  createItem: async (data: CAItemFormData): Promise<{ id: number }> => {
    const response = await apiClient.post('admin/current-affairs/items', data);
    return unwrap(response.data);
  },

  updateItem: async (itemId: number, data: Partial<CAItemFormData>): Promise<void> => {
    await apiClient.put(`admin/current-affairs/items/${itemId}`, data);
  },

  updateStatus: async (itemId: number, status: string): Promise<void> => {
    await apiClient.patch(`admin/current-affairs/items/${itemId}/status`, { status });
  },

  deleteItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`admin/current-affairs/items/${itemId}`);
  },

  bulkImport: async (items: CAItemFormData[]): Promise<BulkImportResult> => {
    const response = await apiClient.post('admin/current-affairs/items/bulk-import', { items });
    return unwrap(response.data);
  },
};
