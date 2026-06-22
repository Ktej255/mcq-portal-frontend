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
    if (!queue.pending) remoteWriteQueues.delete(key);
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

export async function loadRemoteStudentProfile<T extends object>() {
  if (activeAuthProvider === "clerk") {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("sarit-upsc-student-profile-v1");
    try {
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  const data = await backendGet<{ profile: T | null }>("student/profile");
  return (data?.profile ?? null) as T | null;
}

export async function saveRemoteStudentProfile<T extends object>(profile: T) {
  if (activeAuthProvider === "clerk") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sarit-upsc-profile-updated", { detail: profile }));
    }
    return true;
  }

  return queueLatestRemoteWrite("profile", () =>
    backendPut("student/profile", { profile }),
  );
}

export async function loadRemoteSubjectProgress<T extends ProgressItem>(subjectSlug: string) {
  if (activeAuthProvider === "clerk") {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(`sarit-upsc-${subjectSlug}-progress-v1`);
    try {
      return raw ? (JSON.parse(raw) as ProgressMap<T>) : null;
    } catch {
      return null;
    }
  }

  const data = await backendGet<{ progress: ProgressMap<T> | null }>(
    `student/progress/${encodeURIComponent(subjectSlug)}`,
  );
  return (data?.progress ?? null) as ProgressMap<T> | null;
}

export async function saveRemoteSubjectProgress<T extends ProgressItem>(
  subjectSlug: string,
  progress: ProgressMap<T>
) {
  if (activeAuthProvider === "clerk") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sarit-upsc-progress-updated", {
          detail: { subjectSlug, progress },
        })
      );
    }
    return true;
  }

  return queueLatestRemoteWrite(`subject:${subjectSlug}`, () =>
    backendPut(`student/progress/${encodeURIComponent(subjectSlug)}`, { progress }),
  );
}
