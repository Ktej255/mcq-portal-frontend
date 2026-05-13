"use client";

import React from 'react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

interface BilingualTextProps {
  textEn?: string | null;
  textHi?: string | null;
  className?: string;
  hybridContainerClassName?: string;
}

export const BilingualText = React.memo(({ 
  textEn, 
  textHi, 
  className = "", 
  hybridContainerClassName = "flex flex-col gap-2"
}: BilingualTextProps) => {
  const mode = useLanguageStore((state) => state.mode);

  if (!textEn && !textHi) return null;

  if (mode === 'ENGLISH') {
    return <span className={`whitespace-pre-line ${className}`}>{textEn || textHi}</span>;
  }

  if (mode === 'HINDI') {
    return <span className={`whitespace-pre-line ${className}`}>{textHi || textEn}</span>;
  }

  // HYBRID MODE
  return (
    <div className={`${hybridContainerClassName} whitespace-pre-line`}>
      {textHi && (
        <span className={`text-lg font-medium ${className}`}>{textHi}</span>
      )}
      {textEn && (
        <span className={`text-sm text-muted-foreground ${className}`}>{textEn}</span>
      )}
    </div>
  );
});

BilingualText.displayName = "BilingualText";
