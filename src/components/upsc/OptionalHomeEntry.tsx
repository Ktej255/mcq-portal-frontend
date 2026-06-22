"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";

import {
  OPTIONAL_CATALOG_ROUTE,
  optionalSubjectRoute,
  readSelectedOptional,
  writeSelectedOptional,
  type SelectedOptional,
} from "@/lib/upsc/selectedOptional";
import { optionalService } from "@/services/api/optionalService";

/**
 * Easy-access home affordance for the student's optional subject (R1.1, R1.4).
 *
 * - When a subject is selected, shows a quick link straight into it plus a
 *   "Change" link back to the catalog.
 * - When none is selected, shows a "Choose your optional" call-to-action.
 *
 * Selection is read from localStorage (synchronous cache) first to avoid a
 * hydration flash, then reconciled with the backend-persisted selection
 * (`GET /optional/selection`, spec task 13.1) so it reloads across devices.
 * Backend hydration is best-effort — offline/unauthenticated keeps the cache.
 */
export function OptionalHomeEntry() {
  const [selected, setSelected] = useState<SelectedOptional | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSelected(readSelectedOptional());
    setIsLoaded(true);
    optionalService
      .getSelection()
      .then((sel) => {
        if (sel.selected && sel.slug && sel.name) {
          const next = { slug: sel.slug, name: sel.name };
          setSelected(next);
          writeSelectedOptional(next);
        }
      })
      .catch(() => {
        /* offline / unauthenticated — keep the localStorage value */
      });
  }, []);

  // Avoid a hydration mismatch: localStorage is only available on the client.
  if (!isLoaded) return null;

  if (selected) {
    return (
      <section
        data-testid="optional-home-entry"
        data-optional-selected={selected.slug}
        className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#b9d9cd] bg-[#e7f5ee] p-4 shadow-sm"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a2a] text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
            Your optional
          </p>
          <p className="truncate text-lg font-black tracking-tight text-[#13251d]">
            {selected.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={optionalSubjectRoute(selected.slug)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a2a] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#13251d] active:scale-95"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={OPTIONAL_CATALOG_ROUTE}
            className="inline-flex items-center rounded-lg border border-[#b9d9cd] bg-white px-3 py-2 text-xs font-bold text-[#34453b] transition-all hover:border-[#1d9e75]/50 hover:text-[#13251d] active:scale-95"
          >
            Change
          </Link>
        </div>
      </section>
    );
  }

  return (
    <Link
      href={OPTIONAL_CATALOG_ROUTE}
      data-testid="optional-home-entry"
      data-optional-selected=""
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm transition-all hover:border-[#1d9e75]/50 hover:bg-[#e7f5ee] active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a2a] text-white">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
          Optional
        </p>
        <p className="text-lg font-black tracking-tight text-[#13251d]">
          Choose your optional
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[#49675e]">
          Pick from all 25 UPSC optional subjects to unlock its dedicated prep surface.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a2a] px-4 py-2 text-xs font-bold text-white">
        Browse subjects
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
