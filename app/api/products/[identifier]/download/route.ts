import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  file_path: string;
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
    .select("file_path")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load primary product file", error);
    throw new Error("Could not load product file.");
  }

  return data as ProductFileRecord | null;
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

export async function POST(
  _request: Request,
  { params }: DownloadRouteContext
) {
  const { identifier } = await params;

  if (!identifier) {
    return NextResponse.json({ error: "Missing product id." }, { status: 400 });
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const product = await getProduct(identifier);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const isAllowed =
      product.is_free || (await hasActivePurchase(user.id, product.id));

    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const primaryFile = await getPrimaryFile(product.id);

    if (!primaryFile) {
      return NextResponse.json(
        { error: "No downloadable file is available for this product." },
        { status: 404 }
      );
    }

    const downloadUrl = await createDownloadUrl(primaryFile.file_path);

    return NextResponse.json({ download_url: downloadUrl });
  } catch (error) {
    console.error("Secure download route failed", error);

    return NextResponse.json(
      { error: "Could not prepare download." },
      { status: 500 }
    );
  }
}
