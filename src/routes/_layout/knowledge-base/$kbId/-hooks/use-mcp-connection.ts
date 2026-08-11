import { useMemo, useState } from "react";
import { toast } from "sonner";
import { env } from "@/lib/env";
import { useHomeStore } from "@/store";

export type McpCopyField = "key" | "url" | "config" | "inst";

/**
 * Encapsulates everything needed to render the "Connect to Claude via MCP"
 * dialog: the derived config/markdown snippets, the copy-to-clipboard state,
 * and the dialog open state. Reusable anywhere a knowledge base needs to
 * surface its MCP connection details.
 */
export function useMcpConnection(kbId: string) {
  const apiKey = useHomeStore((state) => state.api_key);
  const [isMcpDialogOpen, setIsMcpDialogOpen] = useState(false);
  const [mcpCopiedField, setMcpCopiedField] = useState<McpCopyField | null>(
    null,
  );

  const mcpUrl = `${env.VITE_BASE_URL.replace(/\/$/, "")}/mcp`;

  const mcpConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            raga: {
              type: "sse",
              url: mcpUrl,
              headers: { "x-api-key": apiKey ?? "<your-api-key>" },
            },
          },
        },
        null,
        2,
      ),
    [mcpUrl, apiKey],
  );

  const mcpConfigMarkdown = useMemo(
    () => ["```json", mcpConfig, "```"].join("\n"),
    [mcpConfig],
  );

  const mcpInstructionMarkdown = useMemo(
    () =>
      [
        "To restrict Claude to this specific knowledge base, add this to your system prompt or custom instructions:",
        "```markdown",
        `Always query my workspace through the "raga" MCP server with:`,
        `- knowledgebase_id: "${kbId}"`,
        "```",
      ].join("\n"),
    [kbId],
  );

  const copyValue = async (
    value: string,
    field: McpCopyField,
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setMcpCopiedField(field);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setMcpCopiedField(null), 2000);
    } catch {
      toast.error(`Could not copy ${label}`);
    }
  };

  return {
    isMcpDialogOpen,
    setIsMcpDialogOpen,
    mcpCopiedField,
    mcpConfig,
    mcpConfigMarkdown,
    mcpInstructionMarkdown,
    copyValue,
  };
}
