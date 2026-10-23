"use client";

import { useEffect, useState } from "react";
import { Leaf, Trash2 } from "lucide-react";

import {
  gsLmsService,
  type HandwritingInsights,
  type HandwritingPoint,
} from "@/services/api/gsLmsService";

const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#dcd5c7] bg-white px-4 py-2 text-sm font-bold text-[#13251d] hover:bg-[#f7f4ee] disabled:cursor-not-allowed disabled:opacity-50";
const DANGER_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#9b2c2c] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50";
const CARD = "rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-4 md:p-5";

const FEATURE_LABELS: Record<string, string> = {
  letter_height_rel: "Letter size",
  slant_deg: "Slant",
  line_spacing_rel: "Line spacing",
  baseline_slope_deg: "Line tilt",
  baseline_wobble: "Line straightness",
  stroke_width_rel: "Stroke thickness",
  word_gap_rel: "Gaps between words",
};

function parseDate(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
}

/** A tiny line chart with the most recent points highlighted. No axes on purpose. */
function Sparkline({ points, recent, label }: { points: HandwritingPoint[]; recent: number; label: string }) {
  if (points.length < 2) {
    return <p className="text-xs text-[#7b7469]">Not enough pages yet.</p>;
  }
  const W = 160;
  const H = 40;
  const PAD = 4;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (points.length - 1);
  const y = (v: number) => H - PAD - ((v - min) * (H - 2 * PAD)) / span;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const firstRecent = Math.max(points.length - recent, 0);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-10 w-full max-w-[160px]"
      role="img"
      aria-label={`${label} over your last ${points.length} pages`}
    >
      <path d={path} fill="none" stroke="#9aa59d" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.captured_at + i} cx={x(i)} cy={y(p.value)} r={i >= firstRecent && recent > 0 ? 2.8 : 1.8} fill={i >= firstRecent && recent > 0 ? "#1d9e75" : "#9aa59d"} />
      ))}
    </svg>
  );
}

export default function WellbeingPage() {
  const [data, setData] = useState<HandwritingInsights | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    gsLmsService
      .getHandwritingInsights()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action: () => Promise<HandwritingInsights>, done: string, optimistic?: HandwritingInsights) => {
    const previous = data;
    setBusy(true);
    setNotice(null);
    if (optimistic) setData(optimistic);
    try {
      setData(await action());
      setNotice(done);
    } catch {
      if (optimistic && previous) setData(previous);
      setNotice("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          We couldn&apos;t load this page. Please refresh.
        </p>
      </div>
    );
  }
  if (!data) {
    return <div className="p-6 text-sm text-[#5d675f]">Loading…</div>;
  }

  const seriesEntries = Object.entries(data.series).filter(([, pts]) => pts.length > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8" data-testid="wellbeing-page">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">Wellbeing</p>
        <h1 className="text-2xl font-black tracking-tight text-[#1a3a2a] md:text-3xl">Handwriting trend</h1>
        <p className="mt-1 text-sm text-[#5d675f]">
          A gentle check-in based on the photos of your handwritten answers.
        </p>
      </header>

      <section className={CARD} aria-label="What this measures">
        <h2 className="text-sm font-black uppercase tracking-wide text-[#13251d]">What it does</h2>
        <p className="mt-2 text-sm text-[#13251d]">
          When this is on, we measure a few plain things on each page you upload: letter size, slant,
          line spacing, how straight your lines are and how thick your strokes are. Over a few weeks we
          learn what your usual handwriting looks like, then tell you if your recent pages look
          different. Tiredness or rushing can show up this way.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#5d675f]">
          <li>Only you can see it. Nobody else, including staff, has a view of it.</li>
          <li>We keep numbers only, not your handwriting or what you wrote.</li>
          <li>It compares you with yourself, never with other students.</li>
          <li>You can turn it off, or delete the numbers, at any time.</li>
        </ul>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#dcd5c7] bg-white p-3">
          <input
            type="checkbox"
            data-testid="wellbeing-consent"
            className="mt-1 h-4 w-4 accent-[#1d9e75]"
            checked={data.consent}
            disabled={busy}
            onChange={(e) =>
              void run(
                () => gsLmsService.setHandwritingConsent(e.target.checked),
                e.target.checked ? "Handwriting trend is on." : "Handwriting trend is off and your numbers were deleted.",
                { ...data, consent: e.target.checked },
              )
            }
          />
          <span className="text-sm text-[#13251d]">
            <span className="font-bold">Track my handwriting trend</span>
            <span className="block text-xs text-[#5d675f]">
              Off by default. Turning it off deletes everything measured so far.
            </span>
          </span>
        </label>
        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs text-[#5d675f]" data-testid="wellbeing-notice">
          {notice}
        </p>
      </section>

      {data.consent && data.status !== "off" ? (
        <>
          <section className={CARD} aria-label="Your handwriting trend" data-testid="wellbeing-status" data-status={data.status}>
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#13251d]">
              <Leaf className="h-4 w-4 text-[#1d9e75]" aria-hidden /> How it looks
            </h2>
            <p className="mt-2 text-sm text-[#13251d]" data-testid="wellbeing-message">
              {data.message}
            </p>
            <p className="mt-2 text-xs text-[#7b7469]">
              {data.samples_usable} of {data.samples_total} pages used so far.
            </p>
          </section>

          {seriesEntries.length > 0 ? (
            <section className={CARD} aria-label="Changes over time">
              <h2 className="text-sm font-black uppercase tracking-wide text-[#13251d]">Over time</h2>
              <p className="mt-1 text-xs text-[#5d675f]">
                Each dot is one page; green dots are your most recent pages. Shapes matter, not the numbers.
              </p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {seriesEntries.map(([name, pts]) => {
                  const label = FEATURE_LABELS[name] ?? name;
                  const changed = data.changed_features.find((c) => c.feature === name);
                  return (
                    <li key={name} data-testid="wellbeing-series" className="rounded-xl bg-white p-3">
                      <p className="text-sm font-bold text-[#13251d]">{label}</p>
                      <p className="mb-1 text-xs text-[#5d675f]">
                        {changed ? changed.phrase : pts.length > 1 ? `Since ${parseDate(pts[0].captured_at).toLocaleDateString()}` : ""}
                      </p>
                      <Sparkline points={pts} recent={data.status === "not_enough_data" ? 0 : data.recent_count} label={label} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className={CARD} aria-label="Your data">
            <h2 className="text-sm font-black uppercase tracking-wide text-[#13251d]">Your data</h2>
            {confirmDelete ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-[#13251d]">
                  Delete all handwriting numbers we have measured for you? This can&apos;t be undone. The trend is
                  on, so new pages will start it again.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="wellbeing-delete-confirm"
                    className={DANGER_BUTTON}
                    disabled={busy}
                    onClick={() => void run(() => gsLmsService.deleteHandwritingData(), "Your handwriting data was deleted.")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Yes, delete
                  </button>
                  <button type="button" className={SECONDARY_BUTTON} disabled={busy} onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                data-testid="wellbeing-delete"
                className={`${SECONDARY_BUTTON} mt-3`}
                disabled={busy || data.samples_total === 0}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Delete my handwriting data
              </button>
            )}
            {data.limitations ? <p className="mt-3 text-xs text-[#7b7469]">{data.limitations}</p> : null}
          </section>
        </>
      ) : null}

      <p className="rounded-xl border border-[#e6c97a] bg-[#fff8e6] p-4 text-xs text-[#5d4a00]" data-testid="wellbeing-disclaimer">
        {data.disclaimer}
      </p>
    </div>
  );
}
