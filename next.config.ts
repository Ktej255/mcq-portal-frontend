import type { NextConfig } from "next";
import { buildApiRewriteDestination } from "./src/services/api/base-url.mjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async rewrites() {
    const configuredBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
    const isLocalDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
    const backendUrl = configuredBackendUrl || "http://localhost:8000";
    if (!configuredBackendUrl && !isLocalDevelopment) {
      console.warn(
        "WARN: NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL not set; using fallback rewrite destination."
      );
    }
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/api/v1/:path*",
          destination: buildApiRewriteDestination(backendUrl),
        },
      ],
    };
  },
};

export default nextConfig;
