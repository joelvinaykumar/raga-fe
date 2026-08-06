import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteKnowledgeBaseAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  kbName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteKnowledgeBaseAlertDialog({
  isOpen,
  onOpenChange,
  kbName,
  onConfirm,
  isDeleting,
}: DeleteKnowledgeBaseAlertDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (isDeleting) return;
        onOpenChange(open);
      }}
    >
      <AlertDialogContent className="border-border bg-popover text-popover-foreground sm:rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-2xl">
            Delete Knowledge Base
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{kbName}"? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
