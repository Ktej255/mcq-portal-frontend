/**
 * Exam-aware routing helpers (UPSC / NEET / JEE).
 *
 * UPSC keeps its original `/upsc/...` URLs. NEET and JEE live under their own
 * top-level paths `/neet/...` and `/jee/...` and reuse the same page
 * components (see `app/(dashboard)/[exam]`). Nothing here talks to the server:
 * it only derives the exam from a pathname so links and branding stay inside
 * the exam the student is currently in.
 */

export type ExamCode = "upsc" | "neet" | "jee";

/** Exams that have their own top-level route prefix (UPSC keeps `/upsc`). */
export const EXAM_ROUTE_CODES = ["neet", "jee"] as const;
export type ExamRouteCode = (typeof EXAM_ROUTE_CODES)[number];

export const EXAM_BRAND: Record<ExamCode, string> = {
  upsc: "UPSC",
  neet: "NEET",
  jee: "JEE",
};

export function isExamRouteCode(value: string | null | undefined): value is ExamRouteCode {
  return !!value && (EXAM_ROUTE_CODES as readonly string[]).includes(value);
}

/** The exam a pathname belongs to: `/neet/...` -> neet, `/jee/...` -> jee, anything else upsc. */
export function examFromPathname(pathname: string | null | undefined): ExamCode {
  const first = (pathname ?? "").split("/").filter(Boolean)[0];
  return isExamRouteCode(first) ? first : "upsc";
}

/** The route prefix of the exam a pathname is in: "/upsc", "/neet" or "/jee". */
export function examBasePath(pathname: string | null | undefined): string {
  return `/${examFromPathname(pathname)}`;
}

/** Product name shown in the sidebar/header: "UPSC Command", "NEET Command", "JEE Command". */
export function examBrandName(pathname: string | null | undefined): string {
  return `${EXAM_BRAND[examFromPathname(pathname)]} Command`;
}

/**
 * Subject label from a slug. Non-UPSC slugs carry the exam prefix
 * ("neet-physics"), which is dropped from the display name.
 */
export function subjectLabelFromSlug(slug: string, exam: ExamCode = "upsc"): string {
  const bare = exam !== "upsc" && slug.startsWith(`${exam}-`) ? slug.slice(exam.length + 1) : slug;
  if (bare === "maths") return "Mathematics";
  return bare
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
