"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { ImageIcon, Loader2Icon, UploadCloudIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { uploadAdminImage } from "@/actions/media.actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminMediaUploadFieldProps = {
  description: string;
  disabled?: boolean;
  folder: "blog" | "products";
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

export function AdminMediaUploadField({
  description,
  disabled,
  folder,
  id,
  label,
  onChange,
  placeholder,
  value,
}: AdminMediaUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isBusy = Boolean(disabled) || isUploading;
  const hasImage = value.trim().length > 0;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("folder", folder);
      formData.append("file", file);

      const result = await uploadAdminImage(formData);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      onChange(result.url);
      toast.success("Đã tải ảnh lên.");
    } catch (error) {
      console.error("Admin image upload failed", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="grid gap-4 rounded-lg border bg-background/50 p-4 md:grid-cols-[12rem_1fr]">
      <div
        className={cn(
          "relative aspect-[16/10] overflow-hidden rounded-lg border bg-muted",
          !hasImage && "border-dashed"
        )}
      >
        {hasImage ? (
          <img
            alt=""
            className="absolute inset-0 size-full object-cover"
            src={value}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ImageIcon aria-hidden="true" className="size-6" />
            <span className="text-xs">Chưa có ảnh</span>
          </div>
        )}
      </div>

      <FieldGroup>
        <Field data-disabled={isBusy}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={isBusy}
          />
          <FieldDescription>{description}</FieldDescription>
        </Field>

        <div className="flex flex-wrap gap-2">
          <Input
            ref={fileInputRef}
            aria-label={`Tải lên ${label}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            className="hidden"
            disabled={isBusy}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2Icon
                aria-hidden="true"
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <UploadCloudIcon aria-hidden="true" data-icon="inline-start" />
            )}
            {isUploading ? "Đang tải..." : "Tải ảnh lên"}
          </Button>
          {hasImage ? (
            <Button
              type="button"
              variant="ghost"
              disabled={isBusy}
              onClick={() => onChange("")}
            >
              <XIcon aria-hidden="true" data-icon="inline-start" />
              Xóa
            </Button>
          ) : null}
        </div>
      </FieldGroup>
    </div>
  );
}
