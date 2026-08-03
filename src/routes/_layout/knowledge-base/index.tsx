import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { supabase } from "@/lib/database";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export const Route = createFileRoute("/_layout/knowledge-base/")({
  component: RouteComponent,
});

// Zod schema for Knowledge Base creation
const knowledgeBaseSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  top_k: z.number().min(0).default(0.5),
  embedding_model: z
    .enum(["text-embedding-ada-002"])
    .default("text-embedding-ada-002"),
});

// Zod schema for editing Knowledge Base name/description
const editKnowledgeBaseSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
});

type KnowledgeBase = {
  rag_id: string;
  name: string;
  description?: string;
};

function RouteComponent() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);
  const [deletingKb, setDeletingKb] = useState<KnowledgeBase | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    resolver: zodResolver(knowledgeBaseSchema),
    defaultValues: {
      name: "",
      description: "",
      top_k: 0.5,
      embedding_model: "text-embedding-ada-002",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(editKnowledgeBaseSchema),
    defaultValues: { name: "", description: "" },
  });

  const openEditDialog = (kb: KnowledgeBase) => {
    setEditingKb(kb);
    editForm.reset({ name: kb.name, description: kb.description ?? "" });
  };

  const fetchKnowledgeBases = async () => {
    setLoadingData(true);
    try {
      // Retrieve Supabase session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await axios.get("/rag/all/", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setKnowledgeBases(res.data);
    } catch (_error) {
      // error handling is done globally in axios interceptor
    } finally {
      setLoadingData(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const onSubmit = async (data: z.infer<typeof knowledgeBaseSchema>) => {
    setLoading(true);
    try {
      await axios.post("/rag", { ...data, top_k: Math.round(data.top_k) }); // cast top_k to integer
      toast.success("Knowledge Base created successfully");
      setShowForm(false);
      form.reset();
      fetchKnowledgeBases();
    } catch (_error) {
      // errors are handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (
    data: z.infer<typeof editKnowledgeBaseSchema>,
  ) => {
    if (!editingKb) return;
    setSaving(true);
    try {
      await axios.patch(`/rag/${editingKb.rag_id}`, {
        name: data.name,
        description: data.description,
      });
      toast.success("Knowledge Base updated successfully");
      setEditingKb(null);
      fetchKnowledgeBases();
    } catch (_error) {
      // errors are handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingKb) return;
    setDeleting(true);
    try {
      await axios.delete(`/rag/${deletingKb.rag_id}`);
      toast.success("Knowledge Base deleted");
      setDeletingKb(null);
      fetchKnowledgeBases();
    } catch (_error) {
      // errors are handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <h1 className="text-3xl font-extrabold">Knowledge Bases</h1>
        <Button variant="outline" onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="mr-2 h-4 w-4" />{" "}
          {showForm ? "Cancel" : "Add Knowledge Base"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle>Create Knowledge Base</CardTitle>
            <CardDescription>
              Enter the details for a new knowledge base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Knowledge Base name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="top_k"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Top K</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.5"
                          step="0.1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="embedding_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Embedding Model</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-embedding-ada-002">
                              text-embedding-ada-002
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Base Grid */}
      {loadingData ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-gray-800/30 rounded animate-pulse"
            />
          ))}
        </div>
      ) : knowledgeBases.length === 0 ? (
        <div className="grid place-items-center h-64">
          <p className="text-muted-foreground">
            No Knowledge Bases found. Click "Add Knowledge Base" to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {knowledgeBases.map((kb) => (
            <div key={kb.rag_id} className="relative">
              <Link
                to="/knowledge-base/$kbId"
                params={{ kbId: kb.rag_id }}
                className="block"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{kb.name}</CardTitle>
                    {kb.description && (
                      <CardDescription className="line-clamp-3 h-20">
                        {kb.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="flex justify-end">
                    <Button variant="outline">View</Button>
                  </CardFooter>
                </Card>
              </Link>
              <div className="absolute right-3 top-3 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEditDialog(kb)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setDeletingKb(kb)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Edit Knowledge Base Dialog */}
      <Dialog
        open={!!editingKb}
        onOpenChange={(open) => !open && setEditingKb(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Knowledge Base</DialogTitle>
            <DialogDescription>
              Update the name and description of the knowledge base.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdate)}
              className="space-y-6"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Knowledge Base name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingKb(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Knowledge Base Alert Dialog */}
      <AlertDialog
        open={!!deletingKb}
        onOpenChange={(open) => !open && setDeletingKb(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Base</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingKb?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingKb(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
