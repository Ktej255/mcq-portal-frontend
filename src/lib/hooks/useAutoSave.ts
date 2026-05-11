import { useEffect, useRef, useState, useCallback } from 'react';
import { useExamStore } from '../store/useExamStore';
import { examService } from '@/services/api/examService';
import { toast } from 'sonner';

export const useAutoSave = (attemptId: string | null) => {
  const { answers } = useExamStore();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const lastSavedAnswers = useRef<string>('');
  const wasOffline = useRef(false);

  const syncToBackendRef = useRef<(isRetry?: boolean) => Promise<void>>(() => Promise.resolve());

  const syncToBackend = useCallback(async (isRetry = false) => {
    if (!attemptId) return;

    const payload = Object.values(answers);
    const payloadString = JSON.stringify(payload);

    // Deduplication
    if (!isRetry && payloadString === lastSavedAnswers.current) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await examService.saveAnswers(attemptId, payload);
      setLastSaved(new Date());
      lastSavedAnswers.current = payloadString;
      retryCount.current = 0; // Reset on success
      
      if (wasOffline.current) {
        toast.success('Connection restored. Answers synced.');
        wasOffline.current = false;
      }
    } catch (error) {
      console.error('Auto-save failed', error);
      
      // Retry logic (up to 3 times)
      if (retryCount.current < 3) {
        retryCount.current += 1;
        setSaveError(`Sync failed. Retrying... (${retryCount.current}/3)`);
        saveTimeout.current = setTimeout(() => syncToBackendRef.current(true), 5000); // Retry after 5s
      } else {
        setSaveError('Offline. Answers saved locally.');
        if (!wasOffline.current) {
          toast.error('Network disconnected. Your answers are saved locally and will sync when reconnected.', { duration: 5000 });
          wasOffline.current = true;
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [answers, attemptId]);

  useEffect(() => {
    syncToBackendRef.current = syncToBackend;
  }, [syncToBackend]);

  useEffect(() => {
    if (!attemptId || Object.keys(answers).length === 0) return;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    // Debounce the save attempt by 2 seconds
    saveTimeout.current = setTimeout(() => syncToBackend(false), 2000);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [answers, attemptId, syncToBackend]);

  return { isSaving, lastSaved, saveError };
};
