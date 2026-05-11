import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  testId: string | null;
  timeLeft: number; // in seconds
  isRunning: boolean;
  setTimeLeft: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  resetTimer: (initialTime: number, testId: string) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      testId: null,
      timeLeft: 0,
      isRunning: false,
      setTimeLeft: (time) => set({ timeLeft: time }),
      startTimer: () => set({ isRunning: true }),
      stopTimer: () => set({ isRunning: false }),
      tick: () => set((state) => ({ 
        timeLeft: state.timeLeft > 0 ? state.timeLeft - 1 : 0,
        isRunning: state.timeLeft > 0 ? state.isRunning : false 
      })),
      resetTimer: (initialTime, testId) => set({ timeLeft: initialTime, isRunning: false, testId }),
    }),
    {
      name: 'mcq-timer-storage',
    }
  )
);
