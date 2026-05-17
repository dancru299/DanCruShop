/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  Code2Icon,
  CpuIcon,
  CreditCardIcon,
  DatabaseIcon,
  DownloadIcon,
  GitBranchIcon,
  Layers3Icon,
  LockKeyholeIcon,
  MonitorSmartphoneIcon,
  PackageOpenIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  StarIcon,
  TimerIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import { BlogCard } from "@/components/blog/blog-card";
import {
  formatProductPrice,
  ProductArtwork,
  ProductCard,
} from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { getProductDeliveryLabel, productTypeLabels } from "@/lib/products/display";
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

type CategoryBlock = IconBlock & {
  label: string;
  accentClassName: string;
};

const heroStats = [
  ["AI accounts & tools", "Tài nguyên công nghệ"],
  ["Instant delivery", "Mở quyền sau checkout"],
  ["Real previews", "Xem trước rồi mới mua"],
];

const storefrontHighlights: IconBlock[] = [
  {
    title: "Mặt hàng rõ loại",
    description:
      "Acc AI, source code, template, mini tool và bundle được phân loại để khách chọn nhanh.",
    Icon: ShoppingBagIcon,
  },
  {
    title: "Preview trước khi mua",
    description:
      "Mỗi sản phẩm có ảnh, mô tả, giá, loại tài nguyên và cách nhận hàng ngay trên card.",
    Icon: MonitorSmartphoneIcon,
  },
  {
    title: "Checkout một lượt",
    description:
      "Khách thêm nhiều món vào giỏ, thanh toán, rồi nhận quyền truy cập trong tài khoản.",
    Icon: CreditCardIcon,
  },
  {
    title: "Giao hàng bảo vệ",
    description:
      "File, link tải hoặc quyền truy cập được giao qua dashboard thay vì gửi rời rạc.",
    Icon: ShieldCheckIcon,
  },
];

const shopCategories: CategoryBlock[] = [
  {
    title: "AI accounts",
    label: "Access",
    description:
      "Tài khoản, gói truy cập và quota phục vụ workflow AI, coding, automation.",
    Icon: SparklesIcon,
    accentClassName: "from-cyan-400 via-emerald-300 to-transparent",
  },
  {
    title: "Source code",
    label: "Code",
    description:
      "Starter, module, dashboard và boilerplate có thể tải về để build tiếp.",
    Icon: Code2Icon,
    accentClassName: "from-emerald-400 via-cyan-300 to-transparent",
  },
  {
    title: "Templates",
    label: "UI",
    description:
      "Layout, page section và template triển khai nhanh cho sản phẩm web.",
    Icon: PackageOpenIcon,
    accentClassName: "from-amber-300 via-emerald-300 to-transparent",
  },
  {
    title: "Mini tools",
    label: "Utility",
    description:
      "Tool nhỏ cho productivity, data, content, vận hành shop và automation.",
    Icon: WrenchIcon,
    accentClassName: "from-rose-300 via-cyan-300 to-transparent",
  },
  {
    title: "Courses & notes",
    label: "Learn",
    description:
      "Ghi chú triển khai, bài học thực chiến và tài nguyên học có cấu trúc.",
    Icon: BookOpenIcon,
    accentClassName: "from-sky-300 via-emerald-300 to-transparent",
  },
  {
    title: "Bundles",
    label: "Pack",
    description:
      "Combo tài nguyên theo chủ đề để mua một lần và dùng cho nhiều dự án.",
    Icon: Layers3Icon,
    accentClassName: "from-lime-300 via-cyan-300 to-transparent",
  },
];

const deliverySteps: IconBlock[] = [
  {
    title: "Chọn đúng món",
    description:
      "Lọc theo acc, tool, template, course hoặc bundle; đọc mô tả và xem preview trước.",
    Icon: PackageOpenIcon,
  },
  {
    title: "Thanh toán gọn",
    description:
      "Giỏ hàng gom nhiều sản phẩm, checkout tạo đơn và theo dõi trạng thái mở quyền.",
    Icon: CreditCardIcon,
  },
  {
    title: "Nhận trong tài khoản",
    description:
      "Sản phẩm đã mua nằm trong dashboard với link tải hoặc quyền truy cập được bảo vệ.",
    Icon: DownloadIcon,
  },
];

