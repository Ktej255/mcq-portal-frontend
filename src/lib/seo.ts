import type { Metadata } from "next";

/**
 * Canonical site constants for Sarit Learn — UPSC Command.
 * Canonical domain is taken from beyond-seo/KIRO_INSTRUCTIONS.md (upsccommand.com).
 */
export const SITE_URL = "https://upsccommand.com";
export const SITE_NAME = "Sarit Learn — UPSC Command";
export const ORG_NAME = "Sarit Learn";

/**
 * Build page metadata with canonical alternates + Open Graph + Twitter,
 * per Beyond SEO "Mandatory Coding & Content Policies".
 * `path` must be a root-relative path (e.g. "/features"); metadataBase
 * (set in the root layout) resolves it to an absolute canonical URL.
 */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path, types: { "text/plain": "/llms.txt" } },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Organization schema — site-wide entity definition for SEO/AEO/GEO. */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: ORG_NAME,
  alternateName: "Sarit Learn UPSC Command",
  url: SITE_URL,
  description:
    "Sarit Learn is an integrated UPSC Civil Services preparation platform that connects lessons, doubt-solving, practice, tracking and revision in one personalized daily loop.",
  areaServed: "IN",
  knowsAbout: [
    "UPSC Civil Services Examination",
    "IAS preparation",
    "General Studies",
    "Current Affairs",
    "Optional subjects",
  ],
};

/** WebSite schema with a search action — helps entity/site understanding. */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "en-IN",
  publisher: { "@type": "EducationalOrganization", name: ORG_NAME },
};
