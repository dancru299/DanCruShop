import { Fragment } from "react";

import { BannerGridSection } from "@/components/home/banner-grid-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProductsSection } from "@/components/home/featured-products-section";
import { FlashSaleSection } from "@/components/home/flash-sale-section";
import { HeroSection } from "@/components/home/hero-section";
import { ProductShowcaseSection } from "@/components/home/product-showcase-section";
import { WhyChooseSection } from "@/components/home/why-choose-section";
import { KeywordsSection } from "@/components/home/keywords-section";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomeLayout } from "@/lib/store/home-layout.server";
import { buildShowcaseProducts } from "@/lib/store/product-showcase";
import { getShowcaseSpotlightProducts } from "@/lib/supabase/queries/spotlight";
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sections, showcaseSpotlight] = await Promise.all([
    getHomeLayout(),
    getShowcaseSpotlightProducts(),
  ]);

  // `undefined` lets the showcase fall back to its prototype data when the
  // catalog has nothing published yet.
  const builtShowcase = buildShowcaseProducts(showcaseSpotlight);
  const showcaseProducts = builtShowcase.length > 0 ? builtShowcase : undefined;

  return (
    <div>
      <JsonLd data={[buildOrganizationJsonLd(), buildWebsiteJsonLd()]} />
      {sections
        .filter((section) => section.enabled)
        .map((section) => {
          switch (section.type) {
            case "hero":
              return (
                <Fragment key={section.id}>
                  <HeroSection section={section} />
                  <WhyChooseSection />
                </Fragment>
              );
            case "featured_products":
              return (
                <FeaturedProductsSection key={section.id} section={section} />
              );
            case "categories":
              return <CategoriesSection key={section.id} section={section} />;
            case "keywords":
              return (
                <Fragment key={section.id}>
                  <KeywordsSection section={section} />
                  <ProductShowcaseSection products={showcaseProducts} />
                </Fragment>
              );
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
