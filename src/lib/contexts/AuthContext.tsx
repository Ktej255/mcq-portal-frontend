"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "../firebase/config";
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
    if (!auth) {
      setLoading(false);
      return;
    }
    
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        // Wait for Firebase to definitively determine auth state (v10.3+)
        if (auth && typeof auth.authStateReady === 'function') {
          await auth.authStateReady();
        }
      } catch (err) {
        console.error("Firebase authStateReady failed", err);
      }

      if (auth) {
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      console.error("Auth not initialized");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // Clear persisted stores
      localStorage.removeItem('mcq-timer-storage');
      localStorage.removeItem('mcq-exam-storage');
      router.push("/login");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const getToken = async () => {
    if (auth && auth.currentUser) {
      return await auth.currentUser.getIdToken(true);
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
