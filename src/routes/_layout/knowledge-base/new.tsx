import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axios from "@/lib/axios";

export const Route = createFileRoute("/_layout/knowledge-base/new")({
  component: CreateKnowledgeBasePage,
});

const createKnowledgeBaseSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(80, { message: "Name must be at most 80 characters" }),
  description: z
    .string()
    .max(200, { message: "Description must be 200 characters or less" })
    .optional()
    .or(z.literal("")),
  top_k: z
    .number()
    .int({ message: "Top-K must be a whole number" })
    .min(1, { message: "Top-K must be at least 1" })
    .max(10, { message: "Top-K must be at most 10" }),
  embedding_model: z.enum(["text-embedding-3-large", "text-embedding-ada-002"]),
});

function CreateKnowledgeBasePage() {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof createKnowledgeBaseSchema>>({
    resolver: zodResolver(createKnowledgeBaseSchema),
    defaultValues: {
      name: "",
      description: "",
      top_k: 8,
      embedding_model: "text-embedding-3-large",
    },
  });

  const description = form.watch("description") ?? "";
  const descriptionCount = useMemo(() => description.length, [description]);

  const { mutateAsync: createKnowledgeBase, isPending } = useMutation({
    mutationFn: async (payload: z.infer<typeof createKnowledgeBaseSchema>) => {
      const res = await axios.post("/rag", {
        name: payload.name.trim(),
        description: payload.description?.trim() || undefined,
        top_k: payload.top_k,
        chunk_size: 1000,
        embedding_model: payload.embedding_model,
      });
      return res.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["list-knowledge-bases"],
      });
      toast.success("Knowledge base created successfully.");
      if (data?.rag_id) {
        window.location.href = `/knowledge-base/${data.rag_id}`;
      }
    },
    onError: () => {
      toast.error("Failed to create knowledge base.");
    },
  });

  const onSubmit = async (
    values: z.infer<typeof createKnowledgeBaseSchema>,
  ) => {
    await createKnowledgeBase(values);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-full w-full bg-[#fff8f5] px-6 py-8 text-[#1e1b19] dark:bg-[#121115] dark:text-[#f4ece8] lg:px-10"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#d8d1e1] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5d5685] dark:border-[#3f3850] dark:bg-[#1a1820] dark:text-[#c7bce6]">
            <Sparkles className="size-3.5" />
            New instance setup
          </p>
          <h1 className="text-3xl font-bold leading-tight text-[#1e1b19] dark:text-[#f4ece8]">
            Create a Knowledge Base
          </h1>
          <p className="text-sm text-[#4a4452] dark:text-[#9c95a6]">
            Define retrieval behavior before uploading documents.
          </p>
        </div>

        <Card className="rounded-2xl border border-[#d8d1e1] bg-white shadow-[0_22px_58px_-34px_rgba(50,33,88,0.35)] dark:border-[#3a3446] dark:bg-[#19171f]">
          <CardHeader className="space-y-1 border-b border-[#ece5f4] pb-5 dark:border-[#2d2938]">
            <CardTitle className="text-xl font-bold">
              Instance details
            </CardTitle>
            <CardDescription className="text-[#6c6675] dark:text-[#9c95a6]">
              Name, describe, and configure vector retrieval defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-[0.16em] text-[#5e5767] dark:text-[#b3acbf]">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Internal Docs QA"
                          className="h-11 rounded-xl border-[#d5cede] bg-white focus-visible:ring-[#5c43a9] dark:border-[#4a4452] dark:bg-[#1f1c26]"
                          {...field}
                        />
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
                      <div className="mb-1 flex items-center justify-between">
                        <FormLabel className="text-xs uppercase tracking-[0.16em] text-[#5e5767] dark:text-[#b3acbf]">
                          Description
                        </FormLabel>
                        <span className="text-[11px] text-[#7b7483] dark:text-[#9c95a6]">
                          {descriptionCount}/200
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          maxLength={200}
                          placeholder="Confluence sync, onboarding playbooks, and product FAQs"
                          className="min-h-28 resize-none rounded-xl border-[#d5cede] bg-white focus-visible:ring-[#5c43a9] dark:border-[#4a4452] dark:bg-[#1f1c26]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="top_k"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-[0.16em] text-[#5e5767] dark:text-[#b3acbf]">
                          Top-K (1-10)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            step={1}
                            className="h-11 rounded-xl border-[#d5cede] bg-white focus-visible:ring-[#5c43a9] dark:border-[#4a4452] dark:bg-[#1f1c26]"
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(Number(event.target.value))
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
                        <FormLabel className="text-xs uppercase tracking-[0.16em] text-[#5e5767] dark:text-[#b3acbf]">
                          Embedding model
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-11 rounded-xl border-[#d5cede] bg-white focus:ring-[#5c43a9] dark:border-[#4a4452] dark:bg-[#1f1c26]">
                              <SelectValue placeholder="Select embedding model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text-embedding-3-large">
                                text-embedding-3-large
                              </SelectItem>
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
                </div>

                <CardFooter className="mt-1 flex justify-end gap-2 border-t border-[#ece5f4] px-0 pt-5 dark:border-[#2d2938]">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      window.location.href = "/knowledge-base";
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-[#340075] px-5 text-white hover:bg-[#340075]/90 dark:bg-[#6c40d6] dark:hover:bg-[#6c40d6]/90"
                  >
                    {isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      "Create instance"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
