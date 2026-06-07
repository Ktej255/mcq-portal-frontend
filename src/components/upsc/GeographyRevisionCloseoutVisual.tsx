"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay28WeakAreaRepairStages } from "@/lib/upsc/geographyDay28PortalLesson";
import { geographyDay29FinalMockReviewStages } from "@/lib/upsc/geographyDay29PortalLesson";
import { geographyDay30GeographyCommandDayStages } from "@/lib/upsc/geographyDay30PortalLesson";
import { cn } from "@/lib/utils";

type CloseoutStage = {
  id: string;
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
  diagramTitle: string;
  diagramCue: string;
};

type CloseoutVisualConfig = {
  testId: string;
  stageTestIdPrefix: string;
  ariaLabel: string;
  banner: string;
  stages: CloseoutStage[];
};

const day28Config: CloseoutVisualConfig = {
  testId: "day28-weak-area-repair-visual",
  stageTestIdPrefix: "day28-weak-area-repair-stage",
  ariaLabel: "Weak-area repair board classifying mistakes, locating root cause, writing a repair card, using a fresh retest, and scheduling the remainder",
  banner: "TARGETED RECOVERY",
  stages: geographyDay28WeakAreaRepairStages,
};

const day29Config: CloseoutVisualConfig = {
  testId: "day29-final-mock-review-visual",
  stageTestIdPrefix: "day29-final-mock-review-stage",
  ariaLabel: "Final-mock review board reading beyond score, classifying mistakes, repairing map errors, building a 24-hour queue, and controlling confidence",
  banner: "FINAL MOCK REVIEW",
  stages: geographyDay29FinalMockReviewStages,
};

const day30Config: CloseoutVisualConfig = {
  testId: "day30-geography-command-day-visual",
  stageTestIdPrefix: "day30-geography-command-day-stage",
  ariaLabel: "Geography command-day board running final recall, checking map confidence, auditing proof, locking revision dates, and setting the command verdict",
  banner: "GEOGRAPHY COMMAND",
  stages: geographyDay30GeographyCommandDayStages,
};

function GeographyRevisionCloseoutVisual({ config }: { config: CloseoutVisualConfig }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = config.stages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= config.stages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [config.stages.length, isPlaying]);

  return (
    <div
      data-testid={config.testId}
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg viewBox="0 0 640 370" role="img" aria-label={config.ariaLabel} className="relative z-10 h-full min-h-[20rem] w-full">
            <rect x="38" y="38" width="564" height="54" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
            <text x="58" y="70" fill="#dcfce7" fontSize="11" fontWeight="900">{config.banner}</text>

            {config.stages.map((stage, index) => {
              const isVisible = index <= activeIndex;
              const x = index % 2 === 0 ? 38 : 332;
              const y = index < 2 ? 126 : index < 4 ? 216 : 306;
              const width = index === 4 ? 564 : 270;
              return (
                <g key={stage.id} opacity={isVisible ? 1 : 0.14}>
                  <rect x={index === 4 ? 38 : x} y={y} width={width} height={index === 4 ? 48 : 64} rx="8" fill="#0f172a" stroke={index === 4 ? "#fb7185" : index % 2 === 0 ? "#38bdf8" : "#fbbf24"} strokeWidth="3" />
                  <text x={(index === 4 ? 38 : x) + 18} y={y + 24} fill={index === 4 ? "#fecdd3" : index % 2 === 0 ? "#bae6fd" : "#fef3c7"} fontSize="10" fontWeight="900">{stage.diagramTitle}</text>
                  <text x={(index === 4 ? 38 : x) + 18} y={y + 44} fill="#ffffff" fontSize="8" fontWeight="800">{stage.diagramCue}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#86efac]">{activeStage.eyebrow}</p>
            <h4 className="mt-2 text-xl font-black text-white">{activeStage.label}</h4>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/75">{activeStage.explanation}</p>
            <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-xs font-bold leading-5 text-[#fde68a]">{activeStage.proof}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" title={isPlaying ? "Pause animation" : "Play animation"} onClick={() => setIsPlaying((current) => !current)} className="inline-flex h-10 items-center justify-center rounded-md bg-[#15803d] px-3 text-sm font-black text-white transition hover:bg-[#166534]">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button type="button" title="Restart animation" onClick={() => { setIsPlaying(false); setActiveIndex(0); }} className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/15">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-5">
        {config.stages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`${config.stageTestIdPrefix}-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => { setIsPlaying(false); setActiveIndex(index); }}
            className={cn("min-h-14 bg-[#28543f] px-3 py-2 text-left text-xs font-black leading-4 transition", index === activeIndex ? "text-[#dcfce7]" : "text-white/60 hover:bg-[#166534] hover:text-white")}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GeographyDay28WeakAreaRepairVisual() {
  return <GeographyRevisionCloseoutVisual config={day28Config} />;
}

export function GeographyDay29FinalMockReviewVisual() {
  return <GeographyRevisionCloseoutVisual config={day29Config} />;
}

export function GeographyDay30GeographyCommandDayVisual() {
  return <GeographyRevisionCloseoutVisual config={day30Config} />;
}
