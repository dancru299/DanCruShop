"use client";

import { useState } from "react";
import { PaperclipIcon } from "lucide-react";

import { ProductFileManager } from "@/components/admin/product-file-manager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ProductFilesDialogProps = {
  productId: string;
  productTitle: string;
  disabled?: boolean;
};

export function ProductFilesDialog({
  productId,
  productTitle,
  disabled,
}: ProductFilesDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" disabled={disabled} />
        }
      >
        <PaperclipIcon aria-hidden="true" data-icon="inline-start" />
        Quản lý file
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>File giao cho khách</DialogTitle>
          <DialogDescription>
            Upload file sản phẩm số cho “{productTitle}”. Khách hàng nhận được
            các file này sau khi mua. File đầu tiên là file chính.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Mount only while open so files load fresh each time. */}
          {open ? <ProductFileManager productId={productId} /> : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
