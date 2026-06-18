import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReviewsTable } from "@/components/admin/reviews-table";
import { getAdminPendingReviews } from "@/lib/supabase/queries/admin-reviews";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await getAdminPendingReviews();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Kiểm duyệt nội dung"
        title="Đánh giá"
        description="Duyệt hoặc từ chối các đánh giá của khách hàng trước khi hiển thị công khai trên storefront."
      />

      <ReviewsTable reviews={reviews} />
    </div>
  );
}
