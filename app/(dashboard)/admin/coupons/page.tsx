import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { AdminMetric } from "@/components/admin/admin-metric";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CouponTable } from "@/components/admin/coupon-table";
import { Button } from "@/components/ui/button";
import { getAdminCoupons } from "@/lib/supabase/queries/coupons";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();
  const activeCount = coupons.filter((coupon) => coupon.is_active).length;
  const totalRedemptions = coupons.reduce(
    (sum, coupon) => sum + coupon.times_redeemed,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Tiếp thị"
        title="Mã giảm giá"
        description="Tạo mã giảm giá theo phần trăm hoặc số tiền cố định. Khách áp mã ở giỏ hàng; giảm giá áp dụng cho cả VietQR và Lemon Squeezy."
        action={
          <Button
            render={<Link href="/admin/coupons/new" />}
            nativeButton={false}
          >
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Mã mới
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminMetric label="Tổng mã" value={coupons.length} />
        <AdminMetric label="Đang bật" value={activeCount} />
        <AdminMetric label="Tổng lượt dùng" value={totalRedemptions} />
      </div>

      <CouponTable coupons={coupons} />
    </div>
  );
}
