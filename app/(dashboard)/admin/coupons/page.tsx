import { CouponManager } from "@/components/admin/coupon-manager";
import { getAdminCoupons } from "@/lib/supabase/queries/coupons";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Marketing</p>
        <h1 className="text-3xl font-semibold tracking-normal">Coupons</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Tạo mã giảm giá theo phần trăm hoặc số tiền cố định. Khách áp mã ở giỏ
          hàng; giảm giá áp dụng cho cả VietQR và Lemon Squeezy.
        </p>
      </div>

      <CouponManager coupons={coupons} />
    </div>
  );
}
