import { DropzoneArea } from "@/components/DropzoneArea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "@/lib/axios";
import { env } from "@/lib/env";
import { humanReadableSize } from "@/lib/utils";
import { useHomeStore } from "@/store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  X,
  History,
  MoreVertical,
  Loader2,
  Sliders,
  FolderOpen,
  Send,
  Sparkles,
  Lightbulb,
  Terminal,
  ShieldCheck,
  Blocks,
  Check,
  Copy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  useStream,
  type CitationMeta,
  type SourceChunkMeta,
} from "@/lib/stream";
import { MessageBubble } from "../../chat/-components/message-bubble";
import { flushSync } from "react-dom";
import { EditKnowledgeBaseDialog } from "./-components/EditKnowledgeBaseDialog";
import { DeleteKnowledgeBaseAlertDialog } from "./-components/DeleteKnowledgeBaseAlertDialog";
import { DeleteFileAlertDialog } from "./-components/DeleteFileAlertDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import MarkdownRenderer from "@/components/custom/markdown";

// Route: /_layout/knowledge-base/$kbId
export const Route = createFileRoute("/_layout/knowledge-base/$kbId/")({
  component: KnowledgeBaseDetail,
});

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  loading: boolean;
  citations?: CitationMeta[];
  chunks?: SourceChunkMeta[];
};

type RagDocument = {
  id: number;
  rag_id: string;
  filename: string;
  filesize: number;
  upload_timestamp: string;
};

type PromptSuggestionCard = {
  title: string;
  desc: string;
  prompt: string;
  icon: typeof Sparkles;
};

const FALLBACK_PROMPTS = [
  "Summarize the most relevant context for my question before answering.",
  "List key facts from the indexed knowledge and include sources for each.",
  "Give me a step-by-step plan using only the indexed context.",
  "Compare two approaches and recommend one based on available context.",
];

const SUGGESTION_ICONS = [
  Sparkles,
  Terminal,
  Lightbulb,
  ShieldCheck,
  FolderOpen,
] as const;

const SUGGESTION_TITLES = [
  "Quick Summary",
  "Key Facts",
  "Action Plan",
  "Compare Options",
  "Gap Finder",
] as const;

const SUGGESTION_DESCRIPTIONS = [
  "Generate a concise high-signal summary from your RAG context.",
  "Pull the most important facts with grounded context focus.",
  "Produce practical steps you can execute immediately.",
  "Evaluate alternatives and return a recommendation.",
  "Surface missing details, assumptions, and follow-up checks.",
] as const;

const toSuggestionCards = (prompts: string[]): PromptSuggestionCard[] =>
  prompts.slice(0, 5).map((prompt, index) => ({
    title: SUGGESTION_TITLES[index] ?? `Prompt ${index + 1}`,
    desc:
      SUGGESTION_DESCRIPTIONS[index] ??
      "Tap to run this suggestion against your indexed documents.",
    prompt,
    icon: SUGGESTION_ICONS[index % SUGGESTION_ICONS.length],
  }));

const isValidRagId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

