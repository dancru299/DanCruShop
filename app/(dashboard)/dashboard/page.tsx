import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageOpenIcon } from "lucide-react";

import { PurchasedProductCard } from "@/components/dashboard/purchased-product-card";
import { Button } from "@/components/ui/button";
import { getUserPurchases } from "@/lib/supabase/queries/purchases";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/dashboard");
  }

  const purchases = await getUserPurchases(user.id);

  return (
    <main className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">DanCruShop dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal">My Products</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Access the products you have purchased and generate secure download
          links when files are available.
        </p>
      </div>

      {purchases.length > 0 ? (
        <div className="grid gap-4">
          {purchases.map((purchase) => (
            <PurchasedProductCard key={purchase.id} purchase={purchase} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-80 flex-col items-center justify-center gap-5 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <PackageOpenIcon aria-hidden="true" />
          </div>
          <div className="flex max-w-md flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-normal">
              Ban chua mua san pham nao
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Khi ban mua hoac nhan tai nguyen mien phi, san pham se xuat hien
              tai day.
            </p>
          </div>
          <Button render={<Link href="/" />} nativeButton={false}>
            Kham pha cua hang
          </Button>
        </div>
      )}
    </main>
  );
}
