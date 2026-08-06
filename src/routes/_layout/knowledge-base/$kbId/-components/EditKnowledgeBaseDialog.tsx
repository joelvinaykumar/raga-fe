import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditKnowledgeBaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  description: string;
  onNameChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditKnowledgeBaseDialog({
  isOpen,
  onOpenChange,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSave,
  isSaving,
}: EditKnowledgeBaseDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (isSaving) return;
        onOpenChange(open);
      }}
    >
      <DialogContent className="border-border bg-popover text-popover-foreground sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Edit Knowledge Base
          </DialogTitle>
          <DialogDescription>
            Update the name and description for this knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Knowledge Base name"
              disabled={isSaving}
              className="border-input bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Optional description"
              rows={4}
              disabled={isSaving}
              className="border-input bg-background resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
