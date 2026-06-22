import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";

export default function Loading() {
  return <AdminListSkeleton metrics={3} metricCols={4} rows={6} />;
}
