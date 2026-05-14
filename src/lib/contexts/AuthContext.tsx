"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  getRedirectResult,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "../firebase/config";
import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  devLogin: (email: string, uid: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  getToken: async () => null,
  devLogin: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const devLogin = (email: string, uid: string) => {
    console.warn("FORENSIC | DEV LOGIN TRIGGERED | Email:", email);
    const mockUser = {
      email,
      uid,
      getIdToken: async () => "MOCK_TOKEN",
    } as any;
    if (typeof window !== 'undefined') {
      (window as any).MOCK_TOKEN = "MOCK_TOKEN";
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN");
    }
    setUser(mockUser);
    setLoading(false);
    router.replace("/dashboard");
  };

  useEffect(() => {
    console.log("FORENSIC | AuthProvider Mount | Auth Initialized:", !!auth);
    
    // DEV BYPASS RESTORATION
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem("MOCK_TOKEN");
      if (savedToken && savedToken.startsWith("MOCK_TOKEN")) {
        console.warn("FORENSIC | Restoring MOCK_TOKEN session:", savedToken);
        (window as any).MOCK_TOKEN = savedToken;
        
        // Derive user identity from token if possible
        let email = "validator@antigravity.os";
        let uid = "dev-validator-id";
        
        if (savedToken.includes("_sim_")) {
          const persona = savedToken.split("_sim_")[1];
          email = `${persona.replace(/_/g, '')}@antigravity.dev`;
          uid = `mock-uid-${persona}`;
        }

        setUser({
          email: email,
          uid: uid,
          getIdToken: async () => savedToken,
        } as any);
        setLoading(false);
        return;
      }
    }

    if (!auth) {
      console.error("FORENSIC | Auth Not Found during mount");
      setLoading(false);
      return;
    }
    
    // Explicitly set persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log("FORENSIC | Persistence set to local"))
      .catch((err) => console.error("FORENSIC | Error setting persistence:", err));

    let settled = false;

    console.log("FORENSIC | Registering onAuthStateChanged listener");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("FORENSIC | onAuthStateChanged Fired | User exists:", !!currentUser);
      if (currentUser) {
        console.log("FORENSIC | Current User Details | UID:", currentUser.uid, "Email:", currentUser.email);
        try {
          const token = await currentUser.getIdToken();
          console.log("FORENSIC | Token retrieved on state change | Length:", token?.length);
        } catch (tokenErr) {
          console.error("FORENSIC | Token retrieval error on state change:", tokenErr);
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
        console.warn("FORENSIC | Firebase auth state did not settle in 5s; force-finishing loading.");
        setLoading(false);
      }
    }, 5000);

    return () => {
      console.log("FORENSIC | AuthProvider Unmount");
      window.clearTimeout(fallback);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    console.log("FORENSIC | signInWithGoogle triggered");
    if (!auth) {
      console.error("FORENSIC | Auth not initialized in signInWithGoogle");
      return;
    }
    try {
      console.log("FORENSIC | Starting signInWithPopup...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("FORENSIC | signInWithPopup SUCCESS | User:", result.user.email);
    } catch (error: any) {
      console.error("FORENSIC | signInWithPopup ERROR | Code:", error.code, "Message:", error.message);
      console.error("FORENSIC | Full Error Object:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("FORENSIC | logout triggered");
    if (!auth) return;
    try {
      await signOut(auth);
      console.log("FORENSIC | signOut SUCCESS");
      // Clear persisted stores
      localStorage.removeItem('mcq-timer-storage');
      localStorage.removeItem('mcq-exam-storage');
      router.push("/login");
    } catch (error) {
      console.error("FORENSIC | logout ERROR", error);
    }
  };

  const getToken = async () => {
    if (auth && auth.currentUser) {
      console.log("FORENSIC | getToken called | currentUser present");
      return await auth.currentUser.getIdToken(true);
    }
    console.warn("FORENSIC | getToken called | currentUser NULL");
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, getToken, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
