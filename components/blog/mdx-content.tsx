import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

type MdxContentProps = {
  content: string;
  className?: string;
};

export function MdxContent({ content, className }: MdxContentProps) {
  return (
    <article
      data-slot="mdx-content"
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert",
        "prose-headings:font-bold prose-headings:tracking-tight",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-img:rounded-lg prose-img:border prose-img:bg-muted/30",
        "prose-pre:rounded-lg prose-pre:border prose-pre:bg-muted/50 dark:prose-pre:bg-muted/20 prose-pre:p-4",
        "prose-code:text-foreground prose-code:bg-muted/40 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}
