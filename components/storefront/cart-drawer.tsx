"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useStorefrontAuth } from "@/lib/hooks/use-storefront-auth";
import { useCartHasHydrated, useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format-price";

export function CartDrawer() {
  const { isLoggedIn } = useStorefrontAuth();
  const hasHydrated = useCartHasHydrated();
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const subtotal = useCartStore((s) => s.subtotal());
  const totalItems = useCartStore((s) => s.totalItems());
  const showCount = hasHydrated && totalItems > 0;
  const cartItems = hasHydrated ? items : [];
  const isEmpty = cartItems.length === 0;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-ink shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bone/10 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-bone">
            <ShoppingBag className="h-5 w-5" />
            Cart
            {showCount && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neon px-1.5 font-mono text-xs font-bold text-ink">
                {totalItems}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-1.5 text-bone/60 transition hover:bg-surface hover:text-bone"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
              <ShoppingBag className="h-7 w-7 text-dust" />
            </div>
            <p className="text-base font-semibold text-bone">
              Your cart is empty
            </p>
            <p className="max-w-xs text-sm text-dust">
              Browse our collection and add your favourite tees to get started.
            </p>
            <Link
              href="/products"
              onClick={close}
              className="mt-2 rounded-full bg-neon px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
            >
              Shop now
            </Link>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-bone/10 overflow-y-auto px-5">
            {cartItems.map((item) => (
              <li key={item.variantId} className="flex gap-4 py-5">
                <Link
                  href={`/products/${item.slug}`}
                  onClick={close}
                  className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-wide text-dust">
                      No image
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={close}
                        className="text-sm font-semibold text-bone hover:text-neon"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-dust">
                        {item.size} / {item.color}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-neon">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-bone/15">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="px-2.5 py-1.5 text-bone/70 transition hover:text-neon disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-xs font-semibold text-bone">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.maxQuantity}
                        className="px-2.5 py-1.5 text-bone/70 transition hover:text-neon disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

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
              </li>
            ))}
          </ul>
        )}

        {cartItems.length > 0 && (
          <div className="border-t border-bone/10 px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-bone/70">
                Subtotal
              </span>
              <span className="text-lg font-bold text-bone">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mb-4 font-mono text-xs text-dust">
              Shipping calculated at checkout
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/cart"
                onClick={close}
                className="inline-flex items-center justify-center rounded-full border border-bone/20 px-6 py-3 text-sm font-semibold text-bone transition hover:border-neon hover:text-neon"
              >
                View cart
              </Link>
              {isLoggedIn ? (
                <Link
                  href="/checkout"
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
                >
                  Checkout
                </Link>
              ) : (
                <Link
                  href="/login?next=/checkout"
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
                >
                  Sign in to checkout
                </Link>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
