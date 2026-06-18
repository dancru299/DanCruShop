/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { XIcon } from "lucide-react";

import { getTechSpecGroups, techLabel } from "@/lib/products/specs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function StackBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStack = searchParams.get("stack") ?? "";
  const selectedKeys = useMemo(() => {
    if (!rawStack) return [];
    return rawStack
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);
  }, [rawStack]);

  const selectedSet = useMemo(
    () => new Set(selectedKeys),
    [selectedKeys]
  );

  const techSpecGroups = useMemo(() => getTechSpecGroups(), []);

  const toggleTech = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get("stack") ?? "";
      const keys = current
        ? current.split(",").map((k) => k.trim().toLowerCase())
        : [];
      const idx = keys.indexOf(key.toLowerCase());

      if (idx >= 0) {
        keys.splice(idx, 1);
      } else {
        keys.push(key.toLowerCase());
      }

      if (keys.length > 0) {
        params.set("stack", keys.join(","));
      } else {
        params.delete("stack");
      }

      params.delete("page"); // reset pagination
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("stack");
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }, [router, searchParams]);

  const hasSelection = selectedKeys.length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Build your stack
          </span>
          {hasSelection ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {selectedKeys.length} selected
            </span>
          ) : null}
        </div>

        {hasSelection ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 gap-1 text-xs"
          >
            <XIcon aria-hidden="true" className="size-3" />
            Clear all
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {techSpecGroups.map((group) => (
          <div key={group.id} className="flex flex-wrap items-center gap-2">
            <span className="min-w-[4.5rem] text-xs font-medium text-muted-foreground">
              {group.labelEn}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {group.fields.flatMap((field) =>
                (field.options ?? []).map((option) => (
                  <StackPill
                    key={option.value}
                    label={option.labelEn ?? option.label}
                    logo={option.logo ?? null}
                    active={selectedSet.has(option.value)}
                    onClick={() => toggleTech(option.value)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {hasSelection ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
          <span className="text-muted-foreground">
            Showing products matching:
          </span>
          {selectedKeys.map((key) => {
            const label = techLabel(key, "en");

            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleTech(key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors hover:line-through",
                  "bg-muted"
                )}
              >
                {label}
                <XIcon aria-hidden="true" className="size-3" />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Select the technologies you work with to find matching products. Sorted
          by best match first.
        </p>
      )}
    </div>
  );
}

function StackPill({
  label,
  logo,
  active,
  onClick,
}: {
  label: string;
  logo: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {logo ? (
        <img alt="" src={logo} className="size-3.5 object-contain" />
      ) : null}
      {label}
    </button>
  );
}
