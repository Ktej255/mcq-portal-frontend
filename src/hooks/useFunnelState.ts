"use client";

import { useState, useEffect, useCallback } from 'react';
import { funnelService, FunnelStateOut } from '@/services/api/funnelService';
import { getGateError } from '@/services/api/gsLmsService';

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
  /** Steps shown for this subject's exam (all 14 when the server sends none). */
  enabledSteps: number[];
  activeTab: TabId;
  completeStep: (step: number) => Promise<void>;
  /** Server's reason the last completeStep was refused (409/423), else null. */
  gateMessage: string | null;
  canAccessStep: (step: number) => boolean;
  isStepComplete: (step: number) => boolean;
  refreshState: () => Promise<void>;
}

const ALL_STEPS = Array.from({ length: 14 }, (_, i) => i + 1);

export function useFunnelState(nodeId: number, subject = "geography"): UseFunnelStateReturn {
  const [state, setState] = useState<FunnelStateOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<{ step: number; message: string } | null>(null);

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
  const enabledSteps = state?.enabled_steps?.length ? state.enabled_steps : ALL_STEPS;
  const activeTab = STEP_TAB_MAP[currentStep] ?? 'learn';

  const completeStep = useCallback(async (step: number) => {
    setGate(null);
    try {
      const newState = await funnelService.completeStep(subject, nodeId, step);
      setState((previousState) => {
        const completed_steps = Array.from(new Set([
          ...((previousState?.completed_steps ?? []) as number[]),
          ...((newState.completed_steps ?? []) as number[]),
          step,
        ])).sort((a, b) => a - b);
        const nextStep = Math.min(step + 1, 14);
        const current_step = Math.max(newState.current_step ?? nextStep, nextStep);

        return {
          ...(previousState ?? newState),
          ...newState,
          current_step,
          completed_steps,
        };
      });
    } catch (err: unknown) {
      // A gate the student hasn't met yet (e.g. recall score too low): keep
      // them on the step and show the reason inline instead of failing the page.
      const gateError = getGateError(err);
      if (gateError) {
        setGate({ step, message: gateError.detail });
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to complete step';
      setError(message);
      throw err;
    }
  }, [nodeId, subject]);

  // The reason only applies to the step it was raised on.
  const gateMessage = gate && gate.step === currentStep ? gate.message : null;

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
    enabledSteps,
    activeTab,
    completeStep,
    gateMessage,
    canAccessStep,
    isStepComplete,
    refreshState: loadState,
  };
}
