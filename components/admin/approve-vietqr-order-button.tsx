"use client";

import { useTransition } from "react";
import { CheckCircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { approveVietQrOrder } from "@/actions/order.actions";
import { Button } from "@/components/ui/button";

type ApproveVietQrOrderButtonProps = {
  orderId: string;
};

export function ApproveVietQrOrderButton({
  orderId,
}: ApproveVietQrOrderButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveVietQrOrder(orderId);

      if (!result.ok) {
        toast.error("Không duyệt được đơn", {
          description: result.error,
        });
        return;
      }

      toast.success("Đã duyệt đơn", {
        description: result.message,
      });
    });
  }

  return (
    <Button size="sm" type="button" disabled={isPending} onClick={handleApprove}>
      {isPending ? (
        <Loader2Icon
          data-icon="inline-start"
          aria-hidden="true"
          className="animate-spin"
        />
      ) : (
        <CheckCircleIcon data-icon="inline-start" aria-hidden="true" />
      )}
      {isPending ? "Đang duyệt..." : "Duyệt Đơn"}
    </Button>
  );
}
