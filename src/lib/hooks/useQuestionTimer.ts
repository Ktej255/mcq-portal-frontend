import { useCallback, useEffect, useRef } from 'react';
import { useExamStore } from '../store/useExamStore';

/**
 * Counts the time a student spends on each question, so the report can show
 * where the time went. Time is counted only while the question is on screen
 * and the tab is visible, and is added to the answer when the student moves to
 * another question, hides the tab, or submits. Returns `flush`, which adds the
 * time counted so far; call it before reading answers for a final save.
 */
export function useQuestionTimer(questionId: string | null | undefined, paused = false) {
  const current = useRef<{ id: string; since: number | null; carryMs: number } | null>(null);

  const flush = useCallback(() => {
    const active = current.current;
    if (!active || active.since === null) return;
    const now = Date.now();
    const elapsedMs = active.carryMs + (now - active.since);
    const wholeSeconds = Math.floor(elapsedMs / 1000);
    active.carryMs = elapsedMs - wholeSeconds * 1000;
    active.since = now;
    if (wholeSeconds > 0) useExamStore.getState().recordTime(active.id, wholeSeconds);
  }, []);

  useEffect(() => {
    if (!questionId || paused) return;
    current.current = {
      id: String(questionId),
      since: document.visibilityState === 'visible' ? Date.now() : null,
      carryMs: 0,
    };

    const onVisibility = () => {
      const active = current.current;
      if (!active) return;
      if (document.visibilityState === 'visible') {
        active.since = Date.now();
      } else {
        flush();
        active.since = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
      current.current = null;
    };
  }, [questionId, paused, flush]);

  return flush;
}
