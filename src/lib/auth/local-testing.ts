const authFallbackKey = "sarit-auth-fallback-unlocked-v1";
const mockUserEmailKey = "MOCK_USER_EMAIL";
const mockUserUidKey = "MOCK_USER_UID";

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

export function saveLocalMockToken(token: string) {
  if (typeof window === "undefined") return;
  (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN = token;
  window.localStorage.setItem("MOCK_TOKEN", token);
  document.cookie = `MOCK_TOKEN=${token}; path=/; max-age=31536000; SameSite=Lax`;
}

export function clearLocalMockToken() {
  if (typeof window === "undefined") return;
  delete (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN;
  window.localStorage.removeItem("MOCK_TOKEN");
  window.localStorage.removeItem(mockUserEmailKey);
  window.localStorage.removeItem(mockUserUidKey);
  document.cookie = "MOCK_TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

export function saveLocalMockIdentity(email: string, uid: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(mockUserEmailKey, email);
  window.localStorage.setItem(mockUserUidKey, uid);
}

export function readLocalMockIdentity() {
  if (typeof window === "undefined") return null;
  const email = window.localStorage.getItem(mockUserEmailKey);
  const uid = window.localStorage.getItem(mockUserUidKey);
  return email && uid ? { email, uid } : null;
}
