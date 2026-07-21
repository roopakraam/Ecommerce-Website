import { CategoryGrid } from "@/components/storefront/category-grid";
import { HeroSection } from "@/components/storefront/hero-section";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getFeaturedCategories } from "@/lib/db/categories";
import { getFeaturedProducts } from "@/lib/db/products";
import { buildPageMetadata, SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: SITE_NAME,
  description: SITE_TAGLINE,
  path: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getFeaturedCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <main>
        <HeroSection />

        <section
          id="featured-categories"
          className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mb-8 flex flex-col gap-2 sm:mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-lime-600">
              Collections
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Shop by vibe
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
              From statement graphic tees to clean everyday basics — pick a
              collection and find your fit in sizes and colours that move with you.
            </p>
          </div>
          <CategoryGrid categories={categories} />
        </section>

        <section
          id="featured-products"
          className="border-t border-neutral-200 bg-neutral-50"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-8 flex flex-col gap-2 sm:mb-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-lime-600">
                New &amp; notable
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                Featured tees
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
                Fresh prints and restocked favourites — limited quantities on select
                styles, so grab yours before they&apos;re gone.
              </p>
            </div>
            <ProductGrid products={products} priorityCount={4} />
          </div>
        </section>
    </main>
  );
}
