import { useState } from "react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import type { RagDocument } from "../-lib/types";

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

/**
 * Manages the knowledge base's indexed documents: listing, uploading, and
 * deletion (including the confirm-dialog state). Reusable across any view that
 * manages a RAG's context files.
 */
export function useKnowledgeBaseFiles(kbId: string) {
  const [files, setFiles] = useState<RagDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<RagDocument | null>(null);
  const [isFileDeleteDialogOpen, setIsFileDeleteDialogOpen] = useState(false);

  const refreshFiles = async () => {
    try {
      setIsFilesLoading(true);
      const filesRes = await axios.get(`/rag/${kbId}/documents`);
      setFiles(filesRes.data);
    } catch {
      toast.error("Failed to refresh index repository list.");
    } finally {
      setIsFilesLoading(false);
    }
  };

  const uploadFiles = async (selected: File[]) => {
    if (files.length + selected.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed per knowledge base.`);
      return;
    }
    setIsUploading(true);
    for (const file of selected) {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name} exceeds the 20MB limit.`);
        continue;
      }
      const formData = new FormData();
      formData.append("files", file);

      try {
        await axios.post(`/rag/${kbId}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(`Indexed successfully: ${file.name}`);
      } catch {
        toast.error(`Indexed failed: ${file.name}`);
      }
    }
    await refreshFiles();
    setIsUploading(false);
  };

  const triggerDeleteFile = (file: RagDocument) => {
    setFileToDelete(file);
    setIsFileDeleteDialogOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    try {
      await axios.delete(`/rag/${kbId}/documents/${fileToDelete.id}`);
      toast.success("Indexed chunk removed successfully");
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setIsFileDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete selected context document chunk");
    } finally {
      setIsDeletingFile(false);
      setFileToDelete(null);
    }
  };

  return {
    files,
    setFiles,
    isUploading,
    isFilesLoading,
    setIsFilesLoading,
    refreshFiles,
    uploadFiles,
    // deletion
    isDeletingFile,
    fileToDelete,
    isFileDeleteDialogOpen,
    setIsFileDeleteDialogOpen,
    triggerDeleteFile,
    confirmDeleteFile,
    limits: { maxFiles: MAX_FILES, maxSize: MAX_SIZE_BYTES },
  };
}
