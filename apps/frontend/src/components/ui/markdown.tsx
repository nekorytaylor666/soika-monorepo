import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {};

  return (
    <ReactMarkdown
      className="prose prose-sm max-w-none"
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);