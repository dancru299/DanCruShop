/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  Code2Icon,
  CreditCardIcon,
  DownloadIcon,
  LayoutDashboardIcon,
  PackageOpenIcon,
  RocketIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";

import { BlogCard } from "@/components/blog/blog-card";
import {
  formatProductPrice,
  ProductArtwork,
  ProductCard,
} from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import {
  getPublishedProducts,
  type PublishedProduct,
} from "@/lib/supabase/queries/products";
import { getPublishedPosts } from "@/lib/supabase/queries/blog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type IconBlock = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

const storefrontHighlights: IconBlock[] = [
  {
    title: "Source code có ngữ cảnh",
    description: "Không chỉ là file tải về, mỗi sản phẩm có mô tả, demo và stack rõ ràng.",
    Icon: Code2Icon,
  },
  {
    title: "Thanh toán và mở khóa",
    description: "Hỗ trợ flow mua hàng, đơn hàng, purchase và quyền tải tài nguyên.",
    Icon: CreditCardIcon,
  },
  {
    title: "Dashboard cho người mua",
    description: "Người dùng đăng nhập để xem sản phẩm đã mua và tạo link tải an toàn.",
    Icon: LayoutDashboardIcon,
  },
  {
    title: "Blog kéo traffic",
    description: "CMS bài viết giúp kết nối tutorial, ghi chú học tập và sản phẩm liên quan.",
    Icon: BookOpenIcon,
  },
];

const deliverySteps: IconBlock[] = [
  {
    title: "Khám phá",
    description: "Xem sản phẩm nổi bật, ảnh preview, mô tả ngắn và giá.",
    Icon: PackageOpenIcon,
  },
  {
    title: "Mua hoặc nhận miễn phí",
    description: "Checkout tạo đơn hàng, xác nhận thanh toán rồi mở quyền truy cập.",
    Icon: ShieldCheckIcon,
  },
  {
    title: "Tải về trong dashboard",
    description: "Tài nguyên được giao qua dashboard với link tải được bảo vệ.",
    Icon: DownloadIcon,
  },
];

const platformProof: IconBlock[] = [
  {
    title: "Admin CMS",
    description: "Quản lý sản phẩm, file, đơn hàng và blog trong cùng một hệ thống.",
    Icon: LayoutDashboardIcon,
  },
  {
    title: "Delivery tự động",
    description: "Webhook thanh toán tạo order, purchase và unlock tài nguyên số.",
    Icon: RocketIcon,
  },
  {
    title: "Sẵn cho SEO",
    description: "Product detail, blog detail và metadata được tách theo route public.",
    Icon: CheckCircle2Icon,
  },
];

const plannedShelves = [
  {
    title: "Full-stack starter",
    type: "Source code",
    description: "Một bộ code mẫu có auth, database, dashboard và payment flow.",
    className: "from-emerald-500/25 via-cyan-500/10 to-background",
  },
  {
    title: "AI workflow notes",
    type: "Learning notes",
    description: "Ghi chú triển khai AI app, agent workflow và cách đóng gói sản phẩm.",
    className: "from-cyan-500/25 via-amber-500/10 to-background",
  },
  {
    title: "Creator mini tools",
    type: "Mini tool",
    description: "Các công cụ nhỏ phục vụ automation, productivity và vận hành shop.",
    className: "from-rose-500/20 via-emerald-500/10 to-background",
  },
];

const resourceMarqueeItems = [
  ["Source code", "Next.js, Supabase, payment flows"],
  ["Templates", "Reusable layouts for real launches"],
  ["Mini tools", "Automation and productivity utilities"],
  ["Learning notes", "Practical build logs and tutorials"],
  ["Secure delivery", "Dashboard access and protected downloads"],
  ["Creator CMS", "Products, orders, files, and blog"],
];

const heroActivityItems = [
  ["Preview ready", "Product artwork rendered"],
  ["Checkout linked", "Order flow prepared"],
  ["Purchase unlocked", "Dashboard access granted"],
  ["Download secured", "Protected file delivery"],
];

