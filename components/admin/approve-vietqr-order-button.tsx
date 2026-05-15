"use client";

import { useTransition } from "react";
import { CheckCircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { approveVietQrOrder } from "@/actions/order.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ApproveVietQrOrderButtonProps = {
  menuItem?: boolean;
  orderId: string;
};

export function ApproveVietQrOrderButton({
  menuItem = false,
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
    <Button
      size="sm"
      type="button"
      variant={menuItem ? "ghost" : "default"}
      className={cn(menuItem && "h-9 w-full justify-start px-2.5")}
      disabled={isPending}
      onClick={handleApprove}
    >
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
