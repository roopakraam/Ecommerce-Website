"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format-price";
import type { ProductWithImages } from "@/lib/db/products";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: ProductWithImages;
  priority?: boolean;
  index: number;
}

function getPrimaryImage(product: ProductWithImages): string | null {
  const sorted = [...product.product_images].sort(
    (a, b) => a.position - b.position
  );
  return sorted[0]?.url ?? null;
}

export function ProductCard({ product, priority = false, index }: ProductCardProps) {
  const primaryImage = getPrimaryImage(product);

  const isSoldOut = product.stock_quantity === 0;
  const onSale =
    product.compare_at_price != null &&
    product.compare_at_price > product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/products/${product.slug}`} className="group flex flex-col h-full bg-surface border border-bone/10 transition-colors hover:border-neon">
        <div className="relative aspect-[3/4] overflow-hidden bg-ink border-b border-bone/10">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface">
              <span className="font-display text-2xl uppercase tracking-tight text-bone/15">
                BMT
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-dust">
                Photo coming soon
              </span>
            </div>
          )}

          {isSoldOut && (
            <span className="absolute left-3 top-3 z-10 border border-bone/20 bg-ink px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-dust">
              [ Sold out ]
            </span>
          )}
          {onSale && !isSoldOut && (
            <span className="absolute left-3 top-3 z-10 bg-neon px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
              [ Sale ]
            </span>
          )}

          {isSoldOut ? (
            <div className="absolute inset-0 flex items-end justify-center bg-ink/60 p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
              <span className="w-full text-center border-2 border-bone px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-bone">
                Notify When Back
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink via-transparent to-transparent p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
              <span className="w-full text-center bg-neon px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-ink transition-transform hover:scale-[1.02]">
                Quick View
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 justify-between gap-4">
          <h3 className="text-sm font-bold uppercase leading-tight tracking-tight text-bone sm:text-base">
            {product.name}
          </h3>
          <div className="flex items-center justify-between border-t border-bone/10 pt-3">
            <span
              className={`font-mono text-sm font-bold sm:text-base ${
                isSoldOut ? "text-dust line-through" : "text-neon"
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-dust line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export type ProductGridEmptyVariant = "catalog" | "filtered";

interface ProductGridProps {
  products: ProductWithImages[];
  priorityCount?: number;
  emptyVariant?: ProductGridEmptyVariant;
  emptyCategoryName?: string;
}

export function ProductGrid({
  products,
  priorityCount = 0,
  emptyVariant = "catalog",
  emptyCategoryName,
}: ProductGridProps) {
  if (products.length === 0) {
    if (emptyVariant === "filtered") {
      return (
        <EmptyState
          tone="dark"
          title="No products match this filter"
          description={
            emptyCategoryName
              ? `Nothing is listed in “${emptyCategoryName}” right now. Try another collection or view all tees.`
              : "No products match your current filters. Clear filters to see the full catalog."
          }
          actionHref="/products"
          actionLabel="View all tees"
        />
      );
    }

    return (
      <EmptyState
        tone="dark"
        title="No products yet"
        description="New tees are dropping soon. Follow us for graphic prints, oversized fits, and everyday staples."
        actionHref="/"
        actionLabel="Back home"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-px bg-bone/10 border border-bone/10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < priorityCount} index={index} />
      ))}
    </div>
  );
}
