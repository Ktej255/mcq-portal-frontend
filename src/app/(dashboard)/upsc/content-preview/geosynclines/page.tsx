"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, GraduationCap, AlertTriangle, Newspaper,
  Target, PenLine, CheckCircle2, Lightbulb, ArrowRight,
  ArrowLeft, Sparkles, Download,
} from "lucide-react";

const TABS = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "ncert", label: "NCERT", icon: GraduationCap },
  { id: "current", label: "Current Affairs", icon: Newspaper },
  { id: "traps", label: "Traps", icon: AlertTriangle },
  { id: "mcq", label: "MCQ Lab", icon: Target },
  { id: "mains", label: "Mains", icon: PenLine },
] as const;
type TabId = (typeof TABS)[number]["id"];

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className="text-[15px] font-medium leading-8 text-[#1f2e26]">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <span key={i} className="font-black text-[#1a3a2a] bg-gradient-to-r from-[#e7f5ee] to-[#d4f0e0] px-1.5 py-0.5 rounded-md">
            {part.slice(2, -2)}
          </span>
        ) : <span key={i}>{part}</span>
      )}
    </p>
  );
}

function Callout({ icon, title, children, tone = "green" }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone?: "green" | "amber" | "blue" }) {
  const colors = { green: "border-[#1d9e75]/30 bg-gradient-to-br from-[#e7f5ee] to-[#f0fdf4]", amber: "border-[#f59e0b]/30 bg-gradient-to-br from-[#fef9ec] to-[#fffbeb]", blue: "border-[#3b82f6]/30 bg-gradient-to-br from-[#eff6ff] to-[#f0f9ff]" };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border ${colors[tone]} p-4 my-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs font-black uppercase tracking-wide text-[#13251d]">{title}</p></div>
      <div className="text-sm font-medium leading-6 text-[#31443a]">{children}</div>
    </motion.div>
  );
}

