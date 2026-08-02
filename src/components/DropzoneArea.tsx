import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

type Props = {
  onFilesAdded: (files: File[]) => void;
  disabled: boolean;
  maxFiles: number;
  maxSize: number; // bytes
};

export function DropzoneArea({
  onFilesAdded,
  disabled,
  maxFiles,
  maxSize,
}: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAdded(acceptedFiles);
    },
    [onFilesAdded],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [],
        "text/html": [],
      },
      multiple: true,
      maxSize,
      maxFiles,
      disabled,
    });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary"} ${isDragActive ? "bg-primary/10" : "bg-neutral-100/50"}`}
    >
      <input {...getInputProps()} />
      <Upload className="h-8 w-8 text-primary mb-2" />
      <p className="text-sm text-muted-foreground">
        Drag & drop files here, or click to select
      </p>
      {fileRejections.length > 0 && (
        <ul className="mt-2 text-xs text-red-600 space-y-1">
          {fileRejections.map((r) => (
            <li key={r.file.name}>
              ❗ {r.file.name} – {r.errors[0].message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
