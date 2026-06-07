"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay23PyqPatternReadingStages } from "@/lib/upsc/geographyDay23PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay23PyqPatternReadingVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay23PyqPatternReadingStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay23PyqPatternReadingStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay23PyqPatternReadingStages)[number]["id"]) =>
    geographyDay23PyqPatternReadingStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day23-pyq-pattern-reading-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="PYQ pattern reading board classifying traps, checking process and location, inspecting pairs, testing explanations, and creating repair cards"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <g opacity={isVisible("classify") ? 1 : 0.16}>
              <rect x="42" y="48" width="556" height="72" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <text x="62" y="76" fill="#dcfce7" fontSize="11" fontWeight="900">WHAT IS UPSC TESTING?</text>
              <text x="62" y="100" fill="#ffffff" fontSize="9" fontWeight="800">concept  map  process order  exception  pair match  current-static link</text>
            </g>

            <g opacity={isVisible("sequence") ? 1 : 0.14}>
              <rect x="42" y="154" width="252" height="78" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="60" y="180" fill="#bae6fd" fontSize="10" fontWeight="900">VERIFY RELATIONSHIP</text>
              <text x="60" y="202" fill="#ffffff" fontSize="9" fontWeight="800">order location season soil crop hazard</text>
              <text x="60" y="218" fill="#fde68a" fontSize="9" fontWeight="900">right fact + wrong anchor</text>
            </g>

            <g opacity={isVisible("pairs") ? 1 : 0.14}>
              <rect x="330" y="154" width="268" height="78" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
              <text x="348" y="180" fill="#fef3c7" fontSize="10" fontWeight="900">PAIR AND EXCEPTION</text>
              <text x="348" y="202" fill="#ffffff" fontSize="9" fontWeight="800">test each pair independently</text>
              <text x="348" y="218" fill="#fde68a" fontSize="9" fontWeight="900">reject the familiar mismatch</text>
            </g>

            <g opacity={isVisible("explain") ? 1 : 0.14}>
              <rect x="42" y="270" width="274" height="66" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <text x="60" y="294" fill="#bae6fd" fontSize="10" fontWeight="900">CAUSE-EFFECT TEST</text>
              <text x="60" y="316" fill="#ffffff" fontSize="9" fontWeight="800">true A + true B may still be a false link</text>
            </g>

            <g opacity={isVisible("repair") ? 1 : 0.14}>
              <rect x="348" y="270" width="250" height="66" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="366" y="294" fill="#fecdd3" fontSize="10" fontWeight="900">REPAIR CARD</text>
              <text x="366" y="316" fill="#ffffff" fontSize="9" fontWeight="800">classify verify reject rewrite retest</text>
            </g>
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#86efac]">{activeStage.eyebrow}</p>
            <h4 className="mt-2 text-xl font-black text-white">{activeStage.label}</h4>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/75">{activeStage.explanation}</p>
            <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-xs font-bold leading-5 text-[#fde68a]">
              {activeStage.proof}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              title={isPlaying ? "Pause animation" : "Play animation"}
              onClick={() => setIsPlaying((current) => !current)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#15803d] px-3 text-sm font-black text-white transition hover:bg-[#166534]"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              title="Restart animation"
              onClick={() => {
                setIsPlaying(false);
                setActiveIndex(0);
              }}
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-5">
        {geographyDay23PyqPatternReadingStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day23-pyq-pattern-reading-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#28543f] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#dcfce7]" : "text-white/60 hover:bg-[#166534] hover:text-white",
            )}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}
