import * as React from "react";
import {
  Bug,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface BugItem {
  id: string;
  title: string;
  description: string;
  impact: string;
  status: "investigating" | "in-progress" | "planning" | "fixed";
  type: "frontend" | "backend";
}

const KNOWN_BUGS: BugItem[] = [
  {
    id: "MCP-1",
    title: "MCP Connection — Authentication Still Needs Work",
    description:
      "The MCP connection flow is buggy and not yet production-ready. Authentication for MCP clients — API-key provisioning/validation and scoped access — is incomplete, so tool connections can be rejected or behave inconsistently.",
    impact:
      "External MCP clients cannot reliably authenticate. API-key issuance/rotation, server-side header validation, and client error handling all need hardening before it can be relied on.",
    status: "investigating",
    type: "backend",
  },
  {
    id: "SHARED-1",
    title: "Inconsistent top_k Caps",
    description:
      "Three separate validation limits used to be enforced (10 on the create form, 20 on the workspace slider, 30 on the FastAPI resolver). Unified to a single 1–100 range shared across the create form, config slider, config-hook clamp, and both backend enforcement points.",
    impact:
      "A top_k value chosen in one surface could previously be clamped or rejected elsewhere. Now consistent end-to-end.",
    status: "fixed",
    type: "frontend",
  },
  {
    id: "BE-1",
    title: "Upload missing knowledgebase_id",
    description:
      "The RAG document indexing endpoint '/upload-doc/{session_id}' did not receive kb metadata parameter and retrieved chunks with NULL rag_id.",
    impact:
      "Highly severe; uploaded documents were indexed but completely missed during query searches.",
    status: "fixed",
    type: "backend",
  },
  {
    id: "BE-2",
    title: "Casting raw AIMessage object to DB",
    description:
      "LangChain returned complex object models rather than plain text strings on request queries, causing DB payload exception on SQLite schema inserts.",
    impact:
      "SQLite insertion failures and missing messages inside session history storage.",
    status: "fixed",
    type: "backend",
  },
  {
    id: "BE-3",
    title: "Vector collection boolean retrieval coercion",
    description:
      "Under failure states, vector recovery operations responded with boolean values (False) instead of standard empty list structures.",
    impact:
      "Triggered TypeErrors ('bool object is not iterable') across subsequent processing chains.",
    status: "fixed",
    type: "backend",
  },
];

export function BugsDialog() {
  const [activeTab, setActiveTab] = React.useState<"active" | "fixed">(
    "active",
  );

  const activeBugs = KNOWN_BUGS.filter((b) => b.status !== "fixed");
  const fixedBugs = KNOWN_BUGS.filter((b) => b.status === "fixed");

  const getStatusBadge = (status: BugItem["status"]) => {
    switch (status) {
      case "investigating":
        return (
          <Badge
            variant="outline"
            className="gap-1 border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 capitalize"
          >
            <Clock className="size-3" />
            Investigating
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="outline"
            className="gap-1 border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 capitalize"
          >
            <RefreshCw className="size-3" />
            Fix Active
          </Badge>
        );
      case "planning":
        return (
          <Badge
            variant="outline"
            className="gap-1 border-purple-500 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 capitalize"
          >
            <Sparkles className="size-3" />
            In Backlog
          </Badge>
        );
      case "fixed":
        return (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 capitalize"
          >
            <CheckCircle2 className="size-3" />
            Resolved
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: BugItem["type"]) => {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] uppercase font-mono tracking-wider"
      >
        {type}
      </Badge>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenuItem className="list-none">
          <SidebarMenuButton className="flex h-10 w-full items-center gap-3 rounded-lg border border-dotted border-[#e7e5e4] dark:border-[#2d2a2e] px-3 text-left transition-all hover:bg-[#faf2ee] dark:hover:bg-[#201d24] text-[#4a4452] dark:text-[#a09aab]">
            <Bug className="size-4 text-purple-500 dark:text-[#9c7beb]" />
            <span className="font-sans text-xs font-semibold">
              Known Bugs & Issues
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-xl md:max-w-2xl bg-white dark:bg-[#121115] border-[#e7e5e4] dark:border-[#2d2a2e] text-[#1e1b19] dark:text-[#f4ece8] rounded-xl overflow-hidden shadow-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-[#e7e5e4]/60 dark:border-[#2d2a2e]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Bug className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold">
                RAGA Status Hub
              </DialogTitle>
              <DialogDescription className="font-sans text-xs text-[#7b7483] dark:text-[#9c95a6] mt-0.5">
                Explore real-time telemetry, known active bugs, and completed
                fixes for the system.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-[#e7e5e4]/60 dark:border-[#2d2a2e]/60 bg-[#fff8f5] dark:bg-[#16141a]">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 font-mono uppercase tracking-wider transition-colors ${
              activeTab === "active"
                ? "border-purple-600 text-purple-600 dark:border-[#9c7beb] dark:text-[#9c7beb]"
                : "border-transparent text-[#7b7483] dark:text-[#9c95a6] hover:bg-[#faf2ee] dark:hover:bg-[#201d24]"
            }`}
          >
            Active Issues ({activeBugs.length})
          </button>
          <button
            onClick={() => setActiveTab("fixed")}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 font-mono uppercase tracking-wider transition-colors ${
              activeTab === "fixed"
                ? "border-purple-600 text-purple-600 dark:border-[#9c7beb] dark:text-[#9c7beb]"
                : "border-transparent text-[#7b7483] dark:text-[#9c95a6] hover:bg-[#faf2ee] dark:hover:bg-[#201d24]"
            }`}
          >
            Resolved ({fixedBugs.length})
          </button>
        </div>

        {/* Scrollable list */}
        <div className="max-h-[380px] overflow-y-auto p-6 flex flex-col gap-4">
          {(activeTab === "active" ? activeBugs : fixedBugs).map((bug) => (
            <div
              key={bug.id}
              className="group flex flex-col gap-2.5 p-4 rounded-xl border border-[#e7e5e4]/80 dark:border-[#2d2a2e]/80 bg-[#fffbf9]/40 dark:bg-[#1a1820]/40 transition-[border,background-color] hover:bg-[#fff9f6]/90 dark:hover:bg-[#1e1b26]/90 hover:border-purple-200 dark:hover:border-purple-950/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                      {bug.id}
                    </span>
                    <h3 className="font-sans text-sm font-bold text-[#1e1b19] dark:text-[#f4ece8] leading-tight">
                      {bug.title}
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-[#4a4452] dark:text-[#bab4c7] leading-normal mt-0.5">
                    {bug.description}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  {getStatusBadge(bug.status)}
                  {getTypeBadge(bug.type)}
                </div>
              </div>

              {bug.status !== "fixed" && bug.impact && (
                <div className="flex gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-[#1c1a20] border border-dashed border-[#e7e5e4] dark:border-[#2d2a2e] text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                  <AlertCircle className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Impact:{" "}
                    </strong>
                    {bug.impact}
                  </span>
                </div>
              )}
            </div>
          ))}

          {(activeTab === "active" ? activeBugs : fixedBugs).length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <p className="font-sans text-sm text-[#7b7483] dark:text-[#9c95a6]">
                Excellent! No bugs recorded in this category.
              </p>
            </div>
          )}
        </div>

        {/* Footer info/banner */}
        <div className="p-4 bg-[#fff8f5] dark:bg-[#16141a] border-t border-[#e7e5e4]/60 dark:border-[#2d2a2e]/60 flex items-center justify-between text-[11px] font-mono text-[#7b7483] dark:text-[#9c95a6]">
          <span className="flex items-center gap-1.5">
            <Info className="size-3.5" />
            RAGA Environment v1.0.0
          </span>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/joelvinaykumar/raga-fe/issues/new?template=bug_report.md"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-purple-600 px-2.5 py-1 font-semibold text-white transition-colors hover:bg-purple-700 dark:bg-[#9c7beb] dark:text-[#121115] dark:hover:bg-[#8a67e0]"
            >
              <Bug className="size-3" />
              Report bug
            </a>
            <a
              href="https://github.com/joelvinaykumar/raga-fe/issues"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-[#9c7beb] transition-colors"
            >
              GitHub Tracker <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
