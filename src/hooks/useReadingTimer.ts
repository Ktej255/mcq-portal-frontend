"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { funnelService } from "@/services/api/funnelService";

/**
 * Tracks cumulative reading time for one content section. Persistence is
 * best-effort: failed writes are queued locally and retried on a later mount.
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

type TimerHandle = ReturnType<typeof setInterval>;

const MAX_SUBMISSION_SECONDS = 7200;

const queueKeyFor = (subject: string, nodeId: number, sectionId: number) =>
  `reading_time_queue_${encodeURIComponent(subject)}_${nodeId}_${sectionId}`;

const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

export function useReadingTimer({
  nodeId,
  sectionId,
  subject = "geography",
}: UseReadingTimerOptions): UseReadingTimerReturn {
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<TimerHandle | null>(null);
  const accumulatedRef = useRef(0);
  const activeRef = useRef(false);
  const mountedRef = useRef(false);
  const resumeOnVisibleRef = useRef(false);
  const persistInFlightRef = useRef<Promise<void> | null>(null);

  const persist = useCallback(async () => {
    if (persistInFlightRef.current) {
      await persistInFlightRef.current;
    }

    const seconds = accumulatedRef.current;
    if (seconds <= 0) return;
    accumulatedRef.current = 0;

    const request = (async () => {
      try {
        await funnelService.submitReadingTime(subject, nodeId, sectionId, seconds);
      } catch {
        try {
          if (!canUseStorage()) throw new Error("localStorage unavailable");
          const key = queueKeyFor(subject, nodeId, sectionId);
          const existing = Number.parseInt(localStorage.getItem(key) ?? "0", 10);
          localStorage.setItem(key, String((Number.isFinite(existing) ? existing : 0) + seconds));
        } catch {
          // Keep the snapshot in memory when localStorage is unavailable.
          accumulatedRef.current += seconds;
        }
      }
    })();

    persistInFlightRef.current = request;
    try {
      await request;
    } finally {
      if (persistInFlightRef.current === request) {
        persistInFlightRef.current = null;
      }
    }
  }, [nodeId, sectionId, subject]);

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (activeRef.current || (typeof document !== "undefined" && document.hidden)) return;

    activeRef.current = true;
    resumeOnVisibleRef.current = true;
    setIsActive(true);
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setCurrentSeconds((previous) => previous + 1);
      accumulatedRef.current += 1;
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (!activeRef.current) return;

    activeRef.current = false;
    resumeOnVisibleRef.current = false;
    setIsActive(false);
    clearIntervalRef();
    void persist();
  }, [clearIntervalRef, persist]);

  // Pause while hidden and resume the same mounted section when visible again.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (!activeRef.current) return;
        activeRef.current = false;
        resumeOnVisibleRef.current = true;
        setIsActive(false);
        clearIntervalRef();
        void persist();
      } else if (resumeOnVisibleRef.current && mountedRef.current) {
        startTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [clearIntervalRef, persist, startTimer]);

  // Stop and flush on section unmount or identity change.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRef.current = false;
      resumeOnVisibleRef.current = false;
      clearIntervalRef();
      void persist();
    };
  }, [clearIntervalRef, persist]);

  // Sync queued writes in backend-sized chunks when this section is mounted.
  useEffect(() => {
    if (!canUseStorage()) return;
    const key = queueKeyFor(subject, nodeId, sectionId);
    let remaining = 0;
    try {
      remaining = Number.parseInt(localStorage.getItem(key) ?? "0", 10);
    } catch {
      return;
    }
    if (!Number.isFinite(remaining) || remaining <= 0) return;

    const syncQueued = async () => {
      while (remaining > 0) {
        const chunk = Math.min(remaining, MAX_SUBMISSION_SECONDS);
        try {
          await funnelService.submitReadingTime(subject, nodeId, sectionId, chunk);
          remaining -= chunk;

          // Read the queue after the request: a failed flush may have appended
          // seconds while this replay request was in flight. Subtract only the
          // chunk we just submitted so those newly queued seconds survive.
          const queuedAfterSubmit = Number.parseInt(localStorage.getItem(key) ?? "0", 10);
          const nextRemaining = Math.max(
            0,
            (Number.isFinite(queuedAfterSubmit) ? queuedAfterSubmit : 0) - chunk,
          );
          if (nextRemaining > 0) localStorage.setItem(key, String(nextRemaining));
          else localStorage.removeItem(key);
        } catch {
          return;
        }
      }
    };

    void syncQueued();
  }, [nodeId, sectionId, subject]);

  return { startTimer, stopTimer, currentSeconds, isActive };
}
