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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${colors[tone]} p-4 my-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-black uppercase tracking-wide text-[#13251d]">{title}</p>
      </div>
      <div className="text-sm font-medium leading-6 text-[#31443a]">{children}</div>
    </motion.div>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────────────────────

function LearnTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <RichText text="We traced our cosmic address through galaxies. Now we zoom in to understand what makes Earth uniquely habitable among all planets in all these galaxies." />

      {/* Earth Basics */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌍 EARTH BASICS</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**3rd planet** from the Sun, orbiting at **150 million km** (**1 AU**)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Diameter **12,742 km** — the **densest planet** in the Solar System at **5.51 g/cm³**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Density enables it to retain substantial atmosphere, drive plate tectonics, maintain liquid iron core." /></li>
        </ul>
      </div>

      {/* Goldilocks Zone */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🎯 GOLDILOCKS ZONE</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Also called the **Circumstellar Habitable Zone** — orbital region where **liquid water** can exist." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Venus** too close → runaway greenhouse → surface **460°C**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Mars** too far → thin atmosphere → frozen surface. Earth sits perfectly in between." /></li>
        </ul>
      </div>

      {/* Atmosphere */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">💨 ATMOSPHERE</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Composition: **78% N₂**, **21% O₂**, **1% Ar**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Free O₂ is **biological** — produced after **Great Oxidation Event ~2.5 Ga** by photosynthesis." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Without life, atmosphere would be **CO₂-dominated** like Venus and Mars." /></li>
        </ul>
      </div>

      {/* Magnetic Field */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🧲 MAGNETIC FIELD</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Generated by the **geodynamo** in the **liquid iron outer core**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Creates **magnetosphere** that deflects **solar wind** — protects atmosphere from being stripped." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Mars lost its field** → lost atmosphere. ISRO's **Aditya-L1** studies solar wind interactions." /></li>
        </ul>
      </div>

      {/* Plate Tectonics */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌋 PLATE TECTONICS</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Unique to Earth** among known planets." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Carbonate-silicate cycle** regulates atmospheric **CO₂** over geological timescales." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Without it → either **Venus** (extreme greenhouse) or **Snowball Earth** (global glaciation)." /></li>
        </ul>
      </div>

      {/* Moon Stabilisation */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌙 MOON STABILISATION</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Stabilises Earth's **axial tilt** at **23.5°** (varies only **± 1.3°** over 41,000-year Milankovitch cycle)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Without Moon → chaotic tilt **0°–85°** causing extreme climate instability." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Mars** shows this instability — no large stabilising moon." /></li>
        </ul>
      </div>

      {/* Jupiter Shield */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🪐 JUPITER SHIELD</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Acts as cosmic shield — deflects **asteroids/comets** from inner Solar System via immense gravity." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Rare Earth Hypothesis** (Ward & Brownlee, **2000**) — convergence of all factors makes complex life extraordinarily rare." /></li>
        </ul>
      </div>

      {/* Habitable Zone Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#f0fdf4] to-[#e7f5ee] p-8 flex items-center justify-center min-h-[200px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')]" />
        <div className="text-center relative z-10">
          <ImageIcon className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Habitable Zone Cross-Section</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Venus (too hot) • Earth (just right) • Mars (too cold) • Goldilocks Zone boundaries</p>
        </div>
      </div>

      {/* PYQ Tags */}
      <div className="flex flex-wrap items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Habitability factors tested in UPSC Prelims 2018
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Earth properties tested in UPSC Prelims 2020
        </span>
      </div>

      {/* Earth's Protective Systems Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <Brain className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Earth&apos;s Protective Systems</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Magnetosphere • Atmosphere • Plate Tectonics • Moon Stabilisation • Jupiter Shield</p>
        </div>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight" tone="amber">
        Earth&apos;s habitability is NOT determined by distance from the Sun alone. It requires the convergence of multiple independent factors — magnetic field, plate tectonics, atmospheric composition, Moon stabilisation, and Jupiter&apos;s gravitational shielding. Any single factor missing could render Earth uninhabitable.
      </Callout>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="What Comes Next" tone="blue">
        The Moon plays a critical role in Earth&apos;s habitability — stabilising axial tilt and driving tides. In the next topic, we explore the Moon&apos;s origin (Giant Impact Hypothesis), its influence on Earth, and India&apos;s Chandrayaan missions.
      </Callout>
    </motion.div>
  );
}

// ─── NCERT Tab ────────────────────────────────────────────────────────────────

function NcertTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 6 — The Earth: Our Habitat, Chapter 1</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Key NCERT Statement:** Earth is 'neither too hot nor too cold, has water and air' — this is the foundation of the Goldilocks concept. NCERT establishes the basic habitability factors at the simplest level for Class 6 students." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 11 — Fundamentals of Physical Geography, Chapter 2</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Testable Concept:** Differentiation of early Earth led to a **layered structure** — dense iron sinking to form the core, lighter silicates rising to form the mantle and crust. This layering produced both the **magnetic field** (liquid outer core) and **plate tectonics** (convecting mantle)." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 11 — Fundamentals of Physical Geography, Chapter 3</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Key Mechanism:** Internal heat drives **mantle convection** which powers **plate tectonics** which regulates **climate** through the carbonate-silicate cycle. This chain — heat → convection → tectonics → CO₂ regulation — is the critical link between Earth's interior and surface habitability." />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────

function CurrentTab() {
  const events = [
    { tag: "🌍 Space", title: "NASA Perseverance Rover — Mars Biosignatures", text: "**Perseverance** is exploring **Jezero Crater** on Mars, an ancient lake bed ideal for preserving **biosignatures**. The rover collects samples for the **Mars Sample Return** mission (~**2033**). Findings so far include organic molecules and evidence of past water — but NO confirmed life. Understanding Mars helps us appreciate what Earth has that Mars lacks." },
    { tag: "🌍 Space", title: "Europa Clipper — Subsurface Ocean (Oct 2024)", text: "NASA launched **Europa Clipper** in **October 2024** to study Jupiter's moon Europa, which harbours a **subsurface ocean** containing approximately **2× Earth's water**. The mission will assess Europa's habitability by studying ice shell thickness, ocean chemistry, and potential hydrothermal vents — testing whether habitability extends beyond the traditional Goldilocks Zone." },
    { tag: "🇮🇳 India", title: "Chandrayaan-3 — South Pole Landing (Aug 2023)", text: "**Chandrayaan-3** successfully landed near the **lunar south pole** in **August 2023**, making India the **first country** to achieve a soft landing at the south pole. The Pragyan rover detected **sulphur** and other elements. This mission demonstrates India's growing capability in planetary exploration and provides data on the Moon that stabilises Earth's habitability." },
    { tag: "🌍 Climate", title: "IPCC AR6 — Climate Change Overwhelming Natural Thermostat", text: "The **IPCC Sixth Assessment Report** confirms that human-caused **CO₂ emissions** are overwhelming Earth's natural **carbonate-silicate thermostat** (plate tectonics cycle). The natural cycle operates over millions of years; human emissions are changing climate in decades. This directly tests the 'plate tectonics regulates climate' concept against current reality." },
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
    { wrong: "'Earth is habitable because of its distance from the Sun alone.'", right: "INCOMPLETE. Distance places Earth in the habitable zone, but habitability requires MULTIPLE factors — magnetic field, plate tectonics, atmosphere, Moon stabilisation, Jupiter shielding. Venus is in the habitable zone too but is uninhabitable due to lack of other factors." },
    { wrong: "'Earth always had oxygen in its atmosphere.'", right: "WRONG. Early Earth's atmosphere was reducing (CO₂, N₂, water vapour, NO free O₂). Free oxygen appeared only after the Great Oxidation Event ~2.5 Ga, produced biologically by cyanobacteria. Oxygen is a BIOSIGNATURE, not a primordial atmospheric component." },
    { wrong: "'The Moon was captured by Earth's gravity.'", right: "WRONG. The accepted model is the Giant Impact Hypothesis — a Mars-sized body (Theia) collided with proto-Earth ~4.5 Ga, ejecting debris that coalesced into the Moon. Capture hypothesis fails to explain Moon's composition similarity to Earth's mantle." },
    { wrong: "'Mars has no atmosphere.'", right: "WRONG. Mars HAS an atmosphere — it is just very thin (~1% of Earth's surface pressure) and composed of ~95% CO₂. Mars lost most of its atmosphere because it lost its magnetic field, allowing solar wind to strip it away over billions of years." },
    { wrong: "'Being in the habitable zone means a planet is definitely habitable.'", right: "WRONG. The habitable zone only defines where liquid water COULD exist on the surface. Actual habitability also requires an atmosphere (right pressure and composition), magnetic field (to retain atmosphere), plate tectonics (for climate regulation), and other factors. Venus is in the habitable zone but is uninhabitable." },
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
    { id: 1, type: "MULTI-STATEMENT", stem: "Consider the following statements about Earth's habitability:", stmts: ["Earth's position in the Goldilocks Zone allows liquid water to exist on its surface.", "The Moon stabilises Earth's axial tilt, preventing extreme climate variations.", "Plate tectonics regulates atmospheric CO₂ through the carbonate-silicate cycle.", "Earth's magnetic field is generated by convection in the solid inner core."], opts: ["1, 2 and 3 only", "1 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — Goldilocks Zone = liquid water possible. Statement 2: CORRECT — Moon prevents chaotic tilt (0°–85° without it). Statement 3: CORRECT — tectonics recycles CO₂ over geological time. Statement 4: WRONG — magnetic field comes from the LIQUID OUTER core (geodynamo), NOT the solid inner core." },
    { id: 2, type: "MULTI-STATEMENT", stem: "Consider the following statements about Earth's atmosphere:", stmts: ["Nitrogen constitutes approximately 78% of Earth's atmosphere.", "Free oxygen in the atmosphere is primarily of biological origin.", "Earth's atmosphere has always had the same composition since formation.", "Without life, Earth's atmosphere would likely be CO₂-dominated like Venus and Mars."], opts: ["1, 2 and 4 only", "1 and 2 only", "1, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — 78% N₂. Statement 2: CORRECT — O₂ from photosynthetic organisms after Great Oxidation Event. Statement 3: WRONG — early atmosphere was very different (reducing, no O₂). Statement 4: CORRECT — abiotic equilibrium would be CO₂-dominated." },
    { id: 3, type: "MULTI-STATEMENT", stem: "Consider the following about comparative planetology:", stmts: ["Venus suffers from a runaway greenhouse effect with surface temperatures around 460°C.", "Mars lost its atmosphere primarily because it lost its magnetic field.", "Jupiter protects inner planets by deflecting asteroids and comets through its gravity.", "All rocky planets in the Solar System have active plate tectonics."], opts: ["1, 2 and 3 only", "1 and 2 only", "1, 2 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — Venus ~460°C from runaway greenhouse. Statement 2: CORRECT — no magnetic field → solar wind stripped atmosphere. Statement 3: CORRECT — Jupiter's gravity deflects potential impactors. Statement 4: WRONG — plate tectonics is UNIQUE to Earth among known planets." },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    { id: 4, type: "HOW MANY CORRECT", stem: "How many of the following are necessary conditions for a planet to be in the habitable zone?", stmts: ["Orbital distance allows liquid water on the surface.", "Planet must have active plate tectonics.", "Planet must have a magnetic field.", "Star must be stable enough for long-duration habitability.", "Planet must have a large natural satellite."], opts: ["Only one", "Only two", "Only three", "Only four"], correct: 0, explain: "Only Statement 1 defines the habitable ZONE specifically (distance where liquid water is possible). Statements 2-5 are factors for actual habitability but NOT for defining the habitable zone itself. The habitable zone is purely a distance-based concept. Only one is correct for the zone definition." },
    { id: 5, type: "HOW MANY CORRECT", stem: "How many of the following are unique properties of Earth compared to other planets in the Solar System?", stmts: ["Active plate tectonics with recycling of crustal material", "Presence of liquid water on the surface", "A geodynamo-generated magnetic field strong enough to protect the atmosphere", "A large Moon that stabilises axial tilt within narrow limits", "An oxygen-rich atmosphere produced by biological activity"], opts: ["Only two", "Only three", "Only four", "All five"], correct: 3, explain: "ALL five are unique to Earth in our Solar System. No other planet has active plate tectonics, surface liquid water, a protective magnetic field (Mars lost it, Venus never had a strong one), a large stabilising moon, or a biologically-produced O₂ atmosphere. All five correct." },
    // TYPE 3: ASSERTION-REASON (2 questions)
    { id: 6, type: "ASSERTION-REASON", stem: "Assertion (A): Earth's magnetic field is essential for maintaining a habitable atmosphere.\n\nReason (R): The magnetosphere deflects solar wind particles that would otherwise strip away atmospheric gases over geological time.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct and R explains A. Mars demonstrates the causal link — it lost its magnetic field ~4 Ga ago, and solar wind subsequently stripped most of its atmosphere, leaving it thin (~1% of Earth's). The magnetosphere directly prevents this atmospheric loss mechanism." },
    { id: 7, type: "ASSERTION-REASON", stem: "Assertion (A): Plate tectonics plays a crucial role in maintaining Earth's long-term climate stability.\n\nReason (R): The carbonate-silicate cycle, driven by plate tectonics, acts as a natural thermostat regulating atmospheric CO₂ over millions of years.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct and R explains A. When temperatures rise → more weathering → more CO₂ removed → cooling. When temperatures fall → less weathering → CO₂ accumulates from volcanoes → warming. Plate tectonics drives volcanism (CO₂ source) and mountain building (weathering enhancement). The cycle IS the mechanism." },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    { id: 8, type: "NOT / EXCEPTION", stem: "Which of the following statements about Earth is NOT correct?", stmts: [], opts: ["Earth is the densest planet in the Solar System at 5.51 g/cm³", "Earth's axial tilt varies between 22.1° and 24.5° over 41,000 years", "Earth's atmosphere has been oxygen-rich since the planet formed 4.5 billion years ago", "Earth's magnetic field is generated by convection in the liquid iron outer core"], correct: 2, explain: "Option (c) is WRONG — Earth's atmosphere was NOT oxygen-rich at formation. Early atmosphere was reducing (CO₂, N₂, H₂O vapour). Free O₂ appeared only after the Great Oxidation Event ~2.5 Ga, caused by cyanobacteria. All other statements are correct." },
    { id: 9, type: "NOT / EXCEPTION", stem: "Which of the following is NOT a factor contributing to Earth's habitability according to the Rare Earth Hypothesis?", stmts: [], opts: ["Presence of Jupiter deflecting asteroids from the inner Solar System", "Earth's position in the Goldilocks Zone of the Sun", "Earth's proximity to a supermassive black hole", "Stabilisation of Earth's axial tilt by the Moon"], correct: 2, explain: "Option (c) is WRONG — proximity to a supermassive black hole is NOT a habitability factor; in fact, proximity to active galactic nuclei would be harmful due to radiation. Earth is far from the Milky Way's central black hole. All other options (Jupiter shield, Goldilocks Zone, Moon stabilisation) are core Rare Earth Hypothesis factors." },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    { id: 10, type: "SCENARIO / APPLIED", stem: "A news report states: 'NASA's Perseverance rover has detected organic molecules in Jezero Crater sediments, but scientists caution this does not confirm past life on Mars.'\n\nA student makes three inferences:\n1. Organic molecules can be produced by both biological and non-biological processes.\n2. Jezero Crater was chosen because it was an ancient lake bed likely to preserve biosignatures.\n3. The finding confirms that Mars once had conditions identical to Earth.\n\nWhich inference(s) is/are valid?", stmts: [], opts: ["1 and 2 only", "2 and 3 only", "1 only", "1, 2 and 3"], correct: 0, explain: "Inference 1: CORRECT — organic molecules can form abiotically (meteorites, volcanic processes). Inference 2: CORRECT — Jezero is an ancient lake delta, ideal for preserving biosignatures. Inference 3: WRONG — organic molecules ≠ identical conditions to Earth; Mars had SOME liquid water but lacked many other Earth-like conditions (magnetic field, thick atmosphere, plate tectonics)." },
    { id: 11, type: "SCENARIO / APPLIED", stem: "Consider: 'NASA's Europa Clipper mission will study whether Jupiter's moon Europa, which has a subsurface ocean containing twice Earth's water, could support life.'\n\nThis challenges which conventional assumption about habitability?", stmts: [], opts: ["That life requires a planet-sized body", "That habitability requires being in the Goldilocks Zone of a star", "That liquid water cannot exist without an atmosphere", "That all habitable worlds must have plate tectonics"], correct: 1, explain: "Europa is FAR outside the traditional Goldilocks Zone (it orbits Jupiter at 5.2 AU from Sun). Yet it has liquid water beneath ice, heated by tidal forces from Jupiter's gravity — not solar radiation. This challenges the assumption that habitability requires being in the star's habitable zone. Tidal heating provides an alternative energy source." },
    { id: 12, type: "SCENARIO / APPLIED", stem: "A climate scientist states: 'Human CO₂ emissions are overwhelming the natural carbonate-silicate thermostat that has regulated Earth's climate for billions of years.'\n\nThe key difference between natural and human-caused climate change that makes this statement valid is:", stmts: [], opts: ["Natural processes produce more CO₂ than human activity", "The natural cycle operates over millions of years while human emissions change climate in decades", "The carbonate-silicate cycle only works during ice ages", "Human CO₂ comes from different chemical compounds than volcanic CO₂"], correct: 1, explain: "The carbonate-silicate cycle operates on timescales of 500,000+ years. It cannot respond fast enough to human emissions that are changing atmospheric CO₂ in mere decades. The rate of change is the critical distinction — the natural thermostat is too slow to counteract anthropogenic forcing. Option (b) is correct." },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    { id: 13, type: "MATCH THE PAIRS", stem: "Match the planets/bodies with their characteristics:\n\n1. Venus — P. Lost magnetic field, thin CO₂ atmosphere\n2. Mars — Q. Subsurface ocean, tidal heating\n3. Europa — R. Runaway greenhouse, 460°C surface\n4. Earth — S. Active plate tectonics, geodynamo", stmts: [], opts: ["1-R, 2-P, 3-Q, 4-S", "1-P, 2-R, 3-Q, 4-S", "1-R, 2-Q, 3-P, 4-S", "1-Q, 2-P, 3-R, 4-S"], correct: 0, explain: "Venus (1) = R (runaway greenhouse, 460°C). Mars (2) = P (lost magnetic field, thin atmosphere ~1% of Earth, 95% CO₂). Europa (3) = Q (subsurface ocean heated by tidal forces from Jupiter). Earth (4) = S (unique plate tectonics and magnetic field from geodynamo)." },
    { id: 14, type: "MATCH THE PAIRS", stem: "Match Earth's protective systems with their primary functions:\n\n1. Magnetosphere — P. Regulates CO₂ over geological timescales\n2. Plate Tectonics — Q. Deflects asteroids and comets\n3. Moon — R. Deflects solar wind, protects atmosphere\n4. Jupiter — S. Stabilises axial tilt at ~23.5°", stmts: [], opts: ["1-R, 2-P, 3-S, 4-Q", "1-P, 2-R, 3-S, 4-Q", "1-R, 2-S, 3-P, 4-Q", "1-S, 2-P, 3-R, 4-Q"], correct: 0, explain: "Magnetosphere (1) = R (deflects solar wind). Plate Tectonics (2) = P (carbonate-silicate cycle regulates CO₂). Moon (3) = S (stabilises tilt 22.1°–24.5°). Jupiter (4) = Q (gravitational shield against asteroids/comets)." },
    // TYPE 7: DIRECT RECALL (1 question)
    { id: 15, type: "DIRECT RECALL", stem: "With reference to Chandrayaan-3 mission (2023), consider the following statements: [Based on UPSC 2023 pattern]\n1. It achieved India's first soft landing on the Moon.\n2. It landed near the lunar south pole.\n3. The Pragyan rover detected the presence of sulphur on the lunar surface.\n\nWhich of the statements given above are correct?", stmts: [], opts: ["1 and 2 only", "2 and 3 only", "1, 2 and 3", "1 and 3 only"], correct: 2, explain: "All three are CORRECT. Statement 1: Chandrayaan-3 achieved India's first successful soft landing (Chandrayaan-2 crash-landed). Statement 2: It landed near the south pole (~69°S). Statement 3: Pragyan's LIBS instrument confirmed sulphur presence. India became the first nation to land near the lunar south pole." },
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
            <p className="text-xs font-semibold text-[#31443a] whitespace-pre-line">{q.stem.slice(0, 100)}...</p>
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

// ─── Mains Tab ────────────────────────────────────────────────────────────────

function MainsTab() {
  const [activeQ, setActiveQ] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, { intro: string; body: string; conclusion: string }>>({
    0: { intro: "", body: "", conclusion: "" },
    1: { intro: "", body: "", conclusion: "" },
  });
  const [evaluating, setEvaluating] = useState(false);

  const questions = [
    { id: 0, paper: "GS-1 • 2019", marks: "15 Marks • 250 Words", text: "What makes Earth unique in the Solar System? Discuss the factors contributing to its habitability.", framework: ["Intro: Earth as the only known habitable planet — convergence of multiple factors", "Body: Goldilocks Zone — distance allows liquid water", "Body: Atmosphere — N₂/O₂ composition, biological O₂ from Great Oxidation Event", "Body: Magnetic field — geodynamo protects atmosphere from solar wind stripping", "Body: Plate tectonics — carbonate-silicate cycle as natural thermostat", "Body: Moon — stabilises axial tilt (22.1°–24.5°), prevents chaotic variations", "Body: Jupiter — gravitational shield against asteroid/comet impacts", "Conclusion: Rare Earth Hypothesis — convergence makes complex life rare; link to current missions (Perseverance, Europa Clipper) testing these factors elsewhere"] },
    { id: 1, paper: "GS-1 • 2021", marks: "10 Marks • 150 Words", text: "How does plate tectonics maintain climate stability on Earth? Discuss with reference to the carbon cycle.", framework: ["Intro: Plate tectonics as Earth's unique climate regulator", "Body: Volcanism releases CO₂ into atmosphere (warming)", "Body: Weathering of silicate rocks removes CO₂ (cooling)", "Body: Subduction carries carbonates into mantle — recycling", "Body: Negative feedback: warming → more weathering → CO₂ removal → cooling", "Conclusion: Natural thermostat operates over millions of years; IPCC warns human emissions overwhelming this cycle in decades"] },
  ];

  const q = questions[activeQ];
  const draft = drafts[activeQ];
  const wordCount = (draft.intro + " " + draft.body + " " + draft.conclusion).trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex gap-2">
        {questions.map((mq, i) => (
          <button key={mq.id} onClick={() => setActiveQ(i)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${activeQ === i ? "bg-gradient-to-r from-[#0f766e] to-[#1d9e75] text-white shadow-md" : "bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e]"}`}>
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
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">1</span>
            <p className="text-xs font-black text-[#13251d]">Introduction</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Define scope, set up answer</p>
          </div>
          <textarea value={draft.intro} onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], intro: e.target.value } }))} placeholder="Open with context, a definition, or the crux of the demand…" className="w-full h-20 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">2</span>
            <p className="text-xs font-black text-[#13251d]">Body</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Core argument, examples, dimensions</p>
          </div>
          <textarea value={draft.body} onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], body: e.target.value } }))} placeholder="Develop the substantive argument with structured points, examples, data…" className="w-full h-40 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-[9px] font-black text-white">3</span>
            <p className="text-xs font-black text-[#13251d]">Conclusion</p>
            <p className="text-[10px] font-semibold text-[#5d675f]">— Forward-looking synthesis, way forward</p>
          </div>
          <textarea value={draft.conclusion} onChange={e => setDrafts(prev => ({ ...prev, [activeQ]: { ...prev[activeQ], conclusion: e.target.value } }))} placeholder="Tie the argument together and end on a way-forward note…" className="w-full h-20 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-3 text-sm font-medium text-[#13251d] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]" />
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-[#e8e2d5]">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setEvaluating(true); setTimeout(() => setEvaluating(false), 2000); }} disabled={wordCount < 10 || evaluating} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#1d9e75] px-5 py-3 text-sm font-black text-white shadow-md disabled:opacity-40 transition-all">
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
    { label: "Earth Density", value: "5.51 g/cm³" },
    { label: "Distance", value: "1 AU" },
    { label: "Atm N₂", value: "78%" },
    { label: "Atm O₂", value: "21%" },
    { label: "Axial Tilt", value: "23.5°" },
    { label: "O₂ Event", value: "2.5 Ga" },
    { label: "Diameter", value: "12,742 km" },
    { label: "Venus Temp", value: "460°C" },
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
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-[#1d9e75] to-[#085041]" />
      </div>
      <span className="text-[10px] font-black text-[#085041]">{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EarthUniquenessPage() {
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));

  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">Part 1 — Physical Geography</span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">Prelims: HIGH</span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: HIGH</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            1.5 Earth in the Solar System — Uniqueness and Habitability
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#5d675f]">Earth and Its Origin (The Universe) › Geomorphology</p>
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
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
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

        {/* Navigation Ribbon — Previous Topic | Next Section | Next Topic */}
        {(() => {
          const currentIdx = TABS.findIndex(t => t.id === activeTab);
          const nextTab = currentIdx < TABS.length - 1 ? TABS[currentIdx + 1] : null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/70 backdrop-blur-sm p-3 shadow-sm flex items-center justify-between gap-2">
              {/* Previous Topic */}
              <a href="/upsc/content-preview/galaxies"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1.4 Galaxies</span>
                <span className="sm:hidden">Prev</span>
              </a>
              {/* Next Section */}
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
              {/* Next Topic */}
              <a href="/upsc/content-preview/moon"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">1.6 Moon</span>
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
