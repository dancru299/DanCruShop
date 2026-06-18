"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDownIcon,
  type LucideIcon,
  LogOutIcon,
  PackageOpenIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { signOut } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";

export type AccountMenuUser = {
  avatarUrl: string | null;
  email: string | null;
  name: string;
};

type AccountMenuProps = {
  user: AccountMenuUser;
  isAdmin?: boolean;
};

function getInitials(name: string, email: string | null) {
  const source = name.trim() || email?.trim() || "Guest";
  const parts = source
    .split(/[\s@._-]+/)
    .filter((part) => part.length > 0)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "U";
}

export function AccountMenu({ user, isAdmin = false }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const initials = getInitials(user.name, user.email);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
        className={cn(
          "flex h-8 items-center gap-1 rounded-full border bg-background px-1 pr-2 text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          open && "bg-muted"
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="size-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-64 rounded-lg border bg-card p-1 text-card-foreground shadow-xl shadow-background/40"
        >
          <div className="border-b px-3 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            {user.email ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            ) : null}
          </div>

          {isAdmin ? (
            <div className="border-b py-1">
              <AccountMenuLink href="/admin" icon={ShieldCheckIcon} emphasis>
                Admin
              </AccountMenuLink>
            </div>
          ) : null}

          <div className="py-1">
            <AccountMenuLink href="/profile" icon={UserRoundIcon}>
              Profile
            </AccountMenuLink>
            <AccountMenuLink href="/dashboard" icon={PackageOpenIcon}>
              Purchased library
            </AccountMenuLink>
            <AccountMenuLink href="/settings" icon={SettingsIcon}>
              Settings
            </AccountMenuLink>
          </div>

          <form action={signOut} className="border-t pt-1">
            <button
              role="menuitem"
              type="submit"
                className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none"
              >
                <LogOutIcon aria-hidden="true" className="size-4" />
                Log out
              </button>
            </form>
          </div>
      ) : null}
    </div>
  );
}

function AccountMenuLink({
  children,
  href,
  icon: Icon,
  emphasis = false,
}: {
  children: ReactNode;
  href: string;
  icon: LucideIcon;
  emphasis?: boolean;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-4 text-muted-foreground", emphasis && "text-primary")}
      />
      <span>{children}</span>
    </Link>
  );
}
