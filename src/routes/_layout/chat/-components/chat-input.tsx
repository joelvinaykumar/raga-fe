import { Dispatch, SetStateAction, useRef, useState } from "react";
import { Loader, Loader2, Paperclip, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, humanReadableSize } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import axios from "@/lib/axios";

type FileAttachment = {
  filename: string;
  id: number;
  filesize: number;
  upload_timestamp: string;
};

type IChatInput = {
  session_id?: string;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  attachments?: FileAttachment[];
  setAttachments?: Dispatch<SetStateAction<FileAttachment[]>>;
  className?: string;
  onSubmit: () => void;
  onUpload?: () => void;
  loading?: boolean;
};

export const ChatInput: React.FC<IChatInput> = ({
  session_id,
  query = "",
  setQuery,
  attachments = [],
  onUpload,
  className = "",
  onSubmit,
  loading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState<{
    open: boolean;
    id: string;
  }>({ open: false, id: "" });

  const { mutateAsync: uploadAttachment, isPending: isUploadingAttachment } =
    useMutation({
      mutationKey: ["upload-attachment"],
      mutationFn: ({ file }: { file: File }) => {
        const formData = new FormData();
        formData.append("file", file);
        return axios.post(`/upload-doc/${session_id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      },
      onSuccess: () => {
        setDeleteModalVisible({ open: false, id: "" });
        onUpload?.();
      },
    });

  const { mutateAsync: deleteAttachment, isPending: isDeletingAttachment } =
    useMutation({
      mutationKey: ["delete-attachment"],
      mutationFn: (file_id: string) =>
        axios.delete("/delete-doc", {
          data: { file_id },
        }),
      onSuccess: () => {
        setDeleteModalVisible({ open: false, id: "" });
        onUpload?.();
      },
    });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "w-full rounded-full border border-[#d8d2e0] bg-white px-4 py-2.5 backdrop-blur-xl shadow-[0_10px_28px_-18px_rgba(44,28,90,0.45),0_3px_8px_-4px_rgba(30,27,25,0.25)] dark:border-[#4a4452] dark:bg-[#1b1820]",
          "duration-1000 animate-in slide-in-from-bottom-2",
          className,
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.html"
          onChange={(e) => {
            console.log({ files: e.target.files?.length });
            if (e.target.files?.length)
              uploadAttachment({ file: e.target.files[0] });
          }}
          className="hidden"
        />
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex w-fit items-center gap-1 rounded-full border border-border bg-background/80 px-2.5 py-1 text-xs backdrop-blur-sm"
              >
                <Paperclip className="h-3 w-3 flex-shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <span className="max-w-[80px] truncate font-medium">
                    {file.filename}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {humanReadableSize(file.filesize)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteModalVisible({
                      open: true,
                      id: String(file?.id),
                    })
                  }
                  className="ml-1 flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <Textarea
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Prompt here..."
            className="min-h-8 flex-1 resize-none border-none bg-transparent px-1 py-1.5 text-[17px] shadow-none placeholder:text-[#6f6994]/85 focus-visible:ring-0 dark:placeholder:text-[#b7aecf]"
          />
          <div className="flex items-center gap-2">
            {/* {session_id && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="link"
                    size="xs"
                    disabled={loading}
                    // loading={isUploadingFiles}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-muted-foreground"
                  >
                    <Paperclip className="mr-1 size-4" />
                    {isUploadingFiles ? "Uploading ..." : "Upload"}
                    Upload
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supports .pdf, .docx format(s)</TooltipContent>
              </Tooltip>
            )} */}

            {/* Model selection is fixed server-side (gpt-4o-mini); no chooser is shown. */}
            <Button
              type="button"
              className="h-9 rounded-full bg-transparent px-3 text-[#5d5685] shadow-none hover:bg-[#f4f0ff] hover:text-[#3f3770] dark:text-[#d2c9ef] dark:hover:bg-[#292334]"
              disabled={
                query?.length === 0 ||
                loading ||
                isUploadingAttachment ||
                isDeletingAttachment
              }
              onClick={() => onSubmit()}
            >
              {loading || isUploadingAttachment || isDeletingAttachment ? (
                <Loader className="mr-1 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 size-4" />
              )}
              Generate
            </Button>
          </div>
        </div>
      </motion.div>
      <AlertDialog
        open={deleteModalVisible.open}
        onOpenChange={(value) => setDeleteModalVisible({ open: value, id: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogHeader>Confirm Action</AlertDialogHeader>
            <AlertDialogDescription>
              You will delete app's context for this session permanently. Are
              you sure you want to delete this file?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <Button
            type="button"
            className="bg-destructive"
            disabled={isDeletingAttachment}
            onClick={() => deleteAttachment(deleteModalVisible.id)}
          >
            {isDeletingAttachment && <Loader2 className="animate-spin" />}
            {isDeletingAttachment ? "Deleting File ..." : "Confirm, Delete"}
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
