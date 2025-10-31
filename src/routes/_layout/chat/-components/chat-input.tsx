import { Dispatch, SetStateAction, useRef, useState } from "react";
import { ArrowUp, Loader, Loader2, Paperclip, X } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, humanReadableSize } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileAttachment } from "..";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Model } from "@/lib/types";
import axios from "@/lib/axios";

type IChatInput = {
  session_id?: string;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  model?: string;
  setModel?: Dispatch<SetStateAction<Model>>;
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
  model = "gpt-4o-mini",
  setModel,
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
          "w-full rounded-lg border border-border bg-secondary p-2 shadow-sm active:shadow-md",
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
          <div className="mb-1">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex w-fit items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs backdrop-blur-sm"
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
        <Textarea
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your query here ..."
          className="resize-none border-none shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            {session_id && (
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
                    {/* {isUploadingFiles ? "Uploading ..." : "Upload"} */}
                    Upload
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supports .pdf, .docx format(s)</TooltipContent>
              </Tooltip>
            )}

            {setModel && (
              <Select
                value={model}
                onValueChange={(value) => setModel(value as Model)}
              >
                <SelectTrigger className="w-fit h-6 text-xs">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT 4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT 4o Mini</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            size="icon-sm"
            className="rounded-full"
            disabled={
              query?.length === 0 ||
              loading ||
              isUploadingAttachment ||
              isDeletingAttachment
            }
            onClick={onSubmit}
          >
            {loading || isUploadingAttachment || isDeletingAttachment ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
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
