"use client";

import { useActionState } from "react";
import {
  CheckCircle2Icon,
  MessageSquareReplyIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";

import {
  createProductReview,
  createProductReviewReply,
  type ProductReviewActionState,
} from "@/actions/product-review.actions";
import { teamPledge } from "@/lib/site-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type {
  ProductReview,
  ProductReviewData,
} from "@/lib/supabase/queries/product-reviews";
import { cn } from "@/lib/utils";

type ProductReviewsProps = {
  canReply: boolean;
  canReview: boolean;
  isAuthenticated: boolean;
  productId: string;
  reviewsData: ProductReviewData;
  slug: string;
};

const initialActionState: ProductReviewActionState = {
  error: null,
  success: null,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function Stars({
  className,
  rating,
}: {
  className?: string;
  rating: number;
}) {
  return (
    <div className={cn("flex items-center gap-0.5 text-amber-400", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          aria-hidden="true"
          className={cn(
            "size-4",
            star <= Math.round(rating) ? "fill-current" : "fill-transparent"
          )}
        />
      ))}
    </div>
  );
}

function ReviewComposer({
  canReview,
  isAuthenticated,
  productId,
  slug,
}: Pick<
  ProductReviewsProps,
  "canReview" | "isAuthenticated" | "productId" | "slug"
>) {
  const [state, action, isPending] = useActionState(
    createProductReview,
    initialActionState
  );

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm leading-6 text-muted-foreground">
        Log in after purchasing to submit a verified review.
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm leading-6 text-muted-foreground">
        Only verified buyers can rate and review this product.
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4 rounded-lg border bg-background p-4">
      <input name="productId" type="hidden" value={productId} />
      <input name="slug" type="hidden" value={slug} />

      <div className="grid gap-2">
        <p className="text-sm font-medium">Your rating</p>
        <div className="flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted has-[:checked]:border-foreground has-[:checked]:bg-muted"
            >
              <input
                className="sr-only"
                defaultChecked={rating === 5}
                name="rating"
                type="radio"
                value={rating}
              />
              <Stars rating={rating} />
              <span>{rating}</span>
            </label>
          ))}
        </div>
      </div>

      <Input name="title" placeholder="A short title for your review" />
      <Textarea
        name="comment"
        placeholder="Share what's useful, what could be better, and who this product is for."
        rows={5}
        required
      />

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-500">{state.success}</p>
      ) : null}

      <Button type="submit" className="w-fit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}

function ReplyComposer({
  canReply,
  productId,
  reviewId,
  slug,
}: {
  canReply: boolean;
  productId: string;
  reviewId: string;
  slug: string;
}) {
  const [state, action, isPending] = useActionState(
    createProductReviewReply,
    initialActionState
  );

  if (!canReply) {
    return null;
  }

  return (
    <form action={action} className="mt-4 grid gap-2">
      <input name="productId" type="hidden" value={productId} />
      <input name="reviewId" type="hidden" value={reviewId} />
      <input name="slug" type="hidden" value={slug} />
      <Textarea
        name="comment"
        placeholder="Reply to this review"
        rows={2}
        required
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          <MessageSquareReplyIcon aria-hidden="true" data-icon="inline-start" />
          {isPending ? "Replying..." : "Reply"}
        </Button>
        {state.error ? (
          <span className="text-xs text-destructive">{state.error}</span>
        ) : null}
        {state.success ? (
          <span className="text-xs text-emerald-500">{state.success}</span>
        ) : null}
      </div>
    </form>
  );
}

