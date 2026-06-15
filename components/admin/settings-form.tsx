"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { updateStoreSettings } from "@/actions/settings.actions";
import { AdminMediaUploadField } from "@/components/admin/media-upload-field";
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

  const [zalo, setZalo] = useState(settings.contact.zalo.url ?? "");
  const [zaloIcon, setZaloIcon] = useState(settings.contact.zalo.icon ?? "");
  const [telegram, setTelegram] = useState(settings.contact.telegram.url ?? "");
  const [telegramIcon, setTelegramIcon] = useState(
    settings.contact.telegram.icon ?? ""
  );
  const [messenger, setMessenger] = useState(
    settings.contact.messenger.url ?? ""
  );
  const [messengerIcon, setMessengerIcon] = useState(
    settings.contact.messenger.icon ?? ""
  );
  const [phone, setPhone] = useState(settings.contact.phone.url ?? "");
  const [phoneIcon, setPhoneIcon] = useState(settings.contact.phone.icon ?? "");

  const [socials, setSocials] = useState(settings.socials);

  function updateSocial(
    index: number,
    patch: Partial<(typeof socials)[number]>
  ) {
    setSocials((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  const [leftImage, setLeftImage] = useState(
    settings.promo.leftRail.imageUrl ?? ""
  );
  const [leftHref, setLeftHref] = useState(settings.promo.leftRail.href ?? "");
  const [rightImage, setRightImage] = useState(
    settings.promo.rightRail.imageUrl ?? ""
  );
  const [rightHref, setRightHref] = useState(
    settings.promo.rightRail.href ?? ""
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateStoreSettings({
        store: { storeName, supportEmail },
        vietqr: { accountName, accountNo, bankBin, enabled, template },
        contact: {
          zalo: { url: zalo, icon: zaloIcon },
          telegram: { url: telegram, icon: telegramIcon },
          messenger: { url: messenger, icon: messengerIcon },
          phone: { url: phone, icon: phoneIcon },
        },
        promo: { leftImage, leftHref, rightImage, rightHref },
        socials,
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

      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold tracking-normal">
            Kênh liên hệ
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Link các kênh chat nổi (Zalo, Telegram, Messenger, gọi điện) hiển thị
            ở góc phải trang cửa hàng. Bỏ trống link thì nút đó ẩn. Upload logo
            thật để nút đẹp hơn (bỏ trống thì dùng icon mặc định).
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-lg border bg-background/50 p-4">
            <Field>
              <FieldLabel htmlFor="contact-zalo">Zalo — link</FieldLabel>
              <Input
                id="contact-zalo"
                value={zalo}
                onChange={(event) => setZalo(event.target.value)}
                placeholder="https://zalo.me/0901234567"
                disabled={isPending}
              />
            </Field>
            <AdminMediaUploadField
              folder="products"
              id="contact-zalo-icon"
              label="Logo Zalo (tùy chọn)"
              description="Ảnh vuông, nền trong suốt là đẹp nhất."
              placeholder="https://..."
              value={zaloIcon}
              onChange={setZaloIcon}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-background/50 p-4">
            <Field>
              <FieldLabel htmlFor="contact-telegram">Telegram — link</FieldLabel>
              <Input
                id="contact-telegram"
                value={telegram}
                onChange={(event) => setTelegram(event.target.value)}
                placeholder="https://t.me/dancrushop"
                disabled={isPending}
              />
            </Field>
            <AdminMediaUploadField
              folder="products"
              id="contact-telegram-icon"
              label="Logo Telegram (tùy chọn)"
              description="Ảnh vuông, nền trong suốt là đẹp nhất."
              placeholder="https://..."
              value={telegramIcon}
              onChange={setTelegramIcon}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-background/50 p-4">
            <Field>
              <FieldLabel htmlFor="contact-messenger">
                Messenger — link
              </FieldLabel>
              <Input
                id="contact-messenger"
                value={messenger}
                onChange={(event) => setMessenger(event.target.value)}
                placeholder="https://m.me/dancrushop"
                disabled={isPending}
              />
            </Field>
            <AdminMediaUploadField
              folder="products"
              id="contact-messenger-icon"
              label="Logo Messenger (tùy chọn)"
              description="Ảnh vuông, nền trong suốt là đẹp nhất."
              placeholder="https://..."
              value={messengerIcon}
              onChange={setMessengerIcon}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-background/50 p-4">
            <Field>
              <FieldLabel htmlFor="contact-phone">Số điện thoại</FieldLabel>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0901234567"
                disabled={isPending}
              />
              <FieldDescription>
                Chỉ cần số, hệ thống tự thêm tel: khi bấm gọi.
              </FieldDescription>
            </Field>
            <AdminMediaUploadField
              folder="products"
              id="contact-phone-icon"
              label="Logo nút gọi (tùy chọn)"
              description="Ảnh vuông, nền trong suốt là đẹp nhất."
              placeholder="https://..."
              value={phoneIcon}
              onChange={setPhoneIcon}
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-normal">
              Mạng xã hội &amp; cộng đồng
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Hiển thị ở footer. Mỗi mục gồm tên, link và logo (Facebook, Telegram
              nhóm, TikTok...). Khách cũ bấm vào để theo dõi sản phẩm mới.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              setSocials((current) => [
                ...current,
                { label: "", url: "", iconUrl: "" },
              ])
            }
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Thêm
          </Button>
        </div>

        {socials.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có kênh nào. Bấm &quot;Thêm&quot; để tạo.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {socials.map((social, index) => (
              <div
                key={index}
                className="grid gap-4 rounded-lg border bg-background/50 p-4 lg:grid-cols-[1fr_auto]"
              >
                <div className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor={`social-label-${index}`}>
                        Tên
                      </FieldLabel>
                      <Input
                        id={`social-label-${index}`}
                        value={social.label}
                        onChange={(event) =>
                          updateSocial(index, { label: event.target.value })
                        }
                        placeholder="Telegram cộng đồng"
                        disabled={isPending}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`social-url-${index}`}>Link</FieldLabel>
                      <Input
                        id={`social-url-${index}`}
                        value={social.url}
                        onChange={(event) =>
                          updateSocial(index, { url: event.target.value })
                        }
                        placeholder="https://t.me/..."
                        disabled={isPending}
                      />
                    </Field>
                  </div>
                  <AdminMediaUploadField
                    folder="products"
                    id={`social-icon-${index}`}
                    label="Logo"
                    description="Ảnh vuông, nền trong suốt là đẹp nhất."
                    placeholder="https://..."
                    value={social.iconUrl}
                    onChange={(value) => updateSocial(index, { iconUrl: value })}
                    disabled={isPending}
                  />
                </div>
                <div className="flex items-start justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Xóa kênh"
                    disabled={isPending}
                    onClick={() =>
                      setSocials((current) =>
                        current.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold tracking-normal">
            Banner hai bên (side-rail)
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Hai banner dọc kẹp hai bên nội dung trang chủ trên màn hình rộng (tự
            ẩn trên màn hình nhỏ). Khuyến nghị ảnh dọc. Bỏ trống ảnh thì bên đó
            ẩn.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <AdminMediaUploadField
              folder="products"
              id="promo-left-image"
              label="Banner trái — ảnh"
              description="Ảnh dọc, ví dụ tỉ lệ 9:16."
              placeholder="https://... hoặc bấm Upload"
              value={leftImage}
              onChange={setLeftImage}
              disabled={isPending}
            />
            <Field>
              <FieldLabel htmlFor="promo-left-href">Banner trái — link</FieldLabel>
              <Input
                id="promo-left-href"
                value={leftHref}
                onChange={(event) => setLeftHref(event.target.value)}
                placeholder="/products?q=..."
                disabled={isPending}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            <AdminMediaUploadField
              folder="products"
              id="promo-right-image"
              label="Banner phải — ảnh"
              description="Ảnh dọc, ví dụ tỉ lệ 9:16."
              placeholder="https://... hoặc bấm Upload"
              value={rightImage}
              onChange={setRightImage}
              disabled={isPending}
            />
            <Field>
              <FieldLabel htmlFor="promo-right-href">
                Banner phải — link
              </FieldLabel>
              <Input
                id="promo-right-href"
                value={rightHref}
                onChange={(event) => setRightHref(event.target.value)}
                placeholder="/products?q=..."
                disabled={isPending}
              />
            </Field>
          </div>
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
