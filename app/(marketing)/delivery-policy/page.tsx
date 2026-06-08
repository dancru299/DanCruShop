import type { Metadata } from "next";
import { Clock3Icon, GaugeIcon, LandmarkIcon } from "lucide-react";

import { PolicyPageShell } from "@/components/policies/policy-page-shell";
import { betaPolicies } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Chính sách giao hàng",
  description: betaPolicies.delivery,
};

export default function DeliveryPolicyPage() {
  return (
    <PolicyPageShell
      title="Chính sách giao hàng tài nguyên số"
      description={betaPolicies.delivery}
      points={[
        {
          Icon: GaugeIcon,
          title: "Dashboard là nơi nhận hàng",
          description:
            "Sau khi thanh toán hoặc nhận miễn phí, tài nguyên xuất hiện trong dashboard của tài khoản mua hàng.",
        },
        {
          Icon: Clock3Icon,
          title: "Lemon Squeezy tự động",
          description:
            "Đơn Lemon Squeezy được webhook mở khóa tự động sau khi thanh toán thành công.",
        },
        {
          Icon: LandmarkIcon,
          title: "VietQR duyệt thủ công",
          description:
            "Đơn VietQR dành cho sản phẩm VND và được admin duyệt thủ công trong vòng 24h trong giai đoạn beta.",
        },
      ]}
    />
  );
}
