export type SessionResponse = {
  session_id: string;
  user_query: string;
  knowledgebase_id?: string;
};

export type Model = "gpt-4o" | "gpt-4o-mini";

export type KnowledgeBase = {
  rag_id: string;
  name: string;
  description?: string;
};
