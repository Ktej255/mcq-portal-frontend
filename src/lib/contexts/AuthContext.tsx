"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth as useClerkAuth, useClerk, useUser as useClerkUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { resolveToken } from "../auth/token-strategy";
import { activeAuthProvider } from "@/env";

// Safe wrappers that return no-op values when ClerkProvider is not mounted
function useClerkAuthSafe() {
  try { return useClerkAuth(); } catch { return { isLoaded: true, isSignedIn: false, getToken: async () => null } as ReturnType<typeof useClerkAuth>; }
}
function useClerkUserSafe() {
  try { return useClerkUser(); } catch { return { user: null, isLoaded: true, isSignedIn: false } as ReturnType<typeof useClerkUser>; }
}
function useClerkSafe() {
  try { return useClerk(); } catch { return { signOut: async () => {} } as unknown as ReturnType<typeof useClerk>; }
}
import {
  canUsePreviewAuth,
  clearLocalMockToken,
  isLocalTestingHost,
  readLocalMockIdentity,
  readLocalMockToken,
  saveLocalMockIdentity,
  saveLocalMockToken,
} from "../auth/local-testing";
import { env } from "@/env";
import {
  clearLocalUpscLearnerState,
  reconcileLocalUpscLearnerIdentity,
} from "@/lib/upsc/learnerPersistence";

