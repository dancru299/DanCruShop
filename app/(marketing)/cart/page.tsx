import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review and checkout DanCruShop digital products.",
};

export default function CartPage() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col bg-background">
      <CartPageClient />
    </div>
  );
}

