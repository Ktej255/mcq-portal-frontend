"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay16SettlementsStages } from "@/lib/upsc/geographyDay16PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay16SettlementsVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay16SettlementsStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay16SettlementsStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay16SettlementsStages)[number]["id"]) =>
    geographyDay16SettlementsStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day16-settlements-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#173127]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Settlement geography visual with site, situation, rural form, urban hierarchy, morphology, and classification traps"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path d="M28 274 C144 226, 272 250, 392 210 C478 182, 550 192, 622 154" fill="none" stroke="#38bdf8" strokeWidth="12" strokeLinecap="round" opacity="0.78" />
            <path d="M54 300 C170 256, 292 276, 420 238 C500 214, 570 220, 624 190" fill="none" stroke="#a3e635" strokeWidth="7" strokeLinecap="round" opacity="0.52" />

            <g opacity={isVisible("site") ? 1 : 0.16}>
              <circle cx="178" cy="184" r="54" fill="#0f172a" stroke="#86efac" strokeWidth="4" />
              <circle cx="178" cy="184" r="13" fill="#fbbf24" />
              <path d="M178 168 L178 132" stroke="#fde68a" strokeWidth="4" strokeLinecap="round" />
              <text x="178" y="116" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="900">SITE</text>
              <text x="178" y="206" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">exact ground</text>
              <text x="178" y="222" textAnchor="middle" fill="#bbf7d0" fontSize="9" fontWeight="900">situation = wider links</text>
            </g>

            <g opacity={isVisible("rural") ? 1 : 0.14}>
              <rect x="48" y="42" width="184" height="92" rx="8" fill="#0f172a" stroke="#86efac" strokeWidth="3" />
              <text x="64" y="64" fill="#86efac" fontSize="10" fontWeight="900">RURAL PATTERNS</text>
              <text x="64" y="84" fill="#ffffff" fontSize="9" fontWeight="800">relief water agriculture</text>
              <text x="64" y="102" fill="#ffffff" fontSize="9" fontWeight="800">landholding safety community</text>
              <text x="64" y="122" fill="#fde68a" fontSize="9" fontWeight="900">compact linear dispersed</text>
            </g>

            <g opacity={isVisible("urban") ? 1 : 0.14}>
              <circle cx="354" cy="154" r="24" fill="#1d4ed8" stroke="#bfdbfe" strokeWidth="4" />
              <circle cx="440" cy="122" r="34" fill="#1d4ed8" stroke="#bfdbfe" strokeWidth="4" />
              <circle cx="532" cy="84" r="46" fill="#1d4ed8" stroke="#bfdbfe" strokeWidth="4" />
              <path d="M378 146 L405 134 M472 108 L488 100" stroke="#bfdbfe" strokeWidth="4" strokeDasharray="8 6" />
              <text x="350" y="158" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">TOWN</text>
              <text x="440" y="126" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">CITY</text>
              <text x="532" y="88" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">METRO</text>
              <text x="418" y="190" fill="#dbeafe" fontSize="10" fontWeight="900">URBAN HIERARCHY</text>
            </g>

            <g opacity={isVisible("morphology") ? 1 : 0.14}>
              <path d="M310 284 L402 284" stroke="#fbbf24" strokeWidth="7" strokeLinecap="round" />
              <circle cx="332" cy="284" r="8" fill="#fde68a" />
              <circle cx="354" cy="284" r="8" fill="#fde68a" />
              <circle cx="376" cy="284" r="8" fill="#fde68a" />
              <circle cx="398" cy="284" r="8" fill="#fde68a" />
              <circle cx="490" cy="280" r="10" fill="#fde68a" />
              <path d="M490 280 L458 246 M490 280 L528 246 M490 280 L458 316 M490 280 L528 316" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
              <text x="310" y="330" fill="#fef3c7" fontSize="10" fontWeight="900">MORPHOLOGY: LINEAR / RADIAL / GRID</text>
            </g>

            <g opacity={isVisible("trap") ? 1 : 0.14}>
              <rect x="280" y="38" width="178" height="54" rx="8" fill="#0f172a" stroke="#fb7185" strokeWidth="3" />
              <text x="296" y="60" fill="#fecdd3" fontSize="10" fontWeight="900">CHECK THE CATEGORY</text>
              <text x="296" y="78" fill="#ffffff" fontSize="9" fontWeight="800">site  form  role  hierarchy</text>
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
        {geographyDay16SettlementsStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day16-settlements-stage-${stage.id}`}
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
