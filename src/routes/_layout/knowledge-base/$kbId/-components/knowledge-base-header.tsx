import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Blocks, History, MoreVertical } from "lucide-react";

interface KnowledgeBaseHeaderProps {
  name?: string;
  description?: string;
  isStreaming: boolean;
  onResetHistory: () => void;
  onOpenMcp: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function KnowledgeBaseHeader({
  name,
  description,
  isStreaming,
  onResetHistory,
  onOpenMcp,
  onEdit,
  onDelete,
}: KnowledgeBaseHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-border pb-4 w-full">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-3xl font-bold leading-none text-foreground truncate">
            {name}
          </h1>
        </div>
        {description && (
          <p className="font-sans text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Tooltipped Reset History Icon Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isStreaming}
              onClick={onResetHistory}
              className="h-8 w-8 border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm rounded-lg"
            >
              <History className="size-4" />
              <span className="sr-only">Reset History</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset chat history</p>
          </TooltipContent>
        </Tooltip>

        {/* Copy MCP Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenMcp}
          className="h-8 gap-1.5 border-[#ccc3d4] dark:border-[#4a4452] bg-white dark:bg-[#16141a] text-xs font-semibold text-foreground hover:bg-accent hover:text-[#340075] dark:hover:text-[#9c7beb] shadow-sm rounded-lg"
        >
          <Blocks className="size-3.5 text-[#340075] dark:text-[#9c7beb]" />
          Copy MCP
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 border-border bg-popover text-popover-foreground"
          >
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onEdit();
              }}
              className="cursor-pointer"
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onDelete();
              }}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
