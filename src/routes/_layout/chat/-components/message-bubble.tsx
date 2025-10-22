import { CopyMessage } from "@/components/custom/copy-message";
import MarkdownRenderer from "@/components/custom/markdown";
import { cn } from "@/lib/utils";
import React from "react";

export const MessageBubble: React.FC<{
  msg: {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    loading: boolean;
  };
}> = ({ msg }) => {
  return (
    <div
      className={cn(
        "max-w-1/2 rounded-lg h-fit",
        msg.role === "user" ? "place-self-end" : "place-self-start",
      )}
    >
      <div
        className={cn(
          "w-full",
          msg.role === "user"
            ? "bg-secondary px-2 py-1 rounded-lg text-right"
            : "place-self-start",
        )}
      >
        {msg.loading ? (
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        ) : (
          <>
            <MarkdownRenderer>{msg.content}</MarkdownRenderer>

            <p className="text-muted-foreground text-xxs">
              {new Intl.DateTimeFormat("en-US", {
                hour12: true,
                timeStyle: "short",
              }).format(msg.timestamp)}
            </p>
          </>
        )}
      </div>
      {!msg.loading && (
        <div
          className={cn(
            msg.role === "user" ? "place-self-end" : "place-self-start",
          )}
        >
          <CopyMessage content={msg.content} />
        </div>
      )}
    </div>
  );
};
