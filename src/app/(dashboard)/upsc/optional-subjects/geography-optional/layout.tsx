import type { Metadata } from "next";
import { Caveat, Kalam } from "next/font/google";

/**
 * Handwritten "personal notes" fonts, scoped to the Geography Optional section.
 * Caveat = display headings; Kalam = running note body.
 */
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const kalam = Kalam({
  variable: "--font-hand-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

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
  return <div className={`${caveat.variable} ${kalam.variable}`}>{children}</div>;
}