type AuthUser = {
  email: string | null;
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

const authDebug = env.NEXT_PUBLIC_DEBUG_API === "true";
const mockAuthEnabled = env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  sendEmailOtp: (email: string, redirectPath?: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string, redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  devLogin: (email: string, uid: string, redirectPath?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  sendEmailOtp: async () => {},
  verifyEmailOtp: async () => {},
  logout: async () => {},
  getToken: async () => null,
  devLogin: () => {},
});

function normalizeInternalRedirectPath(redirectPath = "/dashboard") {
  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) return "/dashboard";

  try {
    const url = new URL(redirectPath, window.location.origin);
    if (url.origin !== window.location.origin) return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}` || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function buildLocalMockUser(savedToken: string | null): AuthUser | null {
  if (!savedToken) return null;

  const savedIdentity = readLocalMockIdentity();
  let email = savedIdentity?.email ?? "student@upsc.local";
  let uid = savedIdentity?.uid ?? "dev-student-id";

  if (!savedIdentity && savedToken.includes("_sim_")) {
    const persona = savedToken.split("_sim_")[1];
    email = `${persona.replace(/_/g, "")}@upsc.local`;
    uid = `mock-uid-${persona}`;
  }

  return {
    email,
    uid,
    displayName: email.split("@")[0],
    photoURL: null,
    getIdToken: async () => savedToken,
  };
}

function clearExamStores() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("mcq-timer-storage");
  localStorage.removeItem("mcq-exam-storage");
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, getToken: getClerkToken } = useClerkAuthSafe();
  const { user: clerkUser } = useClerkUserSafe();
  const { signOut: clerkSignOut } = useClerkSafe();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const replaceRoute = useCallback((redirectPath = "/dashboard") => {
    window.setTimeout(() => {
      router.replace(normalizeInternalRedirectPath(redirectPath));
    }, 0);
  }, [router]);

  const pushRoute = useCallback((redirectPath = "/dashboard") => {
    window.setTimeout(() => {
      router.push(normalizeInternalRedirectPath(redirectPath));
    }, 0);
  }, [router]);

  const devLogin = useCallback((email: string, uid: string, redirectPath?: string) => {
    if (!canUsePreviewAuth()) return;
    const token = `MOCK_TOKEN_local_${uid}`;
    const mockUser: AuthUser = {
      email,
      uid,
      displayName: email.split("@")[0],
      photoURL: null,
      getIdToken: async () => token,
    };
    if (typeof window !== "undefined") {
      saveLocalMockToken(token);
      saveLocalMockIdentity(email, uid);
    }
    setUser(mockUser);
    setLoading(false);
    if (redirectPath) replaceRoute(redirectPath);
  }, [replaceRoute]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const existingMockToken = readLocalMockToken();
      if (mockAuthEnabled && isLocalTestingHost() && !existingMockToken) {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect") || "/dashboard";
        devLogin("student@upsc.local", "local-dev-student", window.location.pathname.startsWith("/login") ? redirectPath : undefined);
        return;
      }
    }

    // When mock auth is enabled, don't wait for Clerk — resolve immediately
    if (mockAuthEnabled) {
      if (typeof window !== "undefined") {
        const existingMockToken = readLocalMockToken();
        if (existingMockToken) {
          (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN = existingMockToken;
          setUser(buildLocalMockUser(existingMockToken));
          setLoading(false);
          return;
        }
      }
      setUser(null);
      setLoading(false);
      return;
    }

    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (isSignedIn && clerkUser) {
      // Clear mock token as we have a valid Clerk session
      clearLocalMockToken();
      
      // Hydrate local state from Clerk unsafeMetadata
      const metadata = clerkUser.unsafeMetadata || {};
      if (metadata.profile && typeof window !== "undefined") {
        window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(metadata.profile));
      }
      if (metadata.progress && typeof metadata.progress === "object" && typeof window !== "undefined") {
        Object.entries(metadata.progress).forEach(([slug, val]) => {
          window.localStorage.setItem(`sarit-upsc-${slug}-progress-v1`, JSON.stringify(val));
        });
      }

      const primaryEmail =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses?.[0]?.emailAddress ??
        null;
      const mappedUser: AuthUser = {
        email: primaryEmail,
        uid: clerkUser.id,
        displayName: clerkUser.fullName ?? clerkUser.username ?? primaryEmail?.split("@")[0] ?? null,
        photoURL: clerkUser.imageUrl ?? null,
        getIdToken: async () => (await getClerkToken()) ?? "",
      };

      reconcileLocalUpscLearnerIdentity(clerkUser.id);
      setUser(mappedUser);
      setLoading(false);

      if (typeof window !== "undefined" && window.location.pathname.startsWith("/login")) {
        const params = new URLSearchParams(window.location.search);
        replaceRoute(params.get("redirect") || "/dashboard");
      }
      return;
    }

    // Clerk is loaded, but not signed in. Check if we have a local mock session fallback.
    if (typeof window !== "undefined") {
      const existingMockToken = readLocalMockToken();
      if (existingMockToken) {
        (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN = existingMockToken;
        setUser(buildLocalMockUser(existingMockToken));
        setLoading(false);
        return;
      }
    }

    reconcileLocalUpscLearnerIdentity(null);
    setUser(null);
    setLoading(false);
  }, [clerkUser, getClerkToken, isLoaded, isSignedIn, replaceRoute, devLogin]);

  // Sync profile & progress back to Clerk unsafeMetadata when updated locally
  useEffect(() => {
    if (!isSignedIn || !clerkUser) return;

    const handleProfileUpdate = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const profile = customEvent.detail;
      try {
        await clerkUser.update({
          unsafeMetadata: {
            ...clerkUser.unsafeMetadata,
            profile,
          },
        });
      } catch (err) {
        console.error("Clerk | Failed to save student profile metadata:", err);
      }
    };

    const handleProgressUpdate = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { subjectSlug, progress } = customEvent.detail;
      try {
        const currentProgress = (clerkUser.unsafeMetadata?.progress as Record<string, any>) || {};
        await clerkUser.update({
          unsafeMetadata: {
            ...clerkUser.unsafeMetadata,
            progress: {
              ...currentProgress,
              [subjectSlug]: progress,
            },
          },
        });
      } catch (err) {
        console.error("Clerk | Failed to save subject progress metadata:", err);
      }
    };

    window.addEventListener("sarit-upsc-profile-updated", handleProfileUpdate);
    window.addEventListener("sarit-upsc-progress-updated", handleProgressUpdate);

    return () => {
      window.removeEventListener("sarit-upsc-profile-updated", handleProfileUpdate);
      window.removeEventListener("sarit-upsc-progress-updated", handleProgressUpdate);
    };
  }, [isSignedIn, clerkUser]);

  const signInWithGoogle = async (redirectPath = "/dashboard") => {
    pushRoute(`/login?redirect=${encodeURIComponent(normalizeInternalRedirectPath(redirectPath))}`);
  };

  const sendEmailOtp = async (_email: string, redirectPath = "/dashboard") => {
    pushRoute(`/login?redirect=${encodeURIComponent(normalizeInternalRedirectPath(redirectPath))}`);
  };

  const verifyEmailOtp = async () => {
    throw new Error("Use the Clerk sign-in screen to verify your email session.");
  };

  const logout = async () => {
    reconcileLocalUpscLearnerIdentity(null);
    clearLocalMockToken();
    clearExamStores();
    setUser(null);
    setLoading(false);
    await clerkSignOut({ redirectUrl: "/login" });
  };

  const getToken = async () => {
    const mockToken = readLocalMockToken();
    if (mockToken) return mockToken;
    return (await getClerkToken()) ?? null;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, sendEmailOtp, verifyEmailOtp, logout, getToken, devLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
