import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { MessageBubble } from "../../../chat/-components/message-bubble";
import type { Message, PromptSuggestionCard } from "../-lib/types";

interface ChatMessagesProps {
  isHistoryLoading: boolean;
  messages: Message[];
  promptSuggestions: PromptSuggestionCard[];
  onSuggestionClick: (prompt: string) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function ChatMessages({
  isHistoryLoading,
  messages,
  promptSuggestions,
  onSuggestionClick,
  scrollRef,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar py-6 flex flex-col gap-4">
      {isHistoryLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : messages.length > 0 ? (
        messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} bubbleIndex={i} />
        ))
      ) : (
        <EmptyState
          promptSuggestions={promptSuggestions}
          onSuggestionClick={onSuggestionClick}
        />
      )}
      <div ref={scrollRef} />
    </div>
  );
}

function EmptyState({
  promptSuggestions,
  onSuggestionClick,
}: {
  promptSuggestions: PromptSuggestionCard[];
  onSuggestionClick: (prompt: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center px-4 py-8 self-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#340075]/10 dark:bg-[#6c40d6]/10 text-[#340075] dark:text-[#a580ff] border border-[#340075]/20"
      >
        <Sparkles className="size-6 animate-pulse" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="font-serif text-2xl font-bold text-foreground mb-2"
      >
        Knowledge Base Sandbox
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="font-sans text-sm text-muted-foreground/80 mb-8 leading-relaxed max-w-md"
      >
        Connect and query your indexed documents. Click on a dynamic prompt
        suggestion below to jumpstart your analysis stream.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {promptSuggestions.map((s, idx) => (
          <motion.button
            key={idx}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 20,
              delay: idx * 0.05 + 0.15,
            }}
            onClick={() => onSuggestionClick(s.prompt)}
            className="flex flex-col items-start text-left p-4 rounded-xl border border-[#ccc3d4]/30 dark:border-[#2d2a2e] bg-card hover:bg-[#fff8f5]/40 dark:hover:bg-[#121115]/40 hover:border-primary/40 dark:hover:border-[#6c40d6]/40 transition duration-200 group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-md bg-[#340075]/5 dark:bg-[#6c40d6]/5 text-primary group-hover:scale-110 transition-transform duration-200">
                <s.icon className="size-4 shrink-0" />
              </div>
              <span className="font-serif text-sm font-bold text-foreground leading-none">
                {s.title}
              </span>
            </div>
            <span className="font-sans text-[11px] text-[#4a4452] dark:text-[#9c95a6] leading-normal line-clamp-2">
              {s.desc}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
