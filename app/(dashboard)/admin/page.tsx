import Link from "next/link";
import { PackageIcon, ReceiptTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Admin overview</p>
        <h1 className="text-3xl font-semibold tracking-normal">CMS Home</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage products, orders, and publishing workflows for DanCruShop.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <PackageIcon aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-normal">Products</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Create, edit, and publish digital products.
            </p>
          </div>
          <Button
            className="w-fit"
            render={<Link href="/admin/products" />}
            nativeButton={false}
          >
            Manage Products
          </Button>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ReceiptTextIcon aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-normal">Orders</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Review payment activity and purchase delivery status.
            </p>
          </div>
          <Button
            className="w-fit"
            variant="outline"
            render={<Link href="/admin/orders" />}
            nativeButton={false}
          >
            View Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
