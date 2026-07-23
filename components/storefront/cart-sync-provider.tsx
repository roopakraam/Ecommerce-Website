"use client";

import { useCartSync } from "@/lib/hooks/use-cart-sync";

/** Mount once in the storefront shell so login modal and page auth both merge carts. */
export function CartSyncProvider() {
  useCartSync();
  return null;
}
