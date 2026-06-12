"use client";

import Link from "next/link";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  BanIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PackagePlusIcon,
  PaperclipIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 176;

const actionMenuIcons = {
  ban: BanIcon,
  bundle: PackagePlusIcon,
  "external-link": ExternalLinkIcon,
  key: KeyRoundIcon,
  loader: Loader2Icon,
  paperclip: PaperclipIcon,
  pencil: PencilIcon,
  restore: RotateCcwIcon,
  trash: Trash2Icon,
};

type ActionMenuIconName = keyof typeof actionMenuIcons;

type MenuPosition = {
  left: number;
  placement: "bottom" | "top";
  top: number;
};

type AdminActionMenuProps = {
  children: ReactNode;
  label?: string;
};

type ActionMenuContextValue = {
  close: () => void;
};

const ActionMenuContext = createContext<ActionMenuContextValue | null>(null);

function useActionMenu() {
  return useContext(ActionMenuContext);
}

export function AdminActionMenu({
  children,
  label = "Open actions",
}: AdminActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function updatePosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 8
    );
    const hasBottomRoom = rect.bottom + 220 < window.innerHeight;

    setPosition({
      left,
      placement: hasBottomRoom ? "bottom" : "top",
      top: hasBottomRoom ? rect.bottom + 8 : rect.top - 8,
    });
  }

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        size="icon-sm"
        variant="outline"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontalIcon aria-hidden="true" />
      </Button>

      {open && position
        ? createPortal(
            <ActionMenuContext.Provider
              value={{ close: () => setOpen(false) }}
            >
              <div
                ref={menuRef}
                role="menu"
                className={cn(
                  "fixed z-[80] w-44 rounded-lg border bg-card p-1 text-card-foreground shadow-xl shadow-background/40",
                  position.placement === "top" && "-translate-y-full"
                )}
                style={{
                  left: position.left,
                  top: position.top,
                }}
              >
                {children}
              </div>
            </ActionMenuContext.Provider>,
            document.body
          )
        : null}
    </>
  );
}

export function AdminActionMenuLink({
  children,
  href,
  icon,
}: {
  children: ReactNode;
  href: string;
  icon: ActionMenuIconName;
}) {
  const menu = useActionMenu();
  const Icon = actionMenuIcons[icon];

  return (
    <Link
      role="menuitem"
      href={href}
      className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
      onClick={() => menu?.close()}
    >
      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
      {children}
    </Link>
  );
}

export function AdminActionMenuButton({
  children,
  disabled,
  icon,
  onClick,
  tone = "default",
}: {
  children: ReactNode;
  disabled?: boolean;
  icon: ActionMenuIconName;
  onClick: () => void;
  tone?: "default" | "destructive";
}) {
  const menu = useActionMenu();
  const Icon = actionMenuIcons[icon];

  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        tone === "destructive" ? "text-destructive" : "text-foreground"
      )}
      onClick={() => {
        onClick();
        menu?.close();
      }}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4",
          icon === "loader" && "animate-spin",
          tone === "destructive" ? "text-destructive" : "text-muted-foreground"
        )}
      />
      {children}
    </button>
  );
}

export function AdminActionMenuText({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 py-2 text-sm text-muted-foreground" role="note">
      {children}
    </div>
  );
}
