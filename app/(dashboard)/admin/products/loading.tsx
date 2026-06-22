import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";

export default function Loading() {
  return <AdminListSkeleton metrics={4} metricCols={4} showAction rows={6} />;
}
