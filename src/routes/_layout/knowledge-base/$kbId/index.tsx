import { DropzoneArea } from "@/components/DropzoneArea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "@/lib/axios";
import { supabase } from "@/lib/database";
import { humanReadableSize } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { File, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Route: /_layout/knowledge-base/$kbId
export const Route = createFileRoute("/_layout/knowledge-base/$kbId/")({
  component: KnowledgeBaseDetail,
});

function KnowledgeBaseDetail() {
  const { kbId } = Route.useParams(); // rag_id of the knowledge base
  const [files, setFiles] = useState<
    Array<{ id: string; filename: string; filesize: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [ragInfo, setRagInfo] = useState<{
    name: string;
    description?: string;
    top_k: number;
    chunk_size: number;
    embedding_model: string;
  } | null>(null);

  const fetchFiles = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await axios.get(`/list-docs/${kbId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setFiles(res.data);
    } catch (_error) {
      toast.error("Failed to fetch files");
    }
  };

  const fetchRagInfo = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await axios.get(`/rag/${kbId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setRagInfo(res.data);
    } catch (_error) {
      toast.error("Failed to fetch knowledge base info");
    }
  };

  useEffect(() => {
    Promise.all([fetchFiles(), fetchRagInfo()]).finally(() => {
      setLoadingData(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadFiles = async (selected: File[]) => {
    if (files.length + selected.length > 5) {
      toast.error("Maximum 5 files allowed per knowledge base.");
      return;
    }
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 20 MB size limit.`);
        continue;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        setLoading(true);
        await axios.post(`/upload-doc/${kbId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(`${file.name} uploaded`);
      } catch (_err) {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  };

  const handleDelete = async (fileId: string) => {
    try {
      await axios.delete(`/delete-doc`, { data: { file_id: fileId } });
      toast.success("File deleted");
      fetchFiles();
    } catch (_err) {
      toast.error("Failed to delete file");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-6">
      <div className="w-full max-w-3xl space-y-4">
        {loadingData ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Knowledge Base Header */}
            {ragInfo && (
              <Card className="w-full p-6 bg-card rounded-xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-3xl font-extrabold text-gray-800">
                    {ragInfo.name}
                  </CardTitle>
                  {ragInfo.description && (
                    <CardDescription className="text-gray-600 mt-2">
                      {ragInfo.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                      Top K: {ragInfo.top_k}
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      Chunk Size: {ragInfo.chunk_size}
                    </Badge>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Embedding: {ragInfo.embedding_model}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            <h2 className="text-2xl font-bold">Knowledge Base Files</h2>
            <p className="text-gray-300 mb-2">
              Upload up to <strong>5</strong> files, each no larger than{" "}
              <strong>20 MB</strong>.{" "}
              <span className="text-gray-400">
                ({files.length}/{5} files used)
              </span>
            </p>
            <DropzoneArea
              onFilesAdded={handleUploadFiles}
              disabled={loading}
              maxFiles={5}
              maxSize={20 * 1024 * 1024}
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <Card
                  key={file.id}
                  className="bg-card rounded-lg p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground font-medium truncate">
                      {file.filename}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{humanReadableSize(file.filesize)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
