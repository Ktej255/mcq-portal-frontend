export function isLocalTestingHost(hostname?: string) {
  const resolvedHostname =
    hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");

  return resolvedHostname === "localhost" || resolvedHostname === "127.0.0.1";
}

export function readLocalMockToken() {
  if (typeof window === "undefined" || !isLocalTestingHost()) return null;

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
