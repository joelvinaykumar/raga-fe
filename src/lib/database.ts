import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const authStorageKey = "raga-auth-token";

const localStorageAdapter =
  typeof window !== "undefined" ? window.localStorage : undefined;
const sessionStorageAdapter =
  typeof window !== "undefined" ? window.sessionStorage : undefined;

const removeFakeRefreshToken = (storage?: Storage) => {
  if (!storage) return;

  const raw = storage.getItem(authStorageKey);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        refresh_token?: string;
        currentSession?: { refresh_token?: string };
      } | null;

      const refreshToken =
        parsed?.refresh_token ?? parsed?.currentSession?.refresh_token;

      if (refreshToken === "fake-refresh-token") {
        storage.removeItem(authStorageKey);
      }
    } catch {
      storage.removeItem(authStorageKey);
    }
  }
};

removeFakeRefreshToken(localStorageAdapter);
removeFakeRefreshToken(sessionStorageAdapter);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: authStorageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    storage: localStorageAdapter,
  },
});
