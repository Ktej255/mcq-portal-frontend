"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { geographyDay10MonsoonStages } from "@/lib/upsc/geographyDay10PortalLesson";
import { cn } from "@/lib/utils";

export function GeographyDay10MonsoonVisual() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStage = geographyDay10MonsoonStages[activeIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= geographyDay10MonsoonStages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const isVisible = (stage: (typeof geographyDay10MonsoonStages)[number]["id"]) =>
    geographyDay10MonsoonStages.findIndex((item) => item.id === stage) <= activeIndex;

  return (
    <div
      data-testid="day10-monsoon-visual"
      data-active-stage={activeStage.id}
      className="mb-5 overflow-hidden rounded-lg border border-white/15 bg-[#102736]"
    >
      <div className="grid min-h-[22rem] lg:grid-cols-[1.14fr_0.86fr]">
        <div className="relative overflow-hidden p-3 sm:p-5">
          <svg
            viewBox="0 0 640 370"
            role="img"
            aria-label="Indian monsoon sequence map with thermal contrast, ITCZ shift, southwest branches, phases, and variability"
            className="relative z-10 h-full min-h-[20rem] w-full"
          >
            <path
              d="M252 44 L312 54 L372 52 L432 78 L468 124 L448 166 L428 212 L402 268 L370 330 L340 286 L320 240 L282 216 L252 176 L226 144 L198 122 L184 86 Z"
              fill="#e8f5e9"
              stroke="#bae6fd"
              strokeWidth="5"
              opacity="0.92"
            />

            <g opacity={isVisible("heating") ? 1 : 0.16}>
              <circle cx="388" cy="82" r="32" fill="#f97316" opacity="0.82" />
              <path d="M356 82 L420 82 M388 50 L388 114 M366 60 L410 104 M410 60 L366 104" stroke="#fde68a" strokeWidth="4" strokeLinecap="round" />
              <text x="446" y="62" fill="#fed7aa" fontSize="11" fontWeight="900">SUMMER HEATING</text>
              <text x="446" y="78" fill="#ffedd5" fontSize="9" fontWeight="800">land low pressure strengthens</text>
            </g>

            <g opacity={isVisible("itcz") ? 1 : 0.14}>
              <path d="M112 224 C220 196, 338 192, 520 198" fill="none" stroke="#facc15" strokeWidth="6" strokeDasharray="10 7" />
              <path d="M112 246 C222 228, 354 220, 520 222" fill="none" stroke="#fef08a" strokeWidth="3" strokeDasharray="5 7" opacity="0.62" />
              <text x="112" y="184" fill="#fef08a" fontSize="11" fontWeight="900">ITCZ SHIFTS NORTH</text>
              <text x="112" y="200" fill="#fef9c3" fontSize="9" fontWeight="800">cross-equatorial flow bends toward India</text>
            </g>

            <g opacity={isVisible("branches") ? 1 : 0.14}>
              <path d="M168 324 C204 286, 236 252, 278 214 C294 198, 310 176, 320 152" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
              <path d="M516 286 C482 262, 448 236, 420 204 C396 176, 374 154, 350 136" fill="none" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round" />
              <path d="M278 214 L270 192 L296 202 Z" fill="#38bdf8" />
              <path d="M420 204 L394 200 L410 180 Z" fill="#67e8f9" />
              <text x="80" y="338" fill="#bae6fd" fontSize="10" fontWeight="900">ARABIAN SEA BRANCH</text>
              <text x="452" y="304" fill="#cffafe" fontSize="10" fontWeight="900">BAY BRANCH</text>
              <path d="M250 154 C286 130, 332 120, 384 132" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity="0.7" />
              <text x="284" y="114" fill="#ffffff" fontSize="10" fontWeight="900">RELIEF BARRIER</text>
            </g>

            <g opacity={isVisible("rhythm") ? 1 : 0.14}>
              <circle cx="116" cy="84" r="19" fill="#1d9e75" />
              <circle cx="170" cy="84" r="19" fill="#38bdf8" />
              <circle cx="224" cy="84" r="19" fill="#fbbf24" />
              <circle cx="278" cy="84" r="19" fill="#fb923c" />
              <text x="116" y="88" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">ON</text>
              <text x="170" y="88" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">ACTIVE</text>
              <text x="224" y="88" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">BREAK</text>
              <text x="278" y="88" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">RETREAT</text>
              <text x="104" y="118" fill="#d1fae5" fontSize="10" fontWeight="900">READ THE SEASON AS A MOVING SEQUENCE</text>
            </g>

            <g opacity={isVisible("variability") ? 1 : 0.14}>
              <rect x="458" y="124" width="136" height="82" rx="8" fill="#0f172a" stroke="#fef08a" strokeWidth="3" />
              <text x="474" y="146" fill="#fef08a" fontSize="10" fontWeight="900">VARIABILITY</text>
              <text x="474" y="166" fill="#ffffff" fontSize="9" fontWeight="800">ENSO  IOD  jets</text>
              <text x="474" y="184" fill="#ffffff" fontSize="9" fontWeight="800">ocean  relief  local</text>
              <text x="474" y="198" fill="#fde68a" fontSize="8" fontWeight="900">influence, not one-factor rule</text>
            </g>
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
        {geographyDay10MonsoonStages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            data-testid={`day10-monsoon-stage-${stage.id}`}
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
