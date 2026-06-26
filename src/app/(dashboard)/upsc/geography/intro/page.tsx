"use client";

import { motion } from "framer-motion";
import {
  Globe2,
  BookOpen,
  Map,
  Target,
  ArrowRight,
  Compass,
  Layers,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function GeographyIntroPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-4 py-1.5 mb-4">
            <Globe2 className="h-4 w-4 text-[#1d9e75]" />
            <span className="text-[10px] font-black uppercase tracking-wide text-[#085041]">Geography GS — Master Module</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            Introduction to Geography
          </h1>
          <p className="mt-3 text-sm font-semibold text-[#5d675f] max-w-2xl mx-auto leading-7">
            From the Greek words <span className="font-black text-[#1a3a2a] bg-[#e7f5ee] px-1 rounded">Geo</span> (Earth) and <span className="font-black text-[#1a3a2a] bg-[#e7f5ee] px-1 rounded">Graphein</span> (to describe/write) — Geography is literally &quot;description of the Earth.&quot;
          </p>
        </motion.div>

        {/* Origin & Evolution */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-[#b9d9cd] bg-gradient-to-br from-[#e7f5ee] to-[#f0fdf4] p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-lg font-black">Origin of Geography as a Discipline</h2>
          </div>
          <div className="space-y-4">
            <p className="text-[14px] font-medium leading-7 text-[#1f2e26]">
              <span className="font-black text-[#1a3a2a] bg-[#e7f5ee] px-1 rounded">Eratosthenes</span> (276–194 BC), a Greek scholar from Cyrene, is recognized as the <span className="font-black text-[#1a3a2a] bg-[#e7f5ee] px-1 rounded">Father of Geography</span>. He first used the term &quot;Geographica&quot; and calculated Earth&apos;s circumference with remarkable accuracy using shadow angles at Alexandria and Syene — an error of less than 2% from the actual value.
            </p>
            <p className="text-[14px] font-medium leading-7 text-[#1f2e26]">
              <span className="font-black text-[#1a3a2a] bg-[#e7f5ee] px-1 rounded">Hecataeus</span> is considered the <span className="font-black text-[#1a3a2a] bg-[#e7f5ee] px-1 rounded">Father of Systematic Geography</span> — his work &quot;Ges Periodos&quot; (Description of the Earth) was the first known systematic geographic text dividing the world into Europe and Asia.
            </p>
            <p className="text-[14px] font-medium leading-7 text-[#1f2e26]">
              The discipline evolved through distinct phases: <span className="font-black text-[#1a3a2a]">Ancient Period</span> (Greek-Roman descriptions), <span className="font-black text-[#1a3a2a]">Medieval Period</span> (Arab geographers like Al-Idrisi), <span className="font-black text-[#1a3a2a]">Age of Exploration</span> (15th-17th century discoveries), <span className="font-black text-[#1a3a2a]">Modern Geography</span> (Humboldt and Ritter — systematic scientific approach), and <span className="font-black text-[#1a3a2a]">Contemporary Geography</span> (quantitative revolution, GIS, remote sensing).
            </p>
            <p className="text-[14px] font-medium leading-7 text-[#1f2e26]">
              <span className="font-black text-[#1a3a2a] bg-[#e7f5ee] px-1 rounded">Alexander von Humboldt</span> (Father of Modern Geography) and <span className="font-black text-[#1a3a2a] bg-[#e7f5ee] px-1 rounded">Carl Ritter</span> transformed geography from mere description to a scientific discipline studying spatial relationships, patterns, and processes.
            </p>
          </div>
        </motion.section>

        {/* Branches */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-lg font-black">Branches of Geography</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { title: "Physical Geography", items: "Geomorphology, Climatology, Oceanography, Biogeography, Hydrology, Pedology", icon: Compass },
              { title: "Human Geography", items: "Population, Settlement, Economic, Political, Cultural, Social Geography", icon: Globe2 },
              { title: "Indian Geography", items: "Physiography, Drainage, Climate, Soils, Vegetation, Agriculture, Minerals, Industry", icon: Map },
              { title: "World Geography", items: "Continents, Oceans, Biomes, Rivers, Mountains, Straits, Geopolitics", icon: TrendingUp },
            ].map((branch, i) => (
              <motion.div key={branch.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="rounded-xl border border-[#e8e2d5] bg-[#f7f4ee] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <branch.icon className="h-4 w-4 text-[#1d9e75]" />
                  <p className="text-sm font-black text-[#13251d]">{branch.title}</p>
                </div>
                <p className="text-xs font-semibold text-[#5d675f] leading-5">{branch.items}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* UPSC Relevance */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="rounded-2xl border border-[#1d9e75]/20 bg-gradient-to-r from-[#e7f5ee] to-[#f0fdf4] p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-lg font-black">Why Geography Matters for UPSC</h2>
          </div>
          <div className="space-y-3">
            {[
              "GS Paper 1 (Prelims): 15-20 questions directly from Physical + Indian + World Geography every year",
              "GS Paper 1 (Mains): Dedicated section on physical geography, Indian geography, and spatial factors",
              "GS Paper 3 (Mains): Disaster management, environment, agriculture — all rooted in geography",
              "Optional Paper: Geography is among the most popular optionals with high scoring potential",
              "Current Affairs: 60%+ current affairs have geographic dimensions (cyclones, earthquakes, climate, borders)",
              "Map-based questions: Increasing trend in UPSC 2024-2025 — straits, passes, rivers, boundaries",
            ].map((point, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.05 }} className="flex items-start gap-2">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1d9e75] text-[9px] font-black text-white">{i + 1}</span>
                <p className="text-sm font-semibold text-[#31443a] leading-6">{point}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Module Coverage */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6 mb-5">
          <h2 className="text-lg font-black mb-4">What This Module Covers</h2>
          <p className="text-sm font-semibold text-[#5d675f] mb-4 leading-6">
            82 major topics expanded into 300+ sub-topics — each with full depth treatment (BASIC → NCERT → Reference → Current Affairs → Traps → PYQ → Practice MCQs → Mains). One month. One subject. Complete command.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Parts", value: "15" },
              { label: "Major Topics", value: "82" },
              { label: "Sub-topics", value: "300+" },
              { label: "MCQ Types", value: "7" },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg bg-gradient-to-br from-[#e7f5ee] to-[#f0fdf4] border border-[#b9d9cd] p-3 text-center">
                <p className="text-2xl font-black text-[#1d9e75]">{stat.value}</p>
                <p className="text-[9px] font-black uppercase text-[#085041]">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Start Learning CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="text-center">
          <Link href="/upsc/content-preview" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-8 py-4 text-sm font-black text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
            Start Learning — Topic 1: Universe & Earth&apos;s Origin
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs font-semibold text-[#5d675f]">
            Begin with the Big Bang Theory → Solar System → Earth Formation → Geological Time Scale
          </p>
        </motion.div>
      </div>
    </main>
  );
}
