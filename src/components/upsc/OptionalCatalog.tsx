"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, Check, Clock, GraduationCap } from "lucide-react";

import {
  OPTIONAL_SUBJECTS,
  OPTIONAL_SUBJECTS_COUNT,
  SUBJECT_STATUS_META,
  type OptionalSubjectCatalogEntry,
} from "@/lib/upsc/optionalSubjectsCatalog";
import {
  optionalSubjectRoute,
  readSelectedOptional,
  writeSelectedOptional,
} from "@/lib/upsc/selectedOptional";
import { optionalService } from "@/services/api/optionalService";

/**
 * OptionalCatalog — grid of all 25 standard UPSC optional subjects.
 *
 * Requirements:
 * - R1.2: lists all 25 optional subjects.
 * - R1.3: selecting a subject records it as the student's selected subject.
 * - R1.5: a student who already has a selection can change it (any card is
 *   selectable; the current selection is highlighted).
 * - R3.5: each subject shows its honest completeness status.
 *
 * Selection persistence: localStorage is the synchronous cache and the
 * backend ``GET/PUT /optional/selection`` is the durable, cross-device source
 * (spec task 13.1). Selecting a subject writes both; the home entry hydrates
 * from the backend when available.
 */
export function OptionalCatalog() {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSelectedSlug(readSelectedOptional()?.slug ?? null);
    setIsLoaded(true);
    // Hydrate from the backend-persisted selection when available (R15.3):
    // reloads the student's choice across devices, not just this browser.
    // Best-effort — falls back silently to the localStorage value when the
    // student is unauthenticated/offline or the call fails.
    optionalService
      .getSelection()
      .then((sel) => {
        if (sel.selected && sel.slug) {
          setSelectedSlug(sel.slug);
          if (sel.name) writeSelectedOptional({ slug: sel.slug, name: sel.name });
        }
      })
      .catch(() => {
        /* offline / unauthenticated — keep the localStorage value */
      });
  }, []);

  function handleSelect(subject: OptionalSubjectCatalogEntry) {
    // R1.3 / R1.5: record (or change) the student's selected subject, then
    // navigate into its route. Persist to localStorage (synchronous cache) AND
    // to the backend (durable, cross-device — R15.2). The backend write is
    // best-effort so navigation never blocks on it.
    writeSelectedOptional({ slug: subject.slug, name: subject.name });
    setSelectedSlug(subject.slug);
    void optionalService.setSelection(subject.slug).catch(() => {
      /* best-effort: localStorage already holds the choice */
    });
    router.push(optionalSubjectRoute(subject.slug));
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        <section className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
            Optional catalog
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
            Choose your UPSC optional
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
            All {OPTIONAL_SUBJECTS_COUNT} standard optional subjects in one place. Pick one to set it
            as your optional — you can change it anytime. Geography is fully authored now; the rest
            are on the way to the same depth standard.
          </p>
        </section>

        <section
          data-testid="optional-catalog-grid"
          data-subject-count={OPTIONAL_SUBJECTS.length}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {OPTIONAL_SUBJECTS.map((subject) => {
            const isSelected = isLoaded && selectedSlug === subject.slug;
            const isAvailable = subject.status === "available";
            const statusMeta = SUBJECT_STATUS_META[subject.status];

            return (
              <button
                key={subject.slug}
                type="button"
                onClick={() => handleSelect(subject)}
                data-testid="optional-catalog-card"
                data-slug={subject.slug}
                data-status={subject.status}
                data-selected={isSelected ? "true" : "false"}
                aria-pressed={isSelected}
                className={`group flex flex-col rounded-2xl border p-4 text-left shadow-sm transition-all active:scale-[0.99] ${
                  isSelected
                    ? "border-[#1a3a2a] bg-[#e7f5ee] ring-2 ring-[#1d9e75]/40"
                    : "border-[#dcd5c7] bg-[#fffdf8] hover:border-[#1d9e75]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isAvailable ? "bg-[#1a3a2a] text-white" : "bg-[#e7f5ee] text-[#085041]"
                    }`}
                  >
                    {isAvailable ? (
                      <BookOpenCheck className="h-4 w-4" />
                    ) : (
                      <GraduationCap className="h-4 w-4" />
                    )}
                  </div>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#1a3a2a] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      <Check className="h-3 w-3" /> Selected
                    </span>
                  ) : (
                    <StatusBadge available={isAvailable} label={statusMeta.label} />
                  )}
                </div>

                <h2 className="text-lg font-black leading-tight tracking-tight">{subject.name}</h2>
                <p className="mt-2 flex-1 text-xs font-semibold leading-6 text-[#5d675f]">
                  {statusMeta.description}
                </p>

                <span
                  className={`mt-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] ${
                    isSelected ? "text-[#13251d]" : "text-[#31443a] group-hover:text-[#1a3a2a]"
                  }`}
                >
                  {isSelected ? "Continue" : "Select subject"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ available, label }: { available: boolean; label: string }) {
  if (available) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f5ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1d9e75]" /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#8a7a52]">
      <Clock className="h-3 w-3" /> {label}
    </span>
  );
}
