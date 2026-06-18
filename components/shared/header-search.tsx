"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "Search Office, Canva, ChatGPT...",
  "Search accounts, license keys...",
  "Search source code, templates...",
  "Search AI tools, VPN...",
];

export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate the placeholder text. setState runs inside an async interval
  // callback (not in the effect body), so it does not cascade renders.
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % PLACEHOLDERS.length);
    }, 3000);

    return () => clearInterval(id);
  }, []);

  // Focus shortcuts: "/" (when not already typing) or ⌘/Ctrl+K.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const slash = event.key === "/" && !typing;
      const cmdK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (slash || cmdK) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn("relative w-full", className)}
    >
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={PLACEHOLDERS[placeholderIndex]}
        aria-label="Search products"
        className="h-11 rounded-full border-border/80 bg-card pl-10 pr-16 text-sm shadow-sm"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground lg:inline-flex">
        ⌘K
      </kbd>
    </form>
  );
}
