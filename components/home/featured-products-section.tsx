import {
  getPublishedProducts,
  searchPublishedProducts,
  type PublishedProduct,
} from "@/lib/supabase/queries/products";
import { ProductCard } from "@/components/products/product-card";
import { SectionHeader } from "@/components/home/section-header";
import { cn } from "@/lib/utils";
import type {
  ColumnCount,
  FeaturedProductsSection as FeaturedConfig,
} from "@/lib/store/home-layout";

const GRID_COLUMNS: Record<ColumnCount, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 xl:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

async function loadProducts(
  section: FeaturedConfig
): Promise<PublishedProduct[]> {
  if (section.source === "category" && section.categorySlug) {
    const { products } = await searchPublishedProducts({
      category: section.categorySlug,
      perPage: section.limit,
    });
    return products;
  }

  return getPublishedProducts(section.limit);
}

export async function FeaturedProductsSection({
  section,
}: {
  section: FeaturedConfig;
}) {
  const products = await loadProducts(section);

  return (
    <section className="scroll-mt-24 border-b border-border/80 py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <SectionHeader
          title={section.title}
          description={section.description}
          actionLabel={section.actionLabel}
          actionHref={section.actionHref}
        />

        {products.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No products to show yet. Publish products in the CMS.
          </p>
        ) : section.layout === "row" ? (
          <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[78%] shrink-0 snap-start sm:w-[20rem]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-5",
              GRID_COLUMNS[section.columns]
            )}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
