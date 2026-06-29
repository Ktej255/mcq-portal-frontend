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

// ─── SVG Diagram 1: Airy vs Pratt Comparison ──────────────────────────────────
function AiryPrattDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-1">Airy vs Pratt — The Two Classical Models of Isostasy</p>
      <p className="text-[10px] text-center text-[#49675e] mb-3">Both achieve equilibrium, but compensate in opposite ways</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* AIRY */}
        <div className="rounded-xl bg-white/70 border border-[#b9d9cd] p-3">
          <p className="text-[11px] font-black text-[#1a3a2a] text-center mb-1">AIRY (1855)</p>
          <p className="text-[9px] text-center text-[#49675e] mb-2">Uniform density · Variable thickness · ROOTS</p>
          <svg viewBox="0 0 260 210" className="w-full h-auto">
            <defs>
              <linearGradient id="airyMantle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4773f" /><stop offset="100%" stopColor="#8a4a20" />
              </linearGradient>
            </defs>
            {/* mantle */}
            <rect x="0" y="60" width="260" height="150" fill="url(#airyMantle)" />
            <text x="130" y="200" textAnchor="middle" fill="#fde7cf" fontSize="8" fontWeight="bold">Denser substratum (mantle)</text>
            {/* uniform-density crustal blocks of varying thickness floating like icebergs */}
            {/* tall mountain block with deep root */}
            <rect x="10" y="20" width="55" height="150" fill="#7fae8e" stroke="#1a5c32" strokeWidth="1" />
            <text x="37" y="50" textAnchor="middle" fill="#0e3a1e" fontSize="7" fontWeight="bold">High</text>
            <text x="37" y="120" textAnchor="middle" fill="#0e3a1e" fontSize="6.5">deep root</text>
            {/* medium block */}
            <rect x="70" y="40" width="55" height="95" fill="#9cc4a8" stroke="#1a5c32" strokeWidth="1" />
            <text x="97" y="62" textAnchor="middle" fill="#0e3a1e" fontSize="7" fontWeight="bold">Plateau</text>
            {/* low block thin */}
            <rect x="130" y="55" width="55" height="55" fill="#b9d9c4" stroke="#1a5c32" strokeWidth="1" />
            <text x="157" y="78" textAnchor="middle" fill="#0e3a1e" fontSize="6.5" fontWeight="bold">Plain</text>
            {/* ocean very thin */}
            <rect x="190" y="58" width="58" height="32" fill="#cfe7d8" stroke="#1a5c32" strokeWidth="1" />
            <text x="219" y="76" textAnchor="middle" fill="#0e3a1e" fontSize="6">thin</text>
            {/* same density label */}
            <text x="130" y="14" textAnchor="middle" fill="#1a3a2a" fontSize="7">All blocks: same density ρ — deeper root = higher peak</text>
          </svg>
        </div>

        {/* PRATT */}
        <div className="rounded-xl bg-white/70 border border-[#b9d9cd] p-3">
          <p className="text-[11px] font-black text-[#1a3a2a] text-center mb-1">PRATT (1855)</p>
          <p className="text-[9px] text-center text-[#49675e] mb-2">Variable density · Uniform base · NO roots</p>
          <svg viewBox="0 0 260 210" className="w-full h-auto">
            <defs>
              <linearGradient id="prattMantle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4773f" /><stop offset="100%" stopColor="#8a4a20" />
              </linearGradient>
            </defs>
            <rect x="0" y="135" width="260" height="75" fill="url(#prattMantle)" />
            {/* uniform line of compensation at y=135; columns of varying density reach common base */}
            {/* tall low-density column */}
            <rect x="10" y="20" width="55" height="115" fill="#cfe7d8" stroke="#1a5c32" strokeWidth="1" />
            <text x="37" y="80" textAnchor="middle" fill="#0e3a1e" fontSize="6.5">low ρ</text>
            <text x="37" y="50" textAnchor="middle" fill="#0e3a1e" fontSize="7" fontWeight="bold">High</text>
            <rect x="70" y="40" width="55" height="95" fill="#9cc4a8" stroke="#1a5c32" strokeWidth="1" />
            <text x="97" y="92" textAnchor="middle" fill="#0e3a1e" fontSize="6.5">med ρ</text>
            <rect x="130" y="60" width="55" height="75" fill="#7fae8e" stroke="#1a5c32" strokeWidth="1" />
            <text x="157" y="100" textAnchor="middle" fill="#0e3a1e" fontSize="6.5">high ρ</text>
            <rect x="190" y="80" width="58" height="55" fill="#5a9e6f" stroke="#1a5c32" strokeWidth="1" />
            <text x="219" y="110" textAnchor="middle" fill="white" fontSize="6">higher ρ</text>
            {/* level of compensation */}
            <line x1="0" y1="135" x2="260" y2="135" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="4,3" />
            <text x="130" y="148" textAnchor="middle" fill="#b91c1c" fontSize="7" fontWeight="bold">Level of Compensation (uniform depth)</text>
            <text x="130" y="14" textAnchor="middle" fill="#1a3a2a" fontSize="7">Density varies inversely with height — no roots</text>
          </svg>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/70 border border-[#b9d9cd] px-3 py-1.5">
          <p className="text-[10px] font-black text-[#1a3a2a]">Airy — memory anchor</p>
          <p className="text-[10px] text-[#5d675f]">Icebergs: bigger berg = deeper keel. Higher mountain = deeper root.</p>
        </div>
        <div className="rounded-lg bg-white/70 border border-[#b9d9cd] px-3 py-1.5">
          <p className="text-[10px] font-black text-[#1a3a2a]">Pratt — memory anchor</p>
          <p className="text-[10px] text-[#5d675f]">Columns to a common base: lighter column stands taller.</p>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Diagram 2: Post-Glacial Isostatic Rebound ────────────────────────────
function ReboundDiagram() {
  const stages = [
    { title: "1. Glaciation", sub: "Ice load depresses crust", color: "#3b82c4" },
    { title: "2. Deglaciation", sub: "Ice melts — load removed", color: "#b45309" },
    { title: "3. Rebound", sub: "Crust slowly rises (~1 cm/yr)", color: "#1a5c32" },
  ];
  return (
    <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#f0fdf4] to-[#e7f5ee] p-4">
      <p className="text-xs font-black uppercase text-[#085041] text-center mb-3">Post-Glacial Isostatic Rebound — Fennoscandia &amp; Hudson Bay</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stages.map((s, i) => (
          <div key={i} className="relative rounded-xl bg-white/75 border border-[#b9d9cd] p-3">
            <svg viewBox="0 0 160 100" className="w-full h-24">
              <defs>
                <linearGradient id={`rebMantle${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c4773f" /><stop offset="100%" stopColor="#8a4a20" />
                </linearGradient>
              </defs>
              {i === 0 && (
                <>
                  <rect x="0" y="60" width="160" height="40" fill={`url(#rebMantle0)`} />
                  {/* depressed crust */}
                  <path d="M0,45 L40,45 Q80,72 120,45 L160,45 L160,60 L0,60 Z" fill="#7fae8e" stroke="#1a5c32" strokeWidth="0.8" />
                  {/* ice cap */}
                  <path d="M45,45 Q80,5 115,45 Z" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
                  <text x="80" y="30" textAnchor="middle" fill="#1e40af" fontSize="8" fontWeight="bold">ICE</text>
                  <line x1="80" y1="48" x2="80" y2="66" stroke="#b91c1c" strokeWidth="1.2" markerEnd="url(#rb1)" />
                </>
              )}
              {i === 1 && (
                <>
                  <rect x="0" y="60" width="160" height="40" fill={`url(#rebMantle1)`} />
                  <path d="M0,45 L40,45 Q80,72 120,45 L160,45 L160,60 L0,60 Z" fill="#7fae8e" stroke="#1a5c32" strokeWidth="0.8" />
                  {/* melting droplets */}
                  <circle cx="70" cy="35" r="2" fill="#3b82c4" /><circle cx="85" cy="40" r="2" fill="#3b82c4" /><circle cx="95" cy="32" r="2" fill="#3b82c4" />
                  <text x="80" y="22" textAnchor="middle" fill="#b45309" fontSize="7" fontWeight="bold">melting</text>
                </>
              )}
              {i === 2 && (
                <>
                  <rect x="0" y="60" width="160" height="40" fill={`url(#rebMantle2)`} />
                  {/* rebounded (flatter / raised) crust */}
                  <path d="M0,42 L40,42 Q80,34 120,42 L160,42 L160,60 L0,60 Z" fill="#7fae8e" stroke="#1a5c32" strokeWidth="0.8" />
                  <line x1="80" y1="55" x2="80" y2="36" stroke="#1a5c32" strokeWidth="1.4" markerEnd="url(#rb2)" />
                  <text x="80" y="26" textAnchor="middle" fill="#1a5c32" fontSize="7" fontWeight="bold">uplift</text>
                </>
              )}
              <defs>
                <marker id="rb1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#b91c1c" /></marker>
                <marker id="rb2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#1a5c32" /></marker>
              </defs>
            </svg>
            <p className="mt-1 text-[11px] font-black" style={{ color: s.color }}>{s.title}</p>
            <p className="text-[10px] text-[#5d675f] leading-4">{s.sub}</p>
            {i < 2 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 h-4 w-4 text-[#1d9e75]" />}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-center text-[#49675e]">Scandinavia is still rising ~1 cm/year, 10,000 years after the last Ice Age — direct proof that the mantle responds viscously to changing surface loads.</p>
    </div>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────────────────────
function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="In Topic 2.4, geosynclines showed how thick sediments rise into mountains. That raises a balance problem: if you pile a mountain onto the crust, why doesn&apos;t it simply sink, and when erosion wears it down, why does it keep rising? The answer is **isostasy** — the gravitational balance that keeps the crust floating in equilibrium on the denser mantle beneath." />

      {/* Concept */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">⚖️ What Is Isostasy?</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Isostasy** is the state of **gravitational equilibrium** between the Earth&apos;s crust and the denser mantle, such that the crust &apos;floats&apos; at an elevation determined by its thickness and density — like blocks floating in a fluid." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="The term **&apos;isostasy&apos;** (Greek: &apos;equal standing&apos;) was coined by **Clarence Dutton in 1889**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="The puzzle began with the **Great Trigonometric Survey of India**: near the Himalayas, the plumb-line was deflected **less** than the mountains&apos; visible mass predicted. **Archdeacon Pratt** and **George Airy** offered competing explanations in **1855** — the two classical models of isostasy." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Isostasy explains **mountain roots**, **post-glacial rebound**, and the link between surface topography and crustal structure." /></li>
        </ul>
      </div>

      <AiryPrattDiagram />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Airy vs Pratt comparison — UPSC Mains GS-1 2021, 2015
        </span>
      </div>

      {/* Airy */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🏔️ Airy&apos;s Model (1855) — Roots</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="The crust has a **uniform density** but **variable thickness**. Crustal blocks float on the denser substratum like **icebergs in water**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**The higher the mountain, the deeper its &apos;root&apos;** extending into the mantle — just as a taller iceberg has a deeper keel. Oceans correspond to thin crust (&apos;anti-roots&apos;)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Modern seismic data confirm Airy&apos;s roots: the **Himalayas have a crustal root exceeding ~70 km**, supporting the view that great ranges are compensated by depth." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Airy-Heiskanen is the refined version of this **root-based** model used in geodesy." /></li>
        </ul>
      </div>

      {/* Pratt */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🧱 Pratt&apos;s Model (1855) — Density</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="The crust has a **uniform base depth** (a common &apos;level of compensation&apos;) but **variable density**. There are **no roots**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Density varies inversely with elevation**: lighter (less dense) columns stand higher; denser columns stand lower. Mountains are made of lighter material; ocean floors of denser material." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="All columns reach the **same depth of compensation**, where the pressure is equal. Pratt-Hayford is the refined version of this **density-based** model." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Airy vs Pratt — The One-Line Distinction" tone="amber">
        AIRY = uniform DENSITY, variable THICKNESS → mountains have deep ROOTS. PRATT = uniform THICKNESS (common base), variable DENSITY → mountains are made of LIGHTER material. Mix these up and you lose the marks — this is the single most-tested point in the topic.
      </Callout>

      {/* Flexural / Vening Meinesz */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌉 Vening Meinesz — Flexural (Regional) Isostasy</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Both Airy and Pratt assume **local** compensation (each column balances independently). **Felix Vening Meinesz (1931)** proposed **flexural isostasy**: the lithosphere behaves as a **rigid elastic plate** that bends and distributes a load over a **broader region**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="This explains **peripheral foreland basins** — for example, the **Indo-Gangetic Plain** is a flexural downwarp created by the load of the Himalayas, later filled with alluvium." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Flexural isostasy is the most realistic of the three — the modern view treats local Airy/Pratt models as limiting cases." /></li>
        </ul>
      </div>

      {/* Gravity anomalies */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📉 Gravity Anomalies as Evidence</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="A **negative Bouguer anomaly** over mountains reveals a **mass deficiency at depth** — i.e. a low-density crustal **root** — confirming Airy-type compensation." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Positive Bouguer anomalies** over oceans indicate **thin, dense crust** close to the heavier mantle." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Where a region is **NOT** in isostatic balance (e.g. actively rebounding Scandinavia), the anomaly reveals the disequilibrium — driving ongoing vertical motion." /></li>
        </ul>
      </div>

      <ReboundDiagram />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Post-glacial rebound & isostatic adjustment — UPSC Mains GS-1 2021
        </span>
      </div>

      {/* Adjustment & India */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔄 Isostatic Adjustment &amp; the Indian Context</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="When a load is **added** (ice sheet, sediment), the crust **subsides**; when a load is **removed** (melting ice, erosion), the crust **rebounds** upward — restoring balance." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Scandinavia (Fennoscandia)** is still rising **~1 cm/year**, ~10,000 years after its ice sheet melted. **Hudson Bay (Canada)** shows similar rebound — the strongest demonstration of mantle viscosity." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="In India: the **Himalayas** (deep root, negative anomaly) and the **Indo-Gangetic foreland basin** (flexural depression) are textbook isostatic features. Erosion of the Himalayas drives continued **compensatory uplift**." /></li>
        </ul>
      </div>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="Forward — What Comes Next" tone="blue">
        Isostasy and rebound both depend on heat and a deformable mantle. Where does that heat come from, and how has it shaped Earth&apos;s evolution? That is the subject of Topic 2.6 — Radioactivity and Earth&apos;s Thermal History.
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
          cls: "Class 11 — Fundamentals of Physical Geography, Chapter 6",
          pages: "Geomorphic Processes (Endogenic forces)",
          points: [
            "NCERT explains that **endogenic forces** produce vertical (epeirogenic) and horizontal (orogenic) movements — the context in which isostatic adjustment operates.",
            "The **iceberg analogy** for Airy&apos;s model is the standard NCERT illustration: a crustal block floats with the bulk of its mass below the surface, like an iceberg.",
            "Introduces the idea that **erosion of mountains leads to compensatory uplift** — the crust rises as load is removed, maintaining equilibrium.",
            "UPSC source point: mountains are not static masses sitting on the crust — they are in dynamic balance with the mantle below.",
          ],
        },
        {
          cls: "Class 11 — India: Physical Environment, Chapter 2",
          pages: "Structure and Physiography",
          points: [
            "Describes the **Indo-Gangetic Plain** as a depression formed in front of the rising Himalayas — the classic **foreland/flexural basin** filled with alluvium.",
            "Connects the great **thickness of Himalayan crust** to the collision and uplift process — the basis of Airy&apos;s deep-root interpretation in India.",
            "The plain&apos;s deep alluvial fill (locally several kilometres) demonstrates how a flexural depression is loaded and balanced.",
          ],
        },
        {
          cls: "Class 11 — Fundamentals of Physical Geography, Chapter 3",
          pages: "Interior of the Earth (density layering)",
          points: [
            "Establishes that **density increases with depth** — crust (~2.7–3.0) floats on the denser mantle — the physical premise of isostasy.",
            "The crust–mantle density contrast across the **Moho** is what allows buoyant floating equilibrium.",
            "Links to seismic evidence of crustal thickness variation: thick under mountains, thin under oceans — directly supporting Airy&apos;s root model.",
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
      tag: "🌍 Climate",
      title: "Melting Ice Sheets & Modern Isostatic Rebound",
      text: "As the **Greenland** and **West Antarctic** ice sheets lose mass, the bedrock beneath is **rebounding** measurably — in places by **centimetres per year**. This **Glacial Isostatic Adjustment (GIA)** partly offsets local sea-level rise near the ice and must be corrected for when interpreting satellite (GRACE-FO) gravity and altimetry data. It is a live example of isostasy operating on a human timescale.",
    },
    {
      tag: "🇮🇳 India",
      title: "Himalayan Uplift vs Erosion — A Balance",
      text: "Studies of the **Himalayas** show that intense erosion and sediment removal (feeding the Ganga and the Bengal Fan) is accompanied by continued **isostatic uplift** of the range. This coupling of erosion and rebound — alongside ongoing India–Asia convergence — helps explain why the Himalayas remain the world&apos;s highest mountains despite rapid denudation.",
    },
    {
      tag: "🛰️ Space",
      title: "GRACE-FO — Weighing the Earth from Orbit",
      text: "The **GRACE-Follow On** satellites measure tiny variations in Earth&apos;s gravity field, mapping mass changes from melting ice, groundwater depletion and isostatic adjustment. For India, the mission has documented severe **groundwater loss in the north-western plains** — a mass change that, like ice loss, has subtle isostatic and gravity-anomaly signatures.",
    },
    {
      tag: "🌍 Science",
      title: "Sea-Level Studies Must Subtract Land Motion",
      text: "Accurate **sea-level rise** estimates require separating genuine ocean rise from **vertical land movement** caused by isostatic rebound or subsidence. Tide-gauge records in rebounding regions (Scandinavia) show *falling* relative sea level, while subsiding deltas (parts of the Indian coast and Sundarbans) show amplified relative rise — a direct policy application of isostasy.",
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
      wrong: "'In Airy's model the crust has variable density'",
      right: "Reversed. AIRY = uniform DENSITY, variable THICKNESS (deep roots). It is PRATT's model that uses variable density with a uniform base. This swap is the most common error in the entire topic.",
    },
    {
      wrong: "'In Pratt's model higher mountains have deeper roots'",
      right: "Pratt's model has NO roots. All columns reach the same level of compensation; higher mountains are simply made of LOWER-DENSITY material. Roots (deeper keel for higher peaks) belong to AIRY's model.",
    },
    {
      wrong: "'The term isostasy was coined by Airy'",
      right: "The term 'isostasy' was coined by Clarence Dutton (1889). Airy and Pratt (both 1855) proposed the two compensation MODELS but did not coin the term itself.",
    },
    {
      wrong: "'A mountain range shows a positive Bouguer gravity anomaly because of its huge mass'",
      right: "Mountains typically show a NEGATIVE Bouguer anomaly. The low-density root at depth creates a mass DEFICIENCY that outweighs the surface mass excess. Positive anomalies occur over oceans (thin, dense crust near the mantle).",
    },
    {
      wrong: "'Post-glacial rebound proves the mantle is a rigid solid that cannot flow'",
      right: "Rebound proves the OPPOSITE — the mantle behaves as a viscous fluid over long timescales, slowly flowing back as ice load is removed. Scandinavia rising ~1 cm/year, 10,000 years after deglaciation, is the evidence.",
    },
    {
      wrong: "'Airy and Pratt models assume the load is supported regionally by a bending plate'",
      right: "That is Vening Meinesz's FLEXURAL (regional) isostasy. Both Airy and Pratt assume LOCAL compensation — each column balances independently, with no lateral strength. Regional support by an elastic plate is the later refinement.",
    },
    {
      wrong: "'Erosion of a mountain causes it to permanently lose height and never rise again'",
      right: "Isostatic adjustment means removing load (erosion) causes the crust to REBOUND upward, partly restoring elevation. This is why ancient ranges expose deep-seated rocks and why erosion and uplift remain coupled over geological time.",
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
      stem: "Consider the following statements about isostasy:",
      stmts: [
        "Isostasy refers to the state of gravitational equilibrium between the crust and the denser mantle.",
        "The term 'isostasy' was coined by Clarence Dutton in 1889.",
        "The concept emerged from plumb-line deflection anomalies observed during the Great Trigonometric Survey of India.",
        "Isostasy requires that the mantle behaves as a perfectly rigid solid that cannot flow.",
      ],
      opts: ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT. Statement 4 is WRONG — isostasy and rebound require the mantle to behave as a VISCOUS fluid over long timescales (allowing flow), not a perfectly rigid solid. Post-glacial rebound is direct evidence of mantle flow.",
    },
    {
      id: 2, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about Airy's model of isostasy:",
      stmts: [
        "The crust has uniform density but variable thickness.",
        "Higher mountains are underlain by deeper roots.",
        "Crustal blocks float on the substratum like icebergs in water.",
        "Compensation is achieved by varying the density of crustal columns.",
      ],
      opts: ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT and describe Airy's root-based model. Statement 4 describes PRATT's model (variable density), not Airy's. Airy keeps density uniform and varies thickness, producing deep roots beneath high mountains.",
    },
    {
      id: 3, type: "MULTI-STATEMENT",
      stem: "Consider the following statements about Pratt's model of isostasy:",
      stmts: [
        "All crustal columns reach a common level (depth) of compensation.",
        "Density varies inversely with the elevation of the column.",
        "Mountains are explained by columns of lower-density material standing higher.",
        "Higher mountains possess proportionally deeper roots.",
      ],
      opts: ["1, 2 and 3 only", "1 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"],
      correct: 0,
      explain: "Statements 1, 2, 3 are CORRECT for Pratt's density-based model. Statement 4 is WRONG — deep roots beneath higher mountains belong to AIRY's model. Pratt's model has no roots; all columns share a uniform base depth.",
    },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    {
      id: 4, type: "HOW MANY CORRECT",
      stem: "How many of the following (person — contribution) pairs are correctly matched?",
      stmts: [
        "Clarence Dutton — coined the term 'isostasy' (1889)",
        "George Airy — uniform-density, variable-thickness (root) model (1855)",
        "J.H. Pratt — uniform-thickness, variable-density model (1855)",
        "Felix Vening Meinesz — flexural (regional) isostasy with an elastic plate",
      ],
      opts: ["Only two", "Only three", "All four", "Only one"],
      correct: 2,
      explain: "All four pairs are correctly matched. Dutton coined the term (1889), Airy and Pratt gave the two 1855 models, and Vening Meinesz (1931) introduced flexural/regional isostasy. These four names are the standard set tested in UPSC.",
    },
    {
      id: 5, type: "HOW MANY CORRECT",
      stem: "How many of the following statements about post-glacial isostatic rebound are correct?",
      stmts: [
        "Scandinavia (Fennoscandia) is still rising at roughly 1 cm per year.",
        "The Hudson Bay region of Canada also shows ongoing rebound.",
        "Rebound demonstrates that the mantle behaves viscously over long timescales.",
        "Rebound stops instantly the moment the ice melts.",
      ],
      opts: ["Only one", "Only two", "Only three", "All four"],
      correct: 2,
      explain: "Statements 1, 2, 3 are correct (three). Statement 4 is WRONG — rebound continues for thousands of years AFTER the ice melts because the mantle flows back slowly. Scandinavia is still rising ~10,000 years after deglaciation.",
    },
    // TYPE 3: ASSERTION-REASON (2 questions)
    {
      id: 6, type: "ASSERTION-REASON",
      stem: "Assertion (A): In Airy's model, higher mountains are underlain by deeper crustal roots.\n\nReason (R): Since the crust has a uniform density, a taller block must displace more of the denser substratum to float in equilibrium, just as a taller iceberg has a deeper keel.",
      stmts: [],
      opts: [
        "Both A and R true and R is the correct explanation of A",
        "Both A and R true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explain: "Both A and R are true and R correctly explains A. With uniform density, the only way a taller block can stay in buoyant equilibrium is by extending deeper into the substratum (a deeper root) — exactly the iceberg principle.",
    },
    {
      id: 7, type: "ASSERTION-REASON",
      stem: "Assertion (A): Major mountain ranges typically display a negative Bouguer gravity anomaly.\n\nReason (R): A low-density crustal root beneath the mountain produces a mass deficiency at depth that outweighs the mass excess of the topography.",
      stmts: [],
      opts: [
        "Both A and R true and R is the correct explanation of A",
        "Both A and R true but R is NOT the correct explanation of A",
        "A is true but R is false",
        "A is false but R is true",
      ],
      correct: 0,
      explain: "Both A and R are true and R is the correct explanation. The deep low-density root displaces denser mantle, creating a net mass deficiency. This is why isostatically compensated mountains show negative Bouguer anomalies — direct evidence for Airy-type roots.",
    },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    {
      id: 8, type: "NOT / EXCEPTION",
      stem: "Which of the following statements about isostasy is NOT correct?",
      stmts: [],
      opts: [
        "Airy's model uses uniform density and variable crustal thickness.",
        "Pratt's model uses a uniform level of compensation and variable density.",
        "In Pratt's model, higher mountains have deeper roots than lower ones.",
        "Vening Meinesz proposed that the lithosphere supports loads regionally as an elastic plate.",
      ],
      correct: 2,
      explain: "Option (c) is NOT correct. Pratt's model has NO roots — all columns reach a common depth of compensation, and elevation differences arise from density. Deep roots beneath higher mountains is the AIRY model. The other three statements are accurate.",
    },
    {
      id: 9, type: "NOT / EXCEPTION",
      stem: "Which of the following is NOT a correct statement about gravity anomalies and isostasy?",
      stmts: [],
      opts: [
        "Negative Bouguer anomalies over mountains indicate low-density roots at depth.",
        "Positive Bouguer anomalies over oceans indicate thin, dense crust near the mantle.",
        "A region in perfect isostatic balance must show a large positive free-air anomaly.",
        "Departures from isostatic balance can drive ongoing vertical crustal motion.",
      ],
      correct: 2,
      explain: "Option (c) is NOT correct. A region in good isostatic balance tends to show a free-air anomaly close to ZERO, not a large positive one — the subsurface mass deficiency compensates the surface mass. The other three statements are correct.",
    },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    {
      id: 10, type: "SCENARIO / APPLIED",
      stem: "Over millions of years, a high mountain range is heavily eroded and its sediment is carried away to the sea. According to isostatic theory, what happens to the remaining mountain mass?",
      stmts: [],
      opts: [
        "It sinks deeper because it has lost supporting material",
        "It rises (rebounds) because the load on the crust has been reduced",
        "It remains at exactly the same elevation indefinitely",
        "It spreads sideways without any vertical movement",
      ],
      correct: 1,
      explain: "Removing load by erosion causes isostatic REBOUND — the crust rises to restore equilibrium, bringing deeper rocks toward the surface. This compensatory uplift is why erosion and uplift stay coupled and why deep-seated metamorphic rocks become exposed in old ranges.",
    },
    {
      id: 11, type: "SCENARIO / APPLIED",
      stem: "Tide gauges along the Scandinavian coast record that relative sea level is FALLING, even though global mean sea level is rising. What is the most likely explanation?",
      stmts: [],
      opts: [
        "The ocean is draining away from the region",
        "The land is rising due to post-glacial isostatic rebound faster than the sea is rising",
        "The Earth's magnetic field is repelling the water",
        "Evaporation is removing water faster than rivers can replenish it",
      ],
      correct: 1,
      explain: "Scandinavia is rebounding (~1 cm/yr) after the melting of its Ice Age ice sheet. Because the LAND is rising faster than the sea, the RELATIVE sea level falls. This requires separating land motion from ocean change — a direct, real-world application of isostasy.",
    },
    {
      id: 12, type: "SCENARIO / APPLIED",
      stem: "A geophysicist surveying the Himalayas records a strongly negative Bouguer gravity anomaly beneath the range. Which interpretation best fits Airy's model of isostasy?",
      stmts: [],
      opts: [
        "The crust is unusually thin beneath the Himalayas",
        "A deep low-density crustal root underlies the range, creating a mass deficiency at depth",
        "Dense mantle material has intruded close to the surface",
        "The range is not in isostatic equilibrium and is actively sinking",
      ],
      correct: 1,
      explain: "A strong negative Bouguer anomaly signals a low-density root extending deep into the mantle — precisely the Airy interpretation. Seismic data confirm a Himalayan crustal root exceeding ~70 km. Thin crust or shallow dense mantle would give a POSITIVE anomaly.",
    },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    {
      id: 13, type: "MATCH THE PAIRS",
      stem: "Match the scientist with the contribution:\n\n1. Clarence Dutton\n2. George Airy\n3. J.H. Pratt\n4. Felix Vening Meinesz\n\nP. Uniform density, variable thickness (root model)\nQ. Coined the term 'isostasy'\nR. Flexural (regional) isostasy — elastic plate\nS. Uniform compensation depth, variable density",
      stmts: [],
      opts: ["1-Q, 2-P, 3-S, 4-R", "1-P, 2-Q, 3-R, 4-S", "1-Q, 2-S, 3-P, 4-R", "1-R, 2-P, 3-S, 4-Q"],
      correct: 0,
      explain: "1-Q: Dutton coined 'isostasy'. 2-P: Airy = uniform density, variable thickness (roots). 3-S: Pratt = uniform compensation depth, variable density. 4-R: Vening Meinesz = flexural/regional isostasy. Correct option: 1-Q, 2-P, 3-S, 4-R.",
    },
    {
      id: 14, type: "MATCH THE PAIRS",
      stem: "Match the feature with its isostatic interpretation:\n\n1. Himalayan deep crustal root\n2. Indo-Gangetic Plain\n3. Fennoscandia rising ~1 cm/yr\n4. Negative Bouguer anomaly over mountains\n\nP. Flexural foreland basin (load of the Himalayas)\nQ. Post-glacial isostatic rebound\nR. Airy-type compensation by a low-density root\nS. Mass deficiency at depth due to a crustal root",
      stmts: [],
      opts: ["1-R, 2-P, 3-Q, 4-S", "1-P, 2-R, 3-S, 4-Q", "1-R, 2-Q, 3-P, 4-S", "1-S, 2-P, 3-Q, 4-R"],
      correct: 0,
      explain: "1-R: Himalayan root = Airy-type compensation. 2-P: Indo-Gangetic Plain = flexural foreland basin from the Himalayan load. 3-Q: Fennoscandia = post-glacial rebound. 4-S: negative Bouguer anomaly = mass deficiency from the root. Correct option: 1-R, 2-P, 3-Q, 4-S.",
    },
    // TYPE 7: DIRECT RECALL (1 question)
    {
      id: 15, type: "DIRECT RECALL",
      stem: "The model of isostasy which holds that crustal columns have variable density but reach a common 'level of compensation' was proposed by:",
      stmts: [],
      opts: ["George Airy", "J.H. Pratt", "Clarence Dutton", "Felix Vening Meinesz"],
      correct: 1,
      explain: "The variable-density, common-compensation-depth model is PRATT's (1855). Airy proposed the uniform-density, variable-thickness root model; Dutton coined the term 'isostasy'; Vening Meinesz developed flexural isostasy.",
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
      id: 0, paper: "GS-1 • 2021", marks: "15 Marks • 250 Words",
      text: "Compare the Airy and Pratt models of isostasy. How does isostatic adjustment explain post-glacial rebound?",
      framework: [
        "Intro: Define isostasy — gravitational equilibrium of crust floating on the denser mantle (term coined by Dutton 1889; models by Airy & Pratt, 1855)",
        "Body: Airy — uniform density, variable thickness; higher mountains have deeper roots (iceberg analogy); Himalayan root ~70 km",
        "Body: Pratt — uniform compensation depth, variable density; higher columns are less dense; no roots",
        "Body: Comparison table point — Airy varies THICKNESS, Pratt varies DENSITY; both assume local compensation; reality is a combination (plus Vening Meinesz's flexural model)",
        "Body: Post-glacial rebound — ice load depresses crust; on melting, load removed → crust rebounds; Fennoscandia ~1 cm/yr, Hudson Bay; proves mantle viscosity",
        "Conclusion: Isostasy unifies mountain roots, gravity anomalies and rebound into one principle of crustal balance — foundational to geomorphology and sea-level studies",
      ],
    },
    {
      id: 1, paper: "GS-1 • 2015", marks: "10 Marks • 150 Words",
      text: "What is isostasy? Explain its relevance to mountain root systems and to the Indian subcontinent.",
      framework: [
        "Intro: Isostasy = buoyant equilibrium of crustal blocks on the mantle; explains why mountains do not simply sink",
        "Body: Airy's root concept — high mountains supported by deep low-density roots; confirmed by negative Bouguer anomalies",
        "Body: Indian relevance — Himalayan crustal root (~70 km); Indo-Gangetic Plain as a flexural foreland basin (Vening Meinesz)",
        "Body: Dynamic balance — erosion of the Himalayas drives compensatory isostatic uplift, sustaining high relief",
        "Conclusion: Mountain roots and isostatic adjustment make the crust a dynamic, self-balancing system rather than a static load",
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
    { label: "Term Coined", value: "Dutton 1889" },
    { label: "Airy Model", value: "1855" },
    { label: "Pratt Model", value: "1855" },
    { label: "Airy =", value: "Roots" },
    { label: "Pratt =", value: "Density" },
    { label: "Flexural", value: "V. Meinesz" },
    { label: "Himalaya Root", value: "~70 km" },
    { label: "Rebound", value: "~1 cm/yr" },
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
export default function IsostasyPage() {
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
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: HIGH</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            2.5 Isostasy (Airy and Pratt Models)
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
              <a href="/upsc/content-preview/geosynclines"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">2.4 Geosynclines</span><span className="sm:hidden">Prev</span>
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
              <a href="/upsc/content-preview/radioactivity"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">2.6 Radioactivity</span><span className="sm:hidden">Next</span><ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          );
        })()}
      </div>
    </main>
  );
}
