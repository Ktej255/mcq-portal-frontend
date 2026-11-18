"use client";

import React, { useEffect, useRef } from 'react';
import { useTimerStore } from '@/lib/store/useTimerStore';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
  /** Identifies what is being timed, e.g. the attempt. The exam screen sets the deadline for it. */
  timerKey: string;
  /** Called once when the clock reaches zero. */
  onTimeUp?: () => void;
}

export function ExamTimer({ timerKey, onTimeUp }: ExamTimerProps) {
  const { key, deadlineMs, timeLeft, sync } = useTimerStore();
  const onTimeUpRef = useRef(onTimeUp);
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // The deadline is set once, from the server's clock, when the exam opens.
  // Until then (or for a test without a limit) there is nothing to count.
  const ready = key === timerKey && deadlineMs !== null;

  useEffect(() => {
    if (!ready) return;
    // Recomputed from the deadline on every tick, so a throttled background
    // tab or a sleeping laptop cannot stretch the exam.
    const interval = setInterval(sync, 500);
    const onVisible = () => sync();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ready, sync]);

  useEffect(() => {
    if (!ready || timeLeft > 0 || firedFor.current === timerKey) return;
    firedFor.current = timerKey;
    onTimeUpRef.current?.();
  }, [ready, timeLeft, timerKey]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = ready && timeLeft < 300;

  return (
    <div
      data-testid="exam-timer"
      className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-md border ${isWarning ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-secondary text-secondary-foreground'}`}
    >
      <Clock className="w-5 h-5" />
      <span>{ready ? formatTime(timeLeft) : '--:--'}</span>
    </div>
  );
}
