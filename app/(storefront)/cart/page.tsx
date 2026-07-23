"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStorefrontAuth } from "@/lib/hooks/use-storefront-auth";
import { useCartHasHydrated, useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format-price";
import { PageHero } from "@/components/storefront/page-hero";

export default function CartPage() {
  const { isLoggedIn } = useStorefrontAuth();
  const hasHydrated = useCartHasHydrated();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.subtotal());
  const cartItems = hasHydrated ? items : [];

  if (!hasHydrated || cartItems.length === 0) {
    return (
      <main>
        <PageHero eyebrow="Cart" title="Your cart" />
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <ShoppingBag className="h-9 w-9 text-dust" />
          </div>
          <h2 className="mt-6 text-2xl font-black uppercase tracking-tight text-bone">
            Your cart is empty
          </h2>
          <p className="mt-3 max-w-md text-sm text-dust">
            Looks like you haven&apos;t added any tees yet. Explore our collection
            and pick your favourites.
          </p>
          <Link
            href="/products"
            className="mt-8 rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
          >
            Start shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHero
        eyebrow="Cart"
        title="Your cart"
        actions={
          <button
            type="button"
            onClick={clearCart}
            className="text-sm font-medium text-dust transition hover:text-red-400"
          >
            Clear cart
          </button>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Item list */}
        <ul className="divide-y divide-bone/10 border-y border-bone/10">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-5 py-6">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-28"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 96px, 112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-wide text-dust">
                    No image
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-semibold text-bone hover:text-neon sm:text-base"
                >
                  {item.name}
                </Link>
                <p className="font-mono text-xs text-dust">
                  {item.size} / {item.color}
                </p>
                <p className="font-mono text-sm font-bold text-neon">
                  {formatPrice(item.unitPrice)}
                </p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-xl border border-bone/15">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      className="px-3 py-2 text-bone/70 transition hover:text-bone disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-10 text-center text-sm font-semibold text-bone">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.maxQuantity}
                      className="px-3 py-2 text-bone/70 transition hover:text-bone disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="font-mono text-sm font-bold text-bone">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="rounded-full p-1.5 text-dust transition hover:bg-red-500/10 hover:text-red-400"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Order summary */}
        <div className="h-fit rounded-2xl border border-bone/10 bg-surface p-6">
          <h2 className="mb-5 text-lg font-bold text-bone">
            Order summary
          </h2>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-bone/75">Subtotal</dt>
              <dd className="font-semibold text-bone">
                {formatPrice(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-bone/75">Shipping</dt>
              <dd className="text-dust">Calculated at checkout</dd>
            </div>
          </dl>

          <hr className="my-5 border-bone/10" />

          <div className="mb-6 flex justify-between text-base">
            <span className="font-semibold text-bone">Total</span>
            <span className="font-mono text-xl font-bold text-neon">
              {formatPrice(subtotal)}
            </span>
          </div>

          <Link
            href={isLoggedIn ? "/checkout" : "/login?next=/checkout"}
            className="inline-flex w-full items-center justify-center rounded-full bg-neon px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
          >
            {isLoggedIn ? "Proceed to checkout" : "Sign in to checkout"}
          </Link>

          <Link
            href="/products"
            className="mt-3 inline-flex w-full items-center justify-center text-sm font-medium text-dust hover:text-bone"
          >
            ← Continue shopping
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}
