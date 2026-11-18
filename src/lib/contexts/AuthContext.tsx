"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth as useClerkAuth, useClerk, useUser as useClerkUser } from "@clerk/nextjs";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { activeAuthProvider, env } from "@/env";
import { supabase } from "@/lib/supabase/client";
import { resolveToken } from "../auth/token-strategy";
import {
  clearIdentitySensitiveBrowserState,
  clearIdentityStorageUser,
  reconcileIdentityStorageProvider,
  reconcileIdentityStorageUser,
} from "../auth/identity-storage";
import {
  canUsePreviewAuth,
  clearLocalMockToken,
  isLocalTestingHost,
  readLocalMockIdentity,
  readLocalMockToken,
  saveLocalMockIdentity,
  saveLocalMockToken,
} from "../auth/local-testing";
import { reconcileLocalUpscLearnerIdentity } from "@/lib/upsc/learnerPersistence";

// Safe wrappers that return no-op values when ClerkProvider is not mounted.
function useClerkAuthSafe() {
  try { return useClerkAuth(); } catch { return { isLoaded: true, isSignedIn: false, getToken: async () => null } as ReturnType<typeof useClerkAuth>; }
}
function useClerkUserSafe() {
  try { return useClerkUser(); } catch { return { user: null, isLoaded: true, isSignedIn: false } as ReturnType<typeof useClerkUser>; }
}
function useClerkSafe() {
  try { return useClerk(); } catch { return { signOut: async () => {} } as unknown as ReturnType<typeof useClerk>; }
}

export type ServerRole = "ADMIN" | "EDUCATOR" | "STUDENT" | null;

