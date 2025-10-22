import { env } from "./env";

export const BASE_URL = env.VITE_BASE_URL
export const DEFAULT_ERROR_MESSAGE = "Sorry! Unknown error. Please try again in sometime!"
export const SUPABASE_URL = env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY