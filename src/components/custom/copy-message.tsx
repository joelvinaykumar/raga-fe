import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyMessageProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string;
}

export const CopyMessage: React.FC<CopyMessageProps> = ({ content }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <button
      className="inline-flex items-center gap-1 p-1 text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="size-3 text-green-500" strokeWidth={4} />
      ) : (
        <Copy className="size-3" />
      )}
      <p>{copied ? "Copied" : "Copy"}</p>
    </button>
  );
};
