import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useStream } from "@/lib/stream";
import type { Message } from "../-lib/types";

type ChatParams = { topK: number; model: string };

/**
 * Owns an active chat session bound to a knowledge base: the persistent
 * session id, the message list, streaming state, and the submit/reset/keyboard
 * handlers. `getChatParams` lets the caller supply the live top-k/model config
 * at submit time without coupling this hook to the config hook.
 */
export function useChatSession(kbId: string, getChatParams: () => ChatParams) {
  const [sessionId, setSessionId] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { stream: streamChat } = useStream();

  // Initialize or restore the persistent session id for this workspace.
  useEffect(() => {
    let activeSessionId = localStorage.getItem(`nexus_session_${kbId}`);
    if (!activeSessionId) {
      activeSessionId = `session_${kbId}_${crypto.randomUUID().slice(0, 8)}`;
      localStorage.setItem(`nexus_session_${kbId}`, activeSessionId);
    }
    setSessionId(activeSessionId);
  }, [kbId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  const resetHistory = async () => {
    if (isStreaming) return;
    try {
      const newSessionId = `session_${kbId}_${crypto.randomUUID().slice(0, 8)}`;
      localStorage.setItem(`nexus_session_${kbId}`, newSessionId);

      await axios.put(`/sessions/${newSessionId}/knowledgebase`, {
        knowledgebase_id: kbId,
      });

      setSessionId(newSessionId);
      setMessages([]);
      toast.success("Chat history reset. Ready for clean prompt stream.");
    } catch {
      toast.error("Failed to reset history session.");
    }
  };

  const submit = async (messageText?: string) => {
    const text = messageText ?? query;
    if (!text.trim() || isStreaming) return;

    const { topK, model: llmModel } = getChatParams();

    setQuery("");
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
        timestamp: new Date(),
        loading: false,
      },
      {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        loading: true,
        citations: [],
        chunks: [],
      },
    ]);
    setTimeout(() => scrollToBottom(), 80);

    try {
      setIsStreaming(true);
      await streamChat(
        "/chat",
        {
          question: text,
          session_id: sessionId,
          knowledgebase_id: kbId,
          top_k: topK,
          model:
            llmModel === "gpt-4-turbo-preview" ? "gpt-4o" : (llmModel as any),
        },
        (chunk: string) => {
          flushSync(() => {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === "assistant") {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + chunk },
                ];
              }
              return prev;
            });
          });
          scrollToBottom("auto");
        },
        (meta) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.role !== "assistant") return prev;

            return [
              ...prev.slice(0, -1),
              {
                ...last,
                citations: meta.citations ?? last.citations ?? [],
                chunks: meta.chunks ?? last.chunks ?? [],
              },
            ];
          });
        },
      );
      setIsStreaming(false);

      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 && msg.role === "assistant"
            ? { ...msg, loading: false }
            : msg,
        ),
      );
    } catch (err: any) {
      console.error("Chat runtime stream failed", err);
      const errorMessage =
        err?.data?.detail ||
        err?.data?.message ||
        "LLM completion interrupted. Please retry.";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: `⚠️ Error: ${errorMessage}`,
          timestamp: new Date(),
          loading: false,
          citations: [],
          chunks: [],
        },
      ]);
    } finally {
      setIsStreaming(false);
      setTimeout(() => scrollToBottom(), 80);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return {
    sessionId,
    query,
    setQuery,
    messages,
    setMessages,
    isStreaming,
    isHistoryLoading,
    setIsHistoryLoading,
    scrollRef,
    scrollToBottom,
    resetHistory,
    submit,
    handleKeyPress,
  };
}
