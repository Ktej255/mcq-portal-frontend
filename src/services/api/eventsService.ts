import { apiClient } from './client';

export type ExamEventType = 
  | 'QUESTION_VIEWED'
  | 'ANSWER_SELECTED'
  | 'ANSWER_CHANGED'
  | 'CONFIDENCE_UPDATED'
  | 'MARKED_FOR_REVIEW'
  | 'TAB_SWITCHED'
  | 'PALETTE_NAVIGATED'
  | 'SUBMIT_CLICKED'
  | 'FULLSCREEN_EXIT'
  | 'CONTEXT_MENU_BLOCKED'
  | 'COPY_PASTE_BLOCKED';

export interface ExamEvent {
  event_type: ExamEventType;
  question_id?: number;
  payload?: Record<string, any>;
  timestamp?: string;
}

class EventsService {
  private eventBuffer: ExamEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  init(attemptId: string) {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => this.flush(attemptId), this.flushInterval);
  }

  record(event: ExamEvent, attemptId?: string) {
    this.eventBuffer.push({
      ...event,
      timestamp: new Date().toISOString()
    });

    if (this.eventBuffer.length >= this.batchSize && attemptId) {
      this.flush(attemptId);
    }
  }

  async flush(attemptId: string) {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await apiClient.post(`attempts/${attemptId}/events`, {
        events: eventsToFlush
      });
      console.log(`[EventsService] Flushed ${eventsToFlush.length} events`);
    } catch (err) {
      console.error('[EventsService] Failed to flush events:', err);
      // Put them back in the buffer for next retry
      this.eventBuffer = [...eventsToFlush, ...this.eventBuffer];
    }
  }

  stop(attemptId?: string) {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (attemptId) this.flush(attemptId);
  }
}

export const eventsService = new EventsService();
