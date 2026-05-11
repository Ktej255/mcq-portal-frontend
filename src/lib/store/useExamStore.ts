import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConfidenceLevel = 'BLIND_GUESS' | 'FIFTY_FIFTY' | 'EDUCATED_GUESS' | 'FAIRLY_SURE' | 'HUNDRED_PERCENT';

export type QuestionStatus = 'UNANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED';

export interface AnswerRecord {
  questionId: string;
  selectedOptionId: string | null;
  confidence: ConfidenceLevel | null;
  status: QuestionStatus;
  timeSpentSeconds: number;
}

interface ExamState {
  testId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, AnswerRecord>;
  
  initializeTest: (testId: string, questionIds: string[]) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: string, optionId: string | null, confidence: ConfidenceLevel | null) => void;
  markForReview: (questionId: string) => void;
  clearResponse: (questionId: string) => void;
  recordTime: (questionId: string, timeSpent: number) => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      testId: null,
      currentQuestionIndex: 0,
      answers: {},

  initializeTest: (testId, questionIds) => {
    const initialAnswers: Record<string, AnswerRecord> = {};
    questionIds.forEach(id => {
      initialAnswers[id] = {
        questionId: id,
        selectedOptionId: null,
        confidence: null,
        status: 'UNANSWERED',
        timeSpentSeconds: 0,
      };
    });
    set({ testId, currentQuestionIndex: 0, answers: initialAnswers });
  },

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),

  setAnswer: (questionId, optionId, confidence) => set((state) => {
    const existing = state.answers[questionId];
    if (!existing) return state;

    const newStatus: QuestionStatus = 
      existing.status === 'MARKED_FOR_REVIEW' || existing.status === 'ANSWERED_AND_MARKED'
        ? (optionId ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW')
        : (optionId ? 'ANSWERED' : 'UNANSWERED');

    return {
      answers: {
        ...state.answers,
        [questionId]: {
          ...existing,
          selectedOptionId: optionId,
          confidence,
          status: newStatus,
        }
      }
    };
  }),

  markForReview: (questionId) => set((state) => {
    const existing = state.answers[questionId];
    if (!existing) return state;

    const newStatus: QuestionStatus = 
      existing.selectedOptionId ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW';

    return {
      answers: {
        ...state.answers,
        [questionId]: {
          ...existing,
          status: newStatus,
        }
      }
    };
  }),

  clearResponse: (questionId) => set((state) => {
    const existing = state.answers[questionId];
    if (!existing) return state;

    const newStatus: QuestionStatus = 
      existing.status === 'ANSWERED_AND_MARKED' || existing.status === 'MARKED_FOR_REVIEW'
        ? 'MARKED_FOR_REVIEW' 
        : 'UNANSWERED';

    return {
      answers: {
        ...state.answers,
        [questionId]: {
          ...existing,
          selectedOptionId: null,
          confidence: null,
          status: newStatus,
        }
      }
    };
  }),

  recordTime: (questionId, timeSpent) => set((state) => {
    const existing = state.answers[questionId];
    if (!existing) return state;

    return {
      answers: {
        ...state.answers,
        [questionId]: {
          ...existing,
          timeSpentSeconds: existing.timeSpentSeconds + timeSpent,
        }
      }
    };
  }),
    }),
    {
      name: 'mcq-exam-storage',
    }
  )
);
