import { create } from 'zustand';

/**
 * The exam clock.
 *
 * The server decides how much time is left; this store only counts down to
 * the deadline that follows from it. Nothing is persisted: on a reload the
 * exam screen asks the server again, so closing the tab does not pause the
 * clock and a wrong device clock cannot add time.
 */
interface TimerState {
  /** What the deadline belongs to (an attempt, or a drill). */
  key: string | null;
  /** Local time at which the clock reaches zero. */
  deadlineMs: number | null;
  /** Whole seconds left, derived from the deadline. */
  timeLeft: number;
  setDeadline: (key: string, remainingSeconds: number) => void;
  sync: () => void;
  clear: () => void;
}

const secondsUntil = (deadlineMs: number) => Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));

export const useTimerStore = create<TimerState>()((set, get) => ({
  key: null,
  deadlineMs: null,
  timeLeft: 0,
  setDeadline: (key, remainingSeconds) => {
    const deadlineMs = Date.now() + Math.max(0, remainingSeconds) * 1000;
    set({ key, deadlineMs, timeLeft: secondsUntil(deadlineMs) });
  },
  sync: () => {
    const { deadlineMs, timeLeft } = get();
    if (deadlineMs === null) return;
    const next = secondsUntil(deadlineMs);
    if (next !== timeLeft) set({ timeLeft: next });
  },
  clear: () => set({ key: null, deadlineMs: null, timeLeft: 0 }),
}));
