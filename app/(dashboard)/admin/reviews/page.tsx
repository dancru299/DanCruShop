import { MessageSquareIcon, StarIcon } from "lucide-react";

import { ReviewActionButtons } from "@/components/admin/review-action-buttons";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminPendingReviews } from "@/lib/supabase/queries/admin-reviews";

export const dynamic = "force-dynamic";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          aria-hidden="true"
          className={`size-3.5 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

export default async function AdminReviewsPage() {
  const reviews = await getAdminPendingReviews();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Review management</p>
        <h1 className="text-3xl font-semibold tracking-normal">Reviews</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Duyệt hoặc từ chối các review đang chờ xét duyệt trước khi hiển thị
          công khai.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {reviews.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.product_title ?? (
                      <span className="text-muted-foreground">
                        {review.product_id.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {review.author_name ?? (
                      <span className="text-muted-foreground italic">
                        Ẩn danh
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <StarRating rating={review.rating} />
                      {review.title && (
                        <span className="text-xs font-medium">
                          {review.title}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {formatDate(review.created_at)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ReviewActionButtons reviewId={review.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <MessageSquareIcon aria-hidden="true" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                Không có review chờ duyệt
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Tất cả review đã được xử lý hoặc chưa có review mới nào được
                gửi.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
