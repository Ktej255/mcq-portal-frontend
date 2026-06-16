"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";

import { geographyMapPoints, mapTabs, type MapType } from "@/lib/upsc/optionalGeographyMapping";

const PIN_TONE: Record<MapType, string> = {
  river: "#1d9e75",
  range: "#1a3a2a",
  place: "#2563eb",
  ca: "#ef9f27",
};

export function GeographyMapRoom() {
  const [activeType, setActiveType] = useState<MapType>("river");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const points = useMemo(() => geographyMapPoints.filter((p) => p.type === activeType), [activeType]);
  const selected = useMemo(() => geographyMapPoints.find((p) => p.id === selectedId) ?? null, [selectedId]);
  const newCount = useMemo(() => points.filter((p) => p.isNew).length, [points]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Geography edge</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">Interactive India map</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
          Pick a layer, then click a marker to study it. Map-based questions are among the highest-scoring areas in Geography optional.
        </p>
        {/* Layer sub-tabs */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mapTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActiveType(t.id); setSelectedId(null); }}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${
                activeType === t.id ? "bg-[#1a3a2a] text-white" : "border border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIN_TONE[t.id] }} />
              {t.label}
            </button>
          ))}
        </div>
        {newCount > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#6f4a12]">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#ef9f27]" /> {newCount} newly added location{newCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Map canvas with clickable pins */}
        <div className="relative rounded-lg border border-[#dcd5c7] bg-[#eef6f1] p-2 shadow-sm">
          <div className="relative mx-auto aspect-[6/7] w-full max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/india-map.svg" alt="India map" className="h-full w-full select-none object-contain" draggable={false} />
            {points.map((p) => {
              const isSel = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  title={p.name}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, color: PIN_TONE[p.type] }}
                  className="absolute -translate-x-1/2 -translate-y-full"
                  aria-label={p.name}
                >
                  <span className="relative flex flex-col items-center">
                    {p.isNew && <span className="absolute -top-3 rounded-full bg-[#ef9f27] px-1 text-[7px] font-black uppercase text-white animate-pulse">new</span>}
                    <MapPin className={`h-5 w-5 drop-shadow ${isSel ? "scale-125" : ""} transition`} fill={isSel ? "currentColor" : "white"} strokeWidth={2.5} />
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-center text-[10px] font-semibold text-[#8a8174]">
            Schematic outline (incl. J&amp;K, Ladakh/Aksai Chin, Arunachal). Replace <code>/india-map.svg</code> with the official government-approved map.
          </p>
        </div>

        {/* Side panel: point list + selected detail */}
        <div className="space-y-3">
          {selected ? (
            <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black tracking-tight text-[#13251d]">{selected.name}</p>
                {selected.isNew && <span className="rounded bg-[#ef9f27] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">New</span>}
              </div>
              <p className="mt-1.5 text-xs font-semibold leading-6 text-[#34453b]">{selected.note}</p>
              {selected.pyq && <p className="mt-2 rounded-md bg-white/70 px-2 py-1 text-[11px] font-bold text-[#085041]">PYQ: {selected.pyq}</p>}
            </div>
          ) : (
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 text-xs font-semibold leading-6 text-[#8a8174] shadow-sm">
              Click a marker on the map to see its detail and PYQ linkage.
            </div>
          )}
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-2 shadow-sm">
            {points.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-bold transition ${
                  p.id === selectedId ? "bg-[#1a3a2a] text-white" : "text-[#34453b] hover:bg-[#f2eadc]"
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIN_TONE[p.type] }} />
                <span className="flex-1">{p.name}</span>
                {p.isNew && <span className="rounded bg-[#ef9f27]/20 px-1 text-[8px] font-black uppercase text-[#6f4a12]">new</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diagram bank stays below the map */}
      <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Diagram bank</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">Topic-wise labelled diagrams (and AI-generated handwritten / 3D diagrams) will attach here.</p>
      </div>
    </div>
  );
}
