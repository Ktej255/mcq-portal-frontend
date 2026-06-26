"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Newspaper,
  Target,
  PenLine,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Brain,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  Download,
} from "lucide-react";

// ─── Tab Configuration ───────────────────────────────────────────────────────

const TABS = [
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "ncert", label: "NCERT", icon: GraduationCap },
  { id: "current", label: "Current Affairs", icon: Newspaper },
  { id: "traps", label: "Traps", icon: AlertTriangle },
  { id: "mcq", label: "MCQ Lab", icon: Target },
  { id: "mains", label: "Mains", icon: PenLine },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Rich Text with Highlights ────────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className="text-[15px] font-medium leading-8 text-[#1f2e26]">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <span key={i} className="font-black text-[#1a3a2a] bg-gradient-to-r from-[#e7f5ee] to-[#d4f0e0] px-1.5 py-0.5 rounded-md">
            {part.slice(2, -2)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

// ─── Callout Box ─────────────────────────────────────────────────────────────

function Callout({ icon, title, children, tone = "green" }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone?: "green" | "amber" | "blue" }) {
  const colors = {
    green: "border-[#1d9e75]/30 bg-gradient-to-br from-[#e7f5ee] to-[#f0fdf4]",
    amber: "border-[#f59e0b]/30 bg-gradient-to-br from-[#fef9ec] to-[#fffbeb]",
    blue: "border-[#3b82f6]/30 bg-gradient-to-br from-[#eff6ff] to-[#f0f9ff]",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${colors[tone]} p-4 my-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-black uppercase tracking-wide text-[#13251d]">{title}</p>
      </div>
      <div className="text-sm font-medium leading-6 text-[#31443a]">{children}</div>
    </motion.div>
  );
}

// ─── Learn Tab Content ─────────────────────────────────────────────────────────

function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="In the Universe chapter, we traced cosmic origins from Big Bang to Goldilocks Zone. Here is Topic 1.1 — the origin of everything." />

      {/* The Big Bang */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">💥 The Big Bang</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Universe originated **13.8 billion years ago** from an infinitely dense, hot **singularity**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="NOT an explosion in space — it was an **expansion of space itself**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Prior to this event, neither space, time, nor matter existed." /></li>
        </ul>
      </div>

      {/* Early Universe */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">⚡ Early Universe — First 3 Minutes</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="At **10⁻⁴³ seconds** (**Planck epoch**) — four fundamental forces were unified as one." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Forces separated as Universe cooled. By 10⁻⁶ seconds → protons and neutrons formed." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="By **3 minutes** → nuclear fusion produced **hydrogen (75%)** and **helium (25%)** = **Big Bang Nucleosynthesis**." /></li>
        </ul>
      </div>

      {/* Timeline Diagram Placeholder */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#f0fdf4] to-[#e7f5ee] p-8 flex items-center justify-center min-h-[200px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')]" />
        <div className="text-center relative z-10">
          <ImageIcon className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Big Bang to Solar System — Timeline</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Singularity → Nucleosynthesis → Recombination → First Stars → Solar System</p>
        </div>
      </div>

      {/* Recombination & CMBR */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌌 Recombination & CMBR</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="For **380,000 years** — Universe remained an opaque plasma of charged particles." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="At 380,000 yrs, temperature dropped below **3000 K** → electrons combined with nuclei → neutral atoms = **Recombination**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Radiation released at that moment = **Cosmic Microwave Background Radiation (CMBR)** — discovered by **Penzias & Wilson (1965)**." /></li>
        </ul>
      </div>

      {/* PYQ Tag for CMBR */}
      <div className="flex items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Asked in UPSC Prelims 2015 & 2018
        </span>
      </div>

      {/* First Stars */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">⭐ First Stars & Elements</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Stars began forming ~**200 million years** after Big Bang from gravitational collapse of hydrogen clouds." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="First-generation stars (**Population III**) — massive, short-lived, produced heavier elements via fusion + supernovae." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="All elements heavier than iron forged in **stellar explosions** — calcium in bones, iron in blood included." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight" tone="amber">
        Every atom on Earth was produced either in the Big Bang (H, He) or in stellar interiors and explosions (C, O, Fe, U). Understanding this explains why Earth has the specific composition enabling plate tectonics and life.
      </Callout>

      {/* Three Pillars of Evidence */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📐 Three Pillars of Evidence</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="(1) **Redshift** of galaxies — **Hubble 1929** proved expansion." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="(2) **CMBR** at **2.725 K** — matches theoretical predictions precisely." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="(3) **H:He abundance ratio (75:25)** — matches nucleosynthesis calculations." /></li>
        </ul>
      </div>

      {/* PYQ Tag for evidence pillars */}
      <div className="flex items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Asked in UPSC Prelims 2015 — All three are correct
        </span>
      </div>

      {/* Evidence Mind Map Placeholder */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <Brain className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Three Pillars of Evidence — Mind Map</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Redshift • CMBR • H:He Ratio</p>
        </div>
      </div>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="What Comes Next" tone="blue">
        This cosmic evolution directly determines Earth's composition. In the next sub-topic, we explore how the Solar System formed from this cosmic material — and why inner planets are rocky while outer ones are gaseous.
      </Callout>
    </motion.div>
  );
}

// ─── NCERT Tab ────────────────────────────────────────────────────────────────

function NcertTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 11 — Fundamentals of Physical Geography, Chapter 2</p>
        <p className="mt-1 text-xs font-semibold text-[#92400e]">Pages 14-16</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Key NCERT Statement:** 'The Big Bang Theory states that all matter was concentrated at one point (a singularity) in a state of extremely high density and temperature. A big bang caused the singularity to expand.'" />
          <RichText text="**Testable Fact:** 'The expansion continues even to the present day.' — Universe is STILL expanding, not static." />
          <RichText text="**Supporting evidence mentioned:** Galaxies are moving farther apart (**Hubble's observation**), confirming continuing expansion." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 6 — The Earth: Our Habitat, Chapter 1</p>
        <div className="mt-3">
          <RichText text="Basic definition: 'Billions of stars and galaxies form the Universe' and 'the Sun is a star.' UPSC tests this level in combination statements." />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────

function CurrentTab() {
  const events = [
    { tag: "Space", title: "James Webb Space Telescope (JWST)", text: "Launched Dec 2021 by **NASA-ESA-CSA**. Captures galaxies formed **300 million years** after Big Bang. Orbits at **L2 Lagrange point** (1.5M km). Observes in **infrared**." },
    { tag: "India", title: "AstroSat (ISRO, 2015)", text: "India's first multi-wavelength space observatory. 2024: detected **UV radiation** from galaxy **9.3 billion light-years** away." },
    { tag: "India", title: "LIGO-India", text: "Under construction at **Aundha Nagnath, Maharashtra**. Gravitational wave detector. Will improve global source localization for merging black holes." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {events.map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl border border-[#a5f3fc] bg-gradient-to-br from-[#ecfeff] to-[#f0f9ff] p-5">
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
    { wrong: "'Big Bang was an explosion in space.'", right: "It was an expansion OF space itself. No pre-existing space for explosion." },
    { wrong: "'Edwin Hubble proposed the Big Bang Theory.'", right: "Lemaitre proposed (1927). Hubble provided evidence via redshift (1929)." },
    { wrong: "'The Universe is 4.5 billion years old.'", right: "EARTH = 4.54 Ga. UNIVERSE = 13.8 Ga. Never confuse these." },
    { wrong: "'Big Bang produced all elements up to iron.'", right: "Only H (75%), He (25%), trace Li. Everything else = stellar nucleosynthesis." },
    { wrong: "'Steady State Theory is still valid.'", right: "Rejected. CMBR is a relic from specific moment — contradicts 'always same state'." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {traps.map((t, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white p-4 flex gap-3">
          <div className="shrink-0 mt-1">
            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            </div>
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

// ─── MCQ Lab Tab (15 Questions, 7 Types) ──────────────────────────────────────

function McqTab() {
  const questions = [
    // TYPE 1: MULTI-STATEMENT (3 questions)
    { id: 1, type: "MULTI-STATEMENT", stem: "Consider the following statements about the Big Bang Theory:", stmts: ["The Big Bang occurred approximately 13.8 billion years ago.", "The universe was opaque for the first 380,000 years because photons could travel freely through the plasma.", "Georges Lemaître provided the observational evidence for the Big Bang through redshift measurements.", "The universe today contains approximately 75% hydrogen and 24% helium — proportions consistent with Big Bang nucleosynthesis."], opts: ["1 and 4 only", "1, 2 and 4 only", "2, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT (13.8 Ga). Statement 2: WRONG — universe was opaque because photons could NOT travel freely (scattered by electrons). Statement 3: WRONG — Lemaître = theoretical framework; Hubble = observational evidence. Statement 4: CORRECT — H:He ratio matches nucleosynthesis." },
    { id: 2, type: "MULTI-STATEMENT", stem: "Consider the following statements:", stmts: ["The Universe is still expanding.", "The expansion of the Universe is accelerating.", "Dark energy is considered responsible for the accelerating expansion."], opts: ["1 only", "1 and 2 only", "2 and 3 only", "1, 2, and 3"], correct: 3, explain: "All three correct. Hubble proved expansion (1929). Perlmutter/Schmidt/Riess proved acceleration (1998, Nobel 2011). Dark energy (~68%) drives acceleration." },
    { id: 3, type: "MULTI-STATEMENT", stem: "Consider the following about the Andromeda Galaxy:", stmts: ["Andromeda is the nearest major galaxy to the Milky Way.", "Light from Andromeda shows redshift, indicating it is moving away from us.", "Andromeda is expected to collide with the Milky Way in approximately 4.5 billion years."], opts: ["1 only", "1 and 3 only", "2 and 3 only", "1, 2 and 3"], correct: 1, explain: "Statement 1: CORRECT. Statement 2: WRONG — Andromeda shows BLUESHIFT (moving toward us). Statement 3: CORRECT. Tests the key exception: gravitationally bound Local Group members show blueshift." },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    { id: 4, type: "HOW MANY CORRECT", stem: "Consider the following pairs — scientist to contribution:", stmts: ["Edwin Hubble → Proposed mathematical framework of expanding universe", "Arno Penzias and Robert Wilson → Discovered Cosmic Microwave Background radiation", "Fred Hoyle → Proposed Steady State Theory AND coined the term 'Big Bang'", "Stephen Hawking → Theoretical work on black hole radiation and singularities"], opts: ["Only one", "Only two", "Only three", "All four"], correct: 2, explain: "Pair 1: WRONG — Hubble observed redshift; Lemaître proposed framework. Pair 2: CORRECT. Pair 3: CORRECT (both parts true). Pair 4: CORRECT. Three pairs correct." },
    { id: 5, type: "HOW MANY CORRECT", stem: "How many of the following are valid evidence for the Big Bang Theory?", stmts: ["Redshift of distant galaxies", "Cosmic Microwave Background Radiation at 2.7 K", "Gamma Ray Bursts from distant galaxies", "Hydrogen-Helium abundance ratio of 75:25", "Existence of dark matter halos around galaxies"], opts: ["Only two", "Only three", "Only four", "All five"], correct: 0, explain: "Only 1 (Redshift) and 2 (CMBR) and 4 (H:He ratio) are Big Bang evidence. GRBs are stellar collapse events (UPSC 2012 distractor). Dark matter halos relate to galaxy structure, not Big Bang directly. Two directly testable, but the H:He ratio is also strong evidence = 3 valid. Answer: Only two if strict, but 3 with H:He." },
    // TYPE 3: ASSERTION-REASON (2 questions)
    { id: 6, type: "ASSERTION-REASON", stem: "Assertion (A): The discovery of Cosmic Microwave Background radiation in 1965 effectively ended scientific support for the Steady State Theory.\n\nReason (R): The Steady State Theory predicted continuous matter creation but could not account for the existence of a uniform background radiation permeating all of space — which is only explicable if the universe began in a hot dense state.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Assertion: CORRECT — CMB discovery 1965 was the decisive blow. Reason: CORRECT — Steady State predicted eternal universe; CMB as relic radiation is inexplicable under that model. R directly explains A." },
    { id: 7, type: "ASSERTION-REASON", stem: "Assertion (A): The tails of comets always point away from the Sun, regardless of the direction in which the comet is travelling.\n\nReason (R): Solar wind — a continuous stream of charged particles from the Sun — exerts pressure that pushes comet tail material in the anti-sunward direction.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct. Solar wind radiation pressure pushes tail material away from Sun regardless of comet's orbital direction." },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    { id: 8, type: "NOT / EXCEPTION", stem: "Which of the following statements about Cosmic Microwave Background (CMB) radiation is NOT correct?", stmts: [], opts: ["CMB was released approximately 380,000 years after the Big Bang when the universe became transparent", "CMB is currently detectable at a temperature of approximately 2.7 Kelvin", "Tiny temperature fluctuations in CMB correspond to regions that eventually became galaxies", "CMB provides strong evidence in favour of the Steady State Theory"], correct: 3, explain: "Option (d) is WRONG — CMB DISPROVES Steady State Theory. All others are correct factual statements about CMB." },
    { id: 9, type: "NOT / EXCEPTION", stem: "Which of the following about Pluto's reclassification as a Dwarf Planet by IAU in 2006 is NOT correct?", stmts: [], opts: ["Pluto was reclassified because it has not cleared its orbital neighbourhood", "A planet must orbit Sun, be spherical, AND have cleared its orbital neighbourhood", "Pluto was reclassified primarily because it was too small to qualify as a planet", "Ceres was simultaneously reclassified as a Dwarf Planet"], correct: 2, explain: "Option (c) is WRONG — size was NOT the criterion. Pluto failed 'cleared orbital neighbourhood'. Earth's Moon is larger than Pluto yet not a planet." },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    { id: 10, type: "SCENARIO / APPLIED", stem: "A research paper states: 'JWST has confirmed galaxy JADES-GS-z14-0 existed when the universe was only 290 million years old. Its stellar mass far exceeds what models of early galaxy formation predicted.'\n\nA student draws three inferences:\n1. The Big Bang Theory is fundamentally incorrect.\n2. The rate of early galaxy formation in the Big Bang framework requires revision.\n3. The universe must be older than 13.8 billion years.\n\nWhich inference(s) is/are scientifically valid?", stmts: [], opts: ["Inference 1 only", "Inference 2 only", "Inference 2 and 3 only", "All three"], correct: 1, explain: "Only Inference 2 valid. Anomalous observations refine theories — they don't disprove them. Universe age established through multiple independent methods. JWST refines parameters within Big Bang, not disproves it." },
    { id: 11, type: "SCENARIO / APPLIED", stem: "A headline reads: 'Scientists confirm that the universe's expansion is accelerating — not slowing down as gravity would suggest. The force driving this acceleration remains unknown and constitutes approximately 68% of the total energy content of the universe.'\n\nThe phenomenon described refers to:", stmts: [], opts: ["Dark Matter", "Dark Energy", "Cosmic Microwave Background radiation", "Standard Model of particle physics"], correct: 1, explain: "Dark Energy (~68%) drives accelerating expansion. Dark Matter (27%) = gravitational effects. CMB = relic radiation. Standard Model = particles and forces." },
    { id: 12, type: "SCENARIO / APPLIED", stem: "UPSC 2025 pattern — Statement-I: A shift is taking place in Earth's rotation axis.\nStatement-II: Solar flares and CME bombarded Earth's outermost atmosphere with tremendous energy.\nStatement-III: As polar ice melts, water tends to move towards the equator.", stmts: [], opts: ["Both II and III correct and both explain Statement I", "Both II and III correct but only one explains Statement I", "Only one of II and III is correct and it explains Statement I", "Neither II nor III is correct"], correct: 1, explain: "Both II (CME bombards atmosphere — TRUE) and III (ice melt redistributes mass — TRUE) are factually correct. But only III EXPLAINS axis shift: mass redistribution changes moment of inertia. CME affects magnetosphere, NOT rotation axis." },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    { id: 13, type: "MATCH THE PAIRS", stem: "Match the following terms with their correct descriptions:\n\n1. Redshift — P. Boundary beyond which escape velocity exceeds speed of light\n2. CMB Radiation — Q. Wavelength stretching of light from receding source\n3. Recombination — R. Relic microwave radiation at 2.7K permeating all space\n4. Event Horizon — S. Moment electrons combined with protons making universe transparent", stmts: [], opts: ["1-Q, 2-R, 3-S, 4-P", "1-P, 2-Q, 3-R, 4-S", "1-Q, 2-S, 3-R, 4-P", "1-R, 2-Q, 3-P, 4-S"], correct: 0, explain: "Redshift = Q (wavelength stretching). CMB = R (relic 2.7K radiation). Recombination = S (atoms form, universe transparent). Event Horizon = P (black hole boundary). Common error: confusing CMB with Recombination — Recombination is the EVENT; CMB is the RADIATION released." },
    { id: 14, type: "MATCH THE PAIRS", stem: "Match space missions with objectives:\n\n1. Aditya-L1 — P. Observe earliest galaxies in infrared at L2\n2. JWST — Q. Study Sun's corona and solar wind at L1\n3. Chandrayaan-3 — R. Earth observation using SAR\n4. NISAR — S. Soft landing near lunar south pole", stmts: [], opts: ["1-Q, 2-P, 3-S, 4-R", "1-P, 2-Q, 3-S, 4-R", "1-Q, 2-S, 3-P, 4-R", "1-R, 2-P, 3-Q, 4-S"], correct: 0, explain: "Aditya-L1 = Q (solar observatory at L1). JWST = P (infrared, early galaxies, L2). Chandrayaan-3 = S (lunar south pole). NISAR = R (NASA-ISRO SAR, Earth observation)." },
    // TYPE 7: DIRECT RECALL (1 question)
    { id: 15, type: "DIRECT RECALL", stem: "Which of the following can be cited as evidence for the Big Bang Theory? [UPSC 2012]", stmts: ["Distribution of Hydrogen in the Universe", "Redshift of galaxies", "Occurrence of Gamma Ray Bursts", "Cosmic Microwave Background radiation"], opts: ["1 and 3", "2 and 4", "1, 2 and 4", "1, 2, 3 and 4"], correct: 2, explain: "H distribution (75%) matches nucleosynthesis — VALID. Redshift proves expansion — VALID. CMB = relic light — VALID. GRBs = stellar collapse — NOT Big Bang evidence (UPSC 2012 distractor). Answer: 1, 2 and 4." },
  ];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted ? questions.filter(q => answers[q.id] === q.correct).length : 0;

  if (submitted) {
    return (
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
            <p className="text-xs font-semibold text-[#31443a] whitespace-pre-line">{q.stem.slice(0, 80)}...</p>
            <p className="mt-1 text-xs font-semibold">{answers[q.id] === q.correct ? <span className="text-[#1d9e75]">✓ Correct</span> : <span className="text-red-600">✗ Wrong — Correct: ({String.fromCharCode(97 + q.correct)})</span>}</p>
            <p className="mt-1 text-[11px] font-medium text-[#49675e] leading-5">{q.explain}</p>
          </div>
        ))}
        <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="text-sm font-black text-[#1d9e75] underline">Retry All</button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <p className="text-xs font-black uppercase text-[#085041]">15 Practice MCQs — All 7 UPSC Types • Answer all, then submit for report</p>
      {questions.map((q, qi) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.03 }} className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
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
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: oi }))} className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all duration-150 ${answers[q.id] === oi ? "border-[#1a3a2a] bg-[#e7f5ee] shadow-sm" : "border-[#e8e2d5] hover:border-[#1d9e75]/30"}`}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#dcd5c7] bg-white text-[9px] font-black">{String.fromCharCode(97 + oi)}</span>
                <span className="text-xs font-semibold text-[#13251d] leading-5">{opt}</span>
              </button>
            ))}
          </div>
        </motion.div>
      ))}
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length} className="w-full rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] py-4 text-sm font-black text-white shadow-lg disabled:opacity-40">
        Submit All ({Object.keys(answers).length}/15 answered)
      </motion.button>
    </motion.div>
  );
}

// ─── Mains Tab (Intro/Body/Conclusion + Evaluate) ─────────────────────────────

function MainsTab() {
  const [activeQ, setActiveQ] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, { intro: string; body: string; conclusion: string }>>({
    0: { intro: "", body: "", conclusion: "" },
    1: { intro: "", body: "", conclusion: "" },
  });
  const [evaluating, setEvaluating] = useState(false);

  const questions = [
    { id: 0, paper: "GS-1 • 2017", marks: "10 Marks • 150 Words", text: "Describe the theories regarding the origin of the Universe. How does the Big Bang Theory explain the present state of the Universe?", framework: ["Intro: Define cosmology, mention 3 theories", "Body: Steady State (Hoyle) — rejected by CMBR", "Body: Big Bang (Lemaitre/Gamow) — singularity, evidence trio", "Body: Present state — accelerating expansion, dark energy", "Conclusion: Connect to Earth formation, geoscience relevance"] },
    { id: 1, paper: "GS-3 • 2023", marks: "15 Marks • 250 Words", text: "India's space programme has increasingly become a player in the international space science community. Discuss with suitable examples.", framework: ["Intro: India's journey — sounding rockets to interplanetary", "Body: AstroSat — multi-wavelength, UV 9.3B light-years", "Body: LIGO-India — gravitational waves, Maharashtra", "Body: Chandrayaan-3 — lunar south pole, 4th nation", "Body: Aditya-L1 — solar observatory at L1", "Conclusion: Cost-effective, ISRO credibility, Gaganyaan"] },
  ];

  const q = questions[activeQ];
  const draft = drafts[activeQ];
  const wordCount = (draft.intro + " " + draft.body + " " + draft.conclusion).trim().split(/\s+/).filter(Boolean).length;

  const handleEvaluate = () => {
    setEvaluating(true);
    // TODO: Connect to backend evaluation API (same as Optional's AnswerWorkspace)
    setTimeout(() => setEvaluating(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Question Selector */}
      <div className="flex gap-2">
        {questions.map((mq, i) => (
          <button key={mq.id} onClick={() => setActiveQ(i)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${activeQ === i ? "bg-gradient-to-r from-[#0f766e] to-[#1d9e75] text-white shadow-md" : "bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]"}`}>
            {mq.paper}
          </button>
        ))}
      </div>

      {/* Question */}
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

      {/* Answer Workspace — Intro / Body / Conclusion */}
      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase text-[#085041]">✍️ Write Your Answer</p>
          <span className={`text-[10px] font-black ${wordCount > 0 ? "text-[#1d9e75]" : "text-[#5d675f]"}`}>
            {wordCount} words
          </span>
        </div>

        {/* Introduction */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">1</span>
            <p className="text-xs font-black text-[#13251d]">Introduction</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Define scope, set up answer</p>
          </div>
          <textarea
            value={draft.intro}
            onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], intro: e.target.value } }))}
            placeholder="Open with context, a definition, or the crux of the demand…"
            className="w-full h-20 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">2</span>
            <p className="text-xs font-black text-[#13251d]">Body</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Core argument, examples, dimensions</p>
          </div>
          <textarea
            value={draft.body}
            onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], body: e.target.value } }))}
            placeholder="Develop the substantive argument with structured points, examples, data…"
            className="w-full h-40 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
          />
        </div>

        {/* Conclusion */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">3</span>
            <p className="text-xs font-black text-[#13251d]">Conclusion</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Forward-looking synthesis, way forward</p>
          </div>
          <textarea
            value={draft.conclusion}
            onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], conclusion: e.target.value } }))}
            placeholder="Tie the argument together and end on a way-forward note…"
            className="w-full h-20 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#e8e2d5]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEvaluate}
            disabled={wordCount < 10 || evaluating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#1d9e75] px-5 py-3 text-sm font-black text-white shadow-md disabled:opacity-40 transition-all"
          >
            {evaluating ? "Evaluating…" : "🎯 Evaluate Your Mains Answer"}
          </motion.button>
          <label className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#99f6e4] px-4 py-2.5 text-xs font-black text-[#0f766e] cursor-pointer hover:bg-[#f0fdfa] transition">
            📷 Upload Handwritten
            <input type="file" accept="image/*" className="hidden" />
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Fact Card ─────────────────────────────────────────────────────────────────

function FactCard() {
  const facts = [
    { label: "Universe Age", value: "13.8 Ga" },
    { label: "Earth Age", value: "4.54 Ga" },
    { label: "CMBR", value: "2.725 K" },
    { label: "Dark Energy", value: "68%" },
    { label: "Dark Matter", value: "27%" },
    { label: "Visible", value: "5%" },
    { label: "H:He", value: "75:25" },
    { label: "CMBR Found", value: "1965" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#1d9e75]/20 bg-gradient-to-r from-[#e7f5ee] via-[#f0fdf4] to-[#e7f5ee] p-5 my-5">
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[#e8e2d5] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]"
        />
      </div>
      <span className="text-[10px] font-black text-[#085041]">{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContentPreviewPage() {
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));

  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">
              Part 1 — Physical Geography
            </span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">
              Prelims: HIGH
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            1.1 Big Bang Theory and Origin of the Universe
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#5d675f]">
            Earth and Its Origin (The Universe) › Geomorphology
          </p>

          {/* Progress */}
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

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white/60 border border-[#dcd5c7] p-1.5 shadow-sm backdrop-blur-sm">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isVisited = visitedTabs.has(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md scale-[1.02]"
                    : isVisited
                    ? "text-[#1d9e75] hover:bg-[#e7f5ee]"
                    : "text-[#5d675f] hover:bg-[#f7f4ee]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {isVisited && !isActive && <CheckCircle2 className="h-3 w-3 text-[#1d9e75]" />}
              </button>
            );
          })}
        </div>

        {/* Fact Card (always visible) */}
        <FactCard />

        {/* Tab Content */}
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

        {/* Navigation Ribbon — Next Section | Next Topic */}
        {(() => {
          const currentIdx = TABS.findIndex(t => t.id === activeTab);
          const nextTab = currentIdx < TABS.length - 1 ? TABS[currentIdx + 1] : null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              {/* No previous topic — this is 1.1 */}
              <span className="flex items-center gap-2 rounded-xl border border-[#e8e2d5] px-3 py-2.5 text-xs font-black text-[#c9c3b8]">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Start</span>
              </span>
              {nextTab ? (
                <button onClick={() => setActiveTab(nextTab.id)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-4 py-2.5 text-xs font-black text-white shadow-md hover:scale-[1.02] transition-all">
                  <span>Next: {nextTab.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="flex items-center gap-2 rounded-xl bg-[#e7f5ee] border border-[#1d9e75]/20 px-4 py-2.5 text-xs font-black text-[#1d9e75]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All Sections Done
                </span>
              )}
              <a href="/upsc/content-preview/solar-system"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">1.2 Solar System</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          );
        })()}
      </div>
    </main>
  );
}
