import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PluggableList } from "unified";
import { Download, ExternalLink } from "lucide-react";

// Types
interface StyleConfig {
  codeTheme?: "light" | "dark" | "github" | "monokai";
  mathTheme?: "default" | "colorful";
  linkTarget?: "_blank" | "_self" | "_parent" | "_top";
  showLineNumbers?: boolean;
}

export interface MarkdownRendererProps {
  className?: string;
  children?: string | null;
  config?: StyleConfig;
  onLinkClick?: (url: string, event: React.MouseEvent) => void;
  onDownloadClick?: (url: string, filename: string) => void;
  enableMermaid?: boolean;
  maxWidth?: string;
}

// Link Component
const LinkRenderer: React.FC<{
  href: string;
  children: React.ReactNode;
  target: string;
  onClick?: (event: React.MouseEvent) => void;
  onDownload?: (url: string, filename: string) => void;
}> = ({ href, children, target, onClick }) => {
  const isDownload = href.match(/\.(pdf|doc|docx|zip|rar|tar|gz)$/i);
  const isExternal = href.startsWith("http") || href.startsWith("https");
  const isInternal = href.startsWith("#");

  return (
    <a
      href={href}
      target={target}
      onClick={onClick}
      className="inline-flex items-center gap-1 text-blue-600 underline decoration-blue-600 transition-colors hover:text-blue-800 hover:decoration-blue-800"
    >
      {children}
      {isDownload && <Download size={14} />}
      {isExternal && !isDownload && <ExternalLink size={14} />}
      {isInternal && <span className="text-xs">🔗</span>}
    </a>
  );
};

// Main Markdown Renderer Component
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  children,
  // className = "",
  config = {
    codeTheme: "monokai",
    mathTheme: "colorful",
    linkTarget: "_blank",
    showLineNumbers: false,
  },
  onLinkClick = (url, _) => {
    console.log("Link clicked:", url);
  },
  onDownloadClick = (url, filename) => {
    console.log("Download requested:", url, filename);
  },
  maxWidth = "100%",
}) => {
  const {
    codeTheme = "dark",
    linkTarget = "_blank",
    showLineNumbers = false,
  } = config;

  // Configure plugins
  const remarkPlugins = useMemo<PluggableList>(() => [remarkGfm], []);

  const rehypePlugins = useMemo<PluggableList>(
    () => [rehypeRaw, rehypeSlug],
    [],
  );

  // Custom components for react-markdown
  const components = useMemo(
    () => ({
      a: (props: any) => {
        const { href, children } = props;
        const isDownload = href.match(/\.(pdf|doc|docx|zip|rar|tar|gz)$/i);
        const isExternal = href.startsWith("http") || href.startsWith("https");
        const isInternal = href.startsWith("#");

        const handleClick = (event: React.MouseEvent) => {
          if (isDownload && onDownloadClick) {
            event.preventDefault();
            onDownloadClick(href, href.split("/").pop() || "download");
          } else if (isInternal) {
            event.preventDefault();
            const targetElement = document.querySelector(href);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth" });
            }
            if (onLinkClick) {
              onLinkClick(href, event);
            }
          } else if (onLinkClick) {
            onLinkClick(href, event);
          }
        };

        return (
          <LinkRenderer
            href={href}
            target={isExternal ? "_blank" : isInternal ? "_self" : linkTarget}
            onClick={handleClick}
            onDownload={onDownloadClick}
          >
            {children}
          </LinkRenderer>
        );
      },
      // Basic markdown elements with consistent styling

      table: (props: any) => (
        <div className="my-4 overflow-x-auto">
          <table
            {...props}
            className="min-w-full border-collapse rounded-lg border"
          />
        </div>
      ),
      thead: (props: any) => <thead {...props} className="bg-background" />,
      tbody: (props: any) => <tbody {...props} />,
      tr: (props: any) => <tr {...props} className="border-b" />,
      th: (props: any) => (
        <th
          {...props}
          className="border px-4 py-2 text-left text-sm font-semibold text-primary/70"
        />
      ),
      td: (props: any) => (
        <td {...props} className="border px-4 py-2 text-sm text-primary/70" />
      ),
      blockquote: (props: any) => (
        <blockquote
          {...props}
          className="border-l-4 border-muted-foreground pl-4 italic text-primary/60"
        />
      ),
      sup: (props: any) => {
        const className = String(props.className ?? "");
        const isCitation = className.includes("citation-ref");

        if (!isCitation) {
          return <sup {...props} />;
        }

        const preview =
          typeof props["data-preview"] === "string" &&
          props["data-preview"].trim().length > 0
            ? props["data-preview"]
            : "No source preview available.";
        const citationIndex =
          typeof props["data-citation-index"] === "string"
            ? props["data-citation-index"]
            : "source";

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <sup className="mx-0.5 cursor-help rounded-sm bg-primary/10 px-1 py-0.5 align-super font-mono text-[10px] font-semibold text-primary hover:bg-primary/20">
                {props.children}
              </sup>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="w-72 border-border bg-popover text-popover-foreground"
            >
              <div className="space-y-1.5 text-xs">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Citation {citationIndex}
                </p>
                <p className="text-muted-foreground line-clamp-4">{preview}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    }),
    [codeTheme, showLineNumbers, linkTarget, onLinkClick, onDownloadClick],
  );

  return (
    <div style={{ maxWidth }} className="markdown-renderer markdown">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
        // className={cn(
        //   "markdown-renderer markdown max-w-none text-primary",
        //   className,
        // )}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
