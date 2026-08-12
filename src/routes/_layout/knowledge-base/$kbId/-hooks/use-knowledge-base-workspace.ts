import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import axios from "@/lib/axios";
import type { PromptSuggestionCard, RagInfo } from "../-lib/types";
import {
  FALLBACK_PROMPTS,
  isValidRagId,
  toSuggestionCards,
} from "../-lib/suggestions";
import { useChatSession } from "./use-chat-session";
import { useKnowledgeBaseConfig } from "./use-knowledge-base-config";
import { useKnowledgeBaseFiles } from "./use-knowledge-base-files";
import { useMcpConnection } from "./use-mcp-connection";

type KnowledgeBaseWorkspaceOptions = {
  initialQuery?: string;
  onInitialQueryExecuted?: () => void;
};

/**
 * Top-level orchestration hook for a knowledge base workspace. Composes the
 * focused hooks (chat session, config, files, MCP) and owns the cross-cutting
 * concerns: RAG metadata, the initial parallel load, prompt suggestions, and
 * the edit/delete knowledge base dialogs. The route component consumes this
 * single hook and stays purely presentational.
 */
export function useKnowledgeBaseWorkspace(
  kbId: string,
  options: KnowledgeBaseWorkspaceOptions = {},
) {
  const navigate = useNavigate();
  const { initialQuery, onInitialQueryExecuted } = options;

  const [loadingData, setLoadingData] = useState(true);
  const [ragInfo, setRagInfo] = useState<RagInfo | null>(null);
  const [promptSuggestions, setPromptSuggestions] = useState<
    PromptSuggestionCard[]
  >(toSuggestionCards(FALLBACK_PROMPTS));

  // Edit / delete knowledge base dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [isUpdatingKnowledgebase, setIsUpdatingKnowledgebase] = useState(false);
  const [isDeletingKnowledgebase, setIsDeletingKnowledgebase] = useState(false);

  const config = useKnowledgeBaseConfig(kbId);
  const filesApi = useKnowledgeBaseFiles(kbId);
  const mcp = useMcpConnection(kbId);

  // Keep the latest chat params in a ref so the chat submit handler always
  // reads the current top-k/model without re-creating the callback.
  const chatParamsRef = useRef({ topK: config.topK, model: config.llmModel });
  chatParamsRef.current = { topK: config.topK, model: config.llmModel };
  const chat = useChatSession(kbId, () => chatParamsRef.current);

  const { setFiles, setIsFilesLoading } = filesApi;
  const { hydrate } = config;
  const {
    sessionId,
    setMessages,
    setIsHistoryLoading,
    scrollRef,
    submit,
    setQuery,
    isStreaming,
  } = chat;

  const initialQueryKeyRef = useRef<string | null>(null);
  const initialQueryInFlightRef = useRef(false);

  // Load workspace properties for this knowledge base.
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const loadWorkspace = async () => {
      setIsHistoryLoading(true);
      try {
        if (cancelled) return;

        setIsFilesLoading(true);
        const [ragRes, filesRes, historyRes] = await Promise.all([
          axios.get(`/rag/${kbId}`),
          axios.get(`/rag/${kbId}/documents`),
          axios.get(`chat-history/${sessionId}`),
        ]);

        if (cancelled) return;

        setRagInfo(ragRes.data);
        setFiles(filesRes.data);
        hydrate(ragRes.data);

        if (historyRes.data) {
          setMessages(
            historyRes.data.map((msg: any) => ({
              role: msg.role || "user",
              content: msg.content || "",
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              loading: false,
              citations: Array.isArray(msg.citations) ? msg.citations : [],
              chunks: Array.isArray(msg.chunks) ? msg.chunks : [],
              ui:
                msg.ui &&
                typeof msg.ui === "object" &&
                Array.isArray(msg.ui.blocks)
                  ? msg.ui
                  : undefined,
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

            setPromptSuggestions(
              prompts.length > 0
                ? toSuggestionCards(prompts)
                : toSuggestionCards(FALLBACK_PROMPTS),
            );
          } catch {
            setPromptSuggestions(toSuggestionCards(FALLBACK_PROMPTS));
          }
        } else if (!hasValidRagId) {
          setPromptSuggestions(toSuggestionCards(FALLBACK_PROMPTS));
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false);
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
  }, [
    kbId,
    sessionId,
    setFiles,
    setIsFilesLoading,
    setMessages,
    setIsHistoryLoading,
    hydrate,
    scrollRef,
  ]);

  // Bootstrap the first message from `?q=` once the workspace is ready.
  useEffect(() => {
    const normalizedQuery = initialQuery?.trim() ?? "";
    if (!normalizedQuery || normalizedQuery.length < 3) return;
    if (!sessionId || loadingData || isStreaming) return;

    const queryKey = `${kbId}:${sessionId}:${normalizedQuery}`;
    if (
      initialQueryKeyRef.current === queryKey ||
      initialQueryInFlightRef.current
    ) {
      return;
    }

    let cancelled = false;
    initialQueryKeyRef.current = queryKey;
    initialQueryInFlightRef.current = true;

    submit(normalizedQuery)
      .then((success) => {
        if (cancelled) return;

        if (!success) {
          // Preserve failed bootstrapped prompt in the input for quick retry.
          setQuery(normalizedQuery);
        }
      })
      .finally(() => {
        if (!cancelled) {
          onInitialQueryExecuted?.();
          initialQueryInFlightRef.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    initialQuery,
    isStreaming,
    kbId,
    loadingData,
    onInitialQueryExecuted,
    sessionId,
    setQuery,
    submit,
  ]);

  const openEditDialog = () => {
    setEditingName(ragInfo?.name ?? "");
    setEditingDescription(ragInfo?.description ?? "");
    setIsEditDialogOpen(true);
  };

  const updateKnowledgebase = async () => {
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

  const deleteKnowledgebase = async () => {
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

  const saveConfig = () => config.saveConfig(ragInfo);

  return {
    kbId,
    loadingData,
    ragInfo,
    promptSuggestions,
    chat,
    config,
    filesApi,
    mcp,
    saveConfig,
    // edit / delete KB dialogs
    editKb: {
      isEditDialogOpen,
      setIsEditDialogOpen,
      isDeleteDialogOpen,
      setIsDeleteDialogOpen,
      editingName,
      setEditingName,
      editingDescription,
      setEditingDescription,
      isUpdatingKnowledgebase,
      isDeletingKnowledgebase,
      openEditDialog,
      updateKnowledgebase,
      deleteKnowledgebase,
    },
  };
}
