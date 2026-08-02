"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "@/lib/axios";
import { KnowledgeBase } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Database, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type KnowledgeBaseDropdownProps = {
  sessionId: string;
  currentKnowledgeBaseId?: string;
};

export function KnowledgeBaseDropdown({
  sessionId,
  currentKnowledgeBaseId,
}: KnowledgeBaseDropdownProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | undefined>(
    currentKnowledgeBaseId,
  );

  useEffect(() => {
    setSelectedId(currentKnowledgeBaseId);
  }, [currentKnowledgeBaseId]);

  const {
    data: knowledgeBases = [],
    isLoading,
    isError,
  } = useQuery<KnowledgeBase[]>({
    queryKey: ["list-knowledge-bases"],
    queryFn: async () => {
      const res = await axios.get("/rag/all/");
      return res.data;
    },
  });

  const { mutateAsync: setKnowledgeBase } = useMutation({
    mutationKey: ["set-knowledge-base"],
    mutationFn: (knowledgebase_id: string) =>
      axios.put(`/sessions/${sessionId}/knowledgebase`, {
        knowledgebase_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-sessions"] });
    },
  });

  const handleSelect = async (kbId: string) => {
    setSelectedId(kbId);
    try {
      await setKnowledgeBase(kbId);
      const kb = knowledgeBases.find((k) => k.rag_id === kbId);
      toast.success(`Knowledge base set to ${kb?.name ?? kbId}`);
    } catch {
      setSelectedId(currentKnowledgeBaseId);
    }
  };

  const selectedKb = knowledgeBases.find((kb) => kb.rag_id === selectedId);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
        <Loader2 className="h-3 w-3 animate-spin" />
      </Button>
    );
  }

  if (isError || knowledgeBases.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Database className="h-3 w-3" />
          <span className="max-w-[100px] truncate">
            {selectedKb?.name ?? "Select KB"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {knowledgeBases.map((kb) => (
          <DropdownMenuItem
            key={kb.rag_id}
            onClick={() => handleSelect(kb.rag_id)}
            className={cn(
              "cursor-pointer text-xs",
              selectedId === kb.rag_id && "bg-accent",
            )}
          >
            <span className="flex-1 truncate">{kb.name}</span>
            {selectedId === kb.rag_id && (
              <Check className="h-3 w-3 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
