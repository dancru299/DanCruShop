import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  GitBranchIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DeliveryFieldsProps = {
  demoUrl: string;
  previewUrl: string;
  lemonProductId: string;
  lemonVariantId: string;
  githubRepo: string;
  isCheckingRepo: boolean;
  repoCheck: {
    ok: boolean;
    message: string;
  } | null;
  isPending: boolean;
  onDemoUrlChange: (value: string) => void;
  onPreviewUrlChange: (value: string) => void;
  onLemonProductIdChange: (value: string) => void;
  onLemonVariantIdChange: (value: string) => void;
  onGithubRepoChange: (value: string) => void;
  onClearRepoCheck: () => void;
  onCheckRepo: () => void;
};

export function DeliveryFields({
  demoUrl,
  previewUrl,
  lemonProductId,
  lemonVariantId,
  githubRepo,
  isCheckingRepo,
  repoCheck,
  isPending,
  onDemoUrlChange,
  onPreviewUrlChange,
  onLemonProductIdChange,
  onLemonVariantIdChange,
  onGithubRepoChange,
  onClearRepoCheck,
  onCheckRepo,
}: DeliveryFieldsProps) {
  return (
    <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal">
            Delivery and external links
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Connect demos, previews, and Lemon Squeezy references.
          </p>
        </div>
        <ExternalLinkIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </div>

      <FieldGroup>
        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="demo-url">Demo URL</FieldLabel>
            <Input
              id="demo-url"
              value={demoUrl}
              onChange={(event) => onDemoUrlChange(event.target.value)}
              placeholder="https://demo.example.com"
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="preview-url">Preview URL</FieldLabel>
            <Input
              id="preview-url"
              value={previewUrl}
              onChange={(event) => onPreviewUrlChange(event.target.value)}
              placeholder="https://example.com/preview"
              disabled={isPending}
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="lemon-product-id">
              Lemon Squeezy product ID
            </FieldLabel>
            <Input
              id="lemon-product-id"
              value={lemonProductId}
              onChange={(event) => onLemonProductIdChange(event.target.value)}
              placeholder="Optional"
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lemon-variant-id">
              Lemon Squeezy variant ID
            </FieldLabel>
            <Input
              id="lemon-variant-id"
              value={lemonVariantId}
              onChange={(event) => onLemonVariantIdChange(event.target.value)}
              placeholder="Optional"
              disabled={isPending}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="github-repo">
            GitHub repo (changelog)
          </FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="github-repo"
              value={githubRepo}
              onChange={(event) => {
                onGithubRepoChange(event.target.value);
                onClearRepoCheck();
              }}
              placeholder="dancru299/DanCruShop hoặc https://github.com/dancru299/DanCruShop"
              disabled={isPending}
              className="sm:flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onCheckRepo}
              disabled={isPending || isCheckingRepo || !githubRepo.trim()}
            >
              {isCheckingRepo ? (
                <Loader2Icon
                  aria-hidden="true"
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <GitBranchIcon aria-hidden="true" data-icon="inline-start" />
              )}
              {isCheckingRepo ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
            </Button>
          </div>
          <FieldDescription>
            Tải tự động các commit theo chuẩn Conventional Commits
            (feat/fix/docs/refactor/perf) để hiện ở tab &ldquo;Lịch sử cập nhật&rdquo;.
            Repo private cần cấu hình GITHUB_PAT trên server. Để trống nếu
            không dùng.
          </FieldDescription>
          {repoCheck ? (
            <p
              className={cn(
                "flex items-center gap-1.5 text-sm",
                repoCheck.ok ? "text-emerald-500" : "text-destructive"
              )}
            >
              {repoCheck.ok ? (
                <CheckCircle2Icon aria-hidden="true" className="size-4" />
              ) : (
                <TriangleAlertIcon aria-hidden="true" className="size-4" />
              )}
              {repoCheck.message}
            </p>
          ) : null}
        </Field>
      </FieldGroup>
    </section>
  );
}
