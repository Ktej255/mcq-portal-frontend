"use client";

import React from 'react';
import { useLanguageStore, LanguageMode } from '@/lib/store/useLanguageStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
      <DropdownMenuTrigger className="inline-flex h-7 items-center justify-center gap-2 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline-block">{labels[mode]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setMode('ENGLISH')} className={mode === 'ENGLISH' ? 'bg-accent' : ''}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('HINDI')} className={mode === 'HINDI' ? 'bg-accent' : ''}>
          हिंदी (Hindi)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('HYBRID')} className={mode === 'HYBRID' ? 'bg-accent' : ''}>
          Hybrid Mode
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