export default async function HomePage() {
  const [products, posts] = await Promise.all([
    getPublishedProducts(6),
    getPublishedPosts(3),
  ]);
  const heroProduct = products[0];

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b bg-background">
        <div className="motion-hero-grid absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.08]" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 md:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <div className="motion-fade-up flex max-w-3xl flex-col gap-7">
            <div className="flex flex-col gap-5">
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-balance md:text-6xl">
                DanCruShop
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Cửa hàng sản phẩm số cho builder: source code, template, mini
                tool, ghi chú học tập và tài nguyên thực chiến được đóng gói để
                dùng ngay.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="transition-transform duration-300 hover:-translate-y-0.5"
                size="lg"
                render={<Link href="/products" />}
                nativeButton={false}
              >
                Xem sản phẩm
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
              <Button
                className="transition-transform duration-300 hover:-translate-y-0.5"
                size="lg"
                variant="outline"
                render={<Link href="/blog" />}
                nativeButton={false}
              >
                Đọc blog
              </Button>
            </div>

            <div className="grid gap-3 border-t pt-6 sm:grid-cols-3">
              {[
                ["Digital product shop", "MVP public store"],
                ["Protected downloads", "Buyer dashboard"],
                ["Creator CMS", "Admin workflow"],
              ].map(([title, description]) => (
                <div key={title} className="grid gap-1 transition-transform duration-300 hover:-translate-y-0.5">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <HeroShowcase product={heroProduct} />
        </div>
      </section>

      <section className="scroll-reveal border-b bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-8 md:grid-cols-2 lg:grid-cols-4">
          {storefrontHighlights.map((item) => (
            <FeatureItem key={item.title} item={item} />
          ))}
        </div>
      </section>

      <ResourceMarquee />

      <section className="scroll-reveal bg-muted/30 py-14 md:py-18">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <SectionHeader
            title="Sản phẩm nổi bật"
            description="Các tài nguyên mới nhất từ shop, dành cho developer, learner và maker đang xây dự án thật."
            actionLabel="Xem tất cả"
            actionHref="/products"
          />

          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {plannedShelves.map((item) => (
                <PlannedShelfCard key={item.title} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="scroll-reveal border-y bg-background py-14 md:py-18">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="flex max-w-xl flex-col gap-4">
            <h2 className="text-2xl font-semibold leading-tight tracking-normal md:text-4xl">
              Từ xem sản phẩm đến tải file, flow đã được nối thành một mạch.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              PRD không chỉ cần một trang giới thiệu. DanCruShop cần một đường
              mua hàng hoàn chỉnh: product detail, checkout, webhook, purchase
              record và dashboard tải tài nguyên.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {deliverySteps.map((item, index) => (
              <WorkflowStep key={item.title} index={index + 1} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-reveal bg-muted/30 py-14 md:py-18">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <SectionHeader
            title="Bài viết mới"
            description="Blog là phần kéo traffic dài hạn: ghi chú triển khai, tutorial và câu chuyện xây sản phẩm số."
            actionLabel="Đọc blog"
            actionHref="/blog"
          />

          {posts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex max-w-2xl flex-col gap-2">
                <h3 className="text-lg font-semibold tracking-normal">
                  Blog đang chờ bài đầu tiên
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Khi bài viết được publish từ CMS, homepage sẽ tự động kéo các
                  bài mới nhất về đây để nối nội dung với sản phẩm.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="scroll-reveal bg-background py-14 md:py-18">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex max-w-xl flex-col gap-4">
            <h2 className="text-2xl font-semibold leading-tight tracking-normal md:text-4xl">
              Một storefront cá nhân, nhưng nền móng đủ để mở rộng.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              Bản MVP tập trung đúng mục tiêu trong PRD: bán và phân phối sản
              phẩm số trước, sau đó mới mở rộng dần sang khóa học, video và tài
              nguyên nâng cao.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link href="/products" />}
                nativeButton={false}
              >
                Khám phá cửa hàng
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard" />}
                nativeButton={false}
              >
                Vào dashboard
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {platformProof.map((item) => (
              <ProofRow key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ResourceMarquee() {
  const railItems = [...resourceMarqueeItems, ...resourceMarqueeItems];

  return (
    <section className="scroll-reveal border-b bg-background py-4">
      <div className="motion-marquee overflow-hidden">
        <div className="motion-marquee-track flex gap-3 px-4">
          {railItems.map(([label, description], index) => (
            <div
              key={`${label}-${index}`}
              className="group flex min-w-72 items-center gap-3 rounded-lg border bg-card px-4 py-3 text-card-foreground shadow-sm transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-foreground/35 hover:bg-accent/60"
            >
              <span className="motion-pulse-dot size-2 shrink-0 rounded-full bg-emerald-400" />
              <div className="grid gap-0.5">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroShowcase({ product }: { product?: PublishedProduct }) {
  return (
    <div className="motion-fade-up motion-delay-2 relative hidden lg:block">
      <div className="motion-float-soft relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-2xl shadow-foreground/10">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Creator storefront
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b p-5 md:border-b-0 md:border-r">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              {product?.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : product ? (
                <ProductArtwork product={product} />
              ) : (
                <EmptyProductPreview />
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 p-5">
            <div className="grid gap-3">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                Sản phẩm đang hiển thị
              </p>
              <div className="grid gap-2">
                <h2 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-normal">
                  {product?.title ?? "Kệ sản phẩm đầu tiên"}
                </h2>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {product?.short_description ??
                    "Chuẩn bị publish source code, template, mini tool và tài nguyên học tập cho builder."}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                ["Preview", product?.thumbnail_url ? "Live asset" : "Generated"],
                ["Delivery", "Dashboard"],
                ["Price", product ? formatProductPrice(product) : "Sắp mở bán"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>

            <HeroActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroActivityFeed() {
  return (
    <div className="relative h-12 overflow-hidden rounded-lg border bg-background/60 px-3 text-sm shadow-sm">
      <div className="motion-slide-column grid">
        {heroActivityItems.map(([label, description], index) => (
          <div
            key={`${label}-${index}`}
            className="flex h-12 items-center justify-between gap-4"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="motion-pulse-dot size-2 shrink-0 rounded-full bg-emerald-400" />
              <span className="truncate font-medium">{label}</span>
            </div>
            <span className="truncate text-xs text-muted-foreground">
              {description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyProductPreview() {
  return (
    <div className="motion-gradient-pan absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-cyan-500/10 to-background">
      <div className="motion-scanline pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-foreground/10 to-transparent" />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              DanCruShop
            </span>
            <span className="text-sm font-semibold">Launch shelf</span>
          </div>
          <Code2Icon aria-hidden="true" className="size-8 text-foreground/60" />
        </div>

        <div className="rounded-lg border bg-background/70 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-1.5 font-mono text-xs text-muted-foreground">
            <span>const product = &#123;</span>
            <span className="pl-4 text-foreground">
              type: &quot;source-code&quot;,
            </span>
            <span className="pl-4 text-foreground">
              delivery: &quot;instant&quot;,
            </span>
            <span>&#125;</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Files + docs</span>
          <span>Ready soon</span>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ item }: { item: IconBlock }) {
  const Icon = item.Icon;

  return (
    <div className="group/feature flex gap-3 rounded-lg p-1 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground shadow-sm transition-[transform,border-color] duration-300 group-hover/feature:-rotate-3 group-hover/feature:border-foreground/35">
        <Icon aria-hidden="true" className="size-5 transition-transform duration-300 group-hover/feature:scale-110" />
      </div>
      <div className="grid gap-1">
        <h2 className="text-sm font-semibold tracking-normal">{item.title}</h2>
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
        <h2 className="text-2xl font-semibold tracking-normal md:text-3xl">
          {title}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
      <Button
        className="w-fit"
        variant="outline"
        render={<Link href={actionHref} />}
        nativeButton={false}
      >
        {actionLabel}
        <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
      </Button>
    </div>
  );
}

function PlannedShelfCard({
  item,
}: {
  item: {
    title: string;
    type: string;
    description: string;
    className: string;
  };
}) {
  return (
    <div className="group/planned flex min-h-72 flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-xl hover:shadow-foreground/10">
      <div
        className={cn(
          "motion-gradient-pan relative aspect-[16/10] overflow-hidden bg-gradient-to-br",
          item.className
        )}
      >
        <div className="motion-scanline pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-foreground/10 to-transparent" />
        <div className="absolute inset-x-5 top-5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {item.type}
          </span>
          <PackageOpenIcon
            aria-hidden="true"
            className="size-5 text-foreground/60 transition-transform duration-300 group-hover/planned:rotate-6 group-hover/planned:scale-110"
          />
        </div>
        <div className="absolute bottom-5 left-5 right-5 grid gap-2">
          <div className="h-2 w-24 rounded-full bg-foreground/70" />
          <div className="h-2 w-36 rounded-full bg-foreground/25" />
          <div className="h-2 w-20 rounded-full bg-foreground/20" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-foreground/15 to-transparent opacity-0 transition-all duration-700 group-hover/planned:left-full group-hover/planned:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-base font-semibold leading-6 tracking-normal">
          {item.title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
        <p className="mt-auto border-t pt-4 text-sm font-medium text-muted-foreground">
          Đang chuẩn bị publish
        </p>
      </div>
    </div>
  );
}

function WorkflowStep({
  index,
  item,
}: {
  index: number;
  item: IconBlock;
}) {
  const Icon = item.Icon;

  return (
    <div className="group/workflow flex h-full flex-col gap-5 rounded-lg border bg-card p-5 text-card-foreground shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-xl hover:shadow-foreground/10">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          0{index}
        </span>
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground transition-transform duration-300 group-hover/workflow:-rotate-3 group-hover/workflow:scale-110">
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>
      <div className="grid gap-2">
        <h3 className="text-base font-semibold tracking-normal">
          {item.title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
      </div>
    </div>
  );
}

function ProofRow({ item }: { item: IconBlock }) {
  const Icon = item.Icon;

  return (
    <div className="group/proof flex gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-xl hover:shadow-foreground/10">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-transform duration-300 group-hover/proof:-rotate-3 group-hover/proof:scale-110">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="grid gap-1">
        <h3 className="text-base font-semibold tracking-normal">{item.title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
      </div>
    </div>
  );
}
