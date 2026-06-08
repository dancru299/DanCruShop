import { NextResponse } from "next/server";

import {
  checkRateLimit,
  createRateLimiter,
  getClientIp,
} from "@/lib/rate-limit";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const downloadLimiter = createRateLimiter({ max: 10, windowMs: 60_000 });

type DownloadRouteContext = {
  params: Promise<{
    identifier: string;
  }>;
};

type ProductAccessRecord = {
  id: string;
  is_free: boolean;
  status: string;
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

async function getProduct(productId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, is_free, status")
    .eq("id", productId)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to load product for secure download", error);
    throw new Error("Could not load product.");
  }

  return data as ProductAccessRecord | null;
}

async function hasActivePurchase(userId: string, productId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("access_status", "active")
    .maybeSingle();

  if (error) {
    console.error("Failed to check purchase for secure download", error);
    throw new Error("Could not verify product access.");
  }

  return Boolean(data);
}

async function getPrimaryFile(productId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("product_files")
    .select("id, file_path, max_downloads_per_user")
    .eq("product_id", productId)
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
  fileId: string
) {
  const supabaseAdmin = createAdminClient();

  const [logResult, counterResult] = await Promise.all([
    supabaseAdmin.from("download_logs").insert({
      file_id: fileId,
      product_id: productId,
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
  productId: string;
  reason?: string;
  userId: string;
}) {
  await recordAnalyticsEvent({
    eventName,
    metadata: reason ? { reason } : {},
    path: `/api/products/${productId}/download`,
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
    return NextResponse.json({ error: "Missing product id." }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const { allowed } = checkRateLimit(downloadLimiter, `${ip}:${identifier}`);

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
    await recordDownloadAnalytics({
      eventName: "download_start",
      productId: identifier,
      userId: user.id,
    });
    const product = await getProduct(identifier);

    if (!product) {
      await recordDownloadAnalytics({
        eventName: "download_error",
        productId: identifier,
        reason: "product_not_found",
        userId: user.id,
      });
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const isAllowed =
      product.is_free || (await hasActivePurchase(user.id, product.id));

    if (!isAllowed) {
      await recordDownloadAnalytics({
        eventName: "download_error",
        productId: product.id,
        reason: "forbidden",
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const primaryFile = await getPrimaryFile(product.id);

    if (!primaryFile) {
      await recordDownloadAnalytics({
        eventName: "download_error",
        productId: product.id,
        reason: "missing_primary_file",
        userId: user.id,
      });
      return NextResponse.json(
        { error: "No downloadable file is available for this product." },
        { status: 404 }
      );
    }

    // Enforce per-user download limit if configured
    if (primaryFile.max_downloads_per_user !== null) {
      const downloadCount = await getUserDownloadCount(
        user.id,
        primaryFile.id
      );

      if (downloadCount >= primaryFile.max_downloads_per_user) {
        await recordDownloadAnalytics({
          eventName: "download_error",
          productId: product.id,
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
      recordDownload(user.id, product.id, primaryFile.id),
    ]);

    await recordDownloadAnalytics({
      eventName: "download_success",
      productId: product.id,
      userId: user.id,
    });

    return NextResponse.json({ download_url: downloadUrl });
  } catch (error) {
    console.error("Secure download route failed", error);
    await recordDownloadAnalytics({
      eventName: "download_error",
      productId: identifier,
      reason: "unexpected_error",
      userId: user.id,
    });

    return NextResponse.json(
      { error: "Could not prepare download." },
      { status: 500 }
    );
  }
}
