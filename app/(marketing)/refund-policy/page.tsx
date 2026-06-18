import type { Metadata } from "next";
import { AlertCircleIcon, CheckCircle2Icon, RotateCcwIcon } from "lucide-react";

import { PolicyPageShell } from "@/components/policies/policy-page-shell";
import { betaPolicies } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Refund policy",
  description: betaPolicies.refund,
};

export default function RefundPolicyPage() {
  return (
    <PolicyPageShell
      title="Refund policy"
      description={betaPolicies.refund}
      points={[
        {
          Icon: CheckCircle2Icon,
          title: "Applies to genuine issues",
          description:
            "The shop prioritizes refunds when a product can't be accessed, has a serious defect, or doesn't match the sales page.",
        },
        {
          Icon: AlertCircleIcon,
          title: "Not for change of mind",
          description:
            "For digital products, refunds don't apply once the resource has been fully downloaded/used, or if you change your mind after receiving the files.",
        },
        {
          Icon: RotateCcwIcon,
          title: "7-day window",
          description:
            "Email us within 7 days of purchase with your order email and a description of the issue so we can review it quickly.",
        },
      ]}
    />
  );
}
