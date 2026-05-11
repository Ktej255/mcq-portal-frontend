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
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">{labels[mode]}</span>
        </Button>
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
