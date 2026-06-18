import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review and check out the digital products you've selected on DanCruShop.",
};

export default function CartPage() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <CartPageClient />
    </div>
  );
}
