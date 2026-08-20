export type SessionResponse = {
  session_id: string;
  user_query: string;
  knowledgebase_id?: string;
};

export const BACKEND_MODEL_OPTIONS = ["gpt-4o-mini"] as const;

export type Model = (typeof BACKEND_MODEL_OPTIONS)[number];

export const DEFAULT_MODEL: Model = BACKEND_MODEL_OPTIONS[0];

// Top-K retrieval bounds. Single source of truth for every UI surface (create
// form, config slider) so a value chosen in one place stays consistent.
export const TOP_K_MIN = 1;
export const TOP_K_MAX = 100;
export const TOP_K_DEFAULT = 8;

/** Clamp any incoming top-k value into the supported [TOP_K_MIN, TOP_K_MAX] range. */
export const clampTopK = (value: number): number => {
  if (!Number.isFinite(value)) return TOP_K_DEFAULT;
  return Math.min(Math.max(Math.round(value), TOP_K_MIN), TOP_K_MAX);
};

/**
 * Human-readable guidance describing how a given top-k value shapes results,
 * so users understand the tradeoff between determinism and diversity.
 */
export const describeTopK = (
  value: number,
): { label: string; hint: string } => {
  const v = clampTopK(value);
  if (v <= 1) {
    return {
      label: "Deterministic",
      hint: "Always picks the single most likely token.",
    };
  }
  if (v <= 30) {
    return {
      label: "Focused & predictable",
      hint: "Highly focused and predictable; good for technical tasks or precise code.",
    };
  }
  if (v <= 70) {
    return {
      label: "Balanced default",
      hint: "Standard default across many platforms and libraries like Hugging Face Transformers.",
    };
  }
  return {
    label: "Diverse & creative",
    hint: "More diverse and creative, though very high values can occasionally hurt coherence.",
  };
};

export type KnowledgeBase = {
  rag_id: string;
  name: string;
  description?: string;
};