type AuthUser = {
  email: string | null;
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

const mockAuthEnabled = env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** Server-assigned role from /api/v1/auth/me. Never derived from email. */
  role: ServerRole;
  /** True while the authoritative role for the signed-in user is unresolved. */
  roleLoading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  sendEmailOtp: (email: string, redirectPath?: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string, redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  devLogin: (
    email: string,
    uid: string,
    redirectPath?: string,
    tokenOverride?: string,
  ) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  roleLoading: false,
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
  let email = savedIdentity?.email ?? "student@example.com";
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

function buildSupabaseUser(supabaseUser: SupabaseUser | null): AuthUser | null {
  if (!supabaseUser) return null;

  return {
    email: supabaseUser.email ?? null,
    uid: supabaseUser.id,
    displayName:
      (typeof supabaseUser.user_metadata?.full_name === "string" && supabaseUser.user_metadata.full_name) ||
      (typeof supabaseUser.user_metadata?.name === "string" && supabaseUser.user_metadata.name) ||
      supabaseUser.email?.split("@")[0] ||
      null,
    photoURL:
      (typeof supabaseUser.user_metadata?.avatar_url === "string" && supabaseUser.user_metadata.avatar_url) ||
      null,
    getIdToken: async (forceRefresh = false) => {
      if (!supabase) return "";
      if (forceRefresh) await supabase.auth.refreshSession();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? "";
    },
  };
}

function clearExamStores() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("mcq-timer-storage");
  localStorage.removeItem("mcq-exam-storage");
}

function reconcileAuthenticatedBrowserState(userId: string) {
  if (reconcileIdentityStorageUser(activeAuthProvider, userId)) {
    clearExamStores();
  }
}

function profileEndpoint() {
  const base = (env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  return `${base}/auth/me`;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useClerkAuthSafe();
  const { user: clerkUser } = useClerkUserSafe();
  const { signOut: clerkSignOut } = useClerkSafe();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // The resolved role is recorded only for the account it was fetched for, so
  // a stale result can never be read as the current user's authority.
  const [resolvedRole, setResolvedRole] = useState<{
    uid: string;
    role: ServerRole;
  } | null>(null);
  const router = useRouter();

  // Authorization comes from the backend user record, never from the email
  // address or a client-side mock flag. Failures resolve to a null role, which
  // keeps operator surfaces closed. State is written only from the async
  // callbacks, so mounting this provider never triggers a cascading render.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const uid = user.uid;

    user
      .getIdToken()
      .then(async (token) => {
        if (!token) return null;
        const response = await fetch(profileEndpoint(), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) return null;
        const payload = (await response.json().catch(() => null)) as
          | { data?: { role?: unknown } }
          | null;
        const role = payload?.data?.role;
        return role === "ADMIN" || role === "EDUCATOR" || role === "STUDENT"
          ? role
          : null;
      })
      .then((role) => {
        if (!cancelled) setResolvedRole({ uid, role });
      })
      .catch(() => {
        if (!cancelled) setResolvedRole({ uid, role: null });
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // The first resolution for an identity gates the operator surfaces: while it
  // is in flight the role is null and roleLoading is true, so guards never
  // authorize against an unresolved account. Once a role is known for that uid,
  // a background revalidation (for example after a token refresh) keeps the
  // last value instead of flashing the UI closed; the backend still enforces
  // authorization on every request, so a stale client hint grants nothing.
  const role: ServerRole = user && resolvedRole?.uid === user.uid
    ? resolvedRole.role
    : null;
  const roleLoading = Boolean(user) && resolvedRole?.uid !== user?.uid;

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

  const devLogin = useCallback((email: string, uid: string, redirectPath?: string, tokenOverride?: string) => {
    if (!canUsePreviewAuth()) return;
    const token = tokenOverride ?? `MOCK_TOKEN_local_${uid}`;
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
      reconcileAuthenticatedBrowserState(uid);
    }
    setUser(mockUser);
    setLoading(false);
    if (redirectPath) replaceRoute(redirectPath);
  }, [replaceRoute]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reconcileIdentityStorageProvider(activeAuthProvider);
    }

    // Supabase needs its own browser session lifecycle; Clerk hooks are not
    // mounted in this mode and cannot provide a token or identity.
    if (activeAuthProvider === "supabase") {
      if (!supabase) {
        window.setTimeout(() => {
          setUser(null);
          setLoading(false);
        }, 0);
        return;
      }

      let disposed = false;
      const applySession = (sessionUser: SupabaseUser | null) => {
        if (disposed) return;
        const nextUser = buildSupabaseUser(sessionUser);
        if (nextUser) {
          reconcileLocalUpscLearnerIdentity(nextUser.uid);
          reconcileAuthenticatedBrowserState(nextUser.uid);
        } else {
          reconcileLocalUpscLearnerIdentity(null);
        }
        setUser(nextUser);
        setLoading(false);
      };

      void supabase.auth
        .getSession()
        .then(({ data }) => applySession(data.session?.user ?? null))
        .catch(() => applySession(null));

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        applySession(session?.user ?? null);
      });

      return () => {
        disposed = true;
        authListener.subscription.unsubscribe();
      };
    }

    if (typeof window !== "undefined") {
      const existingMockToken = readLocalMockToken();
      if (mockAuthEnabled && isLocalTestingHost() && !existingMockToken) {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect") || "/dashboard";
        window.setTimeout(() => {
          devLogin("student@example.com", "local-dev-student", window.location.pathname.startsWith("/login") ? redirectPath : undefined);
        }, 0);
        return;
      }
    }

    // When mock auth is enabled, don't wait for Clerk — resolve immediately.
    if (mockAuthEnabled) {
      if (typeof window !== "undefined") {
        const existingMockToken = readLocalMockToken();
        if (existingMockToken) {
          (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN = existingMockToken;
          const mockUser = buildLocalMockUser(existingMockToken);
          if (mockUser) reconcileAuthenticatedBrowserState(mockUser.uid);
          window.setTimeout(() => {
            setUser(mockUser);
            setLoading(false);
          }, 0);
          return;
        }
      }
      window.setTimeout(() => {
        setUser(null);
        setLoading(false);
      }, 0);
      return;
    }

    if (!isLoaded) {
      window.setTimeout(() => {
        setLoading(true);
      }, 0);
      return;
    }

    if (isSignedIn && clerkUser) {
      // A valid Clerk session is authoritative; remove any stale local mock state.
      clearLocalMockToken();
      reconcileLocalUpscLearnerIdentity(clerkUser.id);
      reconcileAuthenticatedBrowserState(clerkUser.id);

      // One-way compatibility hydration: legacy Clerk metadata may seed only
      // missing caches. Existing local learner state is never overwritten.
      const metadata = clerkUser.unsafeMetadata || {};
      if (typeof window !== "undefined") {
        const profileKey = "sarit-upsc-student-profile-v1";
        if (metadata.profile && window.localStorage.getItem(profileKey) === null) {
          window.localStorage.setItem(profileKey, JSON.stringify(metadata.profile));
        }
        if (metadata.progress && typeof metadata.progress === "object") {
          Object.entries(metadata.progress).forEach(([slug, value]) => {
            const progressKey = `sarit-upsc-${slug}-progress-v1`;
            if (window.localStorage.getItem(progressKey) === null) {
              window.localStorage.setItem(progressKey, JSON.stringify(value));
            }
          });
        }
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
        getIdToken: async (forceRefresh = false) => (await resolveToken(forceRefresh)) ?? "",
      };

      window.setTimeout(() => {
        setUser(mappedUser);
        setLoading(false);
      }, 0);

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
        const mockUser = buildLocalMockUser(existingMockToken);
        if (mockUser) reconcileAuthenticatedBrowserState(mockUser.uid);
        window.setTimeout(() => {
          setUser(mockUser);
          setLoading(false);
        }, 0);
        return;
      }
    }

    reconcileLocalUpscLearnerIdentity(null);
    window.setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 0);
  }, [clerkUser, isLoaded, isSignedIn, replaceRoute, devLogin]);

  // Mirror the (small) profile into Clerk unsafeMetadata when updated locally.
  // Subject progress is saved to the backend only (see learnerPersistence);
  // progress already in Clerk metadata is still hydrated above at sign-in.
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

    window.addEventListener("sarit-upsc-profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("sarit-upsc-profile-updated", handleProfileUpdate);
    };
  }, [isSignedIn, clerkUser]);

  const signInWithGoogle = async (redirectPath = "/dashboard") => {
    if (activeAuthProvider === "supabase") {
      if (!supabase) throw new Error("Supabase authentication is not configured");
      const redirectTo = `${window.location.origin}${normalizeInternalRedirectPath(redirectPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      return;
    }
    pushRoute(`/login?redirect=${encodeURIComponent(normalizeInternalRedirectPath(redirectPath))}`);
  };

  const sendEmailOtp = async (email: string, redirectPath = "/dashboard") => {
    if (activeAuthProvider === "supabase") {
      if (!supabase) throw new Error("Supabase authentication is not configured");
      const redirectTo = `${window.location.origin}${normalizeInternalRedirectPath(redirectPath)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      return;
    }
    pushRoute(`/login?redirect=${encodeURIComponent(normalizeInternalRedirectPath(redirectPath))}`);
  };

  const verifyEmailOtp = async (email: string, token: string, redirectPath = "/dashboard") => {
    if (activeAuthProvider === "supabase") {
      if (!supabase) throw new Error("Supabase authentication is not configured");
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      replaceRoute(redirectPath);
      return;
    }
    throw new Error("Use the Clerk sign-in screen to verify your email session.");
  };

  const logout = async () => {
    reconcileLocalUpscLearnerIdentity(null);
    clearLocalMockToken();
    clearExamStores();
    clearIdentitySensitiveBrowserState();
    clearIdentityStorageUser();
    setUser(null);
    setLoading(false);

    if (activeAuthProvider === "supabase") {
      if (supabase) await supabase.auth.signOut();
      replaceRoute("/login");
      return;
    }

    if (activeAuthProvider === "clerk") {
      await clerkSignOut({ redirectUrl: "/login" });
    }
  };

  const getToken = async () => resolveToken();

  return (
    <AuthContext.Provider
      value={{ user, loading, role, roleLoading, signInWithGoogle, sendEmailOtp, verifyEmailOtp, logout, getToken, devLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
