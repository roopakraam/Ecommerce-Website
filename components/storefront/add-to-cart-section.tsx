"use client";

import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
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
    if (!selectedVariant || isSoldOut) {
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
        <p className="text-3xl font-black text-bone">
          {formatPrice(basePrice)}
        </p>
        <p className="text-sm font-semibold text-red-400">
          This product has no sellable variants.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-3xl font-bold text-neon">
          {formatPrice(unitPrice)}
        </span>
        {onSale && compareAtPrice != null && (
          <span className="font-mono text-lg text-dust line-through">
            {formatPrice(compareAtPrice)}
          </span>
        )}
        {onSale && (
          <span className="rounded-full bg-neon px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wide text-ink">
            On sale
          </span>
        )}
      </div>

      {sizes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-dust">
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
                      ? "border-bone bg-bone text-ink"
                      : "border-bone/20 text-bone hover:border-bone/50"
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
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-dust">
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
                      ? "border-bone bg-bone text-ink"
                      : "border-bone/20 text-bone hover:border-bone/50"
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
          <p className="text-sm font-semibold text-red-400">
            {selectedVariant ? "Sold out" : "Select size and colour"}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-emerald-400">In stock</p>
            {isLowStock && (
              <p className="text-sm text-amber-400">
                Only {stockQuantity} left — order soon
              </p>
            )}
          </>
        )}
      </div>

      {!isSoldOut && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center rounded-xl border border-bone/20">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="px-4 py-3 text-lg font-medium text-bone/70 transition hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-12 text-center text-sm font-semibold text-bone">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= stockQuantity}
              className="px-4 py-3 text-lg font-medium text-bone/70 transition hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neon px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </button>
        </div>
      )}
    </div>
  );
}
