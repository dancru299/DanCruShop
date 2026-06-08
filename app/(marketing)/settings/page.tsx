import Link from "next/link";
import { redirect } from "next/navigation";
import { BellIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/settings");
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 md:py-14">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Tài khoản</p>
        <h1 className="text-3xl font-semibold tracking-normal">Cài đặt</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Quản lý tùy chọn tài khoản và trải nghiệm mua hàng trên DanCruShop.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            Icon: UserRoundIcon,
            description: "Đổi tên hiển thị và ảnh đại diện của bạn.",
            href: "/profile",
            title: "Hồ sơ",
          },
          {
            Icon: BellIcon,
            description: "Biên nhận mua hàng và email cập nhật sản phẩm.",
            href: "#",
            title: "Thông báo",
          },
          {
            Icon: ShieldCheckIcon,
            description: "Đăng nhập, quyền truy cập và bảo mật thanh toán.",
            href: "#",
            title: "Bảo mật",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border bg-card/60 p-5 shadow-sm backdrop-blur-xl">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <item.Icon aria-hidden="true" className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
            {item.href !== "#" ? (
              <Button
                className="mt-4"
                size="sm"
                variant="outline"
                render={<Link href={item.href} />}
                nativeButton={false}
              >
                Mở
              </Button>
            ) : (
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Sắp có
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
