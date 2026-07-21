import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartSection } from "@/components/storefront/add-to-cart-section";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import {
  getAllProductSlugs,
  getPrimaryImage,
  getProductBySlug,
  getSortedImages,
} from "@/lib/db/products";

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
    return { title: "Product not found | BOOK MY TEES" };
  }

  return {
    title: `${product.name} | BOOK MY TEES`,
    description:
      product.description ??
      `Shop ${product.name} at BOOK MY TEES — premium cotton tees with pan-India delivery.`,
  };
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="mb-8 text-sm text-neutral-500">
        <Link href="/products" className="hover:text-neutral-950">
          Shop
        </Link>
        {product.categories && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/products?category=${product.categories.slug}`}
              className="hover:text-neutral-950"
            >
              {product.categories.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-neutral-950">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductImageGallery images={images} productName={product.name} />

        <div className="flex flex-col gap-6">
          {product.categories && (
            <Link
              href={`/products?category=${product.categories.slug}`}
              className="text-sm font-semibold uppercase tracking-widest text-lime-600 hover:text-lime-500"
            >
              {product.categories.name}
            </Link>
          )}

          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            {product.name}
          </h1>

          {product.description && (
            <p className="text-base leading-relaxed text-neutral-600">
              {product.description}
            </p>
          )}

          <AddToCartSection
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            compareAtPrice={product.compare_at_price}
            stockQuantity={product.stock_quantity}
            imageUrl={primaryImage}
          />
        </div>
      </div>
    </main>
  );
}
