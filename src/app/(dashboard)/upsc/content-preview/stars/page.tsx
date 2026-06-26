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
      <RichText text="In Topic 1.2 we traced how the Solar System formed from a nebula enriched with heavy elements. But where did those heavy elements come from? The answer lies in **stars** — cosmic furnaces that manufactured every element heavier than lithium." />

      {/* Star Formation */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🌟 STAR FORMATION</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Stars form within **molecular clouds** — dense regions of interstellar gas (primarily **hydrogen**) and dust." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Cloud becomes gravitationally unstable (**Jeans instability**) → collapses → heats → forms **protostar**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Core reaches **10 million Kelvin** → hydrogen fusion ignites → true star born → enters **main sequence**." /></li>
        </ul>
      </div>

      {/* Main Sequence */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">☀️ MAIN SEQUENCE</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Longest phase: **hydrogen fuses into helium** in the core." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Sun = **G-type** main sequence star (**yellow dwarf**), **4.6 Ga** old, ~**10 Ga** total lifespan." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Mass at birth** determines fate — more massive = hotter, bluer, and die much faster." /></li>
        </ul>
      </div>

      {/* H-R Diagram Placeholder */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#f0fdf4] to-[#e7f5ee] p-8 flex items-center justify-center min-h-[200px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')]" />
        <div className="text-center relative z-10">
          <ImageIcon className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Hertzsprung-Russell (H-R) Diagram</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Luminosity vs Temperature • Main Sequence • Giants • White Dwarfs</p>
        </div>
      </div>

      {/* H-R Diagram */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">📊 H-R DIAGRAM</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Plots stars by **luminosity** (vertical) against **surface temperature** (horizontal)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Main sequence** forms a diagonal band; **giants/supergiants** upper-right (cool, luminous)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**White dwarfs** lower-left (hot, dim) — fundamental organising tool for stellar populations." /></li>
        </ul>
      </div>

      {/* PYQ Tag */}
      <div className="flex items-center gap-2 -mt-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
          <Target className="h-3 w-3" /> Stellar classification tested in UPSC Prelims 2017 & 2020
        </span>
      </div>

      {/* Low-Mass Stars */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🔴 LOW-MASS STARS (&lt;8 M☉)</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Exhaust core hydrogen → expand into **red giants** → shed outer layers as **planetary nebulae**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Leave behind **white dwarfs** — dense, Earth-sized remnants." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Sun's path: will engulf **Mercury/Venus** in ~**5 Ga** before collapsing to white dwarf." /></li>
        </ul>
      </div>

      {/* High-Mass Stars */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">💥 HIGH-MASS STARS (&gt;8 M☉)</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Successive fusion: **H → He → C → Ne → O → Si → Fe** (iron = dead end, no energy release)." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Iron core exceeds **Chandrasekhar limit (~1.4 M☉)** → catastrophic collapse → **core-collapse supernova**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Explosion synthesises all elements **heavier than iron** and disperses them into space." /></li>
        </ul>
      </div>

      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight" tone="amber">
        The Chandrasekhar Limit (1.4 solar masses) is named after Indian astrophysicist Subrahmanyan Chandrasekhar — Nobel Prize 1983. This is the maximum mass of a white dwarf. UPSC tests Indian scientists' contributions to global science frequently.
      </Callout>

      {/* Stellar Remnants */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🕳️ STELLAR REMNANTS</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Neutron stars** — city-sized, extremely dense, intense magnetic fields; rotating ones = **pulsars**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Black holes** — remnant exceeds **~3 M☉**, gravity overcomes all forces → **singularity**." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="These represent the most **extreme states of matter** in the Universe." /></li>
        </ul>
      </div>

      {/* Stellar Life Cycle Diagram */}
      <div className="my-6 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <Brain className="mx-auto h-10 w-10 text-[#1d9e75]/40" />
          <p className="mt-3 text-sm font-black text-[#085041]">Stellar Life Cycle — Two Paths</p>
          <p className="mt-1 text-xs font-semibold text-[#49675e]">Low mass: Nebula → Main Seq → Red Giant → White Dwarf | High mass: → Supernova → Neutron Star/Black Hole</p>
        </div>
      </div>

      {/* Stellar Nucleosynthesis */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#085041] tracking-wide">🧬 STELLAR NUCLEOSYNTHESIS</p>
        <ul className="space-y-2 pl-1">
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="Every element heavier than **H and He** manufactured inside stars or supernova explosions." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="**Carbon** in organic molecules, **oxygen** we breathe, **iron** in Earth's core, **uranium** heating interior." /></li>
          <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" /><RichText text="We are, literally, **made of stardust** — all produced by stellar processes before the Solar System formed." /></li>
        </ul>
      </div>

      <Callout icon={<ArrowRight className="h-4 w-4 text-[#3b82f6]" />} title="What Comes Next" tone="blue">
        Stars don't exist in isolation — they cluster into galaxies. In the next sub-topic, we explore the Milky Way's structure, galaxy types, dark matter, and the large-scale architecture of the Universe that determines where solar systems like ours can form.
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
        <p className="mt-1 text-xs font-semibold text-[#92400e]">Pages 14-15: Stars and Energy Production</p>
        <div className="mt-3 space-y-3">
          <RichText text="**Key NCERT Statement:** 'A star is formed by condensation of gases, mainly hydrogen, in a nebula.' NCERT establishes the nebula → star formation pathway that connects to Topic 1.2." />
          <RichText text="**Testable Fact:** The Sun produces energy through **nuclear fusion** — hydrogen converts to helium in the core. NCERT does not specify the temperature threshold (10 million K) but UPSC expects students to know this." />
          <RichText text="**Important:** NCERT states the Sun is a 'medium-sized star' — this directly contradicts the trap statement that the Sun is one of the largest stars. The Sun is actually relatively average in size." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 8 — Science: Stars and the Solar System</p>
        <div className="mt-3 space-y-3">
          <RichText text="NCERT explicitly states: 'The Sun will last for approximately another **5 billion years**.' This confirms the Sun is mid-life and provides a testable factual number." />
          <RichText text="Stars appear to **twinkle** due to **atmospheric refraction** — not because of any intrinsic property. Planets do not twinkle because they appear as discs, not point sources. This distinction is a classic Prelims question." />
        </div>
      </div>
      <div className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14]">📖 Class 6 — The Earth: Our Habitat</p>
        <div className="mt-3">
          <RichText text="Foundation: 'Stars are celestial bodies that produce **heat and light of their own**.' ALL stars produce their own light through fusion — this distinguishes them from planets and moons which only reflect light. Appears in UPSC combination statements." />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Current Affairs Tab ──────────────────────────────────────────────────────

function CurrentTab() {
  const events = [
    { tag: "🌍 Space", title: "Event Horizon Telescope — Black Hole Images", text: "**EHT** captured the first image of a black hole shadow in galaxy **M87** (2019) and then **Sagittarius A*** at the Milky Way's centre (2022). EHT is not a single telescope but a **global network** using **Very Long Baseline Interferometry** — confirming Einstein's general relativity predictions." },
    { tag: "🇮🇳 India", title: "XPoSat — X-ray Polarimetry (Jan 2024)", text: "India's **XPoSat** is only the **second mission globally** (after NASA's IXPE) dedicated to **X-ray polarimetry**. It studies emissions from **neutron stars**, black hole systems, and **supernova remnants**. Orbits Earth in **Low Earth Orbit** (NOT at L1 — that's Aditya-L1)." },
    { tag: "🇮🇳 India", title: "Aditya-L1 — Studying Our Star (2024)", text: "ISRO's **Aditya-L1** at the **L1 Lagrange point** studies the Sun's **corona**, **solar wind**, and **magnetic field**. Solar flares and **Coronal Mass Ejections (CMEs)** can disrupt Earth's magnetosphere, satellites, power grids — this is **space weather**." },
    { tag: "🌍 Space", title: "Betelgeuse — Imminent Supernova?", text: "**Betelgeuse**, a red supergiant in Orion visible to naked eye, dimmed dramatically in 2019-2020. Studies revealed a **dust cloud** from surface mass ejection caused it. When Betelgeuse eventually explodes (within ~100,000 years), it will be visible in **daylight** from Earth." },
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
    { wrong: "'The Sun will explode as a supernova.'", right: "The Sun's mass (~1 solar mass) is far below the 8 solar mass threshold. It will become a red giant → planetary nebula → white dwarf. Only stars >8 solar masses go supernova." },
    { wrong: "'Bigger stars live longer because they have more fuel.'", right: "WRONG. Massive stars burn fuel exponentially FASTER. A 10-solar-mass star lives only ~20 million years vs Sun's 10 billion. More mass = brighter = shorter life." },
    { wrong: "'Planetary nebula is where planets form.'", right: "A planetary nebula is the ejected outer shell of a DYING low-mass star — nothing to do with planets. The name is historical (looked disc-like). Planets form in a 'protoplanetary disk.'" },
    { wrong: "'A black hole sucks in everything around it.'", right: "A black hole's gravity at distance = any object of same mass. If the Sun became a black hole, Earth would orbit normally. Only objects crossing the event horizon are captured." },
    { wrong: "'The Chandrasekhar Limit is the minimum mass for a black hole.'", right: "The Chandrasekhar Limit (1.4 solar masses) is the MAXIMUM mass of a WHITE DWARF. The minimum for a black hole is ~3 solar masses (Tolman-Oppenheimer-Volkoff limit). Different thresholds." },
    { wrong: "'All elements in the periodic table were produced in the Big Bang.'", right: "Big Bang produced ONLY H, He, and trace Li. Everything from Carbon onward was made inside STARS (fusion) or in SUPERNOVAE (elements heavier than iron). Stellar nucleosynthesis ≠ Big Bang nucleosynthesis." },
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
    { id: 1, type: "MULTI-STATEMENT", stem: "Consider the following statements about the life cycle of stars:", stmts: ["A star's mass at birth determines its ultimate fate — whether it becomes a white dwarf, neutron star, or black hole.", "The Sun will eventually exhaust its hydrogen fuel and explode as a supernova.", "During the main sequence phase, a star fuses hydrogen into helium in its core.", "Red giants are more luminous but cooler at the surface than main sequence stars of the same mass."], opts: ["1, 3 and 4 only", "1 and 3 only", "2, 3 and 4 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — mass determines destiny. Statement 2: WRONG — Sun will NOT supernova (needs >8 solar masses); it becomes white dwarf. Statement 3: CORRECT — main sequence definition. Statement 4: CORRECT — red giants expand and cool but luminosity increases due to enormous surface area." },
    { id: 2, type: "MULTI-STATEMENT", stem: "Consider the following about stellar nucleosynthesis:", stmts: ["Elements up to iron are produced through nuclear fusion inside massive stars.", "Elements heavier than iron are produced exclusively during supernova explosions.", "The hydrogen in Earth's oceans was produced inside stars.", "Carbon, nitrogen, and oxygen essential for life were all produced through stellar fusion."], opts: ["1 and 4 only", "1, 2 and 4 only", "1 and 2 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT — fusion in massive star cores builds up to Fe. Statement 2: CORRECT in principle (rapid neutron capture/r-process in supernovae). Statement 3: WRONG — hydrogen was produced in the Big Bang, NOT in stars. It's the most abundant element from the Big Bang itself. Statement 4: CORRECT — C, N, O all from stellar fusion." },
    { id: 3, type: "MULTI-STATEMENT", stem: "Consider the following about the Hertzsprung-Russell Diagram:", stmts: ["It plots stars by luminosity against surface temperature.", "Main sequence stars form a diagonal band from upper-left (hot, luminous) to lower-right (cool, dim).", "White dwarfs are located in the upper-right corner of the diagram.", "The Sun is located approximately in the middle of the main sequence."], opts: ["1, 2 and 4 only", "1 and 2 only", "1, 2 and 3 only", "1, 2, 3 and 4"], correct: 0, explain: "Statement 1: CORRECT. Statement 2: CORRECT — hot luminous O-type at upper-left, cool dim M-type at lower-right. Statement 3: WRONG — white dwarfs are in the LOWER-LEFT (hot but dim due to tiny size). Upper-right = red giants/supergiants. Statement 4: CORRECT — Sun is a G2V, roughly mid-main-sequence." },
    // TYPE 2: HOW MANY CORRECT (2 questions)
    { id: 4, type: "HOW MANY CORRECT", stem: "How many of the following statements about supernova explosions are correct?", stmts: ["A supernova occurs when an iron core exceeds the Chandrasekhar limit and collapses.", "Supernovae produce elements heavier than iron through rapid neutron capture.", "The remnant of a supernova can be either a neutron star or a black hole.", "All stars, regardless of mass, eventually undergo supernova explosions.", "A supernova can briefly outshine an entire galaxy."], opts: ["Only two", "Only three", "Only four", "All five"], correct: 2, explain: "Statements 1, 2, 3, 5 are CORRECT. Statement 4 is WRONG — only stars >8 solar masses go supernova. Low-mass stars (like the Sun) end as white dwarfs without explosions. Four correct." },
    { id: 5, type: "HOW MANY CORRECT", stem: "How many of the following are correctly paired (scientist — contribution to stellar physics)?", stmts: ["Subrahmanyan Chandrasekhar — Maximum mass limit for white dwarfs (1.4 solar masses)", "Jocelyn Bell Burnell — Discovery of pulsars (rapidly rotating neutron stars)", "Edwin Hubble — Discovery of stellar nucleosynthesis", "Karl Schwarzschild — Mathematical description of black hole event horizon radius"], opts: ["Only one", "Only two", "Only three", "All four"], correct: 2, explain: "Statement 1: CORRECT (Nobel 1983). Statement 2: CORRECT (1967 discovery). Statement 3: WRONG — Hubble discovered galaxy distances/expansion, NOT nucleosynthesis (that was Burbidge, Burbidge, Fowler, Hoyle — B²FH paper 1957). Statement 4: CORRECT (Schwarzschild radius, 1916). Three correct." },
    // TYPE 3: ASSERTION-REASON (2 questions)
    { id: 6, type: "ASSERTION-REASON", stem: "Assertion (A): More massive stars have shorter lifespans than less massive stars.\n\nReason (R): Massive stars have higher core temperatures and burn their nuclear fuel at exponentially faster rates despite having larger fuel reserves.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct and R explains A. A 10-solar-mass star lives ~20 million years vs Sun's 10 billion years. The fuel consumption rate scales roughly as mass³ while fuel reserve scales only as mass¹ — net effect is shorter life for massive stars." },
    { id: 7, type: "ASSERTION-REASON", stem: "Assertion (A): The Sun will never form a black hole at the end of its life.\n\nReason (R): The Sun's mass is insufficient to overcome electron degeneracy pressure, and it will end its life as a white dwarf.", stmts: [], opts: ["Both A and R true and R is correct explanation of A", "Both A and R true but R is NOT correct explanation of A", "A is true but R is false", "A is false but R is true"], correct: 0, explain: "Both correct. The Sun (~1 solar mass) is far below the ~8 solar mass threshold for supernova/neutron star, let alone ~25 solar masses for black hole. It will shed outer layers and its core (below Chandrasekhar limit) will be supported by electron degeneracy pressure as a stable white dwarf." },
    // TYPE 4: NOT / EXCEPTION (2 questions)
    { id: 8, type: "NOT / EXCEPTION", stem: "Which of the following about neutron stars is NOT correct?", stmts: [], opts: ["Neutron stars are remnants of supernova explosions from massive stars", "A neutron star's density is comparable to that of an atomic nucleus", "Neutron stars rotate slowly due to their immense gravitational field", "Pulsars are rapidly rotating neutron stars that emit beams of radiation"], correct: 2, explain: "Option (c) is WRONG — neutron stars rotate EXTREMELY RAPIDLY (not slowly). Conservation of angular momentum during collapse concentrates spin into a tiny body. Some pulsars rotate hundreds of times per second (millisecond pulsars). All other statements are correct." },
    { id: 9, type: "NOT / EXCEPTION", stem: "Which of the following statements about the Sun is NOT correct?", stmts: [], opts: ["The Sun is classified as a G-type main sequence star (yellow dwarf)", "The Sun is approximately 4.6 billion years old and is roughly mid-life", "The Sun is located at the centre of the Milky Way galaxy", "The Sun produces energy by fusing hydrogen into helium in its core"], correct: 2, explain: "Option (c) is WRONG — the Sun is NOT at the centre of the Milky Way. It is in the Orion Arm, approximately 26,000 light-years from the galactic centre. This was tested in UPSC Prelims 2017." },
    // TYPE 5: SCENARIO / APPLIED (3 questions)
    { id: 10, type: "SCENARIO / APPLIED", stem: "A news headline reads: 'India's XPoSat successfully begins studying X-ray emissions from a nearby pulsar, revealing insights about matter under extreme magnetic fields.'\n\nA student makes three inferences:\n1. XPoSat orbits the Sun at the L1 Lagrange point like Aditya-L1.\n2. Pulsars are rapidly rotating neutron stars formed after supernova explosions.\n3. XPoSat studies phenomena related to stellar death and remnant physics.\n\nWhich inference(s) is/are valid?", stmts: [], opts: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], correct: 1, explain: "Inference 1: WRONG — XPoSat is in Low Earth Orbit, NOT at L1 (common trap; Aditya-L1 is at L1). Inference 2: CORRECT — pulsars are rotating neutron stars from supernovae. Inference 3: CORRECT — XPoSat studies neutron stars and black holes (stellar remnants). Only 2 and 3 valid." },
    { id: 11, type: "SCENARIO / APPLIED", stem: "Consider: 'ISRO's Aditya-L1 has detected a powerful Coronal Mass Ejection (CME) heading toward Earth. Scientists warn of potential disruptions to satellite communications, GPS, and power grids.'\n\nThe phenomenon described is best understood as:", stmts: [], opts: ["Gravitational wave event from neutron star merger", "Space weather — interaction of solar plasma with Earth's magnetosphere", "Effect of solar radiation pressure on Earth's atmosphere", "Stellar wind from a nearby supernova remnant"], correct: 1, explain: "CMEs interacting with Earth's magnetosphere = space weather. Option (b) is correct. This disrupts charged particle environments around Earth affecting technology. Not gravitational waves (neutron star mergers), not radiation pressure (too weak for such effects), not supernova wind." },
    { id: 12, type: "SCENARIO / APPLIED", stem: "A researcher states: 'Analysis of a meteorite shows it contains elements heavier than iron including gold, platinum, and uranium. These elements could not have been produced through normal stellar fusion.'\n\nThe most scientifically accurate explanation is:", stmts: [], opts: ["These elements were produced in the Big Bang along with hydrogen and helium", "These elements were produced through rapid neutron capture during a supernova or neutron star merger", "These elements were produced by cosmic rays striking lighter atoms in interstellar space", "These elements are primordial and have existed since before the Universe began"], correct: 1, explain: "Elements heavier than iron CANNOT be produced by normal fusion (it's endothermic beyond Fe). They require rapid neutron capture (r-process) in explosive environments: supernovae or neutron star mergers. The Big Bang only made H, He, trace Li. Option (b) is correct." },
    // TYPE 6: MATCH THE PAIRS (2 questions)
    { id: 13, type: "MATCH THE PAIRS", stem: "Match the stellar endpoints with the mass threshold of their progenitor stars:\n\n1. White Dwarf — P. Progenitor star > 25 solar masses\n2. Neutron Star — Q. Progenitor star < 8 solar masses\n3. Black Hole — R. Progenitor star 8–25 solar masses", stmts: [], opts: ["1-Q, 2-R, 3-P", "1-R, 2-Q, 3-P", "1-P, 2-R, 3-Q", "1-Q, 2-P, 3-R"], correct: 0, explain: "White Dwarf from <8 solar mass stars (Q). Neutron Star from 8-25 solar mass stars (R). Black Hole from >25 solar mass stars (P). These mass ranges are critical for UPSC — memorize the thresholds." },
    { id: 14, type: "MATCH THE PAIRS", stem: "Match Indian space missions with their primary stellar/solar science objectives:\n\n1. Aditya-L1 — P. X-ray polarimetry of neutron stars and black holes\n2. XPoSat — Q. Multi-wavelength astronomy including UV observations\n3. AstroSat — R. Study of solar corona, solar wind, and CMEs at L1 point", stmts: [], opts: ["1-R, 2-P, 3-Q", "1-P, 2-R, 3-Q", "1-Q, 2-P, 3-R", "1-R, 2-Q, 3-P"], correct: 0, explain: "Aditya-L1 = R (solar science at L1). XPoSat = P (X-ray polarimetry of compact objects). AstroSat = Q (multi-wavelength observatory). Common trap: confusing XPoSat's orbit (LEO) with Aditya-L1's orbit (L1)." },
    // TYPE 7: DIRECT RECALL (1 question)
    { id: 15, type: "DIRECT RECALL", stem: "Which of the following is/are the outcome of a supernova explosion? [Based on UPSC 2020]\n1. Formation of elements heavier than iron\n2. Creation of neutron stars\n3. Formation of planetary nebulae", stmts: [], opts: ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], correct: 0, explain: "Statements 1 and 2 CORRECT — supernovae create heavy elements (r-process) and leave neutron star/black hole remnants. Statement 3 WRONG — planetary nebulae come from LOW-MASS star death (gentle shedding), NOT from supernovae (explosive). This distinction is a classic UPSC trap." },
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
    { id: 0, paper: "GS-1 • 2018", marks: "10 Marks • 150 Words", text: "Explain the life cycle of a star. How does stellar mass determine its ultimate fate?", framework: ["Intro: Define star, mention mass as destiny determinant", "Body: Formation — molecular cloud → protostar → main sequence", "Body: Low-mass path (<8 M☉) — red giant → planetary nebula → white dwarf", "Body: High-mass path (>8 M☉) — supergiant → supernova → neutron star/black hole", "Body: Mention thresholds — Chandrasekhar (1.4 M☉), TOV (~3 M☉)", "Conclusion: Link to nucleosynthesis, Earth's composition, Indian contributions (Chandrasekhar)"] },
    { id: 1, paper: "GS-3 • 2024", marks: "15 Marks • 250 Words", text: "India's space observation capabilities have expanded significantly. Discuss the scientific objectives and strategic significance of India's astronomical satellites.", framework: ["Intro: India's journey from sounding rockets to dedicated space observatories", "Body: AstroSat (2015) — multi-wavelength, UV detection 9.3B light-years", "Body: XPoSat (2024) — X-ray polarimetry, neutron stars, 2nd global mission", "Body: Aditya-L1 (2024) — solar science at L1, space weather monitoring", "Body: Strategic significance — satellite protection, GPS, power grid, telecom", "Conclusion: Cost-effectiveness, global credibility, future missions (Gaganyaan, ISRO roadmap)"] },
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
    { label: "Sun Type", value: "G2V" },
    { label: "Sun Age", value: "4.6 Ga" },
    { label: "Sun Life Left", value: "~5 Ga" },
    { label: "Chandrasekhar", value: "1.4 M☉" },
    { label: "SN Threshold", value: ">8 M☉" },
    { label: "Black Hole", value: ">25 M☉" },
    { label: "H Fusion Temp", value: "10M K" },
    { label: "Nobel", value: "1983" },
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

export default function StarsPage() {
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
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">Prelims: MODERATE</span>
            <span className="rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 text-[9px] font-black text-[#1e40af]">Mains: MODERATE</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            1.3 Stars — Formation, Life Cycle, and Stellar Evolution
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
              <a href="/upsc/content-preview/solar-system"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1.2 Solar System</span>
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
              <a href="/upsc/content-preview/galaxies"
                className="flex items-center gap-2 rounded-xl border border-[#dcd5c7] px-3 py-2.5 text-xs font-black text-[#5d675f] hover:bg-[#e7f5ee] hover:border-[#1d9e75]/30 transition-all">
                <span className="hidden sm:inline">1.4 Galaxies</span>
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
