import { useState } from "react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import type { RagInfo } from "../-lib/types";

/**
 * Owns the client-side RAG configuration (LLM model, top-k, embedding model)
 * with localStorage persistence keyed per knowledge base. Reusable for any
 * screen that needs to read/edit a knowledge base's query configuration.
 */
export function useKnowledgeBaseConfig(kbId: string) {
  const [llmModel, setLlmModel] = useState<string>("gpt-4o-mini");
  const [topK, setTopK] = useState<number>(8);
  const [embeddingModel, setEmbeddingModel] = useState<string>(
    "text-embedding-3-large",
  );
  const [savingConfig, setSavingConfig] = useState(false);

  /** Hydrate config from localStorage overrides, falling back to RAG metadata. */
  const hydrate = (ragData: RagInfo) => {
    const cachedModel = localStorage.getItem(`nexus_model_${kbId}`);
    const cachedTopK = localStorage.getItem(`nexus_topk_${kbId}`);
    const cachedEmb = localStorage.getItem(`nexus_emb_${kbId}`);

    setLlmModel(cachedModel || "gpt-4o-mini");
    setTopK(cachedTopK ? Number(cachedTopK) : ragData.top_k || 8);
    setEmbeddingModel(
      cachedEmb || ragData.embedding_model || "text-embedding-3-large",
    );
  };

  const saveConfig = async (ragInfo: RagInfo | null) => {
    setSavingConfig(true);
    try {
      localStorage.setItem(`nexus_model_${kbId}`, llmModel);
      localStorage.setItem(`nexus_topk_${kbId}`, String(topK));
      localStorage.setItem(`nexus_emb_${kbId}`, embeddingModel);

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

  return {
    llmModel,
    setLlmModel,
    topK,
    setTopK,
    embeddingModel,
    setEmbeddingModel,
    savingConfig,
    hydrate,
    saveConfig,
  };
}
