import { SpecsManager } from "@/components/admin/specs-manager";
import { getAdminSpecGroups } from "@/lib/supabase/queries/specs";
import { getAdminCategories } from "@/lib/supabase/queries/categories";

export const dynamic = "force-dynamic";

export default async function AdminSpecsPage() {
  const [groups, categories] = await Promise.all([
    getAdminSpecGroups(),
    getAdminCategories(),
  ]);

  return <SpecsManager groups={groups} categories={categories} />;
}