function KnowledgeBaseDetail() {
  const { kbId } = Route.useParams();
  const navigate = useNavigate();

  // Active chat session state
  const [sessionId, setSessionId] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryLoading, setIsFetchingHistory] = useState(false);

  // RAG Information & Configuration States
  const [loadingData, setLoadingData] = useState(true);
  const [ragInfo, setRagInfo] = useState<{
    name: string;
    description?: string;
    top_k: number;
    chunk_size: number;
    embedding_model: string;
  } | null>(null);

  // Editable Client Configurations (Synced to localStorage or local state)
  const [llmModel, setLlmModel] = useState<string>("gpt-4o-mini");
  const [topK, setTopK] = useState<number>(8);
  const [embeddingModel, setEmbeddingModel] = useState<string>(
    "text-embedding-3-large",
  );
  const [savingConfig, setSavingConfig] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [isUpdatingKnowledgebase, setIsUpdatingKnowledgebase] = useState(false);
  const [isDeletingKnowledgebase, setIsDeletingKnowledgebase] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<
    PromptSuggestionCard[]
  >(toSuggestionCards(FALLBACK_PROMPTS));

  // RAG Core Documents list
  const [files, setFiles] = useState<RagDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  // Workspace File Deletion States
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<RagDocument | null>(null);
  const [isFileDeleteDialogOpen, setIsFileDeleteDialogOpen] = useState(false);

  // MCP Connection Dialog States
  const apiKey = useHomeStore((state) => state.api_key);
  const [isMcpDialogOpen, setIsMcpDialogOpen] = useState(false);
  const [mcpCopiedField, setMcpCopiedField] = useState<
    "key" | "url" | "config" | "inst" | null
  >(null);

  const mcpUrl = `${env.VITE_BASE_URL.replace(/\/$/, "")}/mcp`;

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        raga: {
          type: "sse",
          url: mcpUrl,
          headers: { "x-api-key": apiKey ?? "<your-api-key>" },
        },
      },
    },
    null,
    2,
  );

  const mcpConfigMarkdown = ["```json", mcpConfig, "```"].join("\n");

  const mcpInstructionMarkdown = [
    "To restrict Claude to this specific knowledge base, add this to your system prompt or custom instructions:",
    "```markdown",
    `Always query my workspace through the "raga" MCP server with:`,
    `- knowledgebase_id: "${kbId}"`,
    "```",
  ].join("\n");

  const mcpmcpCopyValue = async (
    value: string,
    field: "key" | "url" | "config" | "inst",
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setMcpCopiedField(field);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setMcpCopiedField(null), 2000);
    } catch {
      toast.error(`Could not copy ${label}`);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const { stream: streamChat } = useStream();

  // Initialize or fetch persistent session ID per RAG workspace
  useEffect(() => {
    let activeSessionId = localStorage.getItem(`nexus_session_${kbId}`);
    if (!activeSessionId) {
      activeSessionId = `session_${kbId}_${crypto.randomUUID().slice(0, 8)}`;
      localStorage.setItem(`nexus_session_${kbId}`, activeSessionId);
    }
    setSessionId(activeSessionId);
  }, [kbId]);

  // Load workspace properties for this knowledgebase.
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const loadWorkspace = async () => {
      setIsFetchingHistory(true);
      try {
        if (cancelled) return;

        // Fetch properties in parallel
        setIsFilesLoading(true);
        const [ragRes, filesRes, historyRes] = await Promise.all([
          axios.get(`/rag/${kbId}`),
          axios.get(`/rag/${kbId}/documents`),
          axios.get(`chat-history/${sessionId}`),
        ]);

        if (cancelled) return;

        setRagInfo(ragRes.data);
        setFiles(filesRes.data);

        // Setup initial configurations matching loaded RAG metadata if not customized locally
        const cachedModel = localStorage.getItem(`nexus_model_${kbId}`);
        const cachedTopK = localStorage.getItem(`nexus_topk_${kbId}`);
        const cachedEmb = localStorage.getItem(`nexus_emb_${kbId}`);

        setLlmModel(cachedModel || "gpt-4o-mini");
        setTopK(cachedTopK ? Number(cachedTopK) : ragRes.data.top_k || 8);
        setEmbeddingModel(
          cachedEmb || ragRes.data.embedding_model || "text-embedding-3-large",
        );

        if (historyRes.data) {
          setMessages(
            historyRes.data.map((msg: any) => ({
              role: msg.role || "user",
              content: msg.content || "",
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              loading: false,
              citations: Array.isArray(msg.citations) ? msg.citations : [],
              chunks: Array.isArray(msg.chunks) ? msg.chunks : [],
            })),
          );
        }

        const hasChatHistory =
          Array.isArray(historyRes.data) && historyRes.data.length > 0;
        const hasValidRagId = isValidRagId(kbId);

        if (!hasChatHistory && hasValidRagId) {
          try {
            const promptsRes = await axios.get(
              `/rag/${kbId}/prompts/suggestions`,
            );
            const prompts = Array.isArray(promptsRes?.data?.prompts)
              ? promptsRes.data.prompts.filter(
                  (prompt: unknown): prompt is string =>
                    typeof prompt === "string" && prompt.trim().length > 0,
                )
              : [];

            if (prompts.length > 0) {
              setPromptSuggestions(toSuggestionCards(prompts));
            } else {
              setPromptSuggestions(toSuggestionCards(FALLBACK_PROMPTS));
            }
          } catch {
            setPromptSuggestions(toSuggestionCards(FALLBACK_PROMPTS));
          }
        } else if (!hasValidRagId) {
          setPromptSuggestions(toSuggestionCards(FALLBACK_PROMPTS));
        }
      } finally {
        if (!cancelled) {
          setIsFetchingHistory(false);
          setIsFilesLoading(false);
          setLoadingData(false);
          setTimeout(
            () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
            100,
          );
        }
      }
    };

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [kbId, sessionId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  // Reset Chat Session / History Action
  const handleResetHistory = async () => {
    if (isStreaming) return;
    try {
      const newSessionId = `session_${kbId}_${crypto.randomUUID().slice(0, 8)}`;
      localStorage.setItem(`nexus_session_${kbId}`, newSessionId);

      // Bind new session
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

  // Document management actions using RAG-specific endpoints
  const handleUploadFiles = async (selected: File[]) => {
    if (files.length + selected.length > 5) {
      toast.error("Maximum 5 files allowed per knowledge base.");
      return;
    }
    setIsUploading(true);
    for (const file of selected) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 20MB limit.`);
        continue;
      }
      const formData = new FormData();
      formData.append("files", file);

      try {
        await axios.post(`/rag/${kbId}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(`Indexed successfully: ${file.name}`);
      } catch {
        toast.error(`Indexed failed: ${file.name}`);
      }
    }
    // Refresh RAG files list
    try {
      setIsFilesLoading(true);
      const filesRes = await axios.get(`/rag/${kbId}/documents`);
      setFiles(filesRes.data);
    } catch {
      toast.error("Failed to refresh index repository list.");
    } finally {
      setIsFilesLoading(false);
      setIsUploading(false);
    }
  };

  const triggerDeleteFileConfirm = (file: RagDocument) => {
    setFileToDelete(file);
    setIsFileDeleteDialogOpen(true);
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    try {
      await axios.delete(`/rag/${kbId}/documents/${fileToDelete.id}`);
      toast.success("Indexed chunk removed successfully");
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setIsFileDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete selected context document chunk");
    } finally {
      setIsDeletingFile(false);
      setFileToDelete(null);
    }
  };

  // Save RAG Metadata / Client Configurations
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      // Save client model & Top-K configs locally
      localStorage.setItem(`nexus_model_${kbId}`, llmModel);
      localStorage.setItem(`nexus_topk_${kbId}`, String(topK));
      localStorage.setItem(`nexus_emb_${kbId}`, embeddingModel);

      // Perform RAG patch for TopK/embedding changes if supported (or keep local override safely)
      if (ragInfo) {
        await axios.patch(`/rag/${kbId}`, {
          name: ragInfo.name,
          description: ragInfo.description,
        });
      }
      toast.success("Configurations saved successfully.");
    } catch {
      toast.error("Failed to save some configurations.");
    } finally {
      setSavingConfig(false);
    }
  };

  // Chat Submission handler binding dynamically to configured models
  const handleChatSubmit = async (messageText?: string) => {
    const text = messageText ?? query;
    if (!text.trim() || isStreaming) return;

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
      handleChatSubmit();
    }
  };

  const openEditDialog = () => {
    setEditingName(ragInfo?.name ?? "");
    setEditingDescription(ragInfo?.description ?? "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateKnowledgebase = async () => {
    const trimmedName = editingName.trim();

    if (!trimmedName) {
      toast.error("Knowledge base name is required.");
      return;
    }

    setIsUpdatingKnowledgebase(true);
    try {
      await axios.patch(`/rag/${kbId}`, {
        name: trimmedName,
        description: editingDescription.trim() || undefined,
      });

      setRagInfo((prev) =>
        prev
          ? {
              ...prev,
              name: trimmedName,
              description: editingDescription.trim() || undefined,
            }
          : prev,
      );

      toast.success("Knowledge base updated successfully.");
      setIsEditDialogOpen(false);
    } catch {
      toast.error("Failed to update knowledge base.");
    } finally {
      setIsUpdatingKnowledgebase(false);
    }
  };

  const handleDeleteKnowledgebase = async () => {
    setIsDeletingKnowledgebase(true);
    try {
      await axios.delete(`/rag/${kbId}`);
      toast.success("Knowledge base deleted successfully.");
      setIsDeleteDialogOpen(false);
      navigate({ to: "/knowledge-base" });
    } catch {
      toast.error("Failed to delete knowledge base.");
    } finally {
      setIsDeletingKnowledgebase(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-full w-full flex-col gap-6 p-10 bg-background">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-4">
          <Skeleton className="lg:col-span-3 h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden text-foreground">
      {/* Center workspace containing Name, Description, Chat stream and Pill Input */}
      <section className="flex flex-1 flex-col h-full overflow-hidden border-r border-border px-6 py-6 lg:px-10">
        {/* Workspace Upper Bar */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="space-y-1 max-w-2xl min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl font-bold leading-none text-foreground truncate">
                {ragInfo?.name}
              </h1>
            </div>
            {ragInfo?.description && (
              <p className="font-sans text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {ragInfo.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Tooltipped Reset History Icon Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isStreaming}
                  onClick={handleResetHistory}
                  className="h-8 w-8 border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm rounded-lg"
                >
                  <History className="size-4" />
                  <span className="sr-only">Reset History</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset chat history</p>
              </TooltipContent>
            </Tooltip>

            {/* Copy MCP Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMcpDialogOpen(true)}
              className="h-8 gap-1.5 border-[#ccc3d4] dark:border-[#4a4452] bg-white dark:bg-[#16141a] text-xs font-semibold text-foreground hover:bg-accent hover:text-[#340075] dark:hover:text-[#9c7beb] shadow-sm rounded-lg"
            >
              <Blocks className="size-3.5 text-[#340075] dark:text-[#9c7beb]" />
              Copy MCP
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 border-border bg-popover text-popover-foreground"
              >
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openEditDialog();
                  }}
                  className="cursor-pointer"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setIsDeleteDialogOpen(true);
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chat message flow */}
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
                Connect and query your indexed documents. Click on a dynamic
                prompt suggestion below to jumpstart your analysis stream.
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
                    onClick={() => handleChatSubmit(s.prompt)}
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
          )}
          <div ref={scrollRef} />
        </div>

        {/* Form Pill chat input */}
        <div className="pt-2 border-t border-border/60">
          <div className="relative flex items-center bg-card border border-input rounded-full px-4 py-2 hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm transition">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your documents..."
              className="flex-1 bg-transparent border-none outline-none ring-0 placeholder:text-muted-foreground text-sm text-foreground font-sans px-3"
            />
            <button
              type="button"
              onClick={() => handleChatSubmit()}
              disabled={!query.trim() || isStreaming}
              className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="size-3.5" />
            </button>
          </div>
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-2.5">
            AI can make mistakes. Verify technical configurations.
          </p>
        </div>
      </section>

      {/* Right Column Sidebar Panel for RAG Custom Configuration */}
      <aside className="w-80 h-full overflow-y-auto no-scrollbar border-l border-border bg-card px-5 py-6 flex flex-col gap-6 text-foreground">
        {/* Config Header and save CTA */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-foreground">
            <Sliders className="size-4 text-primary" />
            <h3 className="font-serif text-lg font-bold leading-none">
              Configuration
            </h3>
          </div>
          <Button
            size="sm"
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="bg-primary text-primary-foreground font-sans text-xs px-3 h-7 rounded-lg shadow-sm font-semibold border border-primary hover:bg-primary/95 hover:-translate-y-0.5 transition"
          >
            {savingConfig ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Config inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">
              LLM Model
            </label>
            <Select value={llmModel} onValueChange={setLlmModel}>
              <SelectTrigger className="h-10 rounded-lg border-input bg-background font-mono text-xs text-foreground focus:ring-primary">
                <SelectValue placeholder="Select LLM model" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                <SelectItem value="gpt-4-turbo-preview">
                  gpt-4-turbo-preview
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">
                Top-K Results
              </label>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-muted border border-input rounded-md text-muted-foreground">
                {topK}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="font-mono text-[10px] text-muted-foreground">
                1
              </span>
              <input
                type="range"
                min="1"
                max="20"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                20
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">
              Embedding Model
            </label>
            <Select value={embeddingModel} onValueChange={setEmbeddingModel}>
              <SelectTrigger className="h-10 rounded-lg border-input bg-background font-mono text-xs text-foreground focus:ring-primary">
                <SelectValue placeholder="Select Embedding model" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="text-embedding-3-large">
                  text-embedding-3-large
                </SelectItem>
                <SelectItem value="text-embedding-ada-002">
                  text-embedding-ada-002
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t border-border my-2" />

        {/* Context Files upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground border-b border-border pb-2">
            <FolderOpen className="size-4 text-primary" />
            <h3 className="font-serif text-base font-bold">Context Files</h3>
          </div>

          {/* Drap files dropzone */}
          <div className="w-full">
            <DropzoneArea
              onFilesAdded={handleUploadFiles}
              disabled={isUploading}
              maxFiles={5}
              maxSize={20 * 1024 * 1024}
            />
          </div>

          {/* Uploaded Files list */}
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto no-scrollbar">
            {isFilesLoading && files.length === 0 ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 border border-border/40 p-3 rounded-lg bg-background/30"
                    style={{ opacity: 1 - i * 0.25 }}
                  >
                    <Loader2 className="size-4 animate-spin text-primary flex-shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <Skeleton className="h-3 w-3/4 rounded bg-[#e7e5e4] dark:bg-[#2d2a2e]" />
                      <Skeleton className="h-2 w-1/4 rounded bg-[#e7e5e4] dark:bg-[#2d2a2e]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {isUploading && (
                  <div className="flex items-center gap-2 border border-primary/45 border-dashed p-3 rounded-lg bg-primary/5 animate-pulse">
                    <Loader2 className="size-4 text-primary animate-spin flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-mono text-xs font-semibold text-primary truncate">
                        Uploading & indexing...
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
                        Writing to secure vectorstore
                      </span>
                    </div>
                  </div>
                )}
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between border border-border p-3 rounded-lg bg-background/60 hover:bg-background transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="size-4 text-primary flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-mono text-xs font-semibold text-foreground truncate">
                          {file.filename}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
                          {humanReadableSize(file.filesize)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerDeleteFileConfirm(file)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-red-50 dark:hover:bg-[#ba1a1a]/10 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {files.length === 0 && !isUploading && (
                  <p className="text-center font-mono text-[10px] text-muted-foreground py-4">
                    No indexed files in context
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      <EditKnowledgeBaseDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        name={editingName}
        description={editingDescription}
        onNameChange={setEditingName}
        onDescriptionChange={setEditingDescription}
        onSave={handleUpdateKnowledgebase}
        isSaving={isUpdatingKnowledgebase}
      />

      <DeleteKnowledgeBaseAlertDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        kbName={ragInfo?.name ?? ""}
        onConfirm={handleDeleteKnowledgebase}
        isDeleting={isDeletingKnowledgebase}
      />

      <DeleteFileAlertDialog
        isOpen={isFileDeleteDialogOpen}
        onOpenChange={setIsFileDeleteDialogOpen}
        fileName={fileToDelete?.filename ?? ""}
        onConfirm={handleConfirmDeleteFile}
        isDeleting={isDeletingFile}
      />

      <Dialog open={isMcpDialogOpen} onOpenChange={setIsMcpDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl font-bold">
              <Blocks className="size-6 text-[#340075] dark:text-[#9c7beb]" />
              Connect to Claude Desktop via MCP
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-[#4a4452] dark:text-[#9c95a6]">
              Add this RAG as an active capability in your local Claude Desktop
              app. Once loaded, Claude can query your exact knowledge base
              on-demand.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 font-sans text-sm text-foreground">
            {/* Step 1: Tell about config file location */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-foreground">
                1. Open Claude Desktop Config
              </h4>
              <p className="text-[#4a4452] dark:text-[#9c95a6] leading-relaxed">
                Open your Claude Desktop configuration file. It is located at:
              </p>
              <div className="rounded-lg border border-border bg-background p-3 font-mono text-xs space-y-1.5 text-foreground">
                <div className="flex items-center justify-between">
                  <span className="text-[#4a4452] dark:text-[#9c95a6]">
                    macOS:
                  </span>
                  <code className="text-primary font-semibold select-all">
                    ~/Library/Application
                    Support/Claude/claude_desktop_config.json
                  </code>
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
                  <span className="text-[#4a4452] dark:text-[#9c95a6]">
                    Windows:
                  </span>
                  <code className="text-primary font-semibold select-all">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </code>
                </div>
              </div>
            </div>

            {/* Step 2: Config snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-foreground">
                  2. Add this MCP Server Config
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    mcpmcpCopyValue(mcpConfig, "config", "MCP config")
                  }
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#340075] dark:text-[#9c7beb] hover:underline"
                >
                  {mcpCopiedField === "config" ? (
                    <>
                      <Check className="size-3" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> Copy Config
                    </>
                  )}
                </button>
              </div>
              <p className="text-[#4a4452] dark:text-[#9c95a6] leading-relaxed">
                Add the following entry inside the{" "}
                <code className="font-mono bg-accent px-1 py-0.5 rounded text-xs text-foreground">
                  "mcpServers"
                </code>{" "}
                block of your configuration file:
              </p>
              <MarkdownRenderer className="mt-1">
                {mcpConfigMarkdown}
              </MarkdownRenderer>
            </div>

            {/* Step 3: Specific instructions for this RAG */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-foreground">
                  3. Instruct Claude (Optional but Recommended)
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    mcpmcpCopyValue(
                      `Always query my workspace through the "raga" MCP server with: - knowledgebase_id: "${kbId}"`,
                      "inst",
                      "Prompt instructions",
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#340075] dark:text-[#9c7beb] hover:underline"
                >
                  {mcpCopiedField === "inst" ? (
                    <>
                      <Check className="size-3" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> Copy Instructions
                    </>
                  )}
                </button>
              </div>
              <p className="text-[#4a4452] dark:text-[#9c95a6] leading-relaxed">
                To instruct Claude to use *this specific* knowledge base in a
                project or system prompt, copy and paste these instructions:
              </p>
              <MarkdownRenderer className="mt-1">
                {mcpInstructionMarkdown}
              </MarkdownRenderer>
            </div>

            {/* Troubleshooting */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-foreground">
                Troubleshooting
              </h4>
              <p className="text-[#4a4452] dark:text-[#9c95a6] leading-relaxed pb-1">
                Restart your Claude Desktop app after editing the config file. A
                new plug icon 🔌 will appear in the input box, showing that{" "}
                <code className="font-mono text-[#340075] dark:text-[#9c7beb]">
                  "raga"
                </code>{" "}
                tools like <code className="font-mono">search_rag</code> and{" "}
                <code className="font-mono">ask_rag</code> are active and ready.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
