import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  markdown: string;
}

function validHref(value: string): string {
  if (value.startsWith("#")) return value;
  try {
    return new URL(value).protocol === "https:" ? value : "#";
  } catch {
    return "#";
  }
}

export default function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={validHref(href ?? "")} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        img: ({ alt }) => (
          <span className="markdown-image-placeholder">[Image: {alt || "preview hidden"}]</span>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
