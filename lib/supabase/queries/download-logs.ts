import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminDownloadLog = {
  id: string;
  product_id: string;
  variant_id: string | null;
  user_id: string;
  file_id: string;
  downloaded_at: string;
  file_name: string | null;
  author_name: string | null;
};

// Accepts one product id or several (e.g. every option of a group) so the admin
// Tải xuống tab can show download history across the whole option set, not just
// the default option.
export async function getAdminDownloadLogs(
  productId: string | string[]
): Promise<AdminDownloadLog[]> {
  const supabase = createAdminClient();
  const ids = Array.isArray(productId) ? productId : [productId];

  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("download_logs")
    .select(
      `
        id,
        product_id,
        variant_id,
        user_id,
        file_id,
        downloaded_at,
        product_files ( file_name ),
        profiles ( full_name )
      `
    )
    .in("product_id", ids)
    .order("downloaded_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Failed to fetch download logs", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const file = Array.isArray(row.product_files)
      ? row.product_files[0]
      : row.product_files;
    const profile = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;

    return {
      id: row.id,
      product_id: row.product_id,
      variant_id: row.variant_id ?? null,
      user_id: row.user_id,
      file_id: row.file_id,
      downloaded_at: row.downloaded_at,
      file_name: file?.file_name ?? null,
      author_name: profile?.full_name ?? null,
    };
  });
}
