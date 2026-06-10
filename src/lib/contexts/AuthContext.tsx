"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
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
import { canUsePreviewAuth, clearLocalMockToken, isLocalTestingHost, readLocalMockToken } from "../auth/local-testing";
import { activeAuthProvider, env, missingFirebaseEnvVars, missingSupabaseEnvVars } from "@/env";
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
  signInWithGoogle: () => Promise<void>;
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN = token;
      localStorage.setItem("MOCK_TOKEN", token);
    }
    setUser(mockUser);
    setLoading(false);
    if (redirectPath) {
      router.replace(redirectPath);
    }
  }, [router]);

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
        (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN = savedToken;
        
        // Derive user identity from token if possible
        let email = "student@upsc.local";
        let uid = "dev-student-id";
        
        if (savedToken.includes("_sim_")) {
          const persona = savedToken.split("_sim_")[1];
          email = `${persona.replace(/_/g, '')}@upsc.local`;
          uid = `mock-uid-${persona}`;
        }

        window.setTimeout(() => {
          setUser({
            email: email,
            uid: uid,
            displayName: email.split("@")[0],
            photoURL: null,
            getIdToken: async () => savedToken,
          });
          setLoading(false);
        }, 0);
        return;
      }
    }

    if (activeAuthProvider === "supabase") {
      if (!supabase) {
        console.error(`AUTH | Supabase auth is not initialized. Missing: ${missingSupabaseEnvVars.join(", ")}`);
        window.setTimeout(() => setLoading(false), 0);
        return;
      }

      let cancelled = false;
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        reconcileLocalUpscLearnerIdentity(data.session?.user.id);
        setUser(data.session?.user ? mapSupabaseUser(data.session.user, data.session.access_token) : null);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        reconcileLocalUpscLearnerIdentity(session?.user.id);
        setUser(session?.user ? mapSupabaseUser(session.user, session.access_token) : null);
        setLoading(false);
        if (session?.user && window.location.pathname.startsWith("/login")) {
          const params = new URLSearchParams(window.location.search);
          router.replace(params.get("redirect") || "/dashboard");
        }
      });

      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    }

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
        router.replace(params.get("redirect") || "/dashboard");
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
  }, [devLogin, router]);

  const signInWithGoogle = async () => {
    if (authDebug) console.info("AUTH | signInWithGoogle triggered");
    if (activeAuthProvider === "supabase") {
      if (!supabase) {
        console.error(`AUTH | Supabase auth is not initialized in signInWithGoogle. Missing: ${missingSupabaseEnvVars.join(", ")}`);
        return;
      }
      await assertSupabaseAuthReachable();
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      return;
    }

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
    if (activeAuthProvider !== "supabase") {
      throw new Error("Email login is available after Supabase auth is enabled.");
    }

    if (!supabase) {
      throw new Error(`Supabase auth is not initialized. Missing: ${missingSupabaseEnvVars.join(", ")}`);
    }

    await assertSupabaseAuthReachable();

    const emailRedirectTo =
      typeof window !== "undefined" ? `${window.location.origin}${redirectPath}` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) throw error;
  };

  const verifyEmailOtp = async (email: string, token: string, redirectPath = "/dashboard") => {
    if (activeAuthProvider !== "supabase") {
      throw new Error("Email login is available after Supabase auth is enabled.");
    }

    if (!supabase) {
      throw new Error(`Supabase auth is not initialized. Missing: ${missingSupabaseEnvVars.join(", ")}`);
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) throw error;

    reconcileLocalUpscLearnerIdentity(data.user?.id);
    setUser(data.user ? mapSupabaseUser(data.user, data.session?.access_token) : null);
    setLoading(false);
    router.replace(redirectPath);
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
      router.push("/login");
      return;
    }

    if (activeAuthProvider === "supabase" && supabase) {
      await supabase.auth.signOut();
      reconcileLocalUpscLearnerIdentity(null);
      clearLocalUpscLearnerState();
      clearLocalMockToken();
      localStorage.removeItem('mcq-timer-storage');
      localStorage.removeItem('mcq-exam-storage');
      router.push("/login");
      return;
    }

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
      router.push("/login");
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

export const useAuth = () => useContext(AuthContext);
