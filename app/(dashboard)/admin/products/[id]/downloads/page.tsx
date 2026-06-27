import { notFound, redirect } from "next/navigation";
import { DownloadIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { checkIsAdmin } from "@/lib/auth/roles";
import { getAdminDownloadLogs } from "@/lib/supabase/queries/download-logs";
import { getProductVariants } from "@/lib/supabase/queries/product-variants";
import { getAdminProductById } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

type ProductDownloadsPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default async function ProductDownloadsPage({
  params,
}: ProductDownloadsPageProps) {
  const { id } = await params;
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const product = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  // Downloads across every variant of the product, labelled by variant.
  const variants = await getProductVariants(product.id);
  const variantNameById = new Map(
    variants.map((variant) => [variant.id, variant.name])
  );
  const logs = await getAdminDownloadLogs(product.id);
  const isGrouped = variants.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold tracking-normal">
          Lịch sử tải xuống
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          200 lượt tải gần nhất của sản phẩm này.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                {isGrouped ? <TableHead>Option</TableHead> : null}
                <TableHead>File</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.author_name ? (
                      <span className="font-medium">{log.author_name}</span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {log.user_id.slice(0, 8)}…
                      </span>
                    )}
                  </TableCell>
                  {isGrouped ? (
                    <TableCell>
                      <Badge variant="outline">
                        {(log.variant_id &&
                          variantNameById.get(log.variant_id)) ||
                          "—"}
                      </Badge>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    {log.file_name ? (
                      <Badge variant="secondary">{log.file_name}</Badge>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {log.file_id.slice(0, 8)}…
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(log.downloaded_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <DownloadIcon aria-hidden="true" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                Chưa có lượt download
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Lịch sử tải file của sản phẩm này sẽ xuất hiện ở đây.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
