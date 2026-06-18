import type { Metadata } from "next";
import { Clock3Icon, GaugeIcon, LandmarkIcon } from "lucide-react";

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
          Icon: Clock3Icon,
          title: "Lemon Squeezy is automatic",
          description:
            "Lemon Squeezy orders are unlocked automatically by webhook after a successful payment.",
        },
        {
          Icon: LandmarkIcon,
          title: "VietQR is approved manually",
          description:
            "VietQR orders are for VND products and are approved manually by an admin within 24 hours during beta.",
        },
      ]}
    />
  );
}
