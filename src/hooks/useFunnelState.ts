"use client";

import { useState, useEffect, useCallback } from 'react';
import { funnelService, FunnelStateOut } from '@/services/api/funnelService';

/**
 * Hook for managing funnel progression state.
 * Loads funnel state from backend on mount, exposes step completion action,
 * and derives step accessibility and tab mapping.
 *
 * Requirements: 1.4, 1.5
 */

// Step-to-Tab mapping (14 funnel steps → 6 tabs)
export type TabId = 'learn' | 'ncert' | 'current' | 'traps' | 'mcq-lab' | 'mains';

export const STEP_TAB_MAP: Record<number, TabId> = {
  1: 'learn',       // Discussion Gate
  2: 'learn',       // BASIC Content
  3: 'learn',       // BASIC Recall
  4: 'ncert',       // NCERT Content
  5: 'ncert',       // NCERT Recall
  6: 'learn',       // Advanced Content
  7: 'learn',       // Advanced Recall
  8: 'current',     // Current Affairs Content
  9: 'current',     // Current Affairs Recall
  10: 'traps',      // Traps Content
  11: 'traps',      // Traps Recall
  12: 'mcq-lab',    // MCQ Lab
  13: 'mains',      // Mains Practice
  14: 'mains',      // Growth Report (overlay within mains tab)
};

export interface UseFunnelStateReturn {
  state: FunnelStateOut | null;
  loading: boolean;
  error: string | null;
  currentStep: number;
  completedSteps: number[];
  activeTab: TabId;
  completeStep: (step: number) => Promise<void>;
  canAccessStep: (step: number) => boolean;
  isStepComplete: (step: number) => boolean;
  refreshState: () => Promise<void>;
}

export function useFunnelState(nodeId: number, subject = "geography"): UseFunnelStateReturn {
  const [state, setState] = useState<FunnelStateOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await funnelService.getFunnelState(subject, nodeId);
      setState(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load funnel state';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [nodeId, subject]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const currentStep = state?.current_step ?? 1;
  const completedSteps = state?.completed_steps ?? [];
  const activeTab = STEP_TAB_MAP[currentStep] ?? 'learn';

  const completeStep = useCallback(async (step: number) => {
    try {
      const newState = await funnelService.completeStep(subject, nodeId, step);
      setState(newState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete step';
      setError(message);
      throw err;
    }
  }, [nodeId, subject]);

  const canAccessStep = useCallback((step: number): boolean => {
    return step <= currentStep;
  }, [currentStep]);

  const isStepComplete = useCallback((step: number): boolean => {
    return completedSteps.includes(step);
  }, [completedSteps]);

  return {
    state,
    loading,
    error,
    currentStep,
    completedSteps,
    activeTab,
    completeStep,
    canAccessStep,
    isStepComplete,
    refreshState: loadState,
  };
}
