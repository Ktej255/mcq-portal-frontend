import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConfidenceLevel = 'BLIND_GUESS' | 'FIFTY_FIFTY' | 'EDUCATED_GUESS' | 'FAIRLY_SURE' | 'HUNDRED_PERCENT';

export type QuestionStatus = 'NOT_VISITED' | 'UNANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED';

export interface AnswerRecord {
  questionId: string;
  selectedOptionId: string | null;
  confidence: ConfidenceLevel | null;
  status: QuestionStatus;
  timeSpentSeconds: number;
  lastAction?: 'VISITED' | 'ANSWER_SELECTED' | 'CLEARED' | 'MARKED_FOR_REVIEW';
}

interface ExamState {
  testId: string | null;
  attemptId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, AnswerRecord>;
  
  initializeTest: (testId: string, questionIds: string[], attemptId?: string | null) => void;
  setCurrentQuestion: (index: number) => void;
  visitQuestion: (questionId: string) => void;
  setAnswer: (questionId: string, optionId: string | null, confidence: ConfidenceLevel | null) => void;
  markForReview: (questionId: string) => void;
  clearResponse: (questionId: string) => void;
  recordTime: (questionId: string, timeSpent: number) => void;
  hydrateFromServer: (saved: ServerSavedAnswer[]) => number;
}

/** An answer the server already holds, with the option id as the screen uses it. */
export interface ServerSavedAnswer {
  questionId: string;
  selectedOptionId: string | null;
  confidence: ConfidenceLevel | null;
  markedForReview: boolean;
  timeSpentSeconds: number;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      testId: null,
      attemptId: null,
      currentQuestionIndex: 0,
      answers: {},

  initializeTest: (testId, questionIds, attemptId = null) => {
    const initialAnswers: Record<string, AnswerRecord> = {};
    questionIds.forEach(id => {
      const stringId = String(id);
      initialAnswers[stringId] = {
        questionId: stringId,
        selectedOptionId: null,
        confidence: null,
        status: 'NOT_VISITED',
        timeSpentSeconds: 0,
      };
    });
    set({ testId, attemptId: attemptId ? String(attemptId) : null, currentQuestionIndex: 0, answers: initialAnswers });
  },

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),

  visitQuestion: (questionId) => set((state) => {
    const stringId = String(questionId);
    const existing = state.answers[stringId];
    if (!existing || existing.status !== 'NOT_VISITED') return state;

    return {
      answers: {
        ...state.answers,
        [stringId]: {
          ...existing,
          status: 'UNANSWERED',
          lastAction: 'VISITED',
        }
      }
    };
  }),

  setAnswer: (questionId, optionId, confidence) => set((state) => {
    const stringId = String(questionId);
    const existing = state.answers[stringId];
    if (!existing) return state;

    const newStatus: QuestionStatus = 
      existing.status === 'MARKED_FOR_REVIEW' || existing.status === 'ANSWERED_AND_MARKED'
        ? (optionId ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW')
        : (optionId ? 'ANSWERED' : 'UNANSWERED');

    return {
      answers: {
        ...state.answers,
        [stringId]: {
          ...existing,
          selectedOptionId: optionId,
          confidence,
          status: newStatus,
          lastAction: optionId ? 'ANSWER_SELECTED' : 'CLEARED',
        }
      }
    };
  }),

  markForReview: (questionId) => set((state) => {
    const stringId = String(questionId);
    const existing = state.answers[stringId];
    if (!existing) return state;

    const newStatus: QuestionStatus = 
      existing.selectedOptionId ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW';

    return {
      answers: {
        ...state.answers,
        [stringId]: {
          ...existing,
          status: newStatus,
          lastAction: 'MARKED_FOR_REVIEW',
        }
      }
    };
  }),

  clearResponse: (questionId) => set((state) => {
    const stringId = String(questionId);
    const existing = state.answers[stringId];
    if (!existing) return state;

    const newStatus: QuestionStatus = 
      existing.status === 'ANSWERED_AND_MARKED' || existing.status === 'MARKED_FOR_REVIEW'
        ? 'MARKED_FOR_REVIEW' 
        : 'UNANSWERED';

    return {
      answers: {
        ...state.answers,
        [stringId]: {
          ...existing,
          selectedOptionId: null,
          confidence: null,
          status: newStatus,
          lastAction: 'CLEARED',
        }
      }
    };
  }),

  recordTime: (questionId, timeSpent) => set((state) => {
    const stringId = String(questionId);
    const existing = state.answers[stringId];
    if (!existing) return state;

    return {
      answers: {
        ...state.answers,
        [stringId]: {
          ...existing,
          timeSpentSeconds: existing.timeSpentSeconds + timeSpent,
        }
      }
    };
  }),

  // Resume: fill in answers the server holds for questions this browser has
  // no work on. Anything done here (and perhaps not synced yet) is newer than
  // the server copy, so it is kept. Returns how many answers were restored.
  hydrateFromServer: (saved) => {
    const answers = { ...get().answers };
    let restored = 0;
    saved.forEach(item => {
      const existing = answers[item.questionId];
      if (!existing) return;
      const untouched = existing.lastAction === undefined || existing.lastAction === 'VISITED';
      if (!untouched) return;
      if (!item.selectedOptionId && !item.markedForReview) return;
      answers[item.questionId] = {
        ...existing,
        selectedOptionId: item.selectedOptionId,
        confidence: item.confidence,
        status: item.selectedOptionId
          ? (item.markedForReview ? 'ANSWERED_AND_MARKED' : 'ANSWERED')
          : 'MARKED_FOR_REVIEW',
        timeSpentSeconds: Math.max(existing.timeSpentSeconds, item.timeSpentSeconds),
        lastAction: item.selectedOptionId ? 'ANSWER_SELECTED' : 'MARKED_FOR_REVIEW',
      };
      restored += 1;
    });
    if (restored > 0) set({ answers });
    return restored;
  },
    }),
    {
      name: 'mcq-exam-storage',
    }
  )
);
