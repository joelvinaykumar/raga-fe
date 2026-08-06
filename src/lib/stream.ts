import { useCallback, useRef, useState } from "react";
import { BASE_URL } from "./constants";
import { supabase } from "@/lib/database";

type StreamChunk = {
  content: string;
  done: boolean;
};

type UseStreamReturn = {
  data: string;
  isLoading: boolean;
  error: string | null;
  stream: (
    url: string,
    body: Record<string, unknown>,
    onChunk?: (chunk: string) => void,
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
          throw new Error(`HTTP error! status: ${response.status}`);
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
                  if (parsed.done) {
                    setIsLoading(false);
                    return;
                  }
                  if (parsed.content) {
                    accumulated += parsed.content;
                    setData(accumulated);
                    onChunk?.(parsed.content);
                  }
                } catch {
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
          setIsLoading(false);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Streaming failed");
        setIsLoading(false);
      }
    },
    [],
  );

  return { data, isLoading, error, stream, reset };
}
