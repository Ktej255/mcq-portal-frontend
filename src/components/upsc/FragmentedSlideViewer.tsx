/**
 * FragmentedSlideViewer — lightweight slide-by-slide content viewer.
 * Used in SubjectWatchRoom for Economy, History, Environment, etc.
 * 
 * Note: The Geography-specific version (with voice recall) has been removed.
 * This is the generic version used by all other subjects.
 */
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FragmentedSlide {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
  expectedKeywords?: string[];
}

interface FragmentedSlideViewerProps {
  slides: FragmentedSlide[];
  subjectAccent?: string;
  subjectDark?: string;
  subjectLight?: string;
  onComplete?: () => void;
}

export function FragmentedSlideViewer({
  slides,
  subjectAccent = "#1d9e75",
  subjectDark = "#1a3a2a",
  subjectLight = "#e7f5ee",
  onComplete,
}: FragmentedSlideViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  if (slides.length === 0) return null;

  const activeSlide = slides[activeIndex];
  const isCompleted = completedIds.includes(activeSlide.id);
  const allComplete = completedIds.length >= slides.length;

  const markComplete = () => {
    if (!isCompleted) {
      const next = [...completedIds, activeSlide.id];
      setCompletedIds(next);
      if (next.length >= slides.length && onComplete) {
        onComplete();
      }
    }
    if (activeIndex < slides.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress strip */}
      <div className="flex gap-1">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              completedIds.includes(slide.id)
                ? "opacity-100"
                : i === activeIndex
                  ? "opacity-60"
                  : "opacity-20"
            )}
            style={{ backgroundColor: subjectAccent }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: `${subjectAccent}33`, backgroundColor: `${subjectLight}66` }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ color: subjectAccent }}
        >
          Slide {activeIndex + 1} of {slides.length}
        </p>
        <h3 className="mt-2 text-lg font-black" style={{ color: subjectDark }}>
          {activeSlide.title}
        </h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">
          {activeSlide.body}
        </p>
        {activeSlide.bullets && activeSlide.bullets.length > 0 && (
          <ul className="mt-3 space-y-1">
            {activeSlide.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-semibold text-[#5d675f]">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subjectAccent }}
                />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#dcd5c7] bg-white px-3 text-xs font-black disabled:opacity-40"
          style={{ color: subjectDark }}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>

        <button
          type="button"
          onClick={markComplete}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-xs font-black text-white transition",
            isCompleted ? "opacity-70" : "hover:brightness-90"
          )}
          style={{ backgroundColor: subjectDark }}
        >
          {isCompleted ? (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Done</>
          ) : activeIndex < slides.length - 1 ? (
            <>Next <ChevronRight className="h-3.5 w-3.5" /></>
          ) : (
            <>Complete {allComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}</>
          )}
        </button>
      </div>
    </div>
  );
}
