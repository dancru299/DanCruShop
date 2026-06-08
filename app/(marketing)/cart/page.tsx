import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Xem lại và thanh toán các sản phẩm số đã chọn trên DanCruShop.",
};

export default function CartPage() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <CartPageClient />
    </div>
  );
}
