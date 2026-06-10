const authFallbackKey = "sarit-auth-fallback-unlocked-v1";

export function isLocalTestingHost(hostname?: string) {
  const resolvedHostname =
    hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");

  return resolvedHostname === "localhost" || resolvedHostname === "127.0.0.1";
}

export function unlockAuthFallback() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(authFallbackKey, "true");
}

export function isAuthFallbackUnlocked() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(authFallbackKey) === "true";
}

export function canUsePreviewAuth(hostname?: string) {
  return (
    isLocalTestingHost(hostname) ||
    process.env.NEXT_PUBLIC_STUDENT_PREVIEW_LOGIN === "true" ||
    isAuthFallbackUnlocked()
  );
}

export function readLocalMockToken() {
  if (typeof window === "undefined" || !canUsePreviewAuth()) return null;

  const token =
    (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN ??
    window.localStorage.getItem("MOCK_TOKEN");

  return token?.startsWith("MOCK_TOKEN") ? token : null;
}

export function clearLocalMockToken() {
  if (typeof window === "undefined") return;
  delete (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN;
  window.localStorage.removeItem("MOCK_TOKEN");
}
