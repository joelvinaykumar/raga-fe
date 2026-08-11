import {
  Sparkles,
  Terminal,
  Lightbulb,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import type { PromptSuggestionCard } from "./types";

export const FALLBACK_PROMPTS = [
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

export const toSuggestionCards = (prompts: string[]): PromptSuggestionCard[] =>
  prompts.slice(0, 5).map((prompt, index) => ({
    title: SUGGESTION_TITLES[index] ?? `Prompt ${index + 1}`,
    desc:
      SUGGESTION_DESCRIPTIONS[index] ??
      "Tap to run this suggestion against your indexed documents.",
    prompt,
    icon: SUGGESTION_ICONS[index % SUGGESTION_ICONS.length],
  }));

export const isValidRagId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
