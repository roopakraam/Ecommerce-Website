"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format-price";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.subtotal());

  if (items.length === 0) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
          <ShoppingBag className="h-9 w-9 text-neutral-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-neutral-950">
          Your cart is empty
        </h1>
        <p className="mt-3 max-w-md text-sm text-neutral-600">
          Looks like you haven&apos;t added any tees yet. Explore our collection
          and pick your favourites.
        </p>
        <Link
          href="/products"
          className="mt-8 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950"
        >
          Start shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
          Your cart
        </h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm font-medium text-neutral-500 transition hover:text-red-600"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Item list */}
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-5 py-6">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-28 sm:w-28"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    No image
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-semibold text-neutral-950 hover:text-lime-600 sm:text-base"
                >
                  {item.name}
                </Link>
                <p className="text-sm font-bold text-neutral-950">
                  {formatPrice(item.unitPrice)}
                </p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-xl border border-neutral-200">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      className="px-3 py-2 text-neutral-500 transition hover:text-neutral-950 disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-10 text-center text-sm font-semibold text-neutral-950">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.maxQuantity}
                      className="px-3 py-2 text-neutral-500 transition hover:text-neutral-950 disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-neutral-950">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="rounded-full p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
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
        <div className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="mb-5 text-lg font-bold text-neutral-950">
            Order summary
          </h2>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-semibold text-neutral-950">
                {formatPrice(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd className="text-neutral-500">Calculated at checkout</dd>
            </div>
          </dl>

          <hr className="my-5 border-neutral-200" />

          <div className="mb-6 flex justify-between text-base">
            <span className="font-semibold text-neutral-950">Total</span>
            <span className="text-xl font-bold text-neutral-950">
              {formatPrice(subtotal)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950"
          >
            Proceed to checkout
          </Link>

          <Link
            href="/products"
            className="mt-3 inline-flex w-full items-center justify-center text-sm font-medium text-neutral-600 hover:text-neutral-950"
          >
            ← Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
