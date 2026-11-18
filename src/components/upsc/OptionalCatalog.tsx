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
  clearSelectedOptional,
  optionalSubjectRoute,
  readSelectedOptional,
  writeSelectedOptional,
} from "@/lib/upsc/selectedOptional";
import { optionalService } from "@/services/api/optionalService";

/**
 * OptionalCatalog - grid of all 25 standard UPSC optional subjects.
 *
 * Requirements:
 * - R1.2: lists all 25 optional subjects.
 * - R1.3: selecting a subject records it as the student's selected subject.
 * - R1.5: a student who already has a selection can change it (any available
 *   card is selectable; the current selection is highlighted). A `coming-soon`
 *   card navigates to that subject's page instead of persisting a selection,
 *   because nothing is reviewed behind it (founder decision, 2026-10-31).
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
  const [selectingSlug, setSelectingSlug] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [failedSlug, setFailedSlug] = useState<string | null>(null);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const localSelection = readSelectedOptional();
      setSelectedSlug(localSelection?.slug ?? null);

      // The backend is authoritative when it responds. An explicit empty
      // selection must clear stale browser cache; only transport failure falls
      // back to the local cache.
      void optionalService
        .getSelection()
        .then((sel) => {
          if (sel.selected && sel.slug) {
            writeSelectedOptional({ slug: sel.slug, name: sel.name ?? "" });
            setSelectedSlug(sel.slug);
          } else {
            clearSelectedOptional();
            setSelectedSlug(null);
          }
        })
        .catch(() => {
          setSelectedSlug(localSelection?.slug ?? null);
        })
        .finally(() => {
          setIsLoaded(true);
        });
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  async function handleSelect(subject: OptionalSubjectCatalogEntry) {
    if (!isLoaded || selectingSlug !== null) return;

    setSelectionError("");
    setFailedSlug(null);

    // A `coming-soon` subject is browsed, never selected. Nothing is reviewed
    // behind it (and 23 of them have no `optional_subjects` row at all, so a
    // PUT /optional/selection would fail), and persisting a selection for a
    // subject we describe as not open yet would be a false record. Founder
    // decision, 2026-10-31.
    if (subject.status !== "available") {
      router.push(optionalSubjectRoute(subject.slug));
      return;
    }

    setSelectingSlug(subject.slug);
    try {
      const selection = await optionalService.setSelection(subject.slug);
      if (!selection.selected || selection.slug !== subject.slug) {
        throw new Error("Selection response did not confirm the requested subject");
      }

      writeSelectedOptional({ slug: selection.slug, name: selection.name ?? subject.name });
      setSelectedSlug(selection.slug);
      router.push(optionalSubjectRoute(selection.slug));
    } catch {
      setFailedSlug(subject.slug);
      setSelectionError("This optional-subject selection could not be saved. Your current selection is unchanged; retry when the connection is available.");
    } finally {
      setSelectingSlug(null);
    }
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
            All {OPTIONAL_SUBJECTS_COUNT} standard optional subjects in one place. Geography is the
            only one with reviewed notes and PYQs today. The other {OPTIONAL_SUBJECTS_COUNT - 1} —
            Anthropology and Sociology included — are honestly marked coming soon until their
            material is authored and reviewed; you can still browse the exam structure of any
            subject.
          </p>
        </section>

        {selectionError && failedSlug ? (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#ef9f27]/50 bg-[#fff4df] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold leading-5 text-[#7a5410]">{selectionError}</p>
            <button
              type="button"
              onClick={() => {
                const failedSubject = OPTIONAL_SUBJECTS.find((subject) => subject.slug === failedSlug);
                if (failedSubject) void handleSelect(failedSubject);
              }}
              disabled={selectingSlug !== null}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#9a6a16] px-4 text-xs font-black text-white transition hover:bg-[#7a5410] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectingSlug === failedSlug ? "Retrying..." : "Retry selection"}
            </button>
          </div>
        ) : null}

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
                onClick={() => void handleSelect(subject)}
                disabled={!isLoaded || selectingSlug !== null}
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
                  {isSelected
                    ? "Continue"
                    : isAvailable
                      ? "Select subject"
                      : "View structure"}
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
