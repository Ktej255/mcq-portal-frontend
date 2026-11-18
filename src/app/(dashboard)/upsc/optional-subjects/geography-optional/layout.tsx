import type { Metadata } from "next";

/**
 * Handwritten "personal notes" fonts, scoped to the Geography Optional section.
 * Caveat = display headings; Kalam = running note body. The woff2 files are
 * self-hosted in `/public/fonts` and the family variables are declared in
 * `src/app/fonts.css`, so no font is fetched at build time.
 */

export const metadata: Metadata = {
  title: "Geography (Optional) — Read | Sarit Learn",
  description:
    "Authentic, exam-grade Geography Optional notes in a personal handwritten style — syllabus map, trend analysis and hidden topics.",
};

export default function GeographyOptionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
