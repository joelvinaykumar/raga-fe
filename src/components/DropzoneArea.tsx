import {
  useCallback,
  type HTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle } from "lucide-react";

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

  const rootProps = getRootProps() as unknown as HTMLAttributes<HTMLDivElement>;
  const inputProps =
    getInputProps() as unknown as InputHTMLAttributes<HTMLInputElement>;

  return (
    <div
      {...rootProps}
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary"} ${isDragActive ? "bg-primary/10" : "bg-primary/10"}`}
    >
      <input {...inputProps} />
      <Upload className="h-8 w-8 text-primary mb-2" />
      <p className="text-sm text-muted-foreground dark:text-foreground text-center">
        Drag & drop files here, or click to select
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1 text-center font-mono">
        Max. 20MB / file • Up to 5 documents per RAG
      </p>
      {fileRejections.length > 0 && (
        <ul className="mt-2 text-xs text-red-600 space-y-1">
          {fileRejections.map((r) => (
            <li key={r.file.name} className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>
                {r.file.name} – {r.errors[0].message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
