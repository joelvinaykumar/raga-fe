import type { CitationMeta, SourceChunkMeta } from "@/lib/stream";
import type { Sparkles } from "lucide-react";

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  loading: boolean;
  citations?: CitationMeta[];
  chunks?: SourceChunkMeta[];
};

export type RagDocument = {
  id: number;
  rag_id: string;
  filename: string;
  filesize: number;
  upload_timestamp: string;
};

export type RagInfo = {
  name: string;
  description?: string;
  top_k: number;
  chunk_size: number;
  embedding_model: string;
};

export type PromptSuggestionCard = {
  title: string;
  desc: string;
  prompt: string;
  icon: typeof Sparkles;
};
