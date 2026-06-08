"use client";

/* eslint-disable @next/next/no-img-element */

import { useActionState, useMemo, useRef, useState } from "react";
import { CameraIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import {
  uploadProfileAvatar,
  updateProfile,
  type ProfileActionState,
} from "@/actions/profile.actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ProfileFormProps = {
  email: string | null;
  initialAvatarUrl: string | null;
  initialFullName: string;
};

const initialState: ProfileActionState = {
  error: null,
  success: null,
};

function getInitials(name: string, email: string | null) {
  const source = name.trim() || email?.trim() || "Khách";
  const parts = source
    .split(/[\s@._-]+/)
    .filter((part) => part.length > 0)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "K";
}

export function ProfileForm({
  email,
  initialAvatarUrl,
  initialFullName,
}: ProfileFormProps) {
  const [state, action, isPending] = useActionState(updateProfile, initialState);
  const [fullName, setFullName] = useState(initialFullName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const initials = useMemo(
    () => getInitials(fullName || initialFullName, email),
    [email, fullName, initialFullName]
  );
  const isBusy = isPending || isUploadingAvatar;

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadProfileAvatar(formData);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setAvatarUrl(result.url);
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch (error) {
      console.error("Profile avatar upload failed", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể tải ảnh đại diện lên."
      );
    } finally {
      setIsUploadingAvatar(false);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  }

  return (
    <form action={action} className="grid gap-6 rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          className="group/avatar relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xl font-semibold text-secondary-foreground outline-none transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50"
          disabled={isBusy}
          aria-label="Tải ảnh đại diện"
          onClick={() => avatarInputRef.current?.click()}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName || "Ảnh đại diện"}
              className="size-full object-cover"
            />
          ) : (
            initials
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-background/55 opacity-0 backdrop-blur-[1px] transition-opacity group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100">
            {isUploadingAvatar ? (
              <Loader2Icon aria-hidden="true" className="size-6 animate-spin" />
            ) : (
              <CameraIcon aria-hidden="true" className="size-6" />
            )}
          </span>
        </button>
        <input
          ref={avatarInputRef}
          aria-label="Chọn ảnh đại diện"
          className="hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={isBusy}
          onChange={handleAvatarChange}
        />
        <div>
          <p className="font-medium">Hồ sơ mua hàng</p>
          {email ? (
            <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          ) : null}
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Di chuột vào ảnh đại diện rồi bấm biểu tượng camera để tải ảnh mới.
          </p>
        </div>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="full-name">Tên hiển thị</FieldLabel>
          <Input
            id="full-name"
            name="fullName"
            maxLength={80}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Tên của bạn"
            disabled={isBusy}
          />
          <FieldDescription>
            Tên này sẽ xuất hiện trong đánh giá, phản hồi và các khu vực tài khoản.
          </FieldDescription>
        </Field>
      </FieldGroup>

      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {state.success}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isBusy}>
          <SaveIcon data-icon="inline-start" aria-hidden="true" />
          {isPending ? "Đang lưu..." : "Lưu hồ sơ"}
        </Button>
      </div>
    </form>
  );
}
