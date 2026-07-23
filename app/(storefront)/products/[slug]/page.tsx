import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartSection } from "@/components/storefront/add-to-cart-section";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { ProductJsonLd } from "@/components/storefront/product-json-ld";
import { ProductReviewsSection } from "@/components/storefront/product-reviews-section";
import {
  getAllProductSlugs,
  getPrimaryImage,
  getProductBySlug,
  getSortedImages,
} from "@/lib/db/products";
import { getApprovedReviewsForProduct } from "@/lib/db/reviews";
import { buildPageMetadata } from "@/lib/seo/site";

export const revalidate = 60;

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return buildPageMetadata({
      title: "Product not found",
      description: "This product is unavailable or no longer listed.",
      path: `/products/${params.slug}`,
      noIndex: true,
    });
  }

  const primaryImage = getPrimaryImage(product);

  return buildPageMetadata({
    title: product.name,
    description:
      product.description ??
      `Shop ${product.name} at BOOK MY TEES — premium cotton tees with pan-India delivery.`,
    path: `/products/${product.slug}`,
    image: primaryImage,
  });
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const images = getSortedImages(product);
  const primaryImage = getPrimaryImage(product);
  const reviews = await getApprovedReviewsForProduct(product.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <ProductJsonLd product={product} images={images} />

      <nav className="mb-8 font-mono text-xs text-dust">
        <Link href="/products" className="hover:text-bone">
          Shop
        </Link>
        {product.categories && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/products?category=${product.categories.slug}`}
              className="hover:text-bone"
            >
              {product.categories.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-bone">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductImageGallery images={images} productName={product.name} />

        <div className="flex flex-col gap-6">
          {product.categories && (
            <Link
              href={`/products?category=${product.categories.slug}`}
              className="font-mono text-xs font-semibold uppercase tracking-widest text-neon hover:text-bone"
            >
              {product.categories.name}
            </Link>
          )}

          <h1 className="text-3xl font-black uppercase tracking-tight text-bone sm:text-4xl">
            {product.name}
          </h1>

          {product.description && (
            <p className="text-base leading-relaxed text-dust">
              {product.description}
            </p>
          )}

          <AddToCartSection
            productId={product.id}
            slug={product.slug}
            name={product.name}
            basePrice={Number(product.price)}
            compareAtPrice={
              product.compare_at_price != null
                ? Number(product.compare_at_price)
                : null
            }
            imageUrl={primaryImage}
            variants={product.product_variants}
          />
        </div>
      </div>

      <ProductReviewsSection
        productId={product.id}
        productSlug={product.slug}
        reviews={reviews}
      />
    </main>
  );
}
