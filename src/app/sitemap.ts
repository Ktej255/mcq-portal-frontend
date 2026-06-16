import type { MetadataRoute } from "next";

import { subjects } from "@/components/marketing/site-data";
import { guides } from "@/components/marketing/guides-data";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = [
    "",
    "/start",
    "/demo",
    "/features",
    "/pricing",
    "/subjects",
    "/current-affairs",
    "/pyqs",
    "/tests",
    "/resources",
    "/guides",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  const subjectEntries: MetadataRoute.Sitemap = subjects.map((s) => ({
    url: `${SITE_URL}/subjects/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guideEntries: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${SITE_URL}/guides/${g.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...subjectEntries, ...guideEntries];
}
