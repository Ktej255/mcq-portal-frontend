"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  getRedirectResult,
  signInWithRedirect,
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  getToken: async () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("FORENSIC | AuthProvider Mount | Auth Initialized:", !!auth);
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

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("FORENSIC | getRedirectResult SUCCESS | User:", result.user.email);
        }
      })
      .catch((err) => {
        console.error("FORENSIC | getRedirectResult ERROR | Code:", err.code, "Message:", err.message);
      });

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
      console.log("FORENSIC | Starting signInWithRedirect...");
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("FORENSIC | signInWithRedirect ERROR | Code:", error.code, "Message:", error.message);
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
