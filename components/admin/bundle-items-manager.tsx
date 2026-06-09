"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CheckIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { setBundleItems } from "@/actions/bundle.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BundleCandidate } from "@/lib/supabase/queries/bundles";
import { cn } from "@/lib/utils";

type BundleItemsManagerProps = {
  bundleId: string;
  candidates: BundleCandidate[];
  initialChildIds: string[];
};

const statusLabels: Record<BundleCandidate["status"], string> = {
  archived: "Archived",
  draft: "Draft",
  published: "Published",
};

export function BundleItemsManager({
  bundleId,
  candidates,
  initialChildIds,
}: BundleItemsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(initialChildIds);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return candidates;
    }

    return candidates.filter((candidate) =>
      candidate.title.toLowerCase().includes(term)
    );
  }, [candidates, query]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setBundleItems(bundleId, selected);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã lưu thành phần bundle.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-normal">
            Sản phẩm trong bundle
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Khi khách mua bundle này, các sản phẩm được chọn sẽ tự mở khoá trong
            dashboard của họ.
          </p>
        </div>
        <Badge variant="secondary">{selected.length} đã chọn</Badge>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Tìm sản phẩm..."
        disabled={isPending}
      />

      {candidates.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Chưa có sản phẩm nào khác để thêm vào bundle. Tạo sản phẩm con trước.
        </p>
      ) : (
        <div className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto">
          {filtered.map((candidate) => {
            const active = selected.includes(candidate.id);

            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => toggle(candidate.id)}
                disabled={isPending}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "bg-background hover:bg-muted"
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded border",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background"
                    )}
                  >
                    {active ? (
                      <CheckIcon aria-hidden="true" className="size-3.5" />
                    ) : null}
                  </span>
                  <span className="truncate text-sm font-medium">
                    {candidate.title}
                  </span>
                </span>
                <Badge variant="outline">{statusLabels[candidate.status]}</Badge>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-end border-t pt-4">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <SaveIcon aria-hidden="true" data-icon="inline-start" />
          )}
          Lưu bundle
        </Button>
      </div>
    </div>
  );
}
