import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  PenTool,
  Layers,
  FileText,
  CheckCircle2,
  BarChart3,
  GraduationCap,
  MessageSquare,
} from "lucide-react";

import { PageShell, PageHero } from "@/components/marketing/PageShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "UPSC Mains Preparation — Master Answer Writing for GS & Essay | Sarit Classes",
  description:
    "Structured UPSC Mains preparation with AI-powered answer evaluation, progressive depth building, and per-paper coverage tracking. Learn to write 250-word answers that score.",
  path: "/mains",
});

const papers = [
  { name: "GS Paper I", topics: "Indian Heritage & Culture, History, Geography of the World & Society", marks: 250 },
  { name: "GS Paper II", topics: "Governance, Polity, Constitution, Social Justice, International Relations", marks: 250 },
  { name: "GS Paper III", topics: "Economy, Technology, Environment, Biodiversity, Disaster Management, Security", marks: 250 },
  { name: "GS Paper IV", topics: "Ethics, Integrity & Aptitude — case studies and applied ethics", marks: 250 },
  { name: "Essay", topics: "Two essays from a choice of topics (philosophical, socio-economic, political)", marks: 250 },
  { name: "Optional Paper I", topics: "In-depth coverage of your chosen optional subject", marks: 250 },
  { name: "Optional Paper II", topics: "Advanced topics within the same optional subject", marks: 250 },
  { name: "Language Paper", topics: "Compulsory Indian language (qualifying)", marks: 300 },
  { name: "English Paper", topics: "Compulsory English comprehension (qualifying)", marks: 300 },
];

const aiFeatures = [
  {
    icon: PenTool,
    title: "Structure Feedback",
    desc: "Our AI evaluates your intro, body paragraphs, and conclusion — checking for logical flow, keyword usage, and examiner-friendly formatting.",
  },
  {
    icon: BarChart3,
    title: "Content Depth Analysis",
    desc: "Each answer is scored for factual coverage, analytical depth, and use of examples/data. Know exactly where your content falls short.",
  },
  {
    icon: GraduationCap,
    title: "Examiner Expectations",
    desc: "Trained on topper answers and examiner reports, the AI flags missed dimensions — constitutional provisions, committee reports, case studies — that examiners look for.",
  },
  {
    icon: MessageSquare,
    title: "Instant Feedback Loop",
    desc: "No waiting weeks for evaluation. Submit an answer, get detailed feedback in seconds, rewrite, and improve in the same study session.",
  },
];

const levels = [
  { level: "BASIC", desc: "Recall and define — build your foundation of facts, dates, provisions, and definitions." },
  { level: "ADVANCED", desc: "Analyse and connect — compare viewpoints, identify cause-effect, link concepts across papers." },
  { level: "NCERT", desc: "Fill gaps — ensure foundational NCERT-level clarity that examiners assume you have." },
  { level: "EXAMINER TRAPS", desc: "Avoid pitfalls — learn the subtle traps (static vs dynamic answers, one-sided arguments) that cost marks." },
];

export default function MainsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="UPSC Mains"
        title="UPSC Mains Preparation — Master Answer Writing for GS & Essay"
        sub="Mains is where selections happen. 1750 marks across 9 papers demand structured thinking, analytical depth, and disciplined answer writing. Our AI helps you build all three."
      />

      {/* What is Mains */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What is the UPSC Mains?</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#536259]">
          The Civil Services Main Examination is a written (descriptive) exam that tests your depth of understanding and ability to present arguments clearly. Only candidates who clear Prelims appear for Mains.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Papers", value: "9", note: "4 GS + Essay + 2 Optional + 2 Language" },
            { label: "Total Marks", value: "1750", note: "Across all scored papers" },
            { label: "Duration", value: "3 hours", note: "Per paper" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{s.label}</p>
              <p className="mt-2 text-2xl font-black text-[#13251d]">{s.value}</p>
              <p className="mt-1 text-xs font-semibold text-[#536259]">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Paper Breakdown */}
      <section className="border-t border-[#dcd5c7] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Paper-wise Breakdown</h2>
          <div className="mt-8 space-y-3">
            {papers.map((p) => (
              <div key={p.name} className="flex flex-col gap-2 rounded-xl border border-[#dcd5c7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#1d9e75]" />
                  <div>
                    <p className="text-sm font-black text-[#13251d]">{p.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#536259]">{p.topics}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#e7f5ee] px-3 py-1 text-xs font-black text-[#085041]">
                  {p.marks} marks
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Answer Writing — AI Evaluation */}
      <section className="border-t border-[#dcd5c7]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">AI-Powered Answer Evaluation</h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#536259]">
            Traditional test series give you marks after 2 weeks. Our AI gives you actionable feedback in seconds — so you can rewrite and improve in the same session.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {aiFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ee]">
                  <f.icon className="h-5 w-5 text-[#1d9e75]" />
                </div>
                <h3 className="mt-4 text-base font-black text-[#13251d]">{f.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#536259]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Progressive Disclosure Method */}
      <section className="border-t border-[#dcd5c7] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Our Method: Progressive Depth Building</h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#536259]">
            Every topic is taught in layers — so you build the depth required for 250-word analytical answers, not just surface awareness.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {levels.map((l, i) => (
              <div key={l.level} className="relative rounded-2xl border border-[#dcd5c7] bg-white p-5 shadow-sm">
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#e7f5ee] text-xs font-black text-[#1d9e75]">
                  {i + 1}
                </span>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8c5d14]">{l.level}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#536259]">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#dcd5c7]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8">
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Improve your answer writing</h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-7 text-[#536259]">
            Start writing better Mains answers today. Get instant AI feedback, track your progress per paper, and build the analytical depth examiners reward.
          </p>
          <Link
            href="/start"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d]"
          >
            Improve your answer writing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
