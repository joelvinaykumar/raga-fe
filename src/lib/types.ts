export type SessionResponse = {
  session_id: string;
  user_query: string;
  knowledgebase_id?: string;
};

export const BACKEND_MODEL_OPTIONS = ["gpt-4o-mini"] as const;

export type Model = (typeof BACKEND_MODEL_OPTIONS)[number];

export const DEFAULT_MODEL: Model = BACKEND_MODEL_OPTIONS[0];

export type KnowledgeBase = {
  rag_id: string;
  name: string;
  description?: string;
};
