export const API_VERSION_PATH: "/api/v1";

export function stripApiVersion(rawBaseUrl?: string | null): string;

export function normalizeApiBaseUrl(
  rawBaseUrl?: string | null,
  options?: { isBrowser?: boolean },
): string;

export function buildApiRewriteDestination(rawBackendUrl?: string | null): string;
