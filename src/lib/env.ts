import { z } from "zod";

// Coerce common truthy string representations ("1", "true", "yes") into a boolean.
// Defaults to `false` when the variable is absent so Generative UI v1 stays behind
// an explicit opt-in and rollback is a single env flip.
const booleanFlag = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return false;
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  });

const envSchema = z.object({
  VITE_BASE_URL: z.string(),
  VITE_SUPABASE_URL: z.string(),
  VITE_SUPABASE_ANON_KEY: z.string(),
  // Generative UI v1 feature flag (cards/tables-only declarative rendering).
  VITE_GEN_UI_V1_ENABLED: booleanFlag,
});

export const env = envSchema.parse(import.meta.env);
