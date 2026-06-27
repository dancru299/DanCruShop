/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { DownloadButton } from "@/components/products/download-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserLicenseKey } from "@/lib/supabase/queries/licenses";
import {
  checkUserAccess,
  getPurchasedVariantIds,
} from "@/lib/supabase/queries/purchases";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type DashboardProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DashboardProduct = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  thumbnail_url: string | null;
  product_type: string;
  is_free: boolean;
};

export const dynamic = "force-dynamic";

async function getPurchasedProduct(productId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `
        id,
        title,
        slug,
        short_description,
        thumbnail_url,
        product_type,
        is_free
      `
    )
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load dashboard product", error);
    return null;
  }

  return data as DashboardProduct | null;
}

async function getOwnedVariants(variantIds: string[]) {
  if (variantIds.length === 0) {
    return [];
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .select("id, name, position")
    .in("id", variantIds)
    .order("position", { ascending: true });

  if (error) {
    console.error("Failed to load owned variants", error);
    return [];
  }

  return (data ?? []) as { id: string; name: string; position: number }[];
}

export default async function DashboardProductPage({
  params,
}: DashboardProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/dashboard");
  }

  const hasAccess = await checkUserAccess(user.id, id);

  if (!hasAccess) {
    notFound();
  }

  const product = await getPurchasedProduct(id);

  if (!product) {
    notFound();
  }

  // A user may own several variants of the same product, each with its own file.
  const ownedVariantIds = await getPurchasedVariantIds(user.id, id);
  const ownedVariants = await getOwnedVariants(ownedVariantIds);
  const licenseKey = await getUserLicenseKey(id);
  const thumbnailSrc = product.thumbnail_url ?? "/window.svg";

  return (
    <main className="flex w-full flex-col gap-6">
      <Button
        className="w-fit"
        variant="ghost"
        render={<Link href="/dashboard" />}
        nativeButton={false}
      >
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Back to dashboard
      </Button>

      <article className="grid overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm lg:grid-cols-[20rem_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto">
          <img
            src={thumbnailSrc}
            alt={product.title}
            className="absolute inset-0 size-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-5 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.product_type}</Badge>
            {product.is_free ? <Badge variant="outline">Free</Badge> : null}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-normal">
              {product.title}
            </h1>
            {product.short_description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {product.short_description}
              </p>
            ) : null}
          </div>

          {licenseKey ? (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">License key</p>
              <code className="select-all break-all rounded-md border bg-background px-3 py-2 font-mono text-sm">
                {licenseKey}
              </code>
              <p className="text-xs text-muted-foreground">
                Use this key to activate the product. Keep it private — don&apos;t
                share it publicly.
              </p>
            </div>
          ) : null}

          <div className="mt-auto flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {ownedVariants.length > 0 ? (
                ownedVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-2 pl-3"
                  >
                    <span className="text-sm font-medium">{variant.name}</span>
                    <DownloadButton variantId={variant.id}>
                      Download
                    </DownloadButton>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Không có file nào để tải cho sản phẩm này.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-fit"
              render={<Link href={`/products/${product.slug}`} />}
              nativeButton={false}
            >
              View product page
            </Button>
          </div>
        </div>
      </article>
    </main>
  );
}
