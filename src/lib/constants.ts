import { env } from "./env";

export const BASE_URL = env.VITE_BASE_URL;
export const DEFAULT_ERROR_MESSAGE =
  "Sorry! Unknown error. Please try again in sometime!";
export const SUPABASE_URL = env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

// Generative UI v1 (cards/tables-only declarative rendering). When false, the
// chat surfaces fall back to the legacy markdown + citations experience.
export const GEN_UI_V1_ENABLED = env.VITE_GEN_UI_V1_ENABLED;
