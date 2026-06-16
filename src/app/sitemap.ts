import type { MetadataRoute } from "next";

import { subjects } from "@/components/marketing/site-data";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = [
    "",
    "/features",
    "/pricing",
    "/subjects",
    "/pyqs",
    "/resources",
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

  return [...staticEntries, ...subjectEntries];
}