// ─── SVG Diagram 1: Geosyncline Cross-Section ─────────────────────────────────
function GeosynclineCrossSection() {
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-1">Anatomy of a Geosyncline (Orthogeosyncline)</p>
      <p className="text-[10px] text-center text-[#49675e] mb-3">Two rigid forelands (kratogens) flanking a subsiding sediment-filled trough</p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg viewBox="0 0 560 320" className="w-full min-w-[420px] md:w-96 h-auto shrink-0">
          <defs>
            <linearGradient id="cratonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a6d3b" />
              <stop offset="100%" stopColor="#5c4625" />
            </linearGradient>
            <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7cc4e8" />
              <stop offset="100%" stopColor="#3b82c4" />
            </linearGradient>
            <linearGradient id="mioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4e3b8" />
              <stop offset="100%" stopColor="#d8b878" />
            </linearGradient>
            <linearGradient id="euGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c98f6b" />
              <stop offset="100%" stopColor="#9c5f3e" />
            </linearGradient>
          </defs>

          {/* Sea water layer */}
          <rect x="40" y="70" width="480" height="60" fill="url(#seaGrad)" opacity="0.55" />
          <text x="280" y="62" textAnchor="middle" fill="#1e5f8c" fontSize="10" fontWeight="bold">Marine water (shallow → deep)</text>

          {/* Left foreland / craton */}
          <path d="M40,130 L150,130 L150,250 L40,250 Z" fill="url(#cratonGrad)" />
          <text x="95" y="180" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">FORELAND</text>
          <text x="95" y="194" textAnchor="middle" fill="white" fontSize="8">(Kratogen)</text>
          <text x="95" y="240" textAnchor="middle" fill="#f4e3b8" fontSize="7">Rigid continental mass</text>

          {/* Right foreland / craton */}
          <path d="M520,130 L410,130 L410,250 L520,250 Z" fill="url(#cratonGrad)" />
          <text x="465" y="180" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">FORELAND</text>
          <text x="465" y="194" textAnchor="middle" fill="white" fontSize="8">(Kratogen)</text>

          {/* Miogeosyncline (shelf side, near craton) */}
          <path d="M150,130 L210,130 L235,250 L150,250 Z" fill="url(#mioGrad)" stroke="#b9925a" strokeWidth="0.5" />
          <text x="185" y="205" textAnchor="middle" fill="#5c4625" fontSize="7.5" fontWeight="bold">MIO-</text>
          <text x="185" y="216" textAnchor="middle" fill="#5c4625" fontSize="7.5" fontWeight="bold">geosyncline</text>

          {/* Eugeosyncline (deep, central + volcanic) */}
          <path d="M210,130 L410,130 L385,250 L235,250 Z" fill="url(#euGrad)" stroke="#7a4a2e" strokeWidth="0.5" />
          {/* sediment lamination lines */}
          <path d="M215,160 L405,160" stroke="#e9cda8" strokeWidth="0.8" opacity="0.5" />
          <path d="M222,190 L398,190" stroke="#e9cda8" strokeWidth="0.8" opacity="0.5" />
          <path d="M228,220 L392,220" stroke="#e9cda8" strokeWidth="0.8" opacity="0.5" />
          <text x="310" y="200" textAnchor="middle" fill="#fdeede" fontSize="8" fontWeight="bold">EUGEOSYNCLINE</text>
          <text x="310" y="212" textAnchor="middle" fill="#fdeede" fontSize="7">Deep · volcanic · thick sediments</text>

          {/* Volcano in eugeosyncline */}
          <polygon points="300,130 290,110 310,110" fill="#7a2e1e" />
          <polygon points="300,110 296,102 304,102" fill="#ff6b35" />
          <text x="300" y="98" textAnchor="middle" fill="#7a2e1e" fontSize="7" fontWeight="bold">volcanism</text>

          {/* Subsidence arrows */}
          <line x1="310" y1="255" x2="310" y2="285" stroke="#1a3a2a" strokeWidth="1.5" markerEnd="url(#arrSub)" />
          <line x1="250" y1="255" x2="250" y2="278" stroke="#1a3a2a" strokeWidth="1.2" markerEnd="url(#arrSub)" />
          <line x1="370" y1="255" x2="370" y2="278" stroke="#1a3a2a" strokeWidth="1.2" markerEnd="url(#arrSub)" />
          <text x="310" y="300" textAnchor="middle" fill="#1a3a2a" fontSize="8" fontWeight="bold">Subsidence keeps pace with sedimentation</text>

          {/* Compression arrows from forelands */}
          <line x1="100" y1="100" x2="150" y2="100" stroke="#b91c1c" strokeWidth="2" markerEnd="url(#arrComp)" />
          <line x1="460" y1="100" x2="410" y2="100" stroke="#b91c1c" strokeWidth="2" markerEnd="url(#arrComp)" />
          <text x="120" y="92" textAnchor="middle" fill="#b91c1c" fontSize="7" fontWeight="bold">compression</text>
          <text x="440" y="92" textAnchor="middle" fill="#b91c1c" fontSize="7" fontWeight="bold">compression</text>

          <defs>
            <marker id="arrSub" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#1a3a2a" /></marker>
            <marker id="arrComp" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#b91c1c" /></marker>
          </defs>
        </svg>
        <div className="space-y-2 flex-1">
          {[
            { label: "Miogeosyncline", value: "Shelf side", note: "Shallow water, non-volcanic, sediments derived from the adjacent craton" },
            { label: "Eugeosyncline", value: "Ocean side", note: "Deep water, volcanic (ophiolites, greywacke), far from the craton" },
            { label: "Subsidence", value: "Continuous", note: "Trough sinks as sediments load it — Hall's key insight (1859)" },
            { label: "Forelands", value: "Kratogens", note: "Rigid masses on either side that later compress the trough (Kober)" },
            { label: "Outcome", value: "Fold Mountains", note: "Compression + uplift converts sediments into orogenic belts" },
          ].map((f, i) => (
            <div key={i} className="rounded-lg bg-white/70 border border-[#b9d9cd] px-3 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-[#1a3a2a]">{f.label}</span>
                <span className="text-[10px] font-black text-[#1d9e75] shrink-0">{f.value}</span>
              </div>
              <p className="text-[10px] text-[#5d675f]">{f.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SVG Diagram 2: Geosynclinal Orogenic Cycle ───────────────────────────────
function OrogenicCycleDiagram() {
  const stages = [
    {
      title: "1. Lithogenesis",
      sub: "Sedimentation + Subsidence",
      desc: "Thick sediments accumulate in the subsiding trough over millions of years (e.g. Tethys).",
      color: "#3b82c4",
    },
    {
      title: "2. Orogenesis",
      sub: "Compression + Folding",
      desc: "Forelands converge; sediments are squeezed, folded and faulted. Flysch deposits form.",
      color: "#b45309",
    },
    {
      title: "3. Gliptogenesis",
      sub: "Uplift + Denudation",
      desc: "Folded sediments are uplifted into fold mountains; erosion sheds molasse into foredeeps.",
      color: "#1a5c32",
    },
  ];
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-3">The Geosynclinal (Orogenic) Cycle — Tethys → Himalayas</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stages.map((s, i) => (
          <div key={i} className="relative rounded-xl bg-white/75 border border-[#b9d9cd] p-3">
            <svg viewBox="0 0 160 90" className="w-full h-24">
              {i === 0 && (
                <>
                  <rect x="0" y="20" width="160" height="30" fill="#7cc4e8" opacity="0.5" />
                  <path d="M0,50 Q80,80 160,50 L160,90 L0,90 Z" fill="#d8b878" />
                  <path d="M0,58 Q80,82 160,58" stroke="#b9925a" strokeWidth="1" fill="none" opacity="0.7" />
                  <path d="M0,68 Q80,88 160,68" stroke="#b9925a" strokeWidth="1" fill="none" opacity="0.7" />
                  <line x1="80" y1="52" x2="80" y2="78" stroke="#1a3a2a" strokeWidth="1.2" markerEnd="url(#oc1)" />
                  <text x="80" y="16" textAnchor="middle" fill="#1e5f8c" fontSize="8" fontWeight="bold">Tethys Sea</text>
                </>
              )}
              {i === 1 && (
                <>
                  <path d="M0,55 C30,55 40,40 55,40 C70,40 75,55 90,50 C105,45 110,38 125,42 C140,46 150,55 160,55 L160,90 L0,90 Z" fill="#c98f6b" />
                  <path d="M30,55 C45,45 55,48 65,42" stroke="#7a4a2e" strokeWidth="1" fill="none" />
                  <path d="M95,50 C108,44 115,46 125,43" stroke="#7a4a2e" strokeWidth="1" fill="none" />
                  <line x1="8" y1="30" x2="35" y2="30" stroke="#b91c1c" strokeWidth="2" markerEnd="url(#oc2)" />
                  <line x1="152" y1="30" x2="125" y2="30" stroke="#b91c1c" strokeWidth="2" markerEnd="url(#oc2)" />
                </>
              )}
              {i === 2 && (
                <>
                  <polygon points="40,80 70,25 95,80" fill="#1a5c32" />
                  <polygon points="80,80 110,15 140,80" fill="#0e3a1e" />
                  <polygon points="70,25 78,38 62,38" fill="white" opacity="0.85" />
                  <polygon points="110,15 119,30 101,30" fill="white" opacity="0.9" />
                  <rect x="0" y="80" width="160" height="10" fill="#d8b878" />
                  <text x="20" y="88" textAnchor="middle" fill="#5c4625" fontSize="6.5">molasse</text>
                </>
              )}
              <defs>
                <marker id="oc1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#1a3a2a" /></marker>
                <marker id="oc2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#b91c1c" /></marker>
              </defs>
            </svg>
            <p className="mt-1 text-[11px] font-black" style={{ color: s.color }}>{s.title}</p>
            <p className="text-[9px] font-black uppercase text-[#085041]">{s.sub}</p>
            <p className="mt-0.5 text-[10px] text-[#5d675f] leading-4">{s.desc}</p>
            {i < 2 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 h-4 w-4 text-[#1d9e75]" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────────────────────
function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="In Topic 2.3, paleomagnetism gave us the decisive proof for continental drift. But long before plate tectonics, geologists had already noticed that the world&apos;s great fold mountains were built from impossibly thick piles of marine sediment. The **geosynclinal theory** was the dominant 19th–20th century explanation for how oceans become mountains — and understanding it is essential to appreciate why plate tectonics was such a revolution." />

      {/* Definition & origin */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📚 What Is a Geosyncline?</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="A **geosyncline** is a large, elongated, **subsiding trough** in the Earth&apos;s crust that accumulates a great thickness of sediment over geological time, later compressed and uplifted into **fold mountains**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**James Hall (1859)** made the founding observation: folded Appalachian strata were up to **12 km thick** — far thicker than the flat-lying rocks of the continental interior. He inferred the trough must have **subsided** as sediment piled in." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**James Dwight Dana (1873)** formalized the idea and **coined the term &apos;geosyncline&apos;**, adding that prolonged subsidence is followed by compression and **mountain building (orogeny)**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Émile Haug** (France) viewed geosynclines as deep, narrow marine furrows lying **between two rigid continental masses (forelands)** — the source of mountain ranges." /></li>
        </ul>
      </div>

      <GeosynclineCrossSection />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Geosynclinal theory & orogenesis — UPSC Mains GS-1 2016 (20 marks)
        </span>
      </div>

      {/* Types */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🗂️ Classification — Miogeosyncline vs Eugeosyncline</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Hans Stille** divided the main mountain-building **orthogeosyncline** into two belts based on position and volcanism." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Miogeosyncline** — on the **shelf/craton side**: shallow water, **non-volcanic**, fed by sediments from the adjacent continent (sandstone, limestone, shale)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Eugeosyncline** — on the **oceanward side**: deep water, **volcanic** (lavas, ophiolites, greywacke), far from the continent." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Marshall Kay (1951)** produced the most detailed taxonomy — orthogeosyncline, **parageosyncline**, exogeosyncline, autogeosyncline, zeugogeosyncline — terms now largely obsolete but historically important." /></li>
        </ul>
      </div>

      {/* Kober */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">⛰️ Kober&apos;s Orogen–Kratogen Theory</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Leopold Kober (1921)** built a complete mountain-building model around geosynclines. He called the mobile sedimentary belt the **&apos;orogen&apos;** and the rigid bordering masses the **&apos;kratogen&apos; (forelands)**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="The forelands act as **compressive jaws**: as they move toward each other, the geosynclinal sediments of the orogen are **folded, faulted and uplifted** into mountains." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Kober applied this to the **Tethys orogen**, squeezed between **Angaraland (Laurasia)** in the north and **Gondwanaland** in the south — producing the **Alpine–Himalayan mountain chain**." /></li>
        </ul>
      </div>

      <OrogenicCycleDiagram />

      {/* Geosynclinal cycle */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔁 The Geosynclinal (Orogenic) Cycle</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Lithogenesis** — sedimentation and subsidence: the trough fills with thick sediment over tens of millions of years." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Orogenesis** — compression, folding and faulting as forelands converge. Deep-marine **flysch** (greywacke, turbidites) is deposited as the mountains begin to rise." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Gliptogenesis** — uplift and denudation: the new mountains erode rapidly, shedding coarse continental **molasse** into adjacent foredeeps (e.g. the **Siwalik** molasse of the Himalayan foreland)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Flysch = synorogenic (during) · Molasse = post-orogenic (after)** — a classic UPSC distinction." /></li>
        </ul>
      </div>

      {/* Tethys & India */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🇮🇳 The Tethys Geosyncline & the Himalayas</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="The **Tethys Geosyncline** lay between the Indian (Gondwana) and Eurasian (Angara) landmasses. For over 100 million years it accumulated thick marine sediments." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="As India drifted north and collided with Asia, these Tethyan sediments were compressed and uplifted to form the **Himalayas** — the textbook example of a geosyncline becoming a mountain belt." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Marine fossils (ammonites, nummulites) found at high Himalayan altitudes** are direct field proof that this terrain was once a sea floor — an observation any UPSC answer should cite." /></li>
        </ul>
      </div>

      {/* Plate tectonics reinterpretation */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🧩 How Plate Tectonics Reinterpreted Geosynclines</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Geosynclinal theory correctly described **WHAT** happens (thick sediments → fold mountains) but could not convincingly explain **WHY** the forelands moved — it **lacked a mechanism** for the compressive force." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Plate tectonics (1960s)** supplied the missing engine — mantle convection driving subduction and collision. The old terms were re-mapped: **miogeosyncline ≈ passive continental margin**, **eugeosyncline ≈ accretionary wedge / island-arc at a subduction zone**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Geosynclinal theory was therefore **superseded, not simply discarded** — its observations survive inside the modern plate-tectonic framework." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight — Why This Topic Still Matters" tone="amber">
        Geosynclinal theory is a model case of how science progresses: a correct pattern (sediment thickness → orogeny) waited decades for the right mechanism (plate convergence). UPSC loves this &apos;evolution of geographic thought&apos; angle — examiners want you to evaluate the theory critically, not just describe it.
      </Callout>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="Forward — What Comes Next" tone="blue">
        Mountain roots, subsidence and uplift raise an obvious question: how does the crust stay in balance as loads form and erode? That is exactly the subject of Topic 2.5 — Isostasy, where the Airy and Pratt models explain crustal equilibrium.
      </Callout>
    </motion.div>
  );
}

// ─── NCERT Tab ────────────────────────────────────────────────────────────────
function NcertTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {[
        {
          cls: "Class 11 — Fundamentals of Physical Geography, Chapter 4",
          pages: "Distribution of Oceans and Continents",
          points: [
            "NCERT introduces the **Tethys Sea** as the ancient water body between Angaraland (Laurasia) and Gondwanaland whose sediments were uplifted to form the **Alpine–Himalayan ranges**.",
            "The chapter frames geosynclines as the **pre-plate-tectonics** explanation for fold mountains — correctly identifying the sediment–mountain link without the convergence mechanism.",
            "Connects directly to the **continental drift → plate tectonics** narrative: a key reason NCERT places this within the same chapter sequence.",
            "UPSC source line: &apos;mountains were formed from sediments deposited in long, narrow seas&apos; — the essence of the geosynclinal idea.",
          ],
        },
        {
          cls: "Class 11 — India: Physical Environment, Chapter 2",
          pages: "Structure and Physiography (Himalayan origin)",
          points: [
            "**Marine fossils at high Himalayan altitudes** are cited as evidence that the Himalayas rose from the floor of the Tethys — the most quotable Indian example for this topic.",
            "Describes the northward drift of the **Indian Plate** and compression of Tethyan sediments — the geosyncline-to-orogen story applied to India.",
            "Introduces the **Siwaliks** as the youngest, outermost Himalayan belt built of eroded mountain debris (molasse) — links to the gliptogenesis stage.",
          ],
        },
        {
          cls: "Class 11 — Fundamentals of Physical Geography, Chapter 6",
          pages: "Geomorphic Processes (Endogenic)",
          points: [
            "**Orogenic (mountain-building) movements** are explained as horizontal compressive forces producing folding and faulting — the deformation that converts geosynclinal fill into mountains.",
            "Distinguishes **orogeny** (mountain building, localized, intense folding) from **epeirogeny** (broad continental upliftment) — a precise NCERT distinction UPSC tests.",
            "Provides the process vocabulary (folding, faulting, warping) needed to describe the orogenic phase of the geosynclinal cycle.",
          ],
        },
      ].map((c, i) => (
        <div key={i} className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 {c.cls}</p>
          <p className="mt-0.5 text-xs font-semibold text-[#92400e]">{c.pages}</p>
          <ul className="mt-3 space-y-2 pl-1">
            {c.points.map((pt, j) => (
              <li key={j} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" /><RichText text={pt} /></li>
            ))}
          </ul>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────
function CurrentTab() {
  const events = [
    {
      tag: "🇮🇳 India",
      title: "Himalayan Ammonite Fossils & the Tethys Record",
      text: "Ongoing geological surveys in **Spiti and Ladakh** continue to document **marine fossils (ammonites, belemnites, nummulites)** preserved in high-altitude Himalayan strata. These &apos;shaligram&apos; fossils — found above **4,000 m** — are the field evidence that the Himalayas were built from the floor of the **Tethys**, exactly as geosynclinal theory predicted. UPSC has linked fossil evidence to mountain origin in both prelims and mains.",
    },
    {
      tag: "🌍 Science",
      title: "Ophiolites — Fragments of Ancient Ocean Floor",
      text: "The **Indus–Tsangpo Suture Zone** in the Himalayas preserves **ophiolite belts** — slices of oceanic crust and mantle thrust onto land during the India–Asia collision. Modern research treats ophiolites as the relics of the old **eugeosyncline** (deep, volcanic belt). They mark the exact line where the Tethys Ocean closed, translating a 19th-century concept into hard plate-tectonic evidence.",
    },
    {
      tag: "🌍 Science",
      title: "Living Geosyncline — The Bay of Bengal Fan",
      text: "The **Bengal Fan**, the world&apos;s largest submarine fan, is accumulating kilometres of Himalayan-derived sediment off the Indian coast. Geologists describe it as a **modern analogue of a developing geosyncline / passive-margin sediment prism**. International Ocean Discovery Program (IODP) drilling here studies how such thick sediment wedges may, over tens of millions of years, become tomorrow&apos;s fold mountains.",
    },
    {
      tag: "🌍 Geo-thought",
      title: "From Geosynclines to Plate Tectonics — A Paradigm Case",
      text: "Geosynclinal theory is increasingly taught as a **case study in the philosophy of science** — a robust descriptive model that was **superseded** when plate tectonics supplied the missing mechanism. This &apos;evolution of geographic thought&apos; theme appears in UPSC Mains GS-1 and in optional Geography Paper-I, where candidates are asked to **critically evaluate** rather than merely describe older theories.",
    },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {events.map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-[#a5f3fc] bg-gradient-to-br from-[#ecfeff] to-[#f0f9ff] p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#0369a1]/10 px-2 py-0.5 text-[9px] font-black text-[#0369a1]">{e.tag}</span>
            <p className="text-sm font-black text-[#13251d]">{e.title}</p>
          </div>
          <RichText text={e.text} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Traps Tab ────────────────────────────────────────────────────────────────
function TrapsTab() {
  const traps = [
    {
      wrong: "'Dana was the first to observe geosynclines'",
      right: "James Hall (1859) made the founding observation of abnormally thick folded Appalachian sediments. James Dana (1873) coined the term 'geosyncline' and added the subsidence-then-orogeny concept. Hall observed, Dana named — don't swap them.",
    },
    {
      wrong: "'Miogeosyncline is the deep, volcanic belt'",
      right: "It is the OPPOSITE. The MIOgeosyncline is the shallow, NON-volcanic belt on the shelf/craton side. The EUgeosyncline is the deep, VOLCANIC belt on the oceanward side. Memory anchor: 'Eu = Ocean = Eruptions (volcanic)'.",
    },
    {
      wrong: "'Flysch is deposited after the mountains have fully formed'",
      right: "Flysch is SYNOROGENIC — deposited DURING active compression as the mountains begin to rise (deep-marine greywacke/turbidites). MOLASSE is the POST-orogenic deposit, shed by erosion AFTER uplift (e.g. the Siwaliks). Flysch = during, Molasse = after.",
    },
    {
      wrong: "'Geosynclinal theory explained the force that builds mountains'",
      right: "It did NOT. Its fatal weakness was the absence of a convincing mechanism for the compressive force. It described the pattern correctly but could not explain why forelands converge. Plate tectonics later supplied that mechanism (subduction and collision).",
    },
    {
      wrong: "'Plate tectonics completely discarded geosynclinal observations as wrong'",
      right: "Plate tectonics SUPERSEDED but RE-INTERPRETED them. Miogeosyncline ≈ passive continental margin; eugeosyncline ≈ accretionary wedge/island arc at a subduction zone. The observations were valid; only the explanation changed.",
    },
    {
      wrong: "'Kober called the rigid forelands the orogen'",
      right: "Reversed. In Kober's model the rigid bordering masses are the KRATOGEN (forelands); the mobile sedimentary belt squeezed between them is the OROGEN. The orogen becomes the mountain belt; the kratogens do the squeezing.",
    },
    {
      wrong: "'The Himalayas formed from the Tethys eugeosyncline alone'",
      right: "The Himalayas record the closure of the Tethys with BOTH shelf (mio) and deep (eu) facies, plus ophiolites marking the suture. Marine fossils at high altitude prove the marine origin — but the belt is the product of full collision, not one geosynclinal belt in isolation.",
    },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {traps.map((t, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white p-4 flex gap-3">
          <div className="shrink-0 mt-1 h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-black text-red-800 line-through decoration-red-300">{t.wrong}</p>
            <p className="mt-1.5 text-sm font-semibold text-[#085041]">✓ {t.right}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── MCQ Lab ──────────────────────────────────────────────────────────────────
function McqTab() {
  const questions = [
    // TYPE 1: MULTI-STATEMENT (3 questions)
    {
      id: 1, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about the geosynclinal theory:",
      stmts: [
        "A geosyncline is a large, elongated, subsiding trough that accumulates a great thickness of sediment.",
        "James Hall observed that folded Appalachian sediments were far thicker than the flat-lying rocks of the continental interior.",
        "James Dana coined the term 'geosyncline'.",
        "The theory successfully explained the force responsible for compressing the sediments into mountains.",
      ],
      opts: ["1, 2 and 3 only", "1 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT. Statement 4 is WRONG — the chief weakness of geosynclinal theory was precisely that it could NOT explain the compressive force/mechanism. That gap was filled later by plate tectonics (mantle convection, subduction, collision).",
    },
    {
      id: 2, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about the two belts of an orthogeosyncline:",
      stmts: [
        "The miogeosyncline lies on the shelf/craton side and is non-volcanic.",
        "The eugeosyncline lies on the oceanward side and is associated with volcanic activity.",
        "The miogeosyncline accumulates deep-water sediments far from any continent.",
        "Hans Stille contributed to this two-fold classification.",
      ],
      opts: ["1, 2 and 4 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 4 are CORRECT. Statement 3 is WRONG — deep-water sediments far from the continent characterise the EUgeosyncline, not the miogeosyncline. The miogeosyncline is the shallow, non-volcanic shelf belt fed by the adjacent craton.",
    },
    {
      id: 3, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about the Tethys Geosyncline:",
      stmts: [
        "It lay between the Angara (Laurasian) and Gondwana landmasses.",
        "Its sediments were uplifted to form the Alpine–Himalayan mountain system.",
        "Marine fossils found at high Himalayan altitudes support its former marine character.",
        "It is still an active deep ocean basin today.",
      ],
      opts: ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 3 and 4 only"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT. Statement 4 is WRONG — the Tethys has CLOSED; it no longer exists as an ocean. Its sediments were folded and uplifted into the Alpine–Himalayan ranges, and the Indus–Tsangpo suture zone marks where the ocean disappeared.",
    },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    {
      id: 4, type: "HOW MANY CORRECT",
      stem: "How many of the following pairs (scholar — contribution) are correctly matched?",
      stmts: [
        "James Hall — first observation of thick folded geosynclinal sediments (1859)",
        "James Dana — coined the term 'geosyncline' (1873)",
        "Leopold Kober — orogen–kratogen (foreland) theory of mountain building",
        "Marshall Kay — detailed classification of geosynclines (1951)",
      ],
      opts: ["Only two", "Only three", "All four", "Only one"],
      correct: 2,
      explain: "All four pairs are correctly matched. Hall observed (1859), Dana named it (1873), Kober built the orogen–kratogen model (1921), and Kay gave the detailed taxonomy (1951). These four are the standard names associated with the theory.",
    },
    {
      id: 5, type: "HOW MANY CORRECT",
      stem: "How many of the following are correct statements about flysch and molasse deposits?",
      stmts: [
        "Flysch is a synorogenic deposit formed during active compression.",
        "Molasse is a post-orogenic deposit shed by erosion after uplift.",
        "The Siwaliks of the Himalayan foreland are an example of molasse.",
        "Flysch typically consists of coarse continental conglomerates laid down on land.",
      ],
      opts: ["Only one", "Only two", "Only three", "All four"],
      correct: 2,
      explain: "Statements 1, 2, 3 are correct (three). Statement 4 is WRONG — coarse CONTINENTAL conglomerates describe MOLASSE. Flysch is typically fine, deep-marine greywacke/turbidite deposited DURING orogeny. So three statements are correct.",
    },
    // TYPE 3: ASSERTION-REASON (2 questions)
    {
      id: 6, type: "ASSERTION-REASON",
      stem: "Assertion (A): Geosynclinal theory was eventually superseded by the theory of plate tectonics.\n\nReason (R): Geosynclinal theory could not satisfactorily explain the mechanism of the compressive forces required to build fold mountains.",
      stmts: [],
      opts: [
        "Both A and R true and R is the correct explanation of A",
        "Both A and R true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explain: "Both A and R are true and R correctly explains A. Geosynclinal theory described the sediment-to-mountain pattern accurately but had no convincing mechanism for the compression. Plate tectonics supplied that mechanism (subduction and collision driven by mantle convection), and so superseded the older theory.",
    },
    {
      id: 7, type: "ASSERTION-REASON",
      stem: "Assertion (A): The eugeosyncline is associated with volcanic rocks while the miogeosyncline is not.\n\nReason (R): The eugeosyncline develops on the oceanward side, far from the continent, where volcanic activity occurs, whereas the miogeosyncline develops on the shallow shelf adjacent to the craton.",
      stmts: [],
      opts: [
        "Both A and R true and R is the correct explanation of A",
        "Both A and R true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explain: "Both A and R are true and R is the correct explanation. The eugeosyncline's oceanward, deep-water setting (in modern terms an island-arc/accretionary-wedge zone) is exactly where volcanism occurs, while the miogeosyncline's shallow shelf position next to the craton is non-volcanic.",
    },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    {
      id: 8, type: "NOT / EXCEPTION",
      stem: "Which of the following statements about geosynclines is NOT correct?",
      stmts: [],
      opts: [
        "A geosyncline subsides as sediments accumulate within it.",
        "The miogeosyncline is the deep, volcanic belt of an orthogeosyncline.",
        "Marine fossils in the high Himalayas indicate a former marine (Tethyan) environment.",
        "Geosynclinal sediments are compressed and uplifted into fold mountains.",
      ],
      correct: 1,
      explain: "Option (b) is NOT correct. The miogeosyncline is the SHALLOW, NON-VOLCANIC belt on the shelf side. The deep, volcanic belt is the EUgeosyncline. The other three statements are accurate descriptions of geosynclinal theory.",
    },
    {
      id: 9, type: "NOT / EXCEPTION",
      stem: "In Kober's orogen–kratogen model, which of the following is NOT correctly described?",
      stmts: [],
      opts: [
        "The kratogens are rigid forelands bordering the mobile belt.",
        "The orogen is the mobile sedimentary belt that is compressed into mountains.",
        "The kratogens move toward each other, compressing the orogen.",
        "The orogen is a rigid mass that resists deformation.",
      ],
      correct: 3,
      explain: "Option (d) is NOT correct. The orogen is the MOBILE (deformable) belt that gets folded into mountains — not a rigid mass. The rigid masses are the kratogens (forelands). The other three statements correctly describe Kober's model.",
    },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    {
      id: 10, type: "SCENARIO / APPLIED",
      stem: "A field geologist climbing in the Spiti Himalaya at over 4,000 m altitude collects fossil ammonites (marine cephalopods) embedded in the rock. Which conclusion is best supported by this observation in the context of geosynclinal theory?",
      stmts: [],
      opts: [
        "The rocks were deposited on a continental shelf that never subsided.",
        "The strata accumulated on the floor of the Tethys before being uplifted into mountains.",
        "The fossils were carried up by glaciers from the plains below.",
        "The region has always been a high mountain since the Hadean Eon.",
      ],
      correct: 1,
      explain: "Marine ammonites at high altitude indicate the rock formed on a SEA FLOOR — the Tethys Geosyncline — and was subsequently compressed and uplifted into the Himalayas. This is the classic field evidence linking geosynclinal theory to Himalayan origin. Glacial transport (c) cannot embed fossils within bedrock strata.",
    },
    {
      id: 11, type: "SCENARIO / APPLIED",
      stem: "A sedimentary basin shows the following vertical sequence from bottom to top: thick shallow-marine shelf sediments, then deep-marine greywacke/turbidites (flysch), then coarse continental conglomerates (molasse). What history does this sequence most likely record?",
      stmts: [],
      opts: [
        "A continuously shallowing lagoon with no tectonic activity",
        "A full geosynclinal cycle: sedimentation → compression (synorogenic flysch) → uplift and erosion (post-orogenic molasse)",
        "Repeated marine transgressions with no mountain building",
        "Deposition entirely after the mountains had eroded flat",
      ],
      correct: 1,
      explain: "The sequence shelf sediments → flysch → molasse is the signature of a complete orogenic cycle. Shelf deposits represent lithogenesis, flysch is synorogenic (during compression), and molasse is post-orogenic (shed by the rising/eroding mountains). This is the geosynclinal cycle read directly from the rock column.",
    },
    {
      id: 12, type: "SCENARIO / APPLIED",
      stem: "A modern oceanographer studying the Bengal Fan off India's coast notes kilometres of Himalayan-derived sediment accumulating on a slowly subsiding margin. Why is this described as a possible 'geosyncline in the making'?",
      stmts: [],
      opts: [
        "Because it is a deep ocean trench actively subducting crust",
        "Because thick sediment is accumulating on a subsiding margin that could, over tens of millions of years, be compressed into mountains",
        "Because volcanic eruptions are building new islands there",
        "Because the fan is rising rapidly to form a plateau",
      ],
      correct: 1,
      explain: "The Bengal Fan is a thick sediment prism on a subsiding passive margin — exactly the lithogenesis stage of a developing geosyncline (in modern terms, a passive-margin sediment wedge). If future plate convergence compresses it, it could become a fold-mountain belt. It is not a subduction trench or a volcanic arc.",
    },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    {
      id: 13, type: "MATCH THE PAIRS",
      stem: "Match the scholar with the contribution:\n\n1. James Hall\n2. James Dana\n3. Leopold Kober\n4. Émile Haug\n\nP. Coined the term 'geosyncline' (1873)\nQ. First observed abnormally thick folded sediments in the Appalachians (1859)\nR. Viewed geosynclines as deep marine furrows between rigid continental masses\nS. Orogen–kratogen (foreland) theory of mountain building",
      stmts: [],
      opts: ["1-Q, 2-P, 3-S, 4-R", "1-P, 2-Q, 3-R, 4-S", "1-Q, 2-P, 3-R, 4-S", "1-R, 2-P, 3-S, 4-Q"],
      correct: 0,
      explain: "1-Q: Hall first observed thick Appalachian sediments (1859). 2-P: Dana coined 'geosyncline' (1873). 3-S: Kober gave the orogen–kratogen theory. 4-R: Haug viewed geosynclines as deep marine furrows between rigid masses. The correct option is 1-Q, 2-P, 3-S, 4-R.",
    },
    {
      id: 14, type: "MATCH THE PAIRS",
      stem: "Match the term with its description:\n\n1. Miogeosyncline\n2. Eugeosyncline\n3. Flysch\n4. Molasse\n\nP. Deep, volcanic belt on the oceanward side\nQ. Shallow, non-volcanic belt on the shelf/craton side\nR. Post-orogenic coarse continental deposit (e.g. Siwaliks)\nS. Synorogenic deep-marine deposit formed during compression",
      stmts: [],
      opts: ["1-Q, 2-P, 3-S, 4-R", "1-P, 2-Q, 3-R, 4-S", "1-Q, 2-P, 3-R, 4-S", "1-P, 2-Q, 3-S, 4-R"],
      correct: 0,
      explain: "1-Q: Miogeosyncline = shallow, non-volcanic shelf belt. 2-P: Eugeosyncline = deep, volcanic oceanward belt. 3-S: Flysch = synorogenic deep-marine deposit (during compression). 4-R: Molasse = post-orogenic coarse continental deposit (e.g. Siwaliks). Correct option: 1-Q, 2-P, 3-S, 4-R.",
    },
    // TYPE 7: DIRECT RECALL (1 question)
    {
      id: 15, type: "DIRECT RECALL",
      stem: "The ancient geosyncline whose sediments were compressed and uplifted to form the Alpine–Himalayan mountain system is the:",
      stmts: [],
      opts: ["Panthalassa Geosyncline", "Tethys Geosyncline", "Iapetus Geosyncline", "Rheic Geosyncline"],
      correct: 1,
      explain: "The Tethys Geosyncline (between Angaraland and Gondwanaland) is the source of the Alpine–Himalayan ranges. Panthalassa was the world ocean surrounding Pangaea; Iapetus and Rheic were older oceans associated with the Appalachian/Caledonian orogenies — distractors here.",
    },
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = submitted ? questions.filter(q => answers[q.id] === q.correct).length : 0;

  if (submitted) return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
      <div className="rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[#085041]">Your Score</p>
          <p className="text-3xl font-black text-[#13251d]">{score}/{questions.length}</p>
          <p className="text-xs font-semibold text-[#49675e] mt-1">Accuracy: {Math.round((score / questions.length) * 100)}%</p>
        </div>
        <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-black text-xl ${score >= 12 ? "bg-[#1d9e75]" : score >= 8 ? "bg-[#f59e0b]" : "bg-red-500"}`}>
          {Math.round((score / questions.length) * 100)}%
        </div>
      </div>
      {questions.map((q, qi) => (
        <div key={q.id} className={`rounded-xl border p-4 ${answers[q.id] === q.correct ? "border-[#b9d9cd] bg-[#f0fdf4]" : "border-red-200 bg-red-50/50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-[#1a3a2a]/10 px-2 py-0.5 text-[8px] font-black text-[#1a3a2a]">{q.type}</span>
            <span className="text-xs font-bold text-[#5d675f]">Q{qi + 1}</span>
          </div>
          <p className="text-xs font-semibold text-[#31443a] whitespace-pre-line">{q.stem.slice(0, 100)}...</p>
          <p className="mt-1 text-xs font-semibold">
            {answers[q.id] === q.correct
              ? <span className="text-[#1d9e75]">✓ Correct</span>
              : <span className="text-red-600">✗ Wrong — Correct: ({String.fromCharCode(97 + q.correct)})</span>}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#49675e] leading-5">{q.explain}</p>
        </div>
      ))}
      <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="text-sm font-black text-[#1d9e75] underline">Retry All</button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <p className="text-xs font-black uppercase text-[#085041]">15 Practice MCQs — All 7 UPSC Types • Answer all, then submit</p>
      {questions.map((q, qi) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.03 }}
          className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-2.5 py-0.5 text-[8px] font-black text-white">{q.type}</span>
            <span className="text-[10px] font-black text-[#5d675f]">Q{qi + 1}</span>
          </div>
          <p className="text-sm font-black text-[#13251d] leading-6 whitespace-pre-line">{q.stem}</p>
          {q.stmts.length > 0 && (
            <ol className="mt-2 space-y-1 pl-5">
              {q.stmts.map((s, i) => <li key={i} className="text-xs font-semibold text-[#31443a] list-decimal leading-5">{s}</li>)}
            </ol>
          )}
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            {q.opts.map((opt, oi) => (
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: oi }))}
                className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all duration-150 ${answers[q.id] === oi ? "border-[#1a3a2a] bg-[#e7f5ee] shadow-sm" : "border-[#e8e2d5] hover:border-[#1d9e75]/30"}`}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#dcd5c7] bg-white text-[9px] font-black">{String.fromCharCode(97 + oi)}</span>
                <span className="text-xs font-semibold text-[#13251d] leading-5">{opt}</span>
              </button>
            ))}
          </div>
        </motion.div>
      ))}
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setSubmitted(true)}
        disabled={Object.keys(answers).length < questions.length}
        className="w-full rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] py-4 text-sm font-black text-white shadow-lg disabled:opacity-40">
        Submit All ({Object.keys(answers).length}/15 answered)
      </motion.button>
    </motion.div>
  );
}

// ─── Mains Tab ────────────────────────────────────────────────────────────────
function MainsTab() {
  const [activeQ, setActiveQ] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, { intro: string; body: string; conclusion: string }>>({
    0: { intro: "", body: "", conclusion: "" },
    1: { intro: "", body: "", conclusion: "" },
  });
  const [evaluating, setEvaluating] = useState(false);
  const questions = [
    {
      id: 0, paper: "GS-1 • 2016", marks: "20 Marks • 250 Words",
      text: "Critically examine the geosynclinal theory. How has plate tectonics modified our understanding of orogenesis (mountain building)?",
      framework: [
        "Intro: Define geosyncline — a large subsiding trough of thick sediment (Hall 1859 observation, Dana 1873 coinage) that is compressed into fold mountains",
        "Body: Mechanism as theorised — subsidence + sedimentation → compression by converging forelands (Kober's orogen–kratogen) → uplift; cite mio/eugeosyncline and the flysch–molasse cycle",
        "Body: Strengths — correctly linked thick marine sediments to fold mountains; Tethys → Himalayas with marine fossils at altitude as proof",
        "Body: Critical weakness — NO convincing mechanism for the compressive force; could explain the pattern but not the engine",
        "Body: Plate tectonics modification — mantle convection drives subduction/collision; miogeosyncline ≈ passive margin, eugeosyncline ≈ accretionary wedge/island arc; ophiolites and suture zones mark closed oceans",
        "Conclusion: Geosynclinal theory was superseded, not discarded — its observations live on inside plate tectonics; a model case of scientific progress from description to mechanism",
      ],
    },
    {
      id: 1, paper: "GS-1", marks: "15 Marks • 250 Words",
      text: "Explain the geosynclinal cycle with reference to the formation of the Himalayas. Why are marine fossils found at high altitudes in the Himalayas?",
      framework: [
        "Intro: The geosynclinal cycle = lithogenesis → orogenesis → gliptogenesis; introduce the Tethys Geosyncline between Angara and Gondwana",
        "Body: Lithogenesis — over 100 Ma of marine sedimentation in the subsiding Tethys as India drifted north",
        "Body: Orogenesis — India–Asia collision compresses Tethyan sediments; synorogenic flysch deposited as ranges rise",
        "Body: Gliptogenesis — uplift and rapid erosion; molasse (Siwaliks) shed into the Himalayan foredeep",
        "Body: Marine fossils (ammonites, nummulites) at >4,000 m prove the strata formed on the Tethys sea floor before uplift — direct field evidence",
        "Conclusion: The Himalayas are the classic textbook geosyncline-to-orogen example; modern plate tectonics frames it as continent–continent collision closing the Tethys",
      ],
    },
  ];
  const q = questions[activeQ];
  const draft = drafts[activeQ];
  const wordCount = (draft.intro + " " + draft.body + " " + draft.conclusion).trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex gap-2">
        {questions.map((mq, i) => (
          <button key={mq.id} onClick={() => setActiveQ(i)}
            className={`rounded-lg px-3 py-2 text-xs font-black transition ${activeQ === i ? "bg-gradient-to-r from-[#0f766e] to-[#1d9e75] text-white shadow-md" : "bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]"}`}>
            {mq.paper}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-[#99f6e4] bg-gradient-to-br from-[#f0fdfa] to-white p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-[#0f766e]/10 px-2 py-0.5 text-[9px] font-black text-[#0f766e]">{q.paper}</span>
          <span className="text-[9px] font-black text-[#5d675f]">{q.marks}</span>
        </div>
        <p className="text-[15px] font-black text-[#13251d] leading-7">{q.text}</p>
        <details className="mt-3">
          <summary className="text-xs font-black text-[#0f766e] cursor-pointer">📋 View Answer Framework</summary>
          <ul className="mt-2 space-y-1 pl-3">
            {q.framework.map((f, i) => (
              <li key={i} className="text-xs font-semibold text-[#31443a] flex gap-2"><span className="text-[#0f766e]">→</span>{f}</li>
            ))}
          </ul>
        </details>
      </div>
      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase text-[#085041]">✍️ Write Your Answer</p>
          <span className={`text-[10px] font-black ${wordCount > 0 ? "text-[#1d9e75]" : "text-[#5d675f]"}`}>{wordCount} words</span>
        </div>
        {[
          { label: "Introduction", key: "intro", h: "h-20", placeholder: "Open with context..." },
          { label: "Body", key: "body", h: "h-40", placeholder: "Develop the substantive argument..." },
          { label: "Conclusion", key: "conclusion", h: "h-20", placeholder: "Tie together, way forward..." },
        ].map((s, i) => (
          <div key={s.key}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">{i + 1}</span>
              <p className="text-xs font-black text-[#13251d]">{s.label}</p>
            </div>
            <textarea
              value={draft[s.key as keyof typeof draft]}
              onChange={e => setDrafts(p => ({ ...p, [activeQ]: { ...p[activeQ], [s.key]: e.target.value } }))}
              placeholder={s.placeholder}
              className={`w-full ${s.h} rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30`}
            />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2 border-t border-[#e8e2d5]">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEvaluating(true); setTimeout(() => setEvaluating(false), 2000); }}
            disabled={wordCount < 10 || evaluating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#1d9e75] px-5 py-3 text-sm font-black text-white shadow-md disabled:opacity-40">
            {evaluating ? "Evaluating…" : "🎯 Evaluate Your Mains Answer"}
          </motion.button>
          <label className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#99f6e4] px-4 py-2.5 text-xs font-black text-[#0f766e] cursor-pointer hover:bg-[#f0fdfa]">
            📷 Upload Handwritten<input type="file" accept="image/*" className="hidden" />
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Fact Card ────────────────────────────────────────────────────────────────
function FactCard() {
  const facts = [
    { label: "Term Coined", value: "Dana 1873" },
    { label: "First Observed", value: "Hall 1859" },
    { label: "Orogen Theory", value: "Kober" },
    { label: "Classification", value: "Kay 1951" },
    { label: "Tethys →", value: "Himalayas" },
    { label: "Mio vs Eu", value: "Shelf/Deep" },
    { label: "Synorogenic", value: "Flysch" },
    { label: "Post-orogenic", value: "Molasse" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#1d9e75]/20 bg-gradient-to-r from-[#e7f5ee] via-[#f0fdf4] to-[#e7f5ee] p-5 my-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#1d9e75]" />
        <p className="text-[10px] font-black uppercase tracking-wide text-[#085041]">Prelims Fact Card — Memorize</p>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {facts.map(f => (
          <div key={f.label} className="rounded-lg bg-white/80 border border-[#b9d9cd] p-2 text-center shadow-sm">
            <p className="text-[8px] font-black uppercase text-[#49675e] leading-tight">{f.label}</p>
            <p className="mt-0.5 text-xs font-black text-[#13251d]">{f.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[#e8e2d5] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]" />
      </div>
      <span className="text-[10px] font-black text-[#085041]">{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GeosynclinesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));
  useEffect(() => { setVisitedTabs(prev => new Set([...prev, activeTab])); }, [activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">Part 1 — Physical Geography</span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">Prelims: MODERATE</span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: HIGH</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            2.4 Geosynclines Theory
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#5d675f]">Earth&apos;s Origin and Interior › Geomorphology</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1"><ProgressIndicator current={visitedTabs.size} total={TABS.length} /></div>
            <button
              onClick={() => alert("PDF download coming soon! This chapter will be available as a formatted PDF for offline study.")}
              className="flex items-center gap-1.5 rounded-xl border border-[#dcd5c7] bg-white/80 px-3 py-2 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/40 hover:text-[#1d9e75] transition-all shadow-sm shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </motion.div>

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white/60 border border-[#dcd5c7] p-1.5 shadow-sm backdrop-blur-sm">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isVisited = visitedTabs.has(tab.id);
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black transition-all duration-200 whitespace-nowrap ${isActive ? "bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md scale-[1.02]" : isVisited ? "text-[#1d9e75] hover:bg-[#e7f5ee]" : "text-[#5d675f] hover:bg-[#f7f4ee]"}`}>
                <Icon className="h-3.5 w-3.5" />{tab.label}
                {isVisited && !isActive && <CheckCircle2 className="h-3 w-3 text-[#1d9e75]" />}
              </button>
            );
          })}
        </div>

        <FactCard />

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === "learn" && <LearnTab />}
            {activeTab === "ncert" && <NcertTab />}
            {activeTab === "current" && <CurrentTab />}
            {activeTab === "traps" && <TrapsTab />}
            {activeTab === "mcq" && <McqTab />}
            {activeTab === "mains" && <MainsTab />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Ribbon */}
        {(() => {
          const currentIdx = TABS.findIndex(t => t.id === activeTab);
          const nextTab = currentIdx < TABS.length - 1 ? TABS[currentIdx + 1] : null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              <a href="/upsc/content-preview/geomagnetism"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">2.3 Geomagnetism</span><span className="sm:hidden">Prev</span>
              </a>
              {nextTab ? (
                <button onClick={() => setActiveTab(nextTab.id)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-4 py-2.5 text-xs font-black text-white shadow-md hover:scale-[1.02] transition-all">
                  <span>Next: {nextTab.label}</span><ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="flex items-center gap-2 rounded-xl bg-[#e7f5ee] border border-[#1d9e75]/20 px-4 py-2.5 text-xs font-black text-[#1d9e75]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All Sections Done
                </span>
              )}
              <a href="/upsc/content-preview/isostasy"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">2.5 Isostasy</span><span className="sm:hidden">Next</span><ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          );
        })()}
      </div>
    </main>
  );
}
