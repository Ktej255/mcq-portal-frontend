export const API_VERSION_PATH = "/api/v1";

function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, "");
}

export function stripApiVersion(rawBaseUrl) {
  const value = trimTrailingSlashes((rawBaseUrl ?? "").trim());
  if (value === API_VERSION_PATH) return "";
  return value.endsWith(API_VERSION_PATH)
    ? value.slice(0, -API_VERSION_PATH.length)
    : value;
}

export function normalizeApiBaseUrl(rawBaseUrl, { isBrowser = false } = {}) {
  const value = (rawBaseUrl ?? "").trim();

  if (isBrowser) {
    return `${API_VERSION_PATH}/`;
  }

  const root = stripApiVersion(value);
  return root ? `${root}${API_VERSION_PATH}/` : `${API_VERSION_PATH}/`;
}

export function buildApiRewriteDestination(rawBackendUrl) {
  const value = (rawBackendUrl ?? "").trim() || "http://localhost:8000";
  if (value.startsWith("/")) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute origin for server rewrites");
  }
  const root = stripApiVersion(value);
  return `${root}${API_VERSION_PATH}/:path*`;
}
