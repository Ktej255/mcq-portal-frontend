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
import { activeAuthProvider, env, missingFirebaseEnvVars, missingSupabaseEnvVars } from "@/env";
import { supabase } from "@/lib/supabase/client";
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

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  devLogin: (email: string, uid: string, redirectPath?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
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
      const hostname = window.location.hostname;
      const isLocalTestingHost = hostname === "localhost" || hostname === "127.0.0.1";
      if (mockAuthEnabled && isLocalTestingHost) {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect") || "/dashboard";
        devLogin("validator@upsc.local", "local-dev-validator", window.location.pathname.startsWith("/login") ? redirectPath : undefined);
        return;
      }
    }
    
    // DEV BYPASS RESTORATION
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem("MOCK_TOKEN");
      if (savedToken && savedToken.startsWith("MOCK_TOKEN")) {
        if (authDebug) console.info("AUTH | Restoring MOCK_TOKEN session");
        (window as Window & { MOCK_TOKEN?: string }).MOCK_TOKEN = savedToken;
        
        // Derive user identity from token if possible
        let email = "validator@upsc.local";
        let uid = "dev-validator-id";
        
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
        setUser(data.session?.user ? mapSupabaseUser(data.session.user, data.session.access_token) : null);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const logout = async () => {
    if (authDebug) console.info("AUTH | logout triggered");
    if (activeAuthProvider === "supabase" && supabase) {
      await supabase.auth.signOut();
      localStorage.removeItem('mcq-timer-storage');
      localStorage.removeItem('mcq-exam-storage');
      router.push("/login");
      return;
    }

    if (!auth) return;
    try {
      await signOut(auth);
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, getToken, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
