"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, ShoppingBag } from "lucide-react";
import { useStorefrontAuth } from "@/lib/hooks/use-storefront-auth";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format-price";
import type { ProductVariant } from "@/types";

interface AddToCartSectionProps {
  productId: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  variants: Pick<
    ProductVariant,
    | "id"
    | "size"
    | "color"
    | "stock_quantity"
    | "price_override"
    | "is_active"
  >[];
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function unitPriceFor(
  basePrice: number,
  variant: Pick<ProductVariant, "price_override">
): number {
  return variant.price_override != null
    ? Number(variant.price_override)
    : Number(basePrice);
}

export function AddToCartSection({
  productId,
  slug,
  name,
  basePrice,
  compareAtPrice,
  imageUrl,
  variants,
}: AddToCartSectionProps) {
  const pathname = usePathname();
  const { isLoggedIn, isLoading } = useStorefrontAuth();
  const addItem = useCartStore((s) => s.addItem);

  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.is_active),
    [variants]
  );

  const sizes = useMemo(
    () => uniqueSorted(activeVariants.map((variant) => variant.size)),
    [activeVariants]
  );
  const colors = useMemo(
    () => uniqueSorted(activeVariants.map((variant) => variant.color)),
    [activeVariants]
  );

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(
    () =>
      activeVariants.find(
        (variant) =>
          variant.size === selectedSize && variant.color === selectedColor
      ) ?? null,
    [activeVariants, selectedSize, selectedColor]
  );

  const availableColorsForSize = useMemo(() => {
    const set = new Set(
      activeVariants
        .filter((variant) => variant.size === selectedSize)
        .map((variant) => variant.color)
    );
    return colors.filter((color) => set.has(color));
  }, [activeVariants, selectedSize, colors]);

  const availableSizesForColor = useMemo(() => {
    const set = new Set(
      activeVariants
        .filter((variant) => variant.color === selectedColor)
        .map((variant) => variant.size)
    );
    return sizes.filter((size) => set.has(size));
  }, [activeVariants, selectedColor, sizes]);

  const stockQuantity = selectedVariant?.stock_quantity ?? 0;
  const unitPrice = selectedVariant
    ? unitPriceFor(basePrice, selectedVariant)
    : basePrice;
  const isSoldOut = !selectedVariant || stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;
  const onSale = compareAtPrice != null && compareAtPrice > unitPrice;
  const loginHref = `/login?next=${encodeURIComponent(pathname || `/products/${slug}`)}`;

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    const colorsForSize = activeVariants
      .filter((variant) => variant.size === size)
      .map((variant) => variant.color);
    if (!colorsForSize.includes(selectedColor)) {
      setSelectedColor(colorsForSize[0] ?? "");
    }
    setQuantity(1);
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    const sizesForColor = activeVariants
      .filter((variant) => variant.color === color)
      .map((variant) => variant.size);
    if (!sizesForColor.includes(selectedSize)) {
      setSelectedSize(sizesForColor[0] ?? "");
    }
    setQuantity(1);
  }

  function handleQuantityChange(nextQuantity: number) {
    setQuantity(Math.min(Math.max(1, nextQuantity), Math.max(stockQuantity, 1)));
  }

  function handleAddToCart() {
    if (!isLoggedIn || !selectedVariant || isSoldOut) {
      return;
    }

    addItem({
      productId,
      variantId: selectedVariant.id,
      slug,
      name,
      size: selectedVariant.size,
      color: selectedVariant.color,
      unitPrice,
      imageUrl,
      maxQuantity: stockQuantity,
      quantity,
    });
  }

  if (activeVariants.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-3xl font-bold text-neutral-950">
          {formatPrice(basePrice)}
        </p>
        <p className="text-sm font-semibold text-red-600">
          This product has no sellable variants.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold text-neutral-950">
          {formatPrice(unitPrice)}
        </span>
        {onSale && compareAtPrice != null && (
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

      {sizes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const disabled = !availableSizesForColor.includes(size);
              const selected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSizeSelect(size)}
                  className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Colour
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const disabled = !availableColorsForSize.includes(color);
              const selected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleColorSelect(color)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {isSoldOut ? (
          <p className="text-sm font-semibold text-red-600">
            {selectedVariant ? "Sold out" : "Select size and colour"}
          </p>
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
          {isLoggedIn && (
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
          )}

          {isLoading ? (
            <button
              type="button"
              disabled
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-300 px-6 py-3.5 text-sm font-semibold text-white"
            >
              Loading...
            </button>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to cart
            </button>
          ) : (
            <Link
              href={loginHref}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950"
            >
              <LogIn className="h-4 w-4" />
              Login to add to cart
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
