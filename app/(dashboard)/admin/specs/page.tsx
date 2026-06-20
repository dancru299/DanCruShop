import { SpecsManager } from "@/components/admin/specs-manager";
import { getAdminSpecGroups } from "@/lib/supabase/queries/specs";
import { getAdminCategories } from "@/lib/supabase/queries/categories";

export const dynamic = "force-dynamic";

export default async function AdminSpecsPage() {
  const [groups, categories] = await Promise.all([
    getAdminSpecGroups(),
    getAdminCategories(),
  ]);

  const totalFields = groups.reduce((sum, g) => sum + (g.fields?.length ?? 0), 0);
  const totalOptions = groups.reduce(
    (sum, g) => sum + (g.fields?.reduce((s, f) => s + (f.options?.length ?? 0), 0) ?? 0),
    0
  );

  const totalProducts = categories.reduce(
    (sum, category) => sum + category.product_count,
    0
  );
  const emptyCategories = categories.filter(
    (category) => category.product_count === 0
  ).length;

  return (
    <SpecsManager
      groups={groups}
      totalFields={totalFields}
      totalOptions={totalOptions}
      categories={categories}
      totalProducts={totalProducts}
      emptyCategories={emptyCategories}
    />
  );
}
