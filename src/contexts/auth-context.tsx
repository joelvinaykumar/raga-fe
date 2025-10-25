import { createContext, useContext, useEffect } from "react";
import { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/database";
import { useHomeStore } from "@/store";

export interface AuthContext {
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  signup: (input: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  current_user: User | null;
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useHomeStore((state) => state.is_authenticated);
  const { current_user, setCurrentUser, setIsAuthenticated } = useHomeStore(
    (state) => state,
  );

  const login = async (input: { email: string; password: string }) => {
    try {
      const res = await supabase.auth.signInWithPassword(input);
      if (res.data.session?.access_token) {
        console.log({ res: res.data });
        setIsAuthenticated(!!res.data.session);
        setCurrentUser(res.data.user);
        window.location.href = "/";
      }

      if (res.error) {
        console.error("Error signing in with password => ", res.error);
      }
    } catch (error) {
      console.error("Error signing in with password => ", error);
    }
  };

  const signup = async (input: { email: string; password: string }) => {
    try {
      const res = await supabase.auth.signUp(input);
      if (res.data) {
        setIsAuthenticated(!!res.data.session);
        setCurrentUser(res.data.user);
        window.location.href = "/";
      }

      if (res.error) {
        console.error("Error signing up with password => ", res.error);
      }
    } catch (error) {
      console.error("Error signing up with password => ", error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
      });
    } catch (error) {
      console.error("Error signing in with google => ", error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log({ session });
      setIsAuthenticated(!!session);
      if (session?.user) setCurrentUser(session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        current_user,
        signup,
        loginWithGoogle,
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
