"use client";

import { useTransition } from "react";
import { CheckCircleIcon, Loader2Icon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { approveReview, rejectReview } from "@/actions/admin-review.actions";
import { Button } from "@/components/ui/button";

type ReviewActionButtonsProps = {
  reviewId: string;
};

export function ReviewActionButtons({ reviewId }: ReviewActionButtonsProps) {
  const [isApprovePending, startApproveTransition] = useTransition();
  const [isRejectPending, startRejectTransition] = useTransition();

  function handleApprove() {
    startApproveTransition(async () => {
      const result = await approveReview(reviewId);

      if (result.error) {
        toast.error("Không thể duyệt review", { description: result.error });
        return;
      }

      toast.success(result.success ?? "Review đã được duyệt.");
    });
  }

  function handleReject() {
    startRejectTransition(async () => {
      const result = await rejectReview(reviewId);

      if (result.error) {
        toast.error("Không thể từ chối review", { description: result.error });
        return;
      }

      toast.success(result.success ?? "Review đã bị từ chối.");
    });
  }

  const isAnyPending = isApprovePending || isRejectPending;

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="sm"
        type="button"
        variant="default"
        disabled={isAnyPending}
        onClick={handleApprove}
      >
        {isApprovePending ? (
          <Loader2Icon
            data-icon="inline-start"
            aria-hidden="true"
            className="animate-spin"
          />
        ) : (
          <CheckCircleIcon data-icon="inline-start" aria-hidden="true" />
        )}
        Duyệt
      </Button>

      <Button
        size="sm"
        type="button"
        variant="outline"
        disabled={isAnyPending}
        onClick={handleReject}
      >
        {isRejectPending ? (
          <Loader2Icon
            data-icon="inline-start"
            aria-hidden="true"
            className="animate-spin"
          />
        ) : (
          <XCircleIcon data-icon="inline-start" aria-hidden="true" />
        )}
        Từ chối
      </Button>
    </div>
  );
}
