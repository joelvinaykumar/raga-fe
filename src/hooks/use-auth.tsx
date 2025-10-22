import { supabase } from "@/lib/database";
import { useHomeStore } from "@/store";
import { redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const useAuth = () => {
  const isAuthenticated = useHomeStore((state) => state.is_authenticated);
  const { setCurrentUser, setIsAuthenticated } = useHomeStore((state) => state);

  const login = async (input: { email: string; password: string }) => {
    try {
      const res = await supabase.auth.signInWithPassword(input);
      if (res.data) {
        setIsAuthenticated(!!res.data.session);
        setCurrentUser(res.data.user);
        redirect({ to: "/" });
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
        redirect({ to: "/" });
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
      const res = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (res.data) {
        redirect({ to: "/" });
      }

      if (res.error) {
        console.error("Error signing in with google => ", res.error);
      }
    } catch (error) {
      console.error("Error signing in with google => ", error);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) setCurrentUser(session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { isAuthenticated, login, signup, loginWithGoogle };
};
