import type {
  CitationMeta,
  GenerativeUiPayload,
  SourceChunkMeta,
} from "@/lib/stream";
import type { Sparkles } from "lucide-react";

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  loading: boolean;
  citations?: CitationMeta[];
  chunks?: SourceChunkMeta[];
  ui?: GenerativeUiPayload;
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

export type EvalStatus = "pending" | "running" | "completed" | "failed";

export type EvalMetrics = {
  groundedness: number;
  answer_relevance: number;
  context_relevance: number;
  retrieval_coverage: number;
  overall_score: number;
  avg_response_ms: number;
};

export type EvalQuestionResult = {
  question: string;
  answer: string;
  groundedness: number;
  answer_relevance: number;
  context_relevance: number;
  retrieved_chunks: number;
  response_ms: number;
  rationale?: string | null;
};

export type RagEvaluation = {
  eval_id: string;
  rag_id: string;
  status: EvalStatus;
  progress: number;
  question_count: number;
  completed_count: number;
  metrics?: EvalMetrics | null;
  questions: EvalQuestionResult[];
  error?: string | null;
};

export type StartEvalResponse = {
  eval_id: string;
  rag_id: string;
  status: EvalStatus;
};

/** Keep the last N messages in the workspace so long sessions cannot grow unbounded. */
export const MAX_RENDERED_MESSAGES = 200;

const CHUNK_PREVIEW_CHARS = 280;

/** Drop full retrieved chunk bodies; the UI only needs a short preview. */
export function compactSourceChunks(
  chunks?: SourceChunkMeta[],
): SourceChunkMeta[] | undefined {
  if (!chunks?.length) return chunks;
  return chunks.map((chunk) => ({
    ...chunk,
    preview:
      chunk.preview ||
      (chunk.content ? chunk.content.slice(0, CHUNK_PREVIEW_CHARS) : null),
    content: "",
  }));
}

export function capMessages(messages: Message[]): Message[] {
  if (messages.length <= MAX_RENDERED_MESSAGES) return messages;
  return messages.slice(-MAX_RENDERED_MESSAGES);
}
