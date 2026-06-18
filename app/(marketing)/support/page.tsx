import type { Metadata } from "next";
import { LifeBuoyIcon, MailIcon, ReceiptTextIcon } from "lucide-react";

import { PolicyPageShell } from "@/components/policies/policy-page-shell";
import { getSupportEmail } from "@/lib/site-config";

const supportEmail = getSupportEmail();

export const metadata: Metadata = {
  title: "Support",
  description: `Contact DanCruShop at ${supportEmail}.`,
};

export default function SupportPage() {
  return (
    <PolicyPageShell
      title="DanCruShop support"
      description={`Email ${supportEmail} replies within 24 hours during beta. Include your purchase email, the product name, and a screenshot of the issue if you have one.`}
      points={[
        {
          Icon: MailIcon,
          title: "Main channel",
          description: `Email ${supportEmail}; the shop responds by priority, starting with orders that can't be accessed.`,
        },
        {
          Icon: ReceiptTextIcon,
          title: "What to include",
          description:
            "Your purchase email, order code or provider order id, the product name, and a description of the issue.",
        },
        {
          Icon: LifeBuoyIcon,
          title: "Beta priority",
          description:
            "Issues like not receiving the magic link, not seeing a product in the dashboard, or broken download links are handled first.",
        },
      ]}
    />
  );
}
