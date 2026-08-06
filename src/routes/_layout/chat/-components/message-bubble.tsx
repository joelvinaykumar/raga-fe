import { CopyMessage } from "@/components/custom/copy-message";
import MarkdownRenderer from "@/components/custom/markdown";
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const MessageBubble: React.FC<{
  msg: {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    loading: boolean;
  };
}> = ({ msg }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
      }}
      className={cn(
        "max-w-[80%] h-fit flex flex-col gap-1",
        msg.role === "user"
          ? "place-self-end items-end"
          : "place-self-start items-start",
      )}
    >
      <div
        className={cn(
          "w-full px-4 py-1 rounded-2xl transition-all text-sm leading-relaxed shadow-sm",
          msg.role === "user"
            ? "bg-[#340075] text-white border border-[#340075] font-sans"
            : "bg-secondary border border-[#ccc3d4] text-secondary-foreground font-sans",
        )}
      >
        {msg.loading && !msg.content ? (
          <div className="loading-dots flex gap-1 items-center py-1">
            <div className="dot w-2 h-2 rounded-full bg-[#340075] animate-bounce"></div>
            <div className="dot w-2 h-2 rounded-full bg-[#340075] animate-bounce [animation-delay:0.2s]"></div>
            <div className="dot w-2 h-2 rounded-full bg-[#340075] animate-bounce [animation-delay:0.4s]"></div>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              key="static"
              className={cn(
                msg.loading && "markdown-streaming",
                msg.role === "user" ? "prose-invert" : "",
              )}
            >
              <MarkdownRenderer>{msg.content}</MarkdownRenderer>
            </div>

            <p
              className={cn(
                "text-[10px] font-mono mt-2 tracking-wide",
                msg.role === "user"
                  ? "text-white/60 text-right"
                  : "text-[#4a4452]",
              )}
            >
              {new Intl.DateTimeFormat("en-US", {
                hour12: true,
                timeStyle: "short",
              }).format(msg.timestamp)}
            </p>
          </div>
        )}
      </div>
      {!msg.loading && (
        <div className="opacity-65 hover:opacity-100 transition-opacity">
          <CopyMessage content={msg.content} />
        </div>
      )}
    </motion.div>
  );
};
