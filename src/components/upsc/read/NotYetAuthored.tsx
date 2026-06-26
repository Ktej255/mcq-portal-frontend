"use client";

import { BookOpen, Clock } from "lucide-react";

/**
 * NotYetAuthored — the single, honest "not yet authored" surface for the
 * optional-subjects Read layer (spec task 6.3, R5.4 / R17.3, design Property 8).
 *
 * The backend honesty gate only ever returns reviewed + authored content and
 * marks everything else `authored: false` with `content: null`. The frontend
 * must never dress that absence up as complete content. This component is the
 * shared, reusable way both {@link ReadView} and {@link SubjectShell} express
 * that state, so the wording and Sarit Classes palette stay consistent:
 *
 * - {@link NotYetAuthored} — a full dedicated panel for an empty topic page.
 * - {@link NotYetAuthoredBadge} — a compact inline badge for topic rows.
 *
 * Keeping one component (one label, one palette) guarantees the catalog, the
 * subject shell and the read page all say the same honest thing.
 */

const PALETTE = {
  card: "#fffdf8",
  panelBg: "#faf6ee",
  border: "#cdbf9f",
  accentBg: "#e7f5ee",
  accentInk: "#085041",
  ink: "#13251d",
  sand: "#8a7a52",
};

/** Canonical short label, shared across the Read layer. */
export const NOT_YET_AUTHORED_LABEL = "Not yet authored";

/** Canonical longer message for a full not-authored panel. */
export const NOT_YET_AUTHORED_MESSAGE =
  "Reviewed deep notes for this topic arrive in a later step.";

export interface NotYetAuthoredProps {
  /** Title of the topic/subject that has no authored content yet. */
  title?: string;
  /** Override the default honest message. */
  message?: string;
  /** Test id for the panel (defaults to a stable shared id). */
  testid?: string;
}

/**
 * Full-panel honest empty state. Used when a whole topic page has no reviewed
 * content to show. Never renders a fake-complete or blank page.
 */
export function NotYetAuthored({
  title,
  message = NOT_YET_AUTHORED_MESSAGE,
  testid = "not-yet-authored",
}: NotYetAuthoredProps) {
  return (
    <div
      data-testid={testid}
      data-authored="false"
      className="rounded-2xl border border-dashed px-5 py-10 text-center"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.panelBg }}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: PALETTE.accentBg, color: PALETTE.accentInk }}
      >
        <BookOpen className="h-6 w-6" />
      </div>
      <p
        className="mt-3 text-[11px] font-black uppercase tracking-[0.16em]"
        style={{ color: PALETTE.accentInk }}
      >
        {NOT_YET_AUTHORED_LABEL}
      </p>
      {title ? (
        <h2
          className="mt-1 text-lg font-black tracking-tight"
          style={{ color: PALETTE.ink }}
        >
          {title}
        </h2>
      ) : null}
      <p
        className="mx-auto mt-1 max-w-md text-sm font-semibold leading-6"
        style={{ color: PALETTE.sand }}
      >
        {message}
      </p>
    </div>
  );
}

export interface NotYetAuthoredBadgeProps {
  /** Test id for the badge (defaults to a stable shared id). */
  testid?: string;
  /** Optional short label override (defaults to the canonical label). */
  label?: string;
}

/**
 * Compact inline badge for a topic row whose content is not yet authored.
 * Visually clear and honest — never styled to look like a ready/Read control.
 */
export function NotYetAuthoredBadge({
  testid = "not-yet-authored-badge",
  label = NOT_YET_AUTHORED_LABEL,
}: NotYetAuthoredBadgeProps) {
  return (
    <span
      data-testid={testid}
      data-authored="false"
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
      style={{
        borderColor: "#dcd5c7",
        backgroundColor: PALETTE.panelBg,
        color: PALETTE.sand,
      }}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

export default NotYetAuthored;
