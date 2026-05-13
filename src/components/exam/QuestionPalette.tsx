"use client";

import React from 'react';
import { useExamStore, QuestionStatus } from '@/lib/store/useExamStore';
import { Button } from '@/components/ui/button';

interface QuestionPaletteProps {
  questionIds: string[];
  onQuestionSelect?: (index: number) => void;
}

export function QuestionPalette({ questionIds, onQuestionSelect }: QuestionPaletteProps) {
  const { answers, currentQuestionIndex, setCurrentQuestion } = useExamStore();

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'ANSWERED':
        return 'bg-green-500 text-white hover:bg-green-600 border-transparent';
      case 'MARKED_FOR_REVIEW':
        return 'bg-purple-500 text-white hover:bg-purple-600 border-transparent';
      case 'ANSWERED_AND_MARKED':
        return 'bg-purple-600 text-white hover:bg-purple-700 border-transparent relative overflow-hidden before:absolute before:bottom-0 before:right-0 before:w-0 before:h-0 before:border-b-[12px] before:border-l-[12px] before:border-b-green-400 before:border-l-transparent';
      case 'UNANSWERED':
        return 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200';
      case 'NOT_VISITED':
      default:
        return 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm border-l border-zinc-200/50 dark:border-zinc-800/50">
      <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-1">
        <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">Navigation</h3>
        <p className="text-sm font-bold">Question Palette</p>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
          {questionIds.map((id, index) => {
            const status = answers[id]?.status || 'NOT_VISITED';
            const isActive = index === currentQuestionIndex;
            
            return (
              <button
                key={id}
                className={`
                  group relative w-full aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all duration-200
                  ${isActive ? 'scale-110 z-10 shadow-lg ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-950' : 'hover:scale-105'}
                  ${status === 'ANSWERED' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-md' : ''}
                  ${status === 'MARKED_FOR_REVIEW' ? 'bg-purple-600 text-white border-transparent shadow-md shadow-purple-500/20' : ''}
                  ${status === 'ANSWERED_AND_MARKED' ? 'bg-purple-600 text-white border-transparent shadow-md shadow-purple-500/20' : ''}
                  ${status === 'UNANSWERED' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50' : ''}
                  ${status === 'NOT_VISITED' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50' : ''}
                `}
                onClick={() => {
                  if (onQuestionSelect) {
                    onQuestionSelect(index);
                  } else {
                    setCurrentQuestion(index);
                  }
                }}
              >
                {index + 1}
                {/* Special markers for Answered & Marked */}
                {status === 'ANSWERED_AND_MARKED' && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 border border-white dark:border-zinc-950 shadow-sm" />
                )}
                {/* Current question indicator glow */}
                {isActive && (
                  <div className="absolute -inset-1 rounded-xl bg-primary/20 animate-pulse -z-10" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-zinc-900 dark:bg-white" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">Solved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">Skipped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-purple-600" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">New</span>
          </div>
        </div>
      </div>
    </div>
  );
}
