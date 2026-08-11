import { DropzoneArea } from "@/components/dropzone-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { humanReadableSize } from "@/lib/utils";
import { FileText, FolderOpen, Loader2, Sliders, X } from "lucide-react";
import type { RagDocument } from "../-lib/types";

interface ConfigSidebarProps {
  // config
  llmModel: string;
  onLlmModelChange: (value: string) => void;
  topK: number;
  onTopKChange: (value: number) => void;
  embeddingModel: string;
  onEmbeddingModelChange: (value: string) => void;
  savingConfig: boolean;
  onSaveConfig: () => void;
  // files
  files: RagDocument[];
  isUploading: boolean;
  isFilesLoading: boolean;
  onUploadFiles: (selected: File[]) => void;
  onDeleteFile: (file: RagDocument) => void;
  maxFiles: number;
  maxSize: number;
}

export function ConfigSidebar({
  llmModel,
  onLlmModelChange,
  topK,
  onTopKChange,
  embeddingModel,
  onEmbeddingModelChange,
  savingConfig,
  onSaveConfig,
  files,
  isUploading,
  isFilesLoading,
  onUploadFiles,
  onDeleteFile,
  maxFiles,
  maxSize,
}: ConfigSidebarProps) {
  return (
    <aside className="w-80 h-full overflow-y-auto no-scrollbar border-l border-border bg-card px-5 py-6 flex flex-col gap-6 text-foreground">
      {/* Config Header and save CTA */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 text-foreground">
          <Sliders className="size-4 text-primary" />
          <h3 className="font-serif text-lg font-bold leading-none">
            Configuration
          </h3>
        </div>
        <Button
          size="sm"
          onClick={onSaveConfig}
          disabled={savingConfig}
          className="bg-primary text-primary-foreground font-sans text-xs px-3 h-7 rounded-lg shadow-sm font-semibold border border-primary hover:bg-primary/95 hover:-translate-y-0.5 transition"
        >
          {savingConfig ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Config inputs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">
            LLM Model
          </label>
          <Select value={llmModel} onValueChange={onLlmModelChange}>
            <SelectTrigger className="h-10 rounded-lg border-input bg-background font-mono text-xs text-foreground focus:ring-primary">
              <SelectValue placeholder="Select LLM model" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
              <SelectItem value="gpt-4-turbo-preview">
                gpt-4-turbo-preview
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">
              Top-K Results
            </label>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-muted border border-input rounded-md text-muted-foreground">
              {topK}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="font-mono text-[10px] text-muted-foreground">
              1
            </span>
            <input
              type="range"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => onTopKChange(Number(e.target.value))}
              className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="font-mono text-[10px] text-muted-foreground">
              20
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">
            Embedding Model
          </label>
          <Select value={embeddingModel} onValueChange={onEmbeddingModelChange}>
            <SelectTrigger className="h-10 rounded-lg border-input bg-background font-mono text-xs text-foreground focus:ring-primary">
              <SelectValue placeholder="Select Embedding model" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem value="text-embedding-3-large">
                text-embedding-3-large
              </SelectItem>
              <SelectItem value="text-embedding-ada-002">
                text-embedding-ada-002
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-border my-2" />

      <ContextFilesPanel
        files={files}
        isUploading={isUploading}
        isFilesLoading={isFilesLoading}
        onUploadFiles={onUploadFiles}
        onDeleteFile={onDeleteFile}
        maxFiles={maxFiles}
        maxSize={maxSize}
      />
    </aside>
  );
}

interface ContextFilesPanelProps {
  files: RagDocument[];
  isUploading: boolean;
  isFilesLoading: boolean;
  onUploadFiles: (selected: File[]) => void;
  onDeleteFile: (file: RagDocument) => void;
  maxFiles: number;
  maxSize: number;
}

function ContextFilesPanel({
  files,
  isUploading,
  isFilesLoading,
  onUploadFiles,
  onDeleteFile,
  maxFiles,
  maxSize,
}: ContextFilesPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground border-b border-border pb-2">
        <FolderOpen className="size-4 text-primary" />
        <h3 className="font-serif text-base font-bold">Context Files</h3>
      </div>

      {/* Drap files dropzone */}
      <div className="w-full">
        <DropzoneArea
          onFilesAdded={onUploadFiles}
          disabled={isUploading}
          maxFiles={maxFiles}
          maxSize={maxSize}
        />
      </div>

      {/* Uploaded Files list */}
      <div className="flex flex-col gap-2 max-h-fit overflow-y-auto no-scrollbar">
        {isFilesLoading && files.length === 0 ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 border border-border/40 p-3 rounded-lg bg-background/30"
                style={{ opacity: 1 - i * 0.25 }}
              >
                <Loader2 className="size-4 animate-spin text-primary flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <Skeleton className="h-3 w-3/4 rounded bg-[#e7e5e4] dark:bg-[#2d2a2e]" />
                  <Skeleton className="h-2 w-1/4 rounded bg-[#e7e5e4] dark:bg-[#2d2a2e]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {isUploading && (
              <div className="flex items-center gap-2 border border-primary/45 border-dashed p-3 rounded-lg bg-primary/5 animate-pulse">
                <Loader2 className="size-4 text-primary animate-spin flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-mono text-xs font-semibold text-primary truncate">
                    Uploading & indexing...
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
                    Writing to secure vectorstore
                  </span>
                </div>
              </div>
            )}
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between border border-border p-3 rounded-lg bg-background/60 hover:bg-background transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="size-4 text-primary flex-shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold text-foreground truncate">
                      {file.filename}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
                      {humanReadableSize(file.filesize)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteFile(file)}
                  className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-red-50 dark:hover:bg-[#ba1a1a]/10 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {files.length === 0 && !isUploading && (
              <p className="text-center font-mono text-[10px] text-muted-foreground py-4">
                No indexed files in context
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
