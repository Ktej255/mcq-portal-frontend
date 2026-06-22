/**
 * Canonical catalog of the 25 standard UPSC optional subjects.
 *
 * This is the single source of truth for the {@link OptionalCatalog} grid
 * (spec task 5.2, requirements R1.2, R3.5). Each entry carries a url-safe
 * `slug` (used by {@link optionalSubjectRoute}), a display `name`, and an
 * honest `status` describing how far that subject's content has been authored.
 *
 * Honesty rule (R3.5 / design Property 8): only subjects with reviewed,
 * authored content are marked `available`. Everything not yet authored stays
 * `coming-soon` so the UI never presents an empty subject as ready. Geography
 * is the Phase-1 stabilization target and is the only `available` subject now.
 *
 * Literature optionals exist in the real exam but are intentionally excluded
 * here: this catalog covers the 25 standard (non-literature) optionals.
 */

/** Completeness status for a subject, surfaced to the student (R3.5). */
export type SubjectStatus = "available" | "coming-soon";

export type OptionalSubjectCatalogEntry = {
  /** URL-safe subject slug, e.g. "geography". Used by optionalSubjectRoute. */
  slug: string;
  /** Display name, e.g. "Geography". */
  name: string;
  /** Honest authoring/completeness status. */
  status: SubjectStatus;
};

/**
 * The 25 standard UPSC optional subjects (alphabetical by display name).
 * Geography is the only subject currently authored/available (Phase 1).
 */
export const OPTIONAL_SUBJECTS: readonly OptionalSubjectCatalogEntry[] = [
  { slug: "agriculture", name: "Agriculture", status: "coming-soon" },
  {
    slug: "animal-husbandry-veterinary-science",
    name: "Animal Husbandry & Veterinary Science",
    status: "coming-soon",
  },
  { slug: "anthropology", name: "Anthropology", status: "coming-soon" },
  { slug: "botany", name: "Botany", status: "coming-soon" },
  { slug: "chemistry", name: "Chemistry", status: "coming-soon" },
  { slug: "civil-engineering", name: "Civil Engineering", status: "coming-soon" },
  {
    slug: "commerce-accountancy",
    name: "Commerce & Accountancy",
    status: "coming-soon",
  },
  { slug: "economics", name: "Economics", status: "coming-soon" },
  {
    slug: "electrical-engineering",
    name: "Electrical Engineering",
    status: "coming-soon",
  },
  { slug: "geography", name: "Geography", status: "available" },
  { slug: "geology", name: "Geology", status: "coming-soon" },
  { slug: "history", name: "History", status: "coming-soon" },
  { slug: "law", name: "Law", status: "coming-soon" },
  { slug: "management", name: "Management", status: "coming-soon" },
  { slug: "mathematics", name: "Mathematics", status: "coming-soon" },
  {
    slug: "mechanical-engineering",
    name: "Mechanical Engineering",
    status: "coming-soon",
  },
  { slug: "medical-science", name: "Medical Science", status: "coming-soon" },
  { slug: "philosophy", name: "Philosophy", status: "coming-soon" },
  { slug: "physics", name: "Physics", status: "coming-soon" },
  {
    slug: "political-science-international-relations",
    name: "Political Science & International Relations",
    status: "coming-soon",
  },
  { slug: "psychology", name: "Psychology", status: "coming-soon" },
  {
    slug: "public-administration",
    name: "Public Administration",
    status: "coming-soon",
  },
  { slug: "sociology", name: "Sociology", status: "coming-soon" },
  { slug: "statistics", name: "Statistics", status: "coming-soon" },
  { slug: "zoology", name: "Zoology", status: "coming-soon" },
];

/** The canonical number of standard UPSC optional subjects. */
export const OPTIONAL_SUBJECTS_COUNT = 25 as const;

// Build-time guard: the catalog must always list exactly 25 subjects (R1.2)
// with unique slugs. A drift here is a programming error, not a runtime case.
if (OPTIONAL_SUBJECTS.length !== OPTIONAL_SUBJECTS_COUNT) {
  throw new Error(
    `optionalSubjectsCatalog: expected ${OPTIONAL_SUBJECTS_COUNT} subjects, found ${OPTIONAL_SUBJECTS.length}`,
  );
}
if (new Set(OPTIONAL_SUBJECTS.map((s) => s.slug)).size !== OPTIONAL_SUBJECTS.length) {
  throw new Error("optionalSubjectsCatalog: duplicate subject slug detected");
}

/** Human-readable status metadata for rendering (R3.5). */
export const SUBJECT_STATUS_META: Record<
  SubjectStatus,
  { label: string; description: string }
> = {
  available: {
    label: "Available now",
    description: "Authored content is live — open to start preparing.",
  },
  "coming-soon": {
    label: "Coming soon",
    description: "Not yet authored. We are building this subject to the full standard.",
  },
};
