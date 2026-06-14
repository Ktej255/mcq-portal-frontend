"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth as useClerkAuth, useClerk, useUser as useClerkUser } from "@clerk/nextjs";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "../firebase/config";
import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { useRouter } from "next/navigation";
import { resolveToken } from "../auth/token-strategy";
import {
  canUsePreviewAuth,
  clearLocalMockToken,
  isLocalTestingHost,
  readLocalMockIdentity,
  readLocalMockToken,
  saveLocalMockIdentity,
  saveLocalMockToken,
} from "../auth/local-testing";
import {
  activeAuthProvider,
  clerkConfigReady,
  env,
  missingClerkEnvVars,
  missingFirebaseEnvVars,
  missingSupabaseEnvVars,
} from "@/env";
import { supabase } from "@/lib/supabase/client";
import {
  clearLocalUpscLearnerState,
  reconcileLocalUpscLearnerIdentity,
} from "@/lib/upsc/learnerPersistence";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type AuthUser = User | {
  email: string | null;
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

const authDebug = env.NEXT_PUBLIC_DEBUG_API === "true";
const mockAuthEnabled = env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

async function assertSupabaseAuthReachable() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3500);

  try {
    const settingsUrl = new URL("/auth/v1/settings", env.NEXT_PUBLIC_SUPABASE_URL).toString();
    const response = await fetch(settingsUrl, {
      cache: "no-store",
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error("Supabase auth key was rejected.");
    }
  } catch {
    throw new Error("Supabase auth is unreachable or the public API key is invalid right now. Please use Student Preview while auth is being restored.");
  } finally {
    window.clearTimeout(timeout);
  }
}

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

