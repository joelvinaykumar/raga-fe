import React, { Suspense } from "react";
import type { MarkdownRendererProps } from "./markdown-impl";

/**
 * Lazy boundary for the markdown renderer.
 *
 * The underlying implementation pulls in react-markdown plus the remark/rehype
 * plugins, which together are a sizable slice of the JS bundle. They're only
 * needed when markdown is actually rendered (chat messages, account page, MCP
 * dialog), never on first paint. Deferring the import here keeps that weight
 * out of the initial chunk.
 */
const MarkdownImpl = React.lazy(() => import("./markdown-impl"));

const MarkdownRenderer: React.FC<MarkdownRendererProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div
          className={props.className}
          // Reserve space and hint that content is loading without pulling in
          // any heavy UI; keeps layout stable while the chunk downloads.
          aria-busy="true"
        >
          {typeof props.children === "string" ? props.children : null}
        </div>
      }
    >
      <MarkdownImpl {...props} />
    </Suspense>
  );
};

export default MarkdownRenderer;
