import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Activity, Gauge, Loader2, ShieldCheck, Target } from "lucide-react";
import type {
  EvalMetrics,
  EvalQuestionResult,
  RagEvaluation,
} from "../-lib/types";

interface RagEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: RagEvaluation | null;
}

/** Map a 0-100 score to a semantic color band. */
function scoreBand(score: number): { label: string; className: string } {
  if (score >= 80)
    return {
      label: "Strong",
      className: "text-emerald-600 dark:text-emerald-400",
    };
  if (score >= 60)
    return { label: "Fair", className: "text-amber-600 dark:text-amber-400" };
  return { label: "Weak", className: "text-red-600 dark:text-red-400" };
}

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

const METRIC_HINTS: Record<
  keyof Omit<EvalMetrics, "overall_score" | "avg_response_ms">,
  { label: string; hint: string; icon: typeof ShieldCheck }
> = {
  groundedness: {
    label: "Groundedness",
    hint: "How well answers stay supported by retrieved sources (no hallucination).",
    icon: ShieldCheck,
  },
  answer_relevance: {
    label: "Answer Relevance",
    hint: "How directly answers address the question asked.",
    icon: Target,
  },
  context_relevance: {
    label: "Context Relevance",
    hint: "How relevant the retrieved chunks are to each question.",
    icon: Gauge,
  },
  retrieval_coverage: {
    label: "Retrieval Coverage",
    hint: "Share of questions where any relevant context was found.",
    icon: Activity,
  },
};

function MetricCard({
  label,
  hint,
  score,
  icon: Icon,
}: {
  label: string;
  hint: string;
  score: number;
  icon: typeof ShieldCheck;
}) {
  const band = scoreBand(score);
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] font-bold text-foreground">
            {label}
          </span>
        </div>
        <span className={cn("font-mono text-xs font-bold", band.className)}>
          {band.label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-serif text-2xl font-bold text-foreground">
          {Math.round(score)}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          /100
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor(score))}
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
        />
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

function QuestionRow({ result }: { result: EvalQuestionResult }) {
  return (
    <div className="space-y-3 py-2">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Answer
        </p>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {result.answer || "— (no answer produced)"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["Grounded", result.groundedness],
            ["Relevance", result.answer_relevance],
            ["Context", result.context_relevance],
          ] as const
        ).map(([label, score]) => {
          const band = scoreBand(score);
          return (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px]"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className={cn("font-bold", band.className)}>
                {Math.round(score)}
              </span>
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {result.retrieved_chunks} chunks · {Math.round(result.response_ms)}ms
        </span>
      </div>

      {result.rationale ? (
        <p className="text-[11px] italic leading-relaxed text-muted-foreground">
          “{result.rationale}”
        </p>
      ) : null}
    </div>
  );
}

export function RagEvaluationDialog({
  open,
  onOpenChange,
  evaluation,
}: RagEvaluationDialogProps) {
  const status = evaluation?.status;
  const isRunning = status === "pending" || status === "running";
  const metrics = evaluation?.metrics ?? null;
  const questions = evaluation?.questions ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl font-bold">
            <Gauge className="size-6 text-[#340075] dark:text-[#9c7beb]" />
            RAG Evaluation
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-[#4a4452] dark:text-[#9c95a6]">
            Auto-generated questions are run through your knowledge base and
            graded for quality. Results are not saved and reset on a new run.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Running / progress state */}
          {isRunning ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="font-mono text-xs">
                  {evaluation && evaluation.question_count > 0
                    ? `Scoring question ${evaluation.completed_count}/${evaluation.question_count}…`
                    : "Generating evaluation questions…"}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#340075] to-[#6c40d6] transition-all duration-300"
                  style={{ width: `${evaluation?.progress ?? 0}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                This can take a minute — questions are answered and graded by an
                LLM judge one at a time.
              </p>
            </div>
          ) : null}

          {/* Failed state */}
          {status === "failed" ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
              <p className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                Evaluation failed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {evaluation?.error || "An unexpected error occurred."}
              </p>
            </div>
          ) : null}

          {/* Completed state */}
          {status === "completed" && metrics ? (
            <>
              {/* Overall headline */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Overall Score
                </p>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span
                    className={cn(
                      "font-serif text-4xl font-bold",
                      scoreBand(metrics.overall_score).className,
                    )}
                  >
                    {Math.round(metrics.overall_score)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    /100
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {scoreBand(metrics.overall_score).label} · avg{" "}
                  {Math.round(metrics.avg_response_ms)}ms / question
                </p>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(
                  Object.keys(METRIC_HINTS) as (keyof typeof METRIC_HINTS)[]
                ).map((key) => (
                  <MetricCard
                    key={key}
                    label={METRIC_HINTS[key].label}
                    hint={METRIC_HINTS[key].hint}
                    icon={METRIC_HINTS[key].icon}
                    score={metrics[key]}
                  />
                ))}
              </div>

              {/* Per-question breakdown */}
              {questions.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-serif text-base font-bold text-foreground">
                    Question Breakdown ({questions.length})
                  </h4>
                  <Accordion type="single" collapsible className="w-full">
                    {questions.map((result, idx) => (
                      <AccordionItem key={idx} value={`q-${idx}`}>
                        <AccordionTrigger className="text-left text-sm hover:no-underline">
                          <span className="line-clamp-1 pr-3 text-foreground">
                            {result.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <QuestionRow result={result} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
