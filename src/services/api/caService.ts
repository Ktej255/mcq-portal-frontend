import { apiClient } from './client';

/**
 * API client for the Daily Current Affairs Platform (student-facing).
 * Covers: feed, threads, graph, funnel, progress, revision, compilations.
 *
 * Requirements: 14.4
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CAFilters {
  subject: string | null;
  gs_paper: string | null;
  exam_relevance: string | null;
  date_range: 'today' | 'this_week' | 'this_month' | 'last_30' | 'custom' | null;
  date_from: string | null;
  date_to: string | null;
  thread_id: number | null;
  search: string | null;
  sort_by: 'publish_date' | 'relevance_score';
}

export interface CAItemCardData {
  id: number;
  title: string;
  publish_date: string;
  subject: string;
  gs_paper: string;
  exam_relevance: string;
  source_authority: string;
  relevance_score: number;
  has_video: boolean;
  is_completed: boolean;
  thread_titles: string[];
}

export interface CAFeedResponse {
  items: CAItemCardData[];
  total_count: number;
  today_count: number;
  page: number;
  page_size: number;
}

export interface CAItemDetailOut {
  id: number;
  title: string;
  publish_date: string;
  subject: string;
  secondary_subjects: string[];
  gs_paper: string;
  exam_relevance: string;
  video_url: string | null;
  content_blocks: Array<{ type: string; content: string }>;
  upsc_statement_frames: { prelims_statements: string[]; mains_angle: string } | null;
  so_what_analysis: { who_benefits: string; who_loses: string; what_changes_next: string; upsc_angle: string; connected_static_topic: string } | null;
  source_authority: string;
  relevance_score: number;
  threads: Array<{ id: number; title: string }>;
  syllabus_links: Array<{ node_id: number; topic_title: string }>;
}

export interface CAFunnelStateOut {
  item_id: number;
  current_step: number;
  completed_steps: number[];
  video_available: boolean;
  is_completed: boolean;
  started_at: string | null;
  last_activity_at: string | null;
}

export interface CAMcqOut {
  id: number;
  question_text: string;
  question_type: string;
  options: Array<{ label: string; text: string }>;
  display_order: number;
}

export interface CAMcqResultOut {
  total_questions: number;
  correct_count: number;
  score: number;
  attempts: Array<{ question_id: number; chosen_answer: string; correct_answer: string; is_correct: boolean; question_type: string; explanation: string }>;
}

export interface ThreadSummaryOut {
  id: number;
  title: string;
  primary_subject: string;
  status: string;
  direction: string;
  item_count: number;
  start_date: string;
}

export interface ThreadConsolidationOut {
  id: number;
  title: string;
  description: string;
  direction: string;
  primary_subject: string;
  items: Array<{ id: number; title: string; publish_date: string; key_takeaway: string; causality_direction: string | null; is_completed: boolean }>;
  coverage: { total_items: number; completed: number; mcqs_attempted: number };
  related_threads: Array<{ id: number; title: string }>;
}

export interface GraphNodeOut {
  id: string;
  node_type: 'ca_item' | 'syllabus_node';
  label: string;
  subject: string;
  relevance_score: number;
  publish_date: string | null;
  is_completed: boolean;
}

export interface GraphEdgeOut {
  id: string;
  source: string;
  target: string;
  edge_type: 'thread' | 'causality' | 'syllabus_link' | 'cross_subject';
  label: string | null;
}

export interface CAAnalyticsOut {
  streak: { current_streak: number; longest_streak: number; last_activity_date: string };
  coverage_by_subject: Array<{ subject: string; total_available: number; completed: number; percentage: number }>;
  overall_coverage_percent: number;
  missed_items_count: number;
  total_items_available: number;
  total_items_completed: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const unwrap = <T>(data: unknown): T => {
  const record = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {});
  return (record.data ?? record) as T;
};

export const caService = {
  // Feed
  getFeed: async (filters: Partial<CAFilters> = {}, page = 1): Promise<CAFeedResponse> => {
    const params = new URLSearchParams();
    if (filters.subject) params.set('subject', filters.subject);
    if (filters.gs_paper) params.set('gs_paper', filters.gs_paper);
    if (filters.exam_relevance) params.set('exam_relevance', filters.exam_relevance);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.thread_id) params.set('thread_id', String(filters.thread_id));
    if (filters.search) params.set('search', filters.search);
    if (filters.sort_by) params.set('sort_by', filters.sort_by);
    params.set('page', String(page));
    const response = await apiClient.get(`current-affairs/feed?${params.toString()}`);
    return unwrap<CAFeedResponse>(response.data);
  },

  getDailyCount: async (): Promise<number> => {
    const response = await apiClient.get('current-affairs/feed/today-count');
    return unwrap<number>(response.data);
  },

  getItemDetail: async (itemId: number): Promise<CAItemDetailOut> => {
    const response = await apiClient.get(`current-affairs/items/${itemId}`);
    return unwrap<CAItemDetailOut>(response.data);
  },

  searchItems: async (query: string): Promise<CAItemCardData[]> => {
    const response = await apiClient.get(`current-affairs/search?q=${encodeURIComponent(query)}`);
    return unwrap<CAItemCardData[]>(response.data);
  },

  // Threads
  getThreadsOverview: async (): Promise<ThreadSummaryOut[]> => {
    const response = await apiClient.get('current-affairs/threads');
    return unwrap<ThreadSummaryOut[]>(response.data);
  },

  getThread: async (threadId: number): Promise<ThreadConsolidationOut> => {
    const response = await apiClient.get(`current-affairs/threads/${threadId}/consolidation`);
    return unwrap<ThreadConsolidationOut>(response.data);
  },

  // Knowledge Graph
  getGraphData: async (filters: Partial<CAFilters> = {}): Promise<{ nodes: GraphNodeOut[]; edges: GraphEdgeOut[] }> => {
    const params = new URLSearchParams();
    if (filters.subject) params.set('subject', filters.subject);
    if (filters.gs_paper) params.set('gs_paper', filters.gs_paper);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    const response = await apiClient.get(`current-affairs/graph?${params.toString()}`);
    return unwrap<{ nodes: GraphNodeOut[]; edges: GraphEdgeOut[] }>(response.data);
  },

  // Funnel
  getFunnelState: async (itemId: number): Promise<CAFunnelStateOut> => {
    const response = await apiClient.get(`current-affairs/items/${itemId}/funnel/state`);
    return unwrap<CAFunnelStateOut>(response.data);
  },

  completeFunnelStep: async (itemId: number, step: number): Promise<CAFunnelStateOut> => {
    const response = await apiClient.post(`current-affairs/items/${itemId}/funnel/complete-step`, { step });
    return unwrap<CAFunnelStateOut>(response.data);
  },

  getCaMcqs: async (itemId: number): Promise<CAMcqOut[]> => {
    const response = await apiClient.get(`current-affairs/items/${itemId}/mcqs`);
    return unwrap<CAMcqOut[]>(response.data);
  },

  submitCaMcqs: async (itemId: number, answers: Record<number, string>): Promise<CAMcqResultOut> => {
    const response = await apiClient.post(`current-affairs/items/${itemId}/mcqs/submit`, { answers });
    return unwrap<CAMcqResultOut>(response.data);
  },

  // Analytics
  getAnalytics: async (): Promise<CAAnalyticsOut> => {
    const response = await apiClient.get('current-affairs/analytics');
    return unwrap<CAAnalyticsOut>(response.data);
  },
};