const techSignals: IconBlock[] = [
  {
    title: "Stack minh bạch",
    description: "Nêu rõ công nghệ, định dạng file, quyền sử dụng và cách nhận hàng.",
    Icon: CpuIcon,
  },
  {
    title: "Update log",
    description: "Dễ mở rộng thành changelog để khách biết sản phẩm còn được bảo trì.",
    Icon: GitBranchIcon,
  },
  {
    title: "Delivery an toàn",
    description: "Tách public preview khỏi tài nguyên thật để hạn chế chia sẻ link lộ.",
    Icon: LockKeyholeIcon,
  },
];

const buyerAssurances: IconBlock[] = [
  {
    title: "Thư viện riêng sau khi mua",
    description:
      "Khách đăng nhập để xem lại toàn bộ sản phẩm đã sở hữu và tải khi cần.",
    Icon: DatabaseIcon,
  },
  {
    title: "Thông tin sản phẩm rõ ràng",
    description:
      "Giá, loại tài nguyên, license, delivery và preview được đặt gần CTA mua hàng.",
    Icon: CheckCircle2Icon,
  },
  {
    title: "Sẵn sàng cho đánh giá",
    description:
      "Product detail đã có review, sao và bình luận để tăng niềm tin khi shop lớn hơn.",
    Icon: StarIcon,
  },
];

const accessHandoffItems: IconBlock[] = [
  {
    title: "Access / account",
    description:
      "Hiển thị rõ khách nhận tài khoản, license, file tải hay link kích hoạt sau khi mua.",
    Icon: LockKeyholeIcon,
  },
  {
    title: "Setup note",
    description:
      "Mỗi sản phẩm nên có hướng dẫn dùng nhanh, điều kiện sử dụng và lưu ý bảo mật.",
    Icon: CheckCircle2Icon,
  },
  {
    title: "Update window",
    description:
      "Tách phần update, trạng thái còn dùng được và ghi chú thay đổi để khách yên tâm.",
    Icon: GitBranchIcon,
  },
  {
    title: "Buyer library",
    description:
      "Sau checkout, mọi tài nguyên quay về một thư viện riêng thay vì bị thất lạc qua chat.",
    Icon: DatabaseIcon,
  },
];

const plannedShelves = [
  {
    title: "Claude / AI access pack",
    type: "AI account",
    description:
      "Gói truy cập công cụ AI, kèm hướng dẫn sử dụng và trạng thái giao hàng rõ ràng.",
    className: "from-cyan-500/25 via-emerald-500/10 to-background",
  },
  {
    title: "Full-stack starter",
    type: "Source code",
    description:
      "Bộ code mẫu có auth, database, dashboard và flow checkout để build tiếp.",
    className: "from-emerald-500/25 via-cyan-500/10 to-background",
  },
  {
    title: "Creator mini tools",
    type: "Mini tool",
    description:
      "Các công cụ nhỏ phục vụ automation, productivity và vận hành shop.",
    className: "from-rose-500/20 via-cyan-500/10 to-background",
  },
];

const resourceMarqueeItems = [
  ["AI accounts", "Claude, coding, automation access"],
  ["Source code", "Next.js, Supabase, payment flows"],
  ["Templates", "Reusable screens for real launches"],
  ["Mini tools", "Productivity utilities and workflows"],
  ["Learning notes", "Build logs, tutorials, implementation notes"],
  ["Secure delivery", "Dashboard access and protected downloads"],
];

const heroActivityItems = [
  ["Preview ready", "Product artwork rendered"],
  ["Cart updated", "Multi-item checkout supported"],
  ["Access unlocked", "Buyer library prepared"],
  ["Download secured", "Protected delivery enabled"],
];

