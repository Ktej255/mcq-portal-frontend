"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  Repeat2,
} from "lucide-react";

import { useAuth } from "@/lib/contexts/AuthContext";
import DashboardLayout from "../(dashboard)/layout";
import { useGeographyStudentOverview } from "@/lib/upsc/useGeographyStudentOverview";
import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import { testFormats, testFeatures } from "@/components/marketing/site-data";
import { SITE_URL, ORG_NAME } from "@/lib/seo";

// Client Component to handle Auth State Toggling
export default function TestsClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1d9e75]"></div>
          <p className="font-semibold animate-pulse">Loading tests portal...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <DashboardLayout>
        <StudentTestsView />
      </DashboardLayout>
    );
  }

  return <MarketingTestsView />;
}

// Student Dashboard View
function StudentTestsView() {
  const overview = useGeographyStudentOverview();
  const practiceReady = overview.loopState.room === "mcq";

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                {practiceReady ? "Your fresh MCQ is ready" : "Practice opens after proof"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                MCQs stay attached to the active class day. Complete the next learning step and the correct practice set opens automatically.
              </p>
            </div>
            <Link
              href={overview.loopState.href}
              data-testid="student-practice-primary-action"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
            >
              {overview.loopState.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <ClipboardCheck className="h-5 w-5 text-[#085041]" />
            <h2 className="mt-4 text-xl font-black tracking-tight">Day {overview.activeSession.day}: {overview.activeSession.title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">
              {practiceReady ? "The fresh set is connected to your current proof." : `Current gate: ${overview.loopState.label}.`}
            </p>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <LockKeyhole className="h-5 w-5 text-[#6f4a12]" />
            <h2 className="mt-4 text-xl font-black tracking-tight">No batch browsing</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">
              Students see one relevant set only. Wrong answers flow into Learning Gaps and Revise.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

// Marketing View
function MarketingTestsView() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tests & Practice", item: `${SITE_URL}/tests` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "UPSC Tests & Daily Practice",
    description:
      "UPSC practice on Sarit Classes: daily quizzes, Prelims test series, CSAT practice and Mains answer writing with instant solutions and analytics.",
    url: `${SITE_URL}/tests`,
    isPartOf: { "@type": "WebSite", name: ORG_NAME, url: SITE_URL },
  };

  return (
    <PageShell>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionSchema} />

      <PageHero
        eyebrow="Tests & practice"
        title="Practice that diagnoses, not just scores."
        sub="From a 5-minute daily quiz to full-length mocks and Mains answer writing — every attempt feeds your weakness map and revision queue, so practice actually moves the needle."
      />

      {/* Formats */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-[#1d9e75]" />
          <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Ways to practise</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {testFormats.map((t) => (
            <div key={t.title} className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <h3 className="text-base font-black text-[#13251d]">{t.title}</h3>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-[#dcd5c7] bg-[#fffdf8] py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[#1d9e75]" />
            <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What makes it different</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {testFeatures.map((f) => (
              <div key={f.title} className="flex flex-col rounded-2xl border border-[#dcd5c7] bg-[#f7f4ee] p-5">
                <CheckCircle2 className="h-5 w-5 text-[#1d9e75]" />
                <h3 className="mt-3 text-base font-black text-[#13251d]">{f.title}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-[#536259]">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loop tie-in */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-[#1a3a2a] to-[#0c1f17] px-8 py-12 text-center text-white">
          <Repeat2 className="h-8 w-8 text-[#7fe0bd]" />
          <h2 className="max-w-2xl text-2xl font-black tracking-tight md:text-3xl">
            MCQ is one action in the loop — not the whole product.
          </h2>
          <p className="max-w-xl text-sm font-semibold text-white/75">
            Each test updates your weak-topic queue and schedules a spaced re-test, so you stop forgetting what you practise.
          </p>
          <div className="mt-2">
            <StartFreeCta label="Take a free daily quiz" />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