function ReviewItem({
  canReply,
  productId,
  review,
  slug,
}: {
  canReply: boolean;
  productId: string;
  review: ProductReview;
  slug: string;
}) {
  return (
    <article className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{review.authorName}</span>
              <Badge variant={review.authorRole === "admin" ? "default" : "secondary"}>
                {review.authorRole === "admin" ? "DanCruShop" : "Verified buyer"}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(review.created_at)}
            </span>
          </div>
          <Stars rating={review.rating} />
        </div>

        <div className="grid gap-2">
          {review.title ? (
            <h3 className="text-base font-semibold tracking-normal">
              {review.title}
            </h3>
          ) : null}
          <p className="text-sm leading-7 text-muted-foreground">
            {review.comment}
          </p>
        </div>

        {review.replies.length > 0 ? (
          <div className="grid gap-3 border-l pl-4">
            {review.replies.map((reply) => (
              <div key={reply.id} className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {reply.authorName}
                  </span>
                  <Badge variant={reply.authorRole === "admin" ? "default" : "outline"}>
                    {reply.authorRole === "admin" ? "DanCruShop" : "Buyer reply"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(reply.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {reply.comment}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <ReplyComposer
          canReply={canReply}
          productId={productId}
          reviewId={review.id}
          slug={slug}
        />
      </div>
    </article>
  );
}

// Shown when a product has no reviews yet — an invitation plus the team's
// quality pledge so an empty section never reads as a red flag to a first buyer.
function FirstReviewInvite() {
  return (
    <div className="flex h-full flex-col justify-center gap-5 rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-2">
        <span className="flex size-11 items-center justify-center rounded-full bg-amber-400/15 text-amber-500">
          <SparklesIcon aria-hidden="true" className="size-5" />
        </span>
        <h3 className="text-xl font-semibold tracking-normal">
          {teamPledge.heading}
        </h3>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground">
          {teamPledge.intro}
        </p>
      </div>
      <div className="grid gap-3 rounded-lg border bg-background/60 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon
            aria-hidden="true"
            className="size-4 text-foreground"
          />
          <span className="text-sm font-medium">From the DanCruShop team</span>
        </div>
        <div className="grid gap-2.5">
          {teamPledge.promises.map((promise) => (
            <div key={promise} className="flex gap-3">
              <CheckCircle2Icon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-emerald-400"
              />
              <p className="text-sm leading-6 text-muted-foreground">
                {promise}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductReviews({
  canReply,
  canReview,
  isAuthenticated,
  productId,
  reviewsData,
  slug,
}: ProductReviewsProps) {
  const { reviews, summary } = reviewsData;
  const averageRating = summary.averageRating.toFixed(1);

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 md:py-16 lg:grid-cols-[360px_1fr]">
      <aside className="h-fit rounded-lg border bg-card p-5 text-card-foreground shadow-sm lg:sticky lg:top-24">
        <div className="grid gap-5">
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">Reviews from buyers</p>
            <h2 className="text-2xl font-semibold tracking-normal">
              Ratings & reviews
            </h2>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-semibold tracking-normal">
                {summary.totalReviews > 0 ? averageRating : "New"}
              </span>
              <div className="grid gap-1 pb-1">
                <Stars rating={summary.averageRating} />
                <span className="text-sm text-muted-foreground">
                  {summary.totalReviews > 0
                    ? `${summary.totalReviews} verified reviews`
                    : "Be the first to review"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count =
                summary.ratingCounts[rating as 1 | 2 | 3 | 4 | 5];
              const width =
                summary.totalReviews > 0
                  ? `${(count / summary.totalReviews) * 100}%`
                  : "0%";

              return (
                <div
                  key={rating}
                  className="grid grid-cols-[56px_1fr_32px] items-center gap-2 text-xs text-muted-foreground"
                >
                  <span>{rating} stars</span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width }}
                    />
                  </div>
                  <span className="text-right">{count}</span>
                </div>
              );
            })}
          </div>

          <ReviewComposer
            canReview={canReview}
            isAuthenticated={isAuthenticated}
            productId={productId}
            slug={slug}
          />
        </div>
      </aside>

      <div className="grid gap-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewItem
              key={review.id}
              canReply={canReply}
              productId={productId}
              review={review}
              slug={slug}
            />
          ))
        ) : (
          <FirstReviewInvite />
        )}
      </div>
    </section>
  );
}
