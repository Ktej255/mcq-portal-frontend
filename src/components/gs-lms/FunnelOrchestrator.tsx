"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap, Newspaper, AlertTriangle, Target, PenLine, Lock, CheckCircle2 } from 'lucide-react';
import { useFunnelState, TabId, STEP_TAB_MAP } from '@/hooks/useFunnelState';

/**
 * FunnelOrchestrator — Client-side state machine that reads funnel state from
 * backend and renders the active step component within the 6-tab layout.
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 11.1, 11.3
 */

interface FunnelOrchestratorProps {
  nodeId: number;
  subject?: string;
  children?: React.ReactNode;
}

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  steps: number[]; // Which funnel steps are within this tab
}

const TABS: TabConfig[] = [
  { id: 'learn', label: 'Learn', icon: <BookOpen className="h-4 w-4" />, steps: [1, 2, 3, 6, 7] },
  { id: 'ncert', label: 'NCERT', icon: <GraduationCap className="h-4 w-4" />, steps: [4, 5] },
  { id: 'current', label: 'Current Affairs', icon: <Newspaper className="h-4 w-4" />, steps: [8, 9] },
  { id: 'traps', label: 'Traps', icon: <AlertTriangle className="h-4 w-4" />, steps: [10, 11] },
  { id: 'mcq-lab', label: 'MCQ Lab', icon: <Target className="h-4 w-4" />, steps: [12] },
  { id: 'mains', label: 'Mains', icon: <PenLine className="h-4 w-4" />, steps: [13, 14] },
];

export function FunnelOrchestrator({ nodeId, subject = "geography", children }: FunnelOrchestratorProps) {
  const {
    loading,
    error,
    currentStep,
    completedSteps,
    activeTab,
    completeStep,
    canAccessStep,
    isStepComplete,
  } = useFunnelState(nodeId, subject);

  const [selectedTab, setSelectedTab] = useState<TabId | null>(null);
  const displayTab = selectedTab ?? activeTab;

  // Determine tab states
  const tabStates = useMemo(() => {
    const states: Record<TabId, 'active' | 'visited' | 'locked'> = {
      'learn': 'locked',
      'ncert': 'locked',
      'current': 'locked',
      'traps': 'locked',
      'mcq-lab': 'locked',
      'mains': 'locked',
    };

    for (const tab of TABS) {
      const anyStepAccessible = tab.steps.some((s) => canAccessStep(s));
      const anyStepCompleted = tab.steps.some((s) => isStepComplete(s));
      const isCurrentTab = displayTab === tab.id;

      if (isCurrentTab) {
        states[tab.id] = 'active';
      } else if (anyStepAccessible || anyStepCompleted) {
        states[tab.id] = 'visited';
      } else {
        states[tab.id] = 'locked';
      }
    }

    return states;
  }, [displayTab, canAccessStep, isStepComplete]);

  // Progress percentage (completed steps / 14)
  const progressPercent = (completedSteps.length / 14) * 100;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-[#e7f5ee] rounded-xl" />
        <div className="h-2 bg-[#b9d9cd] rounded-full w-full" />
        <div className="h-64 bg-[#fffdf8] rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-xs font-semibold text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-[#dcd5c7] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const state = tabStates[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (state !== 'locked') setSelectedTab(tab.id);
              }}
              disabled={state === 'locked'}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-black
                whitespace-nowrap transition-all duration-200
                ${state === 'active'
                  ? 'bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md scale-105'
                  : state === 'visited'
                    ? 'text-[#1d9e75] bg-white border border-[#b9d9cd]'
                    : 'text-[#5d675f] bg-white/50 border border-[#dcd5c7] opacity-60 cursor-not-allowed'
                }
              `}
            >
              {state === 'locked' ? <Lock className="h-3 w-3" /> : null}
              {state === 'visited' && state !== 'active' ? <CheckCircle2 className="h-3 w-3" /> : null}
              {state === 'active' || state === 'locked' ? tab.icon : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 text-[10px] font-semibold text-[#49675e]">
        <span>Step {currentStep} of 14</span>
        <span className="text-[#b9d9cd]">•</span>
        <span>{completedSteps.length} completed</span>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={displayTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default FunnelOrchestrator;
