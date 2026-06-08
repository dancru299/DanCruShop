import type { Metadata } from "next";
import { LifeBuoyIcon, MailIcon, ReceiptTextIcon } from "lucide-react";

import { PolicyPageShell } from "@/components/policies/policy-page-shell";
import { getSupportEmail } from "@/lib/site-config";

const supportEmail = getSupportEmail();

export const metadata: Metadata = {
  title: "Support",
  description: `Liên hệ DanCruShop qua ${supportEmail}.`,
};

export default function SupportPage() {
  return (
    <PolicyPageShell
      title="Support DanCruShop"
      description={`Email ${supportEmail} phản hồi trong 24h trong giai đoạn beta. Gửi kèm email mua hàng, tên sản phẩm và ảnh lỗi nếu có.`}
      points={[
        {
          Icon: MailIcon,
          title: "Kênh chính",
          description: `Gửi email tới ${supportEmail}; shop sẽ phản hồi theo thứ tự ưu tiên đơn hàng đang lỗi truy cập.`,
        },
        {
          Icon: ReceiptTextIcon,
          title: "Thông tin cần gửi",
          description:
            "Email mua hàng, mã đơn hoặc provider order id, tên sản phẩm và mô tả vấn đề đang gặp.",
        },
        {
          Icon: LifeBuoyIcon,
          title: "Ưu tiên beta",
          description:
            "Các lỗi không nhận được magic link, không thấy sản phẩm trong dashboard hoặc link tải lỗi sẽ được ưu tiên xử lý.",
        },
      ]}
    />
  );
}
