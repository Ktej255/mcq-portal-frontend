"use client";

import React from 'react';
import { useExamStore } from '@/lib/store/useExamStore';
import { ExamTimer } from './ExamTimer';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldAlert, Maximize2 } from 'lucide-react';

interface ExamHeaderProps {
  testId: string;
  testName: string;
  totalQuestions: number;
  durationSeconds: number;
  onSubmit: () => void;
  onRequestFullscreen?: () => void;
}

export function ExamHeader({ 
  testId, 
  testName, 
  totalQuestions, 
  durationSeconds, 
  onSubmit,
  onRequestFullscreen
}: ExamHeaderProps) {
  const { answers } = useExamStore();
  
  const visitedCount = Object.values(answers).filter(a => a.status !== 'NOT_VISITED').length;
  const answeredCount = Object.values(answers).filter(
    a => a.status === 'ANSWERED' || a.status === 'ANSWERED_AND_MARKED'
  ).length;
  const markedCount = Object.values(answers).filter(
    a => a.status === 'MARKED_FOR_REVIEW' || a.status === 'ANSWERED_AND_MARKED'
  ).length;

  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const visitedPercentage = totalQuestions > 0 ? (visitedCount / totalQuestions) * 100 : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="flex h-20 items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary uppercase tracking-widest leading-none mb-1">Live Intelligence</span>
              <span className="text-xl font-black tracking-tight leading-none text-zinc-900 dark:text-white truncate max-w-[200px] md:max-w-[400px]">{testName}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-12 hidden xl:flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Solved</span>
                <span className="text-sm font-black">{answeredCount} <span className="text-zinc-400 font-medium">/ {totalQuestions}</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Marked</span>
                <span className="text-sm font-black text-purple-600">{markedCount}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Completion</span>
              <p className="text-sm font-black">{Math.round(progressPercentage)}%</p>
            </div>
          </div>
          <div className="relative h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-zinc-200 dark:bg-zinc-700 transition-all duration-500 ease-out"
              style={{ width: `${visitedPercentage}%` }}
            />
            <div 
              className="absolute left-0 top-0 h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:flex items-center gap-2">
            {onRequestFullscreen && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRequestFullscreen}
                className="h-10 px-4 rounded-xl gap-2 text-xs font-bold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                <Maximize2 className="w-4 h-4" />
                SECURE
              </Button>
            )}
            <LanguageSwitcher />
          </div>
          
          <div className="h-12 w-[1px] bg-zinc-200 dark:border-zinc-800 hidden md:block" />
          
          <div className="flex items-center gap-4">
            <ExamTimer testId={testId} initialTimeSeconds={durationSeconds} onTimeUp={onSubmit} />
            <Button 
              variant="default" 
              onClick={onSubmit} 
              className="h-12 px-6 rounded-xl font-black text-sm uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-900/10 transition-all"
            >
              Submit Attempt
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
