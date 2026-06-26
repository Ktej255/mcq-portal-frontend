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
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Block { type: string; text: string; }
interface Section { section_label: string; title: string; display_order: number; blocks: Block[]; }
interface TopicData {
  topic_id: string; title: string; parent_topic: string; mega_topic: string;
  part: string; display_order: number; prelims_relevance: string; mains_relevance: string;
  sections: Section[];
}

// ─── Topic List ──────────────────────────────────────────────────────────────

const TOPIC_LIST = [
  { id: "1.1", title: "Big Bang Theory and Origin of the Universe", p: "HIGH", m: "MODERATE" },
  { id: "1.2", title: "Solar System Formation — Nebular Hypothesis", p: "HIGH", m: "HIGH" },
  { id: "1.3", title: "Stars — Formation, Life Cycle, Stellar Evolution", p: "MODERATE", m: "MODERATE" },
  { id: "1.4", title: "Galaxies and Large-Scale Structure of the Universe", p: "MODERATE", m: "LOW" },
  { id: "1.5", title: "Earth in the Solar System — Uniqueness & Habitability", p: "HIGH", m: "HIGH" },
  { id: "1.6", title: "The Moon — Origin, Characteristics, Influence on Earth", p: "HIGH", m: "MODERATE" },
];

// ─── Tab Config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "learn", label: "Learn", icon: BookOpen, section: "BASICS" },
  { id: "ncert", label: "NCERT", icon: GraduationCap, section: "NCERT_REFERENCE" },
  { id: "current", label: "Current Affairs", icon: Newspaper, section: "CURRENT_AFFAIRS" },
  { id: "traps", label: "Traps", icon: AlertTriangle, section: "EXAMINER_TRAPS" },
  { id: "pyq", label: "PYQ", icon: Target, section: "PRELIMS_PYQ" },
  { id: "mains", label: "Mains", icon: PenLine, section: "MAINS_PYQ" },
  { id: "practice", label: "Practice", icon: Target, section: "PRACTICE_QUESTIONS" },
  { id: "answers", label: "Answers", icon: CheckCircle2, section: "ANSWERS" },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ─── Rich Text (EXACT same as approved page) ────────────────────────────────

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

// ─── Callout Box (EXACT same as approved page) ───────────────────────────────

function Callout({ icon, title, children, tone = "green" }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
  tone?: "green" | "amber" | "blue";
}) {
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

// ─── Section Renderers (match approved design per section type) ───────────────

function LearnSection({ blocks }: { blocks: Block[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {blocks.map((block, i) => (
        <RichText key={i} text={block.text} />
      ))}
      <Callout icon={<Lightbulb className="h-4 w-4 text-[#f59e0b]" />} title="Key Insight" tone="amber">
        Each paragraph above contains bold keywords — these are the testable facts UPSC targets in Prelims statements.
      </Callout>
    </motion.div>
  );
}

function NcertSection({ blocks }: { blocks: Block[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-5">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#8c5d14] mb-3">📖 NCERT Reference {i + 1}</p>
          <RichText text={block.text} />
        </div>
      ))}
    </motion.div>
  );
}

