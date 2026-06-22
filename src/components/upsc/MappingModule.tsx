"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Loader2,
  ScrollText,
} from "lucide-react";

import { NotYetAuthored } from "@/components/upsc/read/NotYetAuthored";
import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type MapCategoryGroupOut,
  type MapLocationOut,
  type MappingOut,
} from "@/services/api/optionalService";

/**
 * MappingModule — the Geography-specific mapping surface (spec task 10, R10).
 *
 * Fetches the subject's reviewed mapping content from the backend
 * (`GET /api/v1/optional/{slug}/mapping`) and organizes it topic-wise by
 * feature category (river / peak / pass / lake / plateau …, R10.2). Each
 * location is clickable: opening it reveals the 3–4 line UPSC-style "what to
 * know" detail (R10.3). Each category also lists its previous-year map
 * questions, year-sorted (R10.1).
 *
 * Honesty gate (design Property 8 / R17.3): the backend returns only reviewed
 * mapping content. The seeded Geography mapping scaffold is gated as
 * UNREVIEWED draft pending founder review, so until items are reviewed this
 * shows the shared {@link NotYetAuthored} state — never fabricated map answers.
 */

const PALETTE = {
  bg: "#f7f4ee",
  card: "#fffdf8",
  border: "#dcd5c7",
  borderSoft: "#e6dcc2",
  accent: "#1d9e75",
  accentDark: "#1a3a2a",
  ink: "#13251d",
  muted: "#5d675f",
  sand: "#8a7a52",
};

type LoadState = "idle" | "loading" | "loaded" | "error";

export interface MappingModuleProps {
  /** Subject slug, e.g. "geography". */
  slug: string;
  /** Optional callback to close/return from the mapping module. */
  onClose?: () => void;
}

export function MappingModule({ slug, onClose }: MappingModuleProps) {
  const { isLoaded, isSignedIn } = useApiConfig();

  const [data, setData] = useState<MappingOut | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setState("loading");
    setError(null);
    optionalService
      .getMapping(slug)
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

  return (
    <main
      data-testid="mapping-module"
      data-slug={slug}
      className="min-h-screen text-[#13251d]"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-5 md:px-8">
        {/* Header */}
        <section
          className="rounded-2xl border p-5 shadow-sm md:p-6"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              data-testid="mapping-module-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to subject
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Mapping · Locations &amp; map questions
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {data?.name ?? "Mapping"}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
            Map locations organized by feature type. Open a location to see the few lines a UPSC
            answer needs, and review the map-based questions asked under each category.
          </p>
        </section>

        {state === "loading" ? <LoadingPanel /> : null}
        {state === "error" && error ? <ErrorPanel message={error} /> : null}

        {state === "loaded" ? (
          data && data.categories.length > 0 ? (
            <section data-testid="mapping-categories" className="flex flex-col gap-5">
              <p
                data-testid="mapping-counts"
                className="text-xs font-black uppercase tracking-[0.12em] text-[#8a7a52]"
              >
                {data.location_count} location{data.location_count === 1 ? "" : "s"} ·{" "}
                {data.question_count} question{data.question_count === 1 ? "" : "s"} ·{" "}
                {data.category_count} categor{data.category_count === 1 ? "y" : "ies"}
              </p>
              {data.categories.map((group) => (
                <CategoryBlock key={group.category} group={group} />
              ))}
            </section>
          ) : (
            <NotYetAuthored
              title={data?.name ?? slug}
              testid="mapping-module-not-authored"
              message="Reviewed mapping content (locations + 26-year map questions) arrives in a later step — draft mapping is under review for accuracy."
            />
          )
        ) : null}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Category block — locations (clickable) + map questions (R10.2/R10.3)
// ---------------------------------------------------------------------------

function CategoryBlock({ group }: { group: MapCategoryGroupOut }) {
  return (
    <div data-testid="mapping-category" data-category={group.category} className="flex flex-col gap-3">
      <div
        className="flex flex-wrap items-center gap-2 border-b border-dashed pt-1"
        style={{ borderColor: PALETTE.borderSoft }}
      >
        <MapPin className="h-4 w-4 text-[#1a3a2a]" />
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
          {group.category}
        </p>
        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]">
          · {group.location_count} location{group.location_count === 1 ? "" : "s"}
        </span>
      </div>

      {group.locations.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {group.locations.map((loc) => (
            <LocationRow key={loc.id} location={loc} />
          ))}
        </ul>
      ) : null}

      {group.questions.length > 0 ? (
        <div
          data-testid="mapping-questions"
          className="rounded-xl border p-4"
          style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.card }}
        >
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8a7a52]">
            <ScrollText className="h-3.5 w-3.5 text-[#1d9e75]" /> Map questions
          </div>
          <ul className="flex flex-col gap-2">
            {group.questions.map((q) => (
              <li
                key={q.id}
                data-testid="mapping-question"
                className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#31443a]"
              >
                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-2 py-0.5 text-[10px] font-black tracking-[0.06em] text-[#31443a]">
                  {q.year}
                </span>
                <span>{q.question_text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function LocationRow({ location }: { location: MapLocationOut }) {
  const [open, setOpen] = useState(false);
  const panelId = `mapping-location-detail-${location.id}`;
  const hasDetail = Boolean(location.detail && location.detail.trim());
  return (
    <li
      data-testid="mapping-location"
      data-location-id={location.id}
      className="overflow-hidden rounded-xl border shadow-sm"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <button
        type="button"
        data-testid="mapping-location-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1d9e75]/40"
      >
        <MapPin className="h-4 w-4 shrink-0 text-[#1d9e75]" />
        <span className="min-w-0 flex-1 truncate text-sm font-black tracking-tight text-[#13251d]">
          {location.name}
        </span>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-[#1d9e75] transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open ? (
        <div
          id={panelId}
          data-testid="mapping-location-detail"
          className="border-t px-4 py-3 text-sm font-semibold leading-6 text-[#31443a]"
          style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.bg }}
        >
          {hasDetail ? (
            location.detail
          ) : (
            <span className="text-[#8a7a52]">Detail for this location is being authored.</span>
          )}
        </div>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Loading / error
// ---------------------------------------------------------------------------

function LoadingPanel() {
  return (
    <div
      data-testid="mapping-module-loading"
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-10 text-sm font-bold text-[#5d675f]"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#1d9e75]" />
      Loading mapping…
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      data-testid="mapping-module-error"
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
      return "Mapping isn't available for this subject yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load the mapping module. Please try again.";
}

export default MappingModule;
