"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay5ClimatologyStages } from "@/lib/upsc/geographyDay5PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay5ClimatologyVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay5ClimatologyStages[activeIndex];
  const showPressure = activeIndex >= 1;
  const showCirculation = activeIndex >= 2;
  const showCoriolis = activeIndex >= 3;
  const showBelts = activeIndex >= 4;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay5ClimatologyStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <div
      data-testid="day5-climatology-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#102736]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 580 340"
            role="img"
            aria-label="Unequal heating pressure gradient Coriolis and planetary wind-belt animation"
            className="relative z-10 h-full min-h-[19rem] w-full"
          >
            <defs>
              <linearGradient id="day5-earth" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#0c4a6e" />
                <stop offset="50%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#164e63" />
              </linearGradient>
              <linearGradient id="day5-energy" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>

            <circle cx="290" cy="176" r="134" fill="url(#day5-earth)" stroke="#bae6fd" strokeWidth="3" />
            <ellipse cx="290" cy="176" rx="134" ry="32" fill="none" stroke="#fef08a" strokeWidth="3" opacity="0.88" />
            <ellipse cx="290" cy="108" rx="116" ry="22" fill="none" stroke="#bfdbfe" strokeWidth="2" opacity="0.76" />
            <ellipse cx="290" cy="244" rx="116" ry="22" fill="none" stroke="#bfdbfe" strokeWidth="2" opacity="0.76" />
            <path d="M 50 176 L 152 176" stroke="url(#day5-energy)" strokeWidth="12" strokeLinecap="round" />
            <path d="M 50 116 L 166 142" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" opacity="0.72" />
            <path d="M 50 236 L 166 210" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" opacity="0.72" />
            <text x="72" y="162" fill="#fff7ed" fontSize="11" fontWeight="900">direct rays</text>
            <text x="290" y="181" textAnchor="middle" fill="#fef9c3" fontSize="11" fontWeight="900">equatorial heating</text>

            {showPressure ? (
              <g>
                <path d="M 290 168 L 290 80" stroke="#fecaca" strokeWidth="6" strokeLinecap="round" />
                <path d="M 290 80 L 278 98 L 302 98 Z" fill="#fecaca" />
                <text x="310" y="92" fill="#fecaca" fontSize="11" fontWeight="900">warm air rises: L</text>
                <path d="M 206 94 L 206 144" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
                <path d="M 206 144 L 194 126 L 218 126 Z" fill="#bae6fd" />
                <text x="132" y="80" fill="#bae6fd" fontSize="11" fontWeight="900">cool air sinks: H</text>
              </g>
            ) : null}

            {showCirculation ? (
              <g>
                <path d="M 286 80 C 236 68, 198 88, 202 142" fill="none" stroke="#d1fae5" strokeWidth="5" strokeDasharray="8 6" />
                <path d="M 210 150 C 232 178, 258 184, 284 178" fill="none" stroke="#d1fae5" strokeWidth="5" strokeDasharray="8 6" />
                <path d="M 294 80 C 344 68, 382 88, 378 142" fill="none" stroke="#d1fae5" strokeWidth="5" strokeDasharray="8 6" />
                <path d="M 370 150 C 348 178, 322 184, 296 178" fill="none" stroke="#d1fae5" strokeWidth="5" strokeDasharray="8 6" />
                <text x="290" y="54" textAnchor="middle" fill="#d1fae5" fontSize="11" fontWeight="900">pressure gradient moves air high to low</text>
              </g>
            ) : null}

            {showCoriolis ? (
              <g>
                <path d="M 224 132 C 250 110, 270 106, 294 120" fill="none" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />
                <path d="M 294 120 L 276 120 L 286 104 Z" fill="#fef08a" />
                <path d="M 356 220 C 330 240, 306 244, 282 230" fill="none" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />
                <path d="M 282 230 L 300 230 L 290 246 Z" fill="#fef08a" />
                <text x="290" y="318" textAnchor="middle" fill="#fef9c3" fontSize="11" fontWeight="900">Coriolis curves moving air on a rotating Earth</text>
              </g>
            ) : null}

            {showBelts ? (
              <g>
                <path d="M 190 145 C 226 160, 250 166, 282 170" fill="none" stroke="#6ee7b7" strokeWidth="4" strokeLinecap="round" />
                <path d="M 390 145 C 354 160, 330 166, 298 170" fill="none" stroke="#6ee7b7" strokeWidth="4" strokeLinecap="round" />
                <path d="M 198 110 C 242 94, 260 96, 282 104" fill="none" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" />
                <path d="M 382 110 C 338 94, 320 96, 298 104" fill="none" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" />
                <text x="290" y="214" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="900">trade winds feed the equatorial low</text>
                <text x="290" y="268" textAnchor="middle" fill="#fcd34d" fontSize="11" fontWeight="900">westerlies and polar easterlies complete the belt map</text>
              </g>
            ) : null}
          </svg>
        </div>

        <div className="flex flex-col justify-between border-t border-white/10 bg-white/5 p-4 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#67e8f9]">{activeStage.eyebrow}</p>
            <h4 className="mt-2 text-xl font-black text-white">{activeStage.label}</h4>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/75">{activeStage.explanation}</p>
            <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-xs font-bold leading-5 text-[#fef08a]">
              {activeStage.proof}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              title={isPlaying ? "Pause animation" : "Play animation"}
              onClick={() => setIsPlaying((current) => !current)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#0369a1] px-3 text-sm font-black text-white transition hover:bg-[#075985]"
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
        {geographyDay5ClimatologyStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day5-climatology-stage-${stage.id}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex(index);
            }}
            className={cn(
              "min-h-14 bg-[#164e63] px-3 py-2 text-left text-xs font-black leading-4 transition",
              index === activeIndex ? "text-[#cffafe]" : "text-white/60 hover:bg-[#075985] hover:text-white",
            )}
          >
            {index + 1}. {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}
