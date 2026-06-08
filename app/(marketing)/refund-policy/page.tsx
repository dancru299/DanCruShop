import type { Metadata } from "next";
import { AlertCircleIcon, CheckCircle2Icon, RotateCcwIcon } from "lucide-react";

import { PolicyPageShell } from "@/components/policies/policy-page-shell";
import { betaPolicies } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Chính sách hoàn tiền",
  description: betaPolicies.refund,
};

export default function RefundPolicyPage() {
  return (
    <PolicyPageShell
      title="Chính sách hoàn tiền"
      description={betaPolicies.refund}
      points={[
        {
          Icon: CheckCircle2Icon,
          title: "Áp dụng khi có lỗi thật",
          description:
            "Shop ưu tiên hoàn tiền khi sản phẩm không truy cập được, lỗi nghiêm trọng, hoặc mô tả sai so với trang bán hàng.",
        },
        {
          Icon: AlertCircleIcon,
          title: "Không áp dụng cho đổi ý",
          description:
            "Với sản phẩm số, refund không áp dụng khi tài nguyên đã được tải/sử dụng đầy đủ hoặc khách đổi ý sau khi nhận file.",
        },
        {
          Icon: RotateCcwIcon,
          title: "Thời hạn 7 ngày",
          description:
            "Gửi email trong vòng 7 ngày từ lúc mua, kèm email đơn hàng và mô tả lỗi để shop kiểm tra nhanh.",
        },
      ]}
    />
  );
}
