import { apiClient } from './client';

export type ExamEventType = 
  | 'QUESTION_VIEWED'
  | 'ANSWER_CHANGED'
  | 'CONFIDENCE_SELECTED'
  | 'REVIEW_MARKED'
  | 'TAB_SWITCH'
  | 'SUBMIT_CLICKED'
  | 'FULLSCREEN_EXIT'
  | 'HEARTBEAT'
  | 'FOCUS_STATE_CHANGED'
  | 'IDLE_STATE_CHANGED';

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
  private heartbeatInterval = 25000;
  private idleThresholdMs = 60000;
  private flushTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private telemetryStartedAt = 0;
  private lastInteractionAt = 0;
  private sequence = 0;
  private sessionId: string | null = null;
  private lastFocusState: 'FOCUSED' | 'BLURRED' | null = null;
  private lastIdleState: 'ACTIVE' | 'IDLE' = 'ACTIVE';
  private lastFocusEventAt = 0;
  private boundInteractionHandler: (() => void) | null = null;
  private boundVisibilityHandler: (() => void) | null = null;
  private boundFocusHandler: (() => void) | null = null;
  private boundBlurHandler: (() => void) | null = null;
  private boundFullscreenHandler: (() => void) | null = null;
  private boundOnlineHandler: (() => void) | null = null;
  private boundOfflineHandler: (() => void) | null = null;

  init(attemptId: string) {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => this.flush(attemptId), this.flushInterval);
    this.startTelemetry(attemptId);
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
    this.stopTelemetry(attemptId);
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (attemptId) this.flush(attemptId);
  }

  private startTelemetry(attemptId: string) {
    if (typeof window === 'undefined' || this.heartbeatTimer) return;

    this.telemetryStartedAt = Date.now();
    this.lastInteractionAt = Date.now();
    this.sequence = 0;
    this.sessionId = this.getOrCreateSessionId(attemptId);
    this.lastFocusState = document.hidden || !document.hasFocus() ? 'BLURRED' : 'FOCUSED';
    this.lastIdleState = 'ACTIVE';

    const marker = sessionStorage.getItem(`mcq-telemetry-started-${attemptId}`) ? 'RESUME' : 'START';
    sessionStorage.setItem(`mcq-telemetry-started-${attemptId}`, '1');
    this.recordHeartbeat(attemptId, marker);

    this.heartbeatTimer = setInterval(() => this.recordHeartbeat(attemptId), this.heartbeatInterval);
    this.idleTimer = setInterval(() => this.evaluateIdleState(attemptId), 5000);

    this.boundInteractionHandler = () => this.markActive(attemptId);
    this.boundVisibilityHandler = () => this.recordFocusState(attemptId, document.hidden ? 'BLURRED' : 'FOCUSED', 'visibilitychange');
    this.boundFocusHandler = () => this.recordFocusState(attemptId, 'FOCUSED', 'window_focus');
    this.boundBlurHandler = () => this.recordFocusState(attemptId, 'BLURRED', 'window_blur');
    this.boundFullscreenHandler = () => {
      if (!document.fullscreenElement) {
        this.record({ event_type: 'FULLSCREEN_EXIT', payload: { source: 'fullscreenchange' } }, attemptId);
        this.recordFocusState(attemptId, document.hidden ? 'BLURRED' : 'FOCUSED', 'fullscreenchange');
      }
    };
    this.boundOnlineHandler = () => this.recordHeartbeat(attemptId, 'RECONNECT');
    this.boundOfflineHandler = () => this.recordHeartbeat(attemptId, 'OFFLINE');

    ['pointerdown', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(eventName => {
      window.addEventListener(eventName, this.boundInteractionHandler!, { passive: true });
    });
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    window.addEventListener('focus', this.boundFocusHandler);
    window.addEventListener('blur', this.boundBlurHandler);
    document.addEventListener('fullscreenchange', this.boundFullscreenHandler);
    window.addEventListener('online', this.boundOnlineHandler);
    window.addEventListener('offline', this.boundOfflineHandler);
  }

  private stopTelemetry(attemptId?: string) {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.idleTimer) clearInterval(this.idleTimer);
    this.heartbeatTimer = null;
    this.idleTimer = null;

    if (typeof window !== 'undefined') {
      if (attemptId) this.recordHeartbeat(attemptId, 'STOP');
      if (this.boundInteractionHandler) {
        ['pointerdown', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(eventName => {
          window.removeEventListener(eventName, this.boundInteractionHandler!);
        });
      }
      if (this.boundVisibilityHandler) document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
      if (this.boundFocusHandler) window.removeEventListener('focus', this.boundFocusHandler);
      if (this.boundBlurHandler) window.removeEventListener('blur', this.boundBlurHandler);
      if (this.boundFullscreenHandler) document.removeEventListener('fullscreenchange', this.boundFullscreenHandler);
      if (this.boundOnlineHandler) window.removeEventListener('online', this.boundOnlineHandler);
      if (this.boundOfflineHandler) window.removeEventListener('offline', this.boundOfflineHandler);
    }

    this.boundInteractionHandler = null;
    this.boundVisibilityHandler = null;
    this.boundFocusHandler = null;
    this.boundBlurHandler = null;
    this.boundFullscreenHandler = null;
    this.boundOnlineHandler = null;
    this.boundOfflineHandler = null;
  }

  private getOrCreateSessionId(attemptId: string) {
    const key = `mcq-telemetry-session-${attemptId}`;
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const generated = `${attemptId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, generated);
    return generated;
  }

  private recordHeartbeat(attemptId: string, marker: 'START' | 'RESUME' | 'RECONNECT' | 'OFFLINE' | 'STOP' | null = null) {
    if (typeof window === 'undefined') return;
    this.sequence += 1;
    this.record({
      event_type: 'HEARTBEAT',
      payload: {
        session_id: this.sessionId,
        sequence: this.sequence,
        marker,
        client_elapsed_seconds: Math.floor((Date.now() - this.telemetryStartedAt) / 1000),
        online: navigator.onLine,
        focus_state: this.lastFocusState,
        idle_state: this.lastIdleState,
      }
    }, attemptId);
  }

  private recordFocusState(attemptId: string, state: 'FOCUSED' | 'BLURRED', source: string) {
    const now = Date.now();
    if (this.lastFocusState === state && now - this.lastFocusEventAt < 1000) return;
    this.lastFocusState = state;
    this.lastFocusEventAt = now;
    this.record({
      event_type: 'FOCUS_STATE_CHANGED',
      payload: { state, source, session_id: this.sessionId }
    }, attemptId);
  }

  private markActive(attemptId: string) {
    this.lastInteractionAt = Date.now();
    if (this.lastIdleState === 'IDLE') {
      this.lastIdleState = 'ACTIVE';
      this.record({
        event_type: 'IDLE_STATE_CHANGED',
        payload: { state: 'ACTIVE', session_id: this.sessionId }
      }, attemptId);
    }
  }

  private evaluateIdleState(attemptId: string) {
    if (this.lastIdleState === 'IDLE') return;
    const idleForMs = Date.now() - this.lastInteractionAt;
    if (idleForMs >= this.idleThresholdMs) {
      this.lastIdleState = 'IDLE';
      this.record({
        event_type: 'IDLE_STATE_CHANGED',
        payload: {
          state: 'IDLE',
          idle_for_seconds: Math.floor(idleForMs / 1000),
          session_id: this.sessionId,
        }
      }, attemptId);
    }
  }
}

export const eventsService = new EventsService();
