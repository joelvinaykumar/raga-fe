import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MarkdownRenderer from "@/components/custom/markdown";
import { Blocks, Check, Copy } from "lucide-react";
import type { McpCopyField } from "../-hooks/use-mcp-connection";

interface McpConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kbId: string;
  mcpConfig: string;
  mcpConfigMarkdown: string;
  mcpInstructionMarkdown: string;
  copiedField: McpCopyField | null;
  onCopy: (value: string, field: McpCopyField, label: string) => void;
}

export function McpConnectionDialog({
  open,
  onOpenChange,
  kbId,
  mcpConfig,
  mcpConfigMarkdown,
  mcpInstructionMarkdown,
  copiedField,
  onCopy,
}: McpConnectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onClick={() => onCopy(mcpConfig, "config", "MCP config")}
                className="inline-flex items-center gap-1 text-xs font-mono text-[#340075] dark:text-[#9c7beb] hover:underline"
              >
                {copiedField === "config" ? (
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
                  onCopy(
                    `Always query my workspace through the "raga" MCP server with: - knowledgebase_id: "${kbId}"`,
                    "inst",
                    "Prompt instructions",
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-mono text-[#340075] dark:text-[#9c7beb] hover:underline"
              >
                {copiedField === "inst" ? (
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
  );
}
