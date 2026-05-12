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
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold">Question Palette</h3>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-5 gap-2">
          {questionIds.map((id, index) => {
            const status = answers[id]?.status || 'UNANSWERED';
            const isActive = index === currentQuestionIndex;
            
            return (
              <Button
                key={id}
                variant="outline"
                className={`w-full aspect-square p-0 rounded-md font-medium transition-all ${getStatusColor(status)} ${isActive ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                onClick={() => {
                  if (onQuestionSelect) {
                    onQuestionSelect(index);
                  } else {
                    setCurrentQuestion(index);
                  }
                }}
              >
                {index + 1}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t bg-muted/10 text-xs grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-rose-50 border border-rose-200" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-purple-500" />
          <span>Review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-purple-600 relative overflow-hidden before:absolute before:bottom-0 before:right-0 before:w-0 before:h-0 before:border-b-[8px] before:border-l-[8px] before:border-b-green-400 before:border-l-transparent" />
          <span>Ans & Review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-zinc-100 border border-zinc-200" />
          <span>Not Visited</span>
        </div>
      </div>
    </div>
  );
}
