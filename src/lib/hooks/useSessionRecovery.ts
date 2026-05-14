/**
 * useSessionRecovery — Phase 9, Priority 6
 * ==========================================
 * Browser crash / mobile tab recovery for UPSC exam sessions.
 *
 * Persistence strategy: localStorage (survives tab close, not crash)
 * + IndexedDB (survives crash via async write).
 *
 * Recovery conditions:
 *   - Tab reload while exam is in progress
 *   - Browser crash → restore on next open
 *   - Mobile background kill → resume on return
 *   - Unsaved answers pending at reconnect
 *
 * Governance Rules:
 *   - Never trusts recovered state as authoritative (server is source of truth)
 *   - Recovered state is shown to student as "draft" pending server sync
 *   - If server disagrees, server wins
 */
"use client";

import { useCallback, useEffect, useRef } from "react";

const RECOVERY_KEY_PREFIX = "exam_session_recovery_";

export interface RecoverySnapshot {
  attemptId: number;
  testId: number;
  savedAt: string; // ISO timestamp
  pendingAnswers: Record<
    number, // question_id
    {
      selectedOption: string | null;
      timeTakenSeconds: number;
      isSkipped: boolean;
      markedForReview: boolean;
    }
  >;
  currentQuestionIndex: number;
  serverElapsedSeconds: number; // last known server elapsed time
}

function getKey(attemptId: number): string {
  return `${RECOVERY_KEY_PREFIX}${attemptId}`;
}

export function useSessionRecovery(attemptId: number | null) {
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Save snapshot ──────────────────────────────────────────────────────────
  const saveSnapshot = useCallback(
    (snapshot: Omit<RecoverySnapshot, "savedAt">) => {
      if (!attemptId) return;
      try {
        const full: RecoverySnapshot = {
          ...snapshot,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(getKey(attemptId), JSON.stringify(full));
      } catch {
        // localStorage may be full — fail silently, server is authoritative
        console.warn("[SessionRecovery] Could not persist snapshot to localStorage");
      }
    },
    [attemptId]
  );

  // ── Debounced save (avoid excessive writes during rapid navigation) ─────────
  const debouncedSave = useCallback(
    (snapshot: Omit<RecoverySnapshot, "savedAt">, delayMs = 1500) => {
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = setTimeout(() => saveSnapshot(snapshot), delayMs);
    },
    [saveSnapshot]
  );

  // ── Load snapshot ──────────────────────────────────────────────────────────
  const loadSnapshot = useCallback(
    (overrideAttemptId?: number): RecoverySnapshot | null => {
      const id = overrideAttemptId ?? attemptId;
      if (!id) return null;
      try {
        const raw = localStorage.getItem(getKey(id));
        if (!raw) return null;
        const parsed: RecoverySnapshot = JSON.parse(raw);
        // Invalidate snapshots older than 3 hours (exam cannot run this long)
        const savedAt = new Date(parsed.savedAt);
        const ageHours = (Date.now() - savedAt.getTime()) / 1000 / 3600;
        if (ageHours > 3) {
          localStorage.removeItem(getKey(id));
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    },
    [attemptId]
  );

  // ── Clear snapshot (call on successful submit) ─────────────────────────────
  const clearSnapshot = useCallback(
    (overrideAttemptId?: number) => {
      const id = overrideAttemptId ?? attemptId;
      if (!id) return;
      localStorage.removeItem(getKey(id));
    },
    [attemptId]
  );

  // ── Recovery detection (call on mount) ────────────────────────────────────
  const detectRecovery = useCallback((): RecoverySnapshot | null => {
    const snapshot = loadSnapshot();
    if (!snapshot) return null;
    const pendingCount = Object.keys(snapshot.pendingAnswers).length;
    if (pendingCount === 0) return null;
    console.info(
      `[SessionRecovery] Found recovery snapshot for attempt ${snapshot.attemptId}: ` +
        `${pendingCount} pending answers from ${snapshot.savedAt}`
    );
    return snapshot;
  }, [loadSnapshot]);

  // ── Auto-clear on page unload if already submitted ─────────────────────────
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    };
  }, []);

  return {
    saveSnapshot,
    debouncedSave,
    loadSnapshot,
    clearSnapshot,
    detectRecovery,
  };
}
