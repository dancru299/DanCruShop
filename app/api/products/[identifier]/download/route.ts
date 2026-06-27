import { NextResponse } from "next/server";

import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type DownloadRouteContext = {
  params: Promise<{
    // The variant id — the purchasable identity whose files we deliver.
    identifier: string;
  }>;
};

type VariantAccessRecord = {
  variantId: string;
  productId: string;
  isFree: boolean;
};

type ProductFileRecord = {
  id: string;
  file_path: string;
  max_downloads_per_user: number | null;
};

export const runtime = "nodejs";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

async function getVariant(variantId: string): Promise<VariantAccessRecord | null> {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .select("id, is_free, product:products!inner ( id, status )")
    .eq("id", variantId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load variant for secure download", error);
    throw new Error("Could not load product.");
  }

  if (!data) {
    return null;
  }

  const product = Array.isArray(data.product) ? data.product[0] : data.product;

  if (!product || product.status !== "published") {
    return null;
  }

  return {
    variantId: data.id as string,
    productId: product.id as string,
    isFree: Boolean(data.is_free),
  };
}

async function hasActivePurchase(
  userId: string,
  productId: string,
  variantId: string
) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("variant_id", variantId)
    .eq("access_status", "active")
    .maybeSingle();

  if (error) {
    console.error("Failed to check purchase for secure download", error);
    throw new Error("Could not verify product access.");
  }

  return Boolean(data);
}

async function getPrimaryFile(variantId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("product_files")
    .select("id, file_path, max_downloads_per_user")
    .eq("variant_id", variantId)
    .eq("is_primary", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load primary product file", error);
    throw new Error("Could not load product file.");
  }

  return data as ProductFileRecord | null;
}

async function getUserDownloadCount(userId: string, fileId: string) {
  const supabaseAdmin = createAdminClient();
  const { count, error } = await supabaseAdmin
    .from("download_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("file_id", fileId);

  if (error) {
    console.error("Failed to check download count", error);
    return 0;
  }

  return count ?? 0;
}

async function createDownloadUrl(filePath: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.storage
    .from("products")
    .createSignedUrl(filePath, 60);

  if (error) {
    console.error("Failed to create signed download URL", error);
    throw new Error("Could not create download URL.");
  }

  return data.signedUrl;
}

async function recordDownload(
  userId: string,
  productId: string,
  variantId: string,
  fileId: string
) {
  const supabaseAdmin = createAdminClient();

  const [logResult, counterResult] = await Promise.all([
    supabaseAdmin.from("download_logs").insert({
      file_id: fileId,
      product_id: productId,
      variant_id: variantId,
      user_id: userId,
    }),
    supabaseAdmin.rpc("increment_download_count", { file_id_arg: fileId }),
  ]);

  if (logResult.error) {
    console.error("Failed to record download log", logResult.error);
    throw new Error("Could not record download.");
  }

  if (counterResult.error) {
    console.error("Failed to increment download count", counterResult.error);
    throw new Error("Could not update download count.");
  }
}

async function recordDownloadAnalytics({
  eventName,
  productId,
  reason,
  userId,
}: {
  eventName: "download_start" | "download_success" | "download_error";
  productId: string | null;
  reason?: string;
  userId: string;
}) {
  await recordAnalyticsEvent({
    eventName,
    metadata: reason ? { reason } : {},
    path: `/api/products/${productId ?? "unknown"}/download`,
    productId,
    userId,
  });
}

export async function POST(
  request: Request,
  { params }: DownloadRouteContext
) {
  const { identifier } = await params;

  if (!identifier) {
    return NextResponse.json({ error: "Missing variant id." }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const { allowed } = await enforceRateLimit(`download:${ip}:${identifier}`, {
    max: 10,
    windowMs: 60_000,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const variant = await getVariant(identifier);

    if (!variant) {
      await recordDownloadAnalytics({
        eventName: "download_error",
        productId: null,
        reason: "variant_not_found",
        userId: user.id,
      });
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    await recordDownloadAnalytics({
      eventName: "download_start",
      productId: variant.productId,
      userId: user.id,
    });

    const isAllowed =
      variant.isFree ||
      (await hasActivePurchase(user.id, variant.productId, variant.variantId));

    if (!isAllowed) {
      await recordDownloadAnalytics({
        eventName: "download_error",
        productId: variant.productId,
        reason: "forbidden",
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const primaryFile = await getPrimaryFile(variant.variantId);

    if (!primaryFile) {
      await recordDownloadAnalytics({
        eventName: "download_error",
        productId: variant.productId,
        reason: "missing_primary_file",
        userId: user.id,
      });
      return NextResponse.json(
        { error: "No downloadable file is available for this product." },
        { status: 404 }
      );
    }

    if (primaryFile.max_downloads_per_user !== null) {
      const downloadCount = await getUserDownloadCount(user.id, primaryFile.id);

      if (downloadCount >= primaryFile.max_downloads_per_user) {
        await recordDownloadAnalytics({
          eventName: "download_error",
          productId: variant.productId,
          reason: "download_limit_reached",
          userId: user.id,
        });
        return NextResponse.json(
          {
            error: `Download limit reached. You have used all ${primaryFile.max_downloads_per_user} allowed downloads for this product.`,
          },
          { status: 403 }
        );
      }
    }

    const [downloadUrl] = await Promise.all([
      createDownloadUrl(primaryFile.file_path),
      recordDownload(
        user.id,
        variant.productId,
        variant.variantId,
        primaryFile.id
      ),
    ]);

    await recordDownloadAnalytics({
      eventName: "download_success",
      productId: variant.productId,
      userId: user.id,
    });

    return NextResponse.json({ download_url: downloadUrl });
  } catch (error) {
    console.error("Secure download route failed", error);
    await recordDownloadAnalytics({
      eventName: "download_error",
      productId: null,
      reason: "unexpected_error",
      userId: user.id,
    });

    return NextResponse.json(
      { error: "Could not prepare download." },
      { status: 500 }
    );
  }
}
