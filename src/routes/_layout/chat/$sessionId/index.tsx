import { KnowledgeBaseDropdown } from "@/components/knowledge-base-dropdown";
import axios from "@/lib/axios";
import { useStream } from "@/lib/stream";
import { Model, SessionResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { AxiosResponse } from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FileAttachment } from "..";
import { ChatInput } from "../-components/chat-input";
import { ChatSkeletonLoader } from "../-components/chat-skeleton-loader";
import { MessageBubble } from "../-components/message-bubble";

export const Route = createFileRoute("/_layout/chat/$sessionId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { sessionId } = Route.useParams();
  const stateQuery = location.state?.query;

  const scrollRef = useRef<HTMLDivElement>(null);
  const initialQuerySubmittedRef = useRef<string | null>(null);

  const [query, setQuery] = useState<string>("");
  const [model, setModel] = useState<Model>("gpt-4o-mini");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
      loading: boolean;
    }>
  >([]);

  const { refetch: fetchDocs } = useQuery({
    queryKey: ["list-docs"],
    queryFn: async () => axios.get(`list-docs/${sessionId}`),
    select: (res: AxiosResponse) => res.data,
    enabled: false,
    retry: false,
  });

  const { data: sessions = [] } = useQuery<any, any, SessionResponse[]>({
    queryKey: ["list-sessions"],
    queryFn: () => axios.get("list-sessions"),
    select: (res: AxiosResponse) => res.data,
  });

  const currentSession = sessions.find((s) => s.session_id === sessionId);

  const { refetch: fetchChatHistory, isFetching: isFetchingChatHistory } =
    useQuery({
      queryKey: ["chat-history"],
      queryFn: async () => axios.get(`chat-history/${sessionId}`),
      select: (res: AxiosResponse) => res.data,
      enabled: false,
    });

  const { stream: streamChat } = useStream();

  const [isStreaming, setIsStreaming] = useState(false);

  const refetchDocs = async () => {
    try {
      const res = await fetchDocs();
      setAttachments(res.data);
    } catch (error) {
      console.error("Error fetching docs => ", error);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") =>
    scrollRef.current?.scrollIntoView({
      behavior,
    });

  const onSubmit = async (message?: string) => {
    if (isStreaming) return;
    const content = message ?? query;
    setQuery("");
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content,
        timestamp: new Date(),
        loading: false,
      },
      {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        loading: true,
      },
    ]);
    setTimeout(scrollToBottom, 100);

    try {
      setIsStreaming(true);
      await streamChat(
        "/chat",
        {
          question: content,
          session_id: sessionId,
          model: "gpt-4o-mini",
        },
        (chunk: string) => {
          flushSync(() => {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
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
      );
      setIsStreaming(false);
      window.history.replaceState({}, "", window.location.pathname);
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 && msg.role === "assistant"
            ? { ...msg, loading: false }
            : msg,
        ),
      );
    } catch (error: any) {
      console.error("Error asking question => ", error);

      // Attempt to refetch chat history in case backend saved answer before returning 500
      try {
        const historyRes = await fetchChatHistory();
        if (
          historyRes?.data &&
          Array.isArray(historyRes.data) &&
          historyRes.data.length > 0
        ) {
          const lastMsg = historyRes.data[historyRes.data.length - 1];
          if (lastMsg?.role === "assistant" && lastMsg?.content) {
            setMessages(historyRes.data);
            return;
          }
        }
      } catch (historyErr) {
        console.error("Error refetching chat history => ", historyErr);
      }

      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        "The LLM service is currently down or unavailable. Please try again later.";
      setMessages((prev) => [
        ...prev.slice(0, prev.length - 1),
        {
          role: "assistant",
          content: `⚠️ ${errorMessage}`,
          timestamp: new Date(),
          loading: false,
        },
      ]);
    } finally {
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([refetchDocs(), fetchChatHistory().catch(() => null)])
      .then(([_, chatHistoryRes]) => {
        if (cancelled) return;
        if (chatHistoryRes?.data) setMessages(chatHistoryRes.data);
        setTimeout(
          () =>
            scrollRef.current?.scrollIntoView({
              behavior: "smooth",
            }),
          100,
        );
      })
      .then(() => {
        if (cancelled) return;
        if (
          stateQuery?.length > 0 &&
          initialQuerySubmittedRef.current !== sessionId
        ) {
          initialQuerySubmittedRef.current = sessionId;
          onSubmit(stateQuery).then(() =>
            queryClient.invalidateQueries({
              queryKey: ["list-sessions"],
            }),
          );
        }
      });

    return () => {
      cancelled = true;
      window.history.replaceState({}, "", window.location.pathname);
    };
  }, [fetchDocs, fetchChatHistory, sessionId, stateQuery]);

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-2/3">
        <div className="flex justify-end pt-4 px-2">
          <KnowledgeBaseDropdown
            sessionId={sessionId}
            currentKnowledgeBaseId={currentSession?.knowledgebase_id}
          />
        </div>
        <div
          className={cn(
            "pt-16 overflow-y-scroll no-scrollbar flex flex-col gap-2",
            attachments?.length > 0
              ? "h-[calc(100%-10rem)] py-4"
              : "h-[calc(100%-8rem)]",
          )}
        >
          {isFetchingChatHistory ? (
            <ChatSkeletonLoader />
          ) : (
            messages.map((msg) => <MessageBubble msg={msg} />)
          )}
          <div ref={scrollRef} />
          {isStreaming && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <ChatInput
          session_id={sessionId}
          query={query}
          setQuery={setQuery}
          model={model}
          setModel={setModel}
          loading={isStreaming}
          onSubmit={onSubmit}
          attachments={attachments}
          setAttachments={setAttachments}
          onUpload={refetchDocs}
          className="absolute bottom-4 w-2/3"
        />
      </div>
    </div>
  );
}
