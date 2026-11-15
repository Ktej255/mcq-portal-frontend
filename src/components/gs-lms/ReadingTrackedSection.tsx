"use client";

import { useEffect, type ReactNode } from "react";
import { useReadingTimer } from "@/hooks/useReadingTimer";

interface ReadingTrackedSectionProps {
  nodeId: number;
  sectionId: number;
  subject: string;
  enabled: boolean;
  completionRequested: boolean;
  children: ReactNode;
}

/** Owns the reading timer for exactly one visible funnel section. */
export function ReadingTrackedSection({
  nodeId,
  sectionId,
  subject,
  enabled,
  completionRequested,
  children,
}: ReadingTrackedSectionProps) {
  const { startTimer, stopTimer } = useReadingTimer({
    nodeId,
    sectionId,
    subject,
  });

  useEffect(() => {
    if (enabled && !document.hidden) {
      startTimer();
    }

    return () => {
      stopTimer();
    };
  }, [enabled, startTimer, stopTimer]);

  useEffect(() => {
    if (completionRequested) {
      stopTimer();
    } else if (enabled && !document.hidden) {
      startTimer();
    }
  }, [completionRequested, enabled, startTimer, stopTimer]);

  return <>{children}</>;
}
