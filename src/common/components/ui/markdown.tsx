import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { cn } from "@/common/utils/shadcn";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("max-w-none text-muted-foreground", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          h1: ({ children }) => <h1 className="mb-3 font-semibold text-foreground text-xl">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 font-semibold text-foreground text-lg">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 font-semibold text-base text-foreground">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
          li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
          a: ({ children, href }) => {
            const sanitizedUrl = defaultUrlTransform(href ?? "");
            if (sanitizedUrl === "") {
              return children;
            }

            return (
              <a href={sanitizedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {children}
              </a>
            );
          },
          code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>,
          pre: ({ children }) => <pre className="mb-4 overflow-x-auto rounded-md bg-muted p-3">{children}</pre>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
