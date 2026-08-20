import { createContext, useContext, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";

import axios from "@/lib/axios";
import { supabase } from "@/lib/database";
import { useHomeStore } from "@/store";

export interface AuthContext {
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
  }) => Promise<{ session: Session | null; user: User | null }>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  current_user: User | null;
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useHomeStore((state) => state.is_authenticated);
  const { current_user, setCurrentUser, setIsAuthenticated, setApiKey } =
    useHomeStore((state) => state);

  const login = async (input: { email: string; password: string }) => {
    const res = await supabase.auth.signInWithPassword(input);

    if (res.error) {
      console.error("Error signing in with password => ", res.error);
      // Surface the failure to the caller so it can alert the user.
      throw res.error;
    }

    if (res.data.session?.access_token) {
      setIsAuthenticated(!!res.data.session);
      setCurrentUser(res.data.user);
      window.location.href = "/";
    }
  };

  const signup = async (input: { email: string; password: string }) => {
    const res = await supabase.auth.signUp(input);

    if (res.error) {
      console.error("Error signing up with password => ", res.error);
      // Surface the failure to the caller so it can alert the user.
      throw res.error;
    }

    // When email confirmation is enabled, Supabase returns a user without a
    // session. In that case the caller shows a "check your inbox" message
    // instead of redirecting into the authenticated app.
    if (res.data.session?.access_token) {
      setIsAuthenticated(true);
      setCurrentUser(res.data.user);
      window.location.href = "/";
    }

    return res.data;
  };

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
    } catch (error) {
      console.error("Error signing in with google => ", error);
    }
  };

  const loginWithGithub = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      console.error("Error signing in with github => ", error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setApiKey(null);
  };

  useEffect(() => {
    // Ensure the user's MCP API key is provisioned whenever a session exists.
    // The backend /me endpoint creates one on first call and reuses it after.
    const ensureApiKey = async (hasSession: boolean) => {
      if (!hasSession) {
        setApiKey(null);
        return;
      }
      try {
        const res = await axios.get("/me");
        setApiKey(res.data?.api_key ?? null);
      } catch (error) {
        console.error("Error provisioning API key => ", error);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setCurrentUser(session?.user ?? null);
      ensureApiKey(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setCurrentUser(session?.user ?? null);
      ensureApiKey(!!session);
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUser, setIsAuthenticated, setApiKey]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        current_user,
        signup,
        loginWithGoogle,
        loginWithGithub,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
