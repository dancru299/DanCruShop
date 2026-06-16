"use client";

import { useRef, useState } from "react";
import {
  BoldIcon,
  EyeIcon,
  Heading2Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  PencilLineIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

type Tab = "write" | "preview";

type ToolAction = {
  icon: typeof BoldIcon;
  label: string;
  /** Wraps the selection, or inserts a line prefix when `block` is set. */
  before: string;
  after?: string;
  block?: boolean;
  placeholder: string;
};

const TOOL_ACTIONS: ToolAction[] = [
  { icon: BoldIcon, label: "Đậm", before: "**", after: "**", placeholder: "chữ đậm" },
  { icon: ItalicIcon, label: "Nghiêng", before: "*", after: "*", placeholder: "chữ nghiêng" },
  { icon: Heading2Icon, label: "Tiêu đề", before: "## ", block: true, placeholder: "Tiêu đề mục" },
  { icon: ListIcon, label: "Danh sách", before: "- ", block: true, placeholder: "Mục danh sách" },
  { icon: LinkIcon, label: "Liên kết", before: "[", after: "](https://)", placeholder: "văn bản" },
];

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [tab, setTab] = useState<Tab>("write");

  function applyAction(action: ToolAction) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || action.placeholder;

    let nextValue: string;
    let nextStart: number;
    let nextEnd: number;

    if (action.block) {
      // Prefix the start of the line containing the selection.
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      nextValue =
        value.slice(0, lineStart) + action.before + value.slice(lineStart);
      nextStart = start + action.before.length;
      nextEnd = end + action.before.length;
    } else {
      const after = action.after ?? "";
      nextValue =
        value.slice(0, start) +
        action.before +
        selected +
        after +
        value.slice(end);
      nextStart = start + action.before.length;
      nextEnd = nextStart + selected.length;
    }

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {TOOL_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              title={action.label}
              aria-label={action.label}
              disabled={disabled || tab === "preview"}
              onClick={() => applyAction(action)}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <action.icon aria-hidden="true" className="size-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          <TabButton
            active={tab === "write"}
            onClick={() => setTab("write")}
            icon={PencilLineIcon}
          >
            Soạn
          </TabButton>
          <TabButton
            active={tab === "preview"}
            onClick={() => setTab("preview")}
            icon={EyeIcon}
          >
            Xem trước
          </TabButton>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="block min-h-48 w-full resize-y bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
      ) : (
        <div className="min-h-48 px-3 py-2.5">
          {value.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa có nội dung để xem trước.
            </p>
          )}
        </div>
      )}

      <p className="border-t bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        Hỗ trợ Markdown: **đậm**, *nghiêng*, ## tiêu đề, - danh sách, [liên
        kết](url).
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof BoldIcon;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {children}
    </button>
  );
}
