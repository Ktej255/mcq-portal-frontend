"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ExternalLink, Loader2, Newspaper } from "lucide-react";

import { NotYetAuthored } from "@/components/upsc/read/NotYetAuthored";
import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type CurrentAffairsFeedOut,
  type CurrentAffairsItemOut,
} from "@/services/api/optionalService";

/**
 * CurrentAffairsFeed — the subject-specific current-affairs surface
 * (spec task 17.1, R11.4). Shown only for subjects whose config enables the
 * `currentAffairs` feature module (Public Administration today), proving the
 * per-subject framework generalizes a subject-specific feature beyond Geography.
 *
 * Fetches `GET /api/v1/optional/{slug}/current-affairs` (reviewed-only). The
 * backend gates draft items, so until items are reviewed this shows the shared
 * {@link NotYetAuthored} state — never fabricated news.
 */

const PALETTE = {
  bg: "#f7f4ee",
  card: "#fffdf8",
  border: "#dcd5c7",
  borderSoft: "#e6dcc2",
  accent: "#1d9e75",
  muted: "#5d675f",
  sand: "#8a7a52",
};

type LoadState = "idle" | "loading" | "loaded" | "error";

export interface CurrentAffairsFeedProps {
  slug: string;
  onClose?: () => void;
}

export function CurrentAffairsFeed({ slug, onClose }: CurrentAffairsFeedProps) {
  const { isLoaded, isSignedIn } = useApiConfig();
  const [data, setData] = useState<CurrentAffairsFeedOut | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setState("loading");
    setError(null);
    optionalService
      .getCurrentAffairs(slug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setState("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(messageFromError(err));
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isLoaded, isSignedIn]);

  const items = useMemo(() => {
    const all = data?.items ?? [];
    return topic ? all.filter((i) => i.topic === topic) : all;
  }, [data, topic]);

  return (
    <main
      data-testid="current-affairs-feed"
      data-slug={slug}
      className="min-h-screen text-[#13251d]"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
        <section
          className="rounded-2xl border p-5 shadow-sm md:p-6"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              data-testid="current-affairs-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to subject
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <Newspaper className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Current affairs · Subject-specific
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {data?.name ?? "Current affairs"}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
            Exam-oriented current affairs curated for this subject. Only reviewed items appear.
          </p>

          {data && data.topics.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2" data-testid="current-affairs-topics">
              <TopicChip label="All" active={topic === null} onClick={() => setTopic(null)} />
              {data.topics.map((t) => (
                <TopicChip key={t} label={t} active={topic === t} onClick={() => setTopic(t)} />
              ))}
            </div>
          ) : null}
        </section>

        {state === "loading" ? <LoadingPanel /> : null}
        {state === "error" && error ? <ErrorPanel message={error} /> : null}

        {state === "loaded" ? (
          data && data.items.length > 0 ? (
            <section data-testid="current-affairs-items" className="flex flex-col gap-3">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </section>
          ) : (
            <NotYetAuthored
              title={data?.name ?? slug}
              testid="current-affairs-not-authored"
              message="Reviewed current affairs for this subject arrive in a later step — draft items are under review."
            />
          )
        ) : null}
      </div>
    </main>
  );
}

function TopicChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] transition-colors ${
        active
          ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
          : "border-[#dcd5c7] bg-[#faf6ee] text-[#31443a] hover:border-[#1d9e75]"
      }`}
    >
      {label}
    </button>
  );
}

function ItemCard({ item }: { item: CurrentAffairsItemOut }) {
  return (
    <article
      data-testid="current-affairs-item"
      data-item-id={item.id}
      className="rounded-2xl border p-4 shadow-sm md:p-5"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {item.topic ? (
          <span className="inline-flex items-center rounded-full bg-[#1a3a2a] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white">
            {item.topic}
          </span>
        ) : null}
        {item.published_on ? (
          <span className="text-[11px] font-bold text-[#8a7a52]">{item.published_on}</span>
        ) : null}
      </div>
      <h2 className="mt-2 text-base font-black tracking-tight text-[#13251d]">{item.title}</h2>
      {item.summary ? (
        <p className="mt-1.5 text-sm font-semibold leading-6 text-[#31443a]">{item.summary}</p>
      ) : null}
      {item.source_url ? (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.1em] text-[#2e7d4f] hover:text-[#1a3a2a]"
        >
          Source <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </article>
  );
}

function LoadingPanel() {
  return (
    <div
      data-testid="current-affairs-loading"
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-10 text-sm font-bold text-[#5d675f]"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#1d9e75]" />
      Loading current affairs…
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      data-testid="current-affairs-error"
      className="flex items-start gap-2 rounded-2xl border border-[#e6c2c2] bg-[#fbf0ee] px-4 py-5 text-sm font-semibold text-[#8a4b52]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function messageFromError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { response?: { status?: number }; message?: string };
    if (anyErr.response?.status === 404) {
      return "Current affairs aren't available for this subject yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load current affairs. Please try again.";
}

export default CurrentAffairsFeed;
