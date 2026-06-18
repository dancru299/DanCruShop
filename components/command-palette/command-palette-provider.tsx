"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openPalette: () => void;
  closePalette: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);

  if (!ctx) {
    throw new Error(
      "useCommandPalette must be used within <CommandPaletteProvider>"
    );
  }

  return ctx;
}

export function CommandPaletteProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  // ── Global hotkey listener ──────────────────────────────────────
  // ⌘/Ctrl+K → open always (toggle). / → open only when not typing.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const cmdK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const slash = event.key === "/" && !typing;

      if (cmdK) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (slash) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, openPalette, closePalette }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}