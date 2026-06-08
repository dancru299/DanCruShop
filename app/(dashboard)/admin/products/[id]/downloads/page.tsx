import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { checkIsAdmin } from "@/lib/auth/roles";
import { getAdminDownloadLogs } from "@/lib/supabase/queries/download-logs";
import { getAdminProductById } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

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

  const [product, logs] = await Promise.all([
    getAdminProductById(id),
    getAdminDownloadLogs(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={`/admin/products/${product.id}/files`}
          className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Back to Files
        </Link>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Download history</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Downloads: {product.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            200 lượt download gần nhất của sản phẩm này.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
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
