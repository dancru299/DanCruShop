import type { Metadata } from "next";
import { Clock3Icon, GaugeIcon, WalletIcon } from "lucide-react";

import { PolicyPageShell } from "@/components/policies/policy-page-shell";
import { betaPolicies } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Delivery policy",
  description: betaPolicies.delivery,
};

export default function DeliveryPolicyPage() {
  return (
    <PolicyPageShell
      title="Digital resource delivery policy"
      description={betaPolicies.delivery}
      points={[
        {
          Icon: GaugeIcon,
          title: "The dashboard is where you receive products",
          description:
            "After payment or claiming a free item, the resource appears in the dashboard of the purchasing account.",
        },
        {
          Icon: WalletIcon,
          title: "PayPal is automatic",
          description:
            "PayPal orders are unlocked automatically by webhook right after a successful payment.",
        },
        {
          Icon: Clock3Icon,
          title: "Instant access",
          description:
            "Once payment is confirmed, your products appear in the dashboard of the purchasing account immediately.",
        },
      ]}
    />
  );
}
