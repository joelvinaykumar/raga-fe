import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Database } from "lucide-react";

import axios from "@/lib/axios";
import { useAuth } from "@/contexts/auth-context";
import {
  BACKEND_MODEL_OPTIONS,
  DEFAULT_MODEL,
  type KnowledgeBase,
  type Model,
} from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatInput } from "../chat/-components/chat-input";

export const Route = createFileRoute("/_layout/dashboard/")({
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  const { current_user } = useAuth();

  const [query, setQuery] = useState("");
  const [selectedKbId, setSelectedKbId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<Model>(DEFAULT_MODEL);

  const { data: knowledgeBases = [], isLoading } = useQuery<KnowledgeBase[]>({
    queryKey: ["list-knowledge-bases"],
    queryFn: async () => {
      const res = await axios.get("/rag/all/");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const trimmedQuery = query.trim();
  const isQueryValid = trimmedQuery.length >= 3;
  const hasKnowledgebase = selectedKbId.length > 0;
  const canSubmit = isQueryValid && hasKnowledgebase;

  const selectedKb = useMemo(
    () => knowledgeBases.find((kb) => kb.rag_id === selectedKbId),
    [knowledgeBases, selectedKbId],
  );

  const onSubmit = () => {
    if (!canSubmit) return;

    localStorage.setItem(`nexus_model_${selectedKbId}`, selectedModel);

    navigate({
      to: "/knowledge-base/$kbId",
      params: { kbId: selectedKbId },
      search: { q: trimmedQuery },
    });
  };

  return (
    <div className="flex h-full w-full items-center justify-center border-l border-[#ccc3d4]/20 bg-[#fff8f5] px-6 py-10 dark:border-[#2d2a2e]/20 dark:bg-[#121115]">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8">
        <header className="space-y-3 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7b7483] dark:text-[#9c95a6]">
            RAGA Dashboard
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1e1b19] dark:text-[#f4ece8] md:text-5xl">
            Hey {current_user?.user_metadata?.full_name || "there"}, ask your
            knowledge base anything.
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#4a4452] dark:text-[#9c95a6] md:text-base">
            Pick a knowledge base, keep the model aligned with backend runtime,
            then launch a grounded conversation instantly.
          </p>
        </header>

        <div className="w-full max-w-3xl rounded-2xl border border-[#d9d1e5] bg-white p-4 shadow-[0_16px_45px_-30px_rgba(35,20,90,0.45)] dark:border-[#3a3345] dark:bg-[#19171f] md:p-5">
          <ChatInput
            query={query}
            setQuery={setQuery}
            onSubmit={onSubmit}
            loading={false}
            className="w-full"
          />

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4a4452] dark:text-[#9c95a6]">
                  Knowledge Base (required)
                </p>
                <Select value={selectedKbId} onValueChange={setSelectedKbId}>
                  <SelectTrigger className="h-10 w-full rounded-lg border-[#ccc3d4] bg-[#fffdfa] text-left text-sm dark:border-[#4a4452] dark:bg-[#141218]">
                    <SelectValue
                      placeholder={
                        isLoading ? "Loading knowledge bases..." : "Select"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {knowledgeBases.map((kb) => (
                      <SelectItem key={kb.rag_id} value={kb.rag_id}>
                        {kb.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4a4452] dark:text-[#9c95a6]">
                  Model (backend aligned)
                </p>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => setSelectedModel(value as Model)}
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-[#ccc3d4] bg-[#fffdfa] text-left text-sm dark:border-[#4a4452] dark:bg-[#141218]">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKEND_MODEL_OPTIONS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex min-h-5 items-center gap-2 text-xs text-[#6c6577] dark:text-[#9c95a6]">
              {!isQueryValid ? (
                <span>Enter at least 3 characters to start.</span>
              ) : !hasKnowledgebase ? (
                <span>Select a knowledge base to continue.</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#340075] dark:text-[#b79aff]">
                  <Database className="h-3.5 w-3.5" />
                  Starting in{" "}
                  <strong>{selectedKb?.name || "knowledge base"}</strong>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
