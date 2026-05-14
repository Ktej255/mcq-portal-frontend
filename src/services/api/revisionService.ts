import { apiClient as api } from './client';

export interface RevisionItem {
  id: number;
  topic: string;
  reason: string;
  priority: number;
  question_id?: number;
  category: string;
  text_en?: string;
  mastery?: number;
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

export const revisionService = {
  getQueue: async (): Promise<RevisionItem[]> => {
    const response = await api.get('/revision/');
    return response.data;
  },

  getRapidDrill: async (mode: string = "recovery", limit: number = 5): Promise<RevisionItem[]> => {

    const response = await api.get('/revision/rapid-drill', { params: { mode, limit } });
    return response.data;
  },

  completeRevision: async (itemId: number, masteryDelta: number) => {
    const response = await api.post(`/revision/${itemId}/complete`, { mastery_delta: masteryDelta });
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
