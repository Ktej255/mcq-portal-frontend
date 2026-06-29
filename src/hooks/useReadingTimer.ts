"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { funnelService } from '@/services/api/funnelService';

/**
 * Hook for tracking cumulative reading time per content section.
 * Starts a 1-second interval timer when active, stops and persists on
 * navigation/unmount. Queues to localStorage on persist failure.
 *
 * Requirements: 3.2, 3.3, 3.4, 3.7
 */

interface UseReadingTimerOptions {
  nodeId: number;
  sectionId: number;
  subject?: string;
}

interface UseReadingTimerReturn {
  startTimer: () => void;
  stopTimer: () => void;
  currentSeconds: number;
  isActive: boolean;
}

export function useReadingTimer({
  nodeId,
  sectionId,
  subject = "geography",
}: UseReadingTimerOptions): UseReadingTimerReturn {
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedRef = useRef(0);

  const persist = useCallback(async () => {
    const seconds = accumulatedRef.current;
    if (seconds <= 0) return;

    try {
      await funnelService.submitReadingTime(subject, nodeId, sectionId, seconds);
      accumulatedRef.current = 0;
    } catch {
      // Queue to localStorage on failure (learnerPersistence pattern)
      try {
        const key = `reading_time_queue_${nodeId}_${sectionId}`;
        const existing = localStorage.getItem(key);
        const queued = existing ? parseInt(existing, 10) : 0;
        localStorage.setItem(key, String(queued + seconds));
        accumulatedRef.current = 0;
      } catch {
        // localStorage unavailable — keep in memory for next attempt
      }
    }
  }, [nodeId, sectionId, subject]);

  const startTimer = useCallback(() => {
    if (isActive) return;
    setIsActive(true);

    intervalRef.current = setInterval(() => {
      setCurrentSeconds((prev) => prev + 1);
      accumulatedRef.current += 1;
    }, 1000);
  }, [isActive]);

  const stopTimer = useCallback(() => {
    if (!isActive) return;
    setIsActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Persist accumulated time
    persist();
  }, [isActive, persist]);

  // Handle visibility change (tab hidden = stop, visible = resume)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isActive) {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isActive, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Persist any remaining accumulated time
      if (accumulatedRef.current > 0) {
        persist();
      }
    };
  }, [persist]);

  // Try to sync any queued localStorage data on mount
  useEffect(() => {
    const key = `reading_time_queue_${nodeId}_${sectionId}`;
    const queued = localStorage.getItem(key);
    if (queued) {
      const seconds = parseInt(queued, 10);
      if (seconds > 0) {
        funnelService.submitReadingTime(subject, nodeId, sectionId, seconds)
          .then(() => localStorage.removeItem(key))
          .catch(() => { /* keep queued for next attempt */ });
      }
    }
  }, [nodeId, sectionId, subject]);

  return {
    startTimer,
    stopTimer,
    currentSeconds,
    isActive,
  };
}
