"use client";

import React, { useEffect, useRef } from 'react';
import { useTimerStore } from '@/lib/store/useTimerStore';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
  testId: string;
  initialTimeSeconds: number;
  onTimeUp?: () => void;
}

export function ExamTimer({ testId, initialTimeSeconds, onTimeUp }: ExamTimerProps) {
  const { testId: storeTestId, timeLeft, isRunning, resetTimer, startTimer, tick } = useTimerStore();
  const tickInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (storeTestId !== testId) {
      // New test, reset timer
      resetTimer(initialTimeSeconds, testId);
    }
    // Always ensure it is running if we are mounted
    startTimer();
  }, [testId, initialTimeSeconds, storeTestId, resetTimer, startTimer]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      tickInterval.current = setInterval(() => {
        tick();
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      if (onTimeUp) onTimeUp();
    }
    
    return () => {
      if (tickInterval.current) clearInterval(tickInterval.current);
    };
  }, [isRunning, timeLeft, tick, onTimeUp]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft > 0 && timeLeft < 300;

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-md border ${isWarning ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-secondary text-secondary-foreground'}`}>
      <Clock className="w-5 h-5" />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}
