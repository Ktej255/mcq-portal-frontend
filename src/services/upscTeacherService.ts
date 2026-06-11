import { readLocalMockToken } from "@/lib/auth/local-testing";
import { activeAuthProvider } from "@/env";
import { supabase } from "@/lib/supabase/client";
import {
  parseAdaptiveTeacherResponse,
  type AdaptiveTeacherRequest,
} from "@/lib/upsc/adaptiveTeacher";

export const ADAPTIVE_TEACHER_CLIENT_TIMEOUT_MS = 13_000;

export async function readLearnerApiAccessToken() {
  const mockToken = readLocalMockToken();
  if (mockToken) return mockToken;
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function requestAdaptiveTeacherDiscussion(payload: AdaptiveTeacherRequest) {
  const token = await readLearnerApiAccessToken();
  if (!token && activeAuthProvider !== "clerk") throw new Error("Learner session required");

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), ADAPTIVE_TEACHER_CLIENT_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch("/api/upsc/teacher/discuss", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }

  if (!response.ok) throw new Error("Teacher discussion request failed");
  const teacherResponse = parseAdaptiveTeacherResponse(await response.json().catch(() => null));
  if (!teacherResponse) throw new Error("Teacher discussion response invalid");
  return teacherResponse;
}