const mapSupabaseUser = (supabaseUser: SupabaseUser, accessToken?: string): AuthUser => ({
  email: supabaseUser.email ?? null,
  uid: supabaseUser.id,
  displayName:
    typeof supabaseUser.user_metadata?.full_name === "string"
      ? supabaseUser.user_metadata.full_name
      : supabaseUser.email?.split("@")[0] ?? null,
  photoURL:
    typeof supabaseUser.user_metadata?.avatar_url === "string"
      ? supabaseUser.user_metadata.avatar_url
      : null,
  getIdToken: async (forceRefresh?: boolean) => {
    if (!supabase) return accessToken ?? "";
    const sessionResult = forceRefresh
      ? await supabase.auth.refreshSession()
      : await supabase.auth.getSession();
    return sessionResult.data.session?.access_token ?? accessToken ?? "";
  },
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

const LegacyAuthProvider = ({ children }: { children: React.ReactNode }) => {
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
    if (authDebug) console.info("AUTH | DEV LOGIN TRIGGERED | Email:", email);
    const token = `MOCK_TOKEN_local_${uid}`;
    const mockUser = {
      email,
      uid,
      displayName: email.split("@")[0],
      photoURL: null,
      getIdToken: async () => token,
    };
    if (typeof window !== 'undefined') {
      saveLocalMockToken(token);
      saveLocalMockIdentity(email, uid);
    }
    setUser(mockUser);
    setLoading(false);
    if (redirectPath) {
      replaceRoute(redirectPath);
    }
  }, [replaceRoute]);

  useEffect(() => {
    if (authDebug) console.info("AUTH | AuthProvider Mount | Auth Initialized:", !!auth);

    if (typeof window !== "undefined") {
      const existingMockToken = readLocalMockToken();
      if (mockAuthEnabled && isLocalTestingHost() && !existingMockToken) {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect") || "/dashboard";
        devLogin("student@upsc.local", "local-dev-student", window.location.pathname.startsWith("/login") ? redirectPath : undefined);
        return;
      }
    }
    
    // DEV BYPASS RESTORATION
    if (typeof window !== 'undefined') {
      const savedToken = readLocalMockToken();
      if (savedToken) {
        if (authDebug) console.info("AUTH | Restoring MOCK_TOKEN session");
        saveLocalMockToken(savedToken);
        
        const mockUser = buildLocalMockUser(savedToken);

        window.setTimeout(() => {
          setUser(mockUser);
          setLoading(false);
        }, 0);
        return;
      }
    }

    // Supabase auth block removed (Supabase auth disabled)

    if (!auth) {
      if (!mockAuthEnabled) {
        console.error(`AUTH | Firebase auth is not initialized. Missing: ${missingFirebaseEnvVars.join(", ")}`);
      }
      window.setTimeout(() => setLoading(false), 0);
      return;
    }
    
    // Explicitly set persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        if (authDebug) console.info("AUTH | Persistence set to local");
      })
      .catch((err) => console.error("AUTH | Error setting persistence:", err));

    let settled = false;

    if (authDebug) console.info("AUTH | Registering onAuthStateChanged listener");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (authDebug) console.info("AUTH | onAuthStateChanged Fired | User exists:", !!currentUser);
      if (currentUser) {
        if (authDebug) console.info("AUTH | Current User Details | UID:", currentUser.uid, "Email:", currentUser.email);
        try {
          const token = await currentUser.getIdToken();
          if (authDebug) console.info("AUTH | Token retrieved on state change | Length:", token?.length);
        } catch (tokenErr) {
          console.error("AUTH | Token retrieval error on state change:", tokenErr);
        }
      }
      reconcileLocalUpscLearnerIdentity(currentUser?.uid);
      settled = true;
      setUser(currentUser);
      setLoading(false);
      if (currentUser && window.location.pathname.startsWith("/login")) {
        const params = new URLSearchParams(window.location.search);
        replaceRoute(params.get("redirect") || "/dashboard");
      }
    });

    const fallback = window.setTimeout(() => {
      if (!settled) {
        if (authDebug) console.warn("AUTH | Firebase auth state did not settle in 5s; force-finishing loading.");
        setLoading(false);
      }
    }, 5000);

    return () => {
      if (authDebug) console.info("AUTH | AuthProvider Unmount");
      window.clearTimeout(fallback);
      unsubscribe();
    };
  }, [devLogin, replaceRoute]);

  const signInWithGoogle = async (redirectPath = "/dashboard") => {
    if (authDebug) console.info("AUTH | signInWithGoogle triggered");
    // Supabase auth checks removed (Supabase auth disabled)

    if (!auth) {
      console.error(`AUTH | Firebase auth is not initialized in signInWithGoogle. Missing: ${missingFirebaseEnvVars.join(", ")}`);
      return;
    }
    try {
      if (authDebug) console.info("AUTH | Starting signInWithPopup");
      const result = await signInWithPopup(auth, googleProvider);
      if (authDebug) console.info("AUTH | signInWithPopup SUCCESS | User:", result.user.email);
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      console.error("AUTH | signInWithPopup ERROR | Code:", authError.code, "Message:", authError.message);
      throw error;
    }
  };

  const sendEmailOtp = async (email: string, redirectPath = "/dashboard") => {
    throw new Error("Email OTP login via Supabase is disabled.");
  };

  const verifyEmailOtp = async (email: string, token: string, redirectPath = "/dashboard") => {
    throw new Error("Email OTP verification via Supabase is disabled.");
  };

  const logout = async () => {
    if (authDebug) console.info("AUTH | logout triggered");
    if (readLocalMockToken()) {
      reconcileLocalUpscLearnerIdentity(null);
      clearLocalUpscLearnerState();
      clearLocalMockToken();
      localStorage.removeItem('mcq-timer-storage');
      localStorage.removeItem('mcq-exam-storage');
      setUser(null);
      setLoading(false);
      pushRoute("/login");
      return;
    }

    // Supabase logout check removed (Supabase auth disabled)

    if (!auth) return;
    try {
      await signOut(auth);
      reconcileLocalUpscLearnerIdentity(null);
      clearLocalUpscLearnerState();
      clearLocalMockToken();
      if (authDebug) console.info("AUTH | signOut SUCCESS");
      // Clear persisted stores
      localStorage.removeItem('mcq-timer-storage');
      localStorage.removeItem('mcq-exam-storage');
      pushRoute("/login");
    } catch (error) {
      console.error("AUTH | logout ERROR", error);
    }
  };

  const getToken = async () => {
    return await resolveToken(true);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, sendEmailOtp, verifyEmailOtp, logout, getToken, devLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function clearExamStores() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("mcq-timer-storage");
  localStorage.removeItem("mcq-exam-storage");
}

const ClerkAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, getToken: getClerkToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const { signOut: clerkSignOut } = useClerk();
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
  }, [clerkUser, getClerkToken, isLoaded, isSignedIn, replaceRoute]);

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
    clearLocalUpscLearnerState();
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (activeAuthProvider === "clerk" && clerkConfigReady) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }

  if (activeAuthProvider === "clerk" && !clerkConfigReady && authDebug) {
    console.error(`AUTH | Clerk auth is not initialized. Missing: ${missingClerkEnvVars.join(", ")}`);
  }

  return <LegacyAuthProvider>{children}</LegacyAuthProvider>;
};

export const useAuth = () => useContext(AuthContext);
