import { useCallback, useRef, useState } from "react";
import { BASE_URL } from "./constants";
import { supabase } from "@/lib/database";

type StreamChunk = {
  content?: string;
  done?: boolean;
  citations?: CitationMeta[];
  chunks?: SourceChunkMeta[];
  ui?: GenerativeUiPayload;
  error?: ApiErrorEnvelope;
  request_id?: string;
};

export type ApiErrorEnvelope = {
  code: string;
  message: string;
  details?: string | null;
  request_id?: string | null;
};

export type CitationMeta = {
  index: number;
  start_char: number;
  end_char: number;
  display_char: number;
  chunk_id?: string | null;
  file_id?: number | string | null;
  filename?: string | null;
  quote?: string | null;
  score?: number | string | null;
  url?: string | null;
};

export type SourceChunkMeta = {
  index?: number;
  chunk_id?: string | null;
  chunk_index?: number | null;
  file_id?: number | string | null;
  filename?: string | null;
  score?: number | string | null;
  source?: string | null;
  url?: string | null;
  content: string;
  preview?: string | null;
};

export type UiMetric = {
  label: string;
  value: string;
};

export type UiCardBlock = {
  type: "card";
  title: string;
  body?: string | null;
  metrics?: UiMetric[];
};

export type UiTableBlock = {
  type: "table";
  title?: string | null;
  columns: string[];
  rows: string[][];
};

export type UiBlock = UiCardBlock | UiTableBlock;

export type GenerativeUiPayload = {
  version?: number;
  blocks: UiBlock[];
};

type StreamMeta = {
  citations?: CitationMeta[];
  chunks?: SourceChunkMeta[];
  ui?: GenerativeUiPayload;
  request_id?: string;
};

const FALLBACK_STREAM_ERROR =
  "The LLM service is currently unavailable. Please try again later.";

const isValidUiPayload = (value: unknown): value is GenerativeUiPayload => {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { blocks?: unknown };
  return Array.isArray(maybe.blocks);
};

const toApiErrorEnvelope = (
  payload: unknown,
  fallbackMessage = FALLBACK_STREAM_ERROR,
): ApiErrorEnvelope => {
  const asRecord =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const nestedError =
    asRecord.error && typeof asRecord.error === "object"
      ? (asRecord.error as Record<string, unknown>)
      : undefined;

  const source = nestedError ?? asRecord;
  const message =
    (typeof source.message === "string" && source.message.trim()) ||
    (typeof asRecord.detail === "string" && asRecord.detail.trim()) ||
    fallbackMessage;

  return {
    code:
      (typeof source.code === "string" && source.code.trim()) ||
      "upstream_unavailable",
    message,
    details: typeof source.details === "string" ? source.details : undefined,
    request_id:
      (typeof source.request_id === "string" && source.request_id) ||
      (typeof asRecord.request_id === "string" && asRecord.request_id) ||
      undefined,
  };
};

const toThrownStreamError = (
  envelope: ApiErrorEnvelope,
  status?: number,
): Error & { data: Record<string, unknown>; status?: number } => {
  const err = new Error(envelope.message) as Error & {
    data: Record<string, unknown>;
    status?: number;
  };
  err.data = {
    error: envelope,
    code: envelope.code,
    message: envelope.message,
    detail: envelope.message,
    request_id: envelope.request_id,
  };
  if (status) {
    err.status = status;
  }
  return err;
};

type UseStreamReturn = {
  data: string;
  isLoading: boolean;
  error: string | null;
  stream: (
    url: string,
    body: Record<string, unknown>,
    onChunk?: (chunk: string) => void,
    onMeta?: (meta: StreamMeta) => void,
  ) => Promise<void>;
  reset: () => void;
};

export function useStream(): UseStreamReturn {
  const [data, setData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setData("");
    setIsLoading(false);
    setError(null);
  }, []);

  const stream = useCallback(
    async (
      url: string,
      body: Record<string, unknown>,
      onChunk?: (chunk: string) => void,
      onMeta?: (meta: StreamMeta) => void,
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);
      setData("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${BASE_URL}${url}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          let payload: unknown = null;
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
          const envelope = toApiErrorEnvelope(
            payload,
            `Request failed with status ${response.status}`,
          );
          throw toThrownStreamError(envelope, response.status);
        }

        const contentType = response.headers.get("content-type") ?? "";

        if (contentType.includes("text/event-stream")) {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No reader available");
          }

          const decoder = new TextDecoder();
          let buffer = "";
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed: StreamChunk = JSON.parse(jsonStr);
                  if (parsed.error) {
                    setIsLoading(false);
                    const envelope = toApiErrorEnvelope(parsed.error);
                    setError(envelope.message);
                    throw toThrownStreamError(envelope);
                  }
                  const hasUi = isValidUiPayload(parsed.ui);
                  if (
                    parsed.citations ||
                    parsed.chunks ||
                    hasUi ||
                    parsed.request_id
                  ) {
                    onMeta?.({
                      citations: parsed.citations,
                      chunks: parsed.chunks,
                      ui: hasUi ? parsed.ui : undefined,
                      request_id: parsed.request_id,
                    });
                  }
                  if (parsed.done) {
                    setIsLoading(false);
                    return;
                  }
                  if (parsed.content) {
                    accumulated += parsed.content;
                    setData(accumulated);
                    onChunk?.(parsed.content);
                  }
                } catch (parseErr) {
                  if (
                    parseErr instanceof Error &&
                    typeof (parseErr as { data?: unknown }).data === "object"
                  ) {
                    throw parseErr;
                  }
                  // skip malformed JSON
                }
              }
            }
          }

          setIsLoading(false);
        } else {
          const json = await response.json();
          const answer = json.answer ?? "";
          setData(answer);
          onChunk?.(answer);
          if (json.citations || json.chunks) {
            onMeta?.({
              citations: json.citations,
              chunks: json.chunks,
              ui: isValidUiPayload(json.ui) ? json.ui : undefined,
              request_id: json.request_id,
            });
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setIsLoading(false);
          return;
        }
        const envelope = toApiErrorEnvelope(err);
        setError(envelope.message);
        setIsLoading(false);
        throw toThrownStreamError(envelope);
      }
    },
    [],
  );

  return { data, isLoading, error, stream, reset };
}
