import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LanguageMode = 'ENGLISH' | 'HINDI' | 'HYBRID';

interface LanguageState {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
  toggleMode: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      mode: 'ENGLISH',
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => {
        if (state.mode === 'ENGLISH') return { mode: 'HINDI' };
        if (state.mode === 'HINDI') return { mode: 'HYBRID' };
        return { mode: 'ENGLISH' };
      }),
    }),
    {
      name: 'mcq-language-storage',
    }
  )
);
