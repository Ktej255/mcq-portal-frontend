"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock, Search, Sparkles } from "lucide-react";

import { RichBlocks } from "@/components/gs-lms/RichBlockRenderer";
import { SubjectLmsProvider } from "@/components/gs-lms/SubjectLmsContext";
import { examBasePath } from "@/lib/exams/examRoutes";
import { VideoPlayer } from "@/components/gs-lms/VideoPlayer";
import {
  getGateError,
  gsLmsService,
  type ConceptVersion,
  type ExplainResult,
  type StudyCard,
  type StudyHit,
  type StudyNext,
} from "@/services/api/gsLmsService";

const MIN_EXPLANATION_CHARS = 10;
const MAX_EXPLANATION_CHARS = 4000;
const MAX_QUERY_CHARS = 200;
const DEBOUNCE_MS = 300;

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#dcd5c7] bg-white px-5 py-2.5 text-sm font-bold text-[#13251d] hover:bg-[#f7f4ee] disabled:cursor-not-allowed disabled:opacity-50";

/** Keyed async result: "loading" is simply "the stored key is not the wanted key". */
type Keyed<T> = { key: string; value: T };

type CardState =
  | { status: "ok"; card: StudyCard }
  | { status: "locked"; reason: string }
  | { status: "error" };

type SearchState = { status: "ok"; hits: StudyHit[] } | { status: "error" };

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#5d675f]">Loading…</div>}>
      <StudyScreen />
    </Suspense>
  );
}

function StudyScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth for what is searched and which card is open.
  const qParam = (searchParams.get("q") ?? "").slice(0, MAX_QUERY_CHARS);
  const conceptParam = searchParams.get("concept");
  const conceptId = conceptParam && /^\d+$/.test(conceptParam) ? Number(conceptParam) : null;

  const [input, setInput] = useState(qParam);
  const [searchResult, setSearchResult] = useState<Keyed<SearchState> | null>(null);
  const [cardResult, setCardResult] = useState<Keyed<CardState> | null>(null);
  const [versionOverride, setVersionOverride] = useState<{ conceptId: number; version: ConceptVersion } | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [continueState, setContinueState] = useState<
    { status: "idle" } | { status: "loading" } | { status: "error" } | { status: "step"; step: StudyNext }
  >({ status: "idle" });
  // Subject of the last hit opened, so a locked card can point at its syllabus.
  const [hintSubject, setHintSubject] = useState<string | null>(null);
  const cardTopRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);

  const setUrl = useCallback(
    (q: string, concept: number | null, mode: "push" | "replace") => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (concept != null) params.set("concept", String(concept));
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [pathname, router],
  );

  // Debounce typing into the URL (?q=). The open concept stays as it is.
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === qParam.trim()) return;
    const timer = window.setTimeout(() => setUrl(trimmed, conceptId, "replace"), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input, qParam, conceptId, setUrl]);

  // Search whenever the committed query changes.
  const searchKey = qParam.trim();
  useEffect(() => {
    if (!searchKey) return;
    let cancelled = false;
    gsLmsService
      .studySearch(searchKey)
      .then((hits) => !cancelled && setSearchResult({ key: searchKey, value: { status: "ok", hits } }))
      .catch(() => !cancelled && setSearchResult({ key: searchKey, value: { status: "error" } }));
    return () => {
      cancelled = true;
    };
  }, [searchKey]);

  // Load the study card whenever ?concept= changes.
  const cardKey = conceptId != null ? String(conceptId) : "";
  useEffect(() => {
    if (conceptId == null) return;
    let cancelled = false;
    gsLmsService
      .getStudyCard(conceptId)
      .then((card) => !cancelled && setCardResult({ key: cardKey, value: { status: "ok", card } }))
      .catch((err) => {
        if (cancelled) return;
        const gate = getGateError(err);
        setCardResult({
          key: cardKey,
          value: gate && gate.status === 423 ? { status: "locked", reason: gate.detail } : { status: "error" },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [conceptId, cardKey]);

  const searching = searchKey !== "" && searchResult?.key !== searchKey;
  const search = searchKey !== "" && searchResult?.key === searchKey ? searchResult.value : null;
  const cardLoading = conceptId != null && cardResult?.key !== cardKey;
  const cardState = conceptId != null && cardResult?.key === cardKey ? cardResult.value : null;

  const openConcept = useCallback(
    (id: number, subjectSlug?: string | null) => {
      if (subjectSlug) setHintSubject(subjectSlug);
      setContinueState({ status: "idle" });
      setUrl(input.trim() || qParam.trim(), id, "push");
      window.setTimeout(() => cardTopRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 50);
    },
    [input, qParam, setUrl],
  );

  const openHit = (hit: StudyHit) => {
    const id = hit.kind === "concept" ? hit.concept_id : hit.start_concept_id;
    if (id != null) openConcept(id, hit.subject_slug);
  };

  const handleContinue = async () => {
    setContinueState({ status: "loading" });
    try {
      const step = await gsLmsService.getStudyNext();
      if (step.type === "concept" && step.concept_id != null) {
        openConcept(step.concept_id, step.subject_slug);
      } else {
        setContinueState({ status: "step", step });
      }
    } catch {
      setContinueState({ status: "error" });
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      const first = resultsRef.current?.querySelector<HTMLButtonElement>("button[data-hit]");
      if (first) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === "Enter") {
      const trimmed = input.trim();
      if (trimmed !== qParam.trim()) setUrl(trimmed, conceptId, "replace");
      else if (search?.status === "ok" && search.hits.length > 0) openHit(search.hits[0]);
    }
  };

  const handleResultKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-hit]"));
    const index = buttons.findIndex((b) => b === document.activeElement);
    if (index === -1) return;
    e.preventDefault();
    if (e.key === "ArrowDown") buttons[Math.min(index + 1, buttons.length - 1)]?.focus();
    else if (index === 0) document.getElementById("study-search-input")?.focus();
    else buttons[index - 1]?.focus();
  };

  const handleSwitchVersion = async (card: StudyCard, versionId: number) => {
    setVersionLoading(true);
    try {
      const version = await gsLmsService.getConceptVersion(card.subject_slug, card.concept_id, versionId);
      setVersionOverride({ conceptId: card.concept_id, version });
    } catch {
      // Keep showing the current version; the switcher can be tried again.
    } finally {
      setVersionLoading(false);
    }
  };

  const hasQuery = searchKey !== "";
  const hits = search?.status === "ok" ? search.hits : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8" data-testid="study-page">
      <header className="space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">Study</p>
          <h1 className="text-2xl font-black tracking-tight text-[#1a3a2a] md:text-3xl">What do you want to study?</h1>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b7469]" aria-hidden />
          <input
            id="study-search-input"
            data-testid="study-search-input"
            type="search"
            value={input}
            maxLength={MAX_QUERY_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="e.g. Preamble, Fundamental Rights, monsoon"
            aria-label="What do you want to study?"
            autoComplete="off"
            className="w-full rounded-2xl border-2 border-[#dcd5c7] bg-[#fffdf8] py-4 pl-12 pr-4 text-base text-[#13251d] shadow-sm outline-none placeholder:text-[#a59f93] focus:border-[#1d9e75]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="study-continue"
            onClick={handleContinue}
            disabled={continueState.status === "loading"}
            className={SECONDARY_BUTTON}
          >
            {continueState.status === "loading" ? "Finding your place…" : "Continue where I left off"}
          </button>
          {continueState.status === "error" ? (
            <span className="text-sm text-red-700">Couldn&apos;t find your place just now. Please try again.</span>
          ) : null}
        </div>
        {continueState.status === "step" ? (
          <div data-testid="study-continue-result" className="rounded-2xl border border-[#dcd5c7] bg-white p-4">
            <NextAction step={continueState.step} onOpenConcept={openConcept} />
          </div>
        ) : null}
      </header>

      {hasQuery ? (
        <section aria-label="Search results" aria-live="polite" data-testid="study-results">
          {searching ? <p className="text-sm text-[#5d675f]">Searching…</p> : null}
          {search?.status === "error" ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              Search isn&apos;t working right now. Please try again in a moment.
            </p>
          ) : null}
          {search?.status === "ok" && hits.length === 0 ? <NoResults /> : null}
          {hits.length > 0 ? (
            <ul ref={resultsRef} onKeyDown={handleResultKeyDown} className="space-y-2">
              {hits.map((hit, i) => {
                const target = hit.kind === "concept" ? hit.concept_id : hit.start_concept_id;
                return (
                  <li key={`${hit.kind}-${hit.leaf_id}-${hit.concept_id ?? "t"}-${i}`}>
                    <button
                      type="button"
                      data-hit
                      data-testid="study-hit"
                      disabled={target == null}
                      onClick={() => openHit(hit)}
                      className="w-full rounded-2xl border border-[#dcd5c7] bg-white p-4 text-left transition-colors hover:border-[#1d9e75] hover:bg-[#f7f4ee] focus:border-[#1d9e75] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30 disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#7b7469]">
                        <span className="rounded-full bg-[#e7f5ee] px-2 py-0.5 text-[#1d9e75]">
                          {hit.kind === "concept" ? "Concept" : "Topic"}
                        </span>
                        {hit.subject_name}
                      </span>
                      <span className="mt-1 block text-base font-bold text-[#13251d]">
                        {hit.kind === "concept" ? hit.concept_title : hit.leaf_title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#5d675f]">{hit.breadcrumb.join(" › ")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div ref={cardTopRef} className="scroll-mt-4">
        {cardLoading ? (
          <p data-testid="study-card-loading" className="text-sm text-[#5d675f]">
            Opening…
          </p>
        ) : null}
        {cardState?.status === "locked" ? <LockedMessage reason={cardState.reason} subject={hintSubject} /> : null}
        {cardState?.status === "error" ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            We couldn&apos;t open that concept. It may have been moved. Try searching for it again.
          </p>
        ) : null}
        {cardState?.status === "ok" ? (
          <StudyCardView
            key={cardState.card.concept_id}
            card={cardState.card}
            version={
              versionOverride && versionOverride.conceptId === cardState.card.concept_id
                ? versionOverride.version
                : cardState.card.version
            }
            versionLoading={versionLoading}
            onSwitchVersion={(id) => handleSwitchVersion(cardState.card, id)}
            onOpenConcept={openConcept}
          />
        ) : null}
      </div>
    </div>
  );
}

function NoResults() {
  const base = examBasePath(usePathname());
  const [subjects, setSubjects] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    gsLmsService
      .getSubjects()
      .then((all) => !cancelled && setSubjects(all.filter((s) => s.available).map((s) => ({ slug: s.slug, name: s.name }))))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div data-testid="study-no-results" className="space-y-3 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-6">
      <h2 className="text-lg font-black text-[#1a3a2a]">We don&apos;t have this yet</h2>
      <p className="text-sm leading-relaxed text-[#49675e]">
        We&apos;ve noted your request and our team will add it. In the meantime, you can browse the syllabus or try
        different words.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {(subjects.length > 0 ? subjects : [{ slug: "geography", name: "Geography" }]).map((s) => (
          <Link key={s.slug} href={`${base}/${s.slug}/lms/syllabus`} className={SECONDARY_BUTTON}>
            Browse {s.name} syllabus
          </Link>
        ))}
      </div>
    </div>
  );
}

function LockedMessage({ reason, subject }: { reason: string; subject: string | null }) {
  const base = examBasePath(usePathname());
  return (
    <div
      data-testid="study-locked"
      className="mx-auto max-w-lg space-y-4 rounded-2xl border border-[#dcd5c7] bg-white p-8 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f4ee]">
        <Lock className="h-6 w-6 text-[#5d675f]" aria-hidden />
      </div>
      <h2 className="text-lg font-black text-[#1a3a2a]">This topic is locked</h2>
      <p data-testid="study-locked-reason" className="text-sm leading-relaxed text-[#49675e]">
        {reason}
      </p>
      <Link href={subject ? `${base}/${subject}/lms/syllabus` : base} className="text-xs font-bold text-[#1d9e75] hover:underline">
        {subject ? "Back to syllabus" : "Back to today"}
      </Link>
    </div>
  );
}

function StudyCardView({
  card,
  version,
  versionLoading,
  onSwitchVersion,
  onOpenConcept,
}: {
  card: StudyCard;
  version: ConceptVersion | null;
  versionLoading: boolean;
  onSwitchVersion: (versionId: number) => void;
  onOpenConcept: (id: number, subject?: string | null) => void;
}) {
  const shownId = version?.id ?? null;
  // Every version the student can switch to, other than the one on screen.
  const choices = [
    ...(card.version ? [card.version] : []),
    ...card.alternatives,
  ].filter((v) => v.id !== shownId);

  return (
    <article data-testid="study-card" className="space-y-6">
      <div className="space-y-2 rounded-2xl border border-[#dcd5c7] bg-white p-5 md:p-6">
        <p className="text-xs text-[#5d675f]">{card.breadcrumb.join(" › ")}</p>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1d9e75]">
          {card.subject_name} · Concept {card.position} of {card.total_concepts}
        </p>
        <h2 className="text-xl font-black tracking-tight text-[#1a3a2a]">{card.concept_title}</h2>
        {card.mastery.passed ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1d9e75]">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> You&apos;ve already got this one
          </p>
        ) : null}
      </div>

      {choices.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose how to learn this">
          <span className="text-xs font-bold text-[#5d675f]">Prefer a different style?</span>
          {choices.map((v) => (
            <button
              key={v.id}
              type="button"
              data-testid="version-switch"
              disabled={versionLoading}
              onClick={() => onSwitchVersion(v.id)}
              className="rounded-full border border-[#dcd5c7] bg-[#fffdf8] px-3 py-1 text-xs font-bold text-[#13251d] hover:border-[#1d9e75] hover:text-[#1d9e75] disabled:opacity-50"
            >
              {versionLabel(v.level, v.style)}
            </button>
          ))}
        </div>
      ) : null}

      <section data-testid="study-content" className="space-y-4" aria-busy={versionLoading}>
        {version ? (
          <>
            <h3 className="text-base font-black text-[#13251d]">{version.title}</h3>
            {version.video_url ? (
              <SubjectLmsProvider subject={card.subject_slug} label={card.subject_name}>
                <VideoPlayer videoUrl={version.video_url} watched={false} nodeId={card.leaf_id} />
              </SubjectLmsProvider>
            ) : null}
            {version.blocks.length > 0 ? <RichBlocks blocks={version.blocks} /> : null}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-[#dcd5c7] bg-[#fffdf8] p-4 text-sm text-[#5d675f]">
            The explanation for this concept is still being prepared. You can still test yourself below.
          </p>
        )}
      </section>

      <ExplainStep key={card.concept_id} card={card} onSwitchVersion={onSwitchVersion} onOpenConcept={onOpenConcept} />
    </article>
  );
}

function versionLabel(level: string, style: string): string {
  if (style === "VISUAL") return "Visual";
  if (style === "STORY") return "Story";
  if (style === "VIDEO") return "Video";
  if (level === "BASIC") return "Simpler";
  if (level === "ADVANCED") return "Deeper";
  return "Standard";
}

function ExplainStep({
  card,
  onSwitchVersion,
  onOpenConcept,
}: {
  card: StudyCard;
  onSwitchVersion: (versionId: number) => void;
  onOpenConcept: (id: number, subject?: string | null) => void;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState("");
  const length = text.trim().length;
  const tooShort = length < MIN_EXPLANATION_CHARS;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      setResult(await gsLmsService.explainConcept(card.concept_id, text.trim()));
    } catch (err) {
      const gate = getGateError(err);
      setError(gate ? gate.detail : "We couldn't check that just now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section data-testid="explain-step" className="space-y-4 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 md:p-6">
      <div>
        <h3 className="text-base font-black text-[#1a3a2a]">Explain it in your own words</h3>
        <p className="text-sm text-[#49675e]">
          Close your eyes for a second, then write what you remember. We&apos;ll show what you covered and what&apos;s
          still missing.
        </p>
      </div>
      <div>
        <textarea
          data-testid="explain-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_EXPLANATION_CHARS))}
          rows={6}
          aria-label="Your explanation"
          placeholder="In my own words…"
          className="w-full rounded-xl border border-[#dcd5c7] bg-white p-3 text-sm text-[#13251d] outline-none focus:border-[#1d9e75]"
        />
        <p data-testid="explain-count" className="mt-1 text-xs text-[#5d675f]">
          {length} / {MAX_EXPLANATION_CHARS} characters
          {tooShort ? ` · write at least ${MIN_EXPLANATION_CHARS}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="explain-submit"
          onClick={submit}
          disabled={tooShort || submitting}
          className={PRIMARY_BUTTON}
        >
          {submitting ? "Checking…" : result ? "Check again" : "Check my explanation"}
        </button>
        {error ? <span role="alert" className="text-sm text-red-700">{error}</span> : null}
      </div>

      {result ? (
        <div data-testid="explain-result" className="space-y-4 border-t border-[#dcd5c7] pt-4" aria-live="polite">
          <p data-testid="explain-score" className="text-lg font-black text-[#13251d]">
            {Math.round(result.score * 100)}% of the key ideas
          </p>
          {result.covered_points.length > 0 ? (
            <div data-testid="covered-points" className="rounded-xl border border-[#b9e2d0] bg-[#e7f5ee] p-4">
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-[#14724f]">You covered</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[#14513a]">
                {result.covered_points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.missed_points.length > 0 ? (
            <div data-testid="missed-points" className="rounded-xl border border-[#f3d79a] bg-[#fdf3dc] p-4">
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-[#8c5d14]">Still missing</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[#6b4710]">
                {result.missed_points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.passed ? (
            <div data-testid="explain-passed" className="space-y-3 rounded-xl bg-[#1a3a2a] p-4 text-white">
              <p className="flex items-center gap-2 text-sm font-black">
                <Sparkles className="h-4 w-4" aria-hidden /> Nicely done. You&apos;ve got this concept.
              </p>
              {result.next ? (
                <NextAction step={result.next} onOpenConcept={onOpenConcept} dark />
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="w-full text-sm text-[#49675e]">Not quite yet. Add what&apos;s missing and try again.</p>
              <button
                type="button"
                data-testid="explain-retry"
                className={SECONDARY_BUTTON}
                onClick={() => {
                  setResult(null);
                  document.querySelector<HTMLTextAreaElement>('[data-testid="explain-input"]')?.focus();
                }}
              >
                Try again
              </button>
              {result.suggested_version != null ? (
                <button
                  type="button"
                  data-testid="explain-simpler"
                  className={SECONDARY_BUTTON}
                  onClick={() => {
                    onSwitchVersion(result.suggested_version!);
                    document.querySelector('[data-testid="study-content"]')?.scrollIntoView?.({ behavior: "smooth" });
                  }}
                >
                  See a simpler explanation
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function NextAction({
  step,
  onOpenConcept,
  dark = false,
}: {
  step: StudyNext;
  onOpenConcept: (id: number, subject?: string | null) => void;
  dark?: boolean;
}) {
  const cls = dark
    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-[#1a3a2a]"
    : PRIMARY_BUTTON;
  const slug = step.subject_slug;
  const base = examBasePath(usePathname());

  if (step.type === "concept" && step.concept_id != null) {
    return (
      <button type="button" data-testid="next-action" className={cls} onClick={() => onOpenConcept(step.concept_id!, slug)}>
        {step.label || "Next concept"} <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    );
  }
  if (step.type === "mcq_lab" && slug && step.leaf_id != null) {
    return (
      <Link data-testid="next-action" className={cls} href={`${base}/${slug}/lms/topic/${step.leaf_id}`}>
        {step.label || "Practice with the MCQ lab"} <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    );
  }
  if (step.type === "checkpoint" && slug && step.checkpoint_id != null) {
    return (
      <Link data-testid="next-action" className={cls} href={`${base}/${slug}/lms/checkpoint/${step.checkpoint_id}`}>
        {step.label || "Take the review test"} <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    );
  }
  return (
    <p data-testid="next-done" className={`text-sm font-bold ${dark ? "text-white" : "text-[#1a3a2a]"}`}>
      {step.label || "You've finished everything we have for now. Check back soon for more."}
    </p>
  );
}
