/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  Clock3Icon,
  Code2Icon,
  CreditCardIcon,
  LifeBuoyIcon,
  Layers3Icon,
  PackageOpenIcon,
  RotateCcwIcon,
  SparklesIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import {
  formatProductPrice,
  getProductDeliveryLabel,
  productTypeLabels,
} from "@/lib/products/display";
import {
  getPublishedProducts,
  type PublishedProduct,
} from "@/lib/supabase/queries/products";
import { ProductArtwork, ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { betaPolicies, getSupportEmail } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type HeroSignal = {
  description: string;
  title: string;
};

type CategoryBlock = {
  description: string;
  Icon: LucideIcon;
  label: string;
  title: string;
};

type TrustBlock = {
  description: string;
  Icon: LucideIcon;
  title: string;
};

const heroSignals: HeroSignal[] = [
  {
    title: "AI tool & account",
    description: "Tài nguyên cho workflow coding, automation và builder AI.",
  },
  {
    title: "Source code sẵn dùng",
    description: "Starter kit, template và mini tool để ship nhanh hơn.",
  },
  {
    title: "Giao ngay sau checkout",
    description: "Nhận file, link tải hoặc quyền truy cập trong tài khoản.",
  },
];

const categories: CategoryBlock[] = [
  {
    title: "AI accounts",
    label: "Truy cập",
    description: "Gói truy cập, quota và tài khoản phục vụ workflow AI thực chiến.",
    Icon: SparklesIcon,
  },
  {
    title: "Source code",
    label: "Code",
    description: "Starter, module và boilerplate để build tiếp thay vì làm lại từ đầu.",
    Icon: Code2Icon,
  },
  {
    title: "Templates",
    label: "UI kit",
    description: "Layout, landing page và template triển khai nhanh cho sản phẩm web.",
    Icon: PackageOpenIcon,
  },
  {
    title: "Mini tools",
    label: "Utility",
    description: "Tool nhỏ cho productivity, content, data và vận hành nội bộ.",
    Icon: WrenchIcon,
  },
  {
    title: "Courses & notes",
    label: "Learn",
    description: "Ghi chú triển khai, launch notes và tài nguyên học có cấu trúc.",
    Icon: BookOpenIcon,
  },
  {
    title: "Bundles",
    label: "Pack",
    description: "Combo tài nguyên theo use case để mua một lần và dùng cho nhiều dự án.",
    Icon: Layers3Icon,
  },
];

const trustBlocks: TrustBlock[] = [
  {
    title: "Giao ngay trong dashboard",
    description: betaPolicies.delivery,
    Icon: Clock3Icon,
  },
  {
    title: "Thanh toán an toàn",
    description: "Lemon Squeezy xử lý thẻ quốc tế; VietQR dành cho đơn VND cần duyệt thủ công.",
    Icon: CreditCardIcon,
  },
  {
    title: "Support beta trong 24h",
    description: `Gửi email ${getSupportEmail()} nếu đơn hàng hoặc quyền truy cập chưa hiển thị.`,
    Icon: LifeBuoyIcon,
  },
  {
    title: "Hoàn tiền 7 ngày có điều kiện",
    description: betaPolicies.refund,
    Icon: RotateCcwIcon,
  },
];

const fallbackProducts = [
  {
    title: "Starter full-stack cho AI tool",
    type: "Source code",
    description: "Auth, dashboard, billing và các flow nền tảng để bắt đầu nhanh.",
  },
  {
    title: "Bộ template launch cho indie hacker",
    type: "Template",
    description: "Landing page, pricing, changelog và các block chuyển đổi cao.",
  },
  {
    title: "Mini tool cho creator workflow",
    type: "Utility",
    description: "Các công cụ nhỏ giúp tăng tốc publish, automation và vận hành.",
  },
];

export default async function HomePage() {
  const products = await getPublishedProducts(6);
  const featuredProducts = products.slice(0, 6);
  const heroProduct = featuredProducts[0];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_32%),radial-gradient(circle_at_top_right,var(--muted)_0,transparent_38%)] opacity-35" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.06]" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:py-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12">
          <div className="flex max-w-3xl flex-col gap-5">
            <div className="inline-flex w-fit items-center rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              DanCruShop cho builder
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="max-w-4xl text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance sm:text-4xl md:text-5xl lg:text-6xl">
                Tool, source code và tài nguyên AI để ship nhanh hơn.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                DanCruShop ưu tiên đúng một việc: giúp developer quét nhanh kho
                hàng, hiểu rõ món cần mua và nhận tài nguyên gọn trong tài khoản
                sau checkout.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="#san-pham-noi-bat" />}
                nativeButton={false}
              >
                Xem sản phẩm
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/products" />}
                nativeButton={false}
              >
                Khám phá tool
              </Button>
            </div>

            <div className="hidden gap-3 md:grid md:grid-cols-3">
              {heroSignals.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/80 bg-card/55 p-4 shadow-sm backdrop-blur-xl"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroProductSpotlight product={heroProduct} />
          </div>
        </div>
      </section>

      <section
        id="san-pham-noi-bat"
        className="scroll-mt-24 border-b border-border/80 py-12 md:py-16"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <SectionHeader
            title="Sản phẩm nổi bật"
            description="Các tài nguyên mở bán ngay bây giờ, ưu tiên thứ có mô tả rõ, giá rõ và nhận hàng nhanh."
            actionLabel="Xem toàn bộ"
            actionHref="/products"
          />

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {fallbackProducts.map((item) => (
                <div
                  key={item.title}
                  className="flex min-h-72 flex-col rounded-2xl border border-border/80 bg-card/60 p-5 text-card-foreground shadow-sm backdrop-blur-xl"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground shadow-sm">
                    <PackageOpenIcon aria-hidden="true" className="size-5" />
                  </div>
                  <div className="mt-5 grid gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.type}
                    </span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <p className="mt-auto pt-6 text-sm text-muted-foreground">
                    Đang chuẩn bị publish
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="danh-muc"
        className="scroll-mt-24 border-b border-border/80 py-12 md:py-16"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <SectionHeader
            title="Danh mục mua nhanh"
            description="Quét nhanh loại tài nguyên bạn cần rồi đi thẳng vào kho sản phẩm thay vì đọc quá nhiều giải thích."
            actionLabel="Mở kho hàng"
            actionHref="/products"
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.title} item={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              Trải nghiệm mua hàng
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Một storefront tốt phải giúp khách quyết định nhanh và nhận hàng rõ.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              Homepage giờ tập trung vào việc bán hàng: thấy ngay sản phẩm,
              hiểu nhanh danh mục, và tin tưởng rằng sau thanh toán mọi thứ sẽ
              nằm gọn trong dashboard.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link href="/products" />}
                nativeButton={false}
              >
                Xem kho sản phẩm
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Button>
              <Button
                variant="outline"
                render={<Link href="/cart" />}
                nativeButton={false}
              >
                Xem giỏ hàng
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {trustBlocks.map((item) => (
              <TrustCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroProductSpotlight({ product }: { product?: PublishedProduct }) {
  const detailRows = [
    {
      label: "Loại",
      value: product ? productTypeLabels[product.product_type] : "Marketplace",
    },
    {
      label: "Giao hàng",
      value: product ? getProductDeliveryLabel(product) : "Mở khóa trong tài khoản",
    },
    {
      label: "Giá",
      value: product ? formatProductPrice(product) : "Đang cập nhật",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute inset-x-10 bottom-2 top-10 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Đang mở bán
            </span>
          </div>
          <span className="rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {product ? productTypeLabels[product.product_type] : "Sản phẩm mẫu"}
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,11rem)_1fr] sm:p-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/80 bg-muted">
            {product?.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.title}
                className="absolute inset-0 size-full object-cover"
              />
            ) : product ? (
              <ProductArtwork product={product} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_38%),linear-gradient(180deg,var(--muted),var(--background))] opacity-60" />
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Gợi ý trong tuần
              </p>
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em]">
                {product?.title ?? "Kho tool đang được cập nhật"}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {product?.short_description ??
                  "Danh sách sản phẩm sẽ hiện tại đây ngay khi có món được publish từ CMS."}
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/80 bg-background/70 p-3">
              {detailRows.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-right font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full sm:w-fit"
              render={
                <Link href={product ? `/products/${product.slug}` : "/products"} />
              }
              nativeButton={false}
              variant="secondary"
            >
              Xem chi tiết
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ item }: { item: CategoryBlock }) {
  const Icon = item.Icon;

  return (
    <Link
      href="/products"
      className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/55 p-5 text-card-foreground shadow-sm backdrop-blur-xl transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-primary/60 via-transparent to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground shadow-sm">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <span className="rounded-full border border-border/80 bg-background/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {item.label}
        </span>
      </div>

      <div className="mt-5 grid gap-2">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

function TrustCard({ item }: { item: TrustBlock }) {
  const Icon = item.Icon;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/55 p-5 text-card-foreground shadow-sm backdrop-blur-xl">
      <div className="flex size-11 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground shadow-sm">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="mt-5 grid gap-2">
        <h3 className="text-base font-semibold">{item.title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          {title}
        </h2>
        <p className="text-sm leading-7 text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
      <Button
        className={cn("w-fit")}
        variant="outline"
        render={<Link href={actionHref} />}
        nativeButton={false}
      >
        {actionLabel}
        <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
      </Button>
    </div>
  );
}
