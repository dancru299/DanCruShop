"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileIcon,
  Loader2Icon,
  StarIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  AdminActionMenu,
  AdminActionMenuButton,
} from "@/components/admin/admin-action-menu";
import {
  addProductFile,
  deleteProductFile,
  updateProductFileLimit,
  type ProductFileRecord,
} from "@/actions/product-file.actions";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { uploadProductFile } from "@/lib/supabase/storage";

type ProductFileManagerProps = {
  productId: string;
  initialFiles: ProductFileRecord[];
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function formatBytes(value: number | null) {
  if (typeof value !== "number") {
    return "Unknown";
  }

  if (value === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );
  const amount = value / 1024 ** exponent;

  return `${amount.toFixed(amount >= 10 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProductFileManager({
  productId,
  initialFiles,
}: ProductFileManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const isBusy = isUploading || isDeletePending;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(25);
      const uploadedFile = await uploadProductFile(file, productId);

      setUploadProgress(75);
      const result = await addProductFile({
        fileName: file.name,
        filePath: uploadedFile.path,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        productId,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setUploadProgress(100);
      toast.success("File uploaded.");
      router.refresh();
    } catch (error) {
      console.error("Product file upload failed", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleDelete(file: ProductFileRecord) {
    const confirmed = window.confirm(
      `Delete "${file.file_name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingFileId(file.id);

    startDeleteTransition(async () => {
      try {
        const result = await deleteProductFile(file.id, file.file_path);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success("File deleted.");
        router.refresh();
      } catch (error) {
        console.error("Product file delete failed", error);
        toast.error(getErrorMessage(error));
      } finally {
        setDeletingFileId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <FieldGroup>
          <Field data-disabled={isBusy}>
            <FieldLabel htmlFor="product-file">Upload Product File</FieldLabel>
            <Input
              ref={fileInputRef}
              id="product-file"
              type="file"
              disabled={isBusy}
              onChange={handleFileChange}
            />
            <FieldDescription>
              Files are uploaded to the private products bucket and saved under
              this product id.
            </FieldDescription>
          </Field>

          {isUploading ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Loader2Icon
                    aria-hidden="true"
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                  Uploading
                </span>
                <span className="text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>
              <progress
                className="h-2 w-full overflow-hidden rounded-lg"
                max={100}
                value={uploadProgress}
              />
            </div>
          ) : null}
        </FieldGroup>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {initialFiles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Limit / user</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                        <FileIcon aria-hidden="true" className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium">
                            {file.file_name}
                          </span>
                          {file.is_primary ? (
                            <Badge variant="secondary">
                              <StarIcon
                                aria-hidden="true"
                                data-icon="inline-start"
                              />
                              Primary
                            </Badge>
                          ) : null}
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          {file.file_path}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatBytes(file.file_size_bytes)}</TableCell>
                  <TableCell>{file.file_type ?? "Unknown"}</TableCell>
                  <TableCell>{file.download_count}</TableCell>
                  <TableCell>
                    <DownloadLimitInput
                      fileId={file.id}
                      initialLimit={file.max_downloads_per_user}
                    />
                  </TableCell>
                  <TableCell>{formatDate(file.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <AdminActionMenu label={`Actions for ${file.file_name}`}>
                      <AdminActionMenuButton
                        icon={deletingFileId === file.id ? "loader" : "trash"}
                        tone="destructive"
                        disabled={isBusy}
                        onClick={() => handleDelete(file)}
                      >
                        Delete
                      </AdminActionMenuButton>
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <UploadIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                No files uploaded
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Upload the primary downloadable file for this product. The first
                file becomes the primary file used by secure delivery.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DownloadLimitInput({
  fileId,
  initialLimit,
}: {
  fileId: string;
  initialLimit: number | null;
}) {
  const [value, setValue] = useState(
    initialLimit !== null ? String(initialLimit) : ""
  );
  const [isSaving, startTransition] = useTransition();

  function handleBlur() {
    const parsed = value.trim() === "" ? null : parseInt(value, 10);

    if (parsed === initialLimit) return;
    if (value.trim() !== "" && (isNaN(parsed as number) || (parsed as number) < 1)) {
      toast.error("Limit phải là số nguyên dương.");
      setValue(initialLimit !== null ? String(initialLimit) : "");
      return;
    }

    startTransition(async () => {
      const result = await updateProductFileLimit(fileId, parsed);

      if (!result.ok) {
        toast.error("Không thể cập nhật limit", { description: result.error });
        setValue(initialLimit !== null ? String(initialLimit) : "");
        return;
      }

      toast.success("Đã cập nhật download limit.");
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min={1}
        placeholder="∞"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isSaving}
        className="w-20"
        aria-label="Max downloads per user"
      />
      {isSaving && (
        <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
