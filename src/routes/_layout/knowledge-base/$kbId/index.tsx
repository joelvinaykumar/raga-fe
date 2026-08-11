import { Skeleton } from "@/components/ui/skeleton";
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
  component: KnowledgeBaseDetail,
});

function KnowledgeBaseDetail() {
  const { kbId } = Route.useParams();
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
  } = useKnowledgeBaseWorkspace(kbId);

  if (loadingData) {
    return (
      <div className="flex h-full w-full flex-col gap-6 p-10 bg-background">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-4">
          <Skeleton className="lg:col-span-3 h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden text-foreground">
      {/* Center workspace: Header, Chat stream and Pill Input */}
      <section className="flex flex-1 flex-col h-full overflow-hidden border-r border-border px-6 py-6 lg:px-10">
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
