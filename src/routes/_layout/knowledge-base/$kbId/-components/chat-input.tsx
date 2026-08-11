import { Send } from "lucide-react";

interface ChatInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  isStreaming: boolean;
}

export function ChatInput({
  query,
  onQueryChange,
  onKeyPress,
  onSubmit,
  isStreaming,
}: ChatInputProps) {
  return (
    <div className="pt-2 border-t border-border/60">
      <div className="relative flex items-center bg-card border border-input rounded-full px-4 py-2 hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm transition">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Ask about your documents..."
          className="flex-1 bg-transparent border-none outline-none ring-0 placeholder:text-muted-foreground text-sm text-foreground font-sans px-3"
        />
        <button
          type="button"
          onClick={() => onSubmit()}
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
  );
}
