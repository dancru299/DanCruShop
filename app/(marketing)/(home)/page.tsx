import { Fragment, type ReactNode } from "react";

import { BannerGridSection } from "@/components/home/banner-grid-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProductsSection } from "@/components/home/featured-products-section";
import { FlashSaleSection } from "@/components/home/flash-sale-section";
import { HeroSection } from "@/components/home/hero-section";
import { ProductShowcaseSection } from "@/components/home/product-showcase-section";
import { WhyChooseSection } from "@/components/home/why-choose-section";
import { KeywordsSection } from "@/components/home/keywords-section";
import { ScrollReveal } from "@/components/home/scroll-reveal";
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
          // Hero + trust bar sit above the fold — render them instantly, no
          // scroll-reveal (keeps LCP fast). Everything below fades up on scroll.
          if (section.type === "hero") {
            return (
              <Fragment key={section.id}>
                <HeroSection section={section} />
                <WhyChooseSection />
              </Fragment>
            );
          }

          let content: ReactNode = null;

          switch (section.type) {
            case "featured_products":
              content = <FeaturedProductsSection section={section} />;
              break;
            case "categories":
              content = <CategoriesSection section={section} />;
              break;
            case "keywords":
              content = (
                <>
                  <KeywordsSection section={section} />
                  <ProductShowcaseSection products={showcaseProducts} />
                </>
              );
              break;
            case "flash_sale":
              content = <FlashSaleSection section={section} />;
              break;
            case "banner_grid":
              content = <BannerGridSection section={section} />;
              break;
            default:
              return null;
          }

          return <ScrollReveal key={section.id}>{content}</ScrollReveal>;
        })}
    </div>
  );
}
