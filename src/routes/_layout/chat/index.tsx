import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ChatInput } from "./-components/chat-input";
import { generateSessionId } from "@/lib/utils";
import { Model } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/_layout/chat/")({
  component: RouteComponent,
});

export type FileAttachment = {
  filename: string;
  id: number;
  filesize: number;
  upload_timestamp: string;
};

function RouteComponent() {
  const navigate = useNavigate();
  const { current_user } = useAuth();
  const [query, setQuery] = useState<string>("");
  const [model, setModel] = useState<Model>("gpt-4o-mini");

  const onSubmit = () => {
    const sessionId = generateSessionId();
    navigate({
      to: `/chat/$sessionId`,
      params: { sessionId },
      state: { query },
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-8 justify-center items-center bg-[#fff8f5] dark:bg-[#121115] p-8 border-l border-[#ccc3d4]/20 dark:border-[#2d2a2e]/20">
      <div className="text-center space-y-3 max-w-2xl">
        <div className="text-xs font-mono text-[#4a4452] dark:text-[#9c95a6] uppercase tracking-widest">
          NexusRAG Editorial System
        </div>
        <h1 className="text-5xl font-serif font-bold text-[#1e1b19] dark:text-[#f4ece8] tracking-tight leading-tight">
          Hey {current_user?.user_metadata?.full_name || "there"} 👋 What’s on
          your mind today?
        </h1>
        <p className="text-sm text-[#4a4452] dark:text-[#9c95a6] font-sans">
          Initiate a clean editorial context. Connect documents or prompt the
          model to review content.
        </p>
      </div>
      <ChatInput
        query={query}
        setQuery={setQuery}
        model={model}
        setModel={setModel}
        onSubmit={onSubmit}
        className="w-[min(960px,80%)]"
      />
    </div>
  );
}
