import { apiClient as api } from './client';

export interface RevisionItem {
  id: number;
  topic: string;
  reason: string;
  priority: number;
  question_id?: number;
  review_count?: number;
  mastery?: number;
  category?: string;
  text_en?: string;
}

export interface HistoryItem {
  id: number;
  topic: string;
  last_reviewed_at: string;
  mastery_at_time: number;
  category: string;
}

export interface RecoveryPath {
  primary_topic: string;
  suggested_prerequisites: { title: string; priority: string }[];
  message: string;
}

export type RevisionCalibrationRating = "blank" | "shaky" | "solid";
export type RapidDrillMode =
  | "recovery"
  | "mistakes"
  | "weak_topic"
  | "high_confidence_mistake";
export type PriorityQueueSource = "revision_queue" | "topic_revisit" | "weak_topic";
export type TriageConfidence = "low" | "medium" | "high";
export type TriageBand = "SOLID" | "RUSTY" | "BLIND_SPOT";

export interface RevisionCommandCenterSummary {
  total_due: number;
  overconfidence_traps: number;
  mistakes_due: number;
  topic_revisits_due: number;
  weak_topics_count: number;
  estimated_minutes_today: number;
}

export interface RevisionCommandCenterPacing {
  exam_date: string | null;
  days_remaining: number | null;
  daily_minutes: number;
  estimated_minutes_today: number;
  recommended_daily_items: number | null;
  projected_cycles_before_exam: number | null;
}

export interface RevisionRepairOption {
  id: string;
  text: string;
  textHi?: string | null;
}

export interface RevisionRepairCard {
  kind: "mcq_mistake" | "topic_concept";
  question_id: number | null;
  question_text: string | null;
  options: RevisionRepairOption[];
  correct_option: string | null;
  explanation: string | null;
  concept_bullets: string[];
}

export interface RevisionPriorityItem {
  uid: string;
  source: PriorityQueueSource;
  item_id: number | null;
  revisit_id: number | null;
  syllabus_node_id: number | null;
  question_id: number | null;
  topic: string;
  subject_slug: string | null;
  reason: string;
  category: string | null;
  priority: number;
  mastery: number | null;
  review_count: number | null;
  forgetting_count: number | null;
  is_overconfident: boolean;
  due_at: string | null;
  revisit_type: string | null;
  action_href: string | null;
  repair_card?: RevisionRepairCard | null;
}

export interface RevisionMemoryAlert {
  topic: string;
  flags: string[];
  latest_score: number | null;
  probability: number | null;
  safety_note: string;
}

export interface RevisionCommandCenterResponse {
  summary: RevisionCommandCenterSummary;
  pacing: RevisionCommandCenterPacing;
  priority_queue: RevisionPriorityItem[];
  memory_alerts: RevisionMemoryAlert[];
  revision_engine_version: string;
}

export interface RevisionCommandCenterParams {
  exam_date?: string | null;
  daily_minutes?: number;
}

export interface RevisionTriageItemInput {
  topic_label: string;
  subject_slug?: string | null;
  syllabus_node_id?: number | null;
  accuracy: number;
  confidence: TriageConfidence;
}

export interface RevisionTriageResultItem {
  topic_label: string;
  subject_slug: string | null;
  syllabus_node_id: number | null;
  band: TriageBand;
  action_label: string;
  recommended_interval_days: number;
  overconfidence_alert: boolean;
}

export interface RevisionTriageEvaluateResponse {
  counts: {
    solid: number;
    rusty: number;
    blind_spot: number;
    overconfidence_alerts: number;
  };
  results: RevisionTriageResultItem[];
}

export const revisionService = {
  getCommandCenter: async (
    params?: RevisionCommandCenterParams,
  ): Promise<RevisionCommandCenterResponse> => {
    const query: Record<string, string | number> = {};
    if (params?.exam_date) {
      query.exam_date = params.exam_date;
    }
    if (typeof params?.daily_minutes === "number" && Number.isFinite(params.daily_minutes)) {
      query.daily_minutes = params.daily_minutes;
    }
    const response = await api.get('/revision/command-center', { params: query });
    return response.data;
  },

  evaluateTriage: async (
    items: RevisionTriageItemInput[],
  ): Promise<RevisionTriageEvaluateResponse> => {
    const response = await api.post('/revision/triage/evaluate', { items });
    return response.data;
  },

  getQueue: async (): Promise<RevisionItem[]> => {
    const response = await api.get('/revision/');
    return response.data;
  },

  getRapidDrill: async (
    mode: RapidDrillMode | string = "recovery",
    limit: number = 5,
  ): Promise<RevisionItem[]> => {
    const response = await api.get('/revision/rapid-drill', { params: { mode, limit } });
    return response.data;
  },

  completeRevision: async (
    itemId: number,
    masteryDelta: number,
    rating?: RevisionCalibrationRating,
  ) => {
    // FastAPI declares mastery_delta and rating as scalar query parameters, not a JSON body.
    const params: { mastery_delta: number; rating?: RevisionCalibrationRating } = {
      mastery_delta: masteryDelta,
    };
    if (rating) {
      params.rating = rating;
    }
    const response = await api.post(`/revision/${itemId}/complete`, undefined, {
      params,
    });
    return response.data;
  },

  bulkComplete: async (payload: { question_id: number, is_correct: boolean }[]) => {
    const response = await api.post('/revision/bulk-complete', payload);
    return response.data;
  },

  getHistory: async (limit: number = 20): Promise<HistoryItem[]> => {
    const response = await api.get('/revision/history', { params: { limit } });
    return response.data;
  },

  getRecoveryPath: async (topicId: number): Promise<RecoveryPath> => {
    const response = await api.get(`/revision/recovery-path/${topicId}`);
    return response.data;
  }
};
