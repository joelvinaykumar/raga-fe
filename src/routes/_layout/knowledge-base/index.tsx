import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "@/lib/axios";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
export const Route = createFileRoute("/_layout/knowledge-base/")({
  component: RouteComponent,
});

type KnowledgeBase = {
  rag_id: string;
  name: string;
  description?: string;
  document_count?: number;
};

type FileProgress = {
  count: number;
  progress: number;
};

const FILE_COUNT_TARGET = 10;

function RouteComponent() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [fileProgressByKb, setFileProgressByKb] = useState<
    Record<string, FileProgress>
  >({});
  const [loadingData, setLoadingData] = useState(false);

  const fetchFileProgress = async (kbs: KnowledgeBase[]) => {
    if (!kbs.length) {
      setFileProgressByKb({});
      return;
    }

    // Check if the backend already provided document counts inline
    const hasInlinedCounts = kbs.every(
      (kb) => typeof kb.document_count === "number",
    );

    if (hasInlinedCounts) {
      const inlineResults = kbs.map((kb) => {
        const count = kb.document_count ?? 0;
        const progress = Math.min(
          100,
          Math.round((count / FILE_COUNT_TARGET) * 100),
        );
        return [kb.rag_id, { count, progress }] as const;
      });
      setFileProgressByKb(Object.fromEntries(inlineResults));
      return;
    }

    const results = await Promise.all(
      kbs.map(async (kb) => {
        try {
          const res = await axios.get(`/rag/${kb.rag_id}/documents`);
          const count = Array.isArray(res.data) ? res.data.length : 0;
          const progress = Math.min(
            100,
            Math.round((count / FILE_COUNT_TARGET) * 100),
          );

          return [kb.rag_id, { count, progress }] as const;
        } catch {
          return [kb.rag_id, { count: 0, progress: 0 }] as const;
        }
      }),
    );

    setFileProgressByKb(Object.fromEntries(results));
  };

  const fetchKnowledgeBases = async () => {
    setLoadingData(true);
    try {
      const res = await axios.get("/rag/all/");
      const kbData: KnowledgeBase[] = Array.isArray(res.data) ? res.data : [];
      setKnowledgeBases(kbData);
      await fetchFileProgress(kbData);
    } catch (_error) {
      // error handling is done globally in axios interceptor
    } finally {
      setLoadingData(false);
    }
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch list once when layout mounts
  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  return (
    <div className="flex flex-col items-start min-h-screen w-full bg-[#fff8f5] dark:bg-[#121115] p-8 gap-8 border-l border-[#ccc3d4]/20 dark:border-[#2d2a2e]/20">
      {/* Header */}
      <div className="flex items-center justify-between w-full border-b border-[#ccc3d4]/30 dark:border-[#2d2a2e]/30 pb-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold text-[#1e1b19] dark:text-[#f4ece8] tracking-tight">
            Knowledge Bases
          </h1>
          <p className="text-sm text-[#4a4452] dark:text-[#9c95a6] font-sans">
            Manage your workspace datasets, indexing contexts, and model
            parameters.
          </p>
        </div>
        <Link
          to="/knowledge-base/new"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ccc3d4] bg-transparent px-4 text-sm font-medium text-[#1e1b19] transition-all hover:bg-[#340075] hover:text-white dark:border-[#4a4452] dark:text-[#f4ece8] dark:hover:bg-[#6c40d6]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Knowledge Base
        </Link>
      </div>

      {/* Knowledge Base Grid */}
      {loadingData ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-44 bg-[#ccc3d4]/20 dark:bg-[#2d2a2e]/20 border border-[#ccc3d4]/30 dark:border-[#2d2a2e]/30 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : knowledgeBases.length === 0 ? (
        <div className="grid place-items-center h-64 w-full border border-dashed border-[#ccc3d4] dark:border-[#4a4452] rounded-xl bg-white/40 dark:bg-[#16141a]/40">
          <p className="text-[#4a4452] dark:text-[#9c95a6] font-sans">
            No active editorial knowledge bases discovered. Create one above to
            begin.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
          {knowledgeBases.map((kb, index) => (
            <motion.div
              key={kb.rag_id}
              className="relative group"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.28,
                delay: index * 0.05,
                ease: "easeOut",
              }}
              whileHover={{ y: -4 }}
            >
              <Link
                to="/knowledge-base/$kbId"
                params={{ kbId: kb.rag_id }}
                className="block"
              >
                <Card className="border border-[#ccc3d4] dark:border-[#4a4452] hover:border-[#340075] dark:hover:border-[#6c40d6] transition-all bg-white dark:bg-[#16141a] rounded-xl shadow-none p-2 h-full flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-serif font-bold text-[#1e1b19] dark:text-[#f4ece8] line-clamp-1 group-hover:text-[#340075] dark:group-hover:text-[#9c7beb] transition-colors">
                      {kb.name}
                    </CardTitle>
                    {kb.description ? (
                      <CardDescription className="line-clamp-3 h-14 mt-2 text-gray-400 dark:text-[#9c95a6] text-sm leading-relaxed">
                        {kb.description}
                      </CardDescription>
                    ) : (
                      <p className="text-sm text-[#ccc3d4] dark:text-[#4a4452] italic mt-2 h-14">
                        No description provided.
                      </p>
                    )}
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center border-t border-[#ccc3d4]/20 dark:border-[#2d2a2e]/20 pt-3 gap-4">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <span className="text-xxs font-semibold uppercase tracking-wider text-[#7b7483] dark:text-[#9c95a6] [font-feature-settings:'tnum']">
                        {Math.max(
                          0,
                          FILE_COUNT_TARGET -
                            (fileProgressByKb[kb.rag_id]?.count ?? 0),
                        )}{" "}
                        more uploads allowed
                      </span>
                      <div className="h-1 w-20 rounded-full bg-[#ccc3d4]/30 dark:bg-[#2d2a2e] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#340075] to-[#6c40d6] rounded-full transition-all duration-300"
                          style={{
                            width: `${fileProgressByKb[kb.rag_id]?.progress ?? 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="border-[#ccc3d4] dark:border-[#4a4452] text-[#1e1b19] dark:text-[#f4ece8] group-hover:bg-[#340075]/10 dark:group-hover:bg-[#6c40d6]/10 group-hover:border-[#340075]/20 dark:group-hover:border-[#6c40d6]/20 group-hover:text-[#340075] dark:group-hover:text-[#9c7beb] rounded-lg h-8 px-3 text-xs font-semibold bg-transparent shrink-0"
                    >
                      Configure →
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
