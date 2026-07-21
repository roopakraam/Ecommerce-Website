import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format-price";
import type { ProductWithImages } from "@/lib/db/products";

interface ProductCardProps {
  product: ProductWithImages;
}

function getPrimaryImage(product: ProductWithImages): string | null {
  const sorted = [...product.product_images].sort(
    (a, b) => a.position - b.position
  );
  return sorted[0]?.url ?? null;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getPrimaryImage(product);
  const isSoldOut = product.stock_quantity === 0;
  const onSale =
    product.compare_at_price != null &&
    product.compare_at_price > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-neutral-950 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-100 text-sm font-medium text-neutral-400">
            Photo coming soon
          </div>
        )}
        {isSoldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}
        {onSale && !isSoldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-950">
            Sale
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-950 sm:text-base">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center gap-2">
          <span className="text-sm font-bold text-neutral-950 sm:text-base">
            {formatPrice(product.price)}
          </span>
          {onSale && (
            <span className="text-sm text-neutral-400 line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

interface ProductGridProps {
  products: ProductWithImages[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center text-sm text-neutral-500">
        New tees are dropping soon. Follow us for graphic prints, oversized fits,
        and everyday staples.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
