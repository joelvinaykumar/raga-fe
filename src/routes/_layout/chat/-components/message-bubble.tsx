import { CopyMessage } from "@/components/custom/copy-message";
import MarkdownRenderer from "@/components/custom/markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CitationMeta, SourceChunkMeta } from "@/lib/stream";
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const MessageBubble: React.FC<{
  msg: {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    loading: boolean;
    citations?: CitationMeta[];
    chunks?: SourceChunkMeta[];
  };
  bubbleIndex?: number;
}> = ({ msg, bubbleIndex = 0 }) => {
  const staggerDelay = Math.min(bubbleIndex * 0.05, 0.35);
  const [openSection, setOpenSection] = React.useState<
    "citations" | "sources" | null
  >(null);
  const [openCitationItem, setOpenCitationItem] = React.useState<string | null>(
    null,
  );
  const [openSourceItem, setOpenSourceItem] = React.useState<string | null>(
    null,
  );
  const citations = (msg.citations ?? []).filter(
    (citation) => typeof citation.index === "number",
  );
  const sourceChunks = msg.chunks ?? [];

  // Insert citation markers inline at each citation's character position so the
  // reference (e.g. `[1]`) renders right where the grounded text ends, instead
  // of in a separate list after the message.
  const contentWithCitations = React.useMemo(() => {
    if (msg.role !== "assistant" || msg.loading || citations.length === 0) {
      return msg.content;
    }
    let text = msg.content;
    const ordered = [...citations].sort(
      (a, b) => (b.display_char ?? 0) - (a.display_char ?? 0),
    );
    for (const citation of ordered) {
      const rawPos = citation.display_char ?? citation.end_char ?? text.length;
      const pos = Math.min(Math.max(rawPos, 0), text.length);
      const preview = String(citation.quote ?? citation.filename ?? "")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const marker = `<sup class="citation-ref" data-citation-index="${citation.index}" data-preview="${preview}">[${citation.index}]</sup>`;
      text = `${text.slice(0, pos)}${marker}${text.slice(pos)}`;
    }
    return text;
  }, [msg.content, msg.role, msg.loading, citations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay: staggerDelay,
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
              <MarkdownRenderer>{contentWithCitations}</MarkdownRenderer>
            </div>

            {msg.role === "assistant" &&
              citations.length > 0 &&
              !msg.loading && (
                <div className="mt-2 rounded-lg border border-border/70 bg-background/35 px-2.5 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSection((current) =>
                        current === "citations" ? null : "citations",
                      )
                    }
                    className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    <span>Citations ({citations.length})</span>
                    <ChevronDown
                      className={cn(
                        "size-3 transition-transform",
                        openSection === "citations" && "rotate-180",
                      )}
                    />
                  </button>
                  {openSection === "citations" && (
                    <div className="mt-2 space-y-2">
                      {citations.map((citation) => {
                        const citationKey = `${citation.index}-${citation.display_char}`;
                        const citationOpen = openCitationItem === citationKey;
                        return (
                          <div
                            key={citationKey}
                            className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenCitationItem((current) =>
                                  current === citationKey ? null : citationKey,
                                )
                              }
                              className="flex w-full items-center gap-2 py-0.5"
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-primary/45 bg-primary/10 text-[10px] font-mono font-semibold text-primary"
                                    aria-label={`Citation ${citation.index}`}
                                  >
                                    {citation.index}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="w-72 border-border bg-popover text-popover-foreground"
                                >
                                  <div className="space-y-1.5 text-xs">
                                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                      Source {citation.index} · char{" "}
                                      {citation.display_char}
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {citation.filename ||
                                        citation.chunk_id ||
                                        "Indexed source"}
                                    </p>
                                    {citation.quote ? (
                                      <p className="text-muted-foreground line-clamp-3">
                                        {citation.quote}
                                      </p>
                                    ) : null}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              <span className="truncate text-[11px] font-semibold text-foreground">
                                {citation.filename ||
                                  citation.chunk_id ||
                                  "Indexed source"}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "ml-auto size-3 text-muted-foreground transition-transform",
                                  citationOpen && "rotate-180",
                                )}
                              />
                            </button>
                            {citationOpen && (
                              <div className="pb-0.5 pt-1">
                                {citation.quote ? (
                                  <p className="line-clamp-3 text-[11px] text-muted-foreground">
                                    {citation.quote}
                                  </p>
                                ) : null}
                                {citation.url ? (
                                  <a
                                    href={citation.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block font-mono text-[10px] text-primary underline underline-offset-2"
                                  >
                                    Open source preview
                                  </a>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {msg.role === "assistant" &&
              sourceChunks.length > 0 &&
              !msg.loading && (
                <div className="mt-2 rounded-lg border border-border/70 bg-background/35 px-2.5 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSection((current) =>
                        current === "sources" ? null : "sources",
                      )
                    }
                    className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    <span>Sources ({sourceChunks.length})</span>
                    <ChevronDown
                      className={cn(
                        "size-3 transition-transform",
                        openSection === "sources" && "rotate-180",
                      )}
                    />
                  </button>
                  {openSection === "sources" && (
                    <div className="mt-2 space-y-2">
                      {sourceChunks.map((chunk, idx) => {
                        const badgeNumber = chunk.index ?? idx + 1;
                        const sourceKey = `${chunk.chunk_id ?? "chunk"}-${idx}`;
                        const sourceOpen = openSourceItem === sourceKey;
                        return (
                          <div
                            key={sourceKey}
                            className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenSourceItem((current) =>
                                  current === sourceKey ? null : sourceKey,
                                )
                              }
                              className="mb-0.5 flex w-full items-center gap-2 py-0.5"
                            >
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-primary/45 bg-primary/10 text-[10px] font-mono font-semibold text-primary">
                                {badgeNumber}
                              </span>
                              <span className="truncate text-[11px] font-semibold text-foreground">
                                {chunk.filename || chunk.chunk_id || "Chunk"}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "ml-auto size-3 text-muted-foreground transition-transform",
                                  sourceOpen && "rotate-180",
                                )}
                              />
                            </button>
                            {sourceOpen && (
                              <div className="pb-0.5 pt-1">
                                <p className="line-clamp-3 text-[11px] text-muted-foreground">
                                  {chunk.preview || chunk.content}
                                </p>
                                {chunk.url ? (
                                  <a
                                    href={chunk.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block font-mono text-[10px] text-primary underline underline-offset-2"
                                  >
                                    View chunk source
                                  </a>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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
