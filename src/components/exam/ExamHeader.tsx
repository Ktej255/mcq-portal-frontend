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
  
  const answeredCount = Object.values(answers).filter(
    a => a.status === 'ANSWERED' || a.status === 'ANSWERED_AND_MARKED'
  ).length;

  const progressPercentage = (answeredCount / totalQuestions) * 100;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldAlert className="w-6 h-6" />
            <span className="hidden md:inline-block text-xl tracking-tight">{testName}</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden lg:flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Progress</span>
            <span>{answeredCount} / {totalQuestions}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="flex items-center gap-4">
          {onRequestFullscreen && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRequestFullscreen}
              className="hidden sm:flex gap-2 text-xs font-bold bg-primary/5 border-primary/20 hover:bg-primary/10"
            >
              <Maximize2 className="w-4 h-4" />
              Secure Mode
            </Button>
          )}
          <LanguageSwitcher />
          <ExamTimer testId={testId} initialTimeSeconds={durationSeconds} onTimeUp={onSubmit} />
          <Button variant="default" onClick={onSubmit} className="font-semibold shadow-sm">
            Submit Test
          </Button>
        </div>
      </div>
    </header>
  );
}
