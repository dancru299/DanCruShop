import Link from "next/link";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  CircleDollarSignIcon,
  Clock3Icon,
  FileTextIcon,
  GaugeIcon,
  MessageSquareIcon,
  PackageIcon,
  PlusIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminMetric } from "@/components/admin/admin-metric";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LineChart, MiniBars } from "@/components/admin/overview/overview-charts";
import {
  CoverageRow,
  FunnelRow,
  Panel,
  RankedList,
} from "@/components/admin/overview/overview-panels";
import {
  formatCompactMoney,
  formatMoney,
  formatNumber,
  formatShortDate,
  getTrendLabel,
} from "@/lib/admin/overview-utils";
import { getAdminOverviewData } from "@/lib/supabase/queries/admin-overview";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await getAdminOverviewData();
  const currentRevenue = data.totalRevenueCents7d;
  const previousRevenue = data.previous7RevenueCents;
  const maxProductUnits = Math.max(
    1,
    ...data.topProducts.map((product) => product.units)
  );
  const maxBuyerRevenue = Math.max(
    1,
    ...data.topBuyers.map((buyer) => buyer.revenueCents)
  );

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
        <PlusIcon aria-hidden="true" data-icon="inline-start" />
        Sản phẩm mới
      </Button>
      <Button
        variant="outline"
        render={<Link href="/admin/orders" />}
        nativeButton={false}
      >
        <ReceiptTextIcon aria-hidden="true" data-icon="inline-start" />
        Đơn hàng
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Trung tâm chỉ huy Admin"
        title="Tổng quan DanCruShop"
        description="Theo dõi doanh số, dòng tiền, trạng thái sản phẩm, hoạt động của khách hàng, bài viết blog và các số liệu phân tích."
        action={headerActions}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          description={`${getTrendLabel(currentRevenue, previousRevenue, (value) =>
            formatCompactMoney(value, data.primaryCurrency)
          )}`}
          Icon={CircleDollarSignIcon}
          label="Doanh thu"
          tone="emerald"
          value={formatCompactMoney(data.totalRevenueCents, data.primaryCurrency)}
        />
        <AdminMetric
          description={`${formatNumber(data.pendingOrders)} chờ duyệt, ${formatNumber(
            data.refundedOrders
          )} đã hoàn tiền`}
          Icon={ReceiptTextIcon}
          label="Đơn hàng"
          tone="sky"
          value={formatNumber(data.orders.length)}
        />
        <AdminMetric
          description={`${formatNumber(data.publishedProducts)} đã đăng, ${formatNumber(
            data.draftProducts
          )} bản nháp`}
          Icon={PackageIcon}
          label="Sản phẩm"
          tone="violet"
          value={formatNumber(data.totalProducts)}
        />
        <AdminMetric
          description={`${formatNumber(data.newCustomers7d)} khách mới trong 7 ngày`}
          Icon={UsersIcon}
          label="Khách hàng"
          tone="amber"
          value={formatNumber(data.customers)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel
          description="Chỉ hiển thị tiền tệ chính. Đơn hàng khác tiền tệ sẽ không xuất hiện tại đây."
          title="Xu hướng dòng tiền"
          action={<Badge variant="secondary">14 ngày qua</Badge>}
        >
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Doanh thu thực nhận</p>
              <p className="text-2xl font-semibold">
                {formatMoney(data.totalRevenueCents, data.primaryCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đơn đã thanh toán</p>
              <p className="text-2xl font-semibold">
                {formatNumber(data.paidOrders.length)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Giao dịch hoạt động</p>
              <p className="text-2xl font-semibold">
                {formatNumber(data.activePurchases)}
              </p>
            </div>
          </div>
          <LineChart
            emptyLabel="Không có đơn hàng nào được thanh toán trong khoảng thời gian này"
            formatter={(value) => formatCompactMoney(value, data.primaryCurrency)}
            gradientId="cashflowGradient"
            points={data.revenueTrend}
            tone="emerald"
          />
        </Panel>

        <Panel
          description="Sự kiện ẩn danh từ hệ thống trong 7 ngày gần nhất."
          title="Tín hiệu quan tâm"
          action={<GaugeIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Đơn trong 7 ngày</p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data.orders7d)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTrendLabel(data.orders7d, data.previousOrders7d)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Khách ghé thăm</p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data.betaFunnel.uniqueVisitors)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data.betaFunnel.pageViews)} lượt xem trang
                </p>
              </div>
            </div>
            <MiniBars points={data.analyticsTrend} tone="sky" />
            <div className="rounded-lg border p-3">
              <FunnelRow label="Lượt xem sản phẩm" value={data.betaFunnel.productViews} />
              <FunnelRow label="Thêm vào giỏ" value={data.betaFunnel.addToCart} />
              <FunnelRow
                label="Bắt đầu thanh toán"
                value={data.betaFunnel.checkoutStarts}
              />
              <FunnelRow label="Đơn đã thanh toán" value={data.paidOrders.length} />
              <FunnelRow
                label="Lượt tải tài nguyên"
                value={data.betaFunnel.downloadStarts}
              />
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          description="Xếp hạng dựa trên số lượng sản phẩm thực tế đã được bán."
          title="Top 5 sản phẩm bán chạy"
          action={<ShoppingBagIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <RankedList
            currency={data.primaryCurrency}
            emptyLabel="Chưa có sản phẩm nào được bán."
            items={data.topProducts}
            maxValue={maxProductUnits}
            type="products"
          />
        </Panel>

        <Panel
          description="Những khách hàng có tổng giá trị mua hàng cao nhất."
          title="Khách hàng tiêu biểu"
          action={<UserRoundIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <RankedList
            currency={data.primaryCurrency}
            emptyLabel="Chưa có khách mua hàng."
            items={data.topBuyers}
            maxValue={maxBuyerRevenue}
            type="buyers"
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel
          description="Sắp xếp theo các bài viết được xuất bản mới nhất."
          title="Radar bài viết"
          action={<FileTextIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Đã đăng</p>
              <p className="text-xl font-semibold">{formatNumber(data.publishedPosts)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nháp</p>
              <p className="text-xl font-semibold">{formatNumber(data.draftPosts)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lượt xem</p>
              <p className="text-xl font-semibold">--</p>
            </div>
          </div>
          <div className="flex flex-col">
            {data.recentPosts.length > 0 ? (
              data.recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(post.published_at ?? post.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline">Đang chờ đo</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Chưa có bài viết nào được xuất bản.
              </div>
            )}
          </div>
        </Panel>

        <Panel
          description="Tổng hợp các kênh dữ liệu đang chạy và các phần đang phát triển."
          title="Phạm vi theo dõi"
          action={<ActivityIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <CoverageRow
            description="Đơn hàng, doanh thu, trạng thái và quyền truy cập tải xuống đã hoạt động."
            label="Doanh số và dòng tiền"
            status="Hoạt động"
            tone="emerald"
          />
          <CoverageRow
            description="Thống kê sản phẩm bán chạy nhất được tính từ đơn hàng đã thanh toán."
            label="Hiệu suất sản phẩm"
            status="Hoạt động"
            tone="sky"
          />
          <CoverageRow
            description="Lượt xem bài viết đã hoạt động; bảng xếp hạng chi tiết sẽ có sau khi lưu lượng ổn định."
            label="Tương tác Blog"
            status="Một phần"
            tone="violet"
          />
          <CoverageRow
            description="Cần thêm bảng đánh giá phản hồi hoặc bình luận của người dùng."
            label="Hòm thư góp ý"
            status="Tiếp theo"
            tone="amber"
          />
          <CoverageRow
            description="Sự kiện ẩn danh theo dõi lượt xem trang, xem sản phẩm, thêm giỏ, checkout và tải file."
            label="Phân tích lưu lượng"
            status="Hoạt động"
            tone="emerald"
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          description="Luồng cập nhật nhanh từ các đơn hàng mới, thay đổi sản phẩm hoặc hoạt động đăng bài."
          title="Hoạt động gần đây"
          action={<Clock3Icon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          {data.activity.length > 0 ? (
            <div className="flex flex-col">
              {data.activity.map((item) => (
                <div
                  key={`${item.label}-${item.timestamp}-${item.meta}`}
                  className="flex items-start gap-3 border-b py-3 last:border-b-0"
                >
                  <span
                    className={`mt-1 size-2 rounded-full ${
                      item.tone === "amber"
                        ? "bg-amber-400"
                        : item.tone === "emerald"
                          ? "bg-emerald-400"
                          : item.tone === "rose"
                            ? "bg-rose-400"
                            : item.tone === "sky"
                              ? "bg-sky-400"
                              : "bg-violet-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.meta}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(item.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Hoạt động sẽ xuất hiện sau khi sản phẩm, bài viết hoặc đơn hàng được tạo.
            </div>
          )}
        </Panel>

        <Panel
          description="Nơi quản lý và kiểm duyệt các bình luận và phản hồi từ khách hàng."
          title="Xem trước phản hồi"
          action={<MessageSquareIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-dashed p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Đánh giá sản phẩm</p>
                <Badge variant="outline">Chưa kết nối</Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Khi các đánh giá, nhận xét từ người mua được tích hợp, bảng điều khiển này sẽ hiển thị các phản hồi chờ duyệt, điểm đánh giá trung bình và hành động kiểm duyệt.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Chờ duyệt</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Điểm số</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Đề cập</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-sky-400 text-sky-950">
            <BarChart3Icon aria-hidden="true" className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-normal">
              Cột mốc phân tích Beta
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Hệ thống sự kiện Supabase hiện đã ghi nhận phễu ra mắt sản phẩm. Bước hữu ích tiếp theo là cảnh báo khi checkout, webhook, email hoặc tải tài nguyên bị lỗi.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          render={<Link href="/admin/products" />}
          nativeButton={false}
        >
          Quản lý sản phẩm
          <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
