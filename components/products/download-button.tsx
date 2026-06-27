"use client";

import { useState } from "react";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type DownloadButtonProps = {
  // The variant id whose primary file we deliver.
  variantId: string;
  children?: string;
  className?: string;
};

type DownloadResponse = {
  download_url?: string;
  error?: string;
};

export function DownloadButton({
  variantId,
  children,
  className,
}: DownloadButtonProps) {
  const [isPreparing, setIsPreparing] = useState(false);

  async function handleDownload() {
    setIsPreparing(true);

    try {
      const response = await fetch(`/api/products/${variantId}/download`, {
        method: "POST",
      });
      const result = (await response.json()) as DownloadResponse;

      if (!response.ok || !result.download_url) {
        throw new Error(result.error ?? "Could not prepare download.");
      }

      toast.success("Download ready", {
        description: "Your secure download link is valid for 60 seconds.",
      });

      window.location.href = result.download_url;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not prepare download.";

      toast.error("Download failed", {
        description: message,
      });
    } finally {
      setIsPreparing(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={isPreparing}
      onClick={handleDownload}
    >
      {isPreparing ? (
        <Loader2Icon
          data-icon="inline-start"
          aria-hidden="true"
          className="animate-spin"
        />
      ) : (
        <DownloadIcon data-icon="inline-start" aria-hidden="true" />
      )}
      {isPreparing ? "Preparing..." : children ?? "Download File"}
    </Button>
  );
}
