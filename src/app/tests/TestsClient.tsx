"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Repeat2,
} from "lucide-react";

import { useAuth } from "@/lib/contexts/AuthContext";
import DashboardLayout from "../(dashboard)/layout";
import { PageShell, PageHero, StartFreeCta } from "@/components/marketing/PageShell";
import { JsonLd } from "@/components/marketing/JsonLd";
import { testFormats, testFeatures } from "@/components/marketing/site-data";
import { SITE_URL, ORG_NAME } from "@/lib/seo";
import { examService, TestMetadata } from "@/services/api/examService";

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
  const router = useRouter();
  const [tests, setTests] = useState<TestMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testsLoadError, setTestsLoadError] = useState<string | null>(null);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const testsRequestRef = useRef(0);

  // `loading` begins true, so the loader never writes state synchronously and
  // stays safe to call from the mount effect. The retry button resets the list
  // and the failure message itself before asking for a fresh load.
  //
  // The writes live in promise callbacks rather than after an `await`, so the
  // linter can prove they only ever run as an asynchronous continuation.
  const loadTests = useCallback(() => {
    const requestId = ++testsRequestRef.current;

    examService
      .getAvailableTests()
      .then((availableTests) => {
        if (requestId !== testsRequestRef.current) return;
        setTests(availableTests);
        setTestsLoadError(null);
      })
      .catch(() => {
        if (requestId === testsRequestRef.current) {
          setTestsLoadError("Tests are temporarily unavailable. Please retry.");
        }
      })
      .finally(() => {
        if (requestId === testsRequestRef.current) setLoading(false);
      });
  }, []);

  const retryLoadTests = () => {
    setLoading(true);
    setTestsLoadError(null);
    setTests([]);
    loadTests();
  };

  useEffect(() => {
    loadTests();
    return () => {
      testsRequestRef.current += 1;
    };
  }, [loadTests]);

  const startTest = async (test: TestMetadata) => {
    setStartingTestId(test.id);
    setError(null);
    try {
      const attempt = await examService.startAttempt(test.id);
      if (!attempt.attemptId) {
        throw new Error("The test did not return an attempt ID.");
      }
      router.push(`/exam/${test.id}?attemptId=${encodeURIComponent(attempt.attemptId)}`);
    } catch {
      setError("This test could not be started. Please try again.");
    } finally {
      setStartingTestId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">UPSC Practice and MCQs</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
            Start an authoritative test attempt or continue with topic-linked Geography LMS practice.
          </p>
        </section>

        {error && (
          <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        )}
        {testsLoadError && (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            <span>{testsLoadError}</span>
            <button
              type="button"
              onClick={retryLoadTests}
              disabled={loading}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Retrying…" : "Retry"}
            </button>
          </div>
        )}

        <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">Available tests</h2>
              <p className="mt-1 text-sm font-medium text-[#657066]">Published questions and attempt availability come from the server.</p>
            </div>
            <ClipboardCheck className="h-5 w-5 text-[#085041]" />
          </div>

          {loading ? (
            <p className="mt-6 text-sm font-semibold text-[#657066]">Loading available tests…</p>
          ) : tests.length === 0 ? (
            <p className="mt-6 text-sm font-semibold text-[#657066]">No published tests are available yet.</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {tests.map((test) => {
                const canStart = test.canStart !== false && Boolean(test.totalQuestions);
                const isStarting = startingTestId === test.id;
                return (
                  <article key={test.id} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">{test.title}</h3>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#1d9e75]">{test.subject}</p>
                      </div>
                      <span className="text-xs font-bold text-[#657066]">{test.totalQuestions ?? 0} questions</span>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-6 text-[#657066]">{test.description || "Server-published practice test."}</p>
                    <button
                      type="button"
                      disabled={!canStart || isStarting}
                      onClick={() => startTest(test)}
                      className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isStarting ? "Starting…" : canStart ? "Start test" : "Unavailable"}
                      {canStart && !isStarting ? <ArrowRight className="ml-2 h-3.5 w-3.5" /> : null}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <ClipboardCheck className="h-5 w-5 text-[#085041]" />
            <h2 className="mt-4 text-xl font-black tracking-tight">Geography LMS Practice</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">Complete daily topic checks and practice sets sequentially on the LMS.</p>
            <Link href="/upsc/geography/lms/practice" className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white transition hover:bg-[#10291d]">
              Open LMS Practice <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <ClipboardCheck className="h-5 w-5 text-[#085041]" />
            <h2 className="mt-4 text-xl font-black tracking-tight">Question Bank</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#657066]">Build custom MCQ practice sets from your accumulated learning evidence.</p>
            <Link href="/upsc/question-bank" className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white transition hover:bg-[#10291d]">
              Open Question Bank <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
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
        sub="From a 5-minute daily quiz to sectional sets and Mains answer writing — every attempt feeds your weakness map and revision queue, so practice actually moves the needle."
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
