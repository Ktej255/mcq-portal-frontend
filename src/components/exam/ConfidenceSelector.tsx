"use client";

import React from 'react';
import { ConfidenceLevel } from '@/lib/store/useExamStore';
import { Button } from '@/components/ui/button';

interface ConfidenceSelectorProps {
  selected: ConfidenceLevel | null;
  onSelect: (level: ConfidenceLevel) => void;
}

const levels: { id: ConfidenceLevel; label: string; colorClass: string }[] = [
  { id: 'BLIND_GUESS', label: 'Blind Guess', colorClass: 'hover:bg-red-100 hover:text-red-700 data-[state=active]:bg-red-500 data-[state=active]:text-white' },
  { id: 'FIFTY_FIFTY', label: '50/50', colorClass: 'hover:bg-orange-100 hover:text-orange-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white' },
  { id: 'EDUCATED_GUESS', label: 'Educated Guess', colorClass: 'hover:bg-yellow-100 hover:text-yellow-700 data-[state=active]:bg-yellow-500 data-[state=active]:text-white' },
  { id: 'FAIRLY_SURE', label: 'Fairly Sure', colorClass: 'hover:bg-blue-100 hover:text-blue-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white' },
  { id: 'HUNDRED_PERCENT', label: '100% Sure', colorClass: 'hover:bg-green-100 hover:text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white' },
];

export function ConfidenceSelector({ selected, onSelect }: ConfidenceSelectorProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Confidence Level</h4>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <Button
            key={level.id}
            variant="outline"
            size="sm"
            data-state={selected === level.id ? 'active' : 'inactive'}
            className={`transition-colors ${level.colorClass} ${selected === level.id ? 'border-transparent' : ''}`}
            onClick={() => onSelect(level.id)}
          >
            {level.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
