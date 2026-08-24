import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import type { RagEvaluation, StartEvalResponse } from "../-lib/types";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 5 * 60 * 1000; // stop polling after 5 minutes as a safety net

/**
 * Owns the RAG evaluation lifecycle for a knowledge base: kicking off an async
 * run, polling its status until it completes/fails, and exposing the result for
 * the results modal. Results are not persisted server-side, so the hook holds
 * the latest run in local state only.
 */
export function useRagEvaluation(kbId: string) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<RagEvaluation | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);
  const activeEvalIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const poll = useCallback(
    (evalId: string) => {
      axios
        .get<RagEvaluation>(`/rag/${kbId}/evaluations/${evalId}`)
        .then((res) => {
          // Ignore stale responses from a superseded run.
          if (activeEvalIdRef.current !== evalId) return;

          const data = res.data;
          setEvaluation(data);

          if (data.status === "completed") {
            setIsEvaluating(false);
            stopPolling();
            toast.success("Evaluation complete.");
            return;
          }

          if (data.status === "failed") {
            setIsEvaluating(false);
            stopPolling();
            toast.error(data.error || "Evaluation failed.");
            return;
          }

          // Still pending/running — keep polling unless we've exceeded the cap.
          if (Date.now() - pollStartRef.current > MAX_POLL_MS) {
            setIsEvaluating(false);
            stopPolling();
            toast.error("Evaluation timed out. Please try again.");
            return;
          }

          pollTimerRef.current = setTimeout(
            () => poll(evalId),
            POLL_INTERVAL_MS,
          );
        })
        .catch(() => {
          // Transient error — the axios interceptor already toasts. Retry until
          // the safety cap so a single blip doesn't kill an in-flight run.
          if (activeEvalIdRef.current !== evalId) return;
          if (Date.now() - pollStartRef.current > MAX_POLL_MS) {
            setIsEvaluating(false);
            stopPolling();
            return;
          }
          pollTimerRef.current = setTimeout(
            () => poll(evalId),
            POLL_INTERVAL_MS,
          );
        });
    },
    [kbId, stopPolling],
  );

  const startEvaluation = useCallback(async () => {
    if (isEvaluating) return;

    setIsEvaluating(true);
    setEvaluation(null);
    setIsDialogOpen(true);

    try {
      const res = await axios.post<StartEvalResponse>(`/rag/${kbId}/evaluate`);
      const evalId = res.data.eval_id;
      activeEvalIdRef.current = evalId;
      pollStartRef.current = Date.now();
      setEvaluation({
        eval_id: evalId,
        rag_id: kbId,
        status: res.data.status,
        progress: 0,
        question_count: 0,
        completed_count: 0,
        questions: [],
      });
      poll(evalId);
    } catch (err: any) {
      setIsEvaluating(false);
      // 409 => a run is already in progress for this KB.
      if (err?.response?.status === 409) {
        toast.error(
          "An evaluation is already running for this knowledge base.",
        );
      }
      // Other errors are toasted by the axios interceptor.
    }
  }, [isEvaluating, kbId, poll]);

  return {
    isDialogOpen,
    setIsDialogOpen,
    isEvaluating,
    evaluation,
    startEvaluation,
  };
}
