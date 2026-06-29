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

// ─── SVG Diagram 1: Earth's Internal Heat Engine ──────────────────────────────
function HeatEngineDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-1">Earth&apos;s Internal Heat — Sources &amp; Geothermal Gradient</p>
      <p className="text-[10px] text-center text-[#49675e] mb-3">Radiogenic decay + primordial heat drive convection, plate tectonics and volcanism</p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg viewBox="0 0 280 240" className="w-64 h-auto shrink-0 mx-auto">
          <defs>
            <linearGradient id="geoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4e3b8" />
              <stop offset="40%" stopColor="#e0884a" />
              <stop offset="75%" stopColor="#c4452a" />
              <stop offset="100%" stopColor="#7a1c10" />
            </linearGradient>
          </defs>
          {/* depth column */}
          <rect x="60" y="20" width="80" height="200" fill="url(#geoGrad)" rx="3" />
          {/* temperature labels along the column */}
          <text x="100" y="36" textAnchor="middle" fill="#5c4625" fontSize="8" fontWeight="bold">Surface ~15°C</text>
          <text x="100" y="95" textAnchor="middle" fill="#7a3315" fontSize="8" fontWeight="bold">Moho ~500°C</text>
          <text x="100" y="155" textAnchor="middle" fill="#fde7cf" fontSize="8" fontWeight="bold">Mantle ~2000°C</text>
          <text x="100" y="210" textAnchor="middle" fill="#fde7cf" fontSize="8" fontWeight="bold">Core &gt;5000°C</text>
          {/* gradient arrow + label */}
          <line x1="150" y1="20" x2="150" y2="220" stroke="#1a3a2a" strokeWidth="1.5" markerEnd="url(#geoArr)" />
          <text x="158" y="120" fill="#1a3a2a" fontSize="8" fontWeight="bold" transform="rotate(90 158 120)">Geothermal gradient 25–30°C/km (upper crust)</text>
          <defs>
            <marker id="geoArr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#1a3a2a" /></marker>
          </defs>
          {/* depth axis */}
          <text x="30" y="26" textAnchor="middle" fill="#49675e" fontSize="7">0 km</text>
          <text x="30" y="224" textAnchor="middle" fill="#49675e" fontSize="7">6371 km</text>
        </svg>
        <div className="space-y-2 flex-1">
          <p className="text-[10px] font-black uppercase text-[#085041]">Where the heat comes from</p>
          {[
            { label: "Radiogenic decay (U, Th, K)", value: "~50%", note: "Ongoing decay of long-lived radioactive isotopes" },
            { label: "Primordial / accretional heat", value: "Major", note: "Gravitational energy trapped during Earth's formation" },
            { label: "Core solidification + differentiation", value: "Adds heat", note: "Latent heat released as the inner core grows" },
            { label: "Ridge heat flow", value: ">100 mW/m²", note: "High — hot mantle upwelling at divergent margins" },
            { label: "Shield heat flow", value: "~40 mW/m²", note: "Low — old, cold, stable cratonic crust" },
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

// ─── SVG Diagram 2: Radiometric Dating Clocks ─────────────────────────────────
function DatingClocksDiagram() {
  // log scale bars showing applicable age range of each method
  const methods = [
    { name: "Carbon-14", half: "5,730 yr", range: "up to ~50,000 yr", use: "Organic remains, recent", color: "#3b82c4", w: 18 },
    { name: "Potassium-Argon", half: "1.3 Ga", range: "100,000 yr → billions", use: "Volcanic rocks", color: "#0f766e", w: 70 },
    { name: "Rubidium-Strontium", half: "48.8 Ga", range: "tens of millions → billions", use: "Metamorphic rocks", color: "#b45309", w: 80 },
    { name: "Uranium-Lead", half: "4.5 Ga", range: "1 Ma → 4.5+ billion yr", use: "Oldest rocks, Earth's age", color: "#7a1c10", w: 92 },
  ];
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-1">Radiometric Dating — Matching the Clock to the Age</p>
      <p className="text-[10px] text-center text-[#49675e] mb-3">Longer half-life = older material that can be dated</p>
      <div className="space-y-2.5">
        {methods.map((m, i) => (
          <div key={i} className="rounded-lg bg-white/70 border border-[#b9d9cd] px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-[#1a3a2a]">{m.name}</span>
              <span className="text-[10px] font-black text-[#1d9e75]">t½ = {m.half}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-[#e8e2d5] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${m.w}%`, backgroundColor: m.color }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-[#5d675f]">Range: {m.range}</span>
              <span className="text-[9px] font-bold text-[#49675e]">{m.use}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-center text-[#49675e]">Earth&apos;s age (4.54 Ga) comes from U-Pb dating of meteorites, not of Earth rocks.</p>
    </div>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────────────────────
function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="In Topic 2.5, isostasy and post-glacial rebound both depended on a mantle that can slowly flow — which is only possible because Earth&apos;s interior is **hot**. This topic asks the deeper question: where does that heat come from, how do we measure deep time, and what does Earth&apos;s gradual cooling mean for its future? The answer begins with **radioactivity**." />

      {/* Heat sources */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔥 Sources of Earth&apos;s Internal Heat</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Radioactive decay** of long-lived isotopes — **Uranium (U), Thorium (Th) and Potassium-40 (K)** — generates roughly **half of Earth&apos;s present-day internal heat**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="The remainder is **primordial heat** — gravitational/accretional energy trapped during Earth&apos;s formation — plus **latent heat released as the inner core solidifies**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="This heat is the **engine of all endogenic activity**: it drives **mantle convection**, which in turn powers **plate tectonics, volcanism and earthquakes**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Radioactive elements are **concentrated in the continental (granitic) crust**, which is why continental areas produce more radiogenic heat than oceanic crust." /></li>
        </ul>
      </div>

      <HeatEngineDiagram />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Radioactivity & thermal history — UPSC Mains GS-1 2017
        </span>
      </div>

      {/* Geothermal gradient & heat flow */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌡️ Geothermal Gradient &amp; Heat Flow</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="The **geothermal gradient** — the rate at which temperature rises with depth — averages **25–30°C per km** in the upper crust, but **decreases with depth** (it is not linear all the way to the core)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Heat flow** varies by tectonic setting: **highest at mid-ocean ridges (>100 mW/m²)** where hot mantle upwells, and **lowest on old continental shields (~40 mW/m²)**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Back-arc basins** behind subduction zones show **high heat flow** from secondary mantle convection — a useful diagnostic of plate setting." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="This heat-flow pattern is itself **evidence for plate tectonics** — high at creation zones (ridges), low at stable interiors." /></li>
        </ul>
      </div>

      {/* Radiometric dating */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">⏳ Radiometric Dating — Reading Deep Time</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Radioactive isotopes decay at a fixed rate (the **half-life**), so the **parent-to-daughter ratio** in a rock acts as a built-in clock recording its age." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Uranium–Lead (U-238, t½ = 4.5 Ga)** — for the oldest rocks and the **age of the Earth**. **Potassium–Argon (K-40, t½ = 1.3 Ga)** — for volcanic rocks (millions of years)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Carbon-14 (t½ = 5,730 yr)** — for **organic remains up to ~50,000 years**. **Rubidium–Strontium** — for metamorphic rocks." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Match the clock to the material**: you cannot date a million-year-old rock with C-14, nor recent organic material with U-Pb. Choosing the wrong method is a classic exam trap." /></li>
        </ul>
      </div>

      <DatingClocksDiagram />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Half-lives & dating methods — UPSC Prelims (frequently tested)
        </span>
      </div>

      {/* Thermal history & future */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌍 Earth&apos;s Thermal History &amp; Future</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Early Earth was far hotter — heavy bombardment, abundant short-lived radioactive isotopes and accretional heat produced a **magma ocean**. Heat production has **declined over geological time** as isotopes decayed away." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="As Earth **slowly cools**, mantle convection will weaken, the **magnetic field will weaken**, and **plate tectonics will eventually cease**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Mars is a possible glimpse of Earth&apos;s future**: being smaller, it cooled faster (higher surface-area-to-volume ratio), lost its internal heat engine, shut down its magnetic field, and became tectonically dead." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight — One Heat Source, Many Topics" tone="amber">
        Radiogenic heat links almost every topic in this unit: it powers convection (plate tectonics), keeps the outer core liquid (geomagnetism, Topic 2.3), allows the mantle to flow (isostasy, Topic 2.5), and its decay clocks give us the geological timescale. UPSC rewards answers that make these cross-connections explicit.
      </Callout>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="Forward — What Comes Next" tone="blue">
        We now have the heat engine and the deep-time clock. Next, we return to the surface story it drives — Sub-topic 3 begins with Continental Drift Theory (Wegener), where mantle heat finally explains how continents move.
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
          cls: "Class 11 — Fundamentals of Physical Geography, Chapter 3",
          pages: "Interior of the Earth",
          points: [
            "NCERT identifies **radioactivity** as a key **source of internal heat**, alongside primordial heat from Earth&apos;s formation.",
            "Explains that this heat drives **endogenic forces** — volcanism, earthquakes and tectonic movements originate from internal heat.",
            "States that **temperature increases with depth** (the geothermal gradient) — the basis for understanding the molten/plastic behaviour of the interior.",
            "UPSC source point: internal heat (largely radiogenic) is the engine behind all mountain-building and plate movement.",
          ],
        },
        {
          cls: "Class 11 — Fundamentals of Physical Geography, Chapter 2",
          pages: "The Origin and Evolution of the Earth",
          points: [
            "Describes Earth&apos;s **differentiation** and early molten stage — driven by accretional energy and radioactive heating.",
            "Connects the **cooling history** of the Earth to the formation of the crust and the layering of the interior.",
            "Provides the timescale context — Earth ~4.6 billion years — established through radiometric dating.",
          ],
        },
        {
          cls: "Class 11 — Fundamentals of Physical Geography, Chapter 6",
          pages: "Geomorphic Processes",
          points: [
            "Frames **endogenic processes** as ultimately powered by Earth&apos;s internal (radiogenic + primordial) heat.",
            "Distinguishes diastrophism and volcanism as surface expressions of internal heat-driven convection.",
            "Useful linkage: declining internal heat over geological time means endogenic activity will eventually slow.",
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
      tag: "🌍 Science",
      title: "Geoneutrinos — 'Seeing' Radioactive Heat Inside Earth",
      text: "Detectors such as **KamLAND (Japan)** and **Borexino (Italy)** measure **geoneutrinos** — near-massless particles emitted by the decay of uranium and thorium deep inside the Earth. These measurements provide direct, independent confirmation that **radioactive decay supplies roughly half of Earth&apos;s internal heat**, validating a number long inferred only from models. It is the closest science has come to directly observing Earth&apos;s radiogenic heat budget.",
    },
    {
      tag: "🇮🇳 India",
      title: "Geothermal Energy — Puga & Ladakh Projects",
      text: "India is developing its **geothermal** potential, with the **Puga Valley (Ladakh)** as the most promising site. Geothermal energy taps the same internal heat (partly radiogenic) discussed here. The Geological Survey of India has mapped over **300 hot springs**; harnessing them supports India&apos;s clean-energy goals and demonstrates the practical relevance of Earth&apos;s thermal regime.",
    },
    {
      tag: "🌍 Science",
      title: "Refining the Age of the Solar System",
      text: "High-precision **uranium–lead dating** of meteorite inclusions (CAIs) continues to refine the age of the solar system to about **4.567 billion years**. Because meteorites are geologically unprocessed, they — not Earth rocks — fix the age of the Earth at **~4.54 billion years**. This is the textbook example of choosing the right radiometric clock for the right material.",
    },
    {
      tag: "🪐 Comparative",
      title: "InSight Mission — A Cooling Mars as Earth's Future",
      text: "NASA&apos;s **InSight lander** measured heat flow and seismicity (&apos;marsquakes&apos;) on Mars, confirming a planet that has largely **lost its internal heat engine**. Mars cooled faster than Earth because of its smaller size, shutting down its magnetic field and tectonics. It serves as a real planetary analogue for the long-term thermal fate predicted for Earth.",
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
      wrong: "'All of Earth's internal heat comes from radioactive decay'",
      right: "Radiogenic decay supplies only about HALF. The rest is primordial (accretional/gravitational) heat from Earth's formation, plus latent heat from core solidification. Don't attribute 100% to radioactivity.",
    },
    {
      wrong: "'The geothermal gradient stays constant at ~30°C/km all the way to the core'",
      right: "The ~25–30°C/km figure applies only to the UPPER crust. The gradient DECREASES with depth — if it were constant, the core would be vastly hotter than it is. It is non-linear.",
    },
    {
      wrong: "'Carbon-14 dating can be used to find the age of ancient rocks billions of years old'",
      right: "C-14 (half-life 5,730 yr) works only for ORGANIC remains up to ~50,000 years. For rocks billions of years old you need Uranium–Lead. Matching the wrong clock to the material is the classic trap.",
    },
    {
      wrong: "'Earth's age was determined by dating the oldest rocks on Earth's surface'",
      right: "Earth's age (~4.54 Ga) comes from U-Pb dating of METEORITES. The oldest intact Earth rocks (Acasta Gneiss ~4.0 Ga) are younger because plate tectonics and erosion recycled the earliest crust.",
    },
    {
      wrong: "'Heat flow is highest on old continental shields'",
      right: "Reversed. Heat flow is LOWEST (~40 mW/m²) on old, cold, stable shields and HIGHEST (>100 mW/m²) at mid-ocean ridges where hot mantle upwells. High heat flow marks zones of crust creation, not stable interiors.",
    },
    {
      wrong: "'Radioactive elements are concentrated in the dense core'",
      right: "The main heat-producing elements (U, Th, K) are LITHOPHILE and concentrate in the CONTINENTAL (granitic) CRUST, not the iron-rich core. This is why continental crust produces more radiogenic heat than oceanic crust.",
    },
    {
      wrong: "'A shorter half-life means a method can date older samples'",
      right: "The opposite. A LONGER half-life lets a method date OLDER material (the parent isn't exhausted). U-238 (4.5 Ga half-life) dates the oldest samples; C-14 (5,730 yr) only the youngest.",
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
      stem: "Consider the following statements about Earth's internal heat:",
      stmts: [
        "Radioactive decay of uranium, thorium and potassium supplies roughly half of Earth's internal heat.",
        "Primordial heat from accretion and gravitational energy contributes to the internal heat budget.",
        "This internal heat drives mantle convection, which powers plate tectonics.",
        "Almost all of Earth's internal heat is supplied by incoming solar radiation.",
      ],
      opts: ["1, 2 and 3 only", "1 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT. Statement 4 is WRONG — solar radiation heats the SURFACE (exogenic processes) but does not supply the deep internal heat. Internal heat is radiogenic + primordial + core solidification, not solar.",
    },
    {
      id: 2, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about the geothermal gradient and heat flow:",
      stmts: [
        "The geothermal gradient averages about 25–30°C per km in the upper crust.",
        "The gradient decreases with depth rather than remaining constant to the core.",
        "Heat flow is highest at mid-ocean ridges (>100 mW/m²).",
        "Heat flow is highest on old, stable continental shields.",
      ],
      opts: ["1, 2 and 3 only", "1 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT. Statement 4 is WRONG — heat flow is LOWEST (~40 mW/m²) on old shields and HIGHEST at mid-ocean ridges. High heat flow marks zones of new crust, not stable cratons.",
    },
    {
      id: 3, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about radiometric dating:",
      stmts: [
        "Uranium–Lead dating is used for the oldest rocks and the age of the Earth.",
        "Carbon-14 dating is suitable for organic remains up to about 50,000 years.",
        "A longer half-life allows a method to date older materials.",
        "Earth's age was determined by dating the oldest rocks found on its surface.",
      ],
      opts: ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT. Statement 4 is WRONG — Earth's age (~4.54 Ga) comes from dating METEORITES, not Earth's surface rocks. The oldest intact Earth rocks (~4.0 Ga) are younger because the earliest crust was recycled.",
    },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    {
      id: 4, type: "HOW MANY CORRECT",
      stem: "How many of the following (isotope — approximate half-life) pairs are correctly matched?",
      stmts: [
        "Uranium-238 — 4.5 billion years",
        "Potassium-40 — 1.3 billion years",
        "Carbon-14 — 5,730 years",
        "Carbon-14 — 1.3 billion years",
      ],
      opts: ["Only two", "Only three", "All four", "Only one"],
      correct: 1,
      explain: "Three pairs are correct: U-238 (4.5 Ga), K-40 (1.3 Ga), C-14 (5,730 yr). Pair 4 is WRONG — C-14's half-life is 5,730 years, not 1.3 billion years (that is K-40). So three pairs are correctly matched.",
    },
    {
      id: 5, type: "HOW MANY CORRECT",
      stem: "How many of the following statements about Earth's thermal history are correct?",
      stmts: [
        "Earth's internal heat production has declined over geological time.",
        "As Earth cools, plate tectonics will eventually slow and cease.",
        "Mars cooled faster than Earth because of its smaller size.",
        "Radioactive heat-producing elements are concentrated in the dense iron core.",
      ],
      opts: ["Only one", "Only two", "Only three", "All four"],
      correct: 2,
      explain: "Statements 1, 2, 3 are correct (three). Statement 4 is WRONG — U, Th and K are lithophile and concentrate in the CONTINENTAL CRUST, not the iron core. Three statements are correct.",
    },
    // TYPE 3: ASSERTION-REASON (2 questions)
    {
      id: 6, type: "ASSERTION-REASON",
      stem: "Assertion (A): Mid-ocean ridges exhibit high heat flow while old continental shields exhibit low heat flow.\n\nReason (R): Hot mantle material upwells beneath mid-ocean ridges, whereas continental shields are old, cold and tectonically stable.",
      stmts: [],
      opts: [
        "Both A and R true and R is the correct explanation of A",
        "Both A and R true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explain: "Both A and R are true and R correctly explains A. Mantle upwelling at ridges delivers fresh heat to the surface (high heat flow), while ancient cratons have lost their heat and lie far from active mantle upwelling (low heat flow).",
    },
    {
      id: 7, type: "ASSERTION-REASON",
      stem: "Assertion (A): Carbon-14 cannot be used to date rocks that are hundreds of millions of years old.\n\nReason (R): Carbon-14 has a short half-life (about 5,730 years), so after roughly 50,000 years almost none of the original isotope remains to measure.",
      stmts: [],
      opts: [
        "Both A and R true and R is the correct explanation of A",
        "Both A and R true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explain: "Both A and R are true and R is the correct explanation. After about nine half-lives (~50,000 years) the remaining C-14 is too small to measure reliably, so it cannot date material hundreds of millions of years old. Long-lived isotopes like U-238 are needed instead.",
    },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    {
      id: 8, type: "NOT / EXCEPTION",
      stem: "Which of the following statements about Earth's internal heat is NOT correct?",
      stmts: [],
      opts: [
        "Radioactive decay contributes about half of Earth's internal heat.",
        "Internal heat drives mantle convection and plate tectonics.",
        "Solar radiation is the main source of Earth's deep internal heat.",
        "Latent heat is released as the inner core solidifies.",
      ],
      correct: 2,
      explain: "Option (c) is NOT correct. Solar radiation heats the surface but does NOT supply the deep internal heat — that comes from radiogenic decay, primordial heat and core solidification. The other three statements are accurate.",
    },
    {
      id: 9, type: "NOT / EXCEPTION",
      stem: "Which of the following about radiometric dating is NOT correct?",
      stmts: [],
      opts: [
        "Uranium–Lead is suited to dating the oldest rocks.",
        "Potassium–Argon is commonly used to date volcanic rocks.",
        "Carbon-14 is appropriate for dating rocks billions of years old.",
        "The parent-to-daughter isotope ratio is used to estimate age.",
      ],
      correct: 2,
      explain: "Option (c) is NOT correct. Carbon-14 (half-life 5,730 yr) is for ORGANIC remains up to ~50,000 years, NOT for rocks billions of years old. For those you need U-Pb. The other three statements are correct.",
    },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    {
      id: 10, type: "SCENARIO / APPLIED",
      stem: "An archaeologist needs to date charcoal from an ancient hearth estimated to be around 8,000 years old. Which method is most appropriate?",
      stmts: [],
      opts: ["Uranium–Lead dating", "Carbon-14 dating", "Rubidium–Strontium dating", "Potassium–Argon dating"],
      correct: 1,
      explain: "Charcoal is organic and ~8,000 years old — well within Carbon-14's range (up to ~50,000 yr). U-Pb, Rb-Sr and K-Ar are for rocks millions-to-billions of years old and would be entirely unsuitable for a few-thousand-year-old organic sample.",
    },
    {
      id: 11, type: "SCENARIO / APPLIED",
      stem: "A planet smaller than Earth is found to have no global magnetic field and no active plate tectonics, with surface features billions of years old. Drawing on Earth's thermal history, what is the most likely explanation?",
      stmts: [],
      opts: [
        "The planet never contained any radioactive elements",
        "Being small, it lost its internal heat faster, shutting down convection, its dynamo and tectonics",
        "It is too close to its star and was heated externally",
        "Its surface is too young to record tectonic activity",
      ],
      correct: 1,
      explain: "A smaller planet has a higher surface-area-to-volume ratio and so cools faster. Once internal heat falls, mantle convection weakens, the core dynamo (magnetic field) shuts down, and plate tectonics ceases — exactly the Mars analogue used to illustrate Earth's long-term thermal future.",
    },
    {
      id: 12, type: "SCENARIO / APPLIED",
      stem: "A geophysical survey records heat flow of about 110 mW/m² at one site and about 40 mW/m² at another. Which interpretation is most consistent with these readings?",
      stmts: [],
      opts: [
        "The 110 value is a stable craton; the 40 value is a mid-ocean ridge",
        "The 110 value is a mid-ocean ridge; the 40 value is an old continental shield",
        "Both sites must be identical tectonic settings",
        "Heat flow values cannot indicate tectonic setting",
      ],
      correct: 1,
      explain: "High heat flow (>100 mW/m²) indicates a mid-ocean ridge with mantle upwelling; low heat flow (~40 mW/m²) indicates an old, cold continental shield. Heat-flow patterns are a reliable diagnostic of tectonic setting — and themselves support plate tectonics.",
    },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    {
      id: 13, type: "MATCH THE PAIRS",
      stem: "Match the dating method with its typical application:\n\n1. Uranium–Lead\n2. Potassium–Argon\n3. Carbon-14\n4. Rubidium–Strontium\n\nP. Organic remains up to ~50,000 years\nQ. Oldest rocks and the age of the Earth\nR. Metamorphic rocks\nS. Volcanic rocks (millions of years)",
      stmts: [],
      opts: ["1-Q, 2-S, 3-P, 4-R", "1-P, 2-Q, 3-R, 4-S", "1-Q, 2-P, 3-S, 4-R", "1-R, 2-S, 3-P, 4-Q"],
      correct: 0,
      explain: "1-Q: U-Pb for the oldest rocks/Earth's age. 2-S: K-Ar for volcanic rocks. 3-P: C-14 for organic remains up to ~50,000 yr. 4-R: Rb-Sr for metamorphic rocks. Correct option: 1-Q, 2-S, 3-P, 4-R.",
    },
    {
      id: 14, type: "MATCH THE PAIRS",
      stem: "Match the term with its description:\n\n1. Geothermal gradient\n2. Radiogenic heat\n3. Primordial heat\n4. Geoneutrinos\n\nP. Heat from decay of U, Th and K\nQ. Rate of temperature increase with depth (~25–30°C/km in upper crust)\nR. Particles emitted by radioactive decay, used to measure Earth's heat budget\nS. Accretional/gravitational heat trapped during Earth's formation",
      stmts: [],
      opts: ["1-Q, 2-P, 3-S, 4-R", "1-P, 2-Q, 3-R, 4-S", "1-Q, 2-S, 3-P, 4-R", "1-R, 2-P, 3-S, 4-Q"],
      correct: 0,
      explain: "1-Q: geothermal gradient = temperature rise with depth. 2-P: radiogenic heat = decay of U, Th, K. 3-S: primordial heat = accretional/gravitational heat from formation. 4-R: geoneutrinos = decay particles used to measure the heat budget. Correct option: 1-Q, 2-P, 3-S, 4-R.",
    },
    // TYPE 7: DIRECT RECALL (1 question)
    {
      id: 15, type: "DIRECT RECALL",
      stem: "Approximately what fraction of the Earth's present-day internal heat is generated by radioactive decay?",
      stmts: [],
      opts: ["About one-tenth", "About one-half", "Almost all of it", "None — it is entirely primordial"],
      correct: 1,
      explain: "Radioactive decay of U, Th and K supplies roughly HALF of Earth's present internal heat. The remainder is primordial (accretional) heat plus latent heat from core solidification — a balance confirmed by geoneutrino measurements.",
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
      id: 0, paper: "GS-1 • 2017", marks: "15 Marks • 250 Words",
      text: "Explain the role of radioactivity in Earth's thermal history and its connection to plate tectonics.",
      framework: [
        "Intro: Radioactive decay of U, Th and K supplies ~half of Earth's internal heat; the rest is primordial + core solidification",
        "Body: Heat → mantle convection → the driving force of plate tectonics (slab pull, ridge push)",
        "Body: Heat flow evidence — high at mid-ocean ridges (>100 mW/m²), low on shields (~40 mW/m²) — pattern supports plate tectonics",
        "Body: Thermal history — early Earth far hotter (magma ocean); heat production declines as isotopes decay; geothermal gradient ~25–30°C/km in upper crust",
        "Body: Future — cooling → weaker convection → weakening magnetic field → eventual end of plate tectonics; Mars as a cooled analogue",
        "Conclusion: Radioactivity is the hidden engine linking deep-time dating, internal heat, convection and the entire plate-tectonic system",
      ],
    },
    {
      id: 1, paper: "GS-3", marks: "10 Marks • 150 Words",
      text: "How does radiometric dating work, and why must the dating method be matched to the material being dated?",
      framework: [
        "Intro: Radiometric dating uses the fixed decay rate (half-life) and the parent-to-daughter isotope ratio as a natural clock",
        "Body: Method ranges — U-Pb (t½ 4.5 Ga) for oldest rocks/Earth's age; K-Ar (1.3 Ga) for volcanic rocks; C-14 (5,730 yr) for organic remains <50,000 yr; Rb-Sr for metamorphic rocks",
        "Body: Matching principle — longer half-life dates older material; using C-14 on ancient rock or U-Pb on recent charcoal gives meaningless results",
        "Body: Earth's age (4.54 Ga) fixed from meteorites, not surface rocks (which were recycled)",
        "Conclusion: Correct method selection is essential for reliable geochronology underpinning the entire geological timescale",
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
    { label: "Heat Sources", value: "U · Th · K" },
    { label: "Radiogenic", value: "~50%" },
    { label: "Geotherm Grad", value: "25–30°C/km" },
    { label: "Ridge Heat", value: ">100 mW/m²" },
    { label: "Shield Heat", value: "~40 mW/m²" },
    { label: "U-238 t½", value: "4.5 Ga" },
    { label: "K-40 t½", value: "1.3 Ga" },
    { label: "C-14 t½", value: "5730 yr" },
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
export default function RadioactivityPage() {
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));
  useEffect(() => { setVisitedTabs(prev => new Set([...prev, activeTab])); }, [activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">Part 1 — Physical Geography</span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">Prelims: HIGH</span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: MODERATE</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            2.6 Radioactivity and Earth&apos;s Thermal History
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
              <a href="/upsc/content-preview/isostasy"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">2.5 Isostasy</span><span className="sm:hidden">Prev</span>
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
              <a href="/upsc/content-preview/continental-drift"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">3.1 Continental Drift</span><span className="sm:hidden">Next</span><ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          );
        })()}
      </div>
    </main>
  );
}
