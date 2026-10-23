"use client";

import { useCallback, useEffect, useState } from 'react';
import { gsLmsService, type ProgressionOut } from '@/services/api/gsLmsService';
import { useApiConfig } from '@/lib/hooks/useApi';

/**
 * Where the student is in a subject (next topic, mastered count, due review
 * test) and whether the server enforces topic order and step gates for them.
 *
 * `orderEnforced` stays false until the request answers (and if it fails), so
 * the UI keeps today's behaviour; the server is the authority either way.
 */
export function useProgression(subject: string) {
  const { isLoaded, isSignedIn } = useApiConfig();
  const [progression, setProgression] = useState<ProgressionOut | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setProgression(await gsLmsService.getProgression(subject));
    } catch {
      setProgression(null);
    } finally {
      setLoaded(true);
    }
  }, [subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [isLoaded, isSignedIn, refresh]);

  return {
    progression,
    loaded,
    orderEnforced: progression?.order_enforced ?? false,
    refresh,
  };
}
