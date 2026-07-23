import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HeroSection } from "@/components/storefront/hero-section";
import { PromoTicker } from "@/components/storefront/promo-ticker";
import { TrustStrip } from "@/components/storefront/trust-strip";
import { CustomerReviews } from "@/components/storefront/customer-reviews";
import { getFeaturedCategories } from "@/lib/db/categories";
import {
  getFeaturedProducts,
  getPrimaryImage,
} from "@/lib/db/products";
import { getApprovedReviews } from "@/lib/db/reviews";
import { formatPrice } from "@/lib/utils/format-price";
import { buildPageMetadata, SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: SITE_NAME,
  description: SITE_TAGLINE,
  path: "/",
  absoluteTitle: true,
});

const COLLECTION_FILTERS_FALLBACK = [
  "Hoodies",
  "Caps & Bags",
  "Trending",
  "Outerwear",
  "Accessories",
];

const CATEGORY_RAIL_IMAGES = [
  "/images/hero.png",
  "/images/category-1.png",
  "/images/product-1.png",
  "/images/category-2.png",
  "/images/product-2.png",
];

export default async function HomePage() {
  const [categories, products, reviews] = await Promise.all([
    getFeaturedCategories(),
    getFeaturedProducts(),
    getApprovedReviews(6),
  ]);

  const collectionPills =
    categories.length > 0
      ? categories.map((c) => ({ label: c.name, href: `/products?category=${c.slug}` }))
      : COLLECTION_FILTERS_FALLBACK.map((label) => ({ label, href: "/products" }));

  const categoryRailItems = (
    categories.length > 0
      ? categories.map((c) => ({ label: c.name, href: `/products?category=${c.slug}` }))
      : COLLECTION_FILTERS_FALLBACK.map((label) => ({ label, href: "/products" }))
  ).map((item, index) => ({
    ...item,
    image: CATEGORY_RAIL_IMAGES[index % CATEGORY_RAIL_IMAGES.length],
  }));

  return (
    <main className="overflow-hidden bg-bone selection:bg-neon selection:text-ink">
      <HeroSection />
      <PromoTicker />
      <TrustStrip />

      {/* Our Collection */}
      <section id="collection" className="bg-bone py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-4xl uppercase leading-[0.9] tracking-tight text-ink sm:text-5xl">
              Our Collection
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-ink/55 sm:text-base">
              Step into the world of Book My Tees, where every drop tells its
              own story. From understated essentials to bold statement
              prints, our curated collections are built to suit every
              customer&apos;s taste and style.
            </p>
          </div>

          <div className="mb-10 flex flex-wrap gap-2.5">
            <Link
              href="/products"
              className="rounded-full border border-ink bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-bone"
            >
              All
            </Link>
            {collectionPills.slice(0, 5).map((pill) => (
              <Link
                key={pill.label}
                href={pill.href}
                className="rounded-full border border-ink/20 px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-ink/60 transition hover:border-ink hover:text-ink"
              >
                {pill.label}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <HomeProductTile key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category — dark horizontal rail */}
      <section className="border-t border-ink/10 bg-ink py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neon">
                Shop by category
              </p>
              <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tight text-bone sm:text-5xl">
                Find Your Fit
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-bone/20 px-6 py-3 text-xs font-bold uppercase tracking-wide text-bone transition hover:border-neon hover:text-neon"
            >
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory sm:px-6">
          {categoryRailItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative aspect-[3/4] w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-bone/10 sm:w-[260px]"
            >
              <Image
                src={item.image}
                alt={item.label}
                fill
                sizes="260px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
                <span className="font-display text-lg uppercase leading-none tracking-tight text-bone">
                  {item.label}
                </span>
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neon text-ink transition group-hover:bg-bone">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CustomerReviews reviews={reviews} />

      {/* Brand statement */}
      <section id="about" className="border-t border-ink/10 bg-bone relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-[1fr_1.5fr] lg:items-center">
          <p className="relative z-10 max-w-[40ch] border-l-2 border-ink/15 pl-6 text-lg font-medium leading-relaxed text-ink/55">
            At Book My Tees, we offer more than just clothing — we deliver a
            canvas for your individuality. Our thoughtfully designed apparel
            and footwear collections combine style, comfort, and
            craftsmanship in every stitch.
          </p>
          <h2 className="font-display text-left text-[10vw] uppercase leading-[0.85] tracking-tight text-ink lg:text-right lg:text-[6rem]">
            Tees And
            <br />
            Footwear
            <br />
            Collection
          </h2>
        </div>
      </section>

      {/* Closing dark showcase */}
      <section className="border-t border-ink/10 bg-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-bone/10 sm:mx-0 mx-auto">
            <Image
              src="/images/category-1.png"
              alt="Book My Tees lifestyle"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neon">
              About the brand
            </p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.9] tracking-tight text-bone sm:text-6xl">
              Clothing
              <br />
              Collection
            </h2>
            <p className="mt-6 max-w-[42ch] text-base leading-relaxed text-dust">
              Every tee is printed in small batches on heavyweight 240 GSM
              cotton that survives the wash. Checked by hand in Bengaluru
              before it ships across India — no cracked graphics, no
              shapeless collars, no shortcuts.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-neon px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
            >
              Shop The Collection
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeProductTile({
  product,
}: {
  product: Awaited<ReturnType<typeof getFeaturedProducts>>[number];
}) {
  const image = getPrimaryImage(product);
  const isSoldOut = product.stock_quantity === 0;
  const onSale =
    product.compare_at_price != null && product.compare_at_price > product.price;

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-bone">
            <span className="font-display text-xl uppercase tracking-tight text-ink/15">
              BMT
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">
              Photo coming soon
            </span>
          </div>
        )}

        {onSale && !isSoldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-bone">
            Sale
          </span>
        )}
        {isSoldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-ink/60">
            Sold out
          </span>
        )}

        <div className="absolute inset-0 flex items-end justify-center bg-ink/0 p-3 opacity-0 transition-all duration-300 group-hover:bg-ink/10 group-hover:opacity-100">
          <span className="w-full rounded-full bg-ink py-2.5 text-center text-xs font-bold uppercase tracking-wide text-bone">
            View Product
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-ink">
          {product.name}
        </h3>
        <span className="whitespace-nowrap font-mono text-sm font-bold text-ink">
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  );
}