const fallbackStockRows = [
  {
    title: "Claude / AI account pack",
    type: "AI access",
    price: "Sắp mở bán",
    status: "Preview",
    href: "/products",
  },
  {
    title: "Next.js commerce starter",
    type: "Source code",
    price: "Sắp mở bán",
    status: "Docs",
    href: "/products",
  },
  {
    title: "Automation mini tool",
    type: "Tool",
    price: "Sắp mở bán",
    status: "Demo",
    href: "/products",
  },
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
                Shop tài nguyên công nghệ cho builder: AI account, source code,
                template, mini tool, khóa học và bundle thực chiến để mua nhanh,
                nhận nhanh, dùng ngay.
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
                render={<Link href="/cart" />}
                nativeButton={false}
              >
                Mở giỏ hàng
              </Button>
            </div>

            <div className="grid gap-3 border-t pt-6 sm:grid-cols-3">
              {heroStats.map(([title, description]) => (
                <div
                  key={title}
                  className="grid gap-1 transition-transform duration-300 hover:-translate-y-0.5"
                >
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
      <ShopCategoryShelf />

      <section className="scroll-reveal bg-muted/30 py-14 md:py-18">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <SectionHeader
            title="Sản phẩm nổi bật"
            description="Các tài nguyên mới nhất trong shop, ưu tiên sản phẩm có preview rõ, giá rõ và cách nhận hàng rõ."
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

      <TechStockSection products={products} />
      <AccessHandoffSection />

      <section className="scroll-reveal border-y bg-background py-14 md:py-18">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="flex max-w-xl flex-col gap-4">
            <h2 className="text-2xl font-semibold leading-tight tracking-normal md:text-4xl">
              Từ xem sản phẩm đến nhận quyền truy cập, flow phải giống một shop thật.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              Khách không cần biết hệ thống phía sau vận hành thế nào. Họ cần
              thấy sản phẩm đáng mua, checkout rõ ràng và nơi nhận tài nguyên sau
              khi thanh toán.
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
            description="Blog hỗ trợ khách hiểu cách dùng tài nguyên, chọn đúng tool và theo dõi các ghi chú triển khai thực tế."
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

      <BuyerAssuranceSection />
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

function ShopCategoryShelf() {
  return (
    <section className="scroll-reveal bg-background py-14 md:py-18">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <SectionHeader
          title="Danh mục công nghệ"
          description="Thay vì chỉ giới thiệu hệ thống, homepage nên cho khách quét nhanh shop đang bán loại tài nguyên nào."
          actionLabel="Vào shop"
          actionHref="/products"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shopCategories.map((item) => {
            const Icon = item.Icon;

            return (
              <Link
                key={item.title}
                href="/products"
                className="group/category relative overflow-hidden rounded-lg border bg-card p-5 text-card-foreground shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-foreground/35 hover:shadow-xl hover:shadow-foreground/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                    item.accentClassName
                  )}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground shadow-sm transition-transform duration-300 group-hover/category:-rotate-3 group-hover/category:scale-105">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <div className="mt-5 grid gap-2">
                  <h3 className="text-lg font-semibold tracking-normal">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TechStockSection({ products }: { products: PublishedProduct[] }) {
  const rows =
    products.length > 0
      ? products.slice(0, 4).map((product) => ({
          title: product.title,
          type: productTypeLabels[product.product_type],
          price: formatProductPrice(product),
          status: getProductDeliveryLabel(product),
          href: `/products/${product.slug}`,
        }))
      : fallbackStockRows;

  return (
    <section className="scroll-reveal border-y bg-background py-14 md:py-18">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex max-w-xl flex-col gap-5">
          <div className="flex size-12 items-center justify-center rounded-lg border bg-card shadow-sm">
            <CpuIcon aria-hidden="true" className="size-6" />
          </div>
          <div className="grid gap-4">
            <h2 className="text-2xl font-semibold leading-tight tracking-normal md:text-4xl">
              Một shop công nghệ cần cảm giác đang có hàng thật, trạng thái thật.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              Khách mua acc, tool hoặc source code thường muốn biết: sản phẩm còn
              mở bán không, nhận được gì, giao ở đâu và có dùng được ngay không.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {techSignals.map((item) => (
              <CompactSignal key={item.title} item={item} />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-2xl shadow-foreground/10">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="motion-pulse-dot size-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold">Live tech shelf</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Ready to checkout
            </span>
          </div>

          <div className="divide-y">
            {rows.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group/stock grid gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_7rem_7rem] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.type}
                  </p>
                </div>
                <span className="text-sm font-medium sm:text-right">
                  {item.price}
                </span>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground sm:ml-auto">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {item.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroShowcase({ product }: { product?: PublishedProduct }) {
  return (
    <div className="motion-fade-up motion-delay-2 relative">
      <div className="motion-float-soft relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-2xl shadow-foreground/10">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Tech shop preview
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b p-5 md:border-b-0 md:border-r">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              {product?.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className="absolute inset-0 size-full bg-background object-contain p-4"
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
                Deal đang mở bán
              </p>
              <div className="grid gap-2">
                <h2 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-normal">
                  {product?.title ?? "Kệ sản phẩm đầu tiên"}
                </h2>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {product?.short_description ??
                    "Chuẩn bị publish AI account, source code, template, mini tool và tài nguyên học tập cho builder."}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                ["Preview", product?.thumbnail_url ? "Live asset" : "Generated"],
                ["Delivery", product ? getProductDeliveryLabel(product) : "Dashboard"],
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

function AccessHandoffSection() {
  return (
    <section className="scroll-reveal bg-muted/30 py-14 md:py-18">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-2xl shadow-foreground/10">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold">Access handoff</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Buyer dashboard
            </span>
          </div>

          <div className="grid gap-0 md:grid-cols-[0.92fr_1.08fr]">
            <div className="border-b p-5 md:border-b-0 md:border-r">
              <div className="motion-gradient-pan relative flex min-h-72 flex-col justify-between overflow-hidden rounded-lg border bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-background p-5">
                <div className="motion-scanline pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-foreground/10 to-transparent" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                      Delivery pack
                    </p>
                    <h3 className="text-xl font-semibold tracking-normal">
                      Account + files + notes
                    </h3>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-background/70 shadow-sm backdrop-blur">
                    <LockKeyholeIcon aria-hidden="true" className="size-5" />
                  </div>
                </div>

                <div className="relative grid gap-3 rounded-lg border bg-background/75 p-3 shadow-sm backdrop-blur">
                  {[
                    ["Access status", "Unlocked"],
                    ["Delivery type", "Dashboard"],
                    ["Support note", "Included"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid divide-y">
              {accessHandoffItems.map((item) => {
                const Icon = item.Icon;

                return (
                  <div key={item.title} className="flex gap-4 p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
                    <div className="grid gap-1">
                      <h3 className="text-base font-semibold tracking-normal">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex max-w-xl flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DownloadIcon aria-hidden="true" className="size-4" />
            Delivery rõ ràng
          </div>
          <h2 className="text-2xl font-semibold leading-tight tracking-normal md:text-4xl">
            Với shop acc/tool, phần quan trọng không chỉ là nút mua mà là cách bàn giao.
          </h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            Khách mua tài nguyên công nghệ thường cần biết mình sẽ nhận chính xác
            thứ gì: tài khoản, key, file, link kích hoạt, hướng dẫn setup hay ghi
            chú cập nhật. Section này làm homepage giống shop thật hơn vì nói rõ
            trải nghiệm sau khi thanh toán.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button render={<Link href="/products" />} nativeButton={false}>
              Xem hàng đang bán
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              Thư viện đã mua
            </Button>
          </div>
        </div>
      </div>
    </section>
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
              type: &quot;tech-resource&quot;,
            </span>
            <span className="pl-4 text-foreground">
              delivery: &quot;instant&quot;,
            </span>
            <span>&#125;</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Access + files</span>
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
        <Icon
          aria-hidden="true"
          className="size-5 transition-transform duration-300 group-hover/feature:scale-110"
        />
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

function CompactSignal({ item }: { item: IconBlock }) {
  const Icon = item.Icon;

  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
      <Icon aria-hidden="true" className="mb-3 size-4 text-muted-foreground" />
      <p className="text-sm font-semibold">{item.title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {item.description}
      </p>
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

function BuyerAssuranceSection() {
  return (
    <section className="scroll-reveal bg-background py-14 md:py-18">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex max-w-xl flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TimerIcon aria-hidden="true" className="size-4" />
            Sau checkout
          </div>
          <h2 className="text-2xl font-semibold leading-tight tracking-normal md:text-4xl">
            Mua tài nguyên công nghệ thì phần nhận hàng phải rõ như phần bán hàng.
          </h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            Homepage mới tập trung vào niềm tin mua hàng: khách biết sản phẩm
            thuộc loại nào, nhận qua đâu, và sau này có thể quay lại thư viện để
            tải hoặc xem lại quyền truy cập.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button render={<Link href="/products" />} nativeButton={false}>
              Khám phá cửa hàng
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
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

        <div className="grid gap-4">
          {buyerAssurances.map((item) => (
            <ProofRow key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
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
