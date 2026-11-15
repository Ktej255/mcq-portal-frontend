import { useEffect, useRef, useState, useCallback } from 'react';
import { useExamStore } from '../store/useExamStore';
import { examService, isAttemptClosedError, SaveAnswerPayload } from '@/services/api/examService';
import { toast } from 'sonner';

export const useAutoSave = (attemptId: string | null, disabled = false) => {
  const { answers } = useExamStore();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const lastSavedByQuestion = useRef<Record<string, string>>({});
  const inFlight = useRef(false);
  const queued = useRef(false);
  const wasOffline = useRef(false);

  const syncToBackendRef = useRef<(isRetry?: boolean) => Promise<void>>(() => Promise.resolve());
  const clearScheduledSave = useCallback(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
  }, []);

  const syncToBackend = useCallback(async (isRetry = false) => {
    if (!attemptId || disabled) return;

    clearScheduledSave();
    const payload = Object.values(answers).filter(answer => {
      if (answer.status === 'NOT_VISITED') return false;
      if (answer.lastAction === 'VISITED') return false;
      return Boolean(answer.selectedOptionId) || answer.lastAction === 'CLEARED' || answer.lastAction === 'MARKED_FOR_REVIEW';
    });
    if (payload.length === 0) return;
    const changedPayload = payload.filter((answer: SaveAnswerPayload) => {
      const key = String(answer.questionId);
      return JSON.stringify(answer) !== lastSavedByQuestion.current[key];
    });

    if (!isRetry && changedPayload.length === 0) {
      return;
    }
    if (inFlight.current) {
      queued.current = true;
      return;
    }

    const payloadToSave = isRetry ? payload : changedPayload;
    inFlight.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      await examService.saveAnswers(attemptId, payloadToSave);
      setLastSaved(new Date());
      payloadToSave.forEach((answer: SaveAnswerPayload) => {
        lastSavedByQuestion.current[String(answer.questionId)] = JSON.stringify(answer);
      });
      retryCount.current = 0; // Reset on success
      
      if (wasOffline.current) {
        toast.success('Connection restored. Answers synced.');
        wasOffline.current = false;
      }
    } catch (error) {
      console.error('Auto-save failed', error);

      if (isAttemptClosedError(error)) {
        // Time is up or the attempt was submitted: the server will not take
        // more answers, so retrying or reporting "offline" would be wrong.
        setSaveError('This attempt is closed.');
        return;
      }

      // Retry logic (up to 3 times)
      if (retryCount.current < 3) {
        retryCount.current += 1;
        setSaveError(`Sync failed. Retrying... (${retryCount.current}/3)`);
        clearScheduledSave();
        saveTimeout.current = setTimeout(() => {
          saveTimeout.current = null;
          void syncToBackendRef.current(true);
        }, 5000); // Retry after 5s
      } else {
        setSaveError('Offline. Server sync is pending.');
        if (!wasOffline.current) {
          toast.error('Network disconnected. Server sync is pending and will retry when connection returns.', { duration: 5000 });
          wasOffline.current = true;
        }
      }
    } finally {
      inFlight.current = false;
      setIsSaving(false);
      if (queued.current) {
        queued.current = false;
        void syncToBackendRef.current(false);
      }
    }
  }, [answers, attemptId, clearScheduledSave, disabled]);

  useEffect(() => {
    syncToBackendRef.current = syncToBackend;
  }, [syncToBackend]);

  useEffect(() => {
    if (disabled || !attemptId) return;

    const handleOnline = () => {
      retryCount.current = 0;
      clearScheduledSave();
      if (inFlight.current) {
        queued.current = true;
        return;
      }
      void syncToBackendRef.current(false);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [attemptId, clearScheduledSave, disabled]);

  useEffect(() => {
    if (disabled) {
      clearScheduledSave();
      return;
    }
    if (!attemptId || Object.keys(answers).length === 0) return;

    // A changed answer is a fresh sync opportunity after an exhausted retry budget.
    retryCount.current = 0;
    clearScheduledSave();

    // Debounce the save attempt by 2 seconds
    saveTimeout.current = setTimeout(() => {
      saveTimeout.current = null;
      void syncToBackendRef.current(false);
    }, 2000);

    return clearScheduledSave;
  }, [answers, attemptId, clearScheduledSave, disabled]);

  return { isSaving, lastSaved, saveError };
};
