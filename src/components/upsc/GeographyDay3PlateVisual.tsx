"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay3PlateStages } from "@/lib/upsc/geographyDay3PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay3PlateVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [motionProgress, setMotionProgress] = useState(0);
  const activeStage = geographyDay3PlateStages[activeIndex];
  const showLayers = activeIndex >= 1;
  const showConvection = activeIndex >= 2;
  const showBoundaries = activeIndex >= 3;
  const showHazards = activeIndex >= 4;
  const convectionAngle = motionProgress * Math.PI * 2;
  const leftConvectionPoint = {
    x: 150 - 32 + Math.cos(convectionAngle) * 30,
    y: 168 + Math.sin(convectionAngle) * 56,
  };
  const rightConvectionPoint = {
    x: 150 + 32 + Math.cos(-convectionAngle) * 30,
    y: 168 + Math.sin(-convectionAngle) * 56,
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay3PlateStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setMotionProgress((current) => (current + 0.015) % 1);
    }, 80);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <div
      data-testid="day3-plate-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#10171d]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 580 340"
            role="img"
            aria-label="Earth interior to plate-boundary causal animation"
            className="relative z-10 h-full min-h-[19rem] w-full"
          >
            <defs>
              <radialGradient id="day3-mantle" cx="38%" cy="32%" r="70%">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="58%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#7c2d12" />
              </radialGradient>
              <radialGradient id="day3-core" cx="42%" cy="34%" r="62%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="62%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
            </defs>

            <g>
              <circle cx="150" cy="168" r="96" fill="#2f241c" stroke="#d1fae5" strokeWidth="4" />
              <circle cx="150" cy="168" r="82" fill="url(#day3-mantle)" />
              <circle cx="150" cy="168" r="50" fill="#dc2626" opacity="0.88" />
              <circle cx="150" cy="168" r="25" fill="url(#day3-core)" />
              <path d="M 84 138 C 130 98, 164 95, 218 128" fill="none" stroke="#a7f3d0" strokeWidth="6" strokeLinecap="round" />

              <path d="M 33 214 C 76 174, 100 138, 139 116" fill="none" stroke="#bae6fd" strokeWidth="4" strokeDasharray="7 6" />
              <path d="M 33 232 C 78 204, 105 191, 132 184" fill="none" stroke="#fef3c7" strokeWidth="4" strokeDasharray="7 6" />
              <path d="M 132 184 C 109 213, 83 244, 48 264" fill="none" stroke="#fef3c7" strokeWidth="4" strokeDasharray="7 6" opacity={activeIndex === 0 ? 0.28 : 0.78} />
              <text x="32" y="204" fill="#bae6fd" fontSize="11" fontWeight="900">P-wave bends</text>
              <text x="32" y="286" fill="#fef3c7" fontSize="11" fontWeight="900">S-wave blocked</text>
            </g>

            {showLayers ? (
              <g>
                <text x="150" y="52" textAnchor="middle" fill="#d1fae5" fontSize="11" fontWeight="900">crust</text>
                <text x="90" y="166" textAnchor="middle" fill="#ffedd5" fontSize="11" fontWeight="900">mantle</text>
                <text x="150" y="172" textAnchor="middle" fill="#fee2e2" fontSize="10" fontWeight="900">outer core</text>
                <text x="150" y="174" textAnchor="middle" fill="#78350f" fontSize="8" fontWeight="900">inner</text>
                <rect x="60" y="292" width="180" height="34" rx="8" fill="#064e3b" />
                <text x="150" y="313" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">rigid lithosphere over weak asthenosphere</text>
              </g>
            ) : null}

            {showConvection ? (
              <g>
                <path d="M 114 221 C 88 171, 100 121, 138 103" fill="none" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
                <path d="M 138 103 L 126 102 L 134 113 Z" fill="#fef3c7" />
                <path d="M 180 106 C 214 139, 206 194, 172 224" fill="none" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
                <path d="M 172 224 L 184 219 L 177 211 Z" fill="#fef3c7" />
                <g data-testid="day3-continuous-convection-motion" data-motion-progress={motionProgress.toFixed(3)}>
                  <circle cx={leftConvectionPoint.x} cy={leftConvectionPoint.y} r="7" fill="#fef3c7" opacity="0.96" />
                  <circle cx={rightConvectionPoint.x} cy={rightConvectionPoint.y} r="7" fill="#fb923c" opacity="0.96" />
                </g>
                <text x="150" y="78" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="900">internal heat moves mantle material</text>
              </g>
            ) : null}

            <g transform="translate(302 66)">
              <rect width="230" height="58" rx="8" fill={showBoundaries ? "#064e3b" : "#1f2937"} />
              <rect x="48" y="34" width="48" height="8" rx="3" fill="#0f766e" />
              <rect x="134" y="34" width="48" height="8" rx="3" fill="#0f766e" />
              <path d="M 112 44 L 112 24" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" />
              <text x="115" y="19" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="900">Divergent: ridge and new crust</text>
            </g>

            <g transform="translate(302 142)">
              <rect width="230" height="62" rx="8" fill={showBoundaries ? "#7c2d12" : "#1f2937"} />
              <rect x="42" y="36" width="64" height="8" rx="3" fill="#0f766e" />
              <path d="M 118 36 L 185 54" stroke="#134e4a" strokeWidth="8" strokeLinecap="round" />
              <path d="M 120 34 L 140 16 L 158 34 Z" fill="#a7f3d0" />
              <text x="115" y="18" textAnchor="middle" fill="#ffedd5" fontSize="10" fontWeight="900">Convergent: trench, uplift, volcano</text>
            </g>

            <g transform="translate(302 222)">
              <rect width="230" height="58" rx="8" fill={showBoundaries ? "#164e63" : "#1f2937"} />
              <rect x="68" y="27" width="94" height="9" rx="4" fill="#0f766e" />
              <path d="M 116 19 L 105 44" stroke="#fef3c7" strokeWidth="3" strokeDasharray="5 4" />
              <path d="M 110 32 L 120 23 L 116 34 L 128 30 L 114 47 L 117 35 Z" fill="#facc15" />
              <text x="115" y="16" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="900">Transform: earthquake fault</text>
            </g>

            {showHazards ? (
              <g>
                <circle cx="327" cy="90" r="5" fill="#facc15" />
                <circle cx="420" cy="170" r="5" fill="#ef4444" />
                <circle cx="416" cy="250" r="5" fill="#facc15" />
                <text x="417" y="310" textAnchor="middle" fill="#fecaca" fontSize="11" fontWeight="900">landforms and hazards cluster at margins</text>
              </g>
            ) : null}
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#75ddbc]">{activeStage.eyebrow}</p>
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
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#1d9e75] px-3 text-sm font-black text-white transition hover:bg-[#087a59]"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              title="Restart animation"
              onClick={() => {
                setIsPlaying(false);
                setActiveIndex(0);
                setMotionProgress(0);
              }}
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-5">
        {geographyDay3PlateStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day3-plate-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#18232b] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#8ee8c8]" : "text-white/60 hover:bg-[#25343d] hover:text-white",
            )}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}
