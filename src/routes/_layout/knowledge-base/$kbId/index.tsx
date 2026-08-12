import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useKnowledgeBaseWorkspace } from "./-hooks/use-knowledge-base-workspace";
import { KnowledgeBaseHeader } from "./-components/knowledge-base-header";
import { ChatMessages } from "./-components/chat-messages";
import { ChatInput } from "./-components/chat-input";
import { ConfigSidebar } from "./-components/config-sidebar";
import { McpConnectionDialog } from "./-components/mcp-connection-dialog";
import { EditKnowledgeBaseDialog } from "./-components/edit-knowledge-base-dialog";
import { DeleteKnowledgeBaseAlertDialog } from "./-components/delete-knowledge-base-alert-dialog";
import { DeleteFileAlertDialog } from "./-components/delete-file-alert-dialog";

// Route: /_layout/knowledge-base/$kbId
export const Route = createFileRoute("/_layout/knowledge-base/$kbId/")({
  validateSearch: (search: { q?: unknown }) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: KnowledgeBaseDetail,
});

function KnowledgeBaseDetail() {
  const { kbId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 95) {
          clearInterval(timer);
          return 95;
        }
        const diff = Math.random() * 12 + 5;
        return Math.min(oldProgress + diff, 95);
      });
    }, 120);

    return () => clearInterval(timer);
  }, []);

  const clearConsumedQueryFromUrl = () => {
    navigate({
      replace: true,
      search: { q: undefined },
    });
  };

  const {
    loadingData,
    ragInfo,
    promptSuggestions,
    chat,
    config,
    filesApi,
    mcp,
    saveConfig,
    editKb,
  } = useKnowledgeBaseWorkspace(kbId, {
    initialQuery: search.q,
    onInitialQueryExecuted: clearConsumedQueryFromUrl,
  });

  if (loadingData) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#fff8f5] px-6 dark:bg-[#121115]">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2 animate-fade-in">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7b7483] dark:text-[#9c95a6]">
              Syncing Dataset & Records
            </p>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1e1b19] dark:text-[#f4ece8]">
              Initializing Workspace
            </h2>
            <p className="text-xs text-[#4a4452] dark:text-[#9c95a6] leading-relaxed">
              Establishing database connection, importing active files, and
              restoring chat session history logs.
            </p>
          </div>

          <div className="relative w-full rounded-full bg-[#ccc3d4]/30 h-1.5 overflow-hidden dark:bg-[#2d2a2e]/30">
            <div
              className="h-full bg-gradient-to-r from-[#340075] to-[#6c40d6] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-[#7b7483] dark:text-[#9c95a6]">
            <span>Securing access pipeline</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {/* Center workspace: Header, Chat stream and Pill Input */}
      <section className="flex h-full flex-1 overflow-hidden px-6 py-6 lg:px-10">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
          <KnowledgeBaseHeader
            name={ragInfo?.name}
            description={ragInfo?.description}
            isStreaming={chat.isStreaming}
            onResetHistory={chat.resetHistory}
            onOpenMcp={() => mcp.setIsMcpDialogOpen(true)}
            onEdit={editKb.openEditDialog}
            onDelete={() => editKb.setIsDeleteDialogOpen(true)}
          />

          <ChatMessages
            isHistoryLoading={chat.isHistoryLoading}
            messages={chat.messages}
            promptSuggestions={promptSuggestions}
            onSuggestionClick={(prompt) => chat.submit(prompt)}
            scrollRef={chat.scrollRef}
          />

          <ChatInput
            query={chat.query}
            onQueryChange={chat.setQuery}
            onKeyPress={chat.handleKeyPress}
            onSubmit={() => chat.submit()}
            isStreaming={chat.isStreaming}
          />
        </div>
      </section>

      {/* Right sidebar: configuration + context files */}
      <ConfigSidebar
        llmModel={config.llmModel}
        onLlmModelChange={config.setLlmModel}
        topK={config.topK}
        onTopKChange={config.setTopK}
        embeddingModel={config.embeddingModel}
        onEmbeddingModelChange={config.setEmbeddingModel}
        savingConfig={config.savingConfig}
        onSaveConfig={saveConfig}
        files={filesApi.files}
        isUploading={filesApi.isUploading}
        isFilesLoading={filesApi.isFilesLoading}
        onUploadFiles={filesApi.uploadFiles}
        onDeleteFile={filesApi.triggerDeleteFile}
        maxFiles={filesApi.limits.maxFiles}
        maxSize={filesApi.limits.maxSize}
      />

      <EditKnowledgeBaseDialog
        isOpen={editKb.isEditDialogOpen}
        onOpenChange={editKb.setIsEditDialogOpen}
        name={editKb.editingName}
        description={editKb.editingDescription}
        onNameChange={editKb.setEditingName}
        onDescriptionChange={editKb.setEditingDescription}
        onSave={editKb.updateKnowledgebase}
        isSaving={editKb.isUpdatingKnowledgebase}
      />

      <DeleteKnowledgeBaseAlertDialog
        isOpen={editKb.isDeleteDialogOpen}
        onOpenChange={editKb.setIsDeleteDialogOpen}
        kbName={ragInfo?.name ?? ""}
        onConfirm={editKb.deleteKnowledgebase}
        isDeleting={editKb.isDeletingKnowledgebase}
      />

      <DeleteFileAlertDialog
        isOpen={filesApi.isFileDeleteDialogOpen}
        onOpenChange={filesApi.setIsFileDeleteDialogOpen}
        fileName={filesApi.fileToDelete?.filename ?? ""}
        onConfirm={filesApi.confirmDeleteFile}
        isDeleting={filesApi.isDeletingFile}
      />

      <McpConnectionDialog
        open={mcp.isMcpDialogOpen}
        onOpenChange={mcp.setIsMcpDialogOpen}
        kbId={kbId}
        mcpConfig={mcp.mcpConfig}
        mcpConfigMarkdown={mcp.mcpConfigMarkdown}
        mcpInstructionMarkdown={mcp.mcpInstructionMarkdown}
        copiedField={mcp.mcpCopiedField}
        onCopy={mcp.copyValue}
      />
    </div>
  );
}
