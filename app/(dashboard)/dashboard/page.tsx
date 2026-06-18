import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageOpenIcon } from "lucide-react";

import { PurchasedProductCard } from "@/components/dashboard/purchased-product-card";
import { EmptyState } from "@/components/shared/empty-state";
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
        <EmptyState
          icon={PackageOpenIcon}
          title="You haven't purchased any products yet"
          description="When you buy products or claim free resources, they will appear here."
          action={
            <Button render={<Link href="/" />} nativeButton={false}>
              Explore shop
            </Button>
          }
        />
      )}
    </main>
  );
}
