"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format-price";

interface AddToCartSectionProps {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  imageUrl: string | null;
}

export function AddToCartSection({
  productId,
  slug,
  name,
  price,
  compareAtPrice,
  stockQuantity,
  imageUrl,
}: AddToCartSectionProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const isSoldOut = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;
  const onSale = compareAtPrice != null && compareAtPrice > price;

  function handleQuantityChange(nextQuantity: number) {
    setQuantity(Math.min(Math.max(1, nextQuantity), stockQuantity));
  }

  function handleAddToCart() {
    addItem({
      productId,
      slug,
      name,
      unitPrice: price,
      imageUrl,
      maxQuantity: stockQuantity,
      quantity,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold text-neutral-950">
          {formatPrice(price)}
        </span>
        {onSale && (
          <span className="text-lg text-neutral-400 line-through">
            {formatPrice(compareAtPrice)}
          </span>
        )}
        {onSale && (
          <span className="rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-950">
            On sale
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {isSoldOut ? (
          <p className="text-sm font-semibold text-red-600">Sold out</p>
        ) : (
          <>
            <p className="text-sm font-medium text-emerald-700">In stock</p>
            {isLowStock && (
              <p className="text-sm text-amber-700">
                Only {stockQuantity} left — order soon
              </p>
            )}
          </>
        )}
      </div>

      {!isSoldOut && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center rounded-xl border border-neutral-300">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="px-4 py-3 text-lg font-medium text-neutral-600 transition hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-12 text-center text-sm font-semibold text-neutral-950">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= stockQuantity}
              className="px-4 py-3 text-lg font-medium text-neutral-600 transition hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </button>
        </div>
      )}
    </div>
  );
}
