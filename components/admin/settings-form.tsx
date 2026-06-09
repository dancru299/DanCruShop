"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { updateStoreSettings } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StoreSettings } from "@/lib/store/settings";

type SettingsFormProps = {
  settings: StoreSettings;
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [bankBin, setBankBin] = useState(settings.vietqr.bankBin ?? "");
  const [accountNo, setAccountNo] = useState(settings.vietqr.accountNo ?? "");
  const [accountName, setAccountName] = useState(
    settings.vietqr.accountName ?? ""
  );
  const [template, setTemplate] = useState(settings.vietqr.template);
  const [enabled, setEnabled] = useState(settings.vietqr.enabled);

  const [storeName, setStoreName] = useState(settings.store.storeName);
  const [supportEmail, setSupportEmail] = useState(settings.store.supportEmail);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateStoreSettings({
        store: { storeName, supportEmail },
        vietqr: { accountName, accountNo, bankBin, enabled, template },
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã lưu cấu hình.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-normal">
              Thanh toán VietQR
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Thông tin ngân hàng dùng để sinh mã QR và hiển thị trên trang
              chuyển khoản của khách.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((value) => !value)}
            disabled={isPending}
            aria-pressed={enabled}
            className={cn(
              "inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors",
              enabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "size-4 rounded-full bg-background transition-transform",
                enabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="bank-bin">Mã ngân hàng (BIN)</FieldLabel>
            <Input
              id="bank-bin"
              value={bankBin}
              onChange={(event) => setBankBin(event.target.value)}
              placeholder="970422"
              disabled={isPending}
            />
            <FieldDescription>
              Mã BIN của ngân hàng (ví dụ MB Bank: 970422).
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="account-no">Số tài khoản</FieldLabel>
            <Input
              id="account-no"
              value={accountNo}
              onChange={(event) => setAccountNo(event.target.value)}
              placeholder="0123456789"
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-name">Tên chủ tài khoản</FieldLabel>
            <Input
              id="account-name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="NGUYEN VAN A"
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="template">Template QR</FieldLabel>
            <Input
              id="template"
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              placeholder="compact2"
              disabled={isPending}
            />
            <FieldDescription>
              compact2, compact, qr_only hoặc print.
            </FieldDescription>
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold tracking-normal">
            Thông tin shop
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Tên shop và email hỗ trợ hiển thị cho khách trên các trang server.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="store-name">Tên shop</FieldLabel>
            <Input
              id="store-name"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="DanCruShop"
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="support-email">Email hỗ trợ</FieldLabel>
            <Input
              id="support-email"
              type="email"
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
              placeholder="support@dancrushop.com"
              disabled={isPending}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end border-t pt-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <SaveIcon aria-hidden="true" data-icon="inline-start" />
          )}
          {isPending ? "Đang lưu..." : "Lưu cấu hình"}
        </Button>
      </div>
    </form>
  );
}
