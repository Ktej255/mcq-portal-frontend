import { activeAuthProvider } from "@/env";
import { apiClient } from "@/services/api/client";

type ProgressItem = {
  updatedAt?: string;
};

type ProgressMap<T extends ProgressItem> = Record<string, T>;
type RemoteWrite = () => Promise<boolean>;

type RemoteWriteQueue = {
  pending: RemoteWrite | null;
  running: Promise<boolean> | null;
};

export const upscAuthUserStorageKey = "sarit-upsc-auth-user-v1";
export const upscLearnerStateClearedEvent = "sarit-upsc-learner-state-cleared";

const remoteWriteQueues = new Map<string, RemoteWriteQueue>();
const learnerProgressStoragePattern = /^sarit-upsc-[a-z0-9-]+-progress-v1$/;

// Whether the learner's progress has reached their account (the backend).
// "retrying" means at least one save failed and will be tried again; the data
// is still safe in this browser meanwhile.
export type LearnerSyncStatus = "idle" | "saving" | "saved" | "retrying";
export const learnerSyncStatusEvent = "sarit-upsc-sync-status";

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000, 120_000, 300_000];
const retryAttempts = new Map<string, number>();
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
let syncStatus: LearnerSyncStatus = "idle";

export function getLearnerSyncStatus() {
  return syncStatus;
}

function setSyncStatus(next: LearnerSyncStatus) {
  if (syncStatus === next) return;
  syncStatus = next;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(learnerSyncStatusEvent, { detail: next }));
  }
}

function refreshSyncStatus() {
  const queues = [...remoteWriteQueues.values()];
  if (queues.some((queue) => queue.running)) setSyncStatus("saving");
  else if (queues.some((queue) => queue.pending)) setSyncStatus("retrying");
  else setSyncStatus("saved");
}

function scheduleRetry(key: string) {
  if (typeof window === "undefined" || retryTimers.has(key)) return;
  const attempt = retryAttempts.get(key) ?? 0;
  const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
  retryAttempts.set(key, attempt + 1);
  retryTimers.set(
    key,
    setTimeout(() => {
      retryTimers.delete(key);
      const pending = remoteWriteQueues.get(key)?.pending;
      if (pending) void queueLatestRemoteWrite(key, pending);
    }, delay),
  );
}

// Coming back online retries everything that is waiting, straight away.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    for (const [key, queue] of remoteWriteQueues) {
      if (!queue.pending || queue.running) continue;
      const timer = retryTimers.get(key);
      if (timer) clearTimeout(timer);
      retryTimers.delete(key);
      void queueLatestRemoteWrite(key, queue.pending);
    }
  });
}

function timestamp(value?: string) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function backendGet<T>(url: string): Promise<T | null> {
  // Canonical student datastore = the FastAPI/Postgres backend (Master Plan
  // A3 / GATE-4). Fails soft: any error (no token / offline / 401) returns null
  // so callers fall back to the localStorage cache and the app keeps working.
  try {
    const res = await apiClient.get(url);
    return (res.data?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

async function backendPut(url: string, body: Record<string, unknown>): Promise<boolean> {
  try {
    await apiClient.put(url, body);
    return true;
  } catch {
    return false;
  }
}

async function queueLatestRemoteWrite(key: string, write: RemoteWrite) {
  const queue = remoteWriteQueues.get(key) ?? { pending: null, running: null };
  queue.pending = write;
  remoteWriteQueues.set(key, queue);

  if (queue.running) return queue.running;

  setSyncStatus("saving");
  queue.running = (async () => {
    let succeeded = true;

    while (queue.pending) {
      const nextWrite = queue.pending;
      queue.pending = null;

      if (!(await nextWrite())) {
        queue.pending ??= nextWrite;
        succeeded = false;
        break;
      }
    }

    return succeeded;
  })().finally(() => {
    queue.running = null;
    if (queue.pending) {
      scheduleRetry(key);
    } else {
      remoteWriteQueues.delete(key);
      retryAttempts.delete(key);
    }
    refreshSyncStatus();
  });

  return queue.running;
}

export function clearLocalUpscLearnerState() {
  if (typeof window === "undefined") return;

  Object.keys(window.localStorage).forEach((key) => {
    if (key === "sarit-upsc-student-profile-v1" || learnerProgressStoragePattern.test(key)) {
      window.localStorage.removeItem(key);
    }
  });
  window.dispatchEvent(new Event(upscLearnerStateClearedEvent));
}

export function reconcileLocalUpscLearnerIdentity(userId?: string | null) {
  if (typeof window === "undefined") return;

  const previousUserId = window.localStorage.getItem(upscAuthUserStorageKey);
  if (!userId) {
    // Do not clear progress on logout so that the same user can resume progress when logging back in.
    // We keep the last authenticated user ID in upscAuthUserStorageKey for comparison on next login.
    return;
  }

  if (previousUserId && previousUserId !== userId) {
    clearLocalUpscLearnerState();
  }

  window.localStorage.setItem(upscAuthUserStorageKey, userId);
}

export function mergeProgressMaps<T extends ProgressItem>(
  localProgress: ProgressMap<T>,
  remoteProgress: ProgressMap<T>
) {
  const merged = { ...localProgress };

  Object.entries(remoteProgress).forEach(([day, remoteDay]) => {
    const localDay = merged[day];
    if (!localDay || timestamp(remoteDay.updatedAt) >= timestamp(localDay.updatedAt)) {
      merged[day] = remoteDay;
    }
  });

  return merged;
}

function readLocalJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function loadRemoteStudentProfile<T extends object>() {
  const data = await backendGet<{ profile: T | null }>("student/profile");
  if (data?.profile) return data.profile;
  // Nothing on the account yet (or the backend is unreachable): Clerk users
  // fall back to what sign-in hydrated from their Clerk metadata.
  return activeAuthProvider === "clerk" ? readLocalJson<T>("sarit-upsc-student-profile-v1") : null;
}

export async function saveRemoteStudentProfile<T extends object>(profile: T) {
  if (activeAuthProvider === "clerk" && typeof window !== "undefined") {
    // Keeps the small profile in Clerk metadata too, and refreshes on-page stats.
    window.dispatchEvent(new CustomEvent("sarit-upsc-profile-updated", { detail: profile }));
  }

  return queueLatestRemoteWrite("profile", () =>
    backendPut("student/profile", { profile }),
  );
}

export async function loadRemoteSubjectProgress<T extends ProgressItem>(subjectSlug: string) {
  const data = await backendGet<{ progress: ProgressMap<T> | null }>(
    `student/progress/${encodeURIComponent(subjectSlug)}`,
  );
  if (data?.progress) return data.progress;
  // Older Clerk accounts kept progress in Clerk metadata (hydrated into this
  // browser at sign-in); the caller merges it and saves it to the backend.
  return activeAuthProvider === "clerk"
    ? readLocalJson<ProgressMap<T>>(`sarit-upsc-${subjectSlug}-progress-v1`)
    : null;
}

export async function saveRemoteSubjectProgress<T extends ProgressItem>(
  subjectSlug: string,
  progress: ProgressMap<T>
) {
  // Progress always goes to the backend. It used to go to Clerk metadata for
  // Clerk users, which is capped at about 8 KB and silently stopped saving
  // once day transcripts filled it.
  return queueLatestRemoteWrite(`subject:${subjectSlug}`, () =>
    backendPut(`student/progress/${encodeURIComponent(subjectSlug)}`, { progress }),
  );
}
