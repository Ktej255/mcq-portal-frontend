// Local persistence for optional-subject activity (attempts, scores, progress).
// On-device for now (localStorage); the same API can be backed by Supabase later.

export type OptionalAttempt = {
  refId: string;            // pyq id or practice:<prompt>
  kind: "pyq" | "practice";
  title: string;
  level: string;            // evaluation depth / practice level
  score: number;            // 0-100 (0 if not scored, e.g. uploaded copy)
  status: string;           // verdict status
  at: number;               // timestamp (ms)
};

const KEY = (slug: string) => `sarit-optional-progress-${slug}`;

function read(slug: string): OptionalAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY(slug));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as OptionalAttempt[]) : [];
  } catch {
    return [];
  }
}

function write(slug: string, attempts: OptionalAttempt[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(slug), JSON.stringify(attempts));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Record (or replace) an attempt for a given question/practice + level. */
export function recordOptionalAttempt(slug: string, attempt: OptionalAttempt) {
  const next = read(slug).filter((a) => !(a.refId === attempt.refId && a.level === attempt.level));
  next.push(attempt);
  write(slug, next);
}

export function getOptionalAttempts(slug: string): OptionalAttempt[] {
  return read(slug);
}

export function getOptionalStats(slug: string) {
  const a = read(slug);
  const scored = a.filter((x) => typeof x.score === "number" && x.score > 0);
  return {
    total: a.length,
    pyq: a.filter((x) => x.kind === "pyq").length,
    practice: a.filter((x) => x.kind === "practice").length,
    avgScore: scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : 0,
    lastAt: a.length ? Math.max(...a.map((x) => x.at)) : 0,
  };
}

export function practiceRefId(prompt: string): string {
  return `practice:${prompt.slice(0, 60)}`;
}
