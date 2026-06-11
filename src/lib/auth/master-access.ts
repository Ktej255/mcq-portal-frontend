export const PRIMARY_MASTER_EMAIL = "ktej255@gmail.com";

const DEFAULT_MASTER_EMAILS = [
  PRIMARY_MASTER_EMAIL,
  "sarit.kumar.dev@gmail.com",
  "quicklearn601@gmail.com",
];

function configuredMasterEmails() {
  const raw = process.env.NEXT_PUBLIC_MASTER_EMAILS;
  const emails = raw ? [...DEFAULT_MASTER_EMAILS, ...raw.split(",")] : DEFAULT_MASTER_EMAILS;
  return emails.map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function isMasterEmail(email: string | null | undefined) {
  if (!email) return false;
  return configuredMasterEmails().includes(email.toLowerCase()) || email.toLowerCase().endsWith("@admin.com");
}

export function isExplicitLocalMockMasterToken(token: string | null | undefined) {
  if (!token?.startsWith("MOCK_TOKEN")) return false;
  const normalized = token.toLowerCase();
  return ["master", "admin", "validator"].some((marker) => normalized.includes(marker));
}

export function isLocalMockMasterSession() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  return isLocalHost && isExplicitLocalMockMasterToken(localStorage.getItem("MOCK_TOKEN"));
}
