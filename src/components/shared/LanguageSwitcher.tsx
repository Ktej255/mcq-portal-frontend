"use client";

import React from 'react';
import { useLanguageStore, LanguageMode } from '@/lib/store/useLanguageStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { mode, setMode } = useLanguageStore();

  const labels: Record<LanguageMode, string> = {
    ENGLISH: 'English',
    HINDI: 'हिंदी',
    HYBRID: 'Hybrid (Eng+Hin)'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select language"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#dcd5c7] bg-white px-3 text-xs font-bold text-[#13251d] transition-colors hover:bg-[#f7f4ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline-block">{labels[mode]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setMode('ENGLISH')}
          className={`flex min-h-11 items-center px-3 text-xs font-semibold ${mode === 'ENGLISH' ? 'bg-accent font-bold' : ''}`}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setMode('HINDI')}
          className={`flex min-h-11 items-center px-3 text-xs font-semibold ${mode === 'HINDI' ? 'bg-accent font-bold' : ''}`}
        >
          हिंदी (Hindi)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setMode('HYBRID')}
          className={`flex min-h-11 items-center px-3 text-xs font-semibold ${mode === 'HYBRID' ? 'bg-accent font-bold' : ''}`}
        >
          Hybrid Mode
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
