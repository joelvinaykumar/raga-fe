import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ChatInput } from "./-components/chat-input";
import { generateSessionId } from "@/lib/utils";
import { Model } from "@/lib/types";

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
    <div className="w-full h-full flex flex-col gap-8 justify-center items-center">
      <h1 className="text-4xl font-serif">
        Hey Elliot 👋 What’s on your mind today?
      </h1>
      <ChatInput
        query={query}
        setQuery={setQuery}
        model={model}
        setModel={setModel}
        onSubmit={onSubmit}
        className="w-2/3"
      />
    </div>
  );
}
