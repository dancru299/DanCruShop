"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2Icon, XIcon } from "lucide-react";

export type SocialProofProduct = {
  title: string;
  slug: string;
  thumbnailUrl: string | null;
};

// Buyer names are intentionally masked (real customers are never exposed); only
// the product is real. Tweak this pool to taste.
const BUYER_NAMES = [
  "Nguyễn Văn A",
  "Trần Thị B",
  "Lê Hoàng C",
  "Phạm Minh D",
  "Hoàng Thị E",
  "Vũ Đức F",
  "Đặng Thu G",
  "Bùi Quang H",
  "Đỗ Thị K",
  "Ngô Văn L",
  "Dương Minh M",
  "Phan Thị N",
];

const ACTIONS = ["vừa mua", "vừa xem", "vừa thêm vào giỏ"];

type Notice = {
  product: SocialProofProduct;
  name: string;
  action: string;
  minutes: number;
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function SocialProof({ products }: { products: SocialProofProduct[] }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (products.length === 0 || dismissed) {
      return;
    }

    let hideTimeout: ReturnType<typeof setTimeout>;

    const showNext = () => {
      setNotice({
        product: pick(products),
        name: pick(BUYER_NAMES),
        action: pick(ACTIONS),
        minutes: 1 + Math.floor(Math.random() * 30),
      });
      hideTimeout = setTimeout(() => setNotice(null), 5000);
    };

    const firstTimeout = setTimeout(showNext, 4000);
    const interval = setInterval(showNext, 12000);

    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(hideTimeout);
      clearInterval(interval);
    };
  }, [products, dismissed]);

  if (!notice || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 w-[19rem] max-w-[calc(100vw-2.5rem)]">
      <div className="relative flex items-center gap-3 rounded-xl border bg-card/95 p-2.5 pr-8 text-card-foreground shadow-xl backdrop-blur">
        <Link
          href={`/products/${notice.product.slug}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {notice.product.thumbnailUrl ? (
              <img
                src={notice.product.thumbnailUrl}
                alt={notice.product.title}
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm leading-5">
              <span className="font-semibold">{notice.name}</span>{" "}
              {notice.action}
            </p>
            <p className="truncate text-xs font-medium text-foreground/80">
              {notice.product.title}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              {notice.minutes} phút trước
              <span aria-hidden="true">·</span>
              <CheckCircle2Icon
                aria-hidden="true"
                className="size-3 text-emerald-500"
              />
              Đã xác minh
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Đóng thông báo"
          className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <XIcon aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
