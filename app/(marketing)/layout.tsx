import { FloatingContact } from "@/components/shared/floating-contact";
import { SideRails } from "@/components/shared/side-rails";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { SocialProof } from "@/components/shared/social-proof";
import { getPublishedProducts } from "@/lib/supabase/queries/products";
import { getStoreSettings } from "@/lib/store/settings";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ contact, promo }, products] = await Promise.all([
    getStoreSettings(),
    getPublishedProducts(12),
  ]);

  const socialProofProducts = products.map((product) => ({
    title: product.title,
    slug: product.slug,
    thumbnailUrl: product.thumbnail_url,
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingContact channels={contact} />
      <SideRails promo={promo} />
      <SocialProof products={socialProofProducts} />
    </div>
  );
}
