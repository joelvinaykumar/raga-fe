import MarkdownRenderer from "@/components/custom/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { env } from "@/lib/env";
import { useHomeStore } from "@/store";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  Copy,
  KeyRound,
  Link2,
  Mail,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_layout/account/")({
  component: RouteComponent,
});

const mcpUrl = `${env.VITE_BASE_URL.replace(/\/$/, "")}/mcp`;

function RouteComponent() {
  const { current_user } = useAuth();
  const apiKey = useHomeStore((state) => state.api_key);

  const [copiedField, setCopiedField] = useState<
    "key" | "url" | "config" | null
  >(null);

  const profile = current_user?.user_metadata;

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        raga: {
          url: mcpUrl,
          headers: { "x-api-key": apiKey ?? "<your-api-key>" },
        },
      },
    },
    null,
    2,
  );

  const mcpConfigMarkdown = ["```json", mcpConfig, "```"].join("\n");

  const curlMarkdown = [
    "```bash",
    `curl -N ${mcpUrl} \\`,
    `  -H "x-api-key: ${apiKey ?? "<your-api-key>"}" \\`,
    '  -H "Content-Type: application/json" \\',
    '  -H "Accept: application/json, text/event-stream" \\',
    `  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`,
    "```",
  ].join("\n");

  const copyValue = async (
    value: string | null | undefined,
    field: "key" | "url" | "config",
    label: string,
  ) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error(`Failed to copy ${label} => `, error);
      toast.error(`Could not copy ${label}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="p-8 h-full w-full overflow-y-auto grid place-items-center bg-[#fff8f5] dark:bg-[#121115] border-l border-[#ccc3d4]/20 dark:border-[#2d2a2e]/20"
    >
      <div className="grid w-full max-w-5xl grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        {/* Left column — account details */}
        <Card className="flex h-full w-full flex-col border border-[#ccc3d4] dark:border-[#4a4452] bg-white dark:bg-[#16141a] rounded-xl shadow-none p-2 text-[#1e1b19] dark:text-[#f4ece8]">
          <CardHeader className="text-center pb-6 border-b border-[#ccc3d4]/30 dark:border-[#2d2a2e]/30">
            <div className="relative mx-auto mt-2">
              <Avatar className="w-24 h-24 border-2 border-[#340075] dark:border-[#6c40d6] rounded-full p-1 bg-white dark:bg-[#1a1820]">
                <AvatarImage
                  src={profile?.picture}
                  alt={profile?.full_name}
                  className="rounded-full object-cover"
                />
                <AvatarFallback className="text-xl font-serif font-bold bg-[#340075] dark:bg-[#6c40d6] text-white">
                  {getInitials(
                    profile?.full_name ?? current_user?.email ?? "U",
                  )}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1 mt-4">
              <div className="text-xs font-mono text-[#4a4452] dark:text-[#9c95a6] uppercase tracking-widest mt-1">
                Editorial Contributor
              </div>
              <h2 className="text-3xl font-serif font-bold text-[#1e1b19] dark:text-[#f4ece8] tracking-tight">
                {profile?.full_name ?? "-- --"}
              </h2>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 pt-6">
            <div className="space-y-4">
              {/* Email field */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-[#ccc3d4]/40 dark:border-[#4a4452]/40 bg-[#fff8f5] dark:bg-[#1c1a20]">
                <Mail className="w-5 h-5 text-[#340075] dark:text-[#9c7beb]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                    Editorial Contact
                  </p>
                  <p className="text-sm font-medium text-[#1e1b19] dark:text-[#f4ece8] truncate font-sans">
                    {profile?.email ?? current_user?.email}
                  </p>
                </div>
                {profile?.email_verified && (
                  <Badge
                    variant="outline"
                    className="bg-[#340075]/10 dark:bg-[#6c40d6]/20 text-[#340075] dark:text-[#9c7beb] border-[#340075]/20 dark:border-[#9c7beb]/20 text-xxs font-mono rounded-md"
                  >
                    Verified
                  </Badge>
                )}
              </div>

              {/* Phone field */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-[#ccc3d4]/40 dark:border-[#4a4452]/40 bg-[#fff8f5] dark:bg-[#1c1a20]">
                <Phone className="w-5 h-5 text-[#340075] dark:text-[#9c7beb]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                    Verified Phone
                  </p>
                  <p className="text-sm font-medium text-[#1e1b19] dark:text-[#f4ece8] font-sans">
                    Not provided
                  </p>
                </div>
                {!profile?.phone_verified && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/10 text-amber-800 dark:text-amber-500 border-amber-500/20 text-xxs font-mono rounded-md"
                  >
                    Pending
                  </Badge>
                )}
              </div>

              {/* Calendar session field */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-[#ccc3d4]/40 dark:border-[#4a4452]/40 bg-[#fff8f5] dark:bg-[#1c1a20]">
                <Calendar className="w-5 h-5 text-[#340075] dark:text-[#9c7beb]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                    Session Access Stamp
                  </p>
                  <p className="text-sm font-medium text-[#1e1b19] dark:text-[#f4ece8] font-sans leading-relaxed">
                    {new Intl.DateTimeFormat("en-IN", {
                      timeStyle: "short",
                      hour12: true,
                      dateStyle: "full",
                    }).format(
                      current_user?.last_sign_in_at
                        ? new Date(current_user?.last_sign_in_at)
                        : new Date(),
                    )}
                  </p>
                </div>
              </div>

              {/* API Key row */}
              <div className="flex items-center gap-3 p-4 rounded-lg border border-[#ccc3d4]/40 dark:border-[#4a4452]/40 bg-[#fff8f5] dark:bg-[#1c1a20]">
                <KeyRound className="w-5 h-5 shrink-0 text-[#340075] dark:text-[#9c7beb]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                    API Key
                  </p>
                  <p className="text-sm font-medium text-[#1e1b19] dark:text-[#f4ece8] font-mono truncate">
                    {apiKey ?? "Provisioning…"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(apiKey, "key", "API key")}
                  disabled={!apiKey}
                  aria-label="Copy API key"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#340075]/20 dark:border-[#9c7beb]/20 bg-[#340075]/10 dark:bg-[#6c40d6]/20 text-[#340075] dark:text-[#9c7beb] transition hover:bg-[#340075]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copiedField === "key" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>

              {/* MCP URL row */}
              <div className="flex items-center gap-3 p-4 rounded-lg border border-[#ccc3d4]/40 dark:border-[#4a4452]/40 bg-[#fff8f5] dark:bg-[#1c1a20]">
                <Link2 className="w-5 h-5 shrink-0 text-[#340075] dark:text-[#9c7beb]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                    Server URL
                  </p>
                  <p className="text-sm font-medium text-[#1e1b19] dark:text-[#f4ece8] font-mono truncate">
                    {mcpUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(mcpUrl, "url", "MCP URL")}
                  aria-label="Copy MCP URL"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#340075]/20 dark:border-[#9c7beb]/20 bg-[#340075]/10 dark:bg-[#6c40d6]/20 text-[#340075] dark:text-[#9c7beb] transition hover:bg-[#340075]/20"
                >
                  {copiedField === "url" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column — MCP connection */}
        <Card className="flex h-full w-full flex-col border border-[#ccc3d4] dark:border-[#4a4452] bg-white dark:bg-[#16141a] rounded-xl shadow-none p-2 text-[#1e1b19] dark:text-[#f4ece8]">
          <CardHeader className="pb-4 border-b border-[#ccc3d4]/30 dark:border-[#2d2a2e]/30">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-bold text-[#1e1b19] dark:text-[#f4ece8]">
                MCP Connection
              </h3>
              <Badge
                variant="outline"
                className="bg-[#340075]/10 dark:bg-[#6c40d6]/20 text-[#340075] dark:text-[#9c7beb] border-[#340075]/20 dark:border-[#9c7beb]/20 text-xxs font-mono rounded-md"
              >
                Claude / MCP
              </Badge>
            </div>
            <p className="mt-1 text-xs font-sans text-[#4a4452] dark:text-[#9c95a6] leading-relaxed">
              Drop this config into your MCP client, or run the quick test
              below.
            </p>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 pt-6">
            {/* Client config (JSON, rendered as markdown) */}
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                Client Config
              </p>
              <MarkdownRenderer className="mt-1 text-xs">
                {mcpConfigMarkdown}
              </MarkdownRenderer>
            </div>

            {/* Quick test (curl, rendered as markdown) */}
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                Quick Test
              </p>
              <MarkdownRenderer className="mt-1 text-xs">
                {curlMarkdown}
              </MarkdownRenderer>
            </div>

            <p className="text-xs font-sans text-[#4a4452] dark:text-[#9c95a6] leading-relaxed">
              Paste the config into your MCP client, or add the{" "}
              <code className="font-mono text-[#340075] dark:text-[#9c7beb]">
                x-api-key
              </code>{" "}
              header manually when connecting to the Server URL.
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