function CurrentAffairsSection({ blocks }: { blocks: Block[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {blocks.map((block, i) => {
        const isIndia = block.text.toLowerCase().includes("india") || block.text.toLowerCase().includes("isro");
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-[#a5f3fc] bg-gradient-to-br from-[#ecfeff] to-[#f0f9ff] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-[#0369a1]/10 px-2 py-0.5 text-[9px] font-black text-[#0369a1]">
                {isIndia ? "🇮🇳 India" : "🌍 Space"}
              </span>
            </div>
            <RichText text={block.text} />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function TrapsSection({ blocks }: { blocks: Block[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {blocks.map((block, i) => {
        // Extract TRAP pattern: "TRAP N — 'wrong statement.' WRONG/INCOMPLETE. explanation"
        const m = block.text.match(/^TRAP \d+\s*[—–-]\s*([\s\S]+)/);
        const content = m ? m[1] : block.text;
        // Split into wrong part and correct part
        const splitIdx = content.search(/\b(WRONG|INCOMPLETE|PARTIALLY CORRECT|IMPRECISE)\b\.?\s*/);
        let wrongPart = content;
        let rightPart = "";
        if (splitIdx > -1) {
          const afterMatch = content.slice(splitIdx).match(/^(WRONG|INCOMPLETE|PARTIALLY CORRECT|IMPRECISE)\.?\s*([\s\S]*)/);
          if (afterMatch) {
            wrongPart = content.slice(0, splitIdx).replace(/[''"]/g, "").trim();
            rightPart = afterMatch[2].trim();
          }
        }
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white p-4 flex gap-3">
            <div className="shrink-0 mt-1">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-red-800 line-through decoration-red-300">{wrongPart}</p>
              {rightPart && <p className="mt-1.5 text-sm font-semibold text-[#085041]">✓ {rightPart}</p>}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function PyqSection({ blocks }: { blocks: Block[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {blocks.map((block, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-[#7c3aed]/20 bg-gradient-to-br from-[#faf5ff] to-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed]/10 px-2.5 py-1 text-[9px] font-black text-[#7c3aed]">
              <Target className="h-3 w-3" /> Previous Year
            </span>
          </div>
          <RichText text={block.text} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function PracticeSection({ blocks }: { blocks: Block[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-xs font-black uppercase text-[#085041]">Practice MCQs & Mains Questions — UPSC Style</p>
      {blocks.map((block, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-2.5 py-0.5 text-[8px] font-black text-white">
              Q{i + 1}
            </span>
          </div>
          <RichText text={block.text} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function AnswersSection({ blocks }: { blocks: Block[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-xl border border-[#b9d9cd] bg-gradient-to-br from-[#e7f5ee] to-[#f0fdf4] p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
            <p className="text-xs font-black uppercase text-[#085041]">
              {i === blocks.length - 1 ? "Key Focus for Mains" : i === blocks.length - 2 ? "Key Facts for Prelims" : "Answers & Explanations"}
            </p>
          </div>
          <RichText text={block.text} />
        </div>
      ))}
    </motion.div>
  );
}

function MainsPyqSection({ blocks }: { blocks: Block[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-xl border border-[#99f6e4] bg-gradient-to-br from-[#f0fdfa] to-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#0f766e]/10 px-2 py-0.5 text-[9px] font-black text-[#0f766e]">
              <PenLine className="h-3 w-3 inline mr-1" />Mains PYQ
            </span>
          </div>
          <RichText text={block.text} />
        </div>
      ))}
    </motion.div>
  );
}

// ─── Fact Card (same as approved) ────────────────────────────────────────────

function FactCard({ topicData }: { topicData: TopicData | null }) {
  if (!topicData) return null;
  // Extract key facts from ANSWERS section last block
  const answersSection = topicData.sections.find(s => s.section_label === "ANSWERS");
  const keyFactsBlock = answersSection?.blocks.find(b => b.text.includes("KEY FACTS"));
  if (!keyFactsBlock) return null;

  // Parse key facts: (1) fact (2) fact etc.
  const facts = keyFactsBlock.text.match(/\(\d+\)\s*[^(]+/g) || [];
  const parsedFacts = facts.slice(0, 8).map(f => {
    const clean = f.replace(/^\(\d+\)\s*/, "").trim();
    const parts = clean.split(/[=:–—]\s*/);
    return { label: parts[0]?.trim().slice(0, 18) || "", value: parts[1]?.trim().slice(0, 12) || clean.slice(0, 12) };
  });

  if (parsedFacts.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#1d9e75]/20 bg-gradient-to-r from-[#e7f5ee] via-[#f0fdf4] to-[#e7f5ee] p-5 my-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#1d9e75]" />
        <p className="text-[10px] font-black uppercase tracking-wide text-[#085041]">Prelims Fact Card — Memorize</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {parsedFacts.map((f, i) => (
          <div key={i} className="rounded-lg bg-white/80 border border-[#b9d9cd] p-2 text-center shadow-sm">
            <p className="text-[8px] font-black uppercase text-[#49675e] leading-tight truncate">{f.label}</p>
            <p className="mt-0.5 text-xs font-black text-[#13251d] truncate">{f.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Progress Indicator ──────────────────────────────────────────────────────

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-[#dcd5c7] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(current / total) * 100}%` }}
          className="h-full rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75]" />
      </div>
      <span className="text-[10px] font-black text-[#5d675f]">{current}/{total} sections</span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function UniversePreviewPage() {
  const [currentTopicId, setCurrentTopicId] = useState("1.1");
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["learn"]));
  const [loading, setLoading] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  // Load topic from backend
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/v1/gs-lms/preview/universe-topics/${currentTopicId}`)
      .then(r => r.json())
      .then(json => { setTopicData(json.data); setActiveTab("learn"); setVisitedTabs(new Set(["learn"])); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentTopicId]);

  const currentSection = topicData?.sections?.find(
    s => s.section_label === TABS.find(t => t.id === activeTab)?.section
  );
  const currentIndex = TOPIC_LIST.findIndex(t => t.id === currentTopicId);
  const prevTopic = currentIndex > 0 ? TOPIC_LIST[currentIndex - 1] : null;
  const nextTopic = currentIndex < TOPIC_LIST.length - 1 ? TOPIC_LIST[currentIndex + 1] : null;
  const meta = TOPIC_LIST[currentIndex];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f4ee] to-[#f0ede5] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">

        {/* Topic Selector Dropdown */}
        <div className="mb-5 relative">
          <button onClick={() => setSelectorOpen(!selectorOpen)}
            className="w-full flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm hover:border-[#1d9e75]/40 transition">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-xs font-black text-white shadow-md">
                {currentTopicId}
              </span>
              <div>
                <p className="text-sm font-black text-[#13251d]">{meta?.title}</p>
                <p className="text-[9px] font-semibold text-[#5d675f]">Earth and Its Origin (The Universe) › Geomorphology</p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-[#5d675f] transition-transform duration-200 ${selectorOpen ? "rotate-180" : ""}`} />
          </button>

          {selectorOpen && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl border border-[#dcd5c7] bg-white shadow-xl overflow-hidden">
              {TOPIC_LIST.map(t => (
                <button key={t.id}
                  onClick={() => { setCurrentTopicId(t.id); setSelectorOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#e7f5ee] transition border-b border-[#f0ede5] last:border-0 ${t.id === currentTopicId ? "bg-[#e7f5ee]" : ""}`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1d9e75]/10 text-[10px] font-black text-[#1d9e75]">{t.id}</span>
                  <div className="flex-1">
                    <p className="text-xs font-black text-[#13251d]">{t.title}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[8px] font-black text-[#f59e0b]">Prelims: {t.p}</span>
                      <span className="text-[8px] font-black text-[#3b82f6]">Mains: {t.m}</span>
                    </div>
                  </div>
                  {t.id === currentTopicId && <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Header (same style as approved) */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/20 px-3 py-1 text-[9px] font-black uppercase text-[#085041]">
              Part 1 — Physical Geography
            </span>
            <span className="rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 text-[9px] font-black text-[#92400e]">
              Prelims: {meta?.p}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl bg-gradient-to-r from-[#13251d] to-[#1d9e75] bg-clip-text text-transparent">
            {currentTopicId} {topicData?.title || meta?.title}
          </h1>
          <div className="mt-4">
            <ProgressIndicator current={visitedTabs.size} total={TABS.length} />
          </div>
        </motion.div>

        {/* Tab Navigation (same style as approved) */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white/60 border border-[#dcd5c7] p-1.5 shadow-sm backdrop-blur-sm">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isVisited = visitedTabs.has(tab.id);
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md scale-[1.02]"
                    : isVisited
                    ? "text-[#1d9e75] hover:bg-[#e7f5ee]"
                    : "text-[#5d675f] hover:bg-[#f7f4ee]"
                }`}>
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {isVisited && !isActive && <CheckCircle2 className="h-3 w-3 text-[#1d9e75]" />}
              </button>
            );
          })}
        </div>

        {/* Fact Card */}
        <FactCard topicData={topicData} />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-[#1d9e75] border-t-transparent rounded-full" />
          </div>
        )}

        {/* Tab Content */}
        {!loading && topicData && (
          <AnimatePresence mode="wait">
            <motion.div key={`${currentTopicId}-${activeTab}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === "learn" && currentSection && <LearnSection blocks={currentSection.blocks} />}
              {activeTab === "ncert" && currentSection && <NcertSection blocks={currentSection.blocks} />}
              {activeTab === "current" && currentSection && <CurrentAffairsSection blocks={currentSection.blocks} />}
              {activeTab === "traps" && currentSection && <TrapsSection blocks={currentSection.blocks} />}
              {activeTab === "pyq" && currentSection && <PyqSection blocks={currentSection.blocks} />}
              {activeTab === "mains" && currentSection && <MainsPyqSection blocks={currentSection.blocks} />}
              {activeTab === "practice" && currentSection && <PracticeSection blocks={currentSection.blocks} />}
              {activeTab === "answers" && currentSection && <AnswersSection blocks={currentSection.blocks} />}
              {!currentSection && (
                <div className="rounded-xl border border-[#dcd5c7] bg-[#f7f4ee] p-8 text-center">
                  <p className="text-sm font-semibold text-[#5d675f]">Section not available for this topic.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Next Topic Teaser (same style as approved) */}
        {nextTopic && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-8 rounded-2xl border border-[#dcd5c7] bg-white/50 p-5 backdrop-blur-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase text-[#5d675f]">Next Sub-topic</p>
              <p className="mt-0.5 text-sm font-black text-[#13251d]">{nextTopic.id} {nextTopic.title}</p>
            </div>
            <button onClick={() => setCurrentTopicId(nextTopic.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-md hover:scale-105 transition">
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Previous Topic */}
        {prevTopic && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-3 rounded-2xl border border-[#dcd5c7] bg-white/50 p-4 backdrop-blur-sm flex items-center gap-3">
            <button onClick={() => setCurrentTopicId(prevTopic.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dcd5c7] text-[#5d675f] hover:bg-[#e7f5ee] transition">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div>
              <p className="text-[9px] font-black uppercase text-[#5d675f]">Previous</p>
              <p className="text-xs font-black text-[#13251d]">{prevTopic.id} {prevTopic.title}</p>
            </div>
          </motion.div>
        )}

      </div>
    </main>
  );
}
