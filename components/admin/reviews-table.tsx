"use client";

import { useMemo, useState } from "react";
import { MessageSquareIcon, StarIcon } from "lucide-react";

import { AdminActionMenu } from "@/components/admin/admin-action-menu";
import { ReviewActionButtons } from "@/components/admin/review-action-buttons";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminPendingReview } from "@/lib/supabase/queries/admin-reviews";

type ReviewsTableProps = {
  reviews: AdminPendingReview[];
};

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

export function ReviewsTable({ reviews }: ReviewsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return reviews;
    }

    return reviews.filter(
      (review) =>
        review.author_name?.toLowerCase().includes(term) ||
        review.comment.toLowerCase().includes(term) ||
        review.title?.toLowerCase().includes(term) ||
        review.product_title?.toLowerCase().includes(term)
    );
  }, [reviews, query]);

  return (
    <div className="flex flex-col gap-4">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm kiếm đánh giá theo sản phẩm, tác giả hoặc bình luận..."
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1 border-b p-5">
          <h2 className="text-base font-semibold tracking-normal">
            Không gian đánh giá
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Hiển thị {filtered.length}/{reviews.length} đánh giá chờ duyệt.
          </p>
        </div>

        {filtered.length > 0 ? (
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
              {filtered.map((review) => (
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
                      <span className="text-muted-foreground italic">Ẩn danh</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <StarRating rating={review.rating} />
                      {review.title && (
                        <span className="text-xs font-medium">{review.title}</span>
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
                    <AdminActionMenu label={`Hành động cho đánh giá của ${review.author_name ?? "Ẩn danh"}`}>
                      <ReviewActionButtons reviewId={review.id} menuItem />
                    </AdminActionMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={MessageSquareIcon}
              title={
                reviews.length === 0
                  ? "Không có review chờ duyệt"
                  : "Không tìm thấy đánh giá"
              }
              description={
                reviews.length === 0
                  ? "Tất cả review đã được xử lý hoặc chưa có review mới nào được gửi."
                  : "Vui lòng thử tìm kiếm bằng từ khóa khác."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
