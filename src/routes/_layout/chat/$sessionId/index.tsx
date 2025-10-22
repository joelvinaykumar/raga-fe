import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "../-components/message-bubble";
import { ChatInput } from "../-components/chat-input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import axios from "@/lib/axios";
import { FileAttachment } from "..";
import { ChatSkeletonLoader } from "../-components/chat-skeleton-loader";
import { Model } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_layout/chat/$sessionId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { sessionId } = Route.useParams();

  const scrollRef = useRef<HTMLDivElement>(null);

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

  const { refetch: fetchChatHistory, isFetching: isFetchingChatHistory } =
    useQuery({
      queryKey: ["chat-history"],
      queryFn: async () => axios.get(`chat-history/${sessionId}`),
      select: (res: AxiosResponse) => res.data,
      enabled: false,
    });

  const { mutateAsync: askQuestion, isPending: loadingAnswer } = useMutation({
    mutationKey: ["chat"],
    mutationFn: (query: string) =>
      axios.post("/chat", {
        question: query,
        session_id: sessionId,
        model: "gpt-4o-mini",
      }),
  });

  const refetchDocs = async () => {
    try {
      const res = await fetchDocs();
      setAttachments(res.data);
    } catch (error) {
      console.error("Error fetching docs => ", error);
    }
  };

  const scrollToBottom = () =>
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  const onSubmit = async (message?: string) => {
    const content = message ?? query;
    setTimeout(() => {
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
    }, 100);
    setTimeout(scrollToBottom, 100);
    const res = await askQuestion(content);
    setTimeout(scrollToBottom, 100);
    setQuery("");
    window.history.replaceState({}, "", window.location.pathname);
    setMessages((prev) => [
      ...prev.slice(0, prev.length - 1),
      {
        role: "assistant",
        content: res.data.answer,
        timestamp: new Date(),
        loading: false,
      },
    ]);
    setTimeout(scrollToBottom, 100);
    queryClient.invalidateQueries({ queryKey: ["list-sessions"] });
  };

  useEffect(() => {
    Promise.all([refetchDocs(), fetchChatHistory()]).then(
      ([_, chatHistoryRes]) => {
        setMessages(chatHistoryRes.data);
        setTimeout(
          () =>
            scrollRef.current?.scrollIntoView({
              behavior: "smooth",
            }),
          100,
        );
      },
    );
  }, [fetchDocs, fetchChatHistory, sessionId]);

  useEffect(() => {
    if (location.state?.query?.length > 0) {
      onSubmit(location.state?.query);
    }

    return () => {
      window.history.replaceState({}, "", window.location.pathname);
    };
  }, [location.state?.query]);

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-2/3">
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
        </div>
        <ChatInput
          session_id={sessionId}
          query={query}
          setQuery={setQuery}
          model={model}
          setModel={setModel}
          loading={loadingAnswer}
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
