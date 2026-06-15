/**
 * IMPROVED VERSION - Landing Page Report Section
 * 
 * This shows how the "2026 audit proof" section should be rewritten
 * to be student-friendly instead of developer-focused
 */

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Target, TrendingUp } from "lucide-react";

export function ImprovedPrelimsShowcaseEntry() {
  return (
    <div
      data-testid="upsc-public-showcase-entry"
      className="rounded-lg border border-[#bfd7cf] bg-[#fffdf8] p-6 shadow-sm"
    >
      {/* Hero Section - Student-First */}
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#1d9e75]">
                UPSC Prelims 2026 Results
              </p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">
                How Did Our Course Perform?
              </h2>
            </div>
          </div>
          
          {/* Clear Value Proposition */}
          <p className="text-base leading-relaxed text-[#5d675f]">
            We analyzed all 100 questions from UPSC Prelims 2026 and compared them to everything 
            we taught in our course. Here's the complete, transparent breakdown.
          </p>
        </div>

        {/* Big Result - Visual Impact */}
        <div className="rounded-lg border border-[#1d9e75]/30 bg-[#e7f5ee] p-5">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-start md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <div className="text-5xl font-black text-[#085041]">76%</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[#1d9e75]">
                Effective Coverage
              </div>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-[#13251d]">
                74 out of 97 questions covered in our course
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-[#5d675f]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                  44 Direct matches
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-[#d8891c]" />
                  30 Partial matches
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What Students Get - Clear Benefits */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-md border border-[#dcd5c7] bg-white p-4">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#1d9e75]" />
            <div>
              <p className="text-sm font-bold text-[#13251d]">
                See Exactly What We Covered
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#5d675f]">
                Question-by-question breakdown showing which topics from our course appeared in the exam
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-[#dcd5c7] bg-white p-4">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#1d9e75]" />
            <div>
              <p className="text-sm font-bold text-[#13251d]">
                Understand the Gaps
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#5d675f]">
                Transparent analysis of the 23 questions we didn't cover and why
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-[#dcd5c7] bg-white p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1d9e75]" />
            <div>
              <p className="text-sm font-bold text-[#13251d]">
                Subject-Wise Performance
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#5d675f]">
                Detailed breakdown for History, Geography, Economy, Environment, Science, and more
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-[#dcd5c7] bg-white p-4">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#1d9e75]" />
            <div>
              <p className="text-sm font-bold text-[#13251d]">
                Our 2027 Improvement Plan
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#5d675f]">
                See exactly what we're adding to the course based on these results
              </p>
            </div>
          </div>
        </div>

        {/* Transparency Statement - Builds Trust */}
        <div className="rounded-md bg-[#f7f4ee] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8c5d14]">
            Why We Share This
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#5d675f]">
            Most institutes hide their actual results. We believe you deserve complete transparency 
            about what works and what doesn't. This analysis shows our strengths and our gaps—because 
            your success depends on honest preparation, not marketing claims.
          </p>
        </div>

        {/* Clear CTA */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/upsc-prelims-2026-showcase"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-bold text-white transition hover:bg-[#10291d]"
          >
            View Complete Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/upsc/geography"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] px-6 text-sm font-bold text-[#085041] transition hover:bg-[#d8f0e6]"
          >
            Start Learning Now
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * KEY IMPROVEMENTS:
 * 
 * 1. ✅ Clear, Student-Focused Headline
 *    - "How Did Our Course Perform?" instead of "2026 audit proof"
 * 
 * 2. ✅ Big Visual Result
 *    - 76% coverage shown prominently with context
 * 
 * 3. ✅ Benefits, Not Features
 *    - "See what we covered" instead of "Complete MCQs with matched portions"
 * 
 * 4. ✅ Transparency Statement
 *    - Builds trust by admitting gaps
 * 
 * 5. ✅ Clear Next Steps
 *    - "View Complete Analysis" instead of "View audit page"
 * 
 * 6. ❌ REMOVED:
 *    - All technical jargon
 *    - File system references
 *    - Developer metrics
 *    - Confusing terms like "proof feed", "audit ledger"
 */
