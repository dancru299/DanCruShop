import { BannerGridSection } from "@/components/home/banner-grid-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProductsSection } from "@/components/home/featured-products-section";
import { FlashSaleSection } from "@/components/home/flash-sale-section";
import { HeroSection } from "@/components/home/hero-section";
import { KeywordsSection } from "@/components/home/keywords-section";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomeLayout } from "@/lib/store/home-layout.server";
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sections = await getHomeLayout();

  return (
    <div>
      <JsonLd data={[buildOrganizationJsonLd(), buildWebsiteJsonLd()]} />
      {sections
        .filter((section) => section.enabled)
        .map((section) => {
          switch (section.type) {
            case "hero":
              return <HeroSection key={section.id} section={section} />;
            case "featured_products":
              return (
                <FeaturedProductsSection key={section.id} section={section} />
              );
            case "categories":
              return <CategoriesSection key={section.id} section={section} />;
            case "keywords":
              return <KeywordsSection key={section.id} section={section} />;
            case "flash_sale":
              return <FlashSaleSection key={section.id} section={section} />;
            case "banner_grid":
              return <BannerGridSection key={section.id} section={section} />;
            default:
              return null;
          }
        })}
    </div>
  );
}
