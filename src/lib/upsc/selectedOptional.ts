/**
 * Self-contained helper for the student's selected UPSC optional subject.
 *
 * This is a thin localStorage shim used by the home page affordance until
 * backend persistence lands (see spec task 13.1). The catalog at
 * {@link OPTIONAL_CATALOG_ROUTE} is the single place a subject is chosen.
 */

export const SELECTED_OPTIONAL_STORAGE_KEY = "sarit-upsc-selected-optional-v1";

/** Route to the optional-subjects catalog (all 25 subjects). */
export const OPTIONAL_CATALOG_ROUTE = "/upsc/optional-subjects";

export type SelectedOptional = {
  /** URL-safe subject slug, e.g. "geography". */
  slug: string;
  /** Display name, e.g. "Geography". */
  name: string;
};

/** Route to a specific optional subject's shell. */
export function optionalSubjectRoute(slug: string): string {
  return `${OPTIONAL_CATALOG_ROUTE}/${slug}`;
}

/** Read the student's selected optional, or null when none is chosen. */
export function readSelectedOptional(): SelectedOptional | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SELECTED_OPTIONAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as SelectedOptional).slug === "string" &&
      typeof (parsed as SelectedOptional).name === "string"
    ) {
      const { slug, name } = parsed as SelectedOptional;
      return { slug, name };
    }
    return null;
  } catch {
    return null;
  }
}

/** Persist the student's selected optional subject. */
export function writeSelectedOptional(value: SelectedOptional): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELECTED_OPTIONAL_STORAGE_KEY, JSON.stringify(value));
}
