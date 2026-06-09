import { notFound } from "next/navigation";

import { CouponForm } from "@/components/admin/coupon-form";
import { getCouponById } from "@/lib/supabase/queries/coupons";

type EditCouponPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditCouponPage({ params }: EditCouponPageProps) {
  const { id } = await params;
  const coupon = await getCouponById(id);

  if (!coupon) {
    notFound();
  }

  return <CouponForm mode="edit" coupon={coupon} />;
}
